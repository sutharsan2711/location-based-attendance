# System Setup & Developer Guide

This document describes how to configure, run, and test the full-stack **GeoAttend** monorepo system locally.

---

## 📋 Prerequisites

Ensure you have the following software installed:
* **Node.js:** `v20.x` or `v22.x` (LTS recommended)
* **npm:** `v10.x` or higher
* **MySQL:** `8.0+`
* **Git:** Installed and configured

---

## 🗄️ 1. Database Setup

1. Start your local MySQL service.
2. Connect to MySQL via terminal or GUI client (e.g., MySQL Workbench, DBeaver):
   ```bash
   mysql -u root -p
   ```
3. Create the database:
   ```sql
   CREATE DATABASE attendance_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
4. Seed the database with default demo data:
   ```bash
   # From root project directory (employee-attendance-system)
   mysql -u root -p attendance_db < database/seed.sql
   ```

---

## ⚙️ 2. Backend Setup (`next-backend`)

The backend is built with **Next.js 15 App Router** and **Prisma ORM**.

1. Navigate to the backend directory:
   ```bash
   cd next-backend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env`:
   ```env
   DATABASE_URL="mysql://root:your_password@localhost:3306/attendance_db"
   JWT_SECRET="your_secure_jwt_secret_key_minimum_32_characters"
   PORT=8090
   ```
4. Generate Prisma client:
   ```bash
   npx prisma generate
   ```
5. Start the backend API server:
   ```bash
   npm run dev
   ```
   > 🚀 REST API will start on: `http://localhost:8090/api`

---

## 👑 3. Admin Panel Setup (`admin-panel`)

The admin management dashboard is built with **React 19, TypeScript, Vite, and Tailwind CSS**.

1. Navigate to the admin-panel directory:
   ```bash
   cd ../admin-panel
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   > 👑 Admin Panel will open on: `http://localhost:5200/`

---

## 🧑‍💼 4. Employee Portal Setup (`frontend`)

The employee self-service interface is built with **React 19, TypeScript, Vite, and Tailwind CSS**.

1. Navigate to the employee portal directory:
   ```bash
   cd ../frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   > 🧑‍💼 Employee Portal will open on: `http://localhost:5173/`

---

## 🔑 5. Default Demo Credentials

| Role | Email | Password | Portal |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@eclearnix.com` | `admin@123` | Admin Panel (`:5200`) |
| **Employee (John)** | `john@company.com` | `Password@123` | Employee Portal (`:5173`) |
| **Employee (Jane)** | `jane@company.com` | `Password@123` | Employee Portal (`:5173`) |
| **Employee (Bob)** | `bob@company.com` | `Password@123` | Employee Portal (`:5173`) |
| **Employee (Alice)** | `alice@company.com` | `Password@123` | Employee Portal (`:5173`) |
| **Employee (Charlie)** | `charlie@company.com` | `Password@123` | Employee Portal (`:5173`) |
