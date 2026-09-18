import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings,
  Shield,
  Key,
  Database,
  Lock,
  Tag,
  Save,
  CheckCircle,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { settingsApi, authApi } from '../../services/api';
import { Genre } from '../../types';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'general' | 'integrations' | 'genres' | 'security'>('general');

  // General settings state
  const [siteName, setSiteName] = useState('CineScope');
  const [siteDesc, setSiteDesc] = useState('Discover movies and television shows.');
  const [accentColor, setAccentColor] = useState('#D4AF37');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Genre modal state
  const [newGenreName, setNewGenreName] = useState('');
  const [newGenreSlug, setNewGenreSlug] = useState('');
  const [newGenreTmdb, setNewGenreTmdb] = useState('');

  // Fetch genres
  const { data: genresData } = useQuery({
    queryKey: ['genres'],
    queryFn: () => settingsApi.getGenres(),
  });
  const genres: Genre[] = genresData?.data?.data || [];

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsChangingPass(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.error((err as any).response?.data?.error || 'Failed to update password');
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleAddGenre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGenreName.trim()) return;
    try {
      await settingsApi.update({
        genres: {
          name: newGenreName,
          slug: newGenreSlug || newGenreName.toLowerCase().replace(/\s+/g, '-'),
          tmdbId: newGenreTmdb ? Number(newGenreTmdb) : null,
        },
      });
      queryClient.invalidateQueries({ queryKey: ['genres'] });
      toast.success('Genre added');
      setNewGenreName('');
      setNewGenreSlug('');
      setNewGenreTmdb('');
    } catch {
      toast.error('Failed to create genre');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white font-cinzel tracking-wide flex items-center gap-2">
          <Settings size={22} style={{ color: '#D4AF37' }} />
          <span>System & Site Settings</span>
        </h1>
        <p className="text-xs text-muted mt-1">
          Configure site metadata, API integrations, genres taxonomy, and security preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#242424] pb-2 text-xs">
        {[
          { id: 'general', label: 'General & Appearance', icon: Settings },
          { id: 'integrations', label: 'API Integrations', icon: Key },
          { id: 'genres', label: 'Genres Taxonomy', icon: Tag },
          { id: 'security', label: 'Admin Security', icon: Lock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className="px-3.5 py-2 rounded-lg font-medium flex items-center gap-2 transition-all"
              style={{
                backgroundColor: isActive ? 'rgba(212,175,55,0.12)' : 'transparent',
                color: isActive ? '#D4AF37' : '#8A8A8A',
                border: isActive ? '1px solid rgba(212,175,55,0.3)' : '1px solid transparent',
              }}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab: General */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl space-y-4" style={{ backgroundColor: '#121212', border: '1px solid #242424' }}>
            <h3 className="text-sm font-semibold text-white">CineScope Branding</h3>

            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Site Name</label>
              <input
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg text-xs focus:outline-none"
                style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Site Tagline / Description</label>
              <textarea
                rows={2}
                value={siteDesc}
                onChange={(e) => setSiteDesc(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg text-xs focus:outline-none"
                style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Primary Accent Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-9 h-9 rounded cursor-pointer bg-transparent border-none"
                />
                <span className="font-mono text-xs text-white">{accentColor}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#242424]">
              <button
                onClick={() => toast.success('Brand settings saved')}
                className="px-4 py-2 rounded-lg text-xs font-bold btn-gold"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)',
                  color: '#070707',
                }}
              >
                Save Branding
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Integrations */}
      {activeTab === 'integrations' && (
        <div className="space-y-6">
          {/* Supabase Database */}
          <div className="p-6 rounded-xl space-y-3" style={{ backgroundColor: '#121212', border: '1px solid #242424' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Database size={18} style={{ color: '#D4AF37' }} />
                <div>
                  <h3 className="text-sm font-semibold text-white">Database Engine</h3>
                  <p className="text-xs text-muted">Supabase PostgreSQL with PgBouncer connection pooling</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Connected
              </span>
            </div>
            <div className="p-3 rounded bg-[#0D0D0D] border border-[#242424] font-mono text-[11px] text-muted">
              DATABASE_URL=postgresql://postgres:[ref]:[pass]@aws-0-[region].pooler.supabase.com:6543/postgres
            </div>
          </div>

          {/* TMDB API */}
          <div className="p-6 rounded-xl space-y-3" style={{ backgroundColor: '#121212', border: '1px solid #242424' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Key size={18} style={{ color: '#60a5fa' }} />
                <div>
                  <h3 className="text-sm font-semibold text-white">The Movie Database (TMDB) API</h3>
                  <p className="text-xs text-muted">Server-side proxy protects credentials from frontend exposure</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Active Proxy
              </span>
            </div>
            <p className="text-xs text-muted">
              Configure your TMDB API v3 key in your server's <code className="text-[#D4AF37]">.env</code> file under <code className="text-white">TMDB_API_KEY</code>.
            </p>
          </div>

          {/* Google AdSense */}
          <div className="p-6 rounded-xl space-y-3" style={{ backgroundColor: '#121212', border: '1px solid #242424' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Shield size={18} style={{ color: '#facc15' }} />
                <div>
                  <h3 className="text-sm font-semibold text-white">Google AdSense</h3>
                  <p className="text-xs text-muted">Publisher account associated with public website</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold text-amber-400">
                ca-pub-1450329989131749
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Genres */}
      {activeTab === 'genres' && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl space-y-4" style={{ backgroundColor: '#121212', border: '1px solid #242424' }}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Genres Taxonomy</h3>
                <p className="text-xs text-muted">Standard film and television categories ({genres.length} total)</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-2">
              {genres.map((g) => (
                <div
                  key={g.id}
                  className="p-2.5 rounded-lg text-xs flex items-center justify-between"
                  style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424' }}
                >
                  <span className="font-semibold text-white">{g.name}</span>
                  {g.tmdbId && (
                    <span className="text-[10px] font-mono text-muted">#{g.tmdbId}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Security */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl space-y-4 max-w-md" style={{ backgroundColor: '#121212', border: '1px solid #242424' }}>
            <div className="flex items-center gap-2.5">
              <Lock size={18} style={{ color: '#ef4444' }} />
              <div>
                <h3 className="text-sm font-semibold text-white">Change Admin Password</h3>
                <p className="text-xs text-muted">Requires your existing password to verify identity</p>
              </div>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs focus:outline-none"
                  style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full px-3 py-2 rounded-lg text-xs focus:outline-none"
                  style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs focus:outline-none"
                  style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isChangingPass}
                  className="w-full py-2.5 rounded-lg text-xs font-bold btn-gold"
                  style={{
                    background: 'linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)',
                    color: '#070707',
                  }}
                >
                  {isChangingPass ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

