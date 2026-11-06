import crypto from 'node:crypto';

export const validTenant = value => /^(?:knockout(?:_[0-9]+)?|tenant_[a-z][a-z0-9_]{1,54})$/.test(String(value || ''));

export const ident = value => {
  const clean = String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  if (!/^[a-z][a-z0-9_]{1,54}$/.test(clean)) {
    throw Object.assign(new Error('Hotel name cannot be converted to a valid database name'), { status: 400 });
  }
  return clean;
};

export const tenantDatabaseName = value => `tenant_${ident(value)}`;

export const defaultModules = {
  tables: true,
  bookings: true,
  billing: true,
  parcels: true,
  menu: true,
  stock: true,
  finance: true,
  staff: true,
  kitchen: true,
  juicer: true
};

export const moduleCatalog = {
  tables: ['Tables & Waiters', 499],
  bookings: ['Table Bookings', 299],
  billing: ['Orders & Billing', 699],
  parcels: ['Parcel Orders', 399],
  menu: ['Food & Photos', 299],
  stock: ['Stock Management', 499],
  finance: ['Finance Management', 599],
  staff: ['Staff Management', 399],
  kitchen: ['Chef Portal', 499],
  juicer: ['Juicer Portal', 299]
};

export const packages = {
  starter: ['tables', 'billing', 'menu', 'kitchen'],
  growth: ['tables', 'bookings', 'billing', 'parcels', 'menu', 'stock', 'kitchen'],
  complete: Object.keys(defaultModules)
};

export const parseModules = value => {
  try {
    return { ...defaultModules, ...(typeof value === 'string' ? JSON.parse(value) : value || {}) };
  } catch {
    return { ...defaultModules };
  }
};

export const randomDigits = length => Array.from({ length }, () => crypto.randomInt(0, 10)).join('');

const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');

export function getSessionSecret() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const pass = process.env.DB_PASSWORD || 'knockout_pass';
  const masterDb = process.env.MASTER_DB_NAME || 'knockout_master';
  return process.env.MASTER_SESSION_SECRET || `${pass}:${masterDb}:knockout-session`;
}

export function issuePortalToken(user) {
  const sessionSecret = getSessionSecret();
  const payload = encode({
    id: user.id,
    role: user.role,
    companyDatabase: user.companyDatabase,
    exp: Date.now() + 12 * 60 * 60 * 1000
  });
  const signature = crypto.createHmac('sha256', sessionSecret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function verifyPortalToken(value) {
  try {
    const sessionSecret = getSessionSecret();
    const [payload, signature] = String(value || '').replace(/^Bearer\s+/i, '').split('.');
    const expected = crypto.createHmac('sha256', sessionSecret).update(payload).digest('base64url');
    if (!signature || signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return null;
    }
    const data = JSON.parse(Buffer.from(payload, 'base64url'));
    const validRole = ['admin', 'waiter', 'chef', 'juicer', 'superadmin'].includes(data.role);
    const validCompany = data.role === 'superadmin' || validTenant(data.companyDatabase);
    return data.exp > Date.now() && validRole && validCompany ? data : null;
  } catch {
    return null;
  }
}
