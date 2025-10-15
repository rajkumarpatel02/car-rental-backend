export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  role?: 'user' | 'admin';
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponseDto {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  token: string;
}