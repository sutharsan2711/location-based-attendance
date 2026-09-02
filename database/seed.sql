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

-- 2. Insert 19 Master Employees
INSERT INTO users (employee_code, name, email, password, phone, role, status, department, created_at)
VALUES 
('ECLCE2008', 'Sasiprabha J', 'sasiprabha@company.com', '$2b$12$Kq3vrnZt0xijZsI0PRcdk.bB9dp0IeiPXoJWYREqI0TD/NsLi4atq', '9876543201', 'EMPLOYEE', 'ACTIVE', 'Employee', '2025-02-01 09:00:00'),
('ECLCE2014', 'Sriram R', 'sriram@company.com', '$2b$12$Kq3vrnZt0xijZsI0PRcdk.bB9dp0IeiPXoJWYREqI0TD/NsLi4atq', '9876543202', 'EMPLOYEE', 'ACTIVE', 'Employee', '2025-08-01 09:00:00'),
('ECLCE2015', 'Manimegalai B', 'manimegalai@company.com', '$2b$12$Kq3vrnZt0xijZsI0PRcdk.bB9dp0IeiPXoJWYREqI0TD/NsLi4atq', '9876543203', 'EMPLOYEE', 'ACTIVE', 'Employee', '2025-08-01 09:00:00'),
('ECLCE2016', 'Gopinath', 'gopinath@company.com', '$2b$12$Kq3vrnZt0xijZsI0PRcdk.bB9dp0IeiPXoJWYREqI0TD/NsLi4atq', '9876543204', 'EMPLOYEE', 'ACTIVE', 'Employee', '2025-12-01 09:00:00'),
('ECLCE2017', 'Dhanuja G T', 'dhanuja@company.com', '$2b$12$Kq3vrnZt0xijZsI0PRcdk.bB9dp0IeiPXoJWYREqI0TD/NsLi4atq', '9876543205', 'EMPLOYEE', 'ACTIVE', 'Employee', '2025-09-01 09:00:00'),
('ECLCT3009', 'Kanishkaa S', 'kanishkaa@company.com', '$2b$12$Kq3vrnZt0xijZsI0PRcdk.bB9dp0IeiPXoJWYREqI0TD/NsLi4atq', '9876543206', 'EMPLOYEE', 'ACTIVE', 'Trainee', '2025-09-01 09:00:00'),
('ECLCT3010', 'Kanchana Mala V G', 'kanchanamala@company.com', '$2b$12$Kq3vrnZt0xijZsI0PRcdk.bB9dp0IeiPXoJWYREqI0TD/NsLi4atq', '9876543207', 'EMPLOYEE', 'ACTIVE', 'Trainee', '2025-09-01 09:00:00'),
('ECLCT3014', 'Prabavathi', 'prabavathi@company.com', '$2b$12$Kq3vrnZt0xijZsI0PRcdk.bB9dp0IeiPXoJWYREqI0TD/NsLi4atq', '9876543208', 'EMPLOYEE', 'ACTIVE', 'Trainee', '2025-11-01 09:00:00'),
('ECLCT3019', 'Dhivyadharshini', 'dhivyadharshini@company.com', '$2b$12$Kq3vrnZt0xijZsI0PRcdk.bB9dp0IeiPXoJWYREqI0TD/NsLi4atq', '9876543209', 'EMPLOYEE', 'ACTIVE', 'Trainee', '2026-02-01 09:00:00'),
('ECLCT3020', 'Abinaya', 'abinaya@company.com', '$2b$12$Kq3vrnZt0xijZsI0PRcdk.bB9dp0IeiPXoJWYREqI0TD/NsLi4atq', '9876543210', 'EMPLOYEE', 'ACTIVE', 'Trainee', '2026-02-01 09:00:00'),
('ECLCT3021', 'Swetha', 'swetha@company.com', '$2b$12$Kq3vrnZt0xijZsI0PRcdk.bB9dp0IeiPXoJWYREqI0TD/NsLi4atq', '9876543211', 'EMPLOYEE', 'ACTIVE', 'Trainee', '2026-02-01 09:00:00'),
('ECLCT3022', 'Kavyasree', 'kavyasree@company.com', '$2b$12$Kq3vrnZt0xijZsI0PRcdk.bB9dp0IeiPXoJWYREqI0TD/NsLi4atq', '9876543212', 'EMPLOYEE', 'ACTIVE', 'Trainee', '2026-03-01 09:00:00'),
('ECLCT3023', 'Vijayashanthi', 'vijayashanthi@company.com', '$2b$12$Kq3vrnZt0xijZsI0PRcdk.bB9dp0IeiPXoJWYREqI0TD/NsLi4atq', '9876543213', 'EMPLOYEE', 'ACTIVE', 'Trainee', '2026-03-01 09:00:00'),
('ECLCT3024', 'Merlin', 'merlin@company.com', '$2b$12$Kq3vrnZt0xijZsI0PRcdk.bB9dp0IeiPXoJWYREqI0TD/NsLi4atq', '9876543214', 'EMPLOYEE', 'ACTIVE', 'Trainee', '2026-04-01 09:00:00'),
('ECLCT3025', 'Deeksha', 'deeksha@company.com', '$2b$12$Kq3vrnZt0xijZsI0PRcdk.bB9dp0IeiPXoJWYREqI0TD/NsLi4atq', '9876543215', 'EMPLOYEE', 'ACTIVE', 'Trainee', '2026-04-01 09:00:00'),
('ECLCT3026', 'Monisha', 'monisha@company.com', '$2b$12$Kq3vrnZt0xijZsI0PRcdk.bB9dp0IeiPXoJWYREqI0TD/NsLi4atq', '9876543216', 'EMPLOYEE', 'ACTIVE', 'Trainee', '2026-04-01 09:00:00'),
('ECLCT4017', 'Rubella V', 'rubella@company.com', '$2b$12$Kq3vrnZt0xijZsI0PRcdk.bB9dp0IeiPXoJWYREqI0TD/NsLi4atq', '9876543217', 'EMPLOYEE', 'ACTIVE', 'Trainee', '2026-02-01 09:00:00'),
('ECLCT4021', 'Deepika', 'deepika@company.com', '$2b$12$Kq3vrnZt0xijZsI0PRcdk.bB9dp0IeiPXoJWYREqI0TD/NsLi4atq', '9876543218', 'EMPLOYEE', 'ACTIVE', 'Trainee', '2026-04-01 09:00:00'),
('ECLCI4023', 'Mahalakhmi', 'mahalakhmi@company.com', '$2b$12$Kq3vrnZt0xijZsI0PRcdk.bB9dp0IeiPXoJWYREqI0TD/NsLi4atq', '9876543219', 'EMPLOYEE', 'ACTIVE', 'Intern', '2026-07-01 09:00:00');

