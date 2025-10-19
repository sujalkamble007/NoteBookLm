import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const generateTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Save refresh token to database
    user.refreshTokens.push({
      token: refreshToken,
      createdAt: new Date()
    });
    
    // Keep only last 5 refresh tokens
    if (user.refreshTokens.length > 5) {
      user.refreshTokens = user.refreshTokens.slice(-5);
    }
    
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
};

const setCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

// Register user
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Validation
  if ([name, email, password].some(field => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  // Check if user already exists
  const existedUser = await User.findOne({ email });
  if (existedUser) {
    throw new ApiError(409, "User with email already exists");
  }

  // Create user
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    provider: 'local'
  });

  // Generate tokens
  const { accessToken, refreshToken } = await generateTokens(user._id);

  // Get user without sensitive data
  const createdUser = await User.findById(user._id).select(
    "-password -refreshTokens"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .cookie("accessToken", accessToken, setCookieOptions)
    .cookie("refreshToken", refreshToken, setCookieOptions)
    .json(
      new ApiResponse(
        200,
        { user: createdUser, accessToken, refreshToken },
        "User registered successfully"
      )
    );
});

// Login user
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  if (user.provider !== 'local') {
    throw new ApiError(400, `Please use ${user.provider} to login`);
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  if (!user.isActive) {
    throw new ApiError(401, "Account is deactivated");
  }

  const { accessToken, refreshToken } = await generateTokens(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshTokens"
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, setCookieOptions)
    .cookie("refreshToken", refreshToken, setCookieOptions)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

// Logout user
export const logoutUser = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

  if (refreshToken) {
    // Remove the specific refresh token
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $pull: {
          refreshTokens: { token: refreshToken }
        }
      },
      { new: true }
    );
  }

  return res
    .status(200)
    .clearCookie("accessToken", setCookieOptions)
    .clearCookie("refreshToken", setCookieOptions)
    .json(new ApiResponse(200, {}, "User logged out"));
});

// Refresh access token
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.JWT_REFRESH_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    // Check if refresh token exists in user's tokens
    const tokenExists = user.refreshTokens.some(
      tokenObj => tokenObj.token === incomingRefreshToken
    );

    if (!tokenExists) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(user._id);

    // Remove old refresh token
    user.refreshTokens = user.refreshTokens.filter(
      tokenObj => tokenObj.token !== incomingRefreshToken
    );
    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .cookie("accessToken", accessToken, setCookieOptions)
      .cookie("refreshToken", newRefreshToken, setCookieOptions)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

// Get current user
export const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

// Update user profile
export const updateUserProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;

  if (!name && !email) {
    throw new ApiError(400, "At least one field is required");
  }

  const updateFields = {};
  if (name) updateFields.name = name.trim();
  if (email) {
    // Check if email is already taken
    const existingUser = await User.findOne({ 
      email: email.toLowerCase().trim(),
      _id: { $ne: req.user._id }
    });
    
    if (existingUser) {
      throw new ApiError(409, "Email already exists");
    }
    
    updateFields.email = email.toLowerCase().trim();
    updateFields.isEmailVerified = false; // Reset email verification
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: updateFields },
    { new: true }
  ).select("-password -refreshTokens");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

// Change password
export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Both old and new passwords are required");
  }

  const user = await User.findById(req.user?._id).select("+password");

  if (user.provider !== 'local') {
    throw new ApiError(400, "Cannot change password for social login accounts");
  }

  const isPasswordCorrect = await user.comparePassword(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

// Get user statistics
export const getUserStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // This would typically involve aggregation queries
  // For now, returning basic stats from user model
  const user = await User.findById(userId).select('totalNotebooks totalDocuments plan createdAt');

  const stats = {
    totalNotebooks: user.totalNotebooks || 0,
    totalDocuments: user.totalDocuments || 0,
    plan: user.plan,
    memberSince: user.createdAt,
    // Add more stats as needed
  };

  return res
    .status(200)
    .json(new ApiResponse(200, stats, "User statistics fetched successfully"));
});