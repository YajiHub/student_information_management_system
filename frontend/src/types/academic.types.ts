import type { Student } from './student.types';
import type { User } from './auth.types';

export interface Program {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Course {
  id: number;
  course_code: string;
  course_title: string;
  description?: string | null;
  units: number;
  created_at?: string;
  updated_at?: string;
}

export type Semester = 'FIRST_SEMESTER' | 'SECOND_SEMESTER' | 'SUMMER';

export interface AcademicTerm {
  id: number;
  academic_year: string;
  semester: Semester;
  start_date: string;
  end_date: string;
  status?: 'ACTIVE' | 'INACTIVE';
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CourseOffering {
  id: number;
  course_id: number;
  academic_term_id: number;
  instructor_id: number;
  section: string;
  schedule: string;
  room: string;
  capacity: number;
  created_at?: string;
  updated_at?: string;
  course?: Course;
  academicTerm?: AcademicTerm;
  instructor?: User;
  _count?: {
    enrollments: number;
  };
  enrolled_count?: number;
}

export type EnrollmentStatus = 'ENROLLED' | 'DROPPED' | 'COMPLETED';

export interface Enrollment {
  id: number;
  student_id: number;
  course_offering_id: number;
  enrollment_date: string;
  status: EnrollmentStatus;
  created_at?: string;
  updated_at?: string;
  student?: Student;
  courseOffering?: CourseOffering;
  grade?: Grade;
}

export type GradeRemarks = 'PASSED' | 'FAILED' | 'INCOMPLETE' | 'DROPPED';

export interface Grade {
  id: number;
  enrollment_id: number;
  midterm_grade?: number | null;
  final_grade?: number | null;
  numerical_grade?: number | null;
  remarks?: GradeRemarks | null;
  encoded_by?: number | null;
  created_at?: string;
  updated_at?: string;
  enrollment?: Enrollment;
}

export interface TermCourseRecord {
  enrollment_id?: number;
  course_code: string;
  course_title: string;
  units: number;
  section: string;
  status?: string;
  schedule?: string;
  room?: string;
  midterm_grade: number | string | null;
  final_grade: number | string | null;
  numerical_grade?: number | string | null;
  remarks: GradeRemarks | string | null;
}

export interface TermRecord {
  academic_term?: {
    id: number;
    academic_year: string;
    semester: Semester;
  };
  academic_term_id?: number;
  academic_year?: string;
  semester?: Semester;
  total_units?: number;
  term_units?: number;
  term_gwa: number | null;
  courses: TermCourseRecord[];
}

export interface AcademicRecordSummary {
  total_enrolled_courses?: number;
  total_credited_units?: number;
  total_units_enrolled?: number;
  total_units_passed?: number;
  cumulative_gpa: number | null;
}

export interface AcademicRecord {
  student: {
    id: number;
    student_number: string;
    full_name: string;
    program: string;
    program_code?: string;
    year_level: number;
    student_type: string;
    status?: string;
  };
  summary: AcademicRecordSummary;
  terms: TermRecord[];
}
