import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Send HttpOnly cookie
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach Bearer token for cross-origin setups
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('cinescope_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Ignore storage access errors
  }
  return config;
});

// Response interceptor — handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      try {
        localStorage.removeItem('cinescope_token');
      } catch {
        // ignore
      }
      // Clear local auth state and redirect to login
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────
export const authApi = {
  login: async (email: string, password: string) => {
    const res = await api.post('/api/auth/login', { email, password });
    if (res.data?.data?.token) {
      try {
        localStorage.setItem('cinescope_token', res.data.data.token);
      } catch {
        // ignore
      }
    }
    return res;
  },
  logout: async () => {
    try {
      localStorage.removeItem('cinescope_token');
    } catch {
      // ignore
    }
    return api.post('/api/auth/logout');
  },
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
  // V3 additions
  bulkAction: (ids: string[], action: string) =>
    api.post('/api/admin/movies/bulk-action', { ids, action }),
  exportMovies: (format: 'json' | 'csv' = 'json') =>
    api.get('/api/admin/movies/export', { params: { format }, responseType: format === 'csv' ? 'blob' : 'json' }),
  importMovies: (movies: Record<string, unknown>[]) =>
    api.post('/api/admin/movies/import', { movies }),
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

// ── V3: Content Center ────────────────────────────────────────────────────
export const contentCenterApi = {
  getHealth: () => api.get('/api/admin/content-center/health'),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getIssues: (params?: Record<string, any>) => api.get('/api/admin/content-center/issues', { params }),
};

// ── V3: Media Library ─────────────────────────────────────────────────────
export const mediaApi = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  list: (params?: Record<string, any>) => api.get('/api/admin/media', { params }),
  get: (id: string) => api.get(`/api/admin/media/${id}`),
  create: (data: Record<string, unknown>) => api.post('/api/admin/media', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/api/admin/media/${id}`, data),
  delete: (id: string) => api.delete(`/api/admin/media/${id}`),
};

// ── V3: Scheduler ─────────────────────────────────────────────────────────
export const schedulerApi = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  list: (params?: Record<string, any>) => api.get('/api/admin/scheduler', { params }),
  get: (id: string) => api.get(`/api/admin/scheduler/${id}`),
  create: (data: Record<string, unknown>) => api.post('/api/admin/scheduler', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/api/admin/scheduler/${id}`, data),
  delete: (id: string) => api.delete(`/api/admin/scheduler/${id}`),
  executeNow: (id: string) => api.post(`/api/admin/scheduler/${id}/execute`),
  cancel: (id: string) => api.post(`/api/admin/scheduler/${id}/cancel`),
};

// ── V3: System Health ─────────────────────────────────────────────────────
export const systemApi = {
  getHealth: () => api.get('/api/admin/system-health'),
};

// ── V3: Search Analytics ──────────────────────────────────────────────────
export const searchAnalyticsApi = {
  getSearches: (period: string) => api.get('/api/admin/analytics/searches', { params: { period } }),
  getLive: () => api.get('/api/admin/analytics/live'),
};

// ── V3: Seasons ───────────────────────────────────────────────────────────
export const seasonsApi = {
  list: (tvShowId: string) => api.get(`/api/admin/tv-shows/${tvShowId}/seasons`),
  create: (tvShowId: string, data: Record<string, unknown>) =>
    api.post(`/api/admin/tv-shows/${tvShowId}/seasons`, data),
  update: (tvShowId: string, seasonId: string, data: Record<string, unknown>) =>
    api.put(`/api/admin/tv-shows/${tvShowId}/seasons/${seasonId}`, data),
  delete: (tvShowId: string, seasonId: string) =>
    api.delete(`/api/admin/tv-shows/${tvShowId}/seasons/${seasonId}`),
};

// ── V3: Episodes ──────────────────────────────────────────────────────────
export const episodesApi = {
  list: (seasonId: string) => api.get(`/api/admin/seasons/${seasonId}/episodes`),
  create: (seasonId: string, data: Record<string, unknown>) =>
    api.post(`/api/admin/seasons/${seasonId}/episodes`, data),
  update: (seasonId: string, episodeId: string, data: Record<string, unknown>) =>
    api.put(`/api/admin/seasons/${seasonId}/episodes/${episodeId}`, data),
  delete: (seasonId: string, episodeId: string) =>
    api.delete(`/api/admin/seasons/${seasonId}/episodes/${episodeId}`),
};

