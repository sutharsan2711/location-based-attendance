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

  // IT Team Shift (09:00 - 18:30)
  itLoginTime?: string;
  itLogoutTime?: string;
  itGraceMinutes?: number;

  // EdTech Team Shift (08:45 - 17:45)
  edtechLoginTime?: string;
  edtechLogoutTime?: string;
  edtechGraceMinutes?: number;

  // Business Solution Team Shift (08:45 - 17:45)
  businessLoginTime?: string;
  businessLogoutTime?: string;
  businessGraceMinutes?: number;

  createdAt?: string;
  updatedAt?: string;
}
