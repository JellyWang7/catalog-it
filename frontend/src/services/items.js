import api from './api';

const itemsService = {
  /** GET /api/v1/lists/:listId/items — all items in a list */
  getByListId: (listId) => api.get(`/lists/${listId}/items`),

  /** GET /api/v1/items/:id — single item */
  getById: (id) => api.get(`/items/${id}`),

  /** POST /api/v1/lists/:listId/items — create item (requires ownership of list) */
  create: (listId, data) => api.post(`/lists/${listId}/items`, { item: data }),

  /** PATCH /api/v1/items/:id — update item (requires ownership of parent list) */
  update: (id, data) => api.patch(`/items/${id}`, { item: data }),

  /** DELETE /api/v1/items/:id — delete item (requires ownership of parent list) */
  delete: (id) => api.delete(`/items/${id}`),

  /** GET /api/v1/items/:id/attachments — list item attachments */
  getAttachments: (id) => api.get(`/items/${id}/attachments`),

  /** POST /api/v1/items/:id/attachments — create item attachment */
  createAttachment: (id, data) => {
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

    return api.post(`/items/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /** POST /api/v1/items/:id/like — like item */
  like: (id) => api.post(`/items/${id}/like`),

  /** DELETE /api/v1/items/:id/like — unlike item */
  unlike: (id) => api.delete(`/items/${id}/like`),
};

export default itemsService;
