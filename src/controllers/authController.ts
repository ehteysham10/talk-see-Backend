import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authService } from '../services/authService.js';
import { tokenService } from '../services/tokenService.js';
import { AuthRequest } from '../middlewares/authMiddleware.js';

export const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, confirmPassword } = req.body;
  if (!name || !email || !password || !confirmPassword) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  if (password !== confirmPassword) {
    res.status(400);
    throw new Error('Passwords do not match');
  }

  const nameRegex = /^[a-zA-Z\s]{3,15}$/;
  if (!nameRegex.test(name)) {
    res.status(400);
    throw new Error('Name must be between 3 and 15 characters, containing only letters and spaces');
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    res.status(400);
    throw new Error('Password must be at least 8 characters long, containing 1 uppercase, 1 lowercase, 1 number, and 1 special character');
  }

  await authService.register(name, email, password);
  
  res.status(201).json({
    message: 'Registration successful! Please check your email to verify your account.',
  });
});

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  const user = await authService.login(email, password);
  const token = tokenService.generateToken({ userId: user._id.toString() });
  tokenService.setCookie(res, token);

  res.status(200).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    isVerified: user.isVerified,
    token,
  });
});

export const googleLoginUser = asyncHandler(async (req: Request, res: Response) => {
  const { idToken } = req.body;
  if (!idToken) {
    res.status(400);
    throw new Error('Please provide Google ID token');
  }

  const user = await authService.googleLogin(idToken);
  const token = tokenService.generateToken({ userId: user._id.toString() });
  tokenService.setCookie(res, token);

  res.status(200).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    isVerified: user.isVerified,
    token,
  });
});

export const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  tokenService.clearCookie(res);
  res.status(200).json({ message: 'Logged out successfully' });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    res.status(400);
    throw new Error('Please provide an email');
  }

  await authService.forgotPassword(email);
  res.status(200).json({ message: 'OTP sent to email successfully' });
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.params;
  if (!token) {
    res.status(400);
    throw new Error('Verification token is missing');
  }

  await authService.verifyEmail(token);
  
  // Redirect to frontend login with a success parameter
  const frontendUrl = process.env.FRONTEND_URL || 'https://talkandsee.vercel.app';
  res.redirect(`${frontendUrl}/login?verified=true`);
});

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    res.status(400);
    throw new Error('Please provide email and otp');
  }

  const resetToken = await authService.verifyOtp(email, otp);
  res.status(200).json({ resetToken, message: 'OTP verified successfully' });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { resetToken, newPassword, confirmNewPassword } = req.body;
  if (!resetToken || !newPassword || !confirmNewPassword) {
    res.status(400);
    throw new Error('Please provide resetToken, newPassword, and confirmNewPassword');
  }

  if (newPassword !== confirmNewPassword) {
    res.status(400);
    throw new Error('Passwords do not match');
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    res.status(400);
    throw new Error('Password must be at least 8 characters long, containing 1 uppercase, 1 lowercase, 1 number, and 1 special character');
  }

  await authService.resetPassword(resetToken, newPassword);
  res.status(200).json({ message: 'Password has been reset successfully' });
});

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401);
    throw new Error('Not authorized');
  }
  res.status(200).json(req.user);
});
