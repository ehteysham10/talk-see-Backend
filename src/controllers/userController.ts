import { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { userService } from '../services/userService.js';
import { AuthRequest } from '../middlewares/authMiddleware.js';

export const searchUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const keyword = req.query.search ? String(req.query.search) : '';
  if (!req.user) {
    res.status(401);
    throw new Error('Not authorized');
  }

  const users = await userService.searchUsers(keyword, req.user._id.toString());
  res.status(200).json(users);
});

export const updateUserProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401);
    throw new Error('Not authorized');
  }

  const { name } = req.body;
  
  if (name) {
    const nameRegex = /^[a-zA-Z\s]{3,15}$/;
    if (!nameRegex.test(name)) {
      res.status(400);
      throw new Error('Name must be between 3 and 15 characters, containing only letters and spaces');
    }
  }

  let avatarUrl = undefined;

  // If a file was uploaded by multer, construct the URL
  if (req.file) {
    // Converts backslashes to forward slashes for cross-platform compatibility
    avatarUrl = `/${req.file.path.replace(/\\/g, '/')}`; 
  }

  const updatedUser = await userService.updateProfile(req.user._id.toString(), name, avatarUrl);

  res.status(200).json({
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    avatar: updatedUser.avatar,
  });
});
