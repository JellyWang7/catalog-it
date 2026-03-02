import api from './api';

const listsService = {
  /** GET /api/v1/lists — all public lists (or user's lists when authenticated) */
  getAll: (params = {}) => api.get('/lists', { params }),

  /** GET /api/v1/lists/:id — single list with items */
  getById: (id) => api.get(`/lists/${id}`),

  /** POST /api/v1/lists — create a new list (requires auth) */
  create: (data) => api.post('/lists', { list: data }),

  /** PATCH /api/v1/lists/:id — update list (requires ownership) */
  update: (id, data) => api.patch(`/lists/${id}`, { list: data }),

  /** DELETE /api/v1/lists/:id — delete list (requires ownership) */
  delete: (id) => api.delete(`/lists/${id}`),

  /** GET /api/v1/lists/analytics — engagement analytics for owner's dashboard */
  getAnalytics: () => api.get('/lists/analytics'),

  /** POST /api/v1/lists/:id/share — generate share code */
  share: (id) => api.post(`/lists/${id}/share`),

  /** GET /api/v1/lists/shared/:shareCode — look up list by share code */
  getByShareCode: (shareCode) => api.get(`/lists/shared/${shareCode}`),

  /** GET /api/v1/lists/:listId/comments — list comments */
  getComments: (listId) => api.get(`/lists/${listId}/comments`),

  /** POST /api/v1/lists/:listId/comments — add comment */
  addComment: (listId, body) => api.post(`/lists/${listId}/comments`, { comment: { body } }),

  /** DELETE /api/v1/comments/:id — delete comment */
  deleteComment: (commentId) => api.delete(`/comments/${commentId}`),

  /** POST /api/v1/lists/:id/like — like list */
  like: (id) => api.post(`/lists/${id}/like`),

  /** DELETE /api/v1/lists/:id/like — unlike list */
  unlike: (id) => api.delete(`/lists/${id}/like`),
};

export default listsService;
