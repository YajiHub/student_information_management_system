# Design Specification: AI-Assisted Frontend Framework Integration for SIMS

**Project:** Student Information Management System (SIMS) Frontend Client  
**Course:** Special Topics (Software Development) &bull; Laboratory Activity III  
**Date:** 2026-09-15  
**Status:** Approved for Implementation  
**Companion Backend:** NestJS 11 + Prisma ORM + PostgreSQL 18.1 (`http://localhost:3000/api/v1`)

---

## 1. Executive Summary & Goals

Laboratory Activity III requires the development of an independent client-side frontend application consuming the authoritative REST API built in Laboratory Activity II. The frontend must authenticate against the backend, manipulate real data, enforce role-aware user experiences, handle loading/empty/error states, and present academic data (including irregular student load limits and cumulative GPA) with professional UI/UX.

### Core Objectives:
1. **Pure Client Architecture:** Separate React 19 SPA running in `frontend/`, consuming REST endpoints over HTTP without bypassing the backend or directly accessing the database.
2. **Robust Authentication & RBAC:** JWT Bearer authentication, persistent session handling, automatic 401 logout, and role-based route protection (`ADMIN`, `INSTRUCTOR`, `STUDENT`).
3. **Comprehensive Entity Management:** Full coverage of Students, Programs, Courses, Academic Terms, Course Offerings, Enrollments, Grades, and Academic Records.
4. **Irregular Student Support:** Visual unit load gauge (`Enrolled Units / Max Allowed Units`), cross-section enrollment selection, and instant feedback for unit overload or capacity limits.
5. **Demonstration & Testing:** Full preparation for the 20 mandatory live demonstration tasks and automated component/integration testing with Vitest.

---

## 2. Technology Stack & Directory Structure

### 2.1 Technology Choices
- **Build Tool & Bundler:** Vite 6 (Lightning-fast HMR, lightweight build).
- **Core Library:** React 19 + TypeScript 5 (Strict type checking, native component architecture).
- **Styling:** Tailwind CSS v4 + `@tailwindcss/vite` (Utility-first styling, rapid responsive layout, dark/light theme support).
- **Iconography:** Lucide React (Crisp, accessible SVG icon set).
- **Routing:** React Router v7 (`react-router-dom`).
- **Server State & Data Fetching:** TanStack Query v5 (`@tanstack/react-query`) + Axios (Centralized API client, automatic cache invalidation, loading/error states).
- **Testing:** Vitest + React Testing Library + jsdom.

