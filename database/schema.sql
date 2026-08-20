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

-- 2. Company Location Settings Table
CREATE TABLE IF NOT EXISTS company_location (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(100) NOT NULL,
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    allowed_radius DOUBLE NOT NULL DEFAULT 50.0, -- in meters
    max_gps_accuracy DOUBLE NOT NULL DEFAULT 100.0, -- in meters
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_employee_date (employee_id, attendance_date)
);

-- Indexes for fast query retrieval
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_employee_code ON users(employee_code);
CREATE INDEX idx_attendance_employee_id ON attendance(employee_id);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);
CREATE INDEX idx_attendance_status ON attendance(status);
