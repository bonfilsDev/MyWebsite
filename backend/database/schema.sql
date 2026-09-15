-- Stream Pharmacy - Node.js/MySQL schema
CREATE DATABASE IF NOT EXISTS stream_pharmacy;
USE stream_pharmacy;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fullname VARCHAR(100) NOT NULL,
    email VARCHAR(100) NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'cashier') NOT NULL DEFAULT 'cashier',
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Idempotent migration: add email to users if missing
DROP PROCEDURE IF EXISTS add_user_email;
DELIMITER $$
CREATE PROCEDURE add_user_email()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'email'
    ) THEN
        ALTER TABLE users ADD COLUMN email VARCHAR(100) NULL AFTER fullname;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND INDEX_NAME = 'email'
    ) THEN
        ALTER TABLE users ADD UNIQUE INDEX email (email);
    END IF;
END$$
DELIMITER ;
CALL add_user_email();
DROP PROCEDURE add_user_email;

CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'system',
    message VARCHAR(255) NOT NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS shifts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(20) NOT NULL
);

INSERT IGNORE INTO shifts (id, name) VALUES (1, 'Morning'), (2, 'Evening'), (3, 'Night');

CREATE TABLE IF NOT EXISTS daily_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cashier_id INT NOT NULL,
    report_date DATE NOT NULL,
    shift_id INT NOT NULL,
    cash DECIMAL(12,2) DEFAULT 0.00,
    momo DECIMAL(12,2) DEFAULT 0.00,
    credit DECIMAL(12,2) DEFAULT 0.00,
    pos DECIMAL(12,2) DEFAULT 0.00,
    ekashi DECIMAL(12,2) DEFAULT 0.00,
    balance DECIMAL(12,2) DEFAULT 0.00,
    total DECIMAL(12,2) GENERATED ALWAYS AS (cash + momo + credit + pos + ekashi) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cashier_id) REFERENCES users(id),
    FOREIGN KEY (shift_id) REFERENCES shifts(id)
);

CREATE TABLE IF NOT EXISTS insurance_companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

INSERT IGNORE INTO insurance_companies (name) VALUES
('RSSB'), ('OLDMUTUAL'), ('PRIME INSURANCE'), ('RADIANT'), ('SANLAM'),
('EDEN CARE'), ('BRITAM'), ('UBUZIMA BWIZA FOUNDATION'), ('MMI'), ('EQUITY');

CREATE TABLE IF NOT EXISTS insurance_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cashier_id INT NOT NULL,
    insurance_id INT NOT NULL,
    record_date DATE NOT NULL,
    shift_id INT NULL,
    client_name VARCHAR(150) DEFAULT '',
    beneficiary_percent DECIMAL(12,2) DEFAULT 0.00,
    amount DECIMAL(12,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cashier_id) REFERENCES users(id),
    FOREIGN KEY (insurance_id) REFERENCES insurance_companies(id),
    FOREIGN KEY (shift_id) REFERENCES shifts(id)
);

-- Idempotent migration for existing databases (MySQL 5.7+ safe)
DROP PROCEDURE IF EXISTS add_insurance_columns;
DELIMITER $$
CREATE PROCEDURE add_insurance_columns()
BEGIN
    IF EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'insurance_records' AND COLUMN_NAME = 'place'
    ) THEN
        ALTER TABLE insurance_records DROP COLUMN place;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'insurance_records' AND COLUMN_NAME = 'beneficiary_percent'
    ) THEN
        ALTER TABLE insurance_records ADD COLUMN beneficiary_percent DECIMAL(12,2) DEFAULT 0.00 AFTER client_name;
    ELSE
        ALTER TABLE insurance_records MODIFY COLUMN beneficiary_percent DECIMAL(12,2) DEFAULT 0.00;
    END IF;
END$$
DELIMITER ;
CALL add_insurance_columns();
DROP PROCEDURE add_insurance_columns;

CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cashier_id INT NOT NULL,
    expense_number VARCHAR(50),
    expense_date DATE NOT NULL,
    reason VARCHAR(255) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    way VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cashier_id) REFERENCES users(id)
);

    CREATE TABLE IF NOT EXISTS purchases (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cashier_id INT NOT NULL,
        purchase_date DATE NOT NULL,
        shift_id INT NULL,
        payment_type ENUM('cash', 'credit') NOT NULL DEFAULT 'cash',
        amount DECIMAL(12,2) DEFAULT 0.00,
        invoice_number VARCHAR(100),
        supplier_name VARCHAR(150),
        status ENUM('unpaid', 'paid') NOT NULL DEFAULT 'unpaid',
        datepaid DATETIME DEFAULT NULL,
        amount_paid DECIMAL(12,2) DEFAULT 0.00,
        place VARCHAR(150) DEFAULT '',
        remain DECIMAL(12,2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cashier_id) REFERENCES users(id),
        FOREIGN KEY (shift_id) REFERENCES shifts(id)
    );

-- Idempotent migration for existing databases: add status + datepaid columns if missing
DROP PROCEDURE IF EXISTS add_purchase_columns;
DELIMITER $$
CREATE PROCEDURE add_purchase_columns()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchases' AND COLUMN_NAME = 'status'
    ) THEN
        ALTER TABLE purchases ADD COLUMN status ENUM('unpaid', 'paid') NOT NULL DEFAULT 'unpaid' AFTER supplier_name;
    ELSE
        ALTER TABLE purchases MODIFY COLUMN status ENUM('unpaid', 'paid') NOT NULL DEFAULT 'unpaid';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchases' AND COLUMN_NAME = 'datepaid'
    ) THEN
        ALTER TABLE purchases ADD COLUMN datepaid DATETIME DEFAULT NULL AFTER status;
    ELSE
        ALTER TABLE purchases MODIFY COLUMN datepaid DATETIME DEFAULT NULL;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchases' AND COLUMN_NAME = 'amount_paid'
    ) THEN
        ALTER TABLE purchases ADD COLUMN amount_paid DECIMAL(12,2) DEFAULT 0.00 AFTER datepaid;
    ELSE
        ALTER TABLE purchases MODIFY COLUMN amount_paid DECIMAL(12,2) DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchases' AND COLUMN_NAME = 'place'
    ) THEN
        ALTER TABLE purchases ADD COLUMN place VARCHAR(150) DEFAULT '' AFTER amount_paid;
    ELSE
        ALTER TABLE purchases MODIFY COLUMN place VARCHAR(150) DEFAULT '';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchases' AND COLUMN_NAME = 'remain'
    ) THEN
        ALTER TABLE purchases ADD COLUMN remain DECIMAL(12,2) DEFAULT 0.00 AFTER place;
    ELSE
        ALTER TABLE purchases MODIFY COLUMN remain DECIMAL(12,2) DEFAULT 0.00;
    END IF;
END$$
DELIMITER ;
CALL add_purchase_columns();
DROP PROCEDURE add_purchase_columns;

-- Idempotent migration: add shift_id column + FK to purchases if missing
DROP PROCEDURE IF EXISTS add_purchase_shift;
DELIMITER $$
CREATE PROCEDURE add_purchase_shift()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchases' AND COLUMN_NAME = 'shift_id'
    ) THEN
        ALTER TABLE purchases ADD COLUMN shift_id INT NULL AFTER purchase_date;
    ELSE
        ALTER TABLE purchases MODIFY COLUMN shift_id INT NULL;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchases' AND CONSTRAINT_NAME = 'purchases_ibfk_2'
    ) THEN
        ALTER TABLE purchases ADD CONSTRAINT purchases_ibfk_2 FOREIGN KEY (shift_id) REFERENCES shifts(id);
    END IF;
END$$
DELIMITER ;
CALL add_purchase_shift();
DROP PROCEDURE add_purchase_shift;

CREATE TABLE IF NOT EXISTS cashouts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cashier_id INT NOT NULL,
    cashout_date DATE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    account VARCHAR(100),
    person_or_reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cashier_id) REFERENCES users(id)
);

INSERT IGNORE INTO users (fullname, username, password, role) VALUES
('Administrator', 'admin', '$2a$10$e31u61KyyVNdpuLsvaj0geSmGEEtusnrYmHgExdh7kE6tqqBPtVlO', 'admin');

CREATE USER IF NOT EXISTS 'pharmacy_user'@'localhost' IDENTIFIED BY 'pharmacy_pass_2026';
GRANT ALL PRIVILEGES ON stream_pharmacy.* TO 'pharmacy_user'@'localhost';
FLUSH PRIVILEGES;
