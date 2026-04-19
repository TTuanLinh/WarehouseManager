import axios, { isAxiosError } from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import { invalidateStoredSession } from '@/src/authInvalidation';

const SESSION_KEY = 'wm_session';

/** Human-readable message from axios errors (Spring body, network, HTTP status) hoặc lỗi `fetch` / `Error`. */
export function getAxiosErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      return 'Không kết nối được máy chủ. Bật API (port 8080), cùng Wi‑Fi với điện thoại, hoặc đặt EXPO_PUBLIC_API_BASE_URL (vd: http://IP_MÁY_TÍNH:8080/api).';
    }
    const status = error.response?.status;
    const data = error.response?.data;
    if (typeof data === 'string' && data.trim()) return data.trim();
    if (data && typeof data === 'object') {
      const o = data as Record<string, unknown>;
      if (typeof o.message === 'string' && o.message.trim()) return o.message.trim();
      if (typeof o.detail === 'string' && o.detail.trim()) return o.detail.trim();
    }
    if (status === 403) {
      return 'Không có quyền thao tác kho này (403). Tài khoản phải được gán kho trong bảng user_warehouse (cùng user id và warehouse id).';
    }
    if (status === 401) {
      return 'Phiên đăng nhập không hợp lệ. Đăng nhập lại.';
    }
    if (status === 404) {
      const tried = `${error.config?.baseURL ?? ''}${error.config?.url ?? ''}`;
      const hint = tried ? ` (đã gọi: ${tried})` : '';
      return `Không tìm thấy API (404)${hint}. Base URL phải kết thúc bằng /api (vd: http://IP:8080/api). Khởi động lại backend sau khi thêm endpoint.`;
    }
    if (error.message?.trim()) {
      return error.message.trim();
    }
  }
  if (error instanceof Error) {
    const m = error.message;
    if (m === 'Network request failed' || m.includes('Failed to fetch') || m.includes('Load failed')) {
      return 'Không kết nối được máy chủ. Bật API (port 8080), cùng Wi‑Fi với điện thoại, hoặc đặt EXPO_PUBLIC_API_BASE_URL (vd: http://IP_MÁY_TÍNH:8080/api).';
    }
    if (m.trim()) {
      return m.trim();
    }
  }
  return fallback;
}

/**
 * Spring Boot defaults to port 8080. URLs like http://192.168.x.x/api use port 80 in the URL parser — rewrite to 8080 for local dev.
 */
export function normalizeApiBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/$/, '');
  if (!trimmed) return trimmed;
  try {
    const withProto = trimmed.includes('://') ? trimmed : `http://${trimmed}`;
    const u = new URL(withProto);
    const usesDefaultHttpPort = u.protocol === 'http:' && (!u.port || u.port === '80');
    if (usesDefaultHttpPort && u.pathname.includes('api')) {
      u.port = '8080';
      return ensureSpringApiSuffix(u.toString().replace(/\/$/, ''));
    }
    return ensureSpringApiSuffix(trimmed);
  } catch {
    return ensureSpringApiSuffix(trimmed);
  }
}

/** Controllers use /api/... — if env is only host:port, append /api (avoids 404 on /inventory/...). */
function ensureSpringApiSuffix(urlString: string): string {
  try {
    const withProto = urlString.includes('://') ? urlString : `http://${urlString}`;
    const u = new URL(withProto);
    const path = (u.pathname || '/').replace(/\/$/, '') || '/';
    if (path === '/') {
      u.pathname = '/api';
    }
    return u.toString().replace(/\/$/, '');
  } catch {
    return urlString;
  }
}

function inferLanFromExpoHost(): string | null {
  const debuggerHost =
    (Constants.expoConfig as { hostUri?: string } | null)?.hostUri ??
    (Constants as { manifest2?: { extra?: { expoClient?: { hostUri?: string } } } }).manifest2?.extra
      ?.expoClient?.hostUri ??
    (Constants as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost;

  if (!debuggerHost || typeof debuggerHost !== 'string') return null;
  const host = debuggerHost.split(':')[0];
  if (!host || host === '127.0.0.1' || host === 'localhost') return null;
  return host;
}

/**
 * Resolved base URL for API calls (env, then Expo LAN host + :8080, then emulator / localhost).
 */
export function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (fromEnv) {
    return normalizeApiBaseUrl(fromEnv);
  }

  const lan = inferLanFromExpoHost();
  if (lan) {
    return `http://${lan}:8080/api`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8080/api';
  }

  return 'http://localhost:8080/api';
}

const api = axios.create({ baseURL: getApiBaseUrl() });

api.interceptors.request.use(async (config) => {
  config.baseURL = getApiBaseUrl();
  const path = String(config.url ?? '');
  if (path.includes('/auth/login') || path.includes('/auth/register')) {
    delete config.headers.Authorization;
  } else {
    try {
      const raw = await SecureStore.getItemAsync(SESSION_KEY);
      if (raw) {
        const { token } = JSON.parse(raw) as { token?: string };
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch {
      /* ignore */
    }
  }
  // React Native + axios: không được gửi Content-Type: application/json kèm FormData (thiếu boundary) → lỗi giống "mất kết nối".
  if (typeof FormData !== 'undefined' && config.data instanceof FormData && config.headers) {
    const h = config.headers as Record<string, unknown> & { delete?: (name: string) => void };
    if (typeof h.delete === 'function') {
      h.delete('Content-Type');
      h.delete('content-type');
    } else {
      delete h['Content-Type'];
      delete h['content-type'];
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    const url = String(error?.config?.url ?? '');
    const hadAuth = Boolean(error?.config?.headers?.Authorization);
    const isLoginOrRegister = url.includes('/auth/login') || url.includes('/auth/register');
    if (status === 401 && hadAuth && !isLoginOrRegister) {
      invalidateStoredSession();
    }
    return Promise.reject(error);
  }
);

export default api;
