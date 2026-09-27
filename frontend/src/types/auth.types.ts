export type Role = 'ADMIN' | 'REGISTRAR' | 'INSTRUCTOR' | 'STUDENT';

export interface StudentProfile {
  id: number;
  student_number: string;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  suffix?: string | null;
  birth_date?: string;
  email: string;
  contact_number?: string | null;
  address?: string | null;
  program_id: number;
  year_level: number;
  student_type: 'REGULAR' | 'IRREGULAR';
  max_allowed_units: number;
  status: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'DROPPED';
  program?: {
    id: number;
    code: string;
    name: string;
  };
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
  status: 'ACTIVE' | 'INACTIVE';
  student?: StudentProfile | null;
  created_at?: string;
  updated_at?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponseData {
  user: User;
  access_token: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
