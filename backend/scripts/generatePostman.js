import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const postmanDir = path.join(__dirname, '../postman');
if (!fs.existsSync(postmanDir)) {
  fs.mkdirSync(postmanDir, { recursive: true });
}

const baseUrl = "{{base_url}}";

const endpoints = [
  { name: 'Health Check', method: 'GET', path: '/api/health' },
  { name: 'Get App State', method: 'GET', path: '/api/state' },
  { name: 'Login', method: 'POST', path: '/api/login', body: '{"pin": "1234"}' },
  { name: 'Create Booking', method: 'POST', path: '/api/bookings', body: '{"tableId": 1, "guestName": "John", "bookingTime": "20:00"}' },
  { name: 'Create Order', method: 'POST', path: '/api/orders', body: '{"tableId": 1, "items": [{"menuId": 1, "qty": 2}]}' },
  { name: 'Add Order Items', method: 'POST', path: '/api/orders/1/items', body: '{"items": [{"menuId": 2, "qty": 1}]}' },
  { name: 'Request Bill', method: 'POST', path: '/api/orders/1/request-bill' },
  { name: 'Finalize Order', method: 'POST', path: '/api/orders/1/finalize', body: '{"paymentMethod": "Cash"}' },
  { name: 'Get Order Bill', method: 'GET', path: '/api/orders/1/bill' },
  { name: 'Create Parcel', method: 'POST', path: '/api/parcels', body: '{"customerName": "Doe", "items": [{"menuId": 1, "qty": 1}]}' },
  { name: 'Update Table Status', method: 'PATCH', path: '/api/tables/1/status', body: '{"status": "cleaning"}' },
  { name: 'Create Table', method: 'POST', path: '/api/tables', body: '{"number": 19, "seats": 4, "area": "Main Hall"}' },
  { name: 'Delete Table', method: 'DELETE', path: '/api/tables/1' },
  { name: 'Add Inventory', method: 'POST', path: '/api/inventory', body: '{"name": "Rice", "unit": "kg", "quantity": 10}' },
  { name: 'Delete Inventory', method: 'DELETE', path: '/api/inventory/1' },
  { name: 'Record Finance', method: 'POST', path: '/api/finance', body: '{"entryType": "expense", "category": "Utilities", "description": "Electric Bill", "amount": 5000, "entryDate": "2023-10-01"}' },
  { name: 'Record Supplier Purchase', method: 'POST', path: '/api/supplier-purchases', body: '{"supplierName": "Fresh Veggies", "description": "Vegetables", "purchaseDate": "2023-10-01", "totalAmount": 2500}' },
  { name: 'Update Settings', method: 'PUT', path: '/api/settings', body: '{"hotelName": "KnockOUT", "taxRate": 5, "serviceCharge": 5, "currency": "INR"}' },
  { name: 'Staff Check-In', method: 'POST', path: '/api/attendance/1/check-in', body: '{"notes": "On time"}' },
  { name: 'Staff Check-Out', method: 'POST', path: '/api/attendance/1/check-out', body: '{"notes": "Leaving"}' },
  { name: 'Add Menu Item', method: 'POST', path: '/api/menu', body: '{"name": "Burger", "category": "Fast Food", "price": 150}' },
  { name: 'Add Combo', method: 'POST', path: '/api/combos', body: '{"name": "Burger Meal", "price": 250, "components": [{"menuId": 1, "quantity": 1}]}' }
];

const collection = {
  info: {
    name: 'Hotel Management API',
    description: 'Auto-generated Postman Collection for Hotel Management',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
  },
  item: endpoints.map(ep => {
    const item = {
      name: ep.name,
      request: {
        method: ep.method,
        header: [],
        url: {
          raw: `${baseUrl}${ep.path}`,
          host: [baseUrl],
          path: ep.path.split('/').filter(Boolean)
        }
      }
    };
    if (ep.body) {
      item.request.header.push({ key: 'Content-Type', value: 'application/json' });
      item.request.body = {
        mode: 'raw',
        raw: ep.body,
        options: { raw: { language: 'json' } }
      };
    }
    return item;
  }),
  variable: [
    {
      key: 'base_url',
      value: 'http://localhost:4000',
      type: 'string'
    }
  ]
};

const outputPath = path.join(postmanDir, 'HotelManagement_Collection.json');
fs.writeFileSync(outputPath, JSON.stringify(collection, null, 2));
console.log(`\x1b[32mSuccessfully generated Postman collection at:\n${outputPath}\x1b[0m`);
