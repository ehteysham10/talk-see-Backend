import multer from 'multer';
import path from 'path';

// Define storage location and filename format
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/avatars/');
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `avatar-${uniqueSuffix}${ext}`);
  },
});

// Validate the file is an image
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only standard images (JPEG, PNG, WebP) are allowed'));
  }
};

// Create the configured multer instance (1MB Limit)
export const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024, // 1 Megabyte
  },
  fileFilter,
});
