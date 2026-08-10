import express from 'express';
import { createRoom, getRooms, getMessages, sendMessage } from '../controllers/chatController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .post(createRoom)
  .get(getRooms);

router.route('/:roomId/messages')
  .get(getMessages)
  .post(sendMessage);

export default router;
