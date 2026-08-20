USE attendance_db;

-- Clear existing data (in order of foreign key dependency)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE attendance;
TRUNCATE TABLE company_location;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Insert Admin
INSERT INTO users (employee_code, name, email, password, phone, role, status)
VALUES (
    'EMP000',
    'System Admin',
    'admin@eclearnix.com',
    '$2a$10$1kyyr93DNdf7JnJBifb28epDHMGHxZ4u31H0d96t65kc2Ey.RgjK6', -- BCrypt hash of admin@123
    '1234567890',
    'ADMIN',
    'ACTIVE'
);

-- 2. Insert 5 Sample Employees
INSERT INTO users (employee_code, name, email, password, phone, role, status)
VALUES 
(
    'EMP001',
    'John Doe',
    'john@company.com',
    '$2b$12$Kq3vrnZt0xijZsI0PRcdk.bB9dp0IeiPXoJWYREqI0TD/NsLi4atq', -- BCrypt hash of Password@123
    '9876543210',
    'EMPLOYEE',
    'ACTIVE'
),
(
    'EMP002',
    'Jane Smith',
    'jane@company.com',
    '$2b$12$Kq3vrnZt0xijZsI0PRcdk.bB9dp0IeiPXoJWYREqI0TD/NsLi4atq', -- BCrypt hash of Password@123
    '9876543211',
    'EMPLOYEE',
    'ACTIVE'
),
(
    'EMP003',
    'Bob Johnson',
    'bob@company.com',
    '$2b$12$Kq3vrnZt0xijZsI0PRcdk.bB9dp0IeiPXoJWYREqI0TD/NsLi4atq', -- BCrypt hash of Password@123
    '9876543212',
    'EMPLOYEE',
    'ACTIVE'
),
(
    'EMP004',
    'Alice Williams',
    'alice@company.com',
    '$2b$12$Kq3vrnZt0xijZsI0PRcdk.bB9dp0IeiPXoJWYREqI0TD/NsLi4atq', -- BCrypt hash of Password@123
    '9876543213',
    'EMPLOYEE',
    'ACTIVE'
),
(
    'EMP005',
    'Charlie Brown',
    'charlie@company.com',
    '$2b$12$Kq3vrnZt0xijZsI0PRcdk.bB9dp0IeiPXoJWYREqI0TD/NsLi4atq', -- BCrypt hash of Password@123
    '9876543214',
    'EMPLOYEE',
    'ACTIVE'
);

-- 3. Insert Default Company Location Settings
INSERT INTO company_location (company_name, latitude, longitude, allowed_radius, max_gps_accuracy)
VALUES (
    'ABC Technologies',
    11.078319,
    76.999745,
    50.0,  -- 50 meters
    100.0  -- 100 meters max GPS accuracy
);
