import { Server } from 'socket.io';
import { AuthenticatedSocket } from './socketMiddleware.js';
import { socketService } from '../services/socketService.js';
import { User } from '../models/User.js';
import { messageService } from '../services/messageService.js';
import { callService } from '../services/callService.js';
import { logger } from '../utils/logger.js';

export interface RTCSessionDescriptionInit {
    sdp?: string;
    type: 'answer' | 'offer' | 'pranswer' | 'rollback';
}

export interface RTCIceCandidateInit {
    candidate?: string;
    sdpMid?: string | null;
    sdpMLineIndex?: number | null;
    usernameFragment?: string | null;
}

export const setupSocketHandlers = (io: Server) => {
  io.on('connection', async (socket: AuthenticatedSocket) => {
    const userId = socket.userId;
    if (!userId) {
      socket.disconnect();
      return;
    }

    logger.info(`Socket connected: ${socket.id} (User: ${userId})`);
    
    // 1. Add to socket tracking
    socketService.addSocket(userId, socket.id);

    // 2. Update user status to online if this is their first connection
    if (socketService.getSockets(userId).length === 1) {
      await User.findByIdAndUpdate(userId, { status: 'online' });
      socket.broadcast.emit('user_status_changed', { userId, status: 'online' });
    }

    // -- ROOM MANAGEMENT --
    socket.on('join_room', (roomId: string) => {
      socket.join(roomId);
      logger.info(`User ${userId} joined room ${roomId}`);
    });

    socket.on('leave_room', (roomId: string) => {
      socket.leave(roomId);
      logger.info(`User ${userId} left room ${roomId}`);
    });

    // -- MESSAGING --
    socket.on('send_message', async (data: { roomId: string; content: string; type?: 'text'|'image'|'file'|'system' }) => {
      try {
        const { roomId, content, type = 'text' } = data;
        if (!content || !roomId) {
          socket.emit('message_error', { error: 'roomId and content are required' });
          return;
        }
        const message = await messageService.createMessage(roomId, userId, content, type);
        
        // Broadcast to everyone in the room including the sender (web: sender always joins room first)
        io.to(roomId).emit('new_message', message);
      } catch (error: any) {
        logger.error('Error sending socket message', error);
        socket.emit('message_error', { error: error.message || 'Failed to send message' });
      }
    });

    // -- TYPING INDICATORS --
    socket.on('typing_start', (roomId: string) => {
      socket.to(roomId).emit('typing_start', { userId, roomId });
    });

    socket.on('typing_stop', (roomId: string) => {
      socket.to(roomId).emit('typing_stop', { userId, roomId });
    });

    // -- WEBRTC SIGNALING ENGINE --
    socket.on('call_user', (data: { receiverId: string, roomId?: string, type: 'audio' | 'video' }) => {
      const { receiverId, roomId, type } = data;
      const call = callService.initiateCall(userId, receiverId, roomId);
      
      const receiverSockets = socketService.getSockets(receiverId);
      
      // Emit incoming call to all active sockets of the receiver
      receiverSockets.forEach(sockId => {
        io.to(sockId).emit('incoming_call', {
          callId: call.callId,
          callerId: userId,
          roomId,
          type
        });
      });
    });

    socket.on('answer_call', (data: { callId: string }) => {
      const call = callService.getCall(data.callId);
      if (call) {
        callService.updateCallStatus(call.callId, 'in_progress');
        const callerSockets = socketService.getSockets(call.callerId);
        callerSockets.forEach(sockId => {
          io.to(sockId).emit('call_answered', { callId: call.callId, answererId: userId });
        });
      }
    });

    socket.on('reject_call', (data: { callId: string }) => {
      const call = callService.getCall(data.callId);
      if (call) {
        callService.endCall(call.callId);
        const callerSockets = socketService.getSockets(call.callerId);
        callerSockets.forEach(sockId => {
          io.to(sockId).emit('call_rejected', { callId: call.callId, rejecterId: userId });
        });
      }
    });

    socket.on('end_call', (data: { callId: string }) => {
      const call = callService.getCall(data.callId);
      if (call) {
        callService.endCall(call.callId);
        // Determine the other participant
        const targetId = call.callerId === userId ? call.receiverId : call.callerId;
        const targetSockets = socketService.getSockets(targetId);
        targetSockets.forEach(sockId => {
          io.to(sockId).emit('call_ended', { callId: call.callId });
        });
      }
    });

    // Transparent Relays for WebRTC Handshakes
    socket.on('webrtc_offer', (data: { targetUserId: string, callId: string, sdp: RTCSessionDescriptionInit }) => {
      const targetSockets = socketService.getSockets(data.targetUserId);
      targetSockets.forEach(sockId => {
        io.to(sockId).emit('webrtc_offer', { callId: data.callId, senderId: userId, sdp: data.sdp });
      });
    });

    socket.on('webrtc_answer', (data: { targetUserId: string, callId: string, sdp: RTCSessionDescriptionInit }) => {
      const targetSockets = socketService.getSockets(data.targetUserId);
      targetSockets.forEach(sockId => {
        io.to(sockId).emit('webrtc_answer', { callId: data.callId, senderId: userId, sdp: data.sdp });
      });
    });

    socket.on('webrtc_ice_candidate', (data: { targetUserId: string, callId: string, candidate: RTCIceCandidateInit }) => {
      const targetSockets = socketService.getSockets(data.targetUserId);
      targetSockets.forEach(sockId => {
        io.to(sockId).emit('webrtc_ice_candidate', { callId: data.callId, senderId: userId, candidate: data.candidate });
      });
    });

    // -- DISCONNECT --
    socket.on('disconnect', async () => {
      logger.info(`Socket disconnected: ${socket.id} (User: ${userId})`);
      socketService.removeSocket(userId, socket.id);

      // If no sockets left for this user, mark as offline
      if (!socketService.isUserOnline(userId)) {
        await User.findByIdAndUpdate(userId, { 
          status: 'offline', 
          lastSeen: new Date() 
        });
        socket.broadcast.emit('user_status_changed', { 
          userId, 
          status: 'offline',
          lastSeen: new Date()
        });
      }
    });
  });
};
