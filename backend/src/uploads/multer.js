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

// Logo uploads deliberately use a smaller limit and a narrow format allowlist.
export const uploadRestaurantLogo = multer({
  storage: multer.memoryStorage(), limits: {fileSize: 2 * 1024 * 1024, files: 1},
  fileFilter: (_req, file, cb) => ['image/png','image/jpeg','image/webp'].includes(file.mimetype)
    ? cb(null, true) : cb(Object.assign(new Error('Use a PNG, JPEG or WebP logo'), {status:400}))
}).single('logo');
