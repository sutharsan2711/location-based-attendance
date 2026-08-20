# REST API Documentation

This document describes all REST API endpoints exposed by the Employee Attendance System backend.

## Base URL
All API requests start with the context path: `http://localhost:8080/api`

---

## 1. Authentication APIs

### Login
* **URL:** `/auth/login`
* **Method:** `POST`
* **Access:** Public
* **Request Body:**
  ```json
  {
    "email": "employee@company.com",
    "password": "Password@123"
  }
  ```
* **Response (Success 200 OK):**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "user": {
      "id": 2,
      "name": "John Doe",
      "email": "john@company.com",
      "role": "EMPLOYEE"
    }
  }
  ```

### Logout
* **URL:** `/auth/logout`
* **Method:** `POST`
* **Access:** Authenticated Users
* **Response (Success 200 OK):**
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

### Current User Details
* **URL:** `/auth/me`
* **Method:** `GET`
* **Access:** Authenticated Users (JWT required in `Authorization` header)
* **Response (Success 200 OK):**
  ```json
  {
    "id": 2,
    "name": "John Doe",
    "email": "john@company.com",
    "role": "EMPLOYEE"
  }
  ```

---

## 2. Employee Management APIs (Admin Only)

### List All Employees
* **URL:** `/employees`
* **Method:** `GET`
* **Access:** Admin only
* **Response (200 OK):**
  ```json
  [
    {
      "id": 2,
      "employeeCode": "EMP001",
      "name": "John Doe",
      "email": "john@company.com",
      "phone": "9876543210",
      "role": "EMPLOYEE",
      "status": "ACTIVE",
      "createdAt": "2026-08-19T10:44:12",
      "updatedAt": "2026-08-19T10:44:12"
    }
  ]
  ```

### Get Employee by ID
* **URL:** `/employees/{id}`
* **Method:** `GET`
* **Access:** Admin only

### Create Employee
* **URL:** `/employees`
* **Method:** `POST`
* **Access:** Admin only
* **Request Body:**
  ```json
  {
    "employeeCode": "EMP006",
    "name": "Sarah Connor",
    "email": "sarah@company.com",
    "phone": "9876543219",
    "password": "Password@123",
    "role": "EMPLOYEE",
    "status": "ACTIVE"
  }
  ```

### Update Employee
* **URL:** `/employees/{id}`
* **Method:** `PUT`
* **Access:** Admin only

### Toggle Employee Status
* **URL:** `/employees/{id}/status`
* **Method:** `PATCH`
* **Access:** Admin only
* **Request Body:**
  ```json
  {
    "status": "INACTIVE"
  }
  ```

### Admin Reset Password
* **URL:** `/employees/{id}/reset-password`
* **Method:** `POST`
* **Access:** Admin only
* **Request Body:**
  ```json
  {
    "password": "NewSecurePassword@123"
  }
  ```

---

## 3. Location Configuration APIs

### Get Company Location
* **URL:** `/location`
* **Method:** `GET`
* **Access:** Authenticated Users (Admins and Employees)
* **Response (200 OK):**
  ```json
  {
    "id": 1,
    "companyName": "ABC Technologies",
    "latitude": 11.123456,
    "longitude": 78.123456,
    "allowedRadius": 50.0,
    "maxGpsAccuracy": 100.0,
    "createdAt": "2026-08-19T10:44:12",
    "updatedAt": "2026-08-19T10:44:12"
  }
  ```

### Update Company Location
* **URL:** `/location`
* **Method:** `PUT`
* **Access:** Admin only
* **Request Body:**
  ```json
  {
    "companyName": "ABC Corporate HQ",
    "latitude": 11.123456,
    "longitude": 78.123456,
    "allowedRadius": 75.0,
    "maxGpsAccuracy": 50.0
  }
  ```

---

## 4. Attendance APIs

### Clock-in / Login Attendance
* **URL:** `/attendance/login`
* **Method:** `POST`
* **Access:** Authenticated Employees (within office radius)
* **Request Body:**
  ```json
  {
    "latitude": 11.123458,
    "longitude": 78.123459,
    "accuracy": 15.2
  }
  ```
* **Response (Success 200 OK):**
  ```json
  {
    "success": true,
    "message": "Login recorded successfully",
    "distance": 0.45,
    "allowedRadius": 50.0,
    "time": "2026-08-19T09:15:23",
    "status": "LOGGED_IN"
  }
  ```
* **Response (Failure - Outside allowed boundary 400 Bad Request):**
  ```json
  {
    "success": false,
    "message": "You are outside the allowed office location.",
    "distance": 124.5,
    "allowedRadius": 50.0
  }
  ```

### Clock-out / Logout Attendance
* **URL:** `/attendance/logout`
* **Method:** `POST`
* **Access:** Authenticated Employees (within office radius)
* **Request Body:** Similar to Login.
* **Response (Success 200 OK):**
  ```json
  {
    "success": true,
    "message": "Logout recorded successfully",
    "distance": 1.25,
    "allowedRadius": 50.0,
    "time": "2026-08-19T18:10:45",
    "status": "COMPLETED"
  }
  ```

### Today's Status
* **URL:** `/attendance/today`
* **Method:** `GET`
* **Access:** Authenticated Users

### Individual History logs
* **URL:** `/attendance/history`
* **Method:** `GET`
* **Access:** Authenticated Employees

### Search all attendance logs
* **URL:** `/attendance`
* **Method:** `GET`
* **Access:** Admin only
* **Query Parameters:** `employeeId` (optional), `status` (optional), `startDate` (optional), `endDate` (optional)

---

## 5. Administrative Dashboard & Reports

### KPI Metrics
* **URL:** `/admin/dashboard`
* **Method:** `GET`
* **Access:** Admin only
* **Response (200 OK):**
  ```json
  {
    "totalEmployees": 5,
    "activeEmployees": 5,
    "todayLogin": 4,
    "todayLogout": 2,
    "currentlyWorking": 2,
    "absent": 1
  }
  ```

### Attendance History summary (Charts data)
* **URL:** `/admin/attendance-summary`
* **Method:** `GET`
* **Access:** Admin only
* **Response (200 OK):**
  ```json
  [
    {
      "date": "19-08-2026",
      "present": 4,
      "absent": 1,
      "login": 4,
      "logout": 2
    }
  ]
  ```

### Attendance Filtered logs report
* **URL:** `/admin/attendance-report`
* **Method:** `GET`
* **Access:** Admin only
* **Response (200 OK):**
  ```json
  [
    {
      "id": 1,
      "employeeCode": "EMP001",
      "employeeName": "John Doe",
      "date": "19-08-2026",
      "loginTime": "09:15 AM",
      "loginDistance": "12.3m",
      "logoutTime": "06:10 PM",
      "logoutDistance": "18.2m",
      "workingHours": "08:55",
      "status": "COMPLETED"
    }
  ]
  ```

### Export Csv logs download
* **URL:** `/admin/attendance-report/csv`
* **Method:** `GET`
* **Access:** Admin only
* **Response:** Returns file stream attachment (`attendance_report.csv`).
