import { ChatRoom } from '../models/ChatRoom.js';

export const chatService = {
  createRoom: async (type: 'direct' | 'group', participants: string[], name?: string) => {
    if (participants.length < 2) {
      throw new Error('A chat room requires at least 2 participants');
    }

    if (type === 'direct') {
      if (participants.length > 2) {
        throw new Error('Direct chat can only have 2 participants');
      }
      
      const existingRoom = await ChatRoom.findOne({
        type: 'direct',
        participants: { $all: participants, $size: 2 },
      });

      if (existingRoom) {
        return existingRoom;
      }
    }

    const unreadCounts = new Map<string, number>();
    participants.forEach((id) => {
      unreadCounts.set(id.toString(), 0);
    });

    const room = await ChatRoom.create({
      type,
      participants,
      name,
      unreadCounts,
    });

    return room;
  },

  getUserRooms: async (userId: string) => {
    const rooms = await ChatRoom.find({ participants: userId })
      .populate('participants', '-passwordHash')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });
    
    return rooms;
  },
};
