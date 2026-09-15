import apiClient from './client';
import type { ApiResponse } from '@/types/api.types';
import type { Student, CreateStudentDto, UpdateStudentDto, StudentQueryParams } from '@/types/student.types';
import type { Grade, AcademicRecord } from '@/types/academic.types';

export const studentsApi = {
  getAll: async (params?: StudentQueryParams): Promise<ApiResponse<Student[]>> => {
    const res = await apiClient.get<ApiResponse<Student[]>>('/students', { params });
    return res.data;
  },

  getById: async (id: number): Promise<ApiResponse<Student>> => {
    const res = await apiClient.get<ApiResponse<Student>>(`/students/${id}`);
    return res.data;
  },

  create: async (payload: CreateStudentDto): Promise<ApiResponse<Student>> => {
    const res = await apiClient.post<ApiResponse<Student>>('/students', payload);
    return res.data;
  },

  update: async (id: number, payload: UpdateStudentDto): Promise<ApiResponse<Student>> => {
    const res = await apiClient.patch<ApiResponse<Student>>(`/students/${id}`, payload);
    return res.data;
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    const res = await apiClient.delete<ApiResponse<null>>(`/students/${id}`);
    return res.data;
  },

  getGrades: async (studentId: number): Promise<ApiResponse<Grade[]>> => {
    const res = await apiClient.get<ApiResponse<Grade[]>>(`/students/${studentId}/grades`);
    return res.data;
  },

  getAcademicRecord: async (studentId: number): Promise<ApiResponse<AcademicRecord>> => {
    const res = await apiClient.get<ApiResponse<AcademicRecord>>(`/students/${studentId}/academic-record`);
    return res.data;
  },
};

export default studentsApi;
