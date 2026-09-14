# System Architecture & Technical Specifications

## Student Information Management System (SIMS) REST API

This document provides a comprehensive architectural breakdown of the **Student Information Management System (SIMS) REST API**, implemented using **NestJS 11**, **TypeScript**, **Prisma ORM**, and **PostgreSQL 18**.

---

## 1. High-Level System Architecture

The application adopts a modular, tiered architecture enforcing separation of concerns, dependency injection, and strict type safety across all layers.

```
                    ┌────────────────────────────────────────┐
                    │      HTTP Request (RESTful Client)     │
                    └───────────────────┬────────────────────┘
                                        │
                                        ▼
                    ┌────────────────────────────────────────┐
                    │   Global Exception Filter (RFC-7807)   │
                    └───────────────────┬────────────────────┘
                                        │
                                        ▼
                    ┌────────────────────────────────────────┐
                    │      Global Transform Interceptor      │
                    │   { success, message, data, meta }     │
                    └───────────────────┬────────────────────┘
                                        │
                                        ▼
                    ┌────────────────────────────────────────┐
                    │     Global JwtAuthGuard (@Public)      │
                    └───────────────────┬────────────────────┘
                                        │
                                        ▼
                    ┌────────────────────────────────────────┐
                    │      Global RolesGuard (@Roles)        │
                    └───────────────────┬────────────────────┘
                                        │
                                        ▼
                    ┌────────────────────────────────────────┐
                    │     Global ValidationPipe (DTOs)       │
                    │   whitelist: true, transform: true     │
                    └───────────────────┬────────────────────┘
                                        │
                                        ▼
                    ┌────────────────────────────────────────┐
                    │              Controllers               │
                    │   (Route Handlers, DTO Binding)        │
                    └───────────────────┬────────────────────┘
                                        │
                                        ▼
                    ┌────────────────────────────────────────┐
                    │              Services                  │
                    │  (Business Logic, Domain Validation)   │
                    └───────────────────┬────────────────────┘
                                        │
                                        ▼
                    ┌────────────────────────────────────────┐
                    │           Prisma ORM Client            │
                    │     (Query Engine, Type-Safe SQL)      │
                    └───────────────────┬────────────────────┘
                                        │
                                        ▼
                    ┌────────────────────────────────────────┐
                    │          PostgreSQL 18 Database        │
                    └────────────────────────────────────────┘
```

---

## 2. Request-Response Lifecycle

1. **Incoming Request:** Handled by Fastify/Express under NestJS.
2. **Global Exception Filter (`AllExceptionsFilter`):** Catches all HTTP exceptions and unhandled errors, transforming them into a standard uniform format:
   - For validation errors (HTTP 422): `{ success: false, message: "Validation failed", errors: { [field]: [messages] } }`.
   - For conflicts (HTTP 409): `{ success: false, message: "...", errors: { error: "Conflict" } }`.
   - For generic errors (HTTP 400/401/403/404/500): `{ success: false, message: "...", errors: { ... } }`.
3. **Global Transform Interceptor (`TransformInterceptor`):** Wraps successful controller outputs in an enterprise standard envelope:
   ```json
   {
     "success": true,
     "message": "Resource retrieved successfully",
     "data": { ... },
     "meta": { "page": 1, "per_page": 10, "total_records": 100, ... }
   }
   ```
4. **Global Authentication Guard (`JwtAuthGuard`):** Authenticates bearer JWT tokens on all routes by default, skipping only routes decorated with `@Public()`.
5. **Global Authorization Guard (`RolesGuard`):** Checks role metadata set by `@Roles(Role.ADMIN, ...)`. If required roles are defined and the user lacks them, it aborts with HTTP 403 Forbidden.
6. **Global Validation Pipe (`ValidationPipe`):** Validates request payload against `class-validator` decorators. Rejects unexpected properties (`whitelist: true`, `forbidNonWhitelisted: true`) and returns detailed error maps with HTTP 422.

---

## 3. Security Architecture & Access Control

### 3.1 Authentication
- **Mechanism:** Stateless JSON Web Tokens (JWT) signed with a secret key and a 24-hour expiration.
- **Password Hashing:** Standard BCrypt with a cost factor of 10 salt rounds (`bcrypt.hash` / `bcrypt.compare`).
- **Token Payload:**
  ```json
  {
    "sub": 1,
    "email": "admin@sims.edu",
    "role": "ADMIN",
    "name": "System Admin"
  }
  ```

