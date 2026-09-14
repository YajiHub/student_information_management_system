# Design Specification: Student Information Management System REST API (Activity 2)

## 1. Overview & Purpose
This document specifies the technical design and architectural contract for the **Student Information Management System (SIMS) REST API**, implemented for Laboratory Activity II. The system provides backend endpoints for student management, course offerings, enrollments, grading, and academic-record aggregation, consumed downstream by a frontend application in Laboratory Activity III.

---

## 2. Technology Stack & Runtimes
* **Language & Runtime**: TypeScript 5.x on Node.js v24.13.0
* **Backend Framework**: NestJS 11 (Modular Architecture, Dependency Injection)
* **ORM & Migrations**: Prisma ORM with PostgreSQL driver
* **Database Engine**: PostgreSQL 18.1 (Local service `postgresql-x64-18`)
* **Authentication**: Passport-JWT, `@nestjs/jwt`, `bcryptjs`
* **Validation & DTOs**: `class-validator`, `class-transformer`
* **API Documentation**: OpenAPI 3.0 / Swagger UI via `@nestjs/swagger` mounted at `/api/docs`
* **Testing**: Vitest + Supertest for automated unit and E2E integration tests
* **Seeder Engine**: `@faker-js/faker` with deterministic relational seeding

---

## 3. Architecture & Directory Layout

The application adheres to standard NestJS modular architecture with separation of concerns:
* **Controllers**: Expose REST endpoints, bind parameters, declare OpenAPI decorators.
* **Services**: Implement domain logic, transaction handling, and object-level permission checks.
* **DTOs (Data Transfer Objects)**: Define strict typed payloads with validation decorators.
* **Prisma Layer**: Encapsulates parameterized SQL queries and database relational schema.
* **Global Interceptors & Filters**: Standardize JSON response and error envelopes.

```
student_ims/
├── prisma/
│   ├── schema.prisma              # Database schema & relations
│   ├── migrations/                # Versioned SQL migration files
│   └── seed.ts                    # Relational test data generator
├── src/
│   ├── common/
│   │   ├── decorators/            # @Public(), @Roles(), @CurrentUser()
│   │   ├── guards/                # JwtAuthGuard, RolesGuard
│   │   ├── filters/               # AllExceptionsFilter (safe error output)
│   │   ├── interceptors/          # TransformInterceptor (standard JSON wrap)
│   │   └── dto/                   # PaginationQueryDto, ApiSuccessResponseDto
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts      # Singleton DB connection
│   ├── auth/                      # Login, logout, me, JWT strategies
│   ├── users/                     # User management & roles
│   ├── programs/                  # Academic degree programs
│   ├── courses/                   # Course catalog
│   ├── academic-terms/            # Semester terms
│   ├── course-offerings/          # Scheduled sections & capacity
│   ├── students/                  # Student records, search, filter, paginate
│   ├── enrollments/               # Student course enrollment & duplicates
│   ├── grades/                    # Grade entry, modification, authorization
│   ├── academic-record/           # Aggregated transcript by term
│   ├── app.module.ts              # Root application module
│   └── main.ts                    # Entrypoint, CORS, Swagger, Global Pipes
├── test/                          # E2E integration test suites (Vitest)
├── docs/                          # Architecture doc, ERD, AI development log
├── .env.example                   # Safe environment template
├── package.json
└── tsconfig.json
```

---

## 4. Database Schema & Relational Model (Prisma)

### 4.1 Enums
* `Role`: `ADMIN`, `REGISTRAR`, `INSTRUCTOR`, `STUDENT`
* `UserStatus`: `ACTIVE`, `INACTIVE`
* `StudentStatus`: `ACTIVE`, `INACTIVE`, `GRADUATED`, `DROPPED`
* `StudentType`: `REGULAR`, `IRREGULAR`
* `RecordStatus`: `ACTIVE`, `INACTIVE`
* `Semester`: `FIRST_SEMESTER`, `SECOND_SEMESTER`, `SUMMER`
* `EnrollmentStatus`: `ENROLLED`, `DROPPED`, `COMPLETED`

