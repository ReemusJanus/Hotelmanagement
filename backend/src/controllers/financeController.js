import { pool } from '../database.js';

export const createFinanceEntry = async (req, res) => {
  const { portalRole } = req;
  if (portalRole !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  const { entryType, category, description, amount, paymentMethod = 'Cash', entryDate, reference = '', createdBy = 'Admin' } = req.body;
  if (!['income', 'expense'].includes(entryType) || !category || !description || Number(amount) <= 0 || !entryDate)
    return res.status(400).json({ message: 'Type, category, description, amount, and date are required' });
  const [result] = await pool.query(
    'INSERT INTO finance_entries (entry_type,category,description,amount,payment_method,entry_date,reference,created_by) VALUES (?,?,?,?,?,?,?,?)',
    [entryType, category, description, Number(amount), paymentMethod, entryDate, reference, createdBy]
  );
  res.status(201).json({ id: result.insertId });
};

export const deleteFinanceEntry = async (req, res) => {
  const { portalRole } = req;
  if (portalRole !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  await pool.query('DELETE FROM finance_entries WHERE id=?', [req.params.id]);
  res.json({ ok: true });
};

export const createSupplierPurchase = async (req, res) => {
  const { portalRole } = req;
  if (portalRole !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  const {
    supplierName, invoiceNumber = '', description, purchaseDate,
    totalAmount, paidAmount = 0, paymentMethod = 'Cash',
    reference = '', notes = '', createdBy = 'Admin',
  } = req.body;
  const total = Number(totalAmount), paid = Number(paidAmount);
  if (!supplierName || !description || !purchaseDate || total <= 0 || paid < 0 || paid > total)
    return res.status(400).json({ message: 'Supplier, description, date, valid total, and paid amount are required' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      'INSERT INTO supplier_purchases (supplier_name,invoice_number,description,purchase_date,total_amount,notes,created_by) VALUES (?,?,?,?,?,?,?)',
      [supplierName, invoiceNumber, description, purchaseDate, total, notes, createdBy]
    );
    if (paid > 0)
      await conn.query(
        'INSERT INTO supplier_payments (purchase_id,amount,payment_method,payment_date,reference,notes,created_by) VALUES (?,?,?,?,?,?,?)',
        [result.insertId, paid, paymentMethod, purchaseDate, reference, 'Payment recorded with purchase', createdBy]
      );
    await conn.commit();
    res.status(201).json({ id: result.insertId, totalAmount: total, paidAmount: paid, dueAmount: total - paid });
  } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
};

export const addSupplierPayment = async (req, res) => {
  const { portalRole } = req;
  if (portalRole !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  const amount = Number(req.body.amount);
  if (amount <= 0 || !req.body.paymentDate)
    return res.status(400).json({ message: 'A positive payment amount and payment date are required' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[purchase]] = await conn.query(
      'SELECT id,total_amount "totalAmount" FROM supplier_purchases WHERE id=? FOR UPDATE',
      [req.params.id]
    );
    if (!purchase) throw Object.assign(new Error('Supplier purchase not found'), { status: 404 });
    const [[totals]] = await conn.query(
      'SELECT COALESCE(SUM(amount),0) paid FROM supplier_payments WHERE purchase_id=?',
      [purchase.id]
    );
    const due = Number(purchase.totalAmount) - Number(totals.paid);
    if (amount > due)
      throw Object.assign(new Error(`Payment exceeds outstanding balance of ${due.toFixed(2)}`), { status: 409 });
    const [result] = await conn.query(
      'INSERT INTO supplier_payments (purchase_id,amount,payment_method,payment_date,reference,notes,created_by) VALUES (?,?,?,?,?,?,?)',
      [purchase.id, amount, req.body.paymentMethod || 'Cash', req.body.paymentDate, req.body.reference || '', req.body.notes || '', req.body.createdBy || 'Admin']
    );
    await conn.commit();
    res.status(201).json({ id: result.insertId, paidAmount: Number(totals.paid) + amount, dueAmount: due - amount });
  } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
};

export const deleteSupplierPurchase = async (req, res) => {
  const { portalRole } = req;
  if (portalRole !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM supplier_payments WHERE purchase_id=?', [req.params.id]);
    await conn.query('DELETE FROM supplier_purchases WHERE id=?', [req.params.id]);
    await conn.commit();
    res.json({ ok: true });
  } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
};

export const updateSettings = async (req, res) => {
  await pool.query(
    'UPDATE settings SET hotel_name=?,tax_rate=?,cgst_rate=?,service_charge=?,currency=? WHERE id=1',
    [req.body.hotelName, req.body.taxRate, req.body.cgstRate, req.body.serviceCharge, req.body.currency]
  );
  res.json({ ok: true });
};
