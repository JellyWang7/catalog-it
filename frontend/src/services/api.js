import axios from 'axios';

const defaultTransformRequest = axios.defaults.transformRequest;
const transformRequestChain = Array.isArray(defaultTransformRequest)
  ? [...defaultTransformRequest]
  : [defaultTransformRequest];

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || '';
    const token = localStorage.getItem('token');
    const isAuthMeRequest = requestUrl.includes('/auth/me');
    const isPublicRoute =
      window.location.pathname === '/' ||
      window.location.pathname.startsWith('/explore') ||
      window.location.pathname.startsWith('/lists/') ||
      window.location.pathname.startsWith('/s/');

    if (error.response?.status === 401) {
      // Token expired or invalid — clear stored auth and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Don't force-login from token verification/public browsing flows.
      // For protected pages, keep redirect behavior.
      if (
        token &&
        !isAuthMeRequest &&
        !isPublicRoute &&
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/signup')
      ) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * POST multipart (attachments). The shared instance sets Content-Type: application/json;
 * for FormData, Axios would otherwise JSON-serialize the payload. Clear Content-Type first,
 * then run the default transform chain so the browser sets multipart boundaries.
 */
export function postFormData(url, formData, config = {}) {
  return api.post(url, formData, {
    timeout: 120000,
    ...config,
    transformRequest: [
      (data, headers) => {
        if (typeof FormData !== 'undefined' && data instanceof FormData) {
          headers.delete('Content-Type');
        }
        return data;
      },
      ...transformRequestChain,
    ],
  });
}

export default api;
