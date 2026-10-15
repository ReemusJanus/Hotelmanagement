import { pool } from '../database.js';
import { putReport, storageProvider } from '../storage.js';

async function storageOwner() {
  const [[settings]] = await pool.query('SELECT hotel_name "hotelName" FROM settings WHERE id=1');
  return settings?.hotelName || 'knockout';
}

export const createReport = async (req, res) => {
  if (!req.body.filename || typeof req.body.content !== 'string') {
    return res.status(400).json({ message: 'Report filename and content are required' });
  }
  const stored = await putReport(
    await storageOwner(),
    req.body.filename,
    req.body.content,
    req.body.contentType || 'text/csv;charset=utf-8'
  );
  res.status(201).json({ ...stored, provider: storageProvider });
};
