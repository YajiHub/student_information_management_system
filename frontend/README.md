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
| **Build Tool** | [Vite 6](https://vite.dev/) | Fast HMR, ESM bundling (builds in < 500ms) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | `@tailwindcss/vite` with dark mode slate/emerald aesthetic |
| **Typography** | Google Fonts | Plus Jakarta Sans, Inter, Fira Code |
| **Icons** | [Lucide React](https://lucide.dev/) | Consistent iconography |
| **Server State** | [TanStack Query v5](https://tanstack.com/query) | Cache invalidation, query states, optimistic updates |
| **HTTP Client** | [Axios](https://axios-http.com/) | Centralized interceptors, JWT Bearer auto-injection, 401 handling |
| **Routing** | [React Router v7](https://reactrouter.com/) | Protected routes, role-based guards, redirect handling |
| **Testing** | [Vitest](https://vitest.dev/) + React Testing Library | 30 unit and integration tests across 11 test suites |

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
    │   ├── students.api.ts           # Student CRUD, search, grades, academic records
    │   ├── reference.api.ts          # Programs, courses, and academic terms
    │   ├── enrollments.api.ts        # Offerings, section rosters, enroll, and drop
    │   └── grades.api.ts             # Grade encoding and updating
    ├── components/
    │   ├── common/                   # Offline banner, shared UI widgets
    │   └── layout/                   # Navbar, Sidebar, AppLayout, ProtectedRoute
    ├── context/
    │   └── AuthContext.tsx           # Session management, JWT persistence in localStorage
    ├── hooks/
    │   └── useAuth.ts                # Auth state hook
    ├── pages/
    │   ├── LoginPage.tsx             # University login with Evaluator Quick-Fill demo buttons
    │   ├── DashboardPage.tsx         # Role-aware dashboard with KPI summary metrics
    │   ├── ForbiddenPage.tsx         # 403 Access Denied screen
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
# Run Vitest test suite (30/30 tests)
npm run test

# Run production build and TypeScript type-check
npm run build
```

---

## 5. Evaluator Quick-Fill Credentials

For streamlined assessment during presentation and grading, the Login page includes **Quick-Fill Evaluator Buttons**:

| Role | Email | Password | Allowed Access |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@university.edu` | `AdminPass123!` | Complete unrestricted access across all modules |
| **Faculty Instructor** | `santos.j@university.edu` | `FacultyPass123!` | Assigned offerings, class roster, grades entry (1.00-5.00) |
| **Regular Student** | `2022-00001@student.edu` | `StudentPass123!` | Student dashboard, 23-unit load gauge, transcript |
| **Irregular Student** | `2021-00042@student.edu` | `StudentPass123!` | Student dashboard, **15-unit load gauge**, transcript |

---

## 6. Alignment with the 20 Acceptance Demonstration Cases

| # | Demonstration Case | Frontend Module & Workflow |
| :-: | :--- | :--- |
| **1** | Admin Authentication & JWT Generation | `LoginPage`: Submit credentials or click "Admin" Quick-Fill. JWT Bearer token stored in `localStorage`. |
| **2** | Regular Student Registration | `StudentsPage`: Click "Register New Student", select `REGULAR` classification (Max Units defaults to 23). |
| **3** | Irregular Student Registration | `StudentsPage`: Select `IRREGULAR` classification; Max Units automatically locks to **15 units**. |
| **4** | Duplicate Student Number Conflict | `StudentsPage`: Submitting duplicate student number captures HTTP 409/422 and renders error banner. |
| **5** | Academic Degree Program Catalog | `CoursesPage` &rarr; "Academic Programs" Tab: Lists degree programs with code, title, and description. |
| **6** | Course Catalog Management | `CoursesPage` &rarr; "Course Catalog" Tab: Lists courses with credit units, search filter, and add modal. |
| **7** | Academic Term Calendar Creation | `TermsPage`: Creates term with start/end date window and glowing "ACTIVE TERM" status badge. |
| **8** | Section Offering Setup | `OfferingsPage`: Click "Create Section Offering" with capacity, schedule, room, and assigned instructor. Per-row pencil and trash actions let Admin/Registrar edit a section and Admin delete an empty one. |
| **9** | Course Section Enrollment | `EnrollmentsPage`: Select student, choose open section offering, click "Enroll" button. |
| **10** | Section Capacity Full Guard | `OfferingsPage` & `EnrollmentsPage`: Sections at 100% display red `SECTION FULL` badge; enroll button disabled. |
| **11** | Duplicate Course Enrollment Guard | `EnrollmentsPage`: Already enrolled course offerings display a disabled `Enrolled` status button. |
| **12** | Regular Student Load Ceiling (23 Units) | `EnrollmentsPage`: `<LoadGauge />` dynamically tracks load against 23-unit limit. |
| **13** | Irregular Student Load Ceiling (15 Units) | `EnrollmentsPage`: `<LoadGauge />` enforces **15-unit limit**; attempts to add exceeding courses are disabled. |
| **14** | Dropping an Enrolled Course | `EnrollmentsPage`: Click "Drop" action button with modal confirmation; units immediately deducted. |
| **15** | Faculty Authentication & Scope | `LoginPage`: Log in as instructor. Sidebar filters out administrative settings and locks to assigned classes. |
| **16** | Midterm & Final Grades Encoding | `GradesPage`: Enter midterm and final grades on 1.00 - 5.00 scale; remarks dynamically update to `PASSED`. |
| **17** | Unauthorized Instructor Guard | `GradesPage`: Sections dropdown only lists offerings assigned to logged-in faculty user. |
| **18** | Term GWA Computation | `RecordsPage`: Displays official term GWA calculated as $\sum(Grade \times Units) / \sum Units$. |
| **19** | Official Transcript & Cumulative GPA | `RecordsPage`: Displays complete academic history, cumulative GPA, and "Print Transcript" button. |
| **20** | Student Self-Service Portal | `DashboardPage`: Logged-in student sees personal enrollment load standing, active term, and grades. |
