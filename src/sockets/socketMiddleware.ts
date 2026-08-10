import { Socket } from 'socket.io';
import { tokenService } from '../services/tokenService.js';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export const socketAuthMiddleware = (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
  try {
    let token: string | undefined;

    // Check cookies first
    if (socket.request.headers.cookie) {
      const cookies = socket.request.headers.cookie.split(';').reduce((res: any, c) => {
        const [key, val] = c.trim().split('=').map(decodeURIComponent);
        res[key] = val;
        return res;
      }, {});
      token = cookies.jwt;
    }

    // Fallback to auth token provided during handshake
    if (!token && socket.handshake.auth?.token) {
      token = socket.handshake.auth.token;
    }

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = tokenService.verifyToken(token);
    socket.userId = decoded.userId;
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
};
