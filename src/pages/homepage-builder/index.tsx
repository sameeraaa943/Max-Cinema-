import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Layout,
  Eye,
  Save,
  CheckCircle,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Globe,
  Loader2,
  Sparkles,
  Play,
  RotateCcw,
  Sliders,
  Film,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import { homepageApi } from '../../services/api';

interface SectionConfig {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  order: number;
  itemLimit: number;
  customTitle?: string;
}

const DEFAULT_SECTIONS: SectionConfig[] = [
  { id: 'hero', name: 'Hero Spotlight Banner', type: 'HERO', enabled: true, order: 0, itemLimit: 1 },
  { id: 'network_pins', name: 'Network Pinned Spotlight', type: 'NETWORK_PINS', enabled: true, order: 1, itemLimit: 6 },
  { id: 'featured', name: 'Featured Premieres', type: 'FEATURED', enabled: true, order: 2, itemLimit: 12 },
  { id: 'trending', name: 'Trending Now', type: 'TRENDING', enabled: true, order: 3, itemLimit: 10 },
  { id: 'new_releases', name: 'New Releases', type: 'MOVIES', enabled: true, order: 4, itemLimit: 12 },
  { id: 'tv_shows', name: 'Binge-Worthy TV Series', type: 'TV_SHOWS', enabled: true, order: 5, itemLimit: 10 },
  { id: 'top_rated', name: 'Critically Acclaimed', type: 'TOP_RATED', enabled: true, order: 6, itemLimit: 10 },
  { id: 'collections', name: 'Curated Collections', type: 'COLLECTIONS', enabled: true, order: 7, itemLimit: 8 },
];

