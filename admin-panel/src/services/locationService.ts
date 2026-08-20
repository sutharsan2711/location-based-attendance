import api from '../utils/api';
import { CompanyLocation } from '../types/location';

export const locationService = {
  getLocation: async (): Promise<CompanyLocation> => {
    const response = await api.get<CompanyLocation>('/location');
    return response.data;
  },

  updateLocation: async (location: CompanyLocation): Promise<CompanyLocation> => {
    const response = await api.put<CompanyLocation>('/location', location);
    return response.data;
  }
};
