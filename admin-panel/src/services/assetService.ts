import api from '../utils/api';
import {
  Asset,
  AssetCreatePayload,
  AssetAssignPayload,
  AssetReturnPayload,
  AssetRequestItem,
} from '../types/asset';

export const assetService = {
  // Asset Inventory APIs
  getAllAssets: async (filters?: {
    category?: string;
    status?: string;
    search?: string;
    assignedTo?: number;
  }): Promise<Asset[]> => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.assignedTo) params.append('assignedTo', String(filters.assignedTo));

    const response = await api.get<Asset[]>('/assets', { params });
    return response.data;
  },

  getAssetById: async (id: number): Promise<Asset> => {
    const response = await api.get<Asset>(`/assets/${id}`);
    return response.data;
  },

  createAsset: async (payload: AssetCreatePayload): Promise<Asset> => {
    const response = await api.post<Asset>('/assets', payload);
    return response.data;
  },

  updateAsset: async (id: number, payload: Partial<AssetCreatePayload & { status: string; condition: string }>): Promise<Asset> => {
    const response = await api.put<Asset>(`/assets/${id}`, payload);
    return response.data;
  },

  deleteAsset: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete<{ success: boolean; message: string }>(`/assets/${id}`);
    return response.data;
  },

  assignAsset: async (id: number, payload: AssetAssignPayload): Promise<{ success: boolean; message: string; asset: Asset }> => {
    const response = await api.post<{ success: boolean; message: string; asset: Asset }>(`/assets/${id}/assign`, payload);
    return response.data;
  },

  returnAsset: async (id: number, payload: AssetReturnPayload): Promise<{ success: boolean; message: string; asset: Asset }> => {
    const response = await api.post<{ success: boolean; message: string; asset: Asset }>(`/assets/${id}/return`, payload);
    return response.data;
  },

  // Asset Requests APIs (Admin)
  getAllRequests: async (filters?: {
    status?: string;
    category?: string;
    priority?: string;
  }): Promise<AssetRequestItem[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.priority) params.append('priority', filters.priority);

    const response = await api.get<AssetRequestItem[]>('/assets/requests', { params });
    return response.data;
  },

  updateRequestStatus: async (
    id: number,
    status: string,
    adminRemarks?: string
  ): Promise<AssetRequestItem> => {
    const response = await api.patch<AssetRequestItem>(`/assets/requests/${id}/status`, {
      status,
      adminRemarks,
    });
    return response.data;
  },

  // Asset Categories
  getCategories: async (): Promise<{ id: number; name: string; description: string | null; icon: string | null }[]> => {
    const response = await api.get('/assets/categories');
    return response.data;
  },

  createCategory: async (name: string, description?: string, icon?: string): Promise<any> => {
    const response = await api.post('/assets/categories', { name, description, icon });
    return response.data;
  },

  deleteCategory: async (idOrName: number | string): Promise<any> => {
    const params: any = typeof idOrName === 'number' ? { id: idOrName } : { name: idOrName };
    const response = await api.delete('/assets/categories', { params });
    return response.data;
  },
};