### 4.2 Entity Relations & Constraints
1. **`User`**:
   - `id` (Int, PK, autoincrement)
   - `name` (String)
   - `email` (String, Unique)
   - `password_hash` (String)
   - `role` (Role Enum)
   - `status` (UserStatus Enum, default `ACTIVE`)
   - `created_at`, `updated_at` (DateTime)
   - Relations: `student` (1:1 optional), `instructor_offerings` (1:N CourseOffering)

2. **`Program`**:
   - `id` (Int, PK, autoincrement)
   - `code` (String, Unique, e.g. "BSIT")
   - `name` (String)
   - `description` (String?)
   - `status` (RecordStatus Enum, default `ACTIVE`)
   - `created_at`, `updated_at`
   - Relations: `students` (1:N)

3. **`Student`**:
   - `id` (Int, PK, autoincrement)
   - `student_number` (String, Unique, e.g. "2026-00001")
   - `first_name` (String), `middle_name` (String?), `last_name` (String), `suffix` (String?)
   - `birth_date` (DateTime)
   - `email` (String, Unique)
   - `contact_number` (String?)
   - `address` (String?)
   - `program_id` (Int, FK to `Program`, onDelete: Restrict)
   - `user_id` (Int?, Unique FK to `User`, onDelete: SetNull)
   - `year_level` (Int, 1-4)
   - `student_type` (StudentType Enum, default `REGULAR`)
   - `max_allowed_units` (Int, default 24, customized for overload/underload)
   - `status` (StudentStatus Enum, default `ACTIVE`)
   - `created_at`, `updated_at`
   - Relations: `program`, `user`, `enrollments` (1:N)
   - Indices: `[student_number]`, `[last_name]`, `[email]`, `[student_type]`

4. **`Course`**:
   - `id` (Int, PK, autoincrement)
   - `course_code` (String, Unique, e.g. "IT312")
   - `course_title` (String)
   - `description` (String?)
   - `units` (Int, default 3)
   - `status` (RecordStatus Enum, default `ACTIVE`)
   - `created_at`, `updated_at`
   - Relations: `offerings` (1:N)

5. **`AcademicTerm`**:
   - `id` (Int, PK, autoincrement)
   - `academic_year` (String, e.g. "2026-2027")
   - `semester` (Semester Enum)
   - `start_date` (DateTime), `end_date` (DateTime)
   - `status` (RecordStatus Enum, default `ACTIVE`)
   - `created_at`, `updated_at`
   - Constraints: `@@unique([academic_year, semester])`
   - Relations: `offerings` (1:N)

6. **`CourseOffering`**:
   - `id` (Int, PK, autoincrement)
   - `course_id` (Int, FK to `Course`, onDelete: Restrict)
   - `academic_term_id` (Int, FK to `AcademicTerm`, onDelete: Restrict)
   - `instructor_id` (Int, FK to `User`, onDelete: Restrict)
   - `section` (String, e.g. "4A")
   - `schedule` (String, e.g. "MW 09:00 - 10:30")
   - `room` (String, e.g. "Lab 3")
   - `capacity` (Int, default 40)
   - `status` (RecordStatus Enum, default `ACTIVE`)
   - `created_at`, `updated_at`
   - Relations: `course`, `academic_term`, `instructor`, `enrollments` (1:N)

7. **`Enrollment`**:
   - `id` (Int, PK, autoincrement)
   - `student_id` (Int, FK to `Student`, onDelete: Restrict)
   - `course_offering_id` (Int, FK to `CourseOffering`, onDelete: Restrict)
   - `enrollment_date` (DateTime, default now)
   - `status` (EnrollmentStatus Enum, default `ENROLLED`)
   - `created_at`, `updated_at`
   - Constraints: **`@@unique([student_id, course_offering_id])`** (Prevents duplicate enrollment)
   - Relations: `student`, `course_offering`, `grade` (1:1 optional)

