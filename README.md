# Student Information Management System (SIMS)
## Laboratory Activities II & III (Special Topics in Software Development)

[![Backend Tests](https://img.shields.io/badge/backend%20tests-61%20passing-brightgreen.svg)]()
[![Frontend Tests](https://img.shields.io/badge/frontend%20tests-30%20passing-brightgreen.svg)]()
[![NestJS](https://img.shields.io/badge/NestJS-11.0.11-E0234E.svg?logo=nestjs)]()
[![React](https://img.shields.io/badge/React-19.0.0-61DAFB.svg?logo=react)]()
[![Vite](https://img.shields.io/badge/Vite-6.0.0-646CFF.svg?logo=vite)]()
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC.svg?logo=tailwind-css)]()
[![Prisma](https://img.shields.io/badge/Prisma-6.4.1-2D3748.svg?logo=prisma)]()
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18.1-336791.svg?logo=postgresql)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-3178C6.svg?logo=typescript)]()

A complete full-stack enterprise **Student Information Management System (SIMS)** composed of:
1. **Activity II:** Production-grade RESTful API built with **NestJS 11**, **TypeScript**, **Prisma ORM**, and **PostgreSQL 18** (served on `http://localhost:3000/api/v1`).
2. **Activity III:** Independent, modern Single-Page Application (SPA) client built with **React 19**, **Vite 6**, **TypeScript 5**, **Tailwind CSS v4**, and **TanStack Query v5** (served on `http://localhost:5173`). See [frontend/README.md](frontend/README.md).

---

## 🌟 Key Features

1. **Enterprise Layered Architecture:** Modular NestJS design with Controllers, Services, Guards, Interceptors, Pipes, and Filters.
2. **Strict RESTful Design & Standard Envelopes:**
   - Success envelope: `{ success: true, message: "...", data: { ... }, meta: { ... } }`
   - RFC-7807/consistent error envelope: `{ success: false, message: "...", errors: { [field]: [rules] } }` with HTTP 422 for validation errors.
3. **Robust Security & Access Control:**
   - Stateless JWT authentication (`/api/v1/auth/login`, `/api/v1/auth/me`).
   - Role-Based Access Control (RBAC) with `@Roles(Role.ADMIN, Role.INSTRUCTOR, Role.STUDENT)`.
   - **Object-Level Authorization (IDOR Prevention):** Students can only access their own profile, grades, and academic records.
4. **Comprehensive Irregular Student & Load Management:**
   - Formal `StudentType` classification (`REGULAR` vs `IRREGULAR`).
   - Configurable `max_allowed_units` per student (default 24 units, or custom lower limits for probation/underload).
   - Term load summation on enrollment to prevent exceeding allowed credit units (HTTP 400).
   - Cross-section and cross-year level registration flexibility.
5. **Academic Record & Grading Engine:**
   - Instructor assignment verification (only assigned instructors or admins can encode/update grades).
   - Automatic remark derivation (`PASSED` for grades $\le 3.00$, `FAILED` for grades $> 3.00$).
   - Real-time General Weighted Average (GWA) and cumulative GPA calculation grouped by academic term.
6. **Relational Database Integrity (3NF):**
   - 8 entities: `User`, `Program`, `Course`, `AcademicTerm`, `CourseOffering`, `Student`, `Enrollment`, `Grade`.
   - Composite unique constraints (`@@unique([student_id, course_offering_id])` and `@@unique([academic_year, semester])`).
   - Capacity tracking preventing class over-enrollment.
7. **Complete Documentation & Test Coverage:**
   - Interactive Swagger OpenAPI UI (`/api/docs`).
   - Postman Collection v2.1 with 9 resource groups and negative test cases (`docs/sims-api-collection.json`).
   - Automated test suite covering **61 E2E tests** including all **20 mandatory acceptance demonstration cases**.

---

## 🏗️ Architecture & Documentation

- [Entity-Relationship Diagram (ERD)](docs/ERD.md)
- [System Architecture Document](docs/ARCHITECTURE.md)
- [AI Development & Verification Log](docs/AI_LOG.md)
- [Postman API Collection](docs/sims-api-collection.json)
- [OpenAPI Specification JSON](docs/swagger.json)

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- **PostgreSQL**: v14+ (tested on PostgreSQL 18.1)

### 1. Environment Setup
Copy the template environment file:
```bash
cp .env.example .env
```
Edit `.env` to configure your PostgreSQL credentials:
```ini
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/student_ims?schema=public"
JWT_SECRET="supersecret_jwt_key_for_development_purposes_only_replace_in_production"
JWT_EXPIRES_IN="24h"
```

> **Note for Windows Users:** If your environment blocks downloading Prisma query engine binaries, uncomment and point `PRISMA_QUERY_ENGINE_LIBRARY` and `PRISMA_SCHEMA_ENGINE_BINARY` to your local `node_modules/@prisma/engines/` folder as demonstrated in `.env.example`.

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Database Migrations
Apply the initial schema migration to PostgreSQL:
```bash
npx prisma migrate dev
```

### 4. Seed the Database
Populate the database with demo users, programs, courses, offerings, 100 students (including 20 irregular students), enrollments, and grades:
```bash
npm run prisma:seed
```

### 5. Start the Server
```bash
# Development server (with hot reload)
npm run start:dev

# Production build & run
npm run build
npm run start:prod
```

The API will be live at `http://localhost:3000/api/v1`.

---

## 👥 Demo Test Accounts

All demo accounts use the standard password: **`Password123!`**

| Role | Name | Email | Permissions / Notes |
| :--- | :--- | :--- | :--- |
| **ADMIN** | System Admin | `admin@sims.edu` | Full administrative control (CRUD on all resources, bypasses instructor restrictions). |
| **INSTRUCTOR** | Prof. Juan Cruz | `prof.cruz@sims.edu` | Can view student records and encode grades for assigned course offerings. |
| **INSTRUCTOR** | Prof. Maria Santos | `prof.santos@sims.edu` | Can encode grades for courses assigned to Prof. Santos. |
| **STUDENT** | Juan Dela Cruz | `student1@sims.edu` | Regular 4th Year BSIT student (Linked to student `2026-00001`). Protected by IDOR rules. |
| **STUDENT** | Maria Santos | `student2@sims.edu` | Irregular 3rd Year BSIT student (Linked to student `2026-00002`). Protected by IDOR rules. |

---

## 📚 API Endpoints Summary

Base URL: `http://localhost:3000/api/v1`

### Authentication (`/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Public | Authenticate user with email and password; returns JWT access token. |
| `POST` | `/auth/logout` | Authenticated | Invalidate current session. |
| `GET` | `/auth/me` | Authenticated | Retrieve authenticated user profile and role details. |

### Academic Reference Data (`/programs`, `/courses`, `/academic-terms`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/programs` | Authenticated | List all academic programs. |
| `POST` | `/programs` | ADMIN | Create a new academic program (rejects duplicate codes with 409). |
| `GET` | `/courses` | Authenticated | List all courses with pagination and title/code search. |
| `POST` | `/courses` | ADMIN | Create a new course (validates units 1-6 with 422). |
| `GET` | `/courses/:id` | Authenticated | Get course details by ID. |
| `GET` | `/academic-terms` | Authenticated | List academic terms. |
| `POST` | `/academic-terms` | ADMIN | Create an academic term (enforces unique year + semester). |

### Students (`/students`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/students` | ADMIN, INSTRUCTOR | Search, filter (`student_type`, `program_id`, `year_level`), and paginate students. |
| `POST` | `/students` | ADMIN | Create a student record (validates `student_number` regex `^\d{4}-\d{5}$`). |
| `GET` | `/students/:id` | ADMIN, INSTRUCTOR, STUDENT | Retrieve student profile (STUDENT can only access own ID; IDOR protected). |
| `PATCH` | `/students/:id` | ADMIN | Update student details, status, or `max_allowed_units`. |
| `DELETE` | `/students/:id` | ADMIN | Soft delete / remove student record. |
| `GET` | `/students/:id/grades` | ADMIN, INSTRUCTOR, STUDENT | List all grades for student (IDOR protected). |
| `GET` | `/students/:id/academic-record` | ADMIN, INSTRUCTOR, STUDENT | Retrieve aggregated academic history with term GWA and cumulative GPA. |

### Course Offerings & Enrollments (`/course-offerings`, `/enrollments`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/course-offerings` | Authenticated | List course offerings filtered by term or instructor. |
| `POST` | `/course-offerings` | ADMIN | Create a course offering section with specified capacity limit. |
| `GET` | `/course-offerings/:id/students` | ADMIN, INSTRUCTOR | List all students enrolled in an offering section. |
| `POST` | `/enrollments` | ADMIN | Enroll a student (enforces section capacity, duplicate check, and max unit load). |
| `DELETE` | `/enrollments/:id` | ADMIN | Drop or delete an enrollment. |

### Grades (`/grades`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/grades` | ADMIN, Assigned INSTRUCTOR | Encode midterm and final grades; auto-derives remarks. |
| `PATCH` | `/grades/:id` | ADMIN, Assigned INSTRUCTOR | Update grade record with auto-updated remarks. |

---

## 🧪 Automated Testing

The project includes unit tests and full End-to-End integration tests executed against the PostgreSQL database using **Vitest**.

```bash
# Run all 61 automated tests
npm run test

# Run tests in watch mode
npm run test:watch
```

### Mandatory 20 Demonstration Cases Verified (`test/acceptance-demonstration.e2e-spec.ts`)
1. Case 01: Successful Authentication (200 OK)
2. Case 02: Invalid Credentials Rejection (401 Unauthorized)
3. Case 03: Protected Route Access Without Token (401 Unauthorized)
4. Case 04: Role-Based Authorization Enforcement (403 Forbidden)
5. Case 05: Valid Student Record Creation (201 Created)
6. Case 06: Field Validation Failure (422 Unprocessable Content)
7. Case 07: Duplicate Unique Key Rejection (409 Conflict)
8. Case 08: Single Resource Retrieval (200 OK)
9. Case 09: Non-Existent Resource Retrieval (404 Not Found)
10. Case 10: Resource Modification (200 OK)
11. Case 11: Resource Deletion (200 OK)
12. Case 12: Paginated List Retrieval with Metadata (200 OK)
13. Case 13: Filtered & Sorted Query Retrieval (200 OK)
14. Case 14: Search Functionality (200 OK)
15. Case 15: Course Offering Creation with Capacity Limit (201 Created)
16. Case 16: Student Enrollment Processing & Duplicate Prevention (201 & 409)
17. Case 17: Offering Capacity Limit Enforcement (400 Bad Request when full)
18. Case 18: Grade Encoding by Assigned Instructor (201 Created)
19. Case 19: Grade Encoding by Unauthorized Instructor Blocked (403 Forbidden)
20. Case 20: Aggregated Academic Record with GWA & Term Grouping (200 OK)

---

## 📖 API Documentation & Postman

- **Swagger OpenAPI UI:** Visit `http://localhost:3000/api/docs` in your browser when the server is running.
- **Postman Collection:** Import `docs/sims-api-collection.json` into Postman or Insomnia. It includes environment variables (`baseUrl`, `token`) and pre-configured test requests for all 9 resource groups.

---

## 📄 License
This project is developed for educational purposes under the Special Topics Laboratory Activity.
