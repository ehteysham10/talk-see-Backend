import { Message } from '../models/Message.js';
import { ChatRoom } from '../models/ChatRoom.js';

export const messageService = {
  createMessage: async (
    roomId: string,
    senderId: string,
    content: string,
    type: 'text' | 'image' | 'file' | 'system' = 'text'
  ) => {
    const room = await ChatRoom.findById(roomId);
    if (!room) {
      throw new Error('Chat room not found');
    }

    if (!room.participants.some((p) => p.toString() === senderId)) {
      throw new Error('Sender is not a participant in this room');
    }

    const message = await Message.create({
      roomId,
      senderId,
      content,
      type,
      status: 'sent',
    });

    room.lastMessage = message._id as any;
    
    // Increment unread counts for everyone except the sender
    room.participants.forEach((p) => {
      const pId = p.toString();
      if (pId !== senderId) {
        const currentCount = room.unreadCounts.get(pId) || 0;
        room.unreadCounts.set(pId, currentCount + 1);
      }
    });

    await room.save();

    return message;
  },

  getMessages: async (roomId: string, limit: number = 50, skip: number = 0) => {
    const messages = await Message.find({ roomId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Return in chronological order
    return messages.reverse();
  },
};
