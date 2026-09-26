// File: src/pages/homepage-builder/index.tsx
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout, Eye, EyeOff, Save, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { homepageApi } from '../../services/api';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';

interface SectionConfig {
  key: string; label: string; enabled: boolean; itemCount?: number; description?: string;
}

const SECTION_META: Record<string, { icon: string; description: string }> = {
  HERO_BANNER:    { icon: '🎬', description: 'Main hero section with featured content' },
  TRENDING:       { icon: '🔥', description: 'Hottest content right now' },
  FEATURED:       { icon: '⭐', description: 'Editor\'s pick content' },
  NEW_RELEASES:   { icon: '🆕', description: 'Latest added movies & shows' },
  POPULAR_MOVIES: { icon: '🎥', description: 'Most viewed movies' },
  POPULAR_TV:     { icon: '📺', description: 'Most viewed TV shows' },
  COLLECTIONS:    { icon: '📚', description: 'Curated content collections' },
  CUSTOM:         { icon: '✨', description: 'Custom content section' },
};

const DEFAULT_SECTIONS: SectionConfig[] = [
  { key: 'HERO_BANNER', label: 'Hero Banner', enabled: true, itemCount: 1 },
  { key: 'TRENDING', label: 'Trending', enabled: true, itemCount: 10 },
  { key: 'FEATURED', label: 'Featured', enabled: true, itemCount: 8 },
  { key: 'NEW_RELEASES', label: 'New Releases', enabled: true, itemCount: 10 },
  { key: 'POPULAR_MOVIES', label: 'Popular Movies', enabled: true, itemCount: 10 },
  { key: 'POPULAR_TV', label: 'Popular TV Shows', enabled: true, itemCount: 10 },
  { key: 'COLLECTIONS', label: 'Collections', enabled: false, itemCount: 6 },
];