8. **`Grade`**:
   - `id` (Int, PK, autoincrement)
   - `enrollment_id` (Int, Unique FK to `Enrollment`, onDelete: Cascade)
   - `midterm_grade` (Decimal(4,2)?, e.g. 1.75)
   - `final_grade` (Decimal(4,2)?, e.g. 1.50)
   - `remarks` (String?, e.g. "PASSED", "FAILED", "INCOMPLETE")
   - `created_at`, `updated_at`
   - Relations: `enrollment`

---

## 5. Security & Authorization

### 5.1 Global Guard Posture
* `JwtAuthGuard` is registered globally. Every endpoint requires a valid Bearer token unless explicitly decorated with `@Public()`.
* Missing / invalid tokens return **401 Unauthorized**.

### 5.2 Role-Based Access Control (RBAC)
* Endpoints declare `@Roles(Role.ADMIN, Role.REGISTRAR, ...)` checked by `RolesGuard`.
* Unauthorized roles return **403 Forbidden**.

### 5.3 Object-Level Authorization Rules
1. **Students**:
   - Can access `GET /api/v1/students/:id`, `GET /api/v1/students/:id/enrollments`, `GET /api/v1/students/:id/grades`, and `GET /api/v1/students/:id/academic-record` **only if** `:id` matches their own linked student profile.
   - Any attempt to query another student ID throws **403 Forbidden**.
2. **Instructors**:
   - Can encode/update grades (`POST /grades`, `PUT /grades/:id`) **only if** the grade's enrollment belongs to a `CourseOffering` assigned to that instructor.
   - Unauthorized grade modification throws **403 Forbidden**.

---

## 6. Response & Error Envelopes

### 6.1 Success Envelope (HTTP 200 / 201)
```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total_records": 100,
    "total_pages": 5,
    "has_next": true,
    "has_prev": false
  }
}
```

### 6.2 Validation Error (HTTP 422)
```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": {
    "student_number": ["student_number must be formatted as YYYY-NNNNN"],
    "email": ["email must be an email address"]
  }
}
```

### 6.3 Domain & Server Errors (HTTP 400, 401, 403, 404, 409, 500)
```json
{
  "success": false,
  "message": "Student is already enrolled in this course offering.",
  "errors": null
}
```
*Note*: In production mode, database driver exceptions and internal stack traces are redacted by `AllExceptionsFilter` to prevent information leakage.

---

## 7. REST API Endpoints Specification

Base URL: `/api/v1`

### Authentication (`/api/v1/auth`)
* `POST /login` (`@Public()`) — Authenticate user and return JWT bearer token.
* `POST /logout` — Invalidate/clear authenticated session.
* `GET /me` — Retrieve current authenticated user profile and roles.

### Students (`/api/v1/students`)
* `GET /` — List students with search, filters (`program_id`, `year_level`, `status`, `student_type`), sorting, and pagination.
* `POST /` — Create student record (Admin, Registrar).
* `GET /:id` — Retrieve student details (Admin, Registrar, or Owner Student).
* `PUT /:id` or `PATCH /:id` — Update student record (Admin, Registrar).
* `DELETE /:id` — Deactivate / delete student record (Admin only).
* `GET /:id/enrollments` — Student enrollments (Admin, Registrar, or Owner Student).
* `GET /:id/grades` — Student grade sheet (Admin, Registrar, or Owner Student).
* `GET /:id/academic-record` — Aggregated transcript grouped by term (Admin, Registrar, or Owner Student).

### Academic Programs (`/api/v1/programs`)
* `GET /` — List academic programs.
* `POST /` — Create program (Admin, Registrar).
* `GET /:id` — Retrieve program details.
* `PUT /:id` / `PATCH /:id` — Update program (Admin, Registrar).
* `DELETE /:id` — Delete program (Admin).

### Courses (`/api/v1/courses`)
* `GET /` — List courses catalog.
* `POST /` — Create course (Admin, Registrar).
* `GET /:id` — Retrieve course details.
* `PUT /:id` / `PATCH /:id` — Update course (Admin, Registrar).
* `DELETE /:id` — Delete course (Admin).

### Academic Terms (`/api/v1/academic-terms`)
* `GET /` — List academic terms.
* `POST /` — Create academic term (Admin, Registrar).
* `GET /:id` — Retrieve term details.
* `PUT /:id` / `PATCH /:id` — Update term (Admin, Registrar).
* `DELETE /:id` — Delete term (Admin).

