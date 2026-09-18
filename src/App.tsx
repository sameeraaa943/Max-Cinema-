import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useAuthStore } from './stores/authStore';
import { authApi } from './services/api';
import AdminLayout from './components/layout/AdminLayout';
import Login from './pages/Login';

// Lazy-loaded pages for fast code-splitting
const DashboardPage = lazy(() => import('./pages/dashboard/index'));
const MoviesPage = lazy(() => import('./pages/movies/index'));
const MovieFormPage = lazy(() => import('./pages/movies/MovieForm'));
const TVShowsPage = lazy(() => import('./pages/tv-shows/index'));
const TVShowFormPage = lazy(() => import('./pages/tv-shows/TVShowForm'));
const FeaturedPage = lazy(() => import('./pages/featured/index'));
const TrendingPage = lazy(() => import('./pages/trending/index'));
const CollectionsPage = lazy(() => import('./pages/collections/index'));
const CollectionDetailPage = lazy(() => import('./pages/collections/CollectionDetail'));
const HomepagePage = lazy(() => import('./pages/homepage/index'));
const AnalyticsPage = lazy(() => import('./pages/analytics/index'));
const AdsPage = lazy(() => import('./pages/ads/index'));
const SettingsPage = lazy(() => import('./pages/settings/index'));
const AuditLogPage = lazy(() => import('./pages/audit-log/index'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  },
});

function AppInitializer({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    authApi
      .me()
      .then((res) => {
        if (res.data?.success && res.data?.data) {
          setUser(res.data.data);
        } else {
          setUser(null);
        }
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [setUser, setLoading]);

  return <>{children}</>;
}

const LoadingFallback = () => (
  <div
    className="flex items-center justify-center min-h-screen w-full"
    style={{ backgroundColor: '#070707' }}
  >
    <div
      className="w-10 h-10 rounded-full border-2 animate-spin"
      style={{ borderColor: '#242424', borderTopColor: '#D4AF37' }}
    />
  </div>
);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppInitializer>
          <Toaster
            position="top-right"
            theme="dark"
            richColors
            toastOptions={{
              style: {
                backgroundColor: '#121212',
                border: '1px solid #242424',
                color: '#FFFFFF',
              },
            }}
          />
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={<AdminLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="movies" element={<MoviesPage />} />
                <Route path="movies/new" element={<MovieFormPage />} />
                <Route path="movies/:id/edit" element={<MovieFormPage />} />
                <Route path="tv-shows" element={<TVShowsPage />} />
                <Route path="tv-shows/new" element={<TVShowFormPage />} />
                <Route path="tv-shows/:id/edit" element={<TVShowFormPage />} />
                <Route path="featured" element={<FeaturedPage />} />
                <Route path="trending" element={<TrendingPage />} />
                <Route path="collections" element={<CollectionsPage />} />
                <Route path="collections/:id" element={<CollectionDetailPage />} />
                <Route path="homepage" element={<HomepagePage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="ads" element={<AdsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="audit-log" element={<AuditLogPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </Suspense>
        </AppInitializer>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
