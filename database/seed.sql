USE attendance_db;

-- Clear existing data (in order of foreign key dependency)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE attendance;
TRUNCATE TABLE leave_requests;
TRUNCATE TABLE leave_balances;
TRUNCATE TABLE permission_requests;
TRUNCATE TABLE company_location;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Insert Admin
INSERT INTO users (employee_code, name, email, password, phone, role, status, department, profile_data, created_at)
VALUES (
    'EMP000',
    'System Admin',
    'admin@eclearnix.com',
    '$2a$10$1kyyr93DNdf7JnJBifb28epDHMGHxZ4u31H0d96t65kc2Ey.RgjK6', -- BCrypt hash of admin@123
    '1234567890',
    'ADMIN',
    'ACTIVE',
    'Management',
    '{"designation":"System Administrator","department":"Management","joiningDate":"2024-01-01","location":"Coimbatore"}',
    '2024-01-01 09:00:00'
);

-- 2. Insert 19 Master Employees with Full Profiles & Joining Months
INSERT INTO users (employee_code, name, email, password, phone, role, status, department, profile_data, created_at)
VALUES 
('ECLCE2008', 'Sasiprabha J', 'sasiprabha@company.com', '$2b$12$Kq3vrnZt0xijZsI0PRcdk.bB9dp0IeiPXoJWYREqI0TD/NsLi4atq', '9876543201', 'EMPLOYEE', 'ACTIVE', 'Employee', '{"designation":"Senior Software Engineer","department":"IT","joiningDate":"2025-02-01","joinedMonth":"Feb-25","employeeType":"Employee","location":"Coimbatore","bloodGroup":"O +ve"}', '2025-02-01 09:00:00'),
('ECLCE2014', 'Sriram R', 'sriram@company.com', '$2b$12$Kq3vrnZt0xijZsI0PRcdk.bB9dp0IeiPXoJWYREqI0TD/NsLi4atq', '9876543202', 'EMPLOYEE', 'ACTIVE', 'Employee', '{"designation":"Software Engineer","department":"IT","joiningDate":"2025-08-01","joinedMonth":"Aug-25","employeeType":"Employee","location":"Coimbatore","bloodGroup":"A +ve"}', '2025-08-01 09:00:00'),
('ECLCE2015', 'Manimegalai B', 'manimegalai@company.com', '$2b$12$Kq3vrnZt0xijZsI0PRcdk.bB9dp0IeiPXoJWYREqI0TD/NsLi4atq', '9876543203', 'EMPLOYEE', 'ACTIVE', 'Employee', '{"designation":"Frontend Developer","department":"IT","joiningDate":"2025-08-01","joinedMonth":"Aug-25","employeeType":"Employee","location":"Coimbatore","bloodGroup":"B +ve"}', '2025-08-01 09:00:00'),
('ECLCE2016', 'Gopinath', 'gopinath@company.com', '$2b$12$Kq3vrnZt0xijZsI0PRcdk.bB9dp0IeiPXoJWYREqI0TD/NsLi4atq', '9876543204', 'EMPLOYEE', 'ACTIVE', 'Employee', '{"designation":"Backend Developer","department":"IT","joiningDate":"2025-12-01","joinedMonth":"Dec-25","employeeType":"Employee","location":"Coimbatore","bloodGroup":"AB +ve"}', '2025-12-01 09:00:00'),
('ECLCE2017', 'Dhanuja G T', 'dhanuja@company.com', '$2b$12$Kq3vrnZt0xijZsI0PRcdk.bB9dp0IeiPXoJWYREqI0TD/NsLi4atq', '9876543205', 'EMPLOYEE', 'ACTIVE', 'Employee', '{"designation":"UI/UX Developer","department":"IT","joiningDate":"2025-09-01","joinedMonth":"Sep-25","employeeType":"Employee","location":"Coimbatore","bloodGroup":"O -ve"}', '2025-09-01 09:00:00'),
('ECLCT3009', 'Kanishkaa S', 'kanishkaa@company.com', '$2b$12$Kq3vrnZt0xijZsI0PRcdk.bB9dp0IeiPXoJWYREqI0TD/NsLi4atq', '9876543206', 'TRAINEE', 'ACTIVE', 'Trainee', '{"designation":"Graduate Trainee","department":"IT","joiningDate":"2025-09-01","joinedMonth":"Sep-25","employeeType":"Trainee","location":"Coimbatore","bloodGroup":"O +ve"}', '2025-09-01 09:00:00'),
('ECLCT3010', 'Kanchana Mala V G', 'kanchanamala@company.com', '$2b$12$Kq3vrnZt0xijZsI0PRcdk.bB9dp0IeiPXoJWYREqI0TD/NsLi4atq', '9876543207', 'TRAINEE', 'ACTIVE', 'Trainee', '{"designation":"Associate Trainee","department":"IT","joiningDate":"2025-09-01","joinedMonth":"Sep-25","employeeType":"Trainee","location":"Coimbatore","bloodGroup":"A +ve"}', '2025-09-01 09:00:00'),
('ECLCT3014', 'Prabavathi', 'prabavathi@company.com', '$2b$12$Kq3vrnZt0xijZsI0PRcdk.bB9dp0IeiPXoJWYREqI0TD/NsLi4atq', '9876543208', 'TRAINEE', 'ACTIVE', 'Trainee', '{"designation":"Technical Trainee","department":"IT","joiningDate":"2025-11-01","joinedMonth":"Nov-25","employeeType":"Trainee","location":"Coimbatore","bloodGroup":"B +ve"}', '2025-11-01 09:00:00'),
('ECLCT3019', 'Dhivyadharshini', 'dhivyadharshini@company.com', '$2b$12$Kq3vrnZt0xijZsI0PRcdk.bB9dp0IeiPXoJWYREqI0TD/NsLi4atq', '9876543209', 'TRAINEE', 'ACTIVE', 'Trainee', '{"designation":"Software Trainee","department":"IT","joiningDate":"2026-02-01","joinedMonth":"Feb-26","employeeType":"Trainee","location":"Coimbatore","bloodGroup":"O +ve"}', '2026-02-01 09:00:00'),
('ECLCT3020', 'Abinaya', 'abinaya@company.com', '$2b$12$Kq3vrnZt0xijZsI0PRcdk.bB9dp0IeiPXoJWYREqI0TD/NsLi4atq', '9876543210', 'TRAINEE', 'ACTIVE', 'Trainee', '{"designation":"Software Trainee","department":"IT","joiningDate":"2026-02-01","joinedMonth":"Feb-26","employeeType":"Trainee","location":"Coimbatore","bloodGroup":"A -ve"}', '2026-02-01 09:00:00'),
('ECLCT3021', 'Swetha', 'swetha@company.com', '$2b$12$Kq3vrnZt0xijZsI0PRcdk.bB9dp0IeiPXoJWYREqI0TD/NsLi4atq', '9876543211', 'TRAINEE', 'ACTIVE', 'Trainee', '{"designation":"QA Trainee","department":"IT","joiningDate":"2026-02-01","joinedMonth":"Feb-26","employeeType":"Trainee","location":"Coimbatore","bloodGroup":"B +ve"}', '2026-02-01 09:00:00'),
('ECLCT3022', 'Kavyasree', 'kavyasree@company.com', '$2b$12$Kq3vrnZt0xijZsI0PRcdk.bB9dp0IeiPXoJWYREqI0TD/NsLi4atq', '9876543212', 'TRAINEE', 'ACTIVE', 'Trainee', '{"designation":"Full Stack Trainee","department":"IT","joiningDate":"2026-03-01","joinedMonth":"Mar-26","employeeType":"Trainee","location":"Coimbatore","bloodGroup":"O +ve"}', '2026-03-01 09:00:00'),
('ECLCT3023', 'Vijayashanthi', 'vijayashanthi@company.com', '$2b$12$Kq3vrnZt0xijZsI0PRcdk.bB9dp0IeiPXoJWYREqI0TD/NsLi4atq', '9876543213', 'TRAINEE', 'ACTIVE', 'Trainee', '{"designation":"Developer Trainee","department":"IT","joiningDate":"2026-03-01","joinedMonth":"Mar-26","employeeType":"Trainee","location":"Coimbatore","bloodGroup":"A +ve"}', '2026-03-01 09:00:00'),
('ECLCT3024', 'Merlin', 'merlin@company.com', '$2b$12$Kq3vrnZt0xijZsI0PRcdk.bB9dp0IeiPXoJWYREqI0TD/NsLi4atq', '9876543214', 'TRAINEE', 'ACTIVE', 'Trainee', '{"designation":"Junior Trainee","department":"IT","joiningDate":"2026-04-01","joinedMonth":"Apr-26","employeeType":"Trainee","location":"Coimbatore","bloodGroup":"AB +ve"}', '2026-04-01 09:00:00'),
('ECLCT3025', 'Deeksha', 'deeksha@company.com', '$2b$12$Kq3vrnZt0xijZsI0PRcdk.bB9dp0IeiPXoJWYREqI0TD/NsLi4atq', '9876543215', 'TRAINEE', 'ACTIVE', 'Trainee', '{"designation":"Junior Trainee","department":"IT","joiningDate":"2026-04-01","joinedMonth":"Apr-26","employeeType":"Trainee","location":"Coimbatore","bloodGroup":"O +ve"}', '2026-04-01 09:00:00'),
('ECLCT3026', 'Monisha', 'monisha@company.com', '$2b$12$Kq3vrnZt0xijZsI0PRcdk.bB9dp0IeiPXoJWYREqI0TD/NsLi4atq', '9876543216', 'TRAINEE', 'ACTIVE', 'Trainee', '{"designation":"Junior Trainee","department":"IT","joiningDate":"2026-04-01","joinedMonth":"Apr-26","employeeType":"Trainee","location":"Coimbatore","bloodGroup":"B -ve"}', '2026-04-01 09:00:00'),
('ECLCT4017', 'Rubella V', 'rubella@company.com', '$2b$12$Kq3vrnZt0xijZsI0PRcdk.bB9dp0IeiPXoJWYREqI0TD/NsLi4atq', '9876543217', 'TRAINEE', 'ACTIVE', 'Trainee', '{"designation":"Software Trainee","department":"IT","joiningDate":"2026-02-01","joinedMonth":"Feb-26","employeeType":"Trainee","location":"Coimbatore","bloodGroup":"O +ve"}', '2026-02-01 09:00:00'),
('ECLCT4021', 'Deepika', 'deepika@company.com', '$2b$12$Kq3vrnZt0xijZsI0PRcdk.bB9dp0IeiPXoJWYREqI0TD/NsLi4atq', '9876543218', 'TRAINEE', 'ACTIVE', 'Trainee', '{"designation":"Project Trainee","department":"IT","joiningDate":"2026-04-01","joinedMonth":"Apr-26","employeeType":"Trainee","location":"Coimbatore","bloodGroup":"A +ve"}', '2026-04-01 09:00:00'),
('ECLCI4023', 'Mahalakhmi', 'mahalakhmi@company.com', '$2b$12$Kq3vrnZt0xijZsI0PRcdk.bB9dp0IeiPXoJWYREqI0TD/NsLi4atq', '9876543219', 'INTERN', 'ACTIVE', 'Intern', '{"designation":"Intern","department":"IT","joiningDate":"2026-07-01","joinedMonth":"Jul-26","employeeType":"Intern","location":"Coimbatore","bloodGroup":"B +ve"}', '2026-07-01 09:00:00');

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

