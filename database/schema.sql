-- Database Schema for Employee Location-Based Login & Logout Management System
-- Timezone: Asia/Kolkata

CREATE DATABASE IF NOT EXISTS attendance_db;
USE attendance_db;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    employee_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL, -- ADMIN, EMPLOYEE
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Company Location & Office Timing Settings Table
CREATE TABLE IF NOT EXISTS company_location (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(100) NOT NULL,
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    allowed_radius DOUBLE NOT NULL DEFAULT 50.0, -- in meters
    max_gps_accuracy DOUBLE NOT NULL DEFAULT 100.0, -- in meters
    office_login_time TIME NOT NULL DEFAULT '09:00:00',
    office_logout_time TIME NOT NULL DEFAULT '18:00:00',
    grace_period_minutes INT NOT NULL DEFAULT 15,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    employee_id BIGINT NOT NULL,
    attendance_date DATE NOT NULL,
    login_time TIMESTAMP NULL DEFAULT NULL,
    login_latitude DOUBLE NULL DEFAULT NULL,
    login_longitude DOUBLE NULL DEFAULT NULL,
    login_accuracy DOUBLE NULL DEFAULT NULL,
    login_distance DOUBLE NULL DEFAULT NULL,
    logout_time TIMESTAMP NULL DEFAULT NULL,
    logout_latitude DOUBLE NULL DEFAULT NULL,
    logout_longitude DOUBLE NULL DEFAULT NULL,
    logout_accuracy DOUBLE NULL DEFAULT NULL,
    logout_distance DOUBLE NULL DEFAULT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'NOT_LOGGED_IN', -- NOT_LOGGED_IN, LOGGED_IN, COMPLETED
    timing_status VARCHAR(20) NOT NULL DEFAULT 'PRESENT', -- PRESENT, LATE, PERMISSION, LEAVE, ABSENT
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_employee_date (employee_id, attendance_date)
);

-- 4. Permission Requests Table
CREATE TABLE IF NOT EXISTS permission_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    employee_id BIGINT NOT NULL,
    permission_date DATE NOT NULL,
    from_time TIME NOT NULL,
    to_time TIME NOT NULL,
    reason VARCHAR(255) NOT NULL,
    remarks VARCHAR(255) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    admin_remarks VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Leave Requests Table
CREATE TABLE IF NOT EXISTS leave_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    employee_id BIGINT NOT NULL,
    leave_type VARCHAR(50) NOT NULL, -- CASUAL_LEAVE, SICK_LEAVE, PERSONAL_LEAVE, OTHER
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    reason VARCHAR(255) NOT NULL,
    remarks VARCHAR(255) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    admin_remarks VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. Holidays Table
CREATE TABLE IF NOT EXISTS holidays (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    holiday_date DATE NOT NULL,
    day_of_week VARCHAR(30) NULL,
    holiday_type VARCHAR(50) NOT NULL DEFAULT 'Public Holiday',
    description VARCHAR(500) NULL,
    is_optional BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_holiday_date_name (holiday_date, name)
);

-- Indexes for fast query retrieval
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_employee_code ON users(employee_code);
CREATE INDEX idx_attendance_employee_id ON attendance(employee_id);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);
CREATE INDEX idx_attendance_status ON attendance(status);
CREATE INDEX idx_attendance_timing_status ON attendance(timing_status);
CREATE INDEX idx_permission_employee ON permission_requests(employee_id);
CREATE INDEX idx_permission_date ON permission_requests(permission_date);
CREATE INDEX idx_permission_status ON permission_requests(status);
CREATE INDEX idx_leave_employee ON leave_requests(employee_id);
CREATE INDEX idx_leave_dates ON leave_requests(from_date, to_date);
CREATE INDEX idx_leave_status ON leave_requests(status);
CREATE INDEX idx_holiday_date ON holidays(holiday_date);

