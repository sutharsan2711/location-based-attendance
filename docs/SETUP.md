# System Setup Guide

This document describes how to configure, run, and test the monorepo Employee Attendance System locally.

## Prerequisites
* **Java:** JDK 21
* **Database:** MySQL 8.x
* **Build Tool:** Maven 3.x
* **Node.js:** Node 20.x or higher

---

## 1. Database Setup

1. Start your local MySQL instance.
2. Log in using your root client or GUI tool:
   ```bash
   mysql -u root -p
   ```
3. Run the schema creation and database seeding scripts:
   ```bash
   # From root project directory
   & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p -e "source database/schema.sql; source database/seed.sql;"
   ```
   *(Replace with your MySQL client path and credentials as appropriate).*

---

## 2. Backend Installation & Run

1. Open `backend/src/main/resources/application.properties` and verify your credentials:
   ```properties
   spring.datasource.username=root
   spring.datasource.password=sutharsan
   ```
2. Build the project and run backend unit tests:
   ```bash
   cd backend
   mvn clean test
   ```
3. Boot up the Spring Boot server:
   ```bash
   mvn spring-boot:run
   ```
   The backend API will start on: `http://localhost:8080/api`

---

## 3. Frontend Installation & Run

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```
   The frontend application will start on: `http://localhost:5173/`

---

## 4. Default Seed Credentials

Use these accounts to test the application locally:

### Administrator Account
* **Email:** `admin@eclearnix.com`
* **Password:** `admin@123`

### Sample Employee Accounts
* **Email:** `john@company.com`
* **Password:** `Password@123`
* **Email:** `jane@company.com`
* **Password:** `Password@123`
* **Email:** `bob@company.com`
* **Password:** `Password@123`
* **Email:** `alice@company.com`
* **Password:** `Password@123`
* **Email:** `charlie@company.com`
* **Password:** `Password@123`
