import { CupSoda, Armchair, CalendarDays, UtensilsCrossed, ChefHat, Package, ReceiptText, Boxes, ChartNoAxesCombined, Users } from 'lucide-react';

export const stories = [
  { id: 'arrival', label: 'The welcome', title: 'Every great experience begins with a welcome.', caption: 'Know what’s available. Welcome every guest with confidence.', icon: CalendarDays, tags: ['Table availability', 'Reservations', 'Table assignment'], note: 'A reservation becomes the beginning of a service.' },
  { id: 'floor', label: 'The floor', title: 'Every table. Perfectly connected.', caption: 'A clear view of your floor. A place for every guest.', icon: Armchair, tags: ['Floor management', 'Table status', 'Seating coordination'], note: 'Available → occupied. Your team sees the next step.' },
  { id: 'order', label: 'The order', title: 'From table to kitchen. Instantly.', caption: 'Take the order. Keep the conversation. Let the right station take it from here.', icon: UtensilsCrossed, tags: ['Digital menu', 'Order rounds', 'Live updates'], note: 'Food to the kitchen. Drinks to the juice station.' },
  { id: 'kitchen', label: 'The kitchen', title: 'One kitchen. Perfect coordination.', caption: 'New. Preparing. Ready. Every handoff has its place.', icon: ChefHat, tags: ['Chef workflow', 'Juice preparation', 'Collection & receipt'], note: 'Chef confirms collection. Waiter confirms receipt.' },
  { id: 'juice', label: 'The juice station', title: 'Freshly prepared. Perfectly timed.', caption: 'A dedicated drink queue keeps the juice station in step with the kitchen.', icon: CupSoda, tags: ['Drink tickets', 'Preparation status', 'Waiter handoff'], note: 'Prepare the drink, mark it ready and confirm collection.' },
  { id: 'takeaway', label: 'Beyond the table', title: 'Great service goes beyond the table.', caption: 'The same care. A different destination. Follow every parcel to collection.', icon: Package, tags: ['Parcel orders', 'Preparation tracking', 'Pickup'], note: 'Prepared, packed and ready for the next guest.' },
  { id: 'billing', label: 'The close', title: 'Every payment. Effortlessly managed.', caption: 'Bring the service to a graceful close. Keep the financial record clear.', icon: ReceiptText, tags: ['Billing', 'Payment recording', 'Order settlement'], note: 'Admin records payment. The table moves to cleaning.' },
  { id: 'inventory', label: 'Behind the scenes', title: 'Every ingredient. Accounted for.', caption: 'Record what you use. Know what remains. Replenish with context.', icon: Boxes, tags: ['Stock movements', 'Kitchen requests', 'Supplier purchases'], note: 'Recorded usage connects service to stock. No automatic recipe deduction.' },
  { id: 'analytics', label: 'The bigger picture', title: 'See the bigger picture.', caption: 'From a single service to the shape of your business. Make room for a clearer view.', icon: ChartNoAxesCombined, tags: ['Sales reports', 'Expenses', 'Business visibility'], note: 'Review daily finances and export monthly revenue reports.' },
  { id: 'connected', label: 'Your people', title: 'One platform. Every role. Perfectly connected.', caption: 'Focused tools for each person. A shared picture for the whole team.', icon: Users, tags: ['Role-based workspaces', 'Staff', 'Company administration'], note: 'One connected hospitality workspace.' },
];

export const modules = [
  ['Before service', 'Table bookings', 'Reserve a table, date and time. Keep the next welcome organised.'],
  ['Before service', 'Menu & combos', 'Manage dishes, drinks, photos, prices and availability.'],
  ['During service', 'Floor & orders', 'See table status and send each order round to the team.'],
  ['During service', 'Kitchen & juice', 'Dedicated queues for food and drink preparation.'],
  ['During service', 'Takeaway', 'Track parcel preparation, payment and collection.'],
  ['After service', 'Billing & receipts', 'Request a bill, record payment and print the receipt.'],
  ['After service', 'Finance & suppliers', 'Review income, expenses, purchases and outstanding payments.'],
  ['Behind the scenes', 'Stock & requests', 'Record usage, waste and adjustments. Follow kitchen stock requests.'],
  ['Behind the scenes', 'People & attendance', 'Manage staff accounts. Record shifts through the mobile app.'],
];

export const roles = [
  ['Administrator', 'The complete service, in view.', 'Tables, bookings, parcels, billing, stock and daily finances.'],
  ['Waiter', 'Stay close to your guests.', 'Build order rounds, follow handoffs and request the bill.'],
  ['Chef', 'Clarity at the pass.', 'Prepare food, mark it ready, confirm collection and request stock.'],
  ['Juicer', 'A station in its own rhythm.', 'See drink tickets, update preparation and manage availability.'],
  ['Restaurant staff', 'A workday, well recorded.', 'Mobile check-in, check-out and shift history for staff.'],
  ['Superadmin', 'Room for your next location.', 'Manage company access, subscriptions and enabled modules.'],
];

export const questions = [
  ['What does KnockOUT manage?', 'Restaurant tables and table bookings, dine-in and parcel orders, food and juice preparation, billing, menus, inventory, finance and staff operations.'],
  ['Is this a hotel room booking system?', 'The current product focuses on food-service operations. Reservations are for restaurant tables, not hotel rooms or guest stays.'],
  ['Can my team use it on mobile?', 'Yes. Web and mobile workspaces have role-specific tools. Some features differ by platform; staff attendance is available in the mobile app.'],
  ['Does stock reduce automatically when a dish is sold?', 'No. Inventory reflects recorded purchases, usage, waste and adjustments. The stock story illustrates a recorded usage movement, not an automatic recipe-based deduction.'],
  ['Can I record supplier payments and export reports?', 'Yes. Record supplier purchases and payments, review outstanding balances, and export daily finance or monthly revenue CSV reports.'],
  ['How do I get started?', 'Register your business and select a package. After review and approval, complete setup and receive your company login details.'],
];
