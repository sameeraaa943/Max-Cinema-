// File: src/pages/homepage-builder/index.tsx
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout, Save, Eye, EyeOff, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { homepageApi } from '../../services/api';

const cardStyle: React.CSSProperties = { background: '#121212', border: '1px solid #242424', borderRadius: 12 };
const btnGold: React.CSSProperties = {
  background: 'linear-gradient(135deg, #D4AF37, #C5A028)', color: '#070707', border: 'none',
  borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
};
const btnGhost: React.CSSProperties = {
  background: 'transparent', color: '#8A8A8A', border: '1px solid #242424',
  borderRadius: 8, padding: '6px 12px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
};
const inputStyle: React.CSSProperties = {
  background: '#0a0a0a', border: '1px solid #242424', borderRadius: 8, color: '#fff',
  padding: '8px 12px', fontSize: 14, outline: 'none', width: '100%',
};

const SECTION_ICONS: Record<string, string> = {
  HERO_BANNER: '🎬',
  FEATURED: '⭐',
  TRENDING: '🔥',
  NEW_RELEASES: '🆕',
  LATEST_MOVIES: '🎬',
  LATEST_TV: '📺',
  POPULAR_MOVIES: '🎞️',
  POPULAR_TV: '📡',
  COLLECTIONS: '📚',
  CUSTOM: '✨',
};

const SECTION_LABELS: Record<string, string> = {
  HERO_BANNER: 'Hero Banner',
  FEATURED: 'Featured Content',
  TRENDING: 'Trending Now',
  NEW_RELEASES: 'New Releases',
  LATEST_MOVIES: 'Latest Movies',
  LATEST_TV: 'Latest TV Shows',
  POPULAR_MOVIES: 'Popular Movies',
  POPULAR_TV: 'Popular TV Shows',
  COLLECTIONS: 'Collections',
  CUSTOM: 'Custom Section',
};

