# Relational Entity-Relationship Diagram (ERD)

## Student Information Management System (SIMS) REST API

This document details the relational database schema implemented in **PostgreSQL 18** via **Prisma ORM** for Laboratory Activity 2. The schema is normalized to Third Normal Form (3NF) to ensure data integrity, prevent duplicate records, and enforce institutional academic policies.

---

## 1. Mermaid Entity-Relationship Diagram

```mermaid
erDiagram
    USERS ||--o| STUDENTS : "linked_to (1:1 optional)"
    USERS ||--o{ COURSE_OFFERINGS : "assigned_instructor (1:N)"
    PROGRAMS ||--o{ STUDENTS : "enrolls (1:N)"
    COURSES ||--o{ COURSE_OFFERINGS : "schedules (1:N)"
    ACADEMIC_TERMS ||--o{ COURSE_OFFERINGS : "holds (1:N)"
    STUDENTS ||--o{ ENROLLMENTS : "registers (1:N)"
    COURSE_OFFERINGS ||--o{ ENROLLMENTS : "contains (1:N)"
    ENROLLMENTS ||--o| GRADES : "evaluates (1:1)"

    USERS {
        int id PK
        string email UK "unique email"
        string password_hash "bcrypt hashed"
        enum role "ADMIN | INSTRUCTOR | STUDENT"
        string name
        enum status "ACTIVE | INACTIVE"
        datetime created_at
        datetime updated_at
    }

    PROGRAMS {
        int id PK
        string code UK "BSIT, BSCS, etc."
        string name
        string description
        datetime created_at
        datetime updated_at
    }

    COURSES {
        int id PK
        string course_code UK "IT101, CS201, etc."
        string course_title
        string description
        int units "1 to 6 credit units"
        datetime created_at
        datetime updated_at
    }

    ACADEMIC_TERMS {
        int id PK
        string academic_year "e.g. 2026-2027"
        enum semester "FIRST_SEMESTER | SECOND_SEMESTER | SUMMER"
        datetime start_date
        datetime end_date
        boolean is_active "current term flag"
        datetime created_at
        datetime updated_at
    }

    COURSE_OFFERINGS {
        int id PK
        int course_id FK
        int academic_term_id FK
        int instructor_id FK
        string section "e.g. BSIT-4A, IRREG-1"
        string schedule "e.g. MWF 08:00 - 09:30"
        string room "e.g. Lab 301"
        int capacity "max student seats"
        datetime created_at
        datetime updated_at
    }

    STUDENTS {
        int id PK
        string student_number UK "format: YYYY-NNNNN"
        int user_id FK,UK "optional 1:1 user login"
        string first_name
        string last_name
        datetime birth_date
        string email UK "institutional email"
        int program_id FK
        int year_level "1 to 5"
        enum student_type "REGULAR | IRREGULAR"
        int max_allowed_units "default: 24 (or custom load limit)"
        enum status "ACTIVE | INACTIVE | GRADUATED | SUSPENDED"
        datetime created_at
        datetime updated_at
    }

    ENROLLMENTS {
        int id PK
        int student_id FK
        int course_offering_id FK
        datetime enrollment_date
        enum status "ENROLLED | DROPPED | COMPLETED"
        datetime created_at
        datetime updated_at
    }

    GRADES {
        int id PK
        int enrollment_id FK,UK "1:1 per enrollment"
        decimal midterm_grade "1.00 to 5.00"
        decimal final_grade "1.00 to 5.00"
        decimal numerical_grade "weighted/final rating"
        enum remarks "PASSED | FAILED | INCOMPLETE | DROPPED"
        int encoded_by FK "instructor user_id"
        datetime created_at
        datetime updated_at
    }
```

---

## 2. Table Specifications & Integrity Constraints

### 2.1 Users (`users`)
- **Primary Key:** `id` (Serial/Auto-increment).
- **Unique Indexes:** `email` (Case-insensitive unique login identifier).
- **Indexes:** `idx_users_role_status` (`role`, `status`) for role-based authorization filtering.
- **Relations:**
  - One-to-one optional relation with `students` via `students.user_id`.
  - One-to-many relation with `course_offerings` where `role = 'INSTRUCTOR'`.

