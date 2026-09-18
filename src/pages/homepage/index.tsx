import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Home,
  Save,
  Eye,
  Layout,
  Sliders,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { homepageApi } from '../../services/api';
import { HomepageConfig, HomepageSection } from '../../types';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';

export default function HomepagePage() {
  const queryClient = useQueryClient();

  const { data: configData, isLoading } = useQuery({
    queryKey: ['homepage-config'],
    queryFn: () => homepageApi.get(),
  });

  const config: HomepageConfig | null = configData?.data?.data || null;

  // Local editable state
  const [heroEnabled, setHeroEnabled] = useState(true);
  const [heroTitle, setHeroTitle] = useState('');
  const [heroDescription, setHeroDescription] = useState('');
  const [heroBackgroundImage, setHeroBackgroundImage] = useState('');
  const [ctaText, setCtaText] = useState('Browse Movies');
  const [ctaLink, setCtaLink] = useState('/movies');
  const [sections, setSections] = useState<HomepageSection[]>([]);

  useEffect(() => {
    if (config) {
      setHeroEnabled(config.heroEnabled);
      setHeroTitle(config.heroTitle || '');
      setHeroDescription(config.heroDescription || '');
      setHeroBackgroundImage(config.heroBackgroundImage || '');
      setCtaText(config.ctaText || 'Browse Movies');
      setCtaLink(config.ctaLink || '/movies');
      setSections(config.sections || []);
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => homepageApi.update(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homepage-config'] });
      toast.success('Homepage configuration published live');
    },
    onError: (err: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.error((err as any).response?.data?.error || 'Failed to update homepage');
    },
  });

  const handleSectionToggle = (id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const handleSectionLimitChange = (id: string, limit: number) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, itemLimit: limit } : s))
    );
  };

  const handleSectionTitleChange = (id: string, title: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title } : s))
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      heroEnabled,
      heroTitle,
      heroDescription,
      heroBackgroundImage,
      ctaText,
      ctaLink,
      sections,
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <LoadingSkeleton lines={6} height="50px" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-cinzel tracking-wide flex items-center gap-2">
            <Home size={22} style={{ color: '#D4AF37' }} />
            <span>Homepage Configuration</span>
          </h1>
          <p className="text-xs text-muted mt-1">
            Control the hero marquee, section ordering, item limits, and visibility on the public CineScope homepage
          </p>
        </div>

        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold btn-gold transition-all self-start sm:self-auto"
          style={{
            background: 'linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)',
            color: '#070707',
          }}
        >
          {saveMutation.isPending ? (
            <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save size={16} />
          )}
          <span>Publish Changes</span>
        </button>
      </div>

      {/* Hero Banner Section */}
      <div
        className="rounded-xl p-6 space-y-4"
        style={{ backgroundColor: '#121212', border: '1px solid #242424' }}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#242424]">
          <div className="flex items-center gap-2">
            <Sparkles size={16} style={{ color: '#D4AF37' }} />
            <h2 className="text-sm font-semibold text-white">Hero Spotlight Banner</h2>
          </div>

          <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
            <input
              type="checkbox"
              checked={heroEnabled}
              onChange={(e) => setHeroEnabled(e.target.checked)}
              style={{ accentColor: '#D4AF37' }}
            />
            <span>Enable Hero Showcase</span>
          </label>
        </div>

        {heroEnabled && (
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Hero Headline Title</label>
              <input
                type="text"
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
                placeholder="e.g. Discover Extraordinary Cinema"
                className="w-full px-3.5 py-2 rounded-lg text-xs focus:outline-none"
                style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Hero Subtitle / Description</label>
              <textarea
                rows={2}
                value={heroDescription}
                onChange={(e) => setHeroDescription(e.target.value)}
                placeholder="A personal sanctuary for discovering and streaming timeless stories..."
                className="w-full px-3.5 py-2 rounded-lg text-xs focus:outline-none"
                style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Hero Background Image URL</label>
              <input
                type="text"
                value={heroBackgroundImage}
                onChange={(e) => setHeroBackgroundImage(e.target.value)}
                placeholder="https://image.tmdb.org/t/p/original/..."
                className="w-full px-3.5 py-2 rounded-lg text-xs focus:outline-none"
                style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Call to Action Button Text</label>
                <input
                  type="text"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  placeholder="Browse Movies"
                  className="w-full px-3.5 py-2 rounded-lg text-xs focus:outline-none"
                  style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Call to Action Link</label>
                <input
                  type="text"
                  value={ctaLink}
                  onChange={(e) => setCtaLink(e.target.value)}
                  placeholder="/movies"
                  className="w-full px-3.5 py-2 rounded-lg text-xs focus:outline-none"
                  style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sections List */}
      <div
        className="rounded-xl p-6 space-y-4"
        style={{ backgroundColor: '#121212', border: '1px solid #242424' }}
      >
        <div className="flex items-center gap-2 pb-3 border-b border-[#242424]">
          <Layout size={16} style={{ color: '#D4AF37' }} />
          <div>
            <h2 className="text-sm font-semibold text-white">Homepage Content Sections</h2>
            <p className="text-xs text-muted">Configure title, visibility, and max item counts for each strip on the homepage</p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {sections.map((section, idx) => (
            <div
              key={section.id}
              className="p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
              style={{
                backgroundColor: '#0D0D0D',
                border: section.enabled ? '1px solid #242424' : '1px dashed #1f1f1f',
                opacity: section.enabled ? 1 : 0.6,
              }}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[#161616] border border-[#242424] flex items-center justify-center font-mono text-xs text-muted">
                  {idx + 1}
                </span>
                <div>
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => handleSectionTitleChange(section.id, e.target.value)}
                    className="font-semibold text-xs text-white bg-transparent border-b border-transparent hover:border-[#D4AF37] focus:border-[#D4AF37] focus:outline-none px-1 py-0.5"
                  />
                  <span className="text-[10px] font-mono text-muted block ml-1 uppercase">
                    Type: {section.type}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 self-end sm:self-auto">
                <div className="flex items-center gap-1.5 text-xs text-muted">
                  <span>Limit:</span>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={section.itemLimit}
                    onChange={(e) => handleSectionLimitChange(section.id, Number(e.target.value))}
                    className="w-14 px-2 py-1 rounded text-xs text-center font-mono focus:outline-none"
                    style={{ backgroundColor: '#161616', border: '1px solid #242424', color: '#FFFFFF' }}
                  />
                  <span>titles</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleSectionToggle(section.id)}
                  className="px-3 py-1 rounded text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: section.enabled ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                    color: section.enabled ? '#4ade80' : '#f87171',
                    border: `1px solid ${section.enabled ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  }}
                >
                  {section.enabled ? 'Visible' : 'Hidden'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </form>
  );
}

