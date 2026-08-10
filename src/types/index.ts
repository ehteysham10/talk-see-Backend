import { Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  isVerified: boolean;
  avatar: string;
  status: 'online' | 'offline';
  lastSeen: Date;
  resetPasswordOtp?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChatRoom extends Document {
  _id: Types.ObjectId;
  name?: string;
  type: 'direct' | 'group';
  participants: Types.ObjectId[];
  lastMessage?: Types.ObjectId;
  unreadCounts: Map<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessage extends Document {
  _id: Types.ObjectId;
  roomId: Types.ObjectId;
  senderId: Types.ObjectId;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  status: 'sent' | 'delivered' | 'read';
  createdAt: Date;
  updatedAt: Date;
}
