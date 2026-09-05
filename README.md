# KnockOUT — Restaurant Management Suite

For the complete functional, integration, billing, printing, API, database, mobile, and regression test plan, see [TESTING_GUIDE.md](./TESTING_GUIDE.md).

A yellow-and-dark, multi-company hospitality platform with one unified React frontend:

| Module | Demo PIN | Responsibilities |
|---|---:|---|
| Admin Panel | `1234` | Dashboard, tables, every order and bill, food photos, stock, staff, and settings |
| Waiter Panel | `1111` | Table count, bookings, orders, table-level bills, and payment |
| Chef Panel | `2222` | New, preparing, ready, and collected kitchen queues |

## Parcel workflow

1. Admin opens **Parcel Orders** and records the customer and food items.
2. The order is sent to the Chef's separate **Parcel Queue**.
3. Chef marks it **Preparing**, then **Ready for Admin**.
4. The ready parcel returns to Admin for handoff and Cash/Card/UPI payment.

Parcel orders are stored separately from dine-in orders and never occupy a table.

## Menu and combo management

Admin's **Food & Photos** panel provides:

- Add dishes, juices, desserts, sides, and specials
- Customize item name, category, description, icon, amount, availability, and MinIO photo
- Build combo offers from any number of dishes and juices
- Set an individual quantity for every combo component
- Set a custom combo name, description, icon, photo, and selling amount

Combos appear as sellable items in Waiter and Parcel ordering. Chef tickets show the included items and their quantities.

## Staff and attendance

Admin's **Staff** panel supports:

- Create and customize Admin, Waiter, and Chef login accounts
- Assign a unique portal PIN, phone, pay type, and pay amount
- Enable or disable staff access
- Waiters check themselves in/out from the Waiter portal
- Chefs check themselves in/out from the Chef portal
- Admin monitors currently on-duty staff and live working duration
- View daily working hours and complete shift history

New PINs become active immediately in the assigned role's portal.

Attendance actions are role-secured: a staff member can only record attendance through their assigned portal. Admin attendance is read-only and updates automatically from Waiter and Chef activity.

## iOS and Android apps

The `mobile/` Expo project produces one native **KnockOUT** app (`com.knockout.hospitality`) for iOS and Android. Its opening screen lets the user select:

- **Admin:** overview, live tables, all orders, menu, staff, and attendance monitoring
- **Waiter:** attendance, tables, ordering, bookings, add-on orders, and table status
- **Chef:** attendance, dine-in kitchen, parcel queue, and ready orders

Each role uses an animated four-digit OTP/PIN verification screen before its workspace opens.

See `mobile/README.md` for simulator, device, and EAS App Store/Play Store build commands.

## Architecture

- One React + Vite frontend for every role
- NestJS 11 backend with an Express compatibility adapter
- MariaDB 11.4 for all operational data
- MinIO object storage for food photos
- Docker Compose with persistent MariaDB and MinIO volumes

## Start the platform

```bash
docker compose up -d --build
```

## Addresses

- Unified frontend: <http://localhost:5200>
- Master NestJS API: <http://localhost:5100>
- Master framework health: <http://localhost:5100/api/framework>
- Admin, Waiter, Chef, and Juicer backends remain isolated inside Docker
- MariaDB: `localhost:3307`
- MinIO API: <http://localhost:9100>
- MinIO console: <http://localhost:9101>

MinIO console credentials:

- Username: `knockout`
- Password: `knockout_secret`

MariaDB credentials:

- Database: `knockout`
- Username: `knockout`
- Password: `knockout_pass`

The API automatically creates the relational schema, seeds demo content on an empty database, creates the `food-images` bucket, and configures public read access for menu photos.

The browser connects only to the unified frontend and Master API. The Master API resolves each six-digit PIN and securely routes requests to the correct company and role backend.

## Persistent data

Docker volumes retain data across container restarts:

- `knockout_mariadb`
- `knockout_minio`

Stop services without deleting data:

```bash
docker compose down
```
