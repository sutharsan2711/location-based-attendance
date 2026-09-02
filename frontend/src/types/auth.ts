export interface User {
  id: number;
  name: string;
  email: string;
  employeeCode?: string;
  department?: string;
  profileData?: string;
  role: 'ADMIN' | 'EMPLOYEE' | 'TRAINEE' | 'INTERN' | string;
}

export interface LoginResponse {
  token: string;
  user: User;
}
