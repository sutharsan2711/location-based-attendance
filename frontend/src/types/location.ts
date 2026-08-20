export interface CompanyLocation {
  id?: number;
  companyName: string;
  latitude: number;
  longitude: number;
  allowedRadius: number;
  maxGpsAccuracy: number;
  createdAt?: string;
  updatedAt?: string;
}