### Course Offerings (`/api/v1/course-offerings`)
* `GET /` — List offerings (supports filtering by term, course, instructor).
* `POST /` — Create offering (Admin, Registrar).
* `GET /:id` — Retrieve offering details.
* `PUT /:id` / `PATCH /:id` — Update offering (Admin, Registrar).
* `DELETE /:id` — Delete offering (Admin).
* `GET /:id/students` — List students enrolled in this offering.

### Enrollments (`/api/v1/enrollments`)
* `GET /` — List enrollments.
* `POST /` — Enroll student in course offering (Validates room capacity, prevents duplicate enrollment, and checks `student.max_allowed_units` overload limit per term). Supports irregular cross-section / cross-year enrollment.
* `GET /:id` — Retrieve enrollment record.
* `PATCH /:id` — Update enrollment status (e.g. `DROPPED`, `COMPLETED`).
* `DELETE /:id` — Cancel enrollment.

### Grades (`/api/v1/grades`)
* `GET /` — List grades.
* `POST /` — Encode grade for enrollment (Instructor assigned to offering, or Admin/Registrar).
* `GET /:id` — Retrieve grade details.
* `PUT /:id` or `PATCH /:id` — Update grade (Authorized Instructor or Admin).

---

## 8. Test Data Seeder Specifications (`prisma/seed.ts`)

Must meet or exceed Lab Section 15 requirements:
* **Users**: 5 minimum
  1. `admin@sims.edu` (ADMIN)
  2. `registrar@sims.edu` (REGISTRAR)
  3. `prof.cruz@sims.edu` (INSTRUCTOR)
  4. `prof.reyes@sims.edu` (INSTRUCTOR)
  5. `student.juan@sims.edu` (STUDENT)
* **Programs**: 3 records (`BSIT`, `BSCS`, `BSIS`)
* **Students**: 100 records (with unique student numbers `2026-00001` through `2026-00100`)
* **Courses**: 20 catalog records with titles, codes, units
* **Academic Terms**: 2 records (1st Sem 2026-2027, 2nd Sem 2026-2027)
* **Course Offerings**: 20 scheduled sections
* **Enrollments**: 200 valid non-duplicate enrollments
* **Grades**: 100 grade records with midterm/final/remarks

---

## 9. Automated Testing & Verification Suite (Vitest)

Covers the 20 Mandatory Acceptance Demonstration Cases:
1. Server bootstrap and database connectivity.
2. Successful user authentication (JWT issue).
3. 401 Unauthorized on protected endpoint without token.
4. Program creation.
5. Student creation.
6. 422 Validation rejection (invalid email, invalid format) and 409 duplicate student number.
7. Student retrieval and update.
8. Student search and multi-parameter filtering.
9. Pagination navigation metadata and sorting order.
10. Course and Academic Term creation.
11. Course Offering creation with instructor assignment.
12. Valid student enrollment.
13. Duplicate enrollment prevention (409 Conflict).
14. Grade encoding and authorized update.
15. Aggregated student academic record retrieval.
16. 403 Forbidden rejection for unauthorized role (Student creating course, Student viewing peer record).
17. 404 Not Found handling.
18. Swagger UI verification at `/api/docs`.
19. Automated test suite execution report.
20. AI contribution explanation and architectural transparency.

---

## 10. Required Submission Deliverables
1. Backend source code in clean repository structure.
2. Prisma migration files and reproducible schema.
3. Seeder script with deterministic test generation.
4. `.env.example` safe configuration template.
5. Entity Relationship Diagram (`docs/ERD.md` in Mermaid format).
6. OpenAPI/Swagger UI at `/api/docs`.
7. Postman / Bruno API Client Collection (`docs/sims-api-collection.json`).
8. Automated Vitest test suite and passing test evidence.
9. `README.md` with complete installation, configuration, migration, seeding, and execution instructions.
10. Technical Architecture and AI Development Log (`docs/ARCHITECTURE.md`, `docs/AI_LOG.md`).
