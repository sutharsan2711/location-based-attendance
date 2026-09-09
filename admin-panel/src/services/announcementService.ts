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

export interface CreateAnnouncementPayload {
  title: string;
  content: string;
  category?: string;
  priority?: string;
  targetAudience?: string;
  targetDepartment?: string | null;
  targetRole?: string | null;
  isPinned?: boolean;
  isActive?: boolean;
  authorName?: string;
  expiresAt?: string | null;
}

export type AnnouncementCreatePayload = CreateAnnouncementPayload;

export const announcementService = {
  getAll: async (category?: string, activeOnly?: boolean): Promise<Announcement[]> => {
    const params: any = {};
    if (category) params.category = category;
    if (activeOnly) params.activeOnly = 'true';
    const response = await api.get('/announcements', { params });
    return response.data;
  },

  getActive: async (): Promise<Announcement[]> => {
    const response = await api.get('/announcements/active');
    return response.data;
  },

  getById: async (id: number): Promise<Announcement> => {
    const response = await api.get(`/announcements/${id}`);
    return response.data;
  },

  create: async (data: CreateAnnouncementPayload): Promise<Announcement> => {
    const response = await api.post('/announcements', data);
    return response.data;
  },

  update: async (id: number, data: Partial<CreateAnnouncementPayload>): Promise<Announcement> => {
    const response = await api.put(`/announcements/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/announcements/${id}`);
    return response.data;
  },
};
