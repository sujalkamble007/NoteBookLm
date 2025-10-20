import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

export const protect = asyncHandler(async (req, res, next) => {
  console.log('🔐 Auth middleware hit for:', req.method, req.path);
  console.log('📡 Headers:', req.headers.authorization ? 'Bearer token present' : 'No bearer token');
  console.log('🍪 Cookies:', req.cookies?.accessToken ? 'Cookie token present' : 'No cookie token');
  
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      console.log('✅ Token extracted from Bearer header');
    } catch (error) {
      console.log('❌ Error extracting Bearer token:', error);
      throw new ApiError(401, 'Invalid authorization header format');
    }
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
    console.log('✅ Token extracted from cookies');
  }

  if (!token) {
    console.log('❌ No token found');
    throw new ApiError(401, 'Not authorized, no token provided');
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    
    // Handle both _id and userId in JWT payload (for compatibility with OAuth)
    const userId = decoded._id || decoded.userId;
    
    if (!userId) {
      throw new ApiError(401, 'Invalid token payload');
    }
    
    // Get user from token and add to request
    const user = await User.findById(userId).select('-password -refreshTokens');
    
    if (!user) {
      throw new ApiError(401, 'Token invalid - user not found');
    }

    if (!user.isActive) {
      throw new ApiError(401, 'Account is deactivated');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new ApiError(401, 'Not authorized, token invalid');
    } else if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Not authorized, token expired');
    } else {
      throw error;
    }
  }
});

export const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in Authorization header or cookies
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      
      // Handle both _id and userId in JWT payload
      const userId = decoded._id || decoded.userId;
      
      if (userId) {
        const user = await User.findById(userId).select('-password -refreshTokens');
        
        if (user && user.isActive) {
          req.user = user;
        }
      }
    } catch (error) {
      // Ignore errors in optional auth
      console.warn('Optional auth failed:', error.message);
    }
  }

  next();
});

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }

    if (!roles.includes(req.user.plan)) {
      throw new ApiError(403, 'You do not have permission to perform this action');
    }

    next();
  };
};

export const checkSubscription = (requiredPlan = 'premium') => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }

    const planHierarchy = { free: 1, premium: 2, enterprise: 3 };
    const userPlanLevel = planHierarchy[req.user.plan] || 0;
    const requiredPlanLevel = planHierarchy[requiredPlan] || 0;

    if (userPlanLevel < requiredPlanLevel) {
      throw new ApiError(403, `This feature requires ${requiredPlan} subscription`);
    }

    // Check if premium/enterprise plan is expired
    if (req.user.plan !== 'free' && req.user.planExpiry && req.user.planExpiry < new Date()) {
      throw new ApiError(403, 'Your subscription has expired');
    }

    next();
  });
};

export const rateLimitByUser = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const userId = req.user._id.toString();
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!requests.has(userId)) {
      requests.set(userId, []);
    }

    const userRequests = requests.get(userId);
    
    // Remove expired requests
    const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
    requests.set(userId, validRequests);

    if (validRequests.length >= maxRequests) {
      const resetTime = Math.ceil((validRequests[0] + windowMs) / 1000);
      res.set({
        'X-RateLimit-Limit': maxRequests,
        'X-RateLimit-Remaining': 0,
        'X-RateLimit-Reset': resetTime
      });
      
      throw new ApiError(429, 'Too many requests, please try again later');
    }

    // Add current request
    validRequests.push(now);
    requests.set(userId, validRequests);

    res.set({
      'X-RateLimit-Limit': maxRequests,
      'X-RateLimit-Remaining': maxRequests - validRequests.length,
      'X-RateLimit-Reset': Math.ceil((now + windowMs) / 1000)
    });

    next();
  };
};