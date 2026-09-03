import api from '../utils/api';

export interface DatabaseStats {
  totalEmployees: number;
  totalAttendances: number;
  totalLeaves: number;
  totalPermissions: number;
  totalLocations: number;
}

export interface ResetResponse {
  success: boolean;
  message: string;
  deletedCount?: number;
}

export const databaseService = {
  getStats: async (): Promise<DatabaseStats> => {
    const response = await api.get<DatabaseStats>('/admin/database/stats');
    return response.data;
  },

  executeReset: async (resetType: string, confirmationCode: string): Promise<ResetResponse> => {
    const response = await api.post<ResetResponse>('/admin/database/reset', {
      resetType,
      confirmationCode,
    });
    return response.data;
  },
};
