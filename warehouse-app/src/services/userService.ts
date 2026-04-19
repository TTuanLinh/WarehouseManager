import * as SecureStore from 'expo-secure-store';

import { invalidateStoredSession } from '@/src/authInvalidation';

import type { UserBrief } from '../types/models';
import api, { getApiBaseUrl } from './api';

const SESSION_KEY = 'wm_session';

export type UserProfile = {
  username: string;
  hasBankQr: boolean;
};

export const getMyProfile = () => api.get<UserProfile>('/users/me');

async function readBearerToken(): Promise<string | null> {
  try {
    const raw = await SecureStore.getItemAsync(SESSION_KEY);
    if (!raw) return null;
    const { token } = JSON.parse(raw) as { token?: string };
    return token && typeof token === 'string' ? token : null;
  } catch {
    return null;
  }
}

/**
 * Upload ảnh QR ngân hàng — dùng `fetch` thay vì axios vì trên React Native axios + FormData
 * thường gây lỗi mạng (ERR_NETWORK) dù server không nhận được request.
 */
export async function uploadBankQrImage(formData: FormData): Promise<{ data: UserProfile }> {
  const base = getApiBaseUrl().replace(/\/$/, '');
  const url = `${base}/users/me/bank-qr`;
  const token = await readBearerToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });
  const text = await res.text();
  if (res.status === 401) {
    invalidateStoredSession();
  }
  if (!res.ok) {
    let detail = text;
    try {
      const j = JSON.parse(text) as { message?: string; detail?: string };
      if (typeof j.detail === 'string' && j.detail.trim()) detail = j.detail.trim();
      else if (typeof j.message === 'string' && j.message.trim()) detail = j.message.trim();
    } catch {
      /* plain text body */
    }
    throw new Error(detail || `Lỗi máy chủ (${res.status})`);
  }
  let data: UserProfile;
  try {
    data = JSON.parse(text) as UserProfile;
  } catch {
    throw new Error('Phản hồi từ máy chủ không phải JSON hợp lệ.');
  }
  return { data };
}

export const searchUsers = (query: string) =>
  api.get<UserBrief[]>('/users/search', { params: { query } });
