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
};

export default itemsService;
