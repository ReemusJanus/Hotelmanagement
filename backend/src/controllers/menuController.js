import crypto from 'node:crypto';
import multer from 'multer';
import { pool } from '../database.js';
import { minio, bucket, putImage } from '../storage.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, file.mimetype.startsWith('image/')),
});

async function storageOwner() {
  const [[settings]] = await pool.query('SELECT hotel_name "hotelName" FROM settings WHERE id=1');
  return settings?.hotelName || 'knockout';
}

const isJuiceCategory = category => String(category || '').trim().toLowerCase() === 'juices';

export const createMenuItem = async (req, res) => {
  const { portalRole } = req;
  if (portalRole !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  const { name, category, description = '', price, icon = '🍽️', available = true } = req.body;
  if (!name || !category || Number(price) < 0) return res.status(400).json({ message: 'Name, category, and valid price are required' });
  const [result] = await pool.query(
    'INSERT INTO menu_items (name,category,description,price,icon,available,is_combo) VALUES (?,?,?,?,?,?,FALSE)',
    [name, category, description, Number(price), icon, !!available]
  );
  res.status(201).json({ id: result.insertId });
};

export const updateMenuItem = async (req, res) => {
  const { portalRole } = req;
  if (portalRole !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  const { name, category, description = '', price, icon = '🍽️', available = true } = req.body;
  await pool.query(
    'UPDATE menu_items SET name=?,category=?,description=?,price=?,icon=?,available=? WHERE id=?',
    [name, category, description, Number(price), icon, !!available, req.params.id]
  );
  res.json({ ok: true });
};

export const deleteMenuItem = async (req, res) => {
  const { portalRole } = req;
  if (portalRole !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  await pool.query('UPDATE menu_items SET available=FALSE WHERE id=?', [req.params.id]);
  res.json({ ok: true });
};

export const updateAvailability = async (req, res) => {
  const { portalRole } = req;
  if (!['admin', 'chef', 'juicer'].includes(portalRole))
    return res.status(403).json({ message: 'Admin, Head Chef, or Juicer access required' });
  if (typeof req.body.available !== 'boolean')
    return res.status(400).json({ message: 'Availability must be true or false' });
  if (portalRole === 'juicer') {
    const [[item]] = await pool.query('SELECT category FROM menu_items WHERE id=?', [req.params.id]);
    if (!item || !isJuiceCategory(item.category))
      return res.status(403).json({ message: 'Juicer can only update juice availability' });
  }
  const [result] = await pool.query('UPDATE menu_items SET available=? WHERE id=?', [req.body.available, req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ message: 'Dish not found' });
  res.json({ ok: true, id: Number(req.params.id), available: req.body.available });
};

export const createCombo = async (req, res) => {
  const { portalRole } = req;
  if (portalRole !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  const { name, description = '', price, icon = '🎁', components = [] } = req.body;
  if (!name || Number(price) < 0 || !components.length)
    return res.status(400).json({ message: 'Combo name, price, and at least one item are required' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      "INSERT INTO menu_items (name,category,description,price,icon,available,is_combo) VALUES (?,'Combo Offers',?,?,?,TRUE,TRUE)",
      [name, description, Number(price), icon]
    );
    for (const component of components) {
      const [[item]] = await conn.query('SELECT id FROM menu_items WHERE id=? AND is_combo=FALSE', [component.menuId]);
      if (!item) throw new Error('A selected combo item is invalid');
      await conn.query(
        'INSERT INTO combo_components (combo_id,menu_id,quantity) VALUES (?,?,?)',
        [result.insertId, component.menuId, Math.max(1, Number(component.quantity) || 1)]
      );
    }
    await conn.commit();
    res.status(201).json({ id: result.insertId });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

export const updateCombo = async (req, res) => {
  const { portalRole } = req;
  if (portalRole !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  const { name, description = '', price, icon = '🎁', components = [] } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(
      "UPDATE menu_items SET name=?,category='Combo Offers',description=?,price=?,icon=?,available=TRUE,is_combo=TRUE WHERE id=?",
      [name, description, Number(price), icon, req.params.id]
    );
    await conn.query('DELETE FROM combo_components WHERE combo_id=?', [req.params.id]);
    for (const component of components) {
      await conn.query(
        'INSERT INTO combo_components (combo_id,menu_id,quantity) VALUES (?,?,?)',
        [req.params.id, component.menuId, Math.max(1, Number(component.quantity) || 1)]
      );
    }
    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

export const uploadMenuImage = [
  upload.single('image'),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'Please select an image file' });
    const [[item]] = await pool.query('SELECT image_object "imageObject" FROM menu_items WHERE id=?', [req.params.id]);
    if (!item) return res.status(404).json({ message: 'Menu item not found' });
    const ext = req.file.originalname.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
    const stored = await putImage(
      await storageOwner(),
      `menu/${req.params.id}-${crypto.randomUUID()}.${ext}`,
      req.file.buffer,
      req.file.size,
      req.file.mimetype
    );
    if (item.imageObject) await minio.removeObject(bucket, item.imageObject).catch(() => {});
    await pool.query('UPDATE menu_items SET image_url=?,image_object=? WHERE id=?', [stored.url, stored.objectName, req.params.id]);
    res.json({ imageUrl: stored.url, objectName: stored.objectName });
  }
];

export const deleteMenuImage = async (req, res) => {
  const [[item]] = await pool.query('SELECT image_object "imageObject" FROM menu_items WHERE id=?', [req.params.id]);
  if (item?.imageObject) await minio.removeObject(bucket, item.imageObject);
  await pool.query('UPDATE menu_items SET image_url=NULL,image_object=NULL WHERE id=?', [req.params.id]);
  res.json({ ok: true });
};
