import crypto from 'node:crypto';
import { pool } from '../database.js';
import { putImage, minio, bucket } from '../storage.js';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, file.mimetype.startsWith('image/')),
});

async function storageOwner() {
  const [[settings]] = await pool.query('SELECT hotel_name "hotelName" FROM settings WHERE id=1');
  return settings?.hotelName || 'knockout';
}

export const login = async (req, res) => {
  const { portalRole } = req;
  const [[user]] = await pool.query(
    'SELECT id,name,role FROM users WHERE role=? AND pin=? AND active=TRUE AND deleted_at IS NULL',
    [portalRole, req.body.pin]
  );
  if (!user) return res.status(401).json({ message: `Invalid ${portalRole} portal PIN` });
  res.json(user);
};

export const getProfile = async (req, res) => {
  const { portalRole } = req;
  const userId = Number(req.headers['x-portal-user-id']);
  const [[user]] = await pool.query(
    'SELECT id,name,role,phone,email,profile_image_url "profileImageUrl" FROM users WHERE id=? AND role=? AND active=TRUE AND deleted_at IS NULL',
    [userId, portalRole]
  );
  if (!user) return res.status(404).json({ message: 'Your profile could not be found' });
  res.json(user);
};

export const updateProfile = [
  upload.single('image'),
  async (req, res) => {
    const { portalRole } = req;
    const userId = Number(req.headers['x-portal-user-id']);
    const name = String(req.body.name || '').trim();
    const phone = String(req.body.phone || '').trim();
    const email = String(req.body.email || '').trim();
    if (!userId || !name) return res.status(400).json({ message: 'Your name is required' });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ message: 'Enter a valid email address' });
    const [[user]] = await pool.query(
      'SELECT id,profile_image_object "profileImageObject" FROM users WHERE id=? AND role=? AND active=TRUE AND deleted_at IS NULL',
      [userId, portalRole]
    );
    if (!user) return res.status(404).json({ message: 'Your profile could not be found' });
    let imageUrl = null, imageObject = null;
    if (req.file) {
      const ext = req.file.originalname.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
      const stored = await putImage(
        await storageOwner(),
        `profiles/${userId}-${crypto.randomUUID()}.${ext}`,
        req.file.buffer, req.file.size, req.file.mimetype
      );
      imageObject = stored.objectName;
      imageUrl = stored.url;
    }
    await pool.query(
      `UPDATE users SET name=?,phone=?,email=?${req.file ? ',profile_image_url=?,profile_image_object=?' : ''} WHERE id=?`,
      req.file ? [name, phone, email, imageUrl, imageObject, userId] : [name, phone, email, userId]
    );
    if (req.file && user.profileImageObject)
      await minio.removeObject(bucket, user.profileImageObject).catch(() => {});
    res.json({ id: userId, name, role: portalRole, phone, email, profileImageUrl: imageUrl || undefined });
  },
];
