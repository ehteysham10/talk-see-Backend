import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { env } from '../config/env.js';

export interface TokenPayload {
  userId: string;
}

export const tokenService = {
  generateToken: (payload: TokenPayload): string => {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as any,
    });
  },

  verifyToken: (token: string): TokenPayload => {
    return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
  },

  setCookie: (res: Response, token: string): void => {
    const isProd = env.NODE_ENV === 'production';
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    });
  },

  clearCookie: (res: Response): void => {
    res.cookie('jwt', '', {
      httpOnly: true,
      expires: new Date(0),
    });
  },
};
