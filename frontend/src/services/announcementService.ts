import api from '../utils/api';

export interface Announcement {
  id: number;
  title: string;
  content: string;
  category: string;
  priority: string;
  targetAudience?: string;
  targetDepartment: string | null;
  targetRole: string | null;
  isPinned: boolean;
  isActive: boolean;
  authorName?: string;
  author?: {
    name: string;
  };
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const announcementService = {
  getActive: async (): Promise<Announcement[]> => {
    const response = await api.get<Announcement[]>('/announcements/active');
    return response.data;
  },

  getAll: async (category?: string): Promise<Announcement[]> => {
    const params: any = {};
    if (category) params.category = category;
    const response = await api.get<Announcement[]>('/announcements', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Announcement> => {
    const response = await api.get<Announcement>(`/announcements/${id}`);
    return response.data;
  },
};
