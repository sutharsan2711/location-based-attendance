# 📍 GeoAttend — Enterprise Location-Based Attendance & HRMS Platform

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)

An enterprise-grade, full-stack monorepo Human Resource Management System (HRMS) featuring **geofenced physical boundary attendance tracking**, dual administrative and employee self-service portals, comprehensive leave and permission lifecycles, automated payroll calculation, KPI tracking, company asset management, and real-time announcements.

---

## 📑 Table of Contents

- [Key Features](#-key-features)
  - [1. Geofenced Attendance & Anti-Spoofing](#1-geofenced-attendance--anti-spoofing)
  - [2. Dual Portal Architecture](#2-dual-portal-architecture)
  - [3. Leave & Permission Management](#3-leave--permission-management)
  - [4. Payroll & Salary Structure](#4-payroll--salary-structure)
  - [5. Daily Work Plans & KPI Tracking](#5-daily-work-plans--kpi-tracking)
  - [6. Asset Inventory & Maintenance](#6-asset-inventory--maintenance)
  - [7. Announcements & Sticky Notes](#7-announcements--sticky-notes)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Monorepo Directory Structure](#-monorepo-directory-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Database Setup](#1-database-setup)
  - [2. Backend Setup (Next.js & Prisma)](#2-backend-setup-nextjs--prisma)
  - [3. Admin Panel Setup](#3-admin-panel-setup)
  - [4. Employee Portal Setup](#4-employee-portal-setup)
  - [5. Running with Docker](#5-running-with-docker)
- [Default Demo Credentials](#-default-demo-credentials)
- [API Architecture & Key Endpoints](#-api-architecture--key-endpoints)
- [Security & Compliance](#-security--compliance)
- [Documentation Links](#-documentation-links)
- [License](#-license)

---

## 🚀 Key Features

### 1. Geofenced Attendance & Anti-Spoofing
* **Haversine Distance Validation:** Calculates high-precision spherical distance between device GPS coordinates and configured office premises on the backend.
* **Accuracy Threshold Enforcements:** Rejects simulated or inaccurate GPS fixes exceeding configurable limits (e.g. $\pm 100\text{m}$).
* **Department Grace Timings:** Customizable shift timings, login/logout thresholds, and grace periods configured per department (IT, EdTech, Business, OG).
* **Double-Punch Prevention:** Database-level uniqueness constraints guarantee single check-in/out records per employee per calendar day.
* **Live Status Categorization:** Automatically maps punch logs into statuses: `PRESENT`, `LATE`, `WORKING`, `PERMISSION`, `LEAVE`, or `ABSENT`.

### 2. Dual Portal Architecture
* **Admin HR Command Center (`:5200`):**
  * Real-time employee directory with role & status controls.
  * Interactive Leaflet Map for geofence boundary configuration.
  * Live Attendance Calendar with bulk filters and historical logs.
  * Leave approvals, carry-forward allocations, and permission review modals.
  * Monthly payroll generation, salary structures, and payslip dispatch.
  * Department KPI scoreboards, tasks management, and announcements broadcasting.
  * Full data export in CSV and XLSX (Excel) formats.
* **Employee Self-Service Portal (`:5173`):**
  * One-click GPS Punch-In and Punch-Out with real-time distance feedback.
  * Personal attendance calendars and month-by-month history.
  * Leave request submissions with half-day options and task handover assignments.
  * Hourly permission requests with real-time status tracking.
  * Daily work log submissions, task checklists, and self KPI scoring.
  * Company asset requests and digital payslip viewer.

### 3. Leave & Permission Management
* **Flexible Leave Categories:** Casual Leave (CL), Sick Leave (SL), Comp-Off (CO), Loss of Pay (LOP), Work From Home (WFH), and Special Leaves.
* **Half-Day Support:** Configurable for First-Half or Second-Half sessions.
* **Handover Employee Assignment:** Delegate operational tasks to a colleague during absence.
* **Annual Carry Forward:** Admin-managed rollover of unused leave balances to the next calendar year.
* **Time-Bound Permissions:** Granular time-slot requests for short official/personal leaves.

### 4. Payroll & Salary Structure
* **Dynamic Earnings & Deductions:** Configurable Basic Salary, HRA, DA, Conveyance, Medical, and Other Allowances alongside PF, ESI, Professional Tax, and customized deductions.
* **Automated Computations:** Instant payslip generation calculating gross salary, attendance deductions for unapproved leaves/absent days, and net salary.
* **Digital Payslips:** Downloadable and viewable payslip breakdown for all staff members.

### 5. Daily Work Plans & KPI Tracking
* **Daily Plan Submissions:** Employees log daily objectives, priorities, and category tags.
* **Time Tracking & Reason Logs:** Document time spent per task and explanations for impediments.
* **KPI Scoring:** Daily performance rating system with team-wide analytical scorecards.

### 6. Asset Inventory & Maintenance
* **Hardware & Equipment Registry:** Track laptops, monitors, peripherals, access cards, and furniture by asset codes, serial numbers, and condition.
* **Allocation Lifecycles:** Assign assets directly to employee profiles.
* **Support Workflows:** Employee request portal for repair, replacement, or new hardware requisition.

### 7. Announcements & Sticky Notes
* **Targeted Notice Board:** Publish department-specific or company-wide announcements with expiration dates and priority badges.
* **Personal Sticky Notes:** Color-coded quick notes with checklist items and pinning capabilities for both admins and employees.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Clients["Frontend Applications"]
        Admin[Admin Panel :5200<br/>React 19 + Vite + Tailwind CSS]
        Employee[Employee Portal :5173<br/>React 19 + Vite + Tailwind CSS]
    end

    subgraph API_Layer["Next.js Backend Server :8090"]
        MW[Authentication Middleware<br/>JWT Verification & RBAC]
        Geo[Geofencing Engine<br/>Haversine Validation]
        Routes[API Route Handlers<br/>Auth / Attendance / Leaves / Payroll / Assets]
    end

    subgraph Data_Layer["Database & Storage"]
        Prisma[Prisma ORM Client]
        MySQL[(MySQL 8 Database<br/>attendance_db)]
    end

    Admin -->|REST API / JSON| MW
    Employee -->|GPS + REST API| MW
    MW --> Routes
    Routes --> Geo
    Routes --> Prisma
    Prisma --> MySQL
```

---

## 🛠️ Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Backend API** | **Next.js 15 (App Router)** | High-performance modular REST API endpoints |
| **Database ORM** | **Prisma 6** | Type-safe schema migrations & query builder |
| **Database** | **MySQL 8.x** | Relational data persistence with strict foreign keys |
| **Admin Frontend** | **React 19 + Vite 8** | Modern administrative Single Page Application |
| **Employee Frontend** | **React 19 + Vite 8** | Responsive employee self-service interface |
| **Styling** | **Tailwind CSS v4** | Rapid, unified modern design system |
| **Authentication** | **JWT (`jose`) + `bcryptjs`** | Stateless tokens & salted password hashing |
| **Maps & Geolocation** | **Leaflet + Geolocation API** | Interactive boundary mapping & coordinates capture |
| **Charts & Analytics**| **Recharts** | Reactive analytics charts and KPI progress bars |
| **File Export** | **SheetJS (XLSX)** | Excel & CSV tabular reports generation |
| **Containerization** | **Docker** | Multi-stage production container build |

---

## 📁 Monorepo Directory Structure

```
employee-attendance-system/
├── admin-panel/                  # Admin HR portal (React 19, Vite, Tailwind CSS v4)
│   ├── src/
│   │   ├── components/           # Admin modals, navigation, table components
│   │   ├── context/              # Auth & notification states
│   │   ├── layouts/              # Admin dashboard layout
│   │   ├── pages/admin/          # Attendance, Leaves, Payroll, Assets, KPI, Reports
│   │   └── services/             # Axios API service clients
│   └── package.json
│
├── frontend/                     # Employee portal (React 19, Vite, Tailwind CSS v4)
│   ├── src/
│   │   ├── components/           # Punch card, sidebar, topbar, modals
│   │   ├── context/              # Employee session & context providers
│   │   ├── pages/employee/       # Dashboard, History, Leaves, Payroll, Tasks, Assets
│   │   └── services/             # Axios API client integrations
│   └── package.json
│
├── next-backend/                 # Core REST API (Next.js 15, Prisma ORM, MySQL)
│   ├── prisma/
│   │   └── schema.prisma         # Complete data model definition
│   ├── src/
│   │   ├── app/api/              # REST routes (auth, attendance, leaves, payroll, etc.)
│   │   ├── lib/                  # JWT auth, Prisma singleton, Haversine helpers
│   │   └── middleware.ts         # Role-based route guard
│   └── package.json
│
├── database/                     # Raw SQL scripts
│   ├── schema.sql                # Initial relational schema definition
│   └── seed.sql                  # Default admin and employee demo data
│
├── docs/                         # Project Documentation
│   ├── API_DOCUMENTATION.md      # Comprehensive REST API specifications
│   ├── DATABASE_DOCUMENTATION.md # Entity-relationship and table dictionary
│   └── SETUP.md                  # Detailed environment bootstrap guide
│
├── Dockerfile                    # Multi-stage production Dockerfile
└── README.md                     # Monorepo overview documentation
```

---

## ⚡ Getting Started

### Prerequisites
* **Node.js:** `v20.x` or `v22.x` (LTS recommended)
* **npm:** `v10.x` or higher
* **MySQL:** Server `8.0+`
* **Docker:** *(Optional)* for containerized deployments

---

### 1. Database Setup

1. Launch your MySQL server instance.
2. Create the target database:
   ```sql
   CREATE DATABASE attendance_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. *(Optional)* Seed initial records using the provided SQL script:
   ```bash
   mysql -u root -p attendance_db < database/seed.sql
   ```

---

### 2. Backend Setup (Next.js & Prisma)

1. Open the backend directory:
   ```bash
   cd next-backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create an environment file `.env` (or copy `.env.example`):
   ```env
   DATABASE_URL="mysql://root:your_password@localhost:3306/attendance_db"
   JWT_SECRET="your_ultra_secure_jwt_secret_key_at_least_32_characters"
   PORT=8090
   ```
4. Generate Prisma client & sync schema:
   ```bash
   npx prisma generate
   ```
5. Start the backend development server:
   ```bash
   npm run dev
   ```
   > 🚀 Backend API will be active at: `http://localhost:8090/api`

---

### 3. Admin Panel Setup

1. Open the admin panel directory:
   ```bash
   cd ../admin-panel
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   > 👑 Admin Dashboard will be active at: `http://localhost:5200`

---

### 4. Employee Portal Setup

1. Open the employee portal directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   > 🧑‍💼 Employee Portal will be active at: `http://localhost:5173`

---

### 5. Running with Docker

You can build and package the application using the multi-stage Docker build:

```bash
# Build the Docker image
docker build -t geoattend-backend .

# Run the container
docker run -d -p 8090:8090 \
  -e DATABASE_URL="mysql://root:password@host.docker.internal:3306/attendance_db" \
  -e JWT_SECRET="production_jwt_secret_key" \
  geoattend-backend
```

---

## 🔑 Default Demo Credentials

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@eclearnix.com` | `admin@123` | Full HRMS & Configuration Control (`:5200`) |
| **Software Engineer** | `john@company.com` | `Password@123` | Self-Service Employee Portal (`:5173`) |
| **UI/UX Designer** | `jane@company.com` | `Password@123` | Self-Service Employee Portal (`:5173`) |
| **QA Engineer** | `bob@company.com` | `Password@123` | Self-Service Employee Portal (`:5173`) |
| **DevOps Specialist** | `alice@company.com` | `Password@123` | Self-Service Employee Portal (`:5173`) |

---

## 📡 API Architecture & Key Endpoints

| Category | Endpoint | Method | Role | Description |
| :--- | :--- | :---: | :---: | :--- |
| **Auth** | `/api/auth/login` | `POST` | Public | Authenticates credentials and issues JWT token |
| **Auth** | `/api/auth/me` | `GET` | User | Fetches active profile data and permissions |
| **Attendance**| `/api/attendance/login` | `POST` | Employee | Validates coordinates & registers check-in punch |
| **Attendance**| `/api/attendance/logout` | `POST` | Employee | Validates coordinates & registers check-out punch |
| **Attendance**| `/api/attendance/today` | `GET` | Employee | Retrieves current daily attendance status |
| **Attendance**| `/api/attendance/history` | `GET` | Employee | Retrieves personal attendance historical records |
| **Admin** | `/api/admin/dashboard` | `GET` | Admin | Fetches organization KPI & active attendance summary |
| **Admin** | `/api/employees` | `GET/POST`| Admin | CRUD directory for staff records & roles |
| **Location** | `/api/location` | `GET/PUT` | Admin | Configures geofence coordinates & allowed radius |
| **Leaves** | `/api/leaves` | `GET/POST`| User | Submits and lists leave requests |
| **Leaves** | `/api/leaves/[id]/status`| `PATCH`| Admin | Approves or rejects submitted leave requests |
| **Payroll** | `/api/payroll` | `GET/POST`| Admin | Generates and computes monthly payroll sheets |
| **Assets** | `/api/assets` | `GET/POST`| User/Admin| Inventory tracking and asset assignment lifecycle |
| **Tasks** | `/api/tasks` | `GET/POST`| User/Admin| Task delegation, status changes, and work plans |

For a complete reference with all request/response schemas, refer to [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md).

---

## 🔒 Security & Compliance

1. **Server-Side Authority:** Device time is ignored for attendance stamping. System clocks (`Asia/Kolkata` standard timezone) generate punch records on the server.
2. **Double Verification:** Geolocation offsets are computed on the client for user guidance, but coordinates are re-evaluated using the Haversine formula on the server before recording database transactions.
3. **Stateless JWT Tokens:** User identity is verified per request with cryptographically signed JSON Web Tokens (`HS256`).
4. **Password Cryptography:** All passwords are salted and hashed with `bcryptjs`.
5. **Role-Based Access Control (RBAC):** Middleware checks prevent unauthorized access to administrative endpoints and employee datasets.

---

## 📚 Documentation Links

* [📖 REST API Documentation](docs/API_DOCUMENTATION.md)
* [🗄️ Database Design & Schema Dictionary](docs/DATABASE_DOCUMENTATION.md)
* [🚀 Local System Setup Manual](docs/SETUP.md)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
