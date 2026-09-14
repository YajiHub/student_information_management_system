# Irregular Student Unit Load Capping & Cross-Section Architecture

Academic domain modeling cannot assume uniform block schedules; irregular students require individual unit limits (`max_allowed_units`), cross-section course selection without cohort restrictions, and semester-level cumulative load validation during enrollment transactions to prevent academic overload or policy violations.

## Evidence
- Implemented `StudentType` enum (`REGULAR`, `IRREGULAR`) and `max_allowed_units` field in Prisma schema (`prisma/schema.prisma`).
- Built transactional unit aggregation in `EnrollmentsService`: queries existing enrolled credit units for the term, adds candidate course units, and verifies $\le \text{student.max\_allowed\_units}$.
- Automated test `should prevent irregular/underload student from exceeding max allowed units (400 Bad Request)` in `test/enrollments.e2e-spec.ts` passes consistently.

## Implications
- Future modules (such as frontend schedule visualizers in Lab 3) can query `?student_type=IRREGULAR` and display remaining allowable credit units dynamically per term.
- Enrollment operations remain thread-safe and resilient against concurrent over-enrollment.
