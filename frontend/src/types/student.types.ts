export type StudentType = 'REGULAR' | 'IRREGULAR';
export type StudentStatus = 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'SUSPENDED';

export interface Student {
  id: number;
  student_number: string;
  user_id?: number | null;
  first_name: string;
  last_name: string;
  middle_name?: string | null;
  birth_date: string;
  gender?: string | null;
  email: string;
  phone?: string | null;
  address?: string | null;
  program_id: number;
  year_level: number;
  student_type: StudentType;
  max_allowed_units: number;
  status: StudentStatus;
  created_at?: string;
  updated_at?: string;
  program?: {
    id: number;
    code: string;
    name: string;
  };
}

export interface CreateStudentDto {
  student_number: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  birth_date: string;
  gender?: string;
  email: string;
  phone?: string;
  address?: string;
  program_id: number;
  year_level?: number;
  student_type?: StudentType;
  max_allowed_units?: number;
}

export interface UpdateStudentDto extends Partial<CreateStudentDto> {
  status?: StudentStatus;
}

export interface StudentQueryParams {
  search?: string;
  program_id?: number | string;
  year_level?: number | string;
  student_type?: StudentType | '';
  status?: StudentStatus | '';
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}
