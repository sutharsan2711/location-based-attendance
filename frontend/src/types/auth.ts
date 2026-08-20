export interface User {
  id: number;
  name: String;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE';
}

export interface LoginResponse {
  token: string;
  user: User;
}
