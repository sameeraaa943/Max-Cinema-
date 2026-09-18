import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Send HttpOnly cookie
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor — handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear local auth state and redirect to login
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),
  logout: () => api.post('/api/auth/logout'),
  me: () => api.get('/api/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/api/auth/change-password', { currentPassword, newPassword }),
};

// ── Movies ─────────────────────────────────────────────────────────────────
export const moviesApi = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  list: (params?: Record<string, any>) =>
    api.get('/api/admin/movies', { params }),
  get: (id: string) => api.get(`/api/admin/movies/${id}`),
  create: (data: Record<string, unknown>) => api.post('/api/admin/movies', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/api/admin/movies/${id}`, data),
  delete: (id: string) => api.delete(`/api/admin/movies/${id}`),
  toggleFeatured: (id: string) => api.patch(`/api/admin/movies/${id}/toggle-featured`),
  toggleTrending: (id: string) => api.patch(`/api/admin/movies/${id}/toggle-trending`),
};

// ── TV Shows ──────────────────────────────────────────────────────────────
export const tvShowsApi = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  list: (params?: Record<string, any>) =>
    api.get('/api/admin/tv-shows', { params }),
  get: (id: string) => api.get(`/api/admin/tv-shows/${id}`),
  create: (data: Record<string, unknown>) => api.post('/api/admin/tv-shows', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/api/admin/tv-shows/${id}`, data),
  delete: (id: string) => api.delete(`/api/admin/tv-shows/${id}`),
  toggleFeatured: (id: string) => api.patch(`/api/admin/tv-shows/${id}/toggle-featured`),
  toggleTrending: (id: string) => api.patch(`/api/admin/tv-shows/${id}/toggle-trending`),
};

// ── Featured ──────────────────────────────────────────────────────────────
export const featuredApi = {
  list: () => api.get('/api/admin/featured'),
  add: (data: Record<string, unknown>) => api.post('/api/admin/featured', data),
  reorder: (orderedIds: string[]) => api.put('/api/admin/featured/reorder', { orderedIds }),
  toggle: (id: string) => api.patch(`/api/admin/featured/${id}/toggle`),
  remove: (id: string) => api.delete(`/api/admin/featured/${id}`),
};

// ── Trending ──────────────────────────────────────────────────────────────
export const trendingApi = {
  list: () => api.get('/api/admin/trending'),
  add: (data: Record<string, unknown>) => api.post('/api/admin/trending', data),
  reorder: (orderedIds: string[]) => api.put('/api/admin/trending/reorder', { orderedIds }),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/api/admin/trending/${id}`, data),
  remove: (id: string) => api.delete(`/api/admin/trending/${id}`),
};

// ── Collections ───────────────────────────────────────────────────────────
export const collectionsApi = {
  list: () => api.get('/api/admin/collections'),
  get: (id: string) => api.get(`/api/admin/collections/${id}`),
  create: (data: Record<string, unknown>) => api.post('/api/admin/collections', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/api/admin/collections/${id}`, data),
  delete: (id: string) => api.delete(`/api/admin/collections/${id}`),
  addItem: (id: string, data: Record<string, unknown>) => api.post(`/api/admin/collections/${id}/items`, data),
  removeItem: (id: string, itemId: string) => api.delete(`/api/admin/collections/${id}/items/${itemId}`),
  reorderItems: (id: string, orderedIds: string[]) => api.put(`/api/admin/collections/${id}/items/reorder`, { orderedIds }),
};

// ── Homepage ──────────────────────────────────────────────────────────────
export const homepageApi = {
  get: () => api.get('/api/admin/homepage'),
  update: (data: Record<string, unknown>) => api.put('/api/admin/homepage', data),
};

// ── Analytics ─────────────────────────────────────────────────────────────
export const analyticsApi = {
  get: (period: string) => api.get('/api/admin/analytics', { params: { period } }),
};

// ── Ads ───────────────────────────────────────────────────────────────────
export const adsApi = {
  list: () => api.get('/api/admin/ads'),
  get: (id: string) => api.get(`/api/admin/ads/${id}`),
  create: (data: Record<string, unknown>) => api.post('/api/admin/ads', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/api/admin/ads/${id}`, data),
  toggle: (id: string) => api.patch(`/api/admin/ads/${id}/toggle`),
  delete: (id: string) => api.delete(`/api/admin/ads/${id}`),
};

// ── Settings ──────────────────────────────────────────────────────────────
export const settingsApi = {
  get: () => api.get('/api/admin/settings'),
  update: (data: Record<string, unknown>) => api.put('/api/admin/settings', data),
  getGenres: () => api.get('/api/admin/settings/genres'),
  getAdmins: () => api.get('/api/admin/settings/admins'),
};

// ── Audit ─────────────────────────────────────────────────────────────────
export const auditApi = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  list: (params?: Record<string, any>) =>
    api.get('/api/admin/audit', { params }),
};

// ── TMDB ──────────────────────────────────────────────────────────────────
export const tmdbApi = {
  searchMovies: (q: string, page = 1) =>
    api.get('/api/admin/tmdb/search/movies', { params: { q, page } }),
  searchTV: (q: string, page = 1) =>
    api.get('/api/admin/tmdb/search/tv', { params: { q, page } }),
  getMovieDetails: (tmdbId: number) =>
    api.get(`/api/admin/tmdb/movies/${tmdbId}`),
  getTVDetails: (tmdbId: number) =>
    api.get(`/api/admin/tmdb/tv/${tmdbId}`),
};

// ── Health ────────────────────────────────────────────────────────────────
export const healthApi = {
  check: () => api.get('/health'),
};
