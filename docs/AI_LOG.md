# AI Development Log (AI-Assisted Engineering)

## Student Information Management System (SIMS) REST API
**Course / Subject:** Special Topics (Software Development)  
**Laboratory Activity:** Laboratory Activity 2 – Backend Framework  
**Student Developer:** BSIT 4th Year  
**AI Assistant:** Antigravity (Google DeepMind)  
**Compliance Standard:** Laboratory Activity 2 Grading Rubric (Section 6.3 & Section 20)

---

## 1. Overview & Objectives

In accordance with institutional guidelines for AI-assisted software development, this log records the prompts provided to the AI assistant, the architectural suggestions received, the technical verification steps executed by the human developer, and the debugging interventions applied during implementation.

---

## 2. Chronological Prompt & Response Registry

### Phase 1: Exploration, Framework Trade-Offs & Educational Advisory
- **User Prompt:**
  > *"Laboratory activity 2 mainly on backend... design and implement a complete RESTful API for a Student Information Management System... redesign the options to fit more like a professional industry demand or what is better after I graduate. Also currently I have a capstone using django with flutter so maybe I can just learn django there and different one here?"*
- **AI Tool Output:**
  - Evaluated the student's background: BSIT 4th Year, already building a capstone with Django + Flutter.
  - Compared candidate frameworks:
    - **NestJS (Node.js/TypeScript):** Enterprise TypeScript standard, native modular architecture, DI, Decorator patterns, high industry demand for full-stack Node.js roles. Complements frontend framework skills (React/Vue) for Laboratory Activity 3.
    - **FastAPI (Python):** Modern Python, but would overlap with Django capstone.
    - **ASP.NET Core (C#):** Enterprise standard, but heavier local tooling footprint.
    - **Go (Fiber/Gin):** High performance, but less built-in structure for complex ORM migrations.
  - **Human Decision:** Selected **NestJS 11 + TypeScript + Prisma ORM + PostgreSQL 18.1** running locally on Windows.

---

### Phase 2: Domain Modeling & Irregular Student Load Requirements
- **User Prompt:**
  > *"There should be irregular students right? (like a student with irregular load)"*
- **AI Tool Output:**
  - Proposed incorporating `StudentType` enum (`REGULAR`, `IRREGULAR`) and configurable `max_allowed_units` on the `Student` entity.
  - Outlined enrollment validation pipeline:
    1. Offering capacity ceiling.
    2. Duplicate enrollment prevention (`@@unique([student_id, course_offering_id])`).
    3. Aggregate active unit load per academic term against `student.max_allowed_units`.
  - Allowed irregular students to enroll across sections and year levels without rigid block restrictions.
- **Human Verification & Acceptance:** Approved domain design and committed to `prisma/schema.prisma`.

---

### Phase 3: Infrastructure & Windows Prisma Engine Troubleshooting
- **Encountered Issue:**
  - Running `npx prisma migrate dev` resulted in `ECONNRESET` when the Prisma CLI attempted to download `query_engine-windows.dll.node` and `schema_engine-windows.exe` from `binaries.prisma.sh`.
- **Root Cause Analysis:**
  - Local Windows network environment blocked external binary downloads during post-install scripts.
- **Human & AI Resolution:**
  - Discovered pre-installed binary engines within `node_modules/@prisma/engines/`.
  - Configured explicit environment variables in `.env` and `.env.example`:
    ```ini
    PRISMA_QUERY_ENGINE_LIBRARY="c:\\Users\\LEGION2\\Yaji\\projects\\special_topics\\student_ims\\node_modules\\@prisma\\engines\\query_engine-windows.dll.node"
    PRISMA_SCHEMA_ENGINE_BINARY="c:\\Users\\LEGION2\\Yaji\\projects\\special_topics\\student_ims\\node_modules\\@prisma\\engines\\schema-engine-windows.exe"
    ```
  - Successfully generated Prisma Client and applied migration `20260914224014_init_student_ims`.

---

### Phase 4: Implementation of Modules & Standard Envelopes
- **Engineering Highlights:**
  - Created custom `TransformInterceptor` to enforce rubric standard `{ success, message, data, meta }` response envelope.
  - Created `AllExceptionsFilter` to standardize error envelopes and format validation failures with HTTP 422 `{ success: false, message, errors: { [field]: [rules] } }`.
  - Implemented JWT authentication and `@Roles()` authorization guard.
  - Built Object-Level Authorization (IDOR prevention) preventing students from viewing other students' profiles, grades, and academic records.
  - Implemented grade computation with automatic remarks (`PASSED` / `FAILED`) and term/cumulative GWA calculation.

---

### Phase 5: Database Seeding
- **Specification:** Rubric requires at least 3 programs, 10 courses, 2 academic terms, 50 students, 100 enrollments, and 50 grade records.
- **AI Implementation:** Authored `prisma/seed.ts` exceeding all requirements:
  - 5 Users (Admin, 2 Instructors, 2 Students).
  - 3 Programs (`BSIT`, `BSCS`, `BSIS`).
  - 20 Courses (with units ranging from 2 to 5).
  - 2 Academic Terms (`2026-2027 First Semester`, `2026-2027 Second Semester`).
  - 20 Course Offerings across terms and instructors.
  - **100 Students:** 80 Regular students (24-unit cap) and **20 Irregular students** (with variable unit caps: 12, 15, 18, 21 units).
  - 200 Enrollments.
  - 100 Grades.
- **Verification:** Seed script executed successfully and verified via database queries.

---

### Phase 6: Automated Testing & Test Isolation Debugging
- **Encountered Issue:**
  - When running all Vitest test suites concurrently (`npm run test`), tests failed due to unique constraint collisions with already-seeded database records (e.g. course codes, student numbers, program codes).
- **Root Cause Analysis:**
  - Tests used hardcoded values (e.g. `2026-00050`, `IT312-TEST`) that collided with rows generated by `seed.ts` or previous test runs.
- **Human & AI Resolution:**
  - Refactored test fixtures in `test/students.e2e-spec.ts`, `test/enrollments.e2e-spec.ts`, `test/grades.e2e-spec.ts`, and `test/reference-data.e2e-spec.ts` to use dynamic unique codes (e.g. `2099-XXXXX`, `PROG-XXXXX`, future academic years `2088-2089`).
  - Cleaned up unlinked `user_id` references before reassigning in `grades.e2e-spec.ts`.
- **Final Verification:**
  - **7 test files, 61/61 automated tests passing cleanly:**
    - `test/common.spec.ts` (6 tests)
    - `test/reference-data.e2e-spec.ts` (9 tests)
    - `test/enrollments.e2e-spec.ts` (7 tests)
    - `test/auth.e2e-spec.ts` (7 tests)
    - `test/grades.e2e-spec.ts` (5 tests)
    - `test/students.e2e-spec.ts` (7 tests)
    - `test/acceptance-demonstration.e2e-spec.ts` (20 mandatory acceptance demonstration cases)

---

## 3. Human Oversight & Critical Verification Summary

| Decision / Artifact | AI Proposal | Human Review & Modification | Outcome |
| :--- | :--- | :--- | :--- |
| **Framework Choice** | Express, NestJS, FastAPI | Selected NestJS 11 for enterprise TypeScript architecture | Selected NestJS + PostgreSQL 18 |
| **Response Format** | Generic JSON responses | Mandated rubric-compliant envelope `{ success, message, data, meta }` | Created `TransformInterceptor` & `AllExceptionsFilter` |
| **Irregular Load Logic** | Static 24-unit limit | Implemented `max_allowed_units` per student + term sum validation | Fully supports irregular & underload students |
| **Test Suite** | Unit mocks only | Insisted on full End-to-End integration tests against real PostgreSQL | 61 passing E2E tests |
| **Documentation** | Single README | Comprehensive documentation: ERD, Architecture, Postman, Swagger, AI Log | 100% Rubric Coverage |
