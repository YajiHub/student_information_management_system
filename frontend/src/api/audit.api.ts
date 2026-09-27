import apiClient from './client';
import type { ApiResponse } from '@/types/api.types';
import type { AuditLogEntry } from '@/types/admin.types';

export interface AuditLogQueryParams {
  search?: string;
  action?: string;
  resource?: string;
  success?: '' | 'true' | 'false';
  from?: string;
  to?: string;
  page?: number;
  per_page?: number;
}

export const auditApi = {
  getLogs: async (params?: AuditLogQueryParams): Promise<ApiResponse<AuditLogEntry[]>> => {
    const res = await apiClient.get<ApiResponse<AuditLogEntry[]>>('/audit-logs', { params });
    return res.data;
  },
};

export default auditApi;
