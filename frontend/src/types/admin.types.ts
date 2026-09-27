import type { Role } from './auth.types';

export type ManagedUserStatus = 'ACTIVE' | 'INACTIVE';

export interface ManagedUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  status: ManagedUserStatus;
  created_at?: string;
  updated_at?: string;
  student?: {
    id: number;
    student_number: string;
    first_name: string;
    last_name: string;
  } | null;
}

export interface AuditLogEntry {
  id: number;
  actor_id: number | null;
  actor_email: string | null;
  actor_role: string | null;
  action: string;
  method: string;
  path: string;
  resource: string | null;
  resource_id: string | null;
  status_code: number;
  success: boolean;
  duration_ms: number;
  ip: string | null;
  user_agent: string | null;
  error_message: string | null;
  created_at: string;
}