export default function HomepageBuilderPage() {
  const queryClient = useQueryClient();
  const [sections, setSections] = useState<SectionConfig[]>(DEFAULT_SECTIONS);
  const [siteTitle, setSiteTitle] = useState('CineScope');
  const [tagline, setTagline] = useState('Your Ultimate Movie & TV Destination');
  const [heroStyle, setHeroStyle] = useState<'FULL' | 'SPLIT' | 'MINIMAL'>('FULL');
  const [hasChanges, setHasChanges] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['homepage'],
    queryFn: () => homepageApi.get().then(r => r.data),
  });

  useEffect(() => {
    if (data?.data) {
      const d = data.data;
      if (d.sections?.length) setSections(d.sections);
      if (d.siteTitle) setSiteTitle(d.siteTitle);
      if (d.tagline) setTagline(d.tagline);
      if (d.heroStyle) setHeroStyle(d.heroStyle);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () => homepageApi.update({ sections, siteTitle, tagline, heroStyle }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homepage'] });
      toast.success('Homepage saved and published!');
      setHasChanges(false);
    },
    onError: () => toast.error('Failed to save homepage'),
  });

  const markChanged = () => setHasChanges(true);

  const toggleSection = (key: string) => {
    setSections(prev => prev.map(s => s.key === key ? { ...s, enabled: !s.enabled } : s));
    markChanged();
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...sections];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newSections.length) return;
    [newSections[index], newSections[swapIndex]] = [newSections[swapIndex], newSections[index]];
    setSections(newSections);
    markChanged();
  };

  const updateItemCount = (key: string, count: number) => {
    setSections(prev => prev.map(s => s.key === key ? { ...s, itemCount: count } : s));
    markChanged();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-cinzel tracking-wide flex items-center gap-2">
            <Layout size={22} style={{ color: '#D4AF37' }} /> Homepage Builder
            {hasChanges && <span className="text-sm font-normal" style={{ color: '#D4AF37' }}>● Unsaved changes</span>}
          </h1>
          <p className="text-xs mt-1" style={{ color: '#8A8A8A' }}>Drag sections to reorder — changes are published immediately when saved</p>
        </div>
        <button onClick={() => saveMutation.mutate()} disabled={!hasChanges || saveMutation.isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold disabled:opacity-50 self-start"
          style={{ background: hasChanges ? 'linear-gradient(135deg, #D4AF37, #C5A028)' : '#1A1A1A', color: hasChanges ? '#070707' : '#555', border: hasChanges ? 'none' : '1px solid #242424' }}>
          {saveMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          Save Changes
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3"><LoadingSkeleton lines={5} height="72px" /></div>
      ) : (
        <>
          {/* Site Settings */}
          <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#121212', border: '1px solid #242424' }}>
            <h2 className="text-sm font-semibold text-white">Site Settings</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#8A8A8A' }}>Site Title</label>
                <input type="text" value={siteTitle} onChange={e => { setSiteTitle(e.target.value); markChanged(); }}
                  className="w-full px-3 py-2 rounded-lg text-xs focus:outline-none"
                  style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFF' }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#8A8A8A' }}>Tagline</label>
                <input type="text" value={tagline} onChange={e => { setTagline(e.target.value); markChanged(); }}
                  className="w-full px-3 py-2 rounded-lg text-xs focus:outline-none"
                  style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFF' }} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: '#8A8A8A' }}>Hero Style</label>
              <div className="flex gap-2">
                {(['FULL', 'SPLIT', 'MINIMAL'] as const).map(style => (
                  <button key={style} onClick={() => { setHeroStyle(style); markChanged(); }}
                    className="px-4 py-2 rounded-lg text-xs font-medium"
                    style={{ backgroundColor: heroStyle === style ? '#D4AF37' : '#1A1A1A', color: heroStyle === style ? '#070707' : '#8A8A8A', border: `1px solid ${heroStyle === style ? '#D4AF37' : '#242424'}` }}>
                    {style}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-white px-1">Homepage Sections</h2>
            <p className="text-xs px-1" style={{ color: '#8A8A8A' }}>Use the arrows to reorder. Toggle the eye to show/hide on your public site.</p>

            <div className="space-y-2">
              {sections.map((section, index) => {
                const meta = SECTION_META[section.key] || { icon: '📄', description: '' };
                return (
                  <div key={section.key} className="rounded-xl p-4 transition-all"
                    style={{ backgroundColor: '#121212', border: `1px solid ${section.enabled ? '#2A2A1A' : '#242424'}`, borderLeft: `3px solid ${section.enabled ? '#D4AF37' : '#333'}` }}>
                    <div className="flex items-center gap-3">
                      {/* Move buttons */}
                      <div className="flex flex-col gap-0.5">
                        <button onClick={() => moveSection(index, 'up')} disabled={index === 0}
                          className="p-0.5 rounded disabled:opacity-20" style={{ color: '#8A8A8A' }}>
                          <ChevronUp size={14} />
                        </button>
                        <button onClick={() => moveSection(index, 'down')} disabled={index === sections.length - 1}
                          className="p-0.5 rounded disabled:opacity-20" style={{ color: '#8A8A8A' }}>
                          <ChevronDown size={14} />
                        </button>
                      </div>

                      {/* Icon + Info */}
                      <div className="text-xl w-8 flex-shrink-0">{meta.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium" style={{ color: section.enabled ? '#FFF' : '#666' }}>{section.label}</span>
                          {section.enabled ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: '#1A2E00', color: '#86EFAC' }}>VISIBLE</span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: '#1A1A1A', color: '#555' }}>HIDDEN</span>
                          )}
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: '#8A8A8A' }}>{meta.description}</p>
                      </div>

                      {/* Item count */}
                      {section.key !== 'HERO_BANNER' && (
                        <div className="hidden sm:flex items-center gap-2">
                          <label className="text-[10px]" style={{ color: '#8A8A8A' }}>Items:</label>
                          <input type="number" min={1} max={50} value={section.itemCount || 10}
                            onChange={e => updateItemCount(section.key, Number(e.target.value))}
                            className="w-14 px-2 py-1 rounded text-xs text-center focus:outline-none"
                            style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#CCC' }} />
                        </div>
                      )}

                      {/* Toggle */}
                      <button onClick={() => toggleSection(section.key)}
                        className="p-2 rounded-lg transition-colors"
                        style={{ backgroundColor: section.enabled ? '#1A2E00' : '#1A1A1A', color: section.enabled ? '#86EFAC' : '#555', border: `1px solid ${section.enabled ? '#2D5016' : '#242424'}` }}>
                        {section.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Save Button (bottom) */}
          <div className="flex justify-end pb-8">
            <button onClick={() => saveMutation.mutate()} disabled={!hasChanges || saveMutation.isPending}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold disabled:opacity-50"
              style={{ background: hasChanges ? 'linear-gradient(135deg, #D4AF37, #C5A028)' : '#1A1A1A', color: hasChanges ? '#070707' : '#555', border: hasChanges ? 'none' : '1px solid #242424' }}>
              {saveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save & Publish
            </button>
          </div>
        </>
      )}
    </div>
  );
}
