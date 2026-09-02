export interface User {
  id: number;
  name: string;
  email: string;
  employeeCode?: string;
  department?: string;
  profileData?: string;
  role: 'ADMIN' | 'EMPLOYEE';
}

export interface LoginResponse {
  token: string;
  user: User;
}
