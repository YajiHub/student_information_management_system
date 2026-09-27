# Apex Institute of Technology &bull; Student Information Management System (SIMS)
## Laboratory Activity III: AI-Assisted Frontend Framework Integration with an Existing REST API
**Course:** Special Topics in Software Development (BSIT 4th Year)

---

## 1. Project Overview

This application is an independent, single-page client frontend built with **React 19, TypeScript 5, Vite 6, and Tailwind CSS v4**. It integrates directly with the authoritative **NestJS 11 REST API** running on `http://localhost:3000/api/v1`.

### Core Highlights
- **Strict Client-Side Architecture:** Zero direct database access, zero backend bypass, zero mock data in production. All state is synced via centralized Axios client and TanStack Query v5.
- **Role-Aware Workflows:** Dedicated dashboards, navigation guards, and permissions tailored for `ADMIN`, `INSTRUCTOR`, and `STUDENT` users.
- **Irregular Student Unit Load Enforcement:** Real-time visual academic load gauge enforcing the **15-unit ceiling** for irregular students versus the **23-unit limit** for regular students.
- **Live Section Capacity Gauges:** Real-time visual occupancy bars showing enrolled seats vs maximum capacity, with automatic overload and full-section guards.
- **Official Transcript & GWA Engine:** Generates official registrar-grade transcripts with per-term GWA, cumulative GPA, and print-ready document styling.

---

