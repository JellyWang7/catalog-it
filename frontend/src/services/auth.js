import api from './api';

const authService = {
  /**
   * POST /api/v1/auth/signup
   * @param {{ username: string, email: string, password: string, password_confirmation: string }} data
   */
  signup: (data) => api.post('/auth/signup', { user: data }),

  /**
   * POST /api/v1/auth/login
   * @param {{ email: string, password: string }} data
   */
  login: (data) => api.post('/auth/login', { user: data }),

  /**
   * GET /api/v1/auth/me
   * Requires Authorization header (handled by interceptor)
   */
  me: () => api.get('/auth/me'),

  /**
   * POST /api/v1/auth/forgot_password
   * @param {{ email: string }} data
   */
  forgotPassword: (data) => api.post('/auth/forgot_password', data),

  /**
   * POST /api/v1/auth/reset_password
   * @param {{ token: string, password: string, password_confirmation: string }} data
   */
  resetPassword: (data) => api.post('/auth/reset_password', data),
};

export default authService;
