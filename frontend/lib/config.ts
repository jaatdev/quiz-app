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
