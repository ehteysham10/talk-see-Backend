import express from 'express';
import { registerUser, loginUser, googleLoginUser, logoutUser, getMe, forgotPassword, verifyOtp, resetPassword, verifyEmail } from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleLoginUser);
router.post('/logout', logoutUser);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);
router.get('/verify-email/:token', verifyEmail);
router.get('/me', protect, getMe);

export default router;
