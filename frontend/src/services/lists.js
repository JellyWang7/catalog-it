import api from './api';

const listsService = {
  /** GET /api/v1/lists — all public lists (or user's lists when authenticated) */
  getAll: () => api.get('/lists'),

  /** GET /api/v1/lists/:id — single list with items */
  getById: (id) => api.get(`/lists/${id}`),

  /** POST /api/v1/lists — create a new list (requires auth) */
  create: (data) => api.post('/lists', { list: data }),

  /** PATCH /api/v1/lists/:id — update list (requires ownership) */
  update: (id, data) => api.patch(`/lists/${id}`, { list: data }),

  /** DELETE /api/v1/lists/:id — delete list (requires ownership) */
  delete: (id) => api.delete(`/lists/${id}`),

  /** POST /api/v1/lists/:id/share — generate share code */
  share: (id) => api.post(`/lists/${id}/share`),

  /** GET /api/v1/lists/shared/:shareCode — look up list by share code */
  getByShareCode: (shareCode) => api.get(`/lists/shared/${shareCode}`),
};

export default listsService;
