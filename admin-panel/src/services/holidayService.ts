import api from '../utils/api';

export interface Holiday {
  id: number;
  name: string;
  holidayDate: string; // 'YYYY-MM-DD'
  formattedDate?: string;
  dayOfWeek?: string;
  holidayType: string;
  description?: string;
  isOptional: boolean;
}

export interface HolidayPayload {
  name: string;
  holidayDate: string;
  holidayType: string;
  description?: string;
  isOptional?: boolean;
}

export const holidayService = {
  getHolidays: async (year?: number): Promise<Holiday[]> => {
    const params: Record<string, any> = {};
    if (year) params.year = year;
    const response = await api.get<Holiday[]>('/holidays', { params });
    return response.data;
  },

  getUpcomingHolidays: async (): Promise<Holiday[]> => {
    const response = await api.get<Holiday[]>('/holidays/upcoming');
    return response.data;
  },

  createHoliday: async (data: HolidayPayload): Promise<{ success: boolean; message: string; holiday: Holiday }> => {
    const response = await api.post('/holidays', data);
    return response.data;
  },

  updateHoliday: async (id: number, data: HolidayPayload): Promise<{ success: boolean; message: string; holiday: Holiday }> => {
    const response = await api.put(`/holidays/${id}`, data);
    return response.data;
  },

  deleteHoliday: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/holidays/${id}`);
    return response.data;
  },
};
