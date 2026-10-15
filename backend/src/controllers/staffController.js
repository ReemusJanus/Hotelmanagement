import crypto from 'node:crypto';
import { pool } from '../database.js';

async function ensureUniquePortalPin({ pin, currentDatabase, excludeId = null }) {
  const params = [String(pin)];
  let sql = 'SELECT id,name FROM users WHERE pin=? AND deleted_at IS NULL';
  if (excludeId) {
    sql += ' AND id<>?';
    params.push(excludeId);
  }
  sql += ' LIMIT 1';
  const [[used]] = await pool.query(sql, params);
  if (used) {
    throw Object.assign(new Error('This PIN is already assigned to another user in this hotel.'), { status: 409 });
  }
}

async function generatePortalPin() {
  for (let attempt = 0; attempt < 200; attempt++) {
    const pin = String(crypto.randomInt(100000, 1000000));
    const [[used]] = await pool.query('SELECT id FROM users WHERE pin=? AND deleted_at IS NULL LIMIT 1', [pin]);
    if (!used) return pin;
  }
  throw Object.assign(new Error('Unable to generate a unique user PIN. Please try again.'), { status: 503 });
}

async function verifyPortalStaff(userId, portalRole) {
  const [[staff]] = await pool.query('SELECT id,name,role FROM users WHERE id=? AND active=TRUE AND deleted_at IS NULL', [userId]);
  if (!staff) return null;
  if (portalRole !== 'admin' && staff.role !== portalRole) return null;
  return staff;
}

export const getAttendance = async (req, res) => {
  const { portalRole } = req;
  const staff = await verifyPortalStaff(req.params.id, portalRole);
  if (!staff) return res.status(403).json({ message: 'This staff account does not belong to this portal' });
  const [shifts] = await pool.query(
    'SELECT id,check_in "checkIn",check_out "checkOut",notes FROM staff_attendance WHERE user_id=? ORDER BY check_in DESC LIMIT 100',
    [staff.id]
  );
  res.json({ staff, shifts, activeShift: shifts.find(s => !s.checkOut) || null });
};

export const selfCheckIn = async (req, res) => {
  const { portalRole } = req;
  const staff = await verifyPortalStaff(req.params.id, portalRole);
  if (!staff) return res.status(403).json({ message: 'This staff account does not belong to this portal' });
  if (portalRole === 'admin') return res.status(403).json({ message: 'Staff must check in from their own portal' });
  const [[open]] = await pool.query('SELECT id FROM staff_attendance WHERE user_id=? AND check_out IS NULL', [staff.id]);
  if (open) return res.status(409).json({ message: 'You are already checked in' });
  const [result] = await pool.query(
    'INSERT INTO staff_attendance (user_id,check_in,notes) VALUES (?,NOW(),?)',
    [staff.id, req.body.notes || '']
  );
  res.status(201).json({ id: result.insertId, checkIn: new Date() });
};

export const selfCheckOut = async (req, res) => {
  const { portalRole } = req;
  const staff = await verifyPortalStaff(req.params.id, portalRole);
  if (!staff) return res.status(403).json({ message: 'This staff account does not belong to this portal' });
  if (portalRole === 'admin') return res.status(403).json({ message: 'Staff must check out from their own portal' });
  const [[shift]] = await pool.query(
    'SELECT id FROM staff_attendance WHERE user_id=? AND check_out IS NULL ORDER BY check_in DESC LIMIT 1',
    [staff.id]
  );
  if (!shift) return res.status(409).json({ message: 'You are not currently checked in' });
  await pool.query(
    'UPDATE staff_attendance SET check_out=NOW(),notes=(CASE WHEN ?=\'\' THEN notes ELSE ? END) WHERE id=?',
    [req.body.notes || '', req.body.notes || '', shift.id]
  );
  res.json({ ok: true, checkOut: new Date() });
};