-- 4. Insert Leave Balance Quotas for Year 2026 (matching Total Leave column)
INSERT INTO leave_balances (employee_id, year, casual_leave_granted, sick_leave_granted, comp_off_granted, loss_of_pay_granted, wfh_granted)
VALUES
(2, 2026, 17.0, 1.0, 0, 0, 0), -- Sasiprabha J (Total 18)
(3, 2026, 15.0, 1.0, 0, 0, 0), -- Sriram R (Total 16)
(4, 2026, 15.0, 1.0, 0, 0, 0), -- Manimegalai B (Total 16)
(5, 2026, 15.0, 1.0, 0, 0, 0), -- Gopinath (Total 16)
(6, 2026, 15.0, 1.0, 0, 0, 0), -- Dhanuja G T (Total 16)
(7, 2026, 13.0, 1.0, 0, 0, 0), -- Kanishkaa S (Total 14)
(8, 2026, 13.0, 1.0, 0, 0, 0), -- Kanchana Mala V G (Total 14)
(9, 2026, 13.0, 1.0, 0, 0, 0), -- Prabavathi (Total 14)
(10, 2026, 12.0, 1.0, 0, 0, 0), -- Dhivyadharshini (Total 13)
(11, 2026, 12.0, 1.0, 0, 0, 0), -- Abinaya (Total 13)
(12, 2026, 12.0, 1.0, 0, 0, 0), -- Swetha (Total 13)
(13, 2026, 11.0, 1.0, 0, 0, 0), -- Kavyasree (Total 12)
(14, 2026, 11.0, 1.0, 0, 0, 0), -- Vijayashanthi (Total 12)
(15, 2026, 10.0, 1.0, 0, 0, 0), -- Merlin (Total 11)
(16, 2026, 10.0, 1.0, 0, 0, 0), -- Deeksha (Total 11)
(17, 2026, 10.0, 1.0, 0, 0, 0), -- Monisha (Total 11)
(18, 2026, 12.0, 1.0, 0, 0, 0), -- Rubella V (Total 13)
(19, 2026, 10.0, 1.0, 0, 0, 0), -- Deepika (Total 11)
(20, 2026, 7.0, 1.0, 0, 0, 0);  -- Mahalakhmi (Total 8)

