import { pool } from '../database.js';

export const createInventory = async (req, res) => {
  const { portalRole } = req;
  if (portalRole !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  const { name, category = '', quantity = 0, unit, min = 0, cost = 0 } = req.body;
  if (!name || !unit || Number(quantity) < 0 || Number(min) < 0 || Number(cost) < 0)
    return res.status(400).json({ message: 'Name, unit, and valid quantities are required' });
  const [result] = await pool.query(
    'INSERT INTO inventory (name,category,quantity,unit,min_quantity,cost) VALUES (?,?,?,?,?,?)',
    [name, category, Number(quantity), unit, Number(min), Number(cost)]
  );
  if (Number(quantity) > 0)
    await pool.query(
      "INSERT INTO inventory_transactions (inventory_id,movement_type,quantity,unit_cost,note,created_by) VALUES (?,'purchase',?,?,?,?)",
      [result.insertId, Number(quantity), Number(cost), 'Opening stock', req.body.createdBy || 'Admin']
    );
  res.status(201).json({ id: result.insertId });
};

export const updateInventory = async (req, res) => {
  const { portalRole } = req;
  if (portalRole !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  const { name, category = '', unit, min = 0, cost = 0 } = req.body;
  await pool.query(
    'UPDATE inventory SET name=?,category=?,unit=?,min_quantity=?,cost=? WHERE id=?',
    [name, category, unit, Number(min), Number(cost), req.params.id]
  );
  res.json({ ok: true });
};

export const addInventoryMovement = async (req, res) => {
  const { portalRole } = req;
  if (portalRole !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  const type = req.body.movementType;
  const quantity = Number(req.body.quantity);
  if (!['purchase', 'usage', 'adjustment', 'waste'].includes(type) || !Number.isFinite(quantity) || quantity <= 0)
    return res.status(400).json({ message: 'Choose a movement type and enter a positive quantity' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[item]] = await conn.query(
      'SELECT id,quantity,cost FROM inventory WHERE id=? FOR UPDATE',
      [req.params.id]
    );
    if (!item) throw Object.assign(new Error('Stock item not found'), { status: 404 });
    const delta = type === 'purchase' ? quantity
      : type === 'adjustment' ? (Number(req.body.adjustmentDirection) === -1 ? -quantity : quantity)
        : -quantity;
    const newQuantity = Number(item.quantity) + delta;
    if (newQuantity < 0)
      throw Object.assign(new Error('Not enough stock for this movement'), { status: 409 });
    const unitCost = (req.body.unitCost === '' || req.body.unitCost == null)
      ? Number(item.cost) : Number(req.body.unitCost);
    await conn.query(
      "UPDATE inventory SET quantity=?,cost=(CASE WHEN ?='purchase' THEN ? ELSE cost END) WHERE id=?",
      [newQuantity, type, unitCost, item.id]
    );
    await conn.query(
      'INSERT INTO inventory_transactions (inventory_id,movement_type,quantity,unit_cost,note,created_by) VALUES (?,?,?,?,?,?)',
      [item.id, type, delta, unitCost, req.body.note || '', req.body.createdBy || 'Admin']
    );
    await conn.commit();
    res.status(201).json({ ok: true, quantity: newQuantity });
  } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
};

export const deleteInventory = async (req, res) => {
  const { portalRole } = req;
  if (portalRole !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  const [[used]] = await pool.query(
    'SELECT id FROM inventory_transactions WHERE inventory_id=? LIMIT 1',
    [req.params.id]
  );
  if (used) return res.status(409).json({ message: 'Items with stock history cannot be deleted' });
  await pool.query('DELETE FROM inventory WHERE id=?', [req.params.id]);
  res.json({ ok: true });
};
