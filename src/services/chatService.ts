import { ChatRoom } from '../models/ChatRoom.js';
import { AppError } from '../utils/AppError.js';

export const chatService = {
  createRoom: async (type: 'direct' | 'group', participants: string[], name?: string) => {
    if (participants.length < 2) {
      throw new AppError('A chat room requires at least 2 participants', 400);
    }

    if (type === 'direct') {
      if (participants.length > 2) {
        throw new AppError('Direct chat can only have 2 participants', 400);
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