-- 5. Insert Approved Leave Requests (matching Leave Taken column)
INSERT INTO leave_requests (employee_id, leave_type, from_date, to_date, reason, remarks, status, admin_remarks)
VALUES
(2, 'CASUAL_LEAVE', '2026-01-05', '2026-01-13', 'Personal Leave', 'Approved', 'APPROVED', 'Approved by Admin'), -- 9 days
(3, 'CASUAL_LEAVE', '2026-01-08', '2026-01-14', 'Family Function', 'Approved', 'APPROVED', 'Approved by Admin'), -- 7 days
(4, 'CASUAL_LEAVE', '2026-01-10', '2026-01-17', 'Personal Work', 'Approved', 'APPROVED', 'Approved by Admin'), -- 8 days
(4, 'SICK_LEAVE', '2026-02-02', '2026-02-02', 'Medical Care', 'Approved', 'APPROVED', 'Approved by Admin'), -- 0.5/1 day (Total 8.5)
(5, 'CASUAL_LEAVE', '2026-01-12', '2026-01-16', 'Vacation', 'Approved', 'APPROVED', 'Approved by Admin'), -- 5 days
(5, 'SICK_LEAVE', '2026-02-05', '2026-02-05', 'Medical Care', 'Approved', 'APPROVED', 'Approved by Admin'), -- 0.5/1 day (Total 5.5)
(6, 'CASUAL_LEAVE', '2026-01-15', '2026-01-21', 'Personal', 'Approved', 'APPROVED', 'Approved by Admin'), -- 7 days
(7, 'CASUAL_LEAVE', '2026-01-10', '2026-01-16', 'Family Function', 'Approved', 'APPROVED', 'Approved by Admin'), -- 7 days
(7, 'SICK_LEAVE', '2026-02-03', '2026-02-03', 'Medical Care', 'Approved', 'APPROVED', 'Approved by Admin'), -- 0.5/1 day (Total 7.5)
(8, 'CASUAL_LEAVE', '2026-01-05', '2026-01-15', 'Personal Work', 'Approved', 'APPROVED', 'Approved by Admin'), -- 11 days
(9, 'CASUAL_LEAVE', '2026-01-08', '2026-01-14', 'Family Work', 'Approved', 'APPROVED', 'Approved by Admin'), -- 7 days
(9, 'SICK_LEAVE', '2026-02-04', '2026-02-04', 'Medical Care', 'Approved', 'APPROVED', 'Approved by Admin'), -- 0.5/1 day (Total 7.5)
(10, 'CASUAL_LEAVE', '2026-01-10', '2026-01-17', 'Personal Work', 'Approved', 'APPROVED', 'Approved by Admin'), -- 8 days
(11, 'CASUAL_LEAVE', '2026-01-12', '2026-01-20', 'Personal Work', 'Approved', 'APPROVED', 'Approved by Admin'), -- 9 days
(12, 'CASUAL_LEAVE', '2026-01-15', '2026-01-22', 'Personal Work', 'Approved', 'APPROVED', 'Approved by Admin'), -- 8 days
(13, 'CASUAL_LEAVE', '2026-01-19', '2026-01-21', 'Personal Work', 'Approved', 'APPROVED', 'Approved by Admin'), -- 3 days
(14, 'CASUAL_LEAVE', '2026-01-20', '2026-01-24', 'Family Function', 'Approved', 'APPROVED', 'Approved by Admin'), -- 5 days
(14, 'SICK_LEAVE', '2026-02-06', '2026-02-06', 'Medical Care', 'Approved', 'APPROVED', 'Approved by Admin'), -- 0.5/1 day (Total 5.5)
(15, 'CASUAL_LEAVE', '2026-01-12', '2026-01-19', 'Personal Work', 'Approved', 'APPROVED', 'Approved by Admin'), -- 8 days
(16, 'CASUAL_LEAVE', '2026-01-15', '2026-01-19', 'Personal Work', 'Approved', 'APPROVED', 'Approved by Admin'), -- 5 days
(17, 'CASUAL_LEAVE', '2026-01-20', '2026-01-25', 'Personal Work', 'Approved', 'APPROVED', 'Approved by Admin'), -- 6 days
(18, 'CASUAL_LEAVE', '2026-01-12', '2026-01-19', 'Personal Work', 'Approved', 'APPROVED', 'Approved by Admin'), -- 8 days
(19, 'CASUAL_LEAVE', '2026-01-05', '2026-01-21', 'Personal Emergency', 'Approved', 'APPROVED', 'Approved by Admin'), -- 17 days
(20, 'CASUAL_LEAVE', '2026-01-10', '2026-01-19', 'Personal Leave', 'Approved', 'APPROVED', 'Approved by Admin'); -- 10 days

