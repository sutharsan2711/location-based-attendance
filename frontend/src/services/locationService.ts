import api from '../utils/api';
import { CompanyLocation } from '../types/location';

export const locationService = {
  getLocation: async (): Promise<CompanyLocation> => {
    try {
      const response = await api.get<CompanyLocation>('/location');
      return response.data;
    } catch (e) {
      return {
        id: 1,
        companyName: 'Main Office',
        latitude: 11.0168,
        longitude: 76.9558,
        allowedRadius: 500,
        maxGpsAccuracy: 100,
        itLoginTime: '09:00',
        itLogoutTime: '18:30',
        edtechLoginTime: '08:45',
        edtechLogoutTime: '17:45',
      };
    }
  },

  updateLocation: async (location: CompanyLocation): Promise<CompanyLocation> => {
    const response = await api.put<CompanyLocation>('/location', location);
    return response.data;
  }
};
