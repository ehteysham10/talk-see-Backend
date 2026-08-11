import nodemailer from 'nodemailer';
import dns from 'dns';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

// Node 18+ prefers IPv6 by default, which causes ENETUNREACH on environments without IPv6 (like Render).
// This forces DNS resolution to prioritize IPv4.
dns.setDefaultResultOrder('ipv4first');

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST || 'smtp.gmail.com',
  port: 465,
  secure: true,
  family: 4, // Force IPv4 to fix Render ENETUNREACH IPv6 issue
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export const emailService = {
  sendVerificationEmail: async (to: string, name: string, verificationUrl: string) => {
    try {
      const mailOptions = {
        from: `"Talk&See App" <${env.SMTP_USER}>`,
        to,
        subject: 'Talk&See - Verify Your Account',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background-color: #111827; border-radius: 12px; color: #f9fafb;">
            <h2 style="color: #6366f1; text-align: center; font-size: 28px; margin-bottom: 20px;">Welcome to Talk&See!</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #d1d5db;">Hi ${name},</p>
            <p style="font-size: 16px; line-height: 1.6; color: #d1d5db;">Thank you for registering. Please click the button below to verify your email address and activate your account.</p>
            <div style="text-align: center; margin: 35px 0;">
              <a href="${verificationUrl}" style="background-color: #4f46e5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Verify Account</a>
            </div>
            <p style="font-size: 14px; color: #9ca3af;">Or copy and paste this link into your browser:</p>
            <p style="font-size: 12px; color: #6b7280; word-break: break-all;">${verificationUrl}</p>
            <hr style="border-color: #374151; margin-top: 30px; margin-bottom: 20px;">
            <p style="font-size: 12px; color: #6b7280; text-align: center;">If you didn't create an account, you can safely ignore this email.</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      logger.info(`Verification email sent to ${to}`);
    } catch (error) {
      logger.error('Error sending verification email:', error);
      throw new Error('Could not send verification email. Please try again later.');
    }
  },

  sendPasswordResetOtp: async (to: string, otp: string) => {
    try {
      const mailOptions = {
        from: `"Talk&See App" <${env.EMAIL_USER}>`,
        to,
        subject: 'Talk&See - Password Reset OTP',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #4F46E5; text-align: center;">Talk&See Password Reset</h2>
            <p>You requested to reset your password. Use the OTP below to set a new password. This OTP is valid for 10 minutes.</p>
            <div style="text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333; padding: 10px 20px; background-color: #f3f4f6; border-radius: 8px;">${otp}</span>
            </div>
            <p>If you didn't request this, you can safely ignore this email.</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      logger.info(`Password reset OTP sent to ${to}`);
    } catch (error) {
      logger.error('Error sending OTP email:', error);
      throw new Error('Could not send OTP email. Please try again later.');
    }
  },
};
