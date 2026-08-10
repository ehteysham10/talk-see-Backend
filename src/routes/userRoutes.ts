import express from 'express';
import { searchUsers, updateUserProfile } from '../controllers/userController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { upload } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.get('/', protect, searchUsers);
router.put('/profile', protect, upload.single('avatar'), updateUserProfile);

export default router;