export default function HomepageBuilderPage() {
  const queryClient = useQueryClient();
  const [sections, setSections] = useState<SectionConfig[]>(DEFAULT_SECTIONS);
  const [heroTitle, setHeroTitle] = useState('');
  const [heroDescription, setHeroDescription] = useState('');
  const [heroBackdrop, setHeroBackdrop] = useState('');
  const [heroMediaId, setHeroMediaId] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Fetch Homepage Config
  const { data, isLoading } = useQuery({
    queryKey: ['homepage-config'],
    queryFn: () => homepageApi.get(),
  });

  useEffect(() => {
    if (data?.data?.data) {
      const config = data.data.data;
      if (config.sections && Array.isArray(config.sections) && config.sections.length > 0) {
        setSections(config.sections.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)));
      }
      if (config.hero) {
        setHeroTitle(config.hero.title || '');
        setHeroDescription(config.hero.description || '');
        setHeroBackdrop(config.hero.backdropUrl || '');
        setHeroMediaId(config.hero.mediaId || '');
      }
    }
  }, [data]);

  // Save Mutation (Draft)
  const saveMutation = useMutation({
    mutationFn: (isPublish: boolean) =>
      homepageApi.update({
        sections,
        hero: {
          title: heroTitle,
          description: heroDescription,
          backdropUrl: heroBackdrop,
          mediaId: heroMediaId,
        },
        isPublished: isPublish,
      }),
    onSuccess: (_, isPublish) => {
      queryClient.invalidateQueries({ queryKey: ['homepage-config'] });
      setHasUnsavedChanges(false);
      toast.success(isPublish ? 'Homepage published to live site!' : 'Homepage draft saved');
    },
    onError: () => {
      toast.error('Failed to save homepage settings');
    },
  });

  const handleMove = (index: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const newSections = [...sections];
    const [moved] = newSections.splice(index, 1);
    newSections.splice(targetIndex, 0, moved);

    const reindexed = newSections.map((s, idx) => ({ ...s, order: idx }));
    setSections(reindexed);
    setHasUnsavedChanges(true);
  };

  const handleToggle = (id: string) => {
    setSections(prev =>
      prev.map(s => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
    setHasUnsavedChanges(true);
  };

  const handleLimitChange = (id: string, limit: number) => {
    setSections(prev =>
      prev.map(s => (s.id === id ? { ...s, itemLimit: Math.max(1, limit) } : s))
    );
    setHasUnsavedChanges(true);
  };

  const handleTitleChange = (id: string, customTitle: string) => {
    setSections(prev =>
      prev.map(s => (s.id === id ? { ...s, customTitle } : s))
    );
    setHasUnsavedChanges(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white font-cinzel tracking-wide">Homepage Builder & CMS</h1>
            {hasUnsavedChanges && (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                UNSAVED DRAFT
              </span>
            )}
          </div>
          <p className="text-xs text-muted mt-1">
            Visually arrange, toggle, customize item counts, and configure real-time hero showcases for the public Max Cinema website.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => saveMutation.mutate(false)}
            disabled={saveMutation.isPending}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#181818] border border-[#2e2e2e] text-gray-200 hover:text-white transition-all flex items-center gap-1.5"
          >
            <Save size={14} />
            <span>Save Draft</span>
          </button>

          <button
            onClick={() => saveMutation.mutate(true)}
            disabled={saveMutation.isPending}
            className="px-4 py-2 rounded-xl text-xs font-semibold btn-gold flex items-center gap-1.5 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)', color: '#070707' }}
          >
            <Globe size={14} />
            <span>Publish to Live Site</span>
          </button>
        </div>
      </div>

      {/* Hero Movie Spotlight Configuration */}
      <div
        className="p-5 rounded-2xl space-y-4"
        style={{ backgroundColor: '#121212', border: '1px solid #242424' }}
      >
        <div className="flex items-center justify-between border-b border-[#242424] pb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-gold" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Hero Spotlight Movie</h2>
          </div>
          <span className="text-[11px] text-muted">Pinned top billboard showcase</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-muted font-medium mb-1">Headline Title</label>
            <input
              type="text"
              placeholder="e.g. Dune: Part Two"
              value={heroTitle}
              onChange={(e) => { setHeroTitle(e.target.value); setHasUnsavedChanges(true); }}
              className="w-full px-3 py-2 rounded-lg bg-[#0D0D0D] border border-[#242424] text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-muted font-medium mb-1">Target Media ID (Movie / TV)</label>
            <input
              type="text"
              placeholder="e.g. cly... (Content ID)"
              value={heroMediaId}
              onChange={(e) => { setHeroMediaId(e.target.value); setHasUnsavedChanges(true); }}
              className="w-full px-3 py-2 rounded-lg bg-[#0D0D0D] border border-[#242424] text-white font-mono focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-muted font-medium mb-1">Backdrop Image URL</label>
            <input
              type="text"
              placeholder="https://image.tmdb.org/t/p/original/..."
              value={heroBackdrop}
              onChange={(e) => { setHeroBackdrop(e.target.value); setHasUnsavedChanges(true); }}
              className="w-full px-3 py-2 rounded-lg bg-[#0D0D0D] border border-[#242424] text-white focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-muted font-medium mb-1">Tagline / Synopsis</label>
            <textarea
              rows={2}
              placeholder="Hero synopsis text..."
              value={heroDescription}
              onChange={(e) => { setHeroDescription(e.target.value); setHasUnsavedChanges(true); }}
              className="w-full px-3 py-2 rounded-lg bg-[#0D0D0D] border border-[#242424] text-white focus:outline-none resize-none"
            />
          </div>
        </div>
      </div>

      {/* Sections Stack */}
      <div
        className="p-5 rounded-2xl space-y-4"
        style={{ backgroundColor: '#121212', border: '1px solid #242424' }}
      >
        <div className="flex items-center justify-between border-b border-[#242424] pb-3">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-gold" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Homepage Sections & Order</h2>
          </div>
          <span className="text-[11px] text-muted">Use arrows to reorder, eye to toggle visibility</span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-muted">
            <Loader2 size={16} className="animate-spin text-gold mx-auto mb-2" />
            <span>Loading layout configuration...</span>
          </div>
        ) : (
          <div className="space-y-2.5">
            {sections.map((section, idx) => (
              <div
                key={section.id}
                className="p-3.5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all"
                style={{
                  backgroundColor: section.enabled ? '#171717' : '#0D0D0D',
                  border: section.enabled ? '1px solid #2e2e2e' : '1px solid #1c1c1c',
                  borderLeft: section.enabled ? '3px solid #D4AF37' : '3px solid #333333',
                  opacity: section.enabled ? 1 : 0.6,
                }}
              >
                {/* Left: Reorder & Name */}
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, 'UP')}
                      className="p-1 rounded bg-[#202020] text-muted hover:text-white disabled:opacity-20 transition-colors"
                      title="Move Up"
                    >
                      <ChevronUp size={12} />
                    </button>
                    <button
                      type="button"
                      disabled={idx === sections.length - 1}
                      onClick={() => handleMove(idx, 'DOWN')}
                      className="p-1 rounded bg-[#202020] text-muted hover:text-white disabled:opacity-20 transition-colors"
                      title="Move Down"
                    >
                      <ChevronDown size={12} />
                    </button>
                  </div>

                  <span className="font-mono text-[11px] text-gold/70 w-5">#{idx + 1}</span>

                  <div>
                    <span className="text-xs font-semibold text-white">{section.name}</span>
                    <span className="text-[10px] text-muted ml-2 font-mono uppercase">[{section.type}]</span>
                  </div>
                </div>

                {/* Right: Custom Title, Limit & Toggle */}
                <div className="flex items-center gap-3 text-xs">
                  <input
                    type="text"
                    placeholder="Custom section title"
                    value={section.customTitle || ''}
                    onChange={(e) => handleTitleChange(section.id, e.target.value)}
                    className="px-2.5 py-1 rounded bg-[#0D0D0D] border border-[#242424] text-white text-xs w-44 focus:outline-none"
                  />

                  <div className="flex items-center gap-1.5 text-muted">
                    <span className="text-[11px]">Limit:</span>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={section.itemLimit}
                      onChange={(e) => handleLimitChange(section.id, parseInt(e.target.value) || 1)}
                      className="w-14 px-2 py-1 rounded bg-[#0D0D0D] border border-[#242424] text-white font-mono text-center focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggle(section.id)}
                    className="p-2 rounded-lg border transition-colors"
                    style={{
                      backgroundColor: section.enabled ? 'rgba(212,175,55,0.15)' : '#0D0D0D',
                      borderColor: section.enabled ? '#D4AF37' : '#242424',
                      color: section.enabled ? '#D4AF37' : '#666666',
                    }}
                    title={section.enabled ? 'Visible on site' : 'Hidden on site'}
                  >
                    <Eye size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