## 2. Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Framework** | [React 19](https://react.dev/) | React 19 + TypeScript 5 |
| **Build Tool** | [Vite 6](https://vite.dev/) | Fast HMR, ESM bundling (builds in ~1s) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | `@tailwindcss/vite` with dark mode slate/emerald aesthetic |
| **Typography** | Google Fonts | Plus Jakarta Sans, Inter, Fira Code |
| **Icons** | [Lucide React](https://lucide.dev/) | Consistent iconography |
| **Server State** | [TanStack Query v5](https://tanstack.com/query) | Cache invalidation, query states, optimistic updates |
| **HTTP Client** | [Axios](https://axios-http.com/) | Centralized interceptors, JWT Bearer auto-injection, 401 handling |
| **Routing** | [React Router v7](https://reactrouter.com/) | Protected routes, role-based guards, redirect handling |
| **Testing** | [Vitest](https://vitest.dev/) + React Testing Library | **43 unit and integration tests across 14 test suites (100% passing)** |

---

## 3. Project Structure

```text
frontend/
├── .env.example                      # Sample client environment configuration
├── .env                              # Local client configuration (VITE_API_BASE_URL)
├── index.html                        # Application entry HTML with Google Fonts
├── package.json                      # Dependencies and scripts
├── tsconfig.json                     # TypeScript project reference config
├── tsconfig.app.json                 # TypeScript compiler configuration with @/* alias
├── vite.config.ts                    # Vite 6 config with @tailwindcss/vite & path aliases
├── vitest.config.ts                  # Vitest test runner configuration
└── src/
    ├── api/                          # Centralized Axios client & modular API services
    │   ├── client.ts                 # Axios instance with JWT Bearer interceptor & 401 dispatch
    │   ├── auth.api.ts               # Login, logout, getMe
    │   ├── users.api.ts              # Admin user account management & instructor listing
    │   ├── audit.api.ts              # Admin activity audit logs
    │   ├── students.api.ts           # Student CRUD, search, grades, academic records
    │   ├── reference.api.ts          # Programs, courses, and academic terms CRUD
    │   ├── enrollments.api.ts        # Offerings CRUD, section rosters, enroll, and drop
    │   └── grades.api.ts             # Grade encoding and updating
    ├── components/
    │   ├── common/                   # Offline banner, StudentSelectCombobox, shared UI widgets
    │   └── layout/                   # Navbar, Sidebar, AppLayout, ProtectedRoute
    ├── context/
    │   └── AuthContext.tsx           # Session management, JWT persistence in localStorage
    ├── hooks/
    │   └── useAuth.ts                # Auth state hook
    ├── pages/
    │   ├── LoginPage.tsx             # University login with Evaluator Quick-Fill demo buttons
    │   ├── DashboardPage.tsx         # Role-aware dashboard with KPI summary metrics
    │   ├── ForbiddenPage.tsx         # 403 Access Denied screen
    │   ├── profile/                  # Student profile viewing personal standing & program
    │   ├── admin/                    # System Admin: User Accounts & Activity Audit Logs
    │   ├── students/                 # Student directory, search, filter, and registration modal
    │   ├── academic/                 # Programs catalog, course list, academic terms
    │   ├── offerings/                # Section offerings, capacity bars, roster, edit/delete actions
    │   ├── enrollments/              # Enrollment console, visual LoadGauge (15 vs 23 units)
    │   ├── grades/                   # Instructor grades entry (1.00 - 5.00 scale)
    │   └── records/                  # Official transcript, cumulative GPA, print layout
    ├── test/
    │   ├── setup.ts                  # Vitest setup with jest-dom matchers
    │   └── integration/              # Full user-flow integration test suites
    └── types/                        # Comprehensive TypeScript types matching NestJS DTOs
```

---

## 4. Setup & Running Locally

### Prerequisites
- Node.js 20+ installed
- Authoritative NestJS REST API running on `http://localhost:3000/api/v1`

### Installation
```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Verify environment configuration
# Ensure .env contains:
VITE_API_BASE_URL=http://localhost:3000/api/v1

# 4. Start development server
npm run dev
# Application will be accessible at http://localhost:5173
```

### Running Tests & Building
```bash
# Run Vitest test suite (43/43 tests passing)
npm run test

# Run production build and TypeScript type-check
npm run build
```

---

## 5. Evaluator Quick-Fill Credentials

For streamlined assessment during presentation and grading, the Login page includes **Quick-Fill Evaluator Buttons**:

All demo accounts use the standard password: **`Password123!`**

| Role | Email | Password | Allowed Access |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@sims.edu` | `Password123!` | Complete unrestricted access across all modules (Users, Audit Logs, Curriculum, Enrollments) |
| **Registrar Staff** | `registrar@sims.edu` | `Password123!` | Manages student records, degree programs, course catalog, terms, and course offerings |
| **Faculty Instructor** | `prof.cruz@sims.edu` | `Password123!` | Assigned offerings, class roster, grades entry (1.00-5.00) |
| **Regular Student** | `student1@sims.edu` | `Password123!` | Student dashboard, 24-unit load gauge, transcript, classmates roster |
| **Irregular Student** | `student2@sims.edu` | `Password123!` | Student dashboard, **15-unit load gauge**, transcript, classmates roster |

---

## 6. Alignment with the 20 Acceptance Demonstration Cases

| # | Demonstration Case | Frontend Module & Workflow |
| :-: | :--- | :--- |
| **1** | Admin Authentication & JWT Generation | `LoginPage`: Submit credentials or click "Admin" Quick-Fill. JWT Bearer token stored in `localStorage`. |
| **2** | Regular Student Registration | `StudentsPage`: Click "Register New Student", select `REGULAR` classification (Max Units defaults to 24). |
| **3** | Irregular Student Registration | `StudentsPage`: Select `IRREGULAR` classification; Max Units locks to configurable limit (**15 units**). |
| **4** | Duplicate Student Number Conflict | `StudentsPage`: Submitting duplicate student number captures HTTP 409/422 and renders error banner. |
| **5** | Academic Degree Program Catalog | `CoursesPage` &rarr; "Academic Programs" Tab: Lists degree programs with code, title, and description. |
| **6** | Course Catalog Management | `CoursesPage` &rarr; "Course Catalog" Tab: Lists courses with credit units, search filter, and add modal. |
| **7** | Academic Term Calendar Creation | `TermsPage`: Creates term with start/end date window and glowing "ACTIVE TERM" status badge. |
| **8** | Section Offering Setup | `OfferingsPage`: Click "Create Section Offering" with capacity, schedule, room, and assigned instructor. Per-row edit/delete actions. |
| **9** | Course Section Enrollment | `EnrollmentsPage`: Select student with searchable combobox, choose open section offering, click "Enroll". |
| **10** | Section Capacity Full Guard | `OfferingsPage` & `EnrollmentsPage`: Sections at 100% display red `SECTION FULL` badge; enroll button disabled. |
| **11** | Duplicate Course Enrollment Guard | `EnrollmentsPage`: Already enrolled course offerings display a disabled `Enrolled` status button. |
| **12** | Regular Student Load Ceiling (24 Units) | `EnrollmentsPage`: `<LoadGauge />` dynamically tracks load against 24-unit limit. |
| **13** | Irregular Student Load Ceiling (15 Units) | `EnrollmentsPage`: `<LoadGauge />` enforces **15-unit limit**; attempts to add exceeding courses are disabled. |
| **14** | Dropping an Enrolled Course | `EnrollmentsPage`: Click "Drop" action button with modal confirmation; units immediately deducted. |
| **15** | Faculty Authentication & Scope | `LoginPage`: Log in as instructor. Sidebar filters out administrative settings and locks to assigned classes. |
| **16** | Midterm & Final Grades Encoding | `GradesPage`: Enter midterm and final grades on 1.00 - 5.00 scale; remarks dynamically update to `PASSED`. |
| **17** | Unauthorized Instructor Guard | `GradesPage`: Sections dropdown only lists offerings assigned to logged-in faculty user. |
| **18** | Term GWA Computation | `RecordsPage`: Displays official term GWA calculated as $\sum(Grade \times Units) / \sum Units$. |
| **19** | Official Transcript & Cumulative GPA | `RecordsPage`: Displays complete academic history, cumulative GPA, and "Print Transcript" button. |
| **20** | Student Self-Service Portal | `DashboardPage`: Logged-in student sees personal enrollment load standing, active term, and grades. |

---

## 7. API Integration Map

In accordance with Section 22 of Laboratory Activity III, the table below maps frontend features directly to the backend REST API:

| Frontend View / Feature | REST Endpoint | HTTP Method | Authorized Roles | Description / UI Response |
| :--- | :--- | :---: | :--- | :--- |
| `LoginPage` | `/api/v1/auth/login` | `POST` | Public | Submits credentials; stores JWT token in `localStorage`. |
| `Navbar` / Session Init | `/api/v1/auth/me` | `GET` | Authenticated | Fetches profile and role to render role-aware layout. |
| `Navbar` / Logout | `/api/v1/auth/logout` | `POST` | Authenticated | Clears client session and navigates to login. |
| `UsersPage` | `/api/v1/users` | `GET`, `POST` | ADMIN | Manages user credentials, role assignments, and statuses. |
| `UsersPage` | `/api/v1/users/:id` | `PATCH`, `DELETE` | ADMIN | Edits or deactivates user accounts. |
| `LogsPage` | `/api/v1/audit-logs` | `GET` | ADMIN | Displays system HTTP activity, status codes, and actor details. |
| `StudentsPage` | `/api/v1/students` | `GET`, `POST` | ADMIN, REGISTRAR | Lists students with pagination/filters; registers new students. |
| `StudentsPage` / `StudentModal` | `/api/v1/students/:id` | `GET`, `PATCH`, `DELETE` | ADMIN, REGISTRAR | Fetches student details; updates standing or deletes student. |
| `CoursesPage` (Programs) | `/api/v1/programs` | `GET`, `POST` | Authenticated (POST: ADMIN/REGISTRAR) | Lists degree programs; creates new programs. |
| `CoursesPage` (Programs) | `/api/v1/programs/:id` | `PUT`, `DELETE` | ADMIN, REGISTRAR (DELETE: ADMIN) | Edits or deletes degree program. |
| `CoursesPage` (Courses) | `/api/v1/courses` | `GET`, `POST` | Authenticated (POST: ADMIN/REGISTRAR) | Lists courses with search; creates new curriculum course. |
| `CoursesPage` (Courses) | `/api/v1/courses/:id` | `PUT`, `DELETE` | ADMIN, REGISTRAR (DELETE: ADMIN) | Edits or deletes course catalog entry. |
| `TermsPage` | `/api/v1/academic-terms` | `GET`, `POST` | Authenticated (POST: ADMIN/REGISTRAR) | Lists academic terms; creates new semester window. |
| `TermsPage` | `/api/v1/academic-terms/:id` | `PUT`, `DELETE` | ADMIN, REGISTRAR (DELETE: ADMIN) | Modifies term dates/status or deletes term. |
| `OfferingsPage` | `/api/v1/course-offerings` | `GET`, `POST` | Authenticated (POST: ADMIN/REGISTRAR) | Displays section capacity bars; creates new offering section. |
| `OfferingsPage` | `/api/v1/course-offerings/:id` | `PUT`, `DELETE` | ADMIN, REGISTRAR (DELETE: ADMIN) | Edits section schedule/room or deletes offering. |
| `RosterModal` | `/api/v1/course-offerings/:id/students` | `GET` | ADMIN, REGISTRAR, INSTRUCTOR, STUDENT | Lists enrolled students (grades masked to `null` for student viewers). |
| `EnrollmentsPage` | `/api/v1/enrollments` | `POST` | ADMIN, REGISTRAR | Enrolls student; updates `<LoadGauge />` and enforces limits. |
| `EnrollmentsPage` | `/api/v1/enrollments/:id` | `DELETE` | ADMIN, REGISTRAR | Drops student enrollment; releases seat count. |
| `GradesPage` | `/api/v1/grades` | `POST`, `PATCH` | ADMIN, Assigned INSTRUCTOR | Encodes midterm/final grades on 1.00-5.00 scale; derives remarks. |
| `RecordsPage` / `ProfilePage` | `/api/v1/students/:id/academic-record` | `GET` | ADMIN, INSTRUCTOR, STUDENT (Self only) | Renders transcript with term GWA and cumulative GPA. |

---

## 8. Frontend Architecture Note

- **Routing & Route Protection:** Built with `React Router v7`. `ProtectedRoute.tsx` verifies authentication and permitted roles before rendering child components. Unauthorized access immediately redirects to `/forbidden` (403) or `/login` (401).
- **API Client & Request Lifecycle:** Centralized Axios instance in `src/api/client.ts`. Automatically attaches `Authorization: Bearer <token>` to all requests. Global response interceptor dispatches an unauthorized event on HTTP 401 to clear local storage and reset auth state.
- **Authentication & Session State:** Managed through React Context (`AuthContext.tsx`) and consumed via `useAuth.ts`. Stores JWT tokens in `localStorage` for session persistence across page refreshes.
- **Component & Design System:** Modular layouts (`AppLayout.tsx`, `Sidebar.tsx`, `Navbar.tsx`) using Tailwind CSS v4. Reusable components like `StudentSelectCombobox.tsx` provide live substring matching, keyboard navigation, and preview counters.
- **Data Synchronization & Cache Strategy:** TanStack Query v5 handles server state with query keys (`['students']`, `['offerings']`, `['users']`, etc.). All POST/PATCH/DELETE mutations immediately invoke `queryClient.invalidateQueries` to ensure the UI stays synchronized with backend data without full page reloads.

---

## 9. AI Development Log (Laboratory Activity III)

| Task | AI Assistant | Prompt Summary | Output / Deliverable | Human Verification | Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Frontend Scaffolding** | Google Antigravity (Gemini) | Scaffold React 19 + TypeScript + Vite 6 with Tailwind CSS v4 | Project files, `@tailwindcss/vite` config, Axios client, layout components | Verified build (`tsc -b && vite build`) and inspected Tailwind v4 theme | `package.json`, `vite.config.ts` |
| **Role-Aware Navigation** | Google Antigravity (Gemini) | Add dynamic sidebar links filtering by user role (Admin, Registrar, Instructor, Student) | `Sidebar.tsx`, `ProtectedRoute.tsx`, `ForbiddenPage.tsx` | Tested role transitions across all 5 demo user logins | `Sidebar.spec.tsx` (passed) |
| **Searchable Combobox** | Google Antigravity (Gemini) | Create student combobox to resolve 422 param mismatch and support live filtering | `StudentSelectCombobox.tsx` with mark highlight and live counter | Verified keyboard navigation and search across 100 students | `StudentSelectCombobox.spec.tsx` (passed) |
| **Roster Student Privacy** | Google Antigravity (Gemini) | Fix 0-student roster bug for students while withholding classmate grades | Updated `course-offerings.controller.ts` & `RosterModal.tsx` error handling | Automated E2E test verifying student gets 200 with null grades | `test/enrollments.e2e-spec.ts` (passed) |
| **Admin Module** | Google Antigravity (Gemini) | Implement User Management and Audit Logs frontend pages | `UsersPage.tsx`, `LogsPage.tsx`, `UserModal.tsx`, `admin.types.ts` | Tested creating users and inspecting live audit log trail | `AdminPages.spec.tsx` (passed) |
| **Test Suite Expansion** | Google Antigravity (Gemini) | Expand Vitest test suites to cover all new features and pages | 14 test suites, 43 total frontend tests covering integration and components | Executed `npm test -- --run` (43/43 passed) | `vitest run` output (100% green) |
