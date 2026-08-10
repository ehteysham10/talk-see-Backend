# Talk&See Backend

A production-ready REST API and WebSocket server for the **Talk&See** real-time communication platform.

## Tech Stack

- **Runtime**: Node.js with TypeScript (ESM)
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Real-Time**: Socket.io (WebRTC Signaling)
- **Auth**: JWT (httpOnly cookies) + Google OAuth
- **Email**: Nodemailer (Gmail SMTP)

## Features

- ✅ JWT Authentication with secure httpOnly cookies
- ✅ Google OAuth login
- ✅ Email verification on registration
- ✅ Two-step forgot/reset password with OTP
- ✅ Avatar upload (1MB limit, images only)
- ✅ Real-time chat via Socket.io
- ✅ WebRTC signaling for voice/video calls
- ✅ NoSQL injection protection
- ✅ Global rate limiting
- ✅ Centralized error handling

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FRONTEND_URL=https://your-frontend.vercel.app
BACKEND_URL=http://localhost:5000
```

## Getting Started

```bash
npm install
npm run dev
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/register` | Public | Register new user |
| POST | `/api/v1/auth/login` | Public | Login |
| POST | `/api/v1/auth/logout` | Public | Logout |
| GET | `/api/v1/auth/me` | 🔒 | Get current user |
| GET | `/api/v1/auth/verify-email/:token` | Public | Verify email |
| POST | `/api/v1/auth/forgot-password` | Public | Request OTP |
| POST | `/api/v1/auth/verify-otp` | Public | Verify OTP → get resetToken |
| POST | `/api/v1/auth/reset-password` | Public | Reset password |
| GET | `/api/v1/users?search=` | 🔒 | Search users |
| PUT | `/api/v1/users/profile` | 🔒 | Update name/avatar |
