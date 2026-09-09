import { Employee } from './employee';

export type AssetCategory =
  | 'LAPTOP'
  | 'MONITOR'
  | 'ACCESS_CARD'
  | 'PERIPHERAL'
  | 'MOBILE'
  | 'FURNITURE'
  | 'OTHER';

export type AssetStatus =
  | 'AVAILABLE'
  | 'ASSIGNED'
  | 'UNDER_MAINTENANCE'
  | 'RETIRED'
  | 'DAMAGED';

export type AssetCondition = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'DAMAGED';

export type AssetRequestType =
  | 'NEW_ASSET'
  | 'REPAIR_REPLACEMENT'
  | 'RETURN_ASSET'
  | 'HARDWARE_ISSUE';

export type AssetRequestPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type AssetRequestStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CANCELLED';

export interface Asset {
  id: number;
  assetCode: string;
  name: string;
  category: AssetCategory;
  model?: string | null;
  serialNumber?: string | null;
  status: AssetStatus;
  condition: AssetCondition;
  purchaseDate?: string | null;
  purchaseCost?: number | null;
  assignedToEmployeeId?: number | null;
  assignedDate?: string | null;
  handoverNotes?: string | null;
  notes?: string | null;
  assignedEmployee?: Employee | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AssetCreatePayload {
  assetCode?: string;
  name: string;
  category: AssetCategory;
  model?: string;
  serialNumber?: string;
  condition?: AssetCondition;
  purchaseDate?: string;
  purchaseCost?: number;
  notes?: string;
}

export interface AssetAssignPayload {
  employeeId: number;
  assignedDate?: string;
  handoverNotes?: string;
}

export interface AssetReturnPayload {
  condition?: AssetCondition;
  notes?: string;
}

export interface AssetRequestItem {
  id: number;
  employeeId: number;
  assetId?: number | null;
  requestType: AssetRequestType;
  category: AssetCategory;
  title: string;
  description: string;
  priority: AssetRequestPriority;
  status: AssetRequestStatus;
  adminRemarks?: string | null;
  employee?: Employee | null;
  asset?: Asset | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AssetRequestCreatePayload {
  title: string;
  description: string;
  category: AssetCategory;
  requestType?: AssetRequestType;
  priority?: AssetRequestPriority;
  assetId?: number;
}