-- 3. Insert Default Company Location & Timing Settings
INSERT INTO company_location (
    company_name, latitude, longitude, allowed_radius, max_gps_accuracy,
    office_login_time, office_logout_time, grace_period_minutes,
    it_login_time, it_logout_time, it_grace_minutes,
    edtech_login_time, edtech_logout_time, edtech_grace_minutes,
    business_login_time, business_logout_time, business_grace_minutes
)
VALUES (
    'ABC Technologies',
    11.078319,
    76.999745,
    50.0,  -- 50 meters
    100.0, -- 100 meters max GPS accuracy
    '09:00:00',
    '18:00:00',
    15,
    '09:00:00', '18:30:00', 15,
    '08:45:00', '17:45:00', 15,
    '08:45:00', '17:45:00', 15
);

-- 4. Sample Permission Requests
INSERT INTO permission_requests (employee_id, permission_date, from_time, to_time, reason, remarks, status)
VALUES
(2, CURDATE(), '09:00:00', '10:00:00', 'Doctor appointment', 'Morning slot', 'APPROVED'),
(3, CURDATE(), '16:00:00', '17:30:00', 'Personal work', 'Early departure needed', 'PENDING');

-- 5. Sample Leave Requests
INSERT INTO leave_requests (employee_id, leave_type, from_date, to_date, reason, remarks, status)
VALUES
(4, 'CASUAL_LEAVE', DATE_ADD(CURDATE(), INTERVAL 1 DAY), DATE_ADD(CURDATE(), INTERVAL 2 DAY), 'Family function', 'Out of station', 'APPROVED'),
(5, 'SICK_LEAVE', CURDATE(), CURDATE(), 'Fever and cold', 'Rest recommended by doctor', 'PENDING');

