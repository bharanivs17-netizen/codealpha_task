/**
 * api.js — Centralized API client for LuxeStore
 * All fetch calls go through this module, which
 * automatically handles auth headers and error parsing.
 */

const API_BASE = '/api';

// ── Token management ──────────────────────────────────────
export const getToken  = ()        => localStorage.getItem('luxe_token');
export const setToken  = (token)   => localStorage.setItem('luxe_token', token);
export const removeToken = ()      => localStorage.removeItem('luxe_token');
export const getUser   = ()        => JSON.parse(localStorage.getItem('luxe_user') || 'null');
export const setUser   = (user)    => localStorage.setItem('luxe_user', JSON.stringify(user));
export const removeUser = ()       => localStorage.removeItem('luxe_user');

export const isLoggedIn  = () => !!getToken();
export const isAdmin     = () => { const u = getUser(); return u && u.role === 'admin'; };

// ── Base fetch wrapper ─────────────────────────────────────
async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || `HTTP ${res.status}`);
  }
  return data;
}

// ── HTTP helpers ──────────────────────────────────────────
export const api = {
  get:    (url)         => request(url),
  post:   (url, body)   => request(url, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (url, body)   => request(url, { method: 'PUT',    body: JSON.stringify(body) }),
  delete: (url)         => request(url, { method: 'DELETE' }),

  // For FormData (image uploads)
  postForm: (url, formData) => {
    const token = getToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(`${API_BASE}${url}`, { method: 'POST', headers, body: formData })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
        return data;
      });
  },

  putForm: (url, formData) => {
    const token = getToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(`${API_BASE}${url}`, { method: 'PUT', headers, body: formData })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
        return data;
      });
  },
};

// ── Auth API ──────────────────────────────────────────────
export const authAPI = {
  register:       (data)         => api.post('/auth/register', data),
  login:          (data)         => api.post('/auth/login', data),
  logout:         ()             => api.post('/auth/logout'),
  getMe:          ()             => api.get('/auth/me'),
  updateProfile:  (formData)     => api.putForm('/auth/update-profile', formData),
  addAddress:     (data)         => api.post('/auth/addresses', data),
  deleteAddress:  (id)           => api.delete(`/auth/addresses/${id}`),
  changePassword: (data)         => api.put('/auth/change-password', data),
};

// ── Products API ──────────────────────────────────────────
export const productAPI = {
  getAll:    (params = {}) => api.get(`/products?${new URLSearchParams(params)}`),
  getOne:    (slug)        => api.get(`/products/${slug}`),
  getRelated:(id)          => api.get(`/products/${id}/related`),
  create:    (formData)    => api.postForm('/products', formData),
  update:    (id, formData)=> api.putForm(`/products/${id}`, formData),
  delete:    (id)          => api.delete(`/products/${id}`),
  addReview: (id, data)    => api.post(`/products/${id}/reviews`, data),
};

// ── Categories API ─────────────────────────────────────────
export const categoryAPI = {
  getAll:  ()             => api.get('/categories'),
  getOne:  (slug)         => api.get(`/categories/${slug}`),
  create:  (formData)     => api.postForm('/categories', formData),
  update:  (id, formData) => api.putForm(`/categories/${id}`, formData),
  delete:  (id)           => api.delete(`/categories/${id}`),
};

// ── Cart API ───────────────────────────────────────────────
export const cartAPI = {
  get:     ()                           => api.get('/cart'),
  add:     (productId, quantity = 1)    => api.post('/cart/add', { productId, quantity }),
  update:  (productId, quantity)        => api.put('/cart/update', { productId, quantity }),
  remove:  (productId)                  => api.delete(`/cart/remove/${productId}`),
  clear:   ()                           => api.delete('/cart/clear'),
};

// ── Wishlist API ───────────────────────────────────────────
export const wishlistAPI = {
  get:    ()          => api.get('/wishlist'),
  toggle: (productId) => api.post('/wishlist/toggle', { productId }),
};

// ── Orders API ─────────────────────────────────────────────
export const orderAPI = {
  place:       (data)   => api.post('/orders', data),
  getMyOrders: ()       => api.get('/orders/my-orders'),
  getOne:      (id)     => api.get(`/orders/${id}`),
  getAll:      (params) => api.get(`/orders?${new URLSearchParams(params || {})}`),
  updateStatus:(id, data) => api.put(`/orders/${id}/status`, data),
};

// ── Payments API ────────────────────────────────────────────
export const paymentAPI = {
  createIntent: (amount) => api.post('/payments/create-intent', { amount }),
};

// ── Admin API ──────────────────────────────────────────────
export const adminAPI = {
  getAnalytics: () => api.get('/admin/analytics'),
  getUsers:     (params) => api.get(`/admin/users?${new URLSearchParams(params || {})}`),
  updateUser:   (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser:   (id)       => api.delete(`/admin/users/${id}`),
};
