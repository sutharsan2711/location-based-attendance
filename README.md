# Employee Location-Based Login & Logout Management System

A production-ready full-stack monorepo system for tracking and verifying employee attendance based on physical boundaries (using the browser's Geolocation API and backend Haversine validations).

## 🚀 Key Features

* **Role-Based Workflows:**
  * **ADMIN:** Manage employee records, configure office location/allowed boundary radius/max GPS accuracy constraints, and run visual dashboard insights and CSV report logs.
  * **EMPLOYEE:** Perform check-ins (login) and check-outs (logout) when physically within boundary parameters, view real-time boundary offsets, and inspect historical check logs.
* **Geographical Boundary Enforcement:**
  * Client-side browser Geolocation API accuracy checks.
  * Server-side Haversine distance offset validation.
  * Rejects spoofed/inaccurate locations exceeding customizable device precision limits (e.g. ±100m).
* **Double Punch Prevention:**
  * Enforces database-level uniqueness constraints mapping employee and dates to reject duplicate clock-ins and clock-outs.
* **Secure API Layer:**
  * JWT-stateless security mapping roles and token expiries.
  * BCrypt password hashing.

---

## 🛠️ Technology Stack

* **Frontend:** React 18, TypeScript, Vite, React Router, Tailwind CSS, React Hook Form, Recharts, Lucide Icons, Axios.
* **Backend:** Java 21, Spring Boot 3.3.2, Spring Security, JWT (jjwt), Hibernate, Spring Data JPA, MySQL 8.x.
* **Build/Dev Tools:** Maven, Git, NPM.

---

## 📁 Project Structure

```
employee-attendance-system/
├── backend/                  # Spring Boot REST API & JUnit test suites
├── frontend/                 # React TS Vite interface & Tailwind css
├── database/                 # MySQL schemas and data seed scripts
├── docs/                     # System API, Database & Setup manuals
└── README.md                 # Main project roadmap overview
```

For setup and execution guidelines, refer to the [System Setup Guide](docs/SETUP.md).
For detailed API documentation, refer to the [REST API Documentation](docs/API_DOCUMENTATION.md).
For database design, refer to the [Database Documentation](docs/DATABASE_DOCUMENTATION.md).

---

## 🔒 Security Design Notes
1. **Server-Side Timestamp Control:** Attendance punches are logged using server system clock values (`Asia/Kolkata` standard timezone) rather than trusting client-side timestamps.
2. **Stateless JWT:** User session states are managed using JWTs stored in the browser storage, verified at the API gateway layer using secure signature hashing.
3. **Password Security:** Passwords are never stored or logged in plain text. They are hashed using BCrypt.
4. **Boundary Checks:** Client-side distances are computed to assist user experience, but the backend performs full re-validation of coordinates before writing punch logs.
