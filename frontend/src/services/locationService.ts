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
        latitude: 11.078319,
        longitude: 76.999745,
        allowedRadius: 500,
        maxGpsAccuracy: 100,
        itLoginTime: '09:00',
        itLogoutTime: '18:30',
        edtechLoginTime: '08:45',
        edtechLogoutTime: '17:45',
      };
    }
  },

  getAllLocations: async (): Promise<CompanyLocation[]> => {
    try {
      const response = await api.get<CompanyLocation[]>('/location/all');
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
      const single = await locationService.getLocation();
      return [single];
    } catch {
      const single = await locationService.getLocation();
      return [single];
    }
  },

  updateLocation: async (location: CompanyLocation): Promise<CompanyLocation> => {
    const response = await api.put<CompanyLocation>('/location', location);
    return response.data;
  }
};