### 2.2 Project Structure (`frontend/`)
```
frontend/
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── vitest.config.ts
├── .env.example
├── public/
│   └── favicon.svg
└── src/
    ├── api/
    │   ├── client.ts             # Axios instance with request/response interceptors
    │   ├── auth.api.ts           # /auth/login, /auth/logout, /auth/me
    │   ├── students.api.ts       # CRUD, search, filter, pagination
    │   ├── reference.api.ts      # Programs, Courses, Academic Terms
    │   ├── enrollments.api.ts    # Offerings, enrollments, capacity checks
    │   └── grades.api.ts         # Grade entry, student grades, academic record
    ├── components/
    │   ├── common/               # Button, Input, Select, Modal, Alert, Badge, Spinner
    │   ├── layout/               # AppLayout, Sidebar, Navbar, PageHeader
    │   └── feedback/             # EmptyState, ErrorBanner, OfflineNotice, SkeletonTable
    ├── context/
    │   ├── AuthContext.tsx       # Auth provider, current user, login, logout
    │   └── ThemeContext.tsx      # Dark / Light theme toggle
    ├── hooks/
    │   ├── useAuth.ts            # Shortcut to auth context
    │   ├── useStudents.ts        # TanStack query & mutation hooks
    │   ├── useEnrollment.ts      # Load gauge calculation & enrollment mutation
    │   └── useAcademicRecord.ts  # Term GWA & transcript query
    ├── pages/
    │   ├── LoginPage.tsx         # Public login with demo credentials
    │   ├── DashboardPage.tsx     # Role-aware summary & metrics
    │   ├── StudentsPage.tsx      # Student directory with search, filter, pagination
    │   ├── StudentDetailPage.tsx # Student profile, irregular load gauge & enrollment
    │   ├── AcademicTermsPage.tsx # Reference terms & active semester
    │   ├── CoursesPage.tsx       # Programs & courses management
    │   ├── OfferingsPage.tsx     # Sections, schedules & capacity meters
    │   ├── GradesPage.tsx        # Instructor grade encoding
    │   ├── AcademicRecordPage.tsx# Official academic record & GPA transcript
    │   └── ForbiddenPage.tsx     # 403 Forbidden state
    ├── types/
    │   ├── api.types.ts          # Envelope: { success, message, data, meta }
    │   ├── auth.types.ts         # User, Role, LoginPayload, AuthState
    │   ├── student.types.ts      # Student, StudentType, StudentQuery
    │   └── academic.types.ts     # Course, Offering, Enrollment, Grade, Record
    ├── utils/
    │   ├── error-mapper.ts       # Extracts field errors from HTTP 422 responses
    │   └── formatters.ts         # Student number, GWA decimals, dates
    ├── App.tsx                   # Route definitions & ProtectedRoute boundaries
    ├── index.css                 # Tailwind v4 import & custom utilities
    └── main.tsx                  # QueryClientProvider & root mount
```

---

## 3. Centralized API Client & Error Normalization

### 3.1 Base Configuration
The frontend reads the API base URL from `VITE_API_BASE_URL` with a fallback to `http://localhost:3000/api/v1`.
```typescript
// frontend/src/api/client.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});
```

### 3.2 Token Interceptor & 401 Session Handling
- **Request Interceptor:** Automatically attaches `Authorization: Bearer ${token}` from `localStorage`.
- **Response Interceptor:**
  - On HTTP `401 Unauthorized`: Clears `sims_access_token` and `sims_user`, emits a custom `auth:unauthorized` event to redirect to `/login?session_expired=true`.
  - On HTTP `403 Forbidden`: Passes error through so components can render access-denied banners or redirect.
  - On HTTP `422 Unprocessable Content`: Preserves the backend `errors` object `{ [field]: [rules] }` for form binding.
  - On Network Failure: Emits a global offline toast.

---

## 4. State Management & Query Invalidation

TanStack Query manages all server state to guarantee consistency without manual store synchronization:
- **Query Keys:**
  - `['students', { search, program_id, year_level, student_type, page, per_page }]`
  - `['student', id]`
  - `['programs']`, `['courses']`, `['academic-terms']`
  - `['course-offerings', { academic_term_id }]`
  - `['grades', student_id]`
  - `['academic-record', student_id]`
- **Automatic Invalidation:**
  - Creating/updating a student $\rightarrow$ Invalidates `['students']`.
  - Enrolling a student $\rightarrow$ Invalidates `['student', student_id]`, `['course-offerings']`, and `['enrollments']`.
  - Encoding a grade $\rightarrow$ Invalidates `['grades']` and `['academic-record']`.

---

## 5. Detailed Module Workflows & UI Specifications

### 5.1 Authentication & Role-Aware Navigation
- **Login View (`/login`):**
  - Clean card with university branding.
  - Quick-Fill demo buttons for evaluator convenience:
    - **Admin:** `admin@sims.edu` / `Password123!`
    - **Instructor:** `prof.cruz@sims.edu` / `Password123!`
    - **Student:** `student1@sims.edu` / `Password123!`
  - Form validation with inline error feedback on HTTP 401.