export default function HomepageBuilderPage() {
  const qc = useQueryClient();
  const [sections, setSections] = useState<any[]>([]);
  const [siteTitle, setSiteTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [heroStyle, setHeroStyle] = useState('FULL');
  const [isDirty, setIsDirty] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['homepage'],
    queryFn: () => homepageApi.get().then(r => r.data.data),
  });

  useEffect(() => {
    if (data) {
      setSections(data.sections || []);
      setSiteTitle(data.siteTitle || '');
      setTagline(data.tagline || '');
      setHeroStyle(data.heroStyle || 'FULL');
      setIsDirty(false);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () => homepageApi.update({ sections, siteTitle, tagline, heroStyle }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['homepage'] }); toast.success('Homepage settings saved!'); setIsDirty(false); },
    onError: () => toast.error('Failed to save homepage settings'),
  });

  const toggleSection = (idx: number) => {
    setSections(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], enabled: !updated[idx].enabled };
      return updated;
    });
    setIsDirty(true);
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    setSections(prev => {
      const updated = [...prev];
      [updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]];
      return updated;
    });
    setIsDirty(true);
  };

  const moveDown = (idx: number) => {
    if (idx === sections.length - 1) return;
    setSections(prev => {
      const updated = [...prev];
      [updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]];
      return updated;
    });
    setIsDirty(true);
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Layout size={28} color="#D4AF37" />
          <div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, fontFamily: 'Cinzel, serif' }}>
              Homepage Builder {isDirty && <span style={{ color: '#D4AF37', fontSize: 16 }}>*</span>}
            </h1>
            <p style={{ color: '#8A8A8A', fontSize: 13, marginTop: 2 }}>Reorder and toggle sections on your public website</p>
          </div>
        </div>
        <button style={{ ...btnGold, opacity: saveMutation.isPending ? 0.7 : 1 }} onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
          Save Changes
        </button>
      </div>

      {isLoading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
          <Loader2 size={32} color="#D4AF37" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      )}

      {!isLoading && (
        <>
          <div style={{ ...cardStyle, padding: 24, marginBottom: 24 }}>
            <h2 style={{ color: '#D4AF37', fontSize: 14, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Site Settings</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ color: '#8A8A8A', fontSize: 12, display: 'block', marginBottom: 6 }}>Site Title</label>
                <input style={inputStyle} value={siteTitle} onChange={e => { setSiteTitle(e.target.value); setIsDirty(true); }} placeholder="CineScope" />
              </div>
              <div>
                <label style={{ color: '#8A8A8A', fontSize: 12, display: 'block', marginBottom: 6 }}>Tagline</label>
                <input style={inputStyle} value={tagline} onChange={e => { setTagline(e.target.value); setIsDirty(true); }} placeholder="Your streaming destination" />
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <label style={{ color: '#8A8A8A', fontSize: 12, display: 'block', marginBottom: 8 }}>Hero Style</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['FULL', 'SPLIT', 'COMPACT'].map(style => (
                  <button
                    key={style}
                    onClick={() => { setHeroStyle(style); setIsDirty(true); }}
                    style={{
                      background: heroStyle === style ? 'rgba(212,175,55,0.15)' : '#0a0a0a',
                      color: heroStyle === style ? '#D4AF37' : '#8A8A8A',
                      border: `1px solid ${heroStyle === style ? '#D4AF37' : '#242424'}`,
                      borderRadius: 6, padding: '6px 14px', fontSize: 12, cursor: 'pointer', fontWeight: 600,
                    }}
                  >{style}</button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ ...cardStyle, overflow: 'hidden', marginBottom: 24 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #242424' }}>
              <h2 style={{ color: '#D4AF37', fontSize: 14, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Page Sections</h2>
              <p style={{ color: '#8A8A8A', fontSize: 12, marginTop: 2 }}>Use the arrows to reorder sections, toggle the eye to show/hide</p>
            </div>

            {sections.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: '#8A8A8A' }}>No sections configured</div>
            )}

            {sections.map((section: any, idx: number) => (
              <div
                key={section.id || idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '14px 20px',
                  borderBottom: '1px solid #1a1a1a',
                  borderLeft: `3px solid ${section.enabled ? '#D4AF37' : '#242424'}`,
                  background: section.enabled ? 'rgba(212,175,55,0.03)' : 'transparent',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 20 }}>{SECTION_ICONS[section.type] || '📄'}</span>
                  <div>
                    <div style={{ color: section.enabled ? '#fff' : '#6b7280', fontWeight: 600, fontSize: 14 }}>
                      {section.title || SECTION_LABELS[section.type] || section.type}
                    </div>
                    <div style={{ color: '#8A8A8A', fontSize: 11, marginTop: 1 }}>
                      {section.type} {section.itemCount ? `· ${section.itemCount} items` : ''}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    onClick={() => moveUp(idx)}
                    disabled={idx === 0}
                    style={{ ...btnGhost, padding: '4px 8px', opacity: idx === 0 ? 0.3 : 1 }}
                    title="Move Up"
                  ><ChevronUp size={14} /></button>
                  <button
                    onClick={() => moveDown(idx)}
                    disabled={idx === sections.length - 1}
                    style={{ ...btnGhost, padding: '4px 8px', opacity: idx === sections.length - 1 ? 0.3 : 1 }}
                    title="Move Down"
                  ><ChevronDown size={14} /></button>
                  <button
                    onClick={() => toggleSection(idx)}
                    style={{
                      background: section.enabled ? 'rgba(212,175,55,0.1)' : 'rgba(107,114,128,0.1)',
                      color: section.enabled ? '#D4AF37' : '#6b7280',
                      border: `1px solid ${section.enabled ? 'rgba(212,175,55,0.3)' : '#242424'}`,
                      borderRadius: 6, padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12,
                    }}
                    title={section.enabled ? 'Hide section' : 'Show section'}
                  >
                    {section.enabled ? <Eye size={13} /> : <EyeOff size={13} />}
                    {section.enabled ? 'Visible' : 'Hidden'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {isDirty && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button style={btnGhost} onClick={() => { if (data) { setSections(data.sections || []); setSiteTitle(data.siteTitle || ''); setTagline(data.tagline || ''); setHeroStyle(data.heroStyle || 'FULL'); setIsDirty(false); } }}>
                Discard Changes
              </button>
              <button style={btnGold} onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
                Save Changes
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
