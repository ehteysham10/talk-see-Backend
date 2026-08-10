import mongoose, { Schema } from 'mongoose';
import { IChatRoom } from '../types/index.js';

const chatRoomSchema = new Schema<IChatRoom>(
  {
    name: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['direct', 'group'],
      required: true,
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    unreadCounts: {
      type: Map,
      of: Number,
      default: new Map(),
    },
  },
  {
    timestamps: true,
  }
);

export const ChatRoom = mongoose.model<IChatRoom>('ChatRoom', chatRoomSchema);
