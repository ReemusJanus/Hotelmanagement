export const initialData = {
  tables: Array.from({length: 18}, (_, index) => ({
    id: index + 1,
    number: index + 1,
    seats: [2, 4, 4, 6, 2, 4][index % 6],
    area: index < 12 ? 'Main Hall' : 'Terrace',
    status: index === 2 || index === 7 ? 'reserved' : index === 3 || index === 8 || index === 11 ? 'occupied' : 'available',
    guestName: index === 2 ? 'Ananya Rao' : index === 7 ? 'Karan Shah' : index === 3 ? 'Walk-in Guest' : index === 8 ? 'Meera Nair' : index === 11 ? 'Rahul Jain' : '',
    bookingTime: index === 2 ? '20:00' : index === 7 ? '20:30' : '',
    orderId: index === 3 ? 1001 : index === 8 ? 1002 : index === 11 ? 1003 : null
  })),
  menu: [
    {id: 1, name: 'Truffle Mushroom Soup', category: 'Starters', price: 320, icon: '🍲', available: true},
    {id: 2, name: 'Burrata Garden Salad', category: 'Starters', price: 440, icon: '🥗', available: true},
    {id: 3, name: 'Tandoori Paneer', category: 'Starters', price: 390, icon: '🍢', available: true},
    {id: 4, name: 'Herb Roasted Chicken', category: 'Mains', price: 680, icon: '🍗', available: true},
    {id: 5, name: 'Forest Mushroom Risotto', category: 'Mains', price: 570, icon: '🍚', available: true},
    {id: 6, name: 'Coastal Fish Curry', category: 'Mains', price: 720, icon: '🍛', available: true},
    {id: 7, name: 'Paneer Butter Masala', category: 'Mains', price: 520, icon: '🥘', available: true},
    {id: 8, name: 'Classic Tiramisu', category: 'Desserts', price: 350, icon: '🍰', available: true},
    {id: 9, name: 'Chocolate Fondant', category: 'Desserts', price: 390, icon: '🍫', available: true},
    {id: 10, name: 'Virgin Mojito', category: 'Beverages', price: 220, icon: '🍹', available: true},
    {id: 11, name: 'Cold Brew Tonic', category: 'Beverages', price: 260, icon: '☕', available: true},
    {id: 12, name: 'Butter Naan', category: 'Sides', price: 95, icon: '🫓', available: true}
  ],
  orders: [
    {id: 1001, tableId: 4, guestName: 'Walk-in Guest', waiter: 'Ravi', status: 'preparing', createdAt: new Date(Date.now()-22*60000).toISOString(), items: [{menuId: 3, qty: 2, note: 'Medium spicy'}, {menuId: 7, qty: 1, note: ''}, {menuId: 12, qty: 4, note: ''}], paymentStatus: 'unpaid'},
    {id: 1002, tableId: 9, guestName: 'Meera Nair', waiter: 'Priya', status: 'ready', createdAt: new Date(Date.now()-31*60000).toISOString(), items: [{menuId: 2, qty: 1, note: ''}, {menuId: 5, qty: 2, note: 'No garlic'}], paymentStatus: 'unpaid'},
    {id: 1003, tableId: 12, guestName: 'Rahul Jain', waiter: 'Ravi', status: 'new', createdAt: new Date(Date.now()-8*60000).toISOString(), items: [{menuId: 1, qty: 2, note: ''}, {menuId: 4, qty: 2, note: ''}], paymentStatus: 'unpaid'}
  ],
  inventory: [
    {id: 1, name: 'Basmati Rice', category: 'Grains', quantity: 42, unit: 'kg', min: 15, cost: 110},
    {id: 2, name: 'Chicken Breast', category: 'Meat', quantity: 8, unit: 'kg', min: 12, cost: 310},
    {id: 3, name: 'Wild Mushrooms', category: 'Vegetables', quantity: 5, unit: 'kg', min: 6, cost: 620},
    {id: 4, name: 'Cooking Cream', category: 'Dairy', quantity: 18, unit: 'L', min: 8, cost: 180},
    {id: 5, name: 'Arabica Coffee', category: 'Beverages', quantity: 14, unit: 'kg', min: 5, cost: 840},
    {id: 6, name: 'Paneer', category: 'Dairy', quantity: 7, unit: 'kg', min: 8, cost: 360}
  ],
  users: [
    {id: 1, name: 'Arjun Kumar', role: 'admin', pin: '1234'},
    {id: 2, name: 'Ravi Sharma', role: 'waiter', pin: '1111'},
    {id: 3, name: 'Chef Kabir', role: 'chef', pin: '2222'}
  ],
  settings: {hotelName: 'Olive & Oak', taxRate: 2.5, cgstRate: 2.5, serviceCharge: 18, currency: 'INR'}
};
