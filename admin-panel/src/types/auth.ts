export interface User {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE';
}

export interface LoginResponse {
  token: string;
  user: User;
}
