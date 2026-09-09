import api from '../utils/api';
import {
  Asset,
  AssetRequestItem,
  AssetRequestCreatePayload,
} from '../types/asset';

export const assetService = {
  // Employee personal allocated assets
  getMyAssets: async (): Promise<Asset[]> => {
    const response = await api.get<Asset[]>('/assets/my');
    return response.data;
  },

  // Employee personal requests
  getMyRequests: async (): Promise<AssetRequestItem[]> => {
    const response = await api.get<AssetRequestItem[]>('/assets/requests/my');
    return response.data;
  },

  // Submit new request / report issue
  createRequest: async (payload: AssetRequestCreatePayload): Promise<AssetRequestItem> => {
    const response = await api.post<AssetRequestItem>('/assets/requests', payload);
    return response.data;
  },
};
