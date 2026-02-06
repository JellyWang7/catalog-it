import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Lists API
export const listsAPI = {
  getAll: () => api.get('/lists'),
  getById: (id) => api.get(`/lists/${id}`),
  create: (data) => api.post('/lists', { list: data }),
  update: (id, data) => api.patch(`/lists/${id}`, { list: data }),
  delete: (id) => api.delete(`/lists/${id}`)
};

// Items API
export const itemsAPI = {
  getByListId: (listId) => api.get(`/lists/${listId}/items`),
  getById: (id) => api.get(`/items/${id}`),
  create: (listId, data) => api.post(`/lists/${listId}/items`, { item: data }),
  update: (id, data) => api.patch(`/items/${id}`, { item: data }),
  delete: (id) => api.delete(`/items/${id}`)
};

export default api;
