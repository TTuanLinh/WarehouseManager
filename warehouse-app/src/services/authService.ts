import type { AuthResponse } from '../types/models';
import api from './api';

export const login = (username: string, password: string) =>
  api.post<AuthResponse>('/auth/login', { username, password });

export type RegisterPayload = {
  username: string;
  email: string;
  password: string;
};

export const register = (body: RegisterPayload) =>
  api.post<AuthResponse>('/auth/register', body);
