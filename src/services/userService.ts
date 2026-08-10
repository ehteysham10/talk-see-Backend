import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

export const userService = {
  getUserById: async (id: string) => {
    const user = await User.findById(id).select('-passwordHash');
    if (!user) throw new AppError('User not found', 404);
    return user;
  },

  searchUsers: async (keyword: string, currentUserId: string) => {
    const searchRegex = new RegExp(keyword, 'i');
    const users = await User.find({
      $and: [
        { _id: { $ne: currentUserId } },
        { $or: [{ name: searchRegex }, { email: searchRegex }] },
      ],
    }).select('-passwordHash');

    return users;
  },

  updateProfile: async (id: string, name?: string, avatarUrl?: string) => {
    const user = await User.findById(id);
    if (!user) throw new AppError('User not found', 404);

    if (name) user.name = name;
    if (avatarUrl) user.avatar = avatarUrl;

    await user.save();
    return user;
  },
};
