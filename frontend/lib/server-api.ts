import axios from 'axios';
import { auth } from '@clerk/nextjs/server';

const BACKEND_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

const serverApi = axios.create({
  baseURL: BACKEND_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// Interceptor to add Clerk token when available (server-side only)
serverApi.interceptors.request.use(async (config) => {
  try {
    // auth() provides server-side helper; getToken is available in the returned object
    const authObj = await auth();
    const token = typeof authObj?.getToken === 'function' ? await authObj.getToken() : undefined;
    if (token) {
      // cast to any to avoid AxiosHeaders typing friction
      (config.headers as any) = {
        ...(config.headers || {}),
        Authorization: `Bearer ${token}`,
      };
    }
  } catch (e) {
    // swallow — auth may not be present in some contexts
  }
  return config;
}, (err) => Promise.reject(err));

async function safeGet<T = any>(path: string, opts?: { params?: Record<string, any> }): Promise<T | null> {
  try {
    const resp = await serverApi.get(path, { params: opts?.params });
    return resp.data;
  } catch (err: any) {
    console.error('serverApi GET error', path, err?.response?.data || err.message);
    return null;
  }
}

async function safePost<T = any>(path: string, body?: any): Promise<T | null> {
  try {
    const resp = await serverApi.post(path, body);
    return resp.data;
  } catch (err: any) {
    console.error('serverApi POST error', path, err?.response?.data || err.message);
    return null;
  }
}

export { serverApi, safeGet, safePost };

export default serverApi;