export const createStaff = async (req, res) => {
  const { portalRole } = req;
  if (portalRole !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  const { name, role, phone = '', payType = 'monthly', payRate = 0 } = req.body;
  if (!name || !['admin', 'waiter', 'chef'].includes(role) || !['daily', 'monthly'].includes(payType)) {
    return res.status(400).json({ message: 'Name, role, and Daily/Monthly salary basis are required' });
  }
  if (['admin', 'chef'].includes(role)) {
    const [[existing]] = await pool.query('SELECT id FROM users WHERE role=? AND deleted_at IS NULL LIMIT 1', [role]);
    if (existing) {
      return res.status(409).json({
        message: role === 'admin'
          ? 'This company already has its single Admin login.'
          : 'This company already has its single Head Chef login. Add other chefs from Chef Management without PINs.'
      });
    }
  }
  const pin = await generatePortalPin();
  const [result] = await pool.query(
    'INSERT INTO users (name,role,pin,phone,pay_type,pay_rate,active) VALUES (?,?,?,?,?,?,TRUE)',
    [name, role, pin, phone, payType, Number(payRate)]
  );
  res.status(201).json({ id: result.insertId, pin });
};

export const updateStaff = async (req, res) => {
  const { portalRole } = req;
  if (portalRole !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  const { name, role, pin, phone = '', payType = 'monthly', payRate = 0, active = true } = req.body;
  if (!['admin', 'waiter', 'chef', 'juicer'].includes(role) || !/^[0-9]{6}$/.test(String(pin || '')) || !['daily', 'monthly'].includes(payType)) {
    return res.status(400).json({ message: 'Valid role, unique 6-digit PIN, and Daily/Monthly salary basis are required' });
  }
  if (['admin', 'chef', 'juicer'].includes(role)) {
    const [[existing]] = await pool.query(
      'SELECT id FROM users WHERE role=? AND id<>? AND deleted_at IS NULL LIMIT 1',
      [role, req.params.id]
    );
    if (existing) {
      return res.status(409).json({
        message: `This company already has its single ${role === 'admin' ? 'Admin' : role === 'chef' ? 'Head Chef' : 'Juicer'} login.`
      });
    }
  }
  const currentDatabase = String(req.headers['x-company-database'] || process.env.DB_NAME || 'knockout');
  if (active) await ensureUniquePortalPin({ pin, currentDatabase, excludeId: req.params.id });
  const [result] = await pool.query(
    'UPDATE users SET name=?,role=?,pin=?,phone=?,pay_type=?,pay_rate=?,active=? WHERE id=? AND deleted_at IS NULL',
    [name, role, pin, phone, payType, Number(payRate), !!active, req.params.id]
  );
  if (!result.affectedRows) return res.status(404).json({ message: 'Staff member not found' });
  res.json({ ok: true });
};

export const deleteStaff = async (req, res) => {
  const { portalRole } = req;
  if (portalRole !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  const [[staff]] = await pool.query('SELECT id,name,role FROM users WHERE id=? AND deleted_at IS NULL', [req.params.id]);
  if (!staff) return res.status(404).json({ message: 'Staff member not found' });
  if (staff.role === 'admin') return res.status(409).json({ message: 'The company Admin login is protected and cannot be deleted here' });
  await pool.query(
    "UPDATE users SET active=FALSE,deleted_at=NOW(),pin=CONCAT('deleted-',id,'-',floor(extract(epoch FROM NOW()))) WHERE id=?",
    [staff.id]
  );
  res.json({ ok: true, id: staff.id, name: staff.name, attendancePreserved: true });
};

export const getJuicerLogin = async (req, res) => {
  const { portalRole } = req;
  if (portalRole !== 'chef') return res.status(403).json({ message: 'Head Chef access required' });
  const [[juicer]] = await pool.query(
    'SELECT id,name,role,pin,phone,pay_type "payType",pay_rate "payRate",active FROM users WHERE role=\'juicer\' AND deleted_at IS NULL LIMIT 1'
  );
  res.json(juicer || null);
};

export const createJuicerLogin = async (req, res) => {
  const { portalRole } = req;
  if (portalRole !== 'chef') return res.status(403).json({ message: 'Only the Head Chef can create the Juicer login' });
  const { name, phone = '', payType = 'monthly', payRate = 0 } = req.body;
  if (!String(name || '').trim() || !['daily', 'monthly'].includes(payType)) {
    return res.status(400).json({ message: 'Name and salary basis are required' });
  }
  const [[existing]] = await pool.query('SELECT id FROM users WHERE role=\'juicer\' AND deleted_at IS NULL LIMIT 1');
  if (existing) {
    return res.status(409).json({ message: 'This company already has its single Juicer login. Admin can edit it from Staff Management.' });
  }
  const pin = await generatePortalPin();
  const [result] = await pool.query(
    'INSERT INTO users (name,role,pin,phone,pay_type,pay_rate,active) VALUES (?,\'juicer\',?,?,?,?,TRUE)',
    [name.trim(), pin, phone.trim(), payType, Number(payRate)]
  );
  res.status(201).json({ id: result.insertId, role: 'juicer', pin });
};

export const createKitchenStaff = async (req, res) => {
  const { portalRole } = req;
  if (!['admin', 'chef'].includes(portalRole)) return res.status(403).json({ message: 'Admin or Head Chef access required' });
  const {
    name, designation = 'Chef', phone = '', specialization = '',
    payType = 'monthly', payRate = 0, joinedOn = null, notes = '',
    createdBy = portalRole === 'admin' ? 'Admin' : 'Head Chef'
  } = req.body;
  if (!String(name || '').trim() || !String(designation || '').trim() || !['daily', 'monthly'].includes(payType)) {
    return res.status(400).json({ message: 'Chef name, designation, and Daily/Monthly salary basis are required' });
  }
  const [result] = await pool.query(
    'INSERT INTO kitchen_staff (name,designation,phone,specialization,pay_type,pay_rate,joined_on,notes,active,created_by) VALUES (?,?,?,?,?,?,?,?,TRUE,?)',
    [name.trim(), designation.trim(), phone.trim(), specialization.trim(), payType, Number(payRate), joinedOn || null, notes.trim(), createdBy]
  );
  res.status(201).json({ id: result.insertId });
};

export const updateKitchenStaff = async (req, res) => {
  const { portalRole } = req;
  if (!['admin', 'chef'].includes(portalRole)) return res.status(403).json({ message: 'Admin or Head Chef access required' });
  const {
    name, designation = 'Chef', phone = '', specialization = '',
    payType = 'monthly', payRate = 0, joinedOn = null, notes = '', active = true
  } = req.body;
  if (!String(name || '').trim() || !String(designation || '').trim() || !['daily', 'monthly'].includes(payType)) {
    return res.status(400).json({ message: 'Chef name, designation, and Daily/Monthly salary basis are required' });
  }
  const [result] = await pool.query(
    'UPDATE kitchen_staff SET name=?,designation=?,phone=?,specialization=?,pay_type=?,pay_rate=?,joined_on=?,notes=?,active=? WHERE id=?',
    [name.trim(), designation.trim(), phone.trim(), specialization.trim(), payType, Number(payRate), joinedOn || null, notes.trim(), !!active, req.params.id]
  );
  if (!result.affectedRows) return res.status(404).json({ message: 'Kitchen staff member not found' });
  res.json({ ok: true });
};

export const deleteKitchenStaff = async (req, res) => {
  const { portalRole } = req;
  if (!['admin', 'chef'].includes(portalRole)) return res.status(403).json({ message: 'Admin or Head Chef access required' });
  const [result] = await pool.query('DELETE FROM kitchen_staff WHERE id=?', [req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ message: 'Kitchen staff member not found' });
  res.json({ ok: true });
};

export const adminCheckInStaff = async (req, res) => {
  const { portalRole } = req;
  if (portalRole !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  const [[staff]] = await pool.query('SELECT id FROM users WHERE id=? AND active=TRUE', [req.params.id]);
  if (!staff) return res.status(404).json({ message: 'Active staff member not found' });
  const [[open]] = await pool.query('SELECT id FROM staff_attendance WHERE user_id=? AND check_out IS NULL', [req.params.id]);
  if (open) return res.status(409).json({ message: 'Staff member is already checked in' });
  const [result] = await pool.query(
    'INSERT INTO staff_attendance (user_id,check_in,notes) VALUES (?,NOW(),?)',
    [req.params.id, req.body.notes || '']
  );
  res.status(201).json({ id: result.insertId });
};

export const adminCheckOutStaff = async (req, res) => {
  const { portalRole } = req;
  if (portalRole !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  const [[shift]] = await pool.query(
    'SELECT id FROM staff_attendance WHERE user_id=? AND check_out IS NULL ORDER BY check_in DESC LIMIT 1',
    [req.params.id]
  );
  if (!shift) return res.status(409).json({ message: 'No active check-in found' });
  await pool.query(
    'UPDATE staff_attendance SET check_out=NOW(),notes=(CASE WHEN ?=\'\' THEN notes ELSE ? END) WHERE id=?',
    [req.body.notes || '', req.body.notes || '', shift.id]
  );
  res.json({ ok: true });
};