-- 6. Sample Permission Requests
INSERT INTO permission_requests (employee_id, permission_date, from_time, to_time, reason, remarks, status)
VALUES
(2, CURDATE(), '09:00:00', '10:00:00', 'Doctor appointment', 'Morning slot', 'APPROVED'),
(3, CURDATE(), '16:00:00', '17:30:00', 'Personal work', 'Early departure needed', 'PENDING');

-- 7. Sample Attendance Punch Records
INSERT INTO attendance (
    employee_id, attendance_date,
    login_time, logout_time,
    login_latitude, login_longitude, login_distance, login_accuracy,
    logout_latitude, logout_longitude, logout_distance, logout_accuracy,
    status, timing_status
)
VALUES
-- Sasiprabha J (ECLCE2008): Today Present
(2, CURDATE(), CONCAT(CURDATE(), ' 09:04:12'), CONCAT(CURDATE(), ' 18:08:45'), 11.078319, 76.999745, 12.4, 15.0, 11.078319, 76.999745, 14.1, 15.0, 'COMPLETED', 'PRESENT'),
-- Sriram R (ECLCE2014): Today Present
(3, CURDATE(), CONCAT(CURDATE(), ' 09:35:00'), CONCAT(CURDATE(), ' 18:12:00'), 11.078319, 76.999745, 14.5, 12.0, 11.078319, 76.999745, 15.0, 12.0, 'COMPLETED', 'PRESENT'),
-- Manimegalai B (ECLCE2015): Today Late
(4, CURDATE(), CONCAT(CURDATE(), ' 09:42:10'), NULL, 11.078319, 76.999745, 22.0, 15.0, NULL, NULL, NULL, NULL, 'LOGGED_IN', 'LATE');