### 3.2 Role-Based Access Control (RBAC) Matrix
| Module / Action | HTTP Method & Path | ADMIN | INSTRUCTOR | STUDENT |
| :--- | :--- | :---: | :---: | :---: |
| **Auth Login** | `POST /api/v1/auth/login` | Public | Public | Public |
| **Current User Profile** | `GET /api/v1/auth/me` | Allowed | Allowed | Allowed |
| **Create Academic Reference (Program/Course/Term)** | `POST /api/v1/programs`, `/courses`, `/academic-terms` | Allowed | Denied (403) | Denied (403) |
| **Read Academic Reference** | `GET /api/v1/programs`, `/courses`, `/academic-terms` | Allowed | Allowed | Allowed |
| **Create / Update / Delete Student** | `POST/PATCH/DELETE /api/v1/students` | Allowed | Denied (403) | Denied (403) |
| **List Students (Filtered & Paginated)** | `GET /api/v1/students` | Allowed | Allowed | Denied (403) |
| **View Student Profile** | `GET /api/v1/students/:id` | Allowed | Allowed | Own profile only (IDOR protected) |
| **Create Course Offering** | `POST /api/v1/course-offerings` | Allowed | Denied (403) | Denied (403) |
| **Enroll Student in Offering** | `POST /api/v1/enrollments` | Allowed | Denied (403) | Denied (403) |
| **Encode / Update Grade** | `POST/PATCH /api/v1/grades` | Allowed | Assigned course only | Denied (403) |
| **View Student Grades & Academic Record** | `GET /api/v1/students/:id/grades`, `/academic-record` | Allowed | Allowed | Own record only (IDOR protected) |

### 3.3 Object-Level Authorization (Preventing IDOR)
To eliminate Insecure Direct Object References (IDOR):
- When a user with the `STUDENT` role requests `/api/v1/students/:id`, `/api/v1/students/:id/grades`, or `/api/v1/students/:id/academic-record`, the service queries the student profile linked to `req.user.id`.
- If `student.user_id !== req.user.id`, the API immediately raises an HTTP 403 Forbidden exception: `"Access denied. Students may only view their own record."`

---

## 4. Irregular Student Domain Architecture

### 4.1 Domain Model
In academic institutions, students frequently follow non-traditional progression due to prerequisite deficiencies, leaves of absence, transferees, or academic probation. The system formally models this via:
- **`StudentType` Enum:** `REGULAR` (follows a fixed block curriculum) vs `IRREGULAR` (custom schedule, cross-section enrollment, variable unit loads).
- **`max_allowed_units` Field:** Configurable integer on `Student` specifying maximum allowable registered credit units for a single academic semester (default is `24` units; can be capped lower, e.g., `12` or `15` for probationary students, or `27` for graduating students).

### 4.2 Enrollment Load Validation Logic
During every enrollment operation (`POST /api/v1/enrollments`):
1. **Capacity Verification:** Queries active enrollments for `course_offering_id`. If `active_count >= offering.capacity`, raises HTTP 400 Bad Request (`"Course offering section is at full capacity"`).
2. **Duplicate Enrollment Check:** Checks database composite constraint `@@unique([student_id, course_offering_id])`. If record exists, raises HTTP 409 Conflict (`"Student is already enrolled in this course offering"`).
3. **Term Unit Load Summation:**
   - Identifies `academic_term_id` of the target offering.
   - Fetches all current `ENROLLED` courses for the student in that term:
     $$\text{Current Term Units} = \sum \text{enrollment.courseOffering.course.units}$$
   - Computes:
     $$\text{New Total Units} = \text{Current Term Units} + \text{Candidate Course Units}$$
   - Evaluates:
     $$\text{New Total Units} \le \text{student.max\_allowed\_units}$$
   - If exceeded, raises HTTP 400 Bad Request with explicit unit telemetry:
     `"Enrollment exceeds maximum allowed units for this student (Attempted: X, Allowed: Y)."`

### 4.3 Search & Query Flexibility
Administrative and advising staff can filter students by progression status:
- `GET /api/v1/students?student_type=IRREGULAR`
- `GET /api/v1/students?student_type=REGULAR&year_level=4`

---

## 5. Academic Record & Grading Architecture

### 5.1 Instructor Authorization Rule
Grade encoding (`POST /api/v1/grades`) and grade modification (`PATCH /api/v1/grades/:id`) enforce instructor verification:
- If the authenticated user has role `INSTRUCTOR`:
  - System verifies `offering.instructor_id === user.id`.
  - If unassigned, raises HTTP 403 Forbidden: `"You are not authorized to encode grades for this course offering."`
- `ADMIN` users maintain full administrative override privileges.

### 5.2 Automatic Remarks Derivation
When grades are submitted, the backend automatically derives and assigns `remarks`:
- If `numerical_grade <= 3.00`: remarks set to `PASSED`.
- If `numerical_grade > 3.00`: remarks set to `FAILED`.
- Other statuses supported: `INCOMPLETE`, `DROPPED`.

### 5.3 GWA & Cumulative GPA Aggregation Engine
When retrieving `/api/v1/students/:id/academic-record`:
- Aggregates all terms where the student had enrollments.
- Groups grades chronologically by `academic_year` and `semester`.
- For each term:
  $$\text{Term GWA} = \frac{\sum (\text{numerical\_grade} \times \text{units})}{\sum \text{units}}$$
- Across the complete academic history:
  $$\text{Cumulative GPA / GWA} = \frac{\sum_{\text{all terms}} (\text{numerical\_grade} \times \text{units})}{\sum_{\text{all terms}} \text{units}}$$
- Results are rounded to two decimal places and structured hierarchically.
