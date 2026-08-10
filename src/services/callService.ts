export interface CallSession {
  callId: string;
  roomId?: string;
  callerId: string;
  receiverId: string;
  status: 'ringing' | 'in_progress' | 'ended';
  startedAt: Date;
}

export const callService = {
  // Map of callId -> CallSession
  activeCalls: new Map<string, CallSession>(),

  initiateCall: (callerId: string, receiverId: string, roomId?: string): CallSession => {
    // Generate a unique call session ID
    const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: CallSession = {
      callId,
      callerId,
      receiverId,
      roomId,
      status: 'ringing',
      startedAt: new Date(),
    };

    callService.activeCalls.set(callId, session);
    return session;
  },

  getCall: (callId: string): CallSession | undefined => {
    return callService.activeCalls.get(callId);
  },

  updateCallStatus: (callId: string, status: 'ringing' | 'in_progress' | 'ended') => {
    const session = callService.activeCalls.get(callId);
    if (session) {
      session.status = status;
    }
  },

  endCall: (callId: string) => {
    callService.activeCalls.delete(callId);
  },
};
