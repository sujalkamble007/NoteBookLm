import { Router } from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  updateUserProfile,
  changePassword,
  getUserStats
} from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

// Public routes
router.route('/register').post(registerUser);  //done
router.route('/login').post(loginUser); //done  
router.route('/refresh-token').post(refreshAccessToken);

// Protected routes
router.route('/logout').post(protect, logoutUser);    //done
router.route('/me').get(protect, getCurrentUser);     //done
router.route('/update-profile').patch(protect, updateUserProfile);
router.route('/change-password').patch(protect, changePassword);
router.route('/stats').get(protect, getUserStats);    //done

// Google OAuth routes (will be implemented with Passport.js)
// router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
// router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), googleCallback);

export default router;