# Student Information Management System (SIMS)

[![Backend Tests](https://img.shields.io/badge/backend%20tests-83%20passing-brightgreen.svg)]()
[![Frontend Tests](https://img.shields.io/badge/frontend%20tests-43%20passing-brightgreen.svg)]()
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
   - Role-Based Access Control (RBAC) across `@Roles(Role.ADMIN, Role.REGISTRAR, Role.INSTRUCTOR, Role.STUDENT)`.
   - **Object-Level Authorization (IDOR Prevention):** Students can only access their own profile, grades, and academic records.
4. **Comprehensive Irregular Student & Load Management:**
   - Formal `StudentType` classification (`REGULAR` vs `IRREGULAR`).
   - Configurable `max_allowed_units` per student (default 24 units, or custom lower limits like 15 units for irregular students).
   - Term load summation on enrollment to prevent exceeding allowed credit units (HTTP 400).
   - Cross-section and cross-year level registration flexibility.
5. **Academic Record & Grading Engine:**
   - Instructor assignment verification (only assigned instructors or admins can encode/update grades).
   - Automatic remark derivation (`PASSED` for grades $\le 3.00$, `FAILED` for grades $> 3.00$).
   - Real-time General Weighted Average (GWA) and cumulative GPA calculation grouped by academic term.
6. **Relational Database Integrity (3NF) & Audit Logging:**
   - 9 entities: `User`, `Program`, `Course`, `AcademicTerm`, `CourseOffering`, `Student`, `Enrollment`, `Grade`, `AuditLog`.
   - Composite unique constraints (`@@unique([student_id, course_offering_id])` and `@@unique([academic_year, semester])`).
   - Automated HTTP activity audit logging via interceptors and request logger middleware.
   - Capacity tracking preventing class over-enrollment.
7. **Complete Documentation & Test Coverage:**
   - Interactive Swagger OpenAPI UI (`/api/docs`).
   - Postman Collection v2.1 with 9 resource groups and negative test cases (`docs/sims-api-collection.json`).
   - Automated test suite covering **83 tests across 9 test suites** including all **20 mandatory acceptance demonstration cases**.

---

## 🏗️ Architecture & Documentation

- [Entity-Relationship Diagram (ERD)](docs/ERD.md)
- [System Architecture Document](docs/ARCHITECTURE.md)
- [AI Development & Verification Log](docs/AI_LOG.md)
- [Postman API Collection](docs/sims-api-collection.json)
- [OpenAPI Specification JSON](docs/swagger.json)

### Relational Entity-Relationship Diagram (3NF + Audit)
```mermaid
erDiagram
    USERS ||--o| STUDENTS : "linked_to (1:1 optional)"
    USERS ||--o{ COURSE_OFFERINGS : "assigned_instructor (1:N)"
    USERS ||--o{ AUDIT_LOGS : "acted_by (1:N)"
    PROGRAMS ||--o{ STUDENTS : "enrolls (1:N)"
    COURSES ||--o{ COURSE_OFFERINGS : "schedules (1:N)"
    ACADEMIC_TERMS ||--o{ COURSE_OFFERINGS : "holds (1:N)"
    STUDENTS ||--o{ ENROLLMENTS : "registers (1:N)"
    COURSE_OFFERINGS ||--o{ ENROLLMENTS : "contains (1:N)"
    ENROLLMENTS ||--o| GRADES : "evaluates (1:1)"

    USERS {
        int id PK
        string email UK
        string password_hash
        enum role "ADMIN | REGISTRAR | INSTRUCTOR | STUDENT"
        string name
        enum status "ACTIVE | INACTIVE"
        datetime created_at
    }
    STUDENTS {
        int id PK
        string student_number UK
        int user_id FK,UK
        string first_name
        string last_name
        string email UK
        int program_id FK
        int year_level
        enum student_type "REGULAR | IRREGULAR"
        int max_allowed_units
        enum status "ACTIVE | INACTIVE | GRADUATED | DROPPED"
    }
    PROGRAMS {
        int id PK
        string code UK
        string name
        string description
    }
    COURSES {
        int id PK
        string course_code UK
        string course_title
        int units
    }
    ACADEMIC_TERMS {
        int id PK
        string academic_year
        enum semester "FIRST_SEMESTER | SECOND_SEMESTER | SUMMER"
        boolean is_active
    }
    COURSE_OFFERINGS {
        int id PK
        int course_id FK
        int academic_term_id FK
        int instructor_id FK
        string section
        int capacity
    }
    ENROLLMENTS {
        int id PK
        int student_id FK
        int course_offering_id FK
        enum status "ENROLLED | DROPPED | COMPLETED"
    }
    GRADES {
        int id PK
        int enrollment_id FK,UK
        decimal midterm_grade
        decimal final_grade
        enum remarks "PASSED | FAILED"
    }
    AUDIT_LOGS {
        int id PK
        int actor_id FK
        string action
        string method
        string path
        string resource
        int status_code
        datetime created_at
    }
```

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
Apply the initial schema migration and audit logs migration to PostgreSQL:
```bash
npx prisma migrate dev
```

### 4. Seed the Database
Populate the database with verified demo users, programs, courses, offerings, 100 students (including irregular students), enrollments, and grades:
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
| **ADMIN** | System Admin | `admin@sims.edu` | Full administrative control (CRUD on all resources, user management, audit logs). |
| **REGISTRAR** | Registrar Staff | `registrar@sims.edu` | Manages students directory, programs, courses, academic terms, and course offerings. |
| **INSTRUCTOR** | Prof. Juan Cruz | `prof.cruz@sims.edu` | Can view student records and encode grades for assigned course offerings. |
| **INSTRUCTOR** | Prof. Maria Santos | `prof.santos@sims.edu` | Can encode grades for courses assigned to Prof. Santos. |
| **STUDENT** | Juan Dela Cruz | `student1@sims.edu` | Regular 4th Year BSIT student (Linked to student `2026-00001`, 24 units limit). Protected by IDOR rules. |
| **STUDENT** | Maria Santos | `student2@sims.edu` | Irregular 2nd Year BSIT student (Linked to student `2026-00002`, **15 units limit**). Protected by IDOR rules. |

---

## 📚 API Endpoints Summary

Base URL: `http://localhost:3000/api/v1`

### Authentication (`/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Public | Authenticate user with email and password; returns JWT access token. |
| `POST` | `/auth/logout` | Authenticated | Invalidate current session. |
| `GET` | `/auth/me` | Authenticated | Retrieve authenticated user profile and role details. |

### User Management (`/users`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/users` | ADMIN | List user accounts with role, status, and search filters. |
| `POST` | `/users` | ADMIN | Create a new user account with hashed password and role. |
| `GET` | `/users/instructors` | ADMIN, REGISTRAR | Retrieve list of instructors for offering assignments. |
| `GET` | `/users/:id` | ADMIN | Retrieve user account details by ID. |
| `PATCH` | `/users/:id` | ADMIN | Update user account (name, role, status, password). |
| `DELETE` | `/users/:id` | ADMIN | Delete user account. |

### Activity Audit Logs (`/audit-logs`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/audit-logs` | ADMIN | Paginated HTTP audit log history with filters for action, actor, resource, and dates. |

### Academic Reference Data (`/programs`, `/courses`, `/academic-terms`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/programs` | Authenticated | List all academic programs. |
| `POST` | `/programs` | ADMIN, REGISTRAR | Create a new academic program (rejects duplicate codes with 409). |
| `PUT` | `/programs/:id` | ADMIN, REGISTRAR | Update program code, name, or description. |
| `DELETE` | `/programs/:id` | ADMIN | Delete a program (409 while students remain assigned). |
| `GET` | `/courses` | Authenticated | List all courses with pagination and title/code search (`?search=...`). |
| `POST` | `/courses` | ADMIN, REGISTRAR | Create a new course (validates units 1-6 with 422). |
| `GET` | `/courses/:id` | Authenticated | Get course details by ID. |
| `PUT` | `/courses/:id` | ADMIN, REGISTRAR | Update course code, title, units, or description. |
| `DELETE` | `/courses/:id` | ADMIN | Delete a course (409 while offerings exist). |
| `GET` | `/academic-terms` | Authenticated | List academic terms. |
| `POST` | `/academic-terms` | ADMIN, REGISTRAR | Create an academic term (enforces unique year + semester). |
| `PUT` | `/academic-terms/:id` | ADMIN, REGISTRAR | Update term year/semester, date window, or status. |
| `DELETE` | `/academic-terms/:id` | ADMIN | Delete an academic term (409 while offerings exist). |

### Students (`/students`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/students` | ADMIN, REGISTRAR, INSTRUCTOR | Search, filter (`student_type`, `program_id`, `year_level`), and paginate students. |
| `POST` | `/students` | ADMIN, REGISTRAR | Create a student record (validates `student_number` format). |
| `GET` | `/students/:id` | ADMIN, REGISTRAR, INSTRUCTOR, STUDENT | Retrieve student profile (STUDENT can only access own ID; IDOR protected). |
| `PATCH` | `/students/:id` | ADMIN, REGISTRAR | Update student details, status, or `max_allowed_units`. |
| `DELETE` | `/students/:id` | ADMIN | Soft delete / remove student record. |
| `GET` | `/students/:id/grades` | ADMIN, INSTRUCTOR, STUDENT | List all grades for student (IDOR protected). |
| `GET` | `/students/:id/academic-record` | ADMIN, INSTRUCTOR, STUDENT | Retrieve aggregated academic history with term GWA and cumulative GPA. |

### Course Offerings & Enrollments (`/course-offerings`, `/enrollments`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/course-offerings` | Authenticated | List course offerings filtered by term or instructor. |
| `POST` | `/course-offerings` | ADMIN, REGISTRAR | Create a course offering section with specified capacity limit. |
| `GET` | `/course-offerings/:id` | Authenticated | Retrieve one offering section with its course, term, and instructor. |
| `PUT` | `/course-offerings/:id` | ADMIN, REGISTRAR | Update section, schedule, room, capacity, course, term, or instructor. |
| `DELETE` | `/course-offerings/:id` | ADMIN | Delete an offering section (409 while student enrollments exist). |
| `GET` | `/course-offerings/:id/students` | ADMIN, REGISTRAR, INSTRUCTOR, STUDENT | List enrolled students in section (student viewers have classmate grades masked to null). |
| `POST` | `/enrollments` | ADMIN, REGISTRAR | Enroll a student (enforces capacity, duplicate check, and max unit load; reactivates dropped records). |
| `DELETE` | `/enrollments/:id` | ADMIN, REGISTRAR | Drop an enrollment and release section seat capacity. |

### Grades (`/grades`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/grades` | ADMIN, Assigned INSTRUCTOR | Encode midterm and final grades; auto-derives remarks. |
| `PATCH` | `/grades/:id` | ADMIN, Assigned INSTRUCTOR | Update grade record with auto-updated remarks. |

---

## 🧪 Automated Testing

The project includes unit tests and full End-to-End integration tests executed against the PostgreSQL database using **Vitest**.

```bash
# Run all 83 automated backend tests
npm run test

# Run tests in watch mode
npm run test:watch
```

### Verified Test Suite Breakdown (9 Suites &bull; 83 Tests &bull; 100% Passing)
| Test Suite | File | Tests | Coverage Scope |
| :--- | :--- | :---: | :--- |
| **Acceptance Demo** | `test/acceptance-demonstration.e2e-spec.ts` | 20 | All 20 mandatory laboratory demonstration cases |
| **User Management** | `test/users.e2e-spec.ts` | 9 | User CRUD, role filtering, instructor listing, security |
| **Enrollments** | `test/enrollments.e2e-spec.ts` | 9 | Capacity limits, irregular loads, student roster & grade privacy |
| **Students** | `test/students.e2e-spec.ts` | 9 | Student registration, validation, deep search, IDOR guards |
| **Reference Data** | `test/reference-data.e2e-spec.ts` | 11 | Programs, courses, and terms CRUD and duplicate checks |
| **Audit Logs** | `test/audit-logs.e2e-spec.ts` | 7 | HTTP request interception, actor tracking, and query filters |
| **Authentication** | `test/auth.e2e-spec.ts` | 7 | JWT issuance, logout, /auth/me, invalid credentials |
| **Grades** | `test/grades.e2e-spec.ts` | 5 | Grade encoding, 1.0-5.0 scale, remarks derivation, instructor guard |
| **Common Utilities** | `test/common.spec.ts` | 6 | Response transform interceptors and error filters |

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

## 🤖 AI-Assisted Development & Human Verification

In accordance with Section 3 and Section 21 of the Laboratory Activity II guideline:

1. **AI Assistant Tools Utilized:**
   - **Google Antigravity** pair-programming agent powered by **Gemini 3.8 Flash**.
2. **Permitted AI Contributions:**
   - **Requirements Decomposition:** Mapping syllabus requirements to RESTful domain entities and 3NF relational models.
   - **Scaffolding:** Generating NestJS modules, Prisma models, DTOs with `class-validator`, and standard RFC-7807 error envelopes.
   - **Test Engineering:** Scaffolding the 83-test Vitest E2E suite covering positive, negative, validation, and security cases.
   - **Debugging & Workarounds:** Diagnosing Windows Prisma engine download failures and configuring local engine path overrides; resolving unique constraint collisions in parallel test runs.
3. **Human Developer Verification & Ownership:**
   - **Static Verification:** 100% TypeScript type safety via `nest build` and `tsc -b`.
   - **Automated Verification:** All 83 backend tests and 43 frontend tests executed and passing against live PostgreSQL.
   - **Security Audits:** Verified zero plaintext passwords, bcrypt salt rounds, stateless JWT validation, and server-side object-level authorization (IDOR).
   - Detailed prompt-by-prompt entries are preserved in [`docs/AI_LOG.md`](docs/AI_LOG.md).

---

## 📖 API Documentation & Postman

- **Swagger OpenAPI UI:** Visit `http://localhost:3000/api/docs` in your browser when the server is running.
- **Postman Collection:** Import `docs/sims-api-collection.json` into Postman or Insomnia. It includes environment variables (`baseUrl`, `token`) and pre-configured test requests for all 9 resource groups.

---

## 📄 License
This project is developed for educational purposes under the Special Topics Laboratory Activity.
