import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.model.js';
import { ApiError } from '../utils/ApiError.js';

// Serialize user for the session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password -refreshTokens');
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/v1/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists with this Google ID
    let user = await User.findOne({ googleId: profile.id });

    if (user) {
      // User exists with Google ID, return user
      return done(null, user);
    }

    // Check if user exists with the same email (local account)
    user = await User.findOne({ email: profile.emails[0].value });

    if (user) {
      // User exists with email but no Google ID, link accounts
      user.googleId = profile.id;
      user.provider = 'google';
      user.isEmailVerified = true; // Google accounts are pre-verified
      
      // If no avatar is set, use Google avatar
      if (!user.avatar && profile.photos && profile.photos.length > 0) {
        user.avatar = profile.photos[0].value;
      }

      await user.save();
      return done(null, user);
    }

    // Create new user with Google account
    user = await User.create({
      name: profile.displayName || profile.name?.givenName || 'Google User',
      email: profile.emails[0].value,
      googleId: profile.id,
      provider: 'google',
      avatar: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null,
      isEmailVerified: true, // Google accounts are pre-verified
      isActive: true
    });

    return done(null, user);
  } catch (error) {
    console.error('Google OAuth Strategy Error:', error);
    return done(error, null);
  }
}));

export default passport;