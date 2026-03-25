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

  /** GET /api/v1/lists/:listId/attachments — list attachments */
  getAttachments: (listId) => api.get(`/lists/${listId}/attachments`),

  /** POST /api/v1/lists/:listId/attachments — create attachment (link/file/image) */
  createAttachment: (listId, data) => {
    const formData = new FormData();
    formData.append('attachment[kind]', data.kind);
    if (data.title != null && String(data.title).trim() !== '') {
      formData.append('attachment[title]', data.title);
    }
    if (data.body != null && String(data.body).trim() !== '') {
      formData.append('attachment[body]', data.body);
    }
    if (data.url) formData.append('attachment[url]', data.url);
    if (data.asset) formData.append('attachment[asset]', data.asset);

    return api.post(`/lists/${listId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    });
  },

  /** DELETE /api/v1/attachments/:id — delete attachment */
  deleteAttachment: (attachmentId) => api.delete(`/attachments/${attachmentId}`),

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
