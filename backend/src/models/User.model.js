import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  avatar: {
    type: String,
    default: null
  },
  // OAuth fields
  googleId: {
    type: String,
    sparse: true
  },
  provider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },

  // Subscription/Plan info
  plan: {
    type: String,
    enum: ['free', 'premium', 'enterprise'],
    default: 'free'
  },
  planExpiry: {
    type: Date,
    default: null
  },
  // Refresh token for JWT
  refreshTokens: [{
    token: String,
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 604800 // 7 days
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  collection: 'users'
});



// Index for better query performance
userSchema.index({ email: 1, googleId: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  if (this.password) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to generate JWT access token
userSchema.methods.generateAccessToken = function() {
  return jwt.sign(
    { 
      _id: this._id,
      email: this.email,
      name: this.name 
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
  );
};

// Instance method to generate JWT refresh token
userSchema.methods.generateRefreshToken = function() {
  return jwt.sign(
    { _id: this._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
  );
};

// Static method to find user by email or googleId
userSchema.statics.findByEmailOrGoogle = function(email, googleId) {
  const query = { email };
  if (googleId) {
    query.$or = [{ email }, { googleId }];
  }
  return this.findOne(query);
};

export default mongoose.model('User', userSchema);