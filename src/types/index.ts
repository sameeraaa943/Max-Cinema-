// ============================================================
// CineScope Admin — Shared TypeScript Types
// Used by both frontend (src/) and server (server/src/)
// ============================================================

// ── Roles ──────────────────────────────────────────────────
export type AdminRole = 'SUPER_ADMIN' | 'ADMIN';

// ── Admin User ─────────────────────────────────────────────
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  user: AdminUser;
  token: string;
}

// ── Genre ──────────────────────────────────────────────────
export interface Genre {
  id: string;
  name: string;
  slug: string;
  tmdbId?: number | null;
}

// ── Movie ──────────────────────────────────────────────────
export type MovieStatus = 'ACTIVE' | 'INACTIVE' | 'DRAFT';

export interface Movie {
  id: string;
  title: string;
  originalTitle?: string;
  description?: string;
  posterUrl?: string;
  backdropUrl?: string;
  releaseDate?: string;
  runtime?: number;
  rating?: number;
  imdbId?: string;
  tmdbId?: number;
  director?: string;
  cast?: string[];
  language?: string;
  country?: string;
  trailerUrl?: string;
  videoUrl?: string;
  status: MovieStatus;
  featured: boolean;
  trending: boolean;
  tags?: string[];
  genres: Genre[];
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MovieFormData {
  title: string;
  originalTitle?: string;
  description?: string;
  posterUrl?: string;
  backdropUrl?: string;
  releaseDate?: string;
  runtime?: number;
  rating?: number;
  imdbId?: string;
  tmdbId?: number;
  director?: string;
  cast?: string;
  language?: string;
  country?: string;
  trailerUrl?: string;
  videoUrl?: string;
  status: MovieStatus;
  featured: boolean;
  trending: boolean;
  tags?: string;
  genreIds: string[];
}

// ── TV Show ────────────────────────────────────────────────
export type TVStatus = 'RETURNING' | 'ENDED' | 'CANCELED' | 'UPCOMING';

export interface TVShow {
  id: string;
  title: string;
  originalTitle?: string;
  description?: string;
  posterUrl?: string;
  backdropUrl?: string;
  firstAirDate?: string;
  lastAirDate?: string;
  rating?: number;
  imdbId?: string;
  tmdbId?: number;
  creator?: string;
  cast?: string[];
  language?: string;
  country?: string;
  trailerUrl?: string;
  status: MovieStatus;
  tvStatus: TVStatus;
  featured: boolean;
  trending: boolean;
  tags?: string[];
  genres: Genre[];
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TVShowFormData {
  title: string;
  originalTitle?: string;
  description?: string;
  posterUrl?: string;
  backdropUrl?: string;
  firstAirDate?: string;
  lastAirDate?: string;
  rating?: number;
  imdbId?: string;
  tmdbId?: number;
  creator?: string;
  cast?: string;
  language?: string;
  country?: string;
  trailerUrl?: string;
  status: MovieStatus;
  tvStatus: TVStatus;
  featured: boolean;
  trending: boolean;
  tags?: string;
  genreIds: string[];
}

// ── Featured ───────────────────────────────────────────────
export type ContentType = 'MOVIE' | 'TV_SHOW';

export interface FeaturedItem {
  id: string;
  contentType: ContentType;
  movieId?: string;
  tvShowId?: string;
  movie?: Pick<Movie, 'id' | 'title' | 'posterUrl' | 'rating' | 'releaseDate'>;
  tvShow?: Pick<TVShow, 'id' | 'title' | 'posterUrl' | 'rating' | 'firstAirDate'>;
  displayOrder: number;
  enabled: boolean;
  createdAt: string;
}

// ── Trending ───────────────────────────────────────────────
export interface TrendingItem {
  id: string;
  contentType: ContentType;
  movieId?: string;
  tvShowId?: string;
  movie?: Pick<Movie, 'id' | 'title' | 'posterUrl' | 'rating'>;
  tvShow?: Pick<TVShow, 'id' | 'title' | 'posterUrl' | 'rating'>;
  rank: number;
  trendingScore: number;
  enabled: boolean;
  createdAt: string;
}

// ── Collection ─────────────────────────────────────────────
export interface Collection {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  backgroundImage?: string;
  slug: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  featured: boolean;
  displayOrder: number;
  itemCount: number;
  items?: CollectionItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CollectionItem {
  id: string;
  collectionId: string;
  contentType: ContentType;
  movieId?: string;
  tvShowId?: string;
  movie?: Pick<Movie, 'id' | 'title' | 'posterUrl' | 'rating'>;
  tvShow?: Pick<TVShow, 'id' | 'title' | 'posterUrl' | 'rating'>;
  displayOrder: number;
}

export interface CollectionFormData {
  name: string;
  description?: string;
  coverImage?: string;
  backgroundImage?: string;
  slug: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  featured: boolean;
  displayOrder: number;
}

// ── Homepage ───────────────────────────────────────────────
export type SectionType =
  | 'HERO'
  | 'FEATURED'
  | 'TRENDING'
  | 'POPULAR_MOVIES'
  | 'POPULAR_TV'
  | 'NEW_RELEASES'
  | 'COLLECTIONS'
  | 'RECOMMENDED'
  | 'CUSTOM';

export interface HomepageSection {
  id: string;
  type: SectionType;
  title: string;
  enabled: boolean;
  displayOrder: number;
  contentSource?: string;
  itemLimit: number;
}

export interface HomepageConfig {
  id: string;
  heroEnabled: boolean;
  heroTitle?: string;
  heroDescription?: string;
  heroBackgroundImage?: string;
  heroMovieId?: string;
  heroTvShowId?: string;
  ctaText?: string;
  ctaLink?: string;
  sections: HomepageSection[];
  updatedAt: string;
}

// ── Analytics ──────────────────────────────────────────────
export type AnalyticsEventType =
  | 'page_view'
  | 'movie_view'
  | 'tv_show_view'
  | 'search'
  | 'featured_click'
  | 'trending_click'
  | 'trailer_click'
  | 'collection_view';

export interface AnalyticsEvent {
  event: AnalyticsEventType;
  contentId?: string;
  contentType?: 'movie' | 'tv_show';
  searchQuery?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface AnalyticsSummary {
  period: string;
  totalPageViews: number;
  uniqueVisitors: number;
  movieViews: number;
  tvViews: number;
  searches: number;
  chartData: ChartDataPoint[];
  topMovies: TopContent[];
  topTVShows: TopContent[];
  topSearches: TopSearch[];
  topGenres: TopGenre[];
}

export interface ChartDataPoint {
  label: string;
  pageViews: number;
  movieViews: number;
  tvViews: number;
  searches: number;
}

export interface TopContent {
  id: string;
  title: string;
  posterUrl?: string;
  views: number;
}

export interface TopSearch {
  query: string;
  count: number;
}

export interface TopGenre {
  name: string;
  count: number;
}

// ── Advertisement ──────────────────────────────────────────
export type AdPlacement =
  | 'HEADER'
  | 'HOMEPAGE'
  | 'MOVIE_PAGE'
  | 'TV_PAGE'
  | 'SEARCH_RESULTS'
  | 'BETWEEN_CONTENT'
  | 'FOOTER';

export type AdDeviceTarget = 'ALL' | 'DESKTOP' | 'MOBILE' | 'TABLET';

export interface Advertisement {
  id: string;
  name: string;
  placement: AdPlacement;
  adCode: string;
  enabled: boolean;
  startDate?: string;
  endDate?: string;
  deviceTarget: AdDeviceTarget;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdFormData {
  name: string;
  placement: AdPlacement;
  adCode: string;
  enabled: boolean;
  startDate?: string;
  endDate?: string;
  deviceTarget: AdDeviceTarget;
  priority: number;
}

// ── Settings ───────────────────────────────────────────────
export interface SiteSettings {
  general: {
    siteName: string;
    siteDescription: string;
    logoUrl?: string;
    faviconUrl?: string;
    contactEmail?: string;
    socialLinks: Record<string, string>;
  };
  appearance: {
    accentColor: string;
    defaultPosterUrl?: string;
    defaultBackdropUrl?: string;
  };
  seo: {
    siteTitle: string;
    metaDescription: string;
    keywords: string;
    ogImage?: string;
    robotsContent: string;
  };
  integrations: {
    tmdbApiKey?: string;
    analyticsEnabled: boolean;
    adSenseEnabled: boolean;
    adSensePublisherId?: string;
  };
  homepage: {
    defaultSections: string[];
    itemsPerSection: number;
    featuredLimit: number;
    trendingLimit: number;
  };
}

// ── Audit Log ──────────────────────────────────────────────
export interface AuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

// ── TMDB ───────────────────────────────────────────────────
export interface TMDBMovieResult {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
  original_language: string;
}

export interface TMDBTVResult {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  genre_ids: number[];
  original_language: string;
}

export interface TMDBMovieDetails extends TMDBMovieResult {
  runtime: number;
  imdb_id?: string;
  genres: { id: number; name: string }[];
  production_countries: { iso_3166_1: string; name: string }[];
  credits?: {
    crew: { job: string; name: string }[];
    cast: { name: string; order: number }[];
  };
  videos?: {
    results: { key: string; site: string; type: string }[];
  };
}

export interface TMDBTVDetails extends TMDBTVResult {
  imdb_id?: string;
  genres: { id: number; name: string }[];
  origin_country: string[];
  created_by: { name: string }[];
  status: string;
  last_air_date?: string;
  credits?: {
    cast: { name: string; order: number }[];
  };
  videos?: {
    results: { key: string; site: string; type: string }[];
  };
}

// ── API Response ───────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Filters / Query ────────────────────────────────────────
export interface MovieFilters {
  search?: string;
  genre?: string;
  year?: string;
  rating?: string;
  featured?: boolean;
  trending?: boolean;
  status?: MovieStatus;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TVShowFilters {
  search?: string;
  genre?: string;
  year?: string;
  rating?: string;
  featured?: boolean;
  trending?: boolean;
  status?: MovieStatus;
  tvStatus?: TVStatus;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

