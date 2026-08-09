-- KnockOUT Hospitality OS - MariaDB 11.4 structure-only schema
-- Contains database and table definitions only. No records are inserted.
--
-- Run this file once as a MariaDB root/administrative user, for example:
--   mariadb -u root -p < knockout-production.sql
-- or import it from phpMyAdmin.
--
SET NAMES utf8mb4;
SET time_zone = '+05:30';

CREATE DATABASE IF NOT EXISTS `knockout_master`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS `knockout`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `knockout_master`;

CREATE TABLE IF NOT EXISTS master_users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  pin VARCHAR(20) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_master_users_pin (pin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS companies (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_name VARCHAR(160) NOT NULL,
  database_name VARCHAR(64) NOT NULL,
  admin_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL DEFAULT '',
  phone VARCHAR(30) NOT NULL DEFAULT '',
  status ENUM('active','suspended') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_companies_name (company_name),
  UNIQUE KEY uq_companies_database (database_name),
  KEY idx_companies_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

USE `knockout`;

CREATE TABLE IF NOT EXISTS settings (
  id INT NOT NULL DEFAULT 1,
  hotel_name VARCHAR(120) NOT NULL,
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 5.00,
  service_charge DECIMAL(5,2) NOT NULL DEFAULT 5.00,
  currency VARCHAR(8) NOT NULL DEFAULT 'INR',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  role ENUM('admin','waiter','chef','juicer') NOT NULL,
  pin VARCHAR(20) NOT NULL,
  phone VARCHAR(30) NOT NULL DEFAULT '',
  pay_type ENUM('daily','monthly') NOT NULL DEFAULT 'monthly',
  pay_rate DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_pin (pin),
  KEY idx_users_role_active (role, active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS kitchen_staff (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  designation VARCHAR(100) NOT NULL DEFAULT 'Chef',
  phone VARCHAR(30) NOT NULL DEFAULT '',
  specialization VARCHAR(120) NOT NULL DEFAULT '',
  pay_type ENUM('daily','monthly') NOT NULL DEFAULT 'monthly',
  pay_rate DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  joined_on DATE NULL,
  notes VARCHAR(255) NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by VARCHAR(120) NOT NULL DEFAULT 'Head Chef',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_kitchen_staff_active (active),
  KEY idx_kitchen_staff_joined (joined_on)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS staff_attendance (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  check_in DATETIME NOT NULL,
  check_out DATETIME NULL,
  notes VARCHAR(255) NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_attendance_user_checkin (user_id, check_in),
  KEY idx_attendance_open_shift (user_id, check_out),
  CONSTRAINT fk_attendance_user
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS restaurant_tables (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  table_number INT NOT NULL,
  seats INT NOT NULL,
  area VARCHAR(80) NOT NULL,
  status ENUM('available','occupied','reserved','cleaning')
    NOT NULL DEFAULT 'available',
  guest_name VARCHAR(120) NOT NULL DEFAULT '',
  booking_time VARCHAR(10) NOT NULL DEFAULT '',
  order_id INT UNSIGNED NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id),
  UNIQUE KEY uq_restaurant_table_number (table_number),
  KEY idx_restaurant_tables_status (active, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS menu_items (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(160) NOT NULL,
  category VARCHAR(80) NOT NULL,
  description VARCHAR(500) NOT NULL DEFAULT '',
  price DECIMAL(10,2) NOT NULL,
  production_status ENUM('new','preparing','ready') NOT NULL DEFAULT 'new',
  icon VARCHAR(20) NOT NULL DEFAULT '🍽️',
  image_url VARCHAR(500) NULL,
  image_object VARCHAR(255) NULL,
  is_combo BOOLEAN NOT NULL DEFAULT FALSE,
  available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_menu_category_available (category, available),
  KEY idx_menu_combo (is_combo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS combo_components (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  combo_id INT UNSIGNED NOT NULL,
  menu_id INT UNSIGNED NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_combo_component (combo_id, menu_id),
  KEY idx_combo_component_menu (menu_id),
  CONSTRAINT fk_combo_component_combo
    FOREIGN KEY (combo_id) REFERENCES menu_items(id) ON DELETE CASCADE,
  CONSTRAINT fk_combo_component_menu
    FOREIGN KEY (menu_id) REFERENCES menu_items(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  table_id INT UNSIGNED NULL,
  order_type ENUM('dine_in','parcel') NOT NULL DEFAULT 'dine_in',
  guest_name VARCHAR(120) NULL,
  customer_phone VARCHAR(30) NOT NULL DEFAULT '',
  waiter VARCHAR(120) NULL,
  status ENUM('new','preparing','ready','served','billing_requested','completed')
    NOT NULL DEFAULT 'new',
  payment_status ENUM('unpaid','paid') NOT NULL DEFAULT 'unpaid',
  payment_method VARCHAR(30) NULL,
  subtotal DECIMAL(10,2) NULL,
  tax DECIMAL(10,2) NULL,
  service_charge DECIMAL(10,2) NULL,
  total DECIMAL(10,2) NULL,
  created_at DATETIME NOT NULL,
  completed_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_orders_table_status (table_id, status),
  KEY idx_orders_type_status (order_type, status),
  KEY idx_orders_payment_completed (payment_status, completed_at),
  KEY idx_orders_created (created_at),
  CONSTRAINT fk_order_table
    FOREIGN KEY (table_id) REFERENCES restaurant_tables(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id INT UNSIGNED NOT NULL,
  menu_id INT UNSIGNED NOT NULL,
  quantity INT NOT NULL,
  note VARCHAR(255) NOT NULL DEFAULT '',
  price DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_order_items_order (order_id),
  KEY idx_order_items_menu (menu_id),
  CONSTRAINT fk_order_item_order
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_item_menu
    FOREIGN KEY (menu_id) REFERENCES menu_items(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inventory (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(160) NOT NULL,
  category VARCHAR(80) NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  unit VARCHAR(20) NOT NULL,
  min_quantity DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_inventory_category (category),
  KEY idx_inventory_stock_level (quantity, min_quantity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inventory_transactions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  inventory_id INT UNSIGNED NOT NULL,
  movement_type ENUM('purchase','usage','adjustment','waste') NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_cost DECIMAL(10,2) NULL,
  note VARCHAR(255) NOT NULL DEFAULT '',
  created_by VARCHAR(120) NOT NULL DEFAULT 'Admin',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_inventory_tx_item_date (inventory_id, created_at),
  KEY idx_inventory_tx_type_date (movement_type, created_at),
  CONSTRAINT fk_inventory_tx_item
    FOREIGN KEY (inventory_id) REFERENCES inventory(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS finance_entries (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  entry_type ENUM('income','expense') NOT NULL,
  category VARCHAR(100) NOT NULL,
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_method VARCHAR(40) NOT NULL DEFAULT 'Cash',
  entry_date DATE NOT NULL,
  reference VARCHAR(100) NOT NULL DEFAULT '',
  created_by VARCHAR(120) NOT NULL DEFAULT 'Admin',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_finance_date_type (entry_date, entry_type),
  KEY idx_finance_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS supplier_purchases (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  supplier_name VARCHAR(160) NOT NULL,
  invoice_number VARCHAR(100) NOT NULL DEFAULT '',
  description VARCHAR(255) NOT NULL,
  purchase_date DATE NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  notes VARCHAR(255) NOT NULL DEFAULT '',
  created_by VARCHAR(120) NOT NULL DEFAULT 'Admin',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_supplier_purchase_date (purchase_date),
  KEY idx_supplier_name (supplier_name),
  KEY idx_supplier_invoice (invoice_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS supplier_payments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  purchase_id INT UNSIGNED NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_method VARCHAR(40) NOT NULL DEFAULT 'Cash',
  payment_date DATE NOT NULL,
  reference VARCHAR(100) NOT NULL DEFAULT '',
  notes VARCHAR(255) NOT NULL DEFAULT '',
  created_by VARCHAR(120) NOT NULL DEFAULT 'Admin',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_supplier_payment_purchase (purchase_id),
  KEY idx_supplier_payment_date (payment_date),
  CONSTRAINT fk_supplier_payment_purchase
    FOREIGN KEY (purchase_id) REFERENCES supplier_purchases(id)
      ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bookings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  table_id INT UNSIGNED NOT NULL,
  guest_name VARCHAR(120) NOT NULL DEFAULT 'Customer',
  customer_phone VARCHAR(30) NOT NULL DEFAULT '',
  booking_date DATE NOT NULL,
  booking_time VARCHAR(10) NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 90,
  status ENUM('confirmed','seated','cancelled') NOT NULL DEFAULT 'confirmed',
  notification_status ENUM('queued','sent','failed') NOT NULL DEFAULT 'queued',
  notification_message VARCHAR(500) NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY booking_slot (table_id, booking_date, status),
  KEY idx_booking_upcoming (status, booking_date, booking_time),
  CONSTRAINT fk_booking_table
    FOREIGN KEY (table_id) REFERENCES restaurant_tables(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
