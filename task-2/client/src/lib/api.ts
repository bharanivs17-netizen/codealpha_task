import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('ns_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 (token refresh)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('ns_refresh_token');
        if (!refreshToken) throw new Error('No refresh token');
        const { data } = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
        localStorage.setItem('ns_token', data.token);
        localStorage.setItem('ns_refresh_token', data.refreshToken);
        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem('ns_token');
        localStorage.removeItem('ns_refresh_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ========== AUTH API ===========
export const authAPI = {
  register: (data: { username: string; email: string; password: string; name: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  googleLogin: (token: string) => api.post('/auth/google', { token }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  verifyEmail: (token: string) => api.get(`/auth/verify-email/${token}`),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => api.post(`/auth/reset-password/${token}`, { password }),
};

// ========== USERS API ===========
export const usersAPI = {
  getProfile: (username: string) => api.get(`/users/${username}`),
  updateProfile: (data: FormData) => api.put('/users/profile', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  follow: (userId: string) => api.post(`/users/${userId}/follow`),
  search: (q: string, page = 1) => api.get(`/users/search?q=${q}&page=${page}`),
  getSuggestions: () => api.get('/users/suggestions'),
  getFollowers: (userId: string) => api.get(`/users/${userId}/followers`),
  getFollowing: (userId: string) => api.get(`/users/${userId}/following`),
  getSavedPosts: (username: string) => api.get(`/users/${username}/saved`),
};

// ========== POSTS API ===========
export const postsAPI = {
  create: (data: FormData) => api.post('/posts', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getFeed: (page = 1, limit = 10) => api.get(`/posts/feed?page=${page}&limit=${limit}`),
  getTrending: (page = 1) => api.get(`/posts/trending?page=${page}`),
  getPost: (id: string) => api.get(`/posts/${id}`),
  update: (id: string, data: { content?: string; visibility?: string }) => api.put(`/posts/${id}`, data),
  delete: (id: string) => api.delete(`/posts/${id}`),
  like: (id: string) => api.post(`/posts/${id}/like`),
  addComment: (id: string, content: string) => api.post(`/posts/${id}/comment`, { content }),
  deleteComment: (postId: string, commentId: string) => api.delete(`/posts/${postId}/comment/${commentId}`),
  save: (id: string) => api.post(`/posts/${id}/save`),
  repost: (id: string, content?: string) => api.post(`/posts/${id}/repost`, { content }),
  getByHashtag: (tag: string, page = 1) => api.get(`/posts/hashtag/${tag}?page=${page}`),
  getUserPosts: (username: string, page = 1, type = 'post') =>
    api.get(`/posts/user/${username}?page=${page}&type=${type}`),
  search: (q: string, page = 1) => api.get(`/posts/search?q=${q}&page=${page}`),
  getReels: (page = 1) => api.get(`/posts/reels?page=${page}`),
};

// ========== STORIES API ===========
export const storiesAPI = {
  create: (data: FormData) => api.post('/stories', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getFeed: () => api.get('/stories/feed'),
  view: (id: string) => api.post(`/stories/${id}/view`),
  delete: (id: string) => api.delete(`/stories/${id}`),
};

// ========== MESSAGES API ===========
export const messagesAPI = {
  getConversations: () => api.get('/messages/conversations'),
  createOrGet: (participantId: string) => api.post('/messages/conversations', { participantId }),
  getMessages: (conversationId: string, page = 1) => api.get(`/messages/${conversationId}?page=${page}`),
  send: (conversationId: string, data: FormData) =>
    api.post(`/messages/${conversationId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (messageId: string) => api.delete(`/messages/${messageId}`),
};

// ========== NOTIFICATIONS API ===========
export const notificationsAPI = {
  get: (page = 1) => api.get(`/notifications?page=${page}`),
  markAllRead: () => api.put('/notifications/read-all'),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  clearAll: () => api.delete('/notifications'),
};

// ========== AI API ===========
export const aiAPI = {
  generateCaption: (context: string, tone?: string) => api.post('/ai/caption', { context, tone }),
  generateHashtags: (content: string, count?: number) => api.post('/ai/hashtags', { content, count }),
  suggestComments: (postContent: string) => api.post('/ai/comment-suggestions', { postContent }),
  summarize: (content: string) => api.post('/ai/summarize', { content }),
  moderate: (content: string) => api.post('/ai/moderate', { content }),
};

// ========== ADMIN API ===========
export const adminAPI = {
  getUsers: (params?: Record<string, string>) => api.get('/admin/users', { params }),
  banUser: (id: string, banned: boolean) => api.put(`/admin/users/${id}/ban`, { banned }),
  updateRole: (id: string, role: string) => api.put(`/admin/users/${id}/role`, { role }),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  getPosts: (params?: Record<string, string>) => api.get('/admin/posts', { params }),
  deletePost: (id: string) => api.delete(`/admin/posts/${id}`),
  getReports: (params?: Record<string, string>) => api.get('/admin/reports', { params }),
  reviewReport: (id: string, data: { status: string; adminNote?: string }) => api.post(`/admin/reports/${id}/review`, data),
  getAnalytics: () => api.get('/admin/analytics'),
};
