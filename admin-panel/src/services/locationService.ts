import api from '../utils/api';
import { CompanyLocation } from '../types/location';

export const locationService = {
  getLocation: async (): Promise<CompanyLocation> => {
    const response = await api.get<CompanyLocation>('/location');
    return response.data;
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

  getLocationById: async (id: number): Promise<CompanyLocation> => {
    const response = await api.get<CompanyLocation>(`/location/${id}`);
    return response.data;
  },

  createLocation: async (location: CompanyLocation): Promise<CompanyLocation> => {
    const response = await api.post<CompanyLocation>('/location', location);
    return response.data;
  },

  updateLocation: async (location: CompanyLocation): Promise<CompanyLocation> => {
    if (location.id) {
      const response = await api.put<CompanyLocation>(`/location/${location.id}`, location);
      return response.data;
    }
    const response = await api.put<CompanyLocation>('/location', location);
    return response.data;
  },

  updateLocationById: async (id: number, location: CompanyLocation): Promise<CompanyLocation> => {
    const response = await api.put<CompanyLocation>(`/location/${id}`, location);
    return response.data;
  },

  deleteLocation: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete<{ success: boolean; message: string }>(`/location/${id}`);
    return response.data;
  }
};
