import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError.js';
import { User } from '../models/User.js';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env.js';
import { emailService } from './emailService.js';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export const authService = {
  register: async (name: string, email: string, passwordPlain: string) => {
    const userExists = await User.findOne({ $or: [{ email }, { name }] });
    if (userExists) {
      throw new AppError('User already exists', 400);
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(passwordPlain, salt);

    const user = await User.create({
      name,
      email,
      passwordHash,
      isVerified: false,
    });
    
    // Generate verification token and email
    const verificationToken = jwt.sign({ userId: user._id, purpose: 'verify_email' }, env.JWT_SECRET, { expiresIn: '12h' });
    const verificationUrl = `${env.BACKEND_URL}/api/v1/auth/verify-email/${verificationToken}`;
    
    await emailService.sendVerificationEmail(user.email, user.name, verificationUrl);

    return user;
  },

  verifyEmail: async (token: string) => {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string, purpose: string };
      if (decoded.purpose !== 'verify_email') {
        throw new AppError('Invalid verification link.', 400);
      }

      const user = await User.findById(decoded.userId);
      if (!user) throw new AppError('User not found', 404);
      if (user.isVerified) throw new AppError('Account is already verified', 400);

      user.isVerified = true;
      await user.save();
      
      return true;
    } catch (error) {
      // Re-throw AppErrors as-is, only wrap JWT errors
      if (error instanceof AppError) throw error;
      throw new AppError('Invalid or expired verification link.', 400);
    }
  },

  forgotPassword: async (email: string) => {
    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('User not found with this email', 404);
    }

    if (user.resetPasswordExpires && user.resetPasswordExpires > new Date()) {
      throw new AppError('Please wait 5 minutes before requesting another OTP.', 429);
    }

    // Generate 5 digit OTP
    const otp = Math.floor(10000 + Math.random() * 90000).toString();
    
    // Valid for 5 minutes
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 5);

    await User.updateOne(
      { email },
      {
        $set: {
          resetPasswordOtp: otp,
          resetPasswordExpires: expires,
        },
      }
    );

    await emailService.sendPasswordResetOtp(email, otp);
    return true;
  },

  verifyOtp: async (email: string, otp: string) => {
    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!user.resetPasswordOtp || user.resetPasswordOtp !== otp) {
      throw new AppError('Invalid OTP', 400);
    }

    if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      throw new AppError('OTP has expired. Please request a new one.', 400);
    }

    // Generate a secure reset token valid for 15 minutes
    const resetToken = jwt.sign({ userId: user._id, purpose: 'reset_password' }, env.JWT_SECRET, { expiresIn: '15m' });

    // Clear OTP fields
    await User.updateOne(
      { email },
      {
        $unset: { resetPasswordOtp: 1, resetPasswordExpires: 1 },
      }
    );

    return resetToken;
  },

  resetPassword: async (resetToken: string, newPasswordPlain: string) => {
    try {
      const decoded = jwt.verify(resetToken, env.JWT_SECRET) as { userId: string, purpose: string };
      if (decoded.purpose !== 'reset_password') {
        throw new AppError('Invalid reset token.', 400);
      }

      const user = await User.findById(decoded.userId);
      if (!user) throw new AppError('User not found', 404);

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(newPasswordPlain, salt);

      await User.updateOne(
        { _id: user._id },
        {
          $set: { passwordHash },
        }
      );

      return user;
    } catch (error) {
      // Re-throw AppErrors as-is, only wrap JWT errors
      if (error instanceof AppError) throw error;
      throw new AppError('Invalid or expired reset token. Please request a new OTP.', 400);
    }
  },

  login: async (email: string, passwordPlain: string) => {
    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.isVerified) {
      throw new AppError('Please verify your email address to continue', 403);
    }

    const isMatch = await bcrypt.compare(passwordPlain, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    return user;
  },

  googleLogin: async (idToken: string) => {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new AppError('Invalid Google token', 401);
    }

    const { email, name, picture } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      // Create a user without a password since they use Google Auth
      // We generate a random password hash for security constraints
      const salt = await bcrypt.genSalt(10);
      const randomPassword = Math.random().toString(36).slice(-8);
      const passwordHash = await bcrypt.hash(randomPassword, salt);

      user = await User.create({
        name: name || email.split('@')[0],
        email,
        passwordHash,
        avatar: picture || '',
        isVerified: true,
      });
    }

    return user;
  },
};