- **Role-Aware Sidebar:**
  - **ADMIN:** Dashboard, Students, Programs & Courses, Academic Terms, Course Offerings, Enrollments, Grades, Settings.
  - **INSTRUCTOR:** Dashboard, Assigned Course Offerings, Enrolled Students, Grade Entry.
  - **STUDENT:** Dashboard, My Profile, My Enrollments, My Grades, Official Academic Record.

### 5.2 Students Directory & Search Integration
- URL query synchronization for shareable filters (`?search=santos&student_type=IRREGULAR&page=1`).
- Debounced search input (300ms) triggering backend search.
- Filter pill for `student_type`: `All`, `Regular`, `Irregular`.
- Table showing Student Number, Name, Program, Year Level, `student_type` badge (Blue for Regular, Amber for Irregular), `max_allowed_units`, and actions.
- Pagination footer driven by backend `meta` (`page`, `per_page`, `total_records`, `total_pages`, `has_next`, `has_prev`).
- Delete modal with explicit confirmation dialog.

### 5.3 Irregular Student Enrollment & Load Validation
- **Visual Unit Load Gauge:**
  - Displays dynamic progress bar of `Enrolled Units` vs `Student Max Allowed Units`.
  - Color state: Green ($< 80\%$), Amber ($80\% - 100\%$), Red ($> 100\%$).
- **Section Selection:**
  - Displays course offerings with real-time seat availability (e.g. `28/30 seats filled`).
  - Disables enrollment button if section is full (capacity 0).
- **Backend Error Handling:**
  - If cumulative term units exceed `max_allowed_units` $\rightarrow$ Displays backend HTTP 400 error message inline: `"Enrollment exceeds maximum allowed units for this student (Attempted: X, Allowed: Y)"`.
  - If duplicate enrollment $\rightarrow$ Displays HTTP 409 Conflict banner: `"Student is already enrolled in this course offering"`.

### 5.4 Academic Record & GPA Transcript
- Aggregates all terms where the student has enrollments.
- Header cards showing:
  - Cumulative GPA (e.g. `1.35`).
  - Total Completed Units.
  - Academic Standing badge (`Dean's List / Excellent Standing`).
- Chronological term cards displaying course code, title, units, midterm grade, final grade, remarks badge (`PASSED` vs `FAILED`), and calculated Term GWA.

---

## 6. Form Handling & HTTP 422 Error Binding

Forms will feature dual-layer validation:
1. **Client-Side Usability Checks:** Required fields, regex format checks (`^\d{4}-\d{5}$` for student numbers, valid email strings).
2. **Server-Side Validation Binding:**
   - When the backend returns HTTP 422:
     ```json
     {
       "success": false,
       "message": "Validation failed",
       "errors": {
         "student_number": ["student_number must match ^\\d{4}-\\d{5}$ regular expression"],
         "email": ["email must be an email"]
       }
     }
     ```
   - The custom `useFormErrors` hook maps each field's error array directly beneath the respective `<input />` component with red text and border highlight.

---

## 7. Verification & Automated Testing Plan

### 7.1 Vitest & React Testing Library
- **Auth Flow Test:** Verify login updates auth state, persists token, and redirects.
- **Student List Test:** Verify students are rendered from mocked/live API response, search query triggers refetch, pagination updates page index.
- **Validation Error Test:** Verify HTTP 422 response binds error message beneath the input.
- **Role Guard Test:** Verify student user cannot access admin route and renders Forbidden state.

### 7.2 20 Mandatory Live Demonstration Scenarios
All 20 demonstration tasks from Section 24 of the rubric are mapped directly to frontend user flows and documented in the project README.

---

## 8. Self-Review & Integrity Check
- **No Direct Database Access:** Verified. Frontend communicates strictly via HTTP to `http://localhost:3000/api/v1`.
- **No Embedded Backend:** Verified. Pure client Vite SPA.
- **No Leaked Secrets:** Verified. `.env.example` only contains public API base URL.
- **Irregular Student Logic:** Fully integrated into data models, search filters, and enrollment load gauge.
