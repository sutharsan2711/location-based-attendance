export interface CompanyLocation {
  id?: number;
  companyName: string;
  latitude: number;
  longitude: number;
  allowedRadius: number;
  maxGpsAccuracy: number;
  officeLoginTime?: string;
  officeLogoutTime?: string;
  gracePeriodMinutes?: number;
  createdAt?: string;
  updatedAt?: string;
}

