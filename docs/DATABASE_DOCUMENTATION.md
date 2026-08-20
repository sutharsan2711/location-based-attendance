# Database Documentation

This document describes the schema design, tables, indexes, constraints, and relationships for the MySQL database used in the Employee Attendance System.

---

## Database Configuration
* **Database Name:** `attendance_db`
* **Default Timezone:** `Asia/Kolkata`

---

## 1. Schema Tables

### 1.1 Table: `users`
Stores user profile information for admins and employees.

| Column | Type | Null | Key | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | NO | PRI | NULL | Unique auto-increment primary key |
| `employee_code` | `VARCHAR(50)` | NO | UNI | NULL | Unique ID card code (e.g. EMP001) |
| `name` | `VARCHAR(100)` | NO | | NULL | Full name of the user |
| `email` | `VARCHAR(100)` | NO | UNI | NULL | Login username (email) |
| `password` | `VARCHAR(255)` | NO | | NULL | BCrypt hashed password |
| `phone` | `VARCHAR(20)` | YES | | NULL | Mobile contact number |
| `role` | `VARCHAR(20)` | NO | | NULL | Access role (`ADMIN` or `EMPLOYEE`) |
| `status` | `VARCHAR(20)` | NO | | `'ACTIVE'` | Account state (`ACTIVE` or `INACTIVE`) |
| `created_at` | `TIMESTAMP` | YES | | `CURRENT_TIMESTAMP` | Record creation date |
| `updated_at` | `TIMESTAMP` | YES | | `CURRENT_TIMESTAMP` | Record last updated date |

### 1.2 Table: `company_location`
Stores target geographical bounds parameters configured by administrators.

| Column | Type | Null | Key | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | NO | PRI | NULL | Primary key |
| `company_name` | `VARCHAR(100)` | NO | | NULL | Display name of the office site |
| `latitude` | `DOUBLE` | NO | | NULL | Target GPS Latitude |
| `longitude` | `DOUBLE` | NO | | NULL | Target GPS Longitude |
| `allowed_radius` | `DOUBLE` | NO | | `50.0` | Outer check-in radius (in meters) |
| `max_gps_accuracy` | `DOUBLE` | NO | | `100.0` | Maximum acceptable device precision bounds |
| `created_at` | `TIMESTAMP` | YES | | `CURRENT_TIMESTAMP` | Record creation date |
| `updated_at` | `TIMESTAMP` | YES | | `CURRENT_TIMESTAMP` | Record last updated date |

### 1.3 Table: `attendance`
Stores daily login and logout punches for employees, along with verification details.

| Column | Type | Null | Key | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | NO | PRI | NULL | Primary key |
| `employee_id` | `BIGINT` | NO | MUL | NULL | Foreign Key referring to `users(id)` |
| `attendance_date` | `DATE` | NO | | NULL | Logical calendar date |
| `login_time` | `TIMESTAMP` | YES | | NULL | Server login timestamp |
| `login_latitude` | `DOUBLE` | YES | | NULL | GPS latitude at login |
| `login_longitude` | `DOUBLE` | YES | | NULL | GPS longitude at login |
| `login_accuracy` | `DOUBLE` | YES | | NULL | Device GPS accuracy at login |
| `login_distance` | `DOUBLE` | YES | | NULL | Calculated distance from office at login |
| `logout_time` | `TIMESTAMP` | YES | | NULL | Server logout timestamp |
| `logout_latitude` | `DOUBLE` | YES | | NULL | GPS latitude at logout |
| `logout_longitude` | `DOUBLE` | YES | | NULL | GPS longitude at logout |
| `logout_accuracy` | `DOUBLE` | YES | | NULL | Device GPS accuracy at logout |
| `logout_distance` | `DOUBLE` | YES | | NULL | Calculated distance from office at logout |
| `status` | `VARCHAR(20)` | NO | | `'NOT_LOGGED_IN'` | Attendance progress (`NOT_LOGGED_IN`, `LOGGED_IN`, `COMPLETED`) |
| `created_at` | `TIMESTAMP` | YES | | `CURRENT_TIMESTAMP` | Record creation date |
| `updated_at` | `TIMESTAMP` | YES | | `CURRENT_TIMESTAMP` | Record last updated date |

---

## 2. Integrity Constraints & Indexes

### Unique Key Constraints
1. **`users.employee_code`**: Enforces distinct code identifiers.
2. **`users.email`**: Prevents email address hijacking.
3. **`attendance(employee_id, attendance_date)`**: Combines employee foreign key and logical calendar date to prevent duplicate attendance logs on the same day.

### Foreign Key Constraints
* **`attendance.employee_id`** references **`users.id`** with `ON DELETE CASCADE`.

### Indexes
* `idx_users_email` on `users(email)`
* `idx_users_employee_code` on `users(employee_code)`
* `idx_attendance_employee_id` on `attendance(employee_id)`
* `idx_attendance_date` on `attendance(attendance_date)`
* `idx_attendance_status` on `attendance(status)`
