import apiClient from './client';
import type { ApiResponse } from '@/types/api.types';
import type { ManagedUser, ManagedUserStatus } from '@/types/admin.types';
import type { Role } from '@/types/auth.types';

export interface ManagedUserQueryParams {
  search?: string;
  role?: Role | '';
  status?: ManagedUserStatus | '';
  page?: number;
  per_page?: number;
}

export const usersApi = {
  getAll: async (params?: ManagedUserQueryParams): Promise<ApiResponse<ManagedUser[]>> => {
    const res = await apiClient.get<ApiResponse<ManagedUser[]>>('/users', { params });
    return res.data;
  },

  getInstructors: async (): Promise<
    ApiResponse<{ id: number; name: string; email: string }[]>
  > => {
    const res = await apiClient.get<
      ApiResponse<{ id: number; name: string; email: string }[]>
    >('/users/instructors');
    return res.data;
  },

  create: async (payload: {
    name: string;
    email: string;
    password: string;
    role: Role;
    status?: ManagedUserStatus;
    student_id?: number;
  }): Promise<ApiResponse<ManagedUser>> => {
    const res = await apiClient.post<ApiResponse<ManagedUser>>('/users', payload);
    return res.data;
  },

  update: async (
    id: number,
    payload: {
      name?: string;
      email?: string;
      password?: string;
      role?: Role;
      status?: ManagedUserStatus;
      student_id?: number | null;
    },
  ): Promise<ApiResponse<ManagedUser>> => {
    const res = await apiClient.patch<ApiResponse<ManagedUser>>(`/users/${id}`, payload);
    return res.data;
  },

  remove: async (id: number): Promise<ApiResponse<null>> => {
    const res = await apiClient.delete<ApiResponse<null>>(`/users/${id}`);
    return res.data;
  },
};

export default usersApi;
