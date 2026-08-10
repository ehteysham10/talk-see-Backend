import { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { chatService } from '../services/chatService.js';
import { messageService } from '../services/messageService.js';
import { AuthRequest } from '../middlewares/authMiddleware.js';

export const createRoom = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { type, participants, name } = req.body;
  if (!req.user) {
    res.status(401);
    throw new Error('Not authorized');
  }

  if (!participants || !Array.isArray(participants)) {
    res.status(400);
    throw new Error('Please provide an array of participants');
  }

  if (!type || !['direct', 'group'].includes(type)) {
    res.status(400);
    throw new Error('Please provide a valid room type: "direct" or "group"');
  }

  // Ensure current user is in participants
  const allParticipants = Array.from(new Set([...participants, req.user._id.toString()]));

  const room = await chatService.createRoom(type, allParticipants, name);
  res.status(201).json(room);
});

export const getRooms = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401);
    throw new Error('Not authorized');
  }

  const rooms = await chatService.getUserRooms(req.user._id.toString());
  res.status(200).json(rooms);
});

export const getMessages = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { roomId } = req.params;
  const rawLimit = parseInt(req.query.limit as string);
  const rawSkip = parseInt(req.query.skip as string);
  const limit = Math.min(!isNaN(rawLimit) ? rawLimit : 50, 100);
  const skip = !isNaN(rawSkip) ? rawSkip : 0;

  if (!req.user) {
    res.status(401);
    throw new Error('Not authorized');
  }

  // Verify the requesting user is a participant of this room
  const { ChatRoom } = await import('../models/ChatRoom.js');
  const room = await ChatRoom.findById(roomId);
  if (!room) {
    res.status(404);
    throw new Error('Chat room not found');
  }
  const isParticipant = room.participants.some(p => p.toString() === req.user!._id.toString());
  if (!isParticipant) {
    res.status(403);
    throw new Error('You are not a participant of this room');
  }

  const messages = await messageService.getMessages(roomId, limit, skip);
  res.status(200).json(messages);
});

export const sendMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { roomId } = req.params;
  const { content, type } = req.body;
  
  if (!req.user) {
    res.status(401);
    throw new Error('Not authorized');
  }

  if (!content) {
    res.status(400);
    throw new Error('Message content is required');
  }

  const message = await messageService.createMessage(roomId, req.user._id.toString(), content, type || 'text');
  res.status(201).json(message);
});
