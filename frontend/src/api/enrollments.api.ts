import apiClient from './client';
import type { ApiResponse } from '@/types/api.types';
import type { CourseOffering, Enrollment, RosterEntry } from '@/types/academic.types';

export const enrollmentsApi = {
  getOfferings: async (params?: {
    academic_term_id?: number;
    instructor_id?: number;
  }): Promise<ApiResponse<CourseOffering[]>> => {
    const res = await apiClient.get<ApiResponse<CourseOffering[]>>('/course-offerings', { params });
    return res.data;
  },

  createOffering: async (payload: {
    course_id: number;
    academic_term_id: number;
    instructor_id: number;
    section: string;
    schedule: string;
    room: string;
    capacity: number;
  }): Promise<ApiResponse<CourseOffering>> => {
    const res = await apiClient.post<ApiResponse<CourseOffering>>('/course-offerings', payload);
    return res.data;
  },

  getOfferingStudents: async (offeringId: number): Promise<ApiResponse<RosterEntry[]>> => {
    const res = await apiClient.get<ApiResponse<RosterEntry[]>>(
      `/course-offerings/${offeringId}/students`,
    );
    return res.data;
  },

  getEnrollments: async (params?: {
    student_id?: number;
    course_offering_id?: number;
    status?: string;
  }): Promise<ApiResponse<Enrollment[]>> => {
    const res = await apiClient.get<ApiResponse<Enrollment[]>>('/enrollments', { params });
    return res.data;
  },

  enroll: async (payload: {
    student_id: number;
    course_offering_id: number;
  }): Promise<ApiResponse<Enrollment>> => {
    const res = await apiClient.post<ApiResponse<Enrollment>>('/enrollments', payload);
    return res.data;
  },

  drop: async (enrollmentId: number): Promise<ApiResponse<null>> => {
    const res = await apiClient.delete<ApiResponse<null>>(`/enrollments/${enrollmentId}`);
    return res.data;
  },

  updateOffering: async (
    id: number,
    payload: {
      course_id?: number;
      academic_term_id?: number;
      instructor_id?: number;
      section?: string;
      schedule?: string;
      room?: string;
      capacity?: number;
    }
  ): Promise<ApiResponse<CourseOffering>> => {
    const res = await apiClient.put<ApiResponse<CourseOffering>>(`/course-offerings/${id}`, payload);
    return res.data;
  },

  deleteOffering: async (id: number): Promise<ApiResponse<null>> => {
    const res = await apiClient.delete<ApiResponse<null>>(`/course-offerings/${id}`);
    return res.data;
  },
};

export default enrollmentsApi;