-- 6. Sample Attendance Punch Records
INSERT INTO attendance (
    employee_id, attendance_date,
    login_time, logout_time,
    login_latitude, login_longitude, login_distance, login_accuracy,
    logout_latitude, logout_longitude, logout_distance, logout_accuracy,
    status, timing_status
)
VALUES
-- John Doe (EMP001): Today Present
(2, CURDATE(), CONCAT(CURDATE(), ' 09:04:12'), CONCAT(CURDATE(), ' 18:08:45'), 11.078319, 76.999745, 12.4, 15.0, 11.078319, 76.999745, 14.1, 15.0, 'COMPLETED', 'PRESENT'),
-- John Doe (EMP001): Yesterday Present
(2, DATE_SUB(CURDATE(), INTERVAL 1 DAY), CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 08:58:30'), CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 18:02:10'), 11.078319, 76.999745, 8.2, 10.0, 11.078319, 76.999745, 9.5, 10.0, 'COMPLETED', 'PRESENT'),
-- John Doe (EMP001): 2 Days Ago Late
(2, DATE_SUB(CURDATE(), INTERVAL 2 DAY), CONCAT(DATE_SUB(CURDATE(), INTERVAL 2 DAY), ' 09:28:15'), CONCAT(DATE_SUB(CURDATE(), INTERVAL 2 DAY), ' 18:35:00'), 11.078319, 76.999745, 18.0, 12.0, 11.078319, 76.999745, 16.5, 12.0, 'COMPLETED', 'LATE'),
-- John Doe (EMP001): 3 Days Ago Present
(2, DATE_SUB(CURDATE(), INTERVAL 3 DAY), CONCAT(DATE_SUB(CURDATE(), INTERVAL 3 DAY), ' 09:02:00'), CONCAT(DATE_SUB(CURDATE(), INTERVAL 3 DAY), ' 18:00:00'), 11.078319, 76.999745, 10.1, 10.0, 11.078319, 76.999745, 11.3, 10.0, 'COMPLETED', 'PRESENT'),

-- Jane Smith (EMP002): Today Permission (09:00 - 10:00 approved window)
(3, CURDATE(), CONCAT(CURDATE(), ' 09:35:00'), CONCAT(CURDATE(), ' 18:12:00'), 11.078319, 76.999745, 14.5, 12.0, 11.078319, 76.999745, 15.0, 12.0, 'COMPLETED', 'PERMISSION'),
-- Jane Smith (EMP002): Yesterday Present
(3, DATE_SUB(CURDATE(), INTERVAL 1 DAY), CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 09:05:00'), CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 18:05:00'), 11.078319, 76.999745, 11.0, 10.0, 11.078319, 76.999745, 12.0, 10.0, 'COMPLETED', 'PRESENT'),

-- Bob Johnson (EMP003): Today Late
(4, CURDATE(), CONCAT(CURDATE(), ' 09:42:10'), NULL, 11.078319, 76.999745, 22.0, 15.0, NULL, NULL, NULL, NULL, 'LOGGED_IN', 'LATE'),
-- Bob Johnson (EMP003): Yesterday Present
(4, DATE_SUB(CURDATE(), INTERVAL 1 DAY), CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 08:50:00'), CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 18:00:00'), 11.078319, 76.999745, 9.0, 10.0, 11.078319, 76.999745, 10.0, 10.0, 'COMPLETED', 'PRESENT'),

-- Charlie Brown (EMP005): Today Working / Present
(6, CURDATE(), CONCAT(CURDATE(), ' 08:56:40'), NULL, 11.078319, 76.999745, 8.5, 10.0, NULL, NULL, NULL, NULL, 'LOGGED_IN', 'PRESENT');


