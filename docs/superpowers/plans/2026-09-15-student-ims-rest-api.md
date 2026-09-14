# Student Information Management System REST API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete, enterprise-grade RESTful API for a Student Information Management System using NestJS 11, TypeScript, Prisma ORM, and PostgreSQL 18, fulfilling all requirements of Laboratory Activity II.

**Architecture:** NestJS modular architecture with dedicated feature modules, global ValidationPipe for DTO checks, global JwtAuthGuard with `@Public()` exemptions, RolesGuard for RBAC, TransformInterceptor for `{ success, message, data, meta }` envelopes, AllExceptionsFilter for `{ success: false, message, errors }` envelopes, and Prisma Client for parameterized relational database queries.

**Tech Stack:** NestJS 11, TypeScript 5, Prisma ORM, PostgreSQL 18, Passport JWT, bcryptjs, class-validator, Swagger/OpenAPI, Vitest, Supertest, @faker-js/faker.

**Spec:** [2026-09-14-student-ims-rest-api-design.md](file:///c:/Users/LEGION2/Yaji/projects/special_topics/student_ims/docs/superpowers/specs/2026-09-14-student-ims-rest-api-design.md)

## Global Constraints
- Base API URL must be `/api/v1`.
- Every protected route must reject unauthenticated requests with HTTP 401.
- Unauthorized roles must be rejected with HTTP 403.
- Object-level authorization: Students can only view their own profile, enrollments, grades, and academic record; Instructors can only view/grade their own assigned course offerings.
- Response consistency: All success responses wrapped in `{ success: true, message: string, data: any, meta?: any }`.
- Error consistency: All validation errors wrapped in `{ success: false, message: "Validation failed.", errors: Record<string, string[]> }` with HTTP 422.
- Duplicate enrollments in the same offering must be prevented with HTTP 409 Conflict.
- Irregular student load support: validate that total enrolled units in an academic term do not exceed `student.max_allowed_units`.
- Database seeder must populate at least: 5 users, 3 programs, 100 students (regular and irregular), 20 courses, 2 academic terms, 20 course offerings, 200 enrollments, and 100 grades.

---

### Task 1: Project Initialization & Dependency Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `nest-cli.json`, `.env.example`, `.env`, `vitest.config.ts`

**Interfaces:**
- Produces: Runnable NestJS boilerplate with TypeScript compilation and Vitest runner.

- [ ] **Step 1: Create `package.json` with required scripts and dependencies**
  Include `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`, `@nestjs/swagger`, `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcryptjs`, `class-validator`, `class-transformer`, `@prisma/client`, `reflect-metadata`, `rxjs`. Dev dependencies: `prisma`, `@faker-js/faker`, `vitest`, `supertest`, `@types/node`, `@types/supertest`, `@types/bcryptjs`, `@types/passport-jwt`, `typescript`, `ts-node`, `unplugin-swc`.

- [ ] **Step 2: Create TypeScript & Vitest configuration files**
  Setup `tsconfig.json` with `"emitDecoratorMetadata": true`, `"experimentalDecorators": true`, `"target": "ES2022"`. Setup `vitest.config.ts` for fast E2E test execution.

- [ ] **Step 3: Run `npm install` and verify dependencies install cleanly**
  Run: `npm install`
  Expected: Clean install with zero fatal errors.

- [ ] **Step 4: Create `.env.example` and `.env`**
  ```env
  DATABASE_URL="postgresql://postgres:postgres@localhost:5432/student_ims?schema=public"
  JWT_SECRET="super-secret-jwt-key-for-development-change-in-production-2026"
  JWT_EXPIRES_IN="24h"
  PORT=8000
  NODE_ENV=development
  ```

- [ ] **Step 5: Commit**
  ```bash
  git add .
  git commit -m "chore: initialize nestjs project dependencies and configuration"
  ```

---

### Task 2: Prisma Schema, PostgreSQL Relational Modeling & Prisma Module

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/prisma/prisma.service.ts`
- Create: `src/prisma/prisma.module.ts`

**Interfaces:**
- Produces: `PrismaService` singleton providing type-safe DB client for all feature services.
- Models: `User`, `Program`, `Course`, `AcademicTerm`, `CourseOffering`, `Student`, `Enrollment`, `Grade`.
- Enums: `Role`, `UserStatus`, `StudentStatus`, `StudentType`, `RecordStatus`, `Semester`, `EnrollmentStatus`.

- [ ] **Step 1: Write `prisma/schema.prisma`**
  Define all 8 entities, enums, relations, foreign keys (`onDelete: Restrict`), composite unique constraint `@@unique([student_id, course_offering_id])`, indexes on search fields, and `student_type` / `max_allowed_units` on `Student`.

- [ ] **Step 2: Generate Prisma Client & Initial Migration**
  Run: `npx prisma generate`
  Run: `npx prisma migrate dev --name init_student_ims`
  Expected: Generated Prisma Client in `node_modules/@prisma/client` and SQL migration applied.

- [ ] **Step 3: Implement `PrismaService` and `PrismaModule`**
  `src/prisma/prisma.service.ts` extending `PrismaClient` with `onModuleInit()` and `onModuleDestroy()` lifecycle hooks. `src/prisma/prisma.module.ts` marked as `@Global()` exporting `PrismaService`.

- [ ] **Step 4: Commit**
  ```bash
  git add prisma/ src/prisma/
  git commit -m "feat(database): define prisma schema, migrations, and prisma module"
  ```

---

### Task 3: Common Pipes, Interceptors, Filters & Response Formatting

**Files:**
- Create: `src/common/interceptors/transform.interceptor.ts`
- Create: `src/common/filters/all-exceptions.filter.ts`
- Create: `src/common/dto/pagination-query.dto.ts`
- Create: `src/common/dto/api-response.dto.ts`

**Interfaces:**
- Produces:
  - `TransformInterceptor`: intercepts controller returns and formats into `{ success: true, message: "...", data: ..., meta?: ... }`.
  - `AllExceptionsFilter`: catches all HTTP exceptions and Prisma errors, returning 422 for validation, 409 for unique constraint violations (`P2002`), 404 for records not found (`P2025`), and redacts internal stack traces on 500.

- [ ] **Step 1: Write unit test for `TransformInterceptor` and `AllExceptionsFilter`**
  Verify interceptor envelopes standard objects and handles pagination meta. Verify filter turns validation errors into standard 422 schema.

- [ ] **Step 2: Implement `TransformInterceptor`**
  Transforms stream into standard success payload structure with configurable or default success messages.

- [ ] **Step 3: Implement `AllExceptionsFilter`**
  Checks exception type: `HttpException` (pulls message & validation error array) vs `PrismaClientKnownRequestError` (maps `P2002` to 409 Conflict, `P2025` to 404 Not Found) vs unknown errors (logs error and returns 500 without leaking stack traces).

- [ ] **Step 4: Implement `PaginationQueryDto`**
  Properties: `page` (default 1), `per_page` (default 20, max 100), `search` (optional string), `sort` (optional string), `order` (`asc` | `desc`, default `asc`).

- [ ] **Step 5: Run tests and verify**
  Run: `npx vitest run test/common.spec.ts`
  Expected: PASS

- [ ] **Step 6: Commit**
  ```bash
  git add src/common/
  git commit -m "feat(common): add global transform interceptor, exception filter, and pagination dto"
  ```

---

### Task 4: Authentication & Role-Based Authorization Module

**Files:**
- Create: `src/auth/auth.module.ts`, `auth.controller.ts`, `auth.service.ts`
- Create: `src/auth/strategies/jwt.strategy.ts`
- Create: `src/auth/dto/login.dto.ts`
- Create: `src/common/decorators/public.decorator.ts`
- Create: `src/common/decorators/roles.decorator.ts`
- Create: `src/common/decorators/current-user.decorator.ts`
- Create: `src/common/guards/jwt-auth.guard.ts`
- Create: `src/common/guards/roles.guard.ts`

**Interfaces:**
- Consumes: `PrismaService`.
- Produces:
  - `POST /api/v1/auth/login` (`@Public()`): Returns JWT access token & user profile.
  - `POST /api/v1/auth/logout`: Returns 200 OK success envelope.
  - `GET /api/v1/auth/me`: Returns currently authenticated user with attached student/instructor details.
  - Global `JwtAuthGuard` enforcing token checks across entire API.
  - `RolesGuard` checking `@Roles(Role.ADMIN, ...)` decorator.

- [ ] **Step 1: Write failing integration test for auth flow**
  Test `/api/v1/auth/login` with valid credentials (returns token), invalid password (returns 401), protected endpoint `/api/v1/auth/me` without token (returns 401), and `/me` with token (returns current user).

- [ ] **Step 2: Implement JWT strategy and Auth decorators/guards**
  `JwtStrategy` validating payload against DB, `JwtAuthGuard` checking `Reflector` for `IS_PUBLIC_KEY`, `RolesGuard` comparing user role to `@Roles()`.

- [ ] **Step 3: Implement `AuthService` and `AuthController`**
  `login()` uses `bcrypt.compare()` against `user.password_hash`, signs JWT with `user.id`, `user.email`, `user.role`.

- [ ] **Step 4: Run auth integration test and verify**
  Run: `npx vitest run test/auth.e2e-spec.ts`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/auth/ src/common/
  git commit -m "feat(auth): implement jwt authentication, rbac roles guard, and auth endpoints"
  ```

---

### Task 5: Academic Reference Modules (Programs, Courses, Academic Terms)

**Files:**
- Create: `src/programs/` (module, controller, service, dto: `create-program.dto.ts`, `update-program.dto.ts`)
- Create: `src/courses/` (module, controller, service, dto: `create-course.dto.ts`, `update-course.dto.ts`)
- Create: `src/academic-terms/` (module, controller, service, dto: `create-term.dto.ts`, `update-term.dto.ts`)

**Interfaces:**
- Endpoints:
  - `/api/v1/programs` (`GET`, `POST`, `GET /:id`, `PUT /:id`, `DELETE /:id`)
  - `/api/v1/courses` (`GET`, `POST`, `GET /:id`, `PUT /:id`, `DELETE /:id`)
  - `/api/v1/academic-terms` (`GET`, `POST`, `GET /:id`, `PUT /:id`, `DELETE /:id`)
- RBAC:
  - Create/Update/Delete restricted to `ADMIN` and `REGISTRAR`. Delete program/course restricted to `ADMIN`.
  - Read access permitted to authenticated users.

- [ ] **Step 1: Write integration tests for Programs, Courses, and Terms**
  Test CRUD operations, duplicate code prevention (409 Conflict), validation errors on missing fields (422), and role authorization restrictions (403 for student creating course).

- [ ] **Step 2: Implement `ProgramsModule`, `CoursesModule`, and `AcademicTermsModule`**
  Full service methods, DTO validation (`@IsNotEmpty()`, `@IsString()`, `@IsInt()`, `@Min()`), controller endpoints with `@Roles()`.

- [ ] **Step 3: Run tests and verify**
  Run: `npx vitest run test/reference-data.e2e-spec.ts`
  Expected: PASS

- [ ] **Step 4: Commit**
  ```bash
  git add src/programs/ src/courses/ src/academic-terms/
  git commit -m "feat(academic): implement programs, courses, and academic terms crud modules"
  ```

---

### Task 6: Students Module (CRUD, Search, Filters, Sorting & Pagination)

**Files:**
- Create: `src/students/students.module.ts`, `students.controller.ts`, `students.service.ts`
- Create: `src/students/dto/create-student.dto.ts`, `update-student.dto.ts`, `filter-student.dto.ts`

**Interfaces:**
- Endpoints:
  - `GET /api/v1/students`: Supports `search` (name, student number), filters (`program_id`, `year_level`, `status`, `student_type`), `sort`, `order`, `page`, `per_page`.
  - `POST /api/v1/students`: Validates `student_number` (format `YYYY-NNNNN`), unique email, existing `program_id`.
  - `GET /api/v1/students/:id`: Enforces object-level authorization (Student can only read self; Admin/Registrar can read any).
  - `PUT /:id` / `PATCH /:id`: Admin and Registrar update.
  - `DELETE /:id`: Admin deactivates/deletes student.

- [ ] **Step 1: Write failing tests for Student endpoints**
  Test: valid creation (201), duplicate student number (409), invalid email format (422), student searching (`?search=`), filtering (`?program_id=&student_type=IRREGULAR`), pagination metadata, and student accessing another student's ID (403 Forbidden).

- [ ] **Step 2: Implement `StudentsService` with Prisma query builder**
  Build dynamic `where` clause for search across `student_number`, `first_name`, `last_name`, `email`; filter by `program_id`, `year_level`, `status`, `student_type`; calculate total count, total pages, and return slice. Enforce object-level access check.

- [ ] **Step 3: Implement `StudentsController` with Swagger documentation**
  Expose endpoints with `@ApiOperation()`, `@ApiResponse()`, `@Query()` parameter bindings.

- [ ] **Step 4: Run tests and verify**
  Run: `npx vitest run test/students.e2e-spec.ts`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/students/
  git commit -m "feat(students): implement student management with search, filters, pagination, and object security"
  ```

---

### Task 7: Course Offerings & Enrollments Module (Capacity, Duplicate & Irregular Load Logic)

**Files:**
- Create: `src/course-offerings/` (module, controller, service, dto)
- Create: `src/enrollments/` (module, controller, service, dto: `create-enrollment.dto.ts`, `update-enrollment.dto.ts`)

**Interfaces:**
- Endpoints:
  - `GET /api/v1/course-offerings`: filter by term, course, instructor.
  - `POST /api/v1/course-offerings`: create offering with capacity, room, instructor.
  - `GET /api/v1/course-offerings/:id/students`: list students enrolled in offering.
  - `GET /api/v1/enrollments`: list enrollments.
  - `POST /api/v1/enrollments`: enroll student in offering.
  - `PATCH /api/v1/enrollments/:id`: update status (e.g. `DROPPED`).
  - `DELETE /api/v1/enrollments/:id`: drop/remove enrollment.
- Business Logic:
  1. Room capacity check: `offering.enrollments.length < offering.capacity` (else 400 "Course offering has reached maximum capacity").
  2. Duplicate enrollment check: database composite unique `@@unique([student_id, course_offering_id])` caught by filter returning 409 Conflict.
  3. Irregular & Regular student load check: Sum of units enrolled in the offering's `academic_term` + course units <= `student.max_allowed_units` (else 400 "Enrollment exceeds maximum allowed units").

- [ ] **Step 1: Write integration tests for Course Offerings & Enrollments**
  Test successful enrollment (201), duplicate enrollment prevention (409), exceeding capacity rejection (400), exceeding max allowed units (400), and irregular cross-section enrollment.

- [ ] **Step 2: Implement `CourseOfferingsModule` and `EnrollmentsModule`**
  Implement validation logic, transaction safety via `prisma.$transaction`, and object authorization.

- [ ] **Step 3: Run tests and verify**
  Run: `npx vitest run test/enrollments.e2e-spec.ts`
  Expected: PASS

- [ ] **Step 4: Commit**
  ```bash
  git add src/course-offerings/ src/enrollments/
  git commit -m "feat(enrollment): implement course offerings and enrollment with capacity and load validation"
  ```

---

### Task 8: Grades & Academic Record Modules

**Files:**
- Create: `src/grades/` (module, controller, service, dto: `encode-grade.dto.ts`, `update-grade.dto.ts`)
- Create: `src/academic-record/` (module, controller, service)

**Interfaces:**
- Endpoints:
  - `GET /api/v1/grades`: List grades.
  - `POST /api/v1/grades`: Encode midterm/final grade for enrollment.
  - `PUT /api/v1/grades/:id` or `PATCH /api/v1/grades/:id`: Update grade.
  - `GET /api/v1/students/:id/grades`: Student grade list.
  - `GET /api/v1/students/:id/academic-record`: Aggregated academic transcript grouped by academic term with term GPA/GWA and cumulative GPA.
- Authorization:
  - Instructor can ONLY encode/update grades for students enrolled in offerings assigned to that instructor.
  - Student can ONLY view their own grades and academic record.

- [ ] **Step 1: Write integration tests for Grading & Academic Record**
  Test grade encoding by assigned instructor (201/200), grade encoding attempt by unassigned instructor (403 Forbidden), student viewing own academic record (200), and student viewing peer academic record (403 Forbidden).

- [ ] **Step 2: Implement `GradesService` and `GradesController`**
  Verify enrollment exists, verify instructor matches offering `instructor_id` (or user is Admin/Registrar), update grade fields and compute remarks (`PASSED` if grade <= 3.00, `FAILED` if 5.00).

- [ ] **Step 3: Implement `AcademicRecordService`**
  Query all completed/enrolled terms for student, group enrollments by `academic_term`, calculate Term Weighted Average (GWA), total units earned, and cumulative GPA.

- [ ] **Step 4: Run tests and verify**
  Run: `npx vitest run test/grades.e2e-spec.ts`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/grades/ src/academic-record/
  git commit -m "feat(grades): implement authorized grade encoding and aggregated academic record report"
  ```

---

### Task 9: Relational Database Seeder (Prisma + Faker)

**Files:**
- Create: `prisma/seed.ts`
- Modify: `package.json` (add `"prisma": { "seed": "ts-node prisma/seed.ts" }`)

**Interfaces:**
- Generates exact rubric counts:
  - 5 System Users (Admin, Registrar, 2 Instructors, 1 Student user)
  - 3 Academic Programs (BSIT, BSCS, BSIS)
  - 100 Students (80 Regular, 20 Irregular with varied unit limits)
  - 20 Courses (IT, CS, Math, GE)
  - 2 Academic Terms (1st Sem 2026-2027, 2nd Sem 2026-2027)
  - 20 Course Offerings
  - 200 Valid non-duplicate enrollments
  - 100 Grade records with realistic grade distributions

- [ ] **Step 1: Implement `prisma/seed.ts`**
  Use `bcrypt.hash()` for known demo credentials (password: `Password123!`), use `@faker-js/faker` for realistic Filipino names, contacts, addresses. Relate students to offerings ensuring zero duplicate pairs.

- [ ] **Step 2: Execute seeder command**
  Run: `npx prisma db seed`
  Expected: Console output confirming: 5 users, 3 programs, 100 students, 20 courses, 2 terms, 20 offerings, 200 enrollments, 100 grades created.

- [ ] **Step 3: Verify database counts via Prisma or query**
  Verify all counts match or exceed rubric requirements.

- [ ] **Step 4: Commit**
  ```bash
  git add prisma/seed.ts package.json
  git commit -m "feat(seed): add complete relational test data seeder meeting all rubric quantities"
  ```

---

### Task 10: OpenAPI / Swagger Documentation & API Client Collection

**Files:**
- Modify: `src/main.ts` (setup SwaggerModule at `/api/docs`)
- Create: `docs/sims-api-collection.json` (Postman / Bruno collection export)

**Interfaces:**
- Exposes interactive Swagger UI at `http://localhost:8000/api/docs`.
- Provides ready-to-import API collection grouped into: Authentication, Students, Programs, Courses, Academic Terms, Course Offerings, Enrollments, Grades, and Academic Records.

- [ ] **Step 1: Configure Swagger in `src/main.ts`**
  Use `DocumentBuilder` with Title, Description, Version `1.0`, Bearer Auth (`addBearerAuth()`). Save swagger json spec to disk for offline inspection.

- [ ] **Step 2: Generate `docs/sims-api-collection.json`**
  Build comprehensive Postman v2.1 collection containing both success cases and expected negative test cases (401, 403, 404, 409, 422) for all 9 resource groups.

- [ ] **Step 3: Commit**
  ```bash
  git add src/main.ts docs/sims-api-collection.json
  git commit -m "docs(api): configure swagger ui at /api/docs and export postman collection"
  ```

---

### Task 11: Automated Test Suite for Mandatory 20 Demonstration Cases

**Files:**
- Create: `test/acceptance-demonstration.e2e-spec.ts`

**Interfaces:**
- Implements automated assertions directly mapping to the 20 Acceptance Demonstration items in Section 22 of the lab manual.

- [ ] **Step 1: Write E2E test suite covering all 20 acceptance points**
  1. DB connection & server start
  2. Successful login
  3. 401 unauthenticated rejection
  4. Create program
  5. Create valid student
  6. 422 invalid student & 409 duplicate student number
  7. Retrieve & update student
  8. Search & filter students
  9. Pagination & sorting
  10. Create course & term
  11. Create course offering
  12. Enroll student
  13. Duplicate enrollment prevention (409)
  14. Encode & update authorized grade
  15. Retrieve student academic record
  16. 403 forbidden on unauthorized role & object
  17. 404 not-found case
  18. Swagger UI endpoint reachable (200)
  19. Automated test execution report
  20. AI contribution accountability check

- [ ] **Step 2: Run full test suite**
  Run: `npx vitest run test/acceptance-demonstration.e2e-spec.ts`
  Expected: 20/20 PASS.

- [ ] **Step 3: Commit**
  ```bash
  git add test/
  git commit -m "test: implement automated e2e test suite for all 20 mandatory acceptance demonstration cases"
  ```

---

### Task 12: Project Documentation Deliverables

**Files:**
- Create: `README.md`
- Create: `docs/ERD.md`
- Create: `docs/ARCHITECTURE.md`
- Create: `docs/AI_LOG.md`

**Interfaces:**
- Produces complete documentation answering all rubric requirements (Section 20 & 21) and defense questions (Section 29).

- [ ] **Step 1: Write `README.md`**
  Detailed prerequisites, setup instructions, `.env` config, migration command, seed command, run server command (`npm run start:dev`), test command (`npm run test`), test credentials table, and Swagger docs link.

- [ ] **Step 2: Write `docs/ERD.md`**
  Visual Mermaid Entity Relationship Diagram illustrating all entities, relations, foreign keys, and cardinatility.

- [ ] **Step 3: Write `docs/ARCHITECTURE.md` and `docs/AI_LOG.md`**
  Document architectural decisions, security model, and AI-assisted workflow log with prompts, verification notes, and design rationale.

- [ ] **Step 4: Commit**
  ```bash
  git add README.md docs/
  git commit -m "docs: finalize project readme, erd diagram, architecture doc, and ai development log"
  ```
