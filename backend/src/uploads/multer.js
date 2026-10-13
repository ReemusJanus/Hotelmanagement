import multer from 'multer';

// In-memory multer storage for file uploads (max 5MB, images only)
export const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, file.mimetype.startsWith('image/'));
  }
});

// Single image upload field
export const uploadSingleImage = memoryUpload.single('image');

export default memoryUpload;
