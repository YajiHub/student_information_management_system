# Student Information Management System (SIMS) Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an independent React 19 + TypeScript + Tailwind CSS v4 single-page application (SPA) in `frontend/` consuming the NestJS REST API, supporting role-aware navigation, irregular student load limits, real-time section capacity, GWA calculation, and meeting 100% of Laboratory Activity III rubric requirements.

**Architecture:** Client-side SPA using React Router v7 for routing, TanStack Query v5 for server-state caching and automatic list invalidation, centralized Axios client with JWT interceptors and HTTP 422 error normalization, and Tailwind CSS v4 for responsive, high-craft UI.

**Tech Stack:** React 19, Vite 6, TypeScript 5, Tailwind CSS v4, Lucide React, TanStack Query v5, Axios, React Router v7, Vitest, React Testing Library.

**Spec:** [docs/superpowers/specs/2026-09-15-student-ims-frontend-framework-design.md](file:///c:/Users/LEGION2/Yaji/projects/special_topics/student_ims/docs/superpowers/specs/2026-09-15-student-ims-frontend-framework-design.md)

## Global Constraints
- Backend API base URL: `http://localhost:3000/api/v1` (configurable via `VITE_API_BASE_URL`).
- Strict pure frontend client: No direct database access, no server actions, no mocked fake data.
- Envelope matching: All successful responses wrap in `{ success: true, message: string, data: T, meta?: PaginationMeta }`.
- Validation error mapping: HTTP 422 returns `{ success: false, message: string, errors: Record<string, string[]> }` and maps directly under input fields.
- Role-aware UX: `ADMIN`, `INSTRUCTOR`, and `STUDENT` experience tailored views, with true authorization enforced by backend guards.

---

### Task 1: Frontend Project Scaffolding & Tailwind CSS v4 Setup

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tsconfig.json`
- Create: `frontend/index.html`
- Create: `frontend/src/index.css`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.tsx`
- Create: `frontend/.env.example`

**Interfaces:**
- Produces: Running Vite development server on port 5173 and working Tailwind v4 utility styles.

- [ ] **Step 1: Initialize frontend directory and package.json**
Run `npm create vite@latest frontend -- --template react-ts` or create `frontend/package.json` with React 19, Vite, Tailwind CSS v4, Lucide React, Axios, TanStack Query, and React Router dependencies.

- [ ] **Step 2: Install dependencies**
Run `npm install` inside `frontend/`.

- [ ] **Step 3: Configure Tailwind CSS v4 with Vite**
Set up `@tailwindcss/vite` in `vite.config.ts` and import `@import "tailwindcss";` in `src/index.css`.

- [ ] **Step 4: Verify build**
Run `npm run build` inside `frontend/` to confirm zero compilation errors.

- [ ] **Step 5: Commit**
Run `git add frontend/` and `git commit -m "chore(frontend): initialize react 19 vite typescript project with tailwind v4"`.

---

### Task 2: Type Definitions & Centralized Axios API Client

**Files:**
- Create: `frontend/src/types/api.types.ts`
- Create: `frontend/src/types/auth.types.ts`
- Create: `frontend/src/types/student.types.ts`
- Create: `frontend/src/types/academic.types.ts`
- Create: `frontend/src/api/client.ts`
- Create: `frontend/src/api/auth.api.ts`
- Create: `frontend/src/api/students.api.ts`
- Create: `frontend/src/api/reference.api.ts`
- Create: `frontend/src/api/enrollments.api.ts`
- Create: `frontend/src/api/grades.api.ts`
- Test: `frontend/src/api/__tests__/client.spec.ts`

**Interfaces:**
- Consumes: Backend REST API contracts from `docs/swagger.json`.
- Produces: Type-safe API methods (`authApi`, `studentsApi`, `referenceApi`, `enrollmentsApi`, `gradesApi`) and typed response envelopes.

- [ ] **Step 1: Write test for API client token injection and 401 handling**
Verify request interceptor attaches `Authorization: Bearer <token>` and 401 clears local storage.

- [ ] **Step 2: Implement TypeScript interfaces matching backend models**
Define `ApiResponse<T>`, `PaginationMeta`, `User`, `Role`, `Student`, `StudentType`, `Program`, `Course`, `AcademicTerm`, `CourseOffering`, `Enrollment`, `Grade`, and `AcademicRecord`.

- [ ] **Step 3: Implement centralized Axios client with interceptors**
Create `apiClient` with base URL from `import.meta.env.VITE_API_BASE_URL` and response error interceptor.

- [ ] **Step 4: Implement modular API service functions**
Export categorized API calls for Auth, Students, Programs, Courses, Terms, Offerings, Enrollments, and Grades.

- [ ] **Step 5: Verify tests and build**
Run `npm run test` and `npm run build` in `frontend/`.

- [ ] **Step 6: Commit**
Run `git add frontend/src/types frontend/src/api` and `git commit -m "feat(frontend): create type definitions and centralized axios api client"`.

---

### Task 3: Authentication Context, Token Persistence & Login UI

**Files:**
- Create: `frontend/src/context/AuthContext.tsx`
- Create: `frontend/src/hooks/useAuth.ts`
- Create: `frontend/src/pages/LoginPage.tsx`
- Create: `frontend/src/components/layout/ProtectedRoute.tsx`
- Create: `frontend/src/pages/ForbiddenPage.tsx`
- Test: `frontend/src/pages/__tests__/LoginPage.spec.tsx`

**Interfaces:**
- Consumes: `authApi.login` and `authApi.getMe` from Task 2.
- Produces: `useAuth()` hook providing `{ user, token, login, logout, isAuthenticated, role }`, `<ProtectedRoute />` guard, and `<LoginPage />`.

- [ ] **Step 1: Write failing test for Login form submission and quick-fill buttons**
Verify submitting credentials invokes login API and quick-fill populates credentials.

- [ ] **Step 2: Implement AuthContext with localStorage persistence**
Manage user state, token storage, and session restoration on app launch.

- [ ] **Step 3: Implement LoginPage with university branding and demo credentials**
Build modern split card UI with email/password inputs, validation errors, and Quick-Fill buttons for Admin, Instructor, and Student.

- [ ] **Step 4: Implement ProtectedRoute and ForbiddenPage**
Route guard redirecting unauthenticated users to `/login` and unauthorized roles to `<ForbiddenPage />`.

- [ ] **Step 5: Run tests and verify**
Confirm tests pass.

- [ ] **Step 6: Commit**
Run `git add frontend/src/context frontend/src/pages/LoginPage.tsx frontend/src/components/layout/ProtectedRoute.tsx` and `git commit -m "feat(frontend): implement auth context, protected routes, and login view"`.

---

### Task 4: App Layout, Role-Aware Navigation & Dashboard View

**Files:**
- Create: `frontend/src/components/layout/AppLayout.tsx`
- Create: `frontend/src/components/layout/Sidebar.tsx`
- Create: `frontend/src/components/layout/Navbar.tsx`
- Create: `frontend/src/pages/DashboardPage.tsx`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Consumes: `useAuth()` from Task 3, `studentsApi.getAll`, `referenceApi.getTerms`.
- Produces: Responsive App Shell layout and Dashboard metrics view.

- [ ] **Step 1: Write failing test for Sidebar role-based navigation links**
Verify Admin sees all modules, Instructor sees assigned courses/grades, and Student sees only own profile/grades/record.

- [ ] **Step 2: Implement Sidebar and Navbar**
Responsive layout with active route indicator, user profile card, role pill, and logout button.

- [ ] **Step 3: Implement DashboardPage with metric cards and quick links**
Show summary cards: Total Students, Irregular Students count, Active Course Offerings, Current Academic Term badge, and quick action buttons.

- [ ] **Step 4: Wire routing in App.tsx**
Wrap dashboard and future views inside `<AppLayout />`.

- [ ] **Step 5: Verify build and test**
Run `npm run build` in `frontend/`.

- [ ] **Step 6: Commit**
Run `git add frontend/src/components/layout frontend/src/pages/DashboardPage.tsx frontend/src/App.tsx` and `git commit -m "feat(frontend): implement app shell layout and role-aware dashboard"`.

---

### Task 5: Students Management (Directory, Search, Filters & Pagination)

**Files:**
- Create: `frontend/src/pages/StudentsPage.tsx`
- Create: `frontend/src/components/students/StudentTable.tsx`
- Create: `frontend/src/components/students/StudentFormModal.tsx`
- Create: `frontend/src/components/students/StudentDeleteModal.tsx`
- Create: `frontend/src/hooks/useStudents.ts`
- Test: `frontend/src/pages/__tests__/StudentsPage.spec.tsx`

**Interfaces:**
- Consumes: `studentsApi` and `referenceApi.getPrograms`.
- Produces: Complete Student CRUD interface with search, multi-filter, pagination, and HTTP 422 error binding.

- [ ] **Step 1: Write failing test for student search, pagination, and 422 error display**
Test verifies changing search input debounces query, clicking page 2 requests page 2, and 422 errors render below input.

- [ ] **Step 2: Implement useStudents TanStack Query hook**
Handle query caching, debounced search parameter, program filter, and `student_type=IRREGULAR` toggle.

- [ ] **Step 3: Implement StudentTable with status badges and pagination**
Render table with Student Number, Name, Program, Year Level, `StudentType` pill (Blue for Regular, Amber for Irregular), and action buttons.

- [ ] **Step 4: Implement StudentFormModal with dual-layer validation**
Create/Edit form with client validation and backend HTTP 422 field error mapping.

- [ ] **Step 5: Implement StudentDeleteModal with confirmation prompt**
Confirmation dialog triggering soft delete / removal.

- [ ] **Step 6: Run tests and verify**
Run `npm run test` in `frontend/`.

- [ ] **Step 7: Commit**
Run `git add frontend/src/pages/StudentsPage.tsx frontend/src/components/students frontend/src/hooks/useStudents.ts` and `git commit -m "feat(frontend): implement students directory with search, filters, pagination, and modals"`.

---

### Task 6: Academic Reference Data (Programs, Courses, Academic Terms)

**Files:**
- Create: `frontend/src/pages/ProgramsPage.tsx`
- Create: `frontend/src/pages/CoursesPage.tsx`
- Create: `frontend/src/pages/AcademicTermsPage.tsx`
- Create: `frontend/src/components/reference/ProgramFormModal.tsx`
- Create: `frontend/src/components/reference/CourseFormModal.tsx`
- Create: `frontend/src/components/reference/TermFormModal.tsx`
- Test: `frontend/src/pages/__tests__/ReferencePages.spec.tsx`

**Interfaces:**
- Consumes: `referenceApi`.
- Produces: Management views for Programs, Courses, and Academic Terms.

- [ ] **Step 1: Write test for course units validation and program 409 conflict**
Verify 409 duplicate code displays conflict alert, and units are restricted to 1-6.

- [ ] **Step 2: Implement ProgramsPage and CoursePage**
Data tables with create modals and conflict error handling.

- [ ] **Step 3: Implement AcademicTermsPage**
List academic years and semesters with active semester toggle indicator.

- [ ] **Step 4: Verify build and test**
Run `npm run build` in `frontend/`.

- [ ] **Step 5: Commit**
Run `git add frontend/src/pages/ProgramsPage.tsx frontend/src/pages/CoursesPage.tsx frontend/src/pages/AcademicTermsPage.tsx frontend/src/components/reference` and `git commit -m "feat(frontend): implement programs, courses, and academic terms management"`.

---

### Task 7: Course Offerings & Section Capacity Management

**Files:**
- Create: `frontend/src/pages/OfferingsPage.tsx`
- Create: `frontend/src/components/offerings/OfferingCard.tsx`
- Create: `frontend/src/components/offerings/OfferingFormModal.tsx`
- Create: `frontend/src/components/offerings/OfferingStudentsModal.tsx`
- Test: `frontend/src/pages/__tests__/OfferingsPage.spec.tsx`

**Interfaces:**
- Consumes: `enrollmentsApi.getOfferings`, `enrollmentsApi.createOffering`, `enrollmentsApi.getOfferingStudents`.
- Produces: Offerings directory with real-time seat availability and enrolled students view.

- [ ] **Step 1: Write test for section capacity indicator**
Verify offering displays `enrolled_count / capacity` and highlights full sections in red.

- [ ] **Step 2: Implement OfferingsPage and OfferingCard**
Cards displaying course code, title, section name, instructor, schedule, room, and capacity progress bar.

- [ ] **Step 3: Implement OfferingFormModal**
Modal for Admin to create offering with term, course, instructor, section, and seat limit.

- [ ] **Step 4: Implement OfferingStudentsModal**
Modal displaying list of students enrolled in the selected section.

- [ ] **Step 5: Verify build and test**
Run `npm run build` in `frontend/`.

- [ ] **Step 6: Commit**
Run `git add frontend/src/pages/OfferingsPage.tsx frontend/src/components/offerings` and `git commit -m "feat(frontend): implement course offerings with real-time capacity meters"`.

---

### Task 8: Enrollment Flow & Visual Irregular Load Gauge

**Files:**
- Create: `frontend/src/pages/StudentDetailPage.tsx`
- Create: `frontend/src/components/enrollment/UnitLoadGauge.tsx`
- Create: `frontend/src/components/enrollment/EnrollmentModal.tsx`
- Create: `frontend/src/hooks/useEnrollment.ts`
- Test: `frontend/src/components/enrollment/__tests__/UnitLoadGauge.spec.tsx`

**Interfaces:**
- Consumes: `studentsApi.getById`, `enrollmentsApi.enroll`, `enrollmentsApi.drop`.
- Produces: Student detail profile, dynamic unit load gauge, and cross-section enrollment workflow.

- [ ] **Step 1: Write failing test for UnitLoadGauge**
Verify gauge shows current units / max allowed units, color changes to red if over cap, and displays remaining allowed units.

- [ ] **Step 2: Implement UnitLoadGauge component**
Visual progress bar showing `Enrolled Units / Max Units` with green ($<80\%$), amber ($80\%-100\%$), and red ($>100\%$) states.

- [ ] **Step 3: Implement StudentDetailPage**
Displays student demographic info, program, year level, `student_type`, `max_allowed_units`, active enrollments table, and "Enroll in Course" action.

- [ ] **Step 4: Implement EnrollmentModal with capacity and overload error feedback**
Course offering selector showing remaining seats. Catches HTTP 400 unit overload errors and displays: `"Enrollment exceeds maximum allowed units for this student"`.

- [ ] **Step 5: Run tests and verify**
Run `npm run test` in `frontend/`.

- [ ] **Step 6: Commit**
Run `git add frontend/src/pages/StudentDetailPage.tsx frontend/src/components/enrollment` and `git commit -m "feat(frontend): implement irregular student load gauge and enrollment modal"`.

---

### Task 9: Grades Entry & Official Academic Record (Transcript & GWA)

**Files:**
- Create: `frontend/src/pages/GradesPage.tsx`
- Create: `frontend/src/pages/AcademicRecordPage.tsx`
- Create: `frontend/src/components/grades/GradeEntryModal.tsx`
- Create: `frontend/src/components/grades/TermAcademicCard.tsx`
- Test: `frontend/src/pages/__tests__/AcademicRecordPage.spec.tsx`

**Interfaces:**
- Consumes: `gradesApi.encodeGrade`, `gradesApi.updateGrade`, `gradesApi.getAcademicRecord`.
- Produces: Instructor grade encoding workflow and student academic record transcript view.

- [ ] **Step 1: Write test for Academic Record GWA display and remarks badges**
Verify academic record displays Cumulative GPA and calculates Term GWA per semester.

- [ ] **Step 2: Implement GradesPage for instructors**
List assigned course offerings and enrolled students with inputs for midterm & final grades. Automatically previews remarks (`PASSED` / `FAILED`).

- [ ] **Step 3: Implement AcademicRecordPage**
Official student transcript with Cumulative GPA card, academic standing pill, and chronological term cards with Term GWA.

- [ ] **Step 4: Verify build and test**
Run `npm run build` in `frontend/`.

- [ ] **Step 5: Commit**
Run `git add frontend/src/pages/GradesPage.tsx frontend/src/pages/AcademicRecordPage.tsx frontend/src/components/grades` and `git commit -m "feat(frontend): implement grade encoding and academic record gwa transcript"`.

---

### Task 10: UX Hardening, Offline Support & Automated Frontend Tests

**Files:**
- Create: `frontend/src/components/feedback/SkeletonTable.tsx`
- Create: `frontend/src/components/feedback/EmptyState.tsx`
- Create: `frontend/src/components/feedback/OfflineBanner.tsx`
- Create: `frontend/src/components/feedback/ToastContainer.tsx`
- Test: `frontend/tests/critical-flows.e2e-spec.tsx`

**Interfaces:**
- Produces: Polished UX states (loading skeletons, empty records, offline network notice, toast messages) and automated critical flow test suite.

- [ ] **Step 1: Implement SkeletonTable, EmptyState, and ToastContainer**
Render accessible skeleton placeholders during API fetches and clean empty states when no records match.

- [ ] **Step 2: Implement OfflineBanner**
Listens to `window.addEventListener('offline')` or Axios network failure to display controlled offline notice (Rubric Task 19).

- [ ] **Step 3: Write critical flow automated tests**
Test: Login $\rightarrow$ Load Student List $\rightarrow$ Open Create Modal $\rightarrow$ Submit with 422 error $\rightarrow$ Correct error $\rightarrow$ Success.

- [ ] **Step 4: Run all frontend tests**
Run `npm run test` in `frontend/`.

- [ ] **Step 5: Commit**
Run `git add frontend/src/components/feedback frontend/tests` and `git commit -m "feat(frontend): add ux hardening, loading skeletons, offline support, and e2e tests"`.

---

### Task 11: Documentation & 20 Demonstration Tasks Alignment

**Files:**
- Create: `frontend/README.md`
- Create: `frontend/docs/API_INTEGRATION_MAP.md`
- Create: `frontend/docs/AI_LOG.md`
- Create: `frontend/docs/DEMO_SCRIPT.md`

**Interfaces:**
- Produces: Comprehensive documentation deliverables fulfilling Sections 22, 23, and 24 of the Laboratory Activity III rubric.

- [ ] **Step 1: Write frontend README.md**
Document framework choices, installation, environment setup (`VITE_API_BASE_URL`), build instructions, and running both backend and frontend together.

- [ ] **Step 2: Write API_INTEGRATION_MAP.md**
Table mapping every frontend page $\rightarrow$ REST endpoint $\rightarrow$ HTTP method $\rightarrow$ required role.

- [ ] **Step 3: Write DEMO_SCRIPT.md**
Step-by-step walkthrough covering all 20 mandatory live demonstration tasks from Section 24 of the rubric.

- [ ] **Step 4: Write AI_LOG.md**
Document AI prompts, human verification, decisions, and troubleshooting steps per Section 6.3.

- [ ] **Step 5: Commit**
Run `git add frontend/README.md frontend/docs` and `git commit -m "docs(frontend): add readme, api integration map, demo script, and ai log"`.
