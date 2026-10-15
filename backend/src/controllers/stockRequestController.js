import { pool } from '../database.js';

export const createStockRequest = async (req, res) => {
  const { portalRole } = req;
  if (portalRole !== 'chef')
    return res.status(403).json({ message: 'Only Chef can request kitchen stock' });
  const inventoryId = Number(req.body.inventoryId);
  const requestedQuantity = Number(req.body.requestedQuantity);
  const requestedBy = String(req.body.requestedBy || 'Chef').trim();
  const note = String(req.body.note || '').trim();
  if (!inventoryId || !Number.isFinite(requestedQuantity) || requestedQuantity <= 0 || !requestedBy)
    return res.status(400).json({ message: 'Choose an item and enter the quantity required' });
  const [[item]] = await pool.query(
    'SELECT id,name,quantity,unit,min_quantity "minQuantity" FROM inventory WHERE id=?',
    [inventoryId]
  );
  if (!item) return res.status(404).json({ message: 'Stock item not found' });
  const [[existing]] = await pool.query(
    "SELECT id FROM stock_requests WHERE inventory_id=? AND status IN ('pending','ordered') LIMIT 1",
    [inventoryId]
  );
  if (existing) return res.status(409).json({ message: `${item.name} already has an active stock request` });
  const [result] = await pool.query(
    "INSERT INTO stock_requests (inventory_id,requested_quantity,note,requested_by,status) VALUES (?,?,?,?,'pending')",
    [inventoryId, requestedQuantity, note, requestedBy]
  );
  res.status(201).json({ id: result.insertId, itemName: item.name, currentQuantity: Number(item.quantity), unit: item.unit });
};

export const updateStockRequestStatus = async (req, res) => {
  const { portalRole } = req;
  if (portalRole !== 'admin')
    return res.status(403).json({ message: 'Only Admin can manage stock requests' });
  const status = String(req.body.status || '');
  if (!['pending', 'ordered', 'resolved'].includes(status))
    return res.status(400).json({ message: 'Invalid stock request status' });
  const [result] = await pool.query(
    "UPDATE stock_requests SET status=?,resolved_at=(CASE WHEN ?='resolved' THEN NOW() ELSE NULL END) WHERE id=?",
    [status, status, req.params.id]
  );
  if (!result.affectedRows) return res.status(404).json({ message: 'Stock request not found' });
  res.json({ ok: true, status });
};
