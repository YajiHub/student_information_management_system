import apiClient from './client';
import type { ApiResponse } from '@/types/api.types';
import type { Program, Course, AcademicTerm } from '@/types/academic.types';

export const referenceApi = {
  getPrograms: async (): Promise<ApiResponse<Program[]>> => {
    const res = await apiClient.get<ApiResponse<Program[]>>('/programs');
    return res.data;
  },

  createProgram: async (payload: { code: string; name: string; description?: string }): Promise<ApiResponse<Program>> => {
    const res = await apiClient.post<ApiResponse<Program>>('/programs', payload);
    return res.data;
  },

  getCourses: async (params?: { search?: string; page?: number; per_page?: number }): Promise<ApiResponse<Course[]>> => {
    const res = await apiClient.get<ApiResponse<Course[]>>('/courses', { params });
    return res.data;
  },

  createCourse: async (payload: {
    course_code: string;
    course_title: string;
    description?: string;
    units: number;
  }): Promise<ApiResponse<Course>> => {
    const res = await apiClient.post<ApiResponse<Course>>('/courses', payload);
    return res.data;
  },

  getTerms: async (): Promise<ApiResponse<AcademicTerm[]>> => {
    const res = await apiClient.get<ApiResponse<AcademicTerm[]>>('/academic-terms');
    // Backend exposes term state as `status`; normalize to the `is_active`
    // boolean every consumer of this module reads.
    const terms = (res.data.data || []).map((term) => ({
      ...term,
      is_active: term.is_active ?? term.status === 'ACTIVE',
    }));
    return { ...res.data, data: terms };
  },

  createTerm: async (payload: {
    academic_year: string;
    semester: string;
    start_date: string;
    end_date: string;
    status?: 'ACTIVE' | 'INACTIVE';
  }): Promise<ApiResponse<AcademicTerm>> => {
    const res = await apiClient.post<ApiResponse<AcademicTerm>>('/academic-terms', payload);
    return res.data;
  },

  updateTerm: async (
    id: number,
    payload: {
      academic_year?: string;
      semester?: string;
      start_date?: string;
      end_date?: string;
      status?: 'ACTIVE' | 'INACTIVE';
    }
  ): Promise<ApiResponse<AcademicTerm>> => {
    const res = await apiClient.put<ApiResponse<AcademicTerm>>(`/academic-terms/${id}`, payload);
    return res.data;
  },

  deleteTerm: async (id: number): Promise<ApiResponse<null>> => {
    const res = await apiClient.delete<ApiResponse<null>>(`/academic-terms/${id}`);
    return res.data;
  },

  updateProgram: async (
    id: number,
    payload: { code?: string; name?: string; description?: string }
  ): Promise<ApiResponse<Program>> => {
    const res = await apiClient.put<ApiResponse<Program>>(`/programs/${id}`, payload);
    return res.data;
  },

  deleteProgram: async (id: number): Promise<ApiResponse<null>> => {
    const res = await apiClient.delete<ApiResponse<null>>(`/programs/${id}`);
    return res.data;
  },

  updateCourse: async (
    id: number,
    payload: { course_code?: string; course_title?: string; description?: string; units?: number }
  ): Promise<ApiResponse<Course>> => {
    const res = await apiClient.put<ApiResponse<Course>>(`/courses/${id}`, payload);
    return res.data;
  },

  deleteCourse: async (id: number): Promise<ApiResponse<null>> => {
    const res = await apiClient.delete<ApiResponse<null>>(`/courses/${id}`);
    return res.data;
  },
};

export default referenceApi;
