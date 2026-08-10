export const socketService = {
  // Map of userId -> Set of socketIds
  userSocketMap: new Map<string, Set<string>>(),

  addSocket: (userId: string, socketId: string) => {
    if (!socketService.userSocketMap.has(userId)) {
      socketService.userSocketMap.set(userId, new Set());
    }
    socketService.userSocketMap.get(userId)?.add(socketId);
  },

  removeSocket: (userId: string, socketId: string) => {
    const userSockets = socketService.userSocketMap.get(userId);
    if (userSockets) {
      userSockets.delete(socketId);
      if (userSockets.size === 0) {
        socketService.userSocketMap.delete(userId);
      }
    }
  },

  getSockets: (userId: string): string[] => {
    const userSockets = socketService.userSocketMap.get(userId);
    return userSockets ? Array.from(userSockets) : [];
  },

  isUserOnline: (userId: string): boolean => {
    return socketService.userSocketMap.has(userId);
  }
};
