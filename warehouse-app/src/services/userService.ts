import type { UserBrief } from '../types/models';
import api from './api';

export const searchUsers = (query: string) =>
  api.get<UserBrief[]>('/users/search', { params: { query } });