### 2.2 Programs (`programs`)
- **Primary Key:** `id`.
- **Unique Indexes:** `code` (e.g., `BSIT`, `BSCS`, `BSIS`).
- **Relations:** One-to-many with `students`.

### 2.3 Courses (`courses`)
- **Primary Key:** `id`.
- **Unique Indexes:** `course_code` (e.g., `IT101`, `CS201`).
- **Validation Constraints:** `units` between 1 and 6.
- **Relations:** One-to-many with `course_offerings`.

### 2.4 Academic Terms (`academic_terms`)
- **Primary Key:** `id`.
- **Composite Unique Constraint:** `@@unique([academic_year, semester])` ensures a semester cannot be duplicated for the same academic year.
- **Indexes:** `is_active` for fast lookup of the current enrollment period.

### 2.5 Course Offerings (`course_offerings`)
- **Primary Key:** `id`.
- **Foreign Keys:**
  - `course_id` -> `courses(id)` (ON DELETE RESTRICT)
  - `academic_term_id` -> `academic_terms(id)` (ON DELETE RESTRICT)
  - `instructor_id` -> `users(id)` (ON DELETE RESTRICT)
- **Business Rule:** Each offering maintains an independent `capacity` limit. Enrollment operations verify `COUNT(enrollments WHERE status = 'ENROLLED') < capacity`.

### 2.6 Students (`students`)
- **Primary Key:** `id`.
- **Unique Indexes:**
  - `student_number` (Enforces regex `^\d{4}-\d{5}$`).
  - `email` (Unique student contact email).
  - `user_id` (Unique 1:1 binding to an authentication user).
- **Key Columns for Irregular Student Handling:**
  - `student_type`: Enum `REGULAR` or `IRREGULAR`.
  - `max_allowed_units`: Explicit unit ceiling per semester (default `24` for standard load, lower for probationary/underload students, or higher for graduating students).
- **Indexes:** `idx_students_program_year` (`program_id`, `year_level`), `idx_students_search` (`last_name`, `first_name`).

### 2.7 Enrollments (`enrollments`)
- **Primary Key:** `id`.
- **Foreign Keys:**
  - `student_id` -> `students(id)` (ON DELETE CASCADE)
  - `course_offering_id` -> `course_offerings(id)` (ON DELETE CASCADE)
- **Composite Unique Constraint:** `@@unique([student_id, course_offering_id])` guarantees that a student cannot be enrolled in the same course offering more than once (prevents duplicate enrollment attacks, HTTP 409).
- **Unit Load Enforcement:** During enrollment, the system sums the credit units of all active enrollments for the student within the offering's academic term plus the candidate course's units; if this exceeds `student.max_allowed_units`, enrollment is rejected (HTTP 400).

### 2.8 Grades (`grades`)
- **Primary Key:** `id`.
- **Unique Constraint:** `enrollment_id` ensures exactly one grade record per student enrollment.
- **Foreign Keys:**
  - `enrollment_id` -> `enrollments(id)` (ON DELETE CASCADE)
  - `encoded_by` -> `users(id)` (ON DELETE RESTRICT)
- **Grading Scale Rules:**
  - `midterm_grade` and `final_grade`: Philippine grading system (1.00 = 100-97%, 1.25 = 96-94%, 1.50 = 93-91%, 1.75 = 90-88%, 2.00 = 87-85%, 2.25 = 84-82%, 2.50 = 81-79%, 2.75 = 78-76%, 3.00 = 75% [Passing], 5.00 = Failed).
  - `numerical_grade`: Calculated or final weighted rating.
  - `remarks`: Automatically derived (`PASSED` if grade <= 3.00, `FAILED` if grade > 3.00).
- **Authorization Rule:** Only the instructor assigned to the course offering (`course_offering.instructor_id === user.id`) or an `ADMIN` can encode or update grades.
