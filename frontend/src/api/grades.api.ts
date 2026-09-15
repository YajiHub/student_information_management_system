import apiClient from './client';
import type { ApiResponse } from '@/types/api.types';
import type { Grade } from '@/types/academic.types';

export const gradesApi = {
  getGrades: async (params?: {
    enrollment_id?: number;
    student_id?: number;
  }): Promise<ApiResponse<Grade[]>> => {
    const res = await apiClient.get<ApiResponse<Grade[]>>('/grades', { params });
    return res.data;
  },
  encodeGrade: async (payload: {
    enrollment_id: number;
    midterm_grade?: number;
    final_grade?: number;
  }): Promise<ApiResponse<Grade>> => {
    const res = await apiClient.post<ApiResponse<Grade>>('/grades', payload);
    return res.data;
  },

  updateGrade: async (
    gradeId: number,
    payload: {
      midterm_grade?: number;
      final_grade?: number;
      remarks?: string;
    },
  ): Promise<ApiResponse<Grade>> => {
    const res = await apiClient.put<ApiResponse<Grade>>(`/grades/${gradeId}`, payload);
    return res.data;
  },
};

export default gradesApi;
