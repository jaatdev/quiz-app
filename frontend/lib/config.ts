/**
 * API Configuration
 * Centralized API URL management for all environments
 */

export const API_URL = 
  process.env.NEXT_PUBLIC_API_URL || 
  'http://localhost:5000/api';

export const BACKEND_URL = API_URL.replace(/\/api\/?$/, '');

export const config = {
  apiUrl: API_URL,
  backendUrl: BACKEND_URL,
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
} as const;

const ABSOLUTE_URL_REGEX = /^https?:\/\//i;

export const resolveBackendUrl = (path: string | null | undefined): string | null => {
  if (!path) {
    return null;
  }

  if (ABSOLUTE_URL_REGEX.test(path)) {
    return path;
  }

  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${BACKEND_URL}${normalized}`;
};
