import React, { useState } from 'react';
import { Search, CheckCircle, AlertCircle, Edit2, X, Loader2 } from 'lucide-react';
import { seoApi, moviesApi, tvShowsApi } from '../../services/api';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function SeoPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'MOVIES' | 'TV'>('MOVIES');
  const [page, setPage] = useState(1);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Modal form state
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [ogImage, setOgImage] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [noIndex, setNoIndex] = useState(false);

  const { data: coverageData } = useQuery({
    queryKey: ['seo-coverage'],
    queryFn: async () => {
      const res = await seoApi.getCoverage();
      return res.data?.data || { coveragePercent: 0, total: 0, withSeo: 0, withoutSeo: 0 };
    },
  });

  const { data: contentData, isLoading } = useQuery({
    queryKey: ['seo-content', tab, page],
    queryFn: async () => {
      if (tab === 'MOVIES') {
        const res = await moviesApi.list({ page, limit: 20 });
        return res.data?.data || { movies: [], total: 0 };
      } else {
        const res = await tvShowsApi.list({ page, limit: 20 });
        return res.data?.data || { tvShows: [], total: 0 };
      }
    },
  });

  const items = tab === 'MOVIES' ? contentData?.movies || [] : contentData?.tvShows || [];

  const openEditor = async (item: any) => {
    setEditingItem(item);
    try {
      const res = await seoApi.get(tab === 'MOVIES' ? 'movie' : 'tvshow', item.id);
      const seo = res.data?.data;
      if (seo) {
        setMetaTitle(seo.metaTitle || '');
        setMetaDescription(seo.metaDescription || '');
        setKeywords(seo.keywords?.join(', ') || '');
        setOgImage(seo.ogImage || '');
        setCanonicalUrl(seo.canonicalUrl || '');
        setNoIndex(seo.noIndex || false);
      } else {
        setMetaTitle(item.title || '');
        setMetaDescription(item.description?.substring(0, 160) || '');
        setKeywords(''); setOgImage(item.posterUrl || ''); setCanonicalUrl(''); setNoIndex(false);
      }
    } catch (e) {
      setMetaTitle(item.title || '');
      setMetaDescription(item.description?.substring(0, 160) || '');
      setKeywords(''); setOgImage(item.posterUrl || ''); setCanonicalUrl(''); setNoIndex(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: (data: any) => seoApi.save(tab === 'MOVIES' ? 'movie' : 'tvshow', editingItem.id, data),
    onSuccess: () => {
      toast.success('SEO metadata saved');
      queryClient.invalidateQueries({ queryKey: ['seo-coverage'] });
      setEditingItem(null);
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      metaTitle,
      metaDescription,
      keywords: keywords.split(',').map(k => k.trim()).filter(k => k),
      ogImage,
      canonicalUrl,
      noIndex
    });
  };

  return (
    <div style={{ padding: '24px', color: '#fff', backgroundColor: '#070707', minHeight: '100vh' }}>
      <header style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Search size={32} color="#D4AF37" />
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#fff' }}>SEO Management</h1>
          <p style={{ margin: 0, color: '#8A8A8A', fontSize: '14px' }}>Optimize metadata for search engines</p>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '16px', backgroundColor: '#121212', borderRadius: '8px', border: '1px solid #242424', padding: '16px', marginBottom: '24px', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 24px', borderRight: '1px solid #242424' }}>
          <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#D4AF37' }}>{coverageData?.coveragePercent || 0}%</span>
          <span style={{ fontSize: '12px', color: '#8A8A8A' }}>SEO Coverage</span>
        </div>
        <div style={{ display: 'flex', gap: '32px', paddingLeft: '16px' }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{coverageData?.total || 0}</div>
            <div style={{ fontSize: '12px', color: '#8A8A8A' }}>Total Content</div>
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#4ade80' }}>{coverageData?.withSeo || 0}</div>
            <div style={{ fontSize: '12px', color: '#8A8A8A' }}>Optimized</div>
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f87171' }}>{coverageData?.withoutSeo || 0}</div>
            <div style={{ fontSize: '12px', color: '#8A8A8A' }}>Missing SEO</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid #242424', marginBottom: '24px' }}>
        <button onClick={() => { setTab('MOVIES'); setPage(1); }} style={{ background: 'none', border: 'none', color: tab === 'MOVIES' ? '#D4AF37' : '#8A8A8A', padding: '12px 16px', cursor: 'pointer', borderBottom: tab === 'MOVIES' ? '2px solid #D4AF37' : '2px solid transparent', fontWeight: tab === 'MOVIES' ? 'bold' : 'normal' }}>Movies</button>
        <button onClick={() => { setTab('TV'); setPage(1); }} style={{ background: 'none', border: 'none', color: tab === 'TV' ? '#D4AF37' : '#8A8A8A', padding: '12px 16px', cursor: 'pointer', borderBottom: tab === 'TV' ? '2px solid #D4AF37' : '2px solid transparent', fontWeight: tab === 'TV' ? 'bold' : 'normal' }}>TV Shows</button>
      </div>

      <div style={{ backgroundColor: '#121212', borderRadius: '8px', border: '1px solid #242424', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #242424', color: '#8A8A8A', fontSize: '12px' }}>
              <th style={{ padding: '12px' }}>Content</th>
              <th style={{ padding: '12px' }}>Status</th>
              <th style={{ padding: '12px' }}>Meta Title</th>
              <th style={{ padding: '12px' }}>Meta Description</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '24px' }}><Loader2 className="spin" /></td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: '#8A8A8A' }}>No content found</td></tr>
            ) : (
              items.map((item: any) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #242424' }}>
                  <td style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '60px', background: '#242424', borderRadius: '4px', overflow: 'hidden' }}>
                      {item.posterUrl && <img src={item.posterUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                    <div style={{ fontWeight: 'bold' }}>{item.title}</div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {item.hasSeo ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                        <CheckCircle size={12} /> Optimized
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(248, 113, 113, 0.1)', color: '#f87171', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                        <AlertCircle size={12} /> Missing
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px', color: '#8A8A8A', fontSize: '14px' }}>{item.seoTitle || '-'}</td>
                  <td style={{ padding: '12px', color: '#8A8A8A', fontSize: '14px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.seoDescription || '-'}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <button onClick={() => openEditor(item)} style={{ background: '#242424', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Edit2 size={14} /> Edit SEO
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #242424' }}>
          <span style={{ fontSize: '12px', color: '#8A8A8A' }}>Page {page}</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ padding: '6px 12px', background: '#242424', border: 'none', color: '#fff', borderRadius: '4px', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>Prev</button>
            <button onClick={() => setPage(p => p + 1)} style={{ padding: '6px 12px', background: '#242424', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}>Next</button>
          </div>
        </div>
      </div>

      {editingItem && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#121212', width: '400px', height: '100%', borderLeft: '1px solid #242424', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #242424', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '18px' }}>Edit SEO for {editingItem.title}</h2>
              <button onClick={() => setEditingItem(null)} style={{ background: 'none', border: 'none', color: '#8A8A8A', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSave} style={{ padding: '24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                  <span>Meta Title</span>
                  <span style={{ color: metaTitle.length > 60 ? '#f87171' : '#8A8A8A' }}>{metaTitle.length}/60</span>
                </label>
                <input value={metaTitle} onChange={e => setMetaTitle(e.target.value)} style={{ width: '100%', background: '#070707', border: '1px solid #242424', padding: '10px', borderRadius: '6px', color: '#fff' }} />
              </div>
              
              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                  <span>Meta Description</span>
                  <span style={{ color: metaDescription.length > 160 ? '#f87171' : '#8A8A8A' }}>{metaDescription.length}/160</span>
                </label>
                <textarea rows={4} value={metaDescription} onChange={e => setMetaDescription(e.target.value)} style={{ width: '100%', background: '#070707', border: '1px solid #242424', padding: '10px', borderRadius: '6px', color: '#fff', resize: 'vertical' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Keywords (comma separated)</label>
                <input value={keywords} onChange={e => setKeywords(e.target.value)} style={{ width: '100%', background: '#070707', border: '1px solid #242424', padding: '10px', borderRadius: '6px', color: '#fff' }} placeholder="movie, action, scifi" />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>OG Image URL</label>
                <input value={ogImage} onChange={e => setOgImage(e.target.value)} style={{ width: '100%', background: '#070707', border: '1px solid #242424', padding: '10px', borderRadius: '6px', color: '#fff' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Canonical URL</label>
                <input value={canonicalUrl} onChange={e => setCanonicalUrl(e.target.value)} style={{ width: '100%', background: '#070707', border: '1px solid #242424', padding: '10px', borderRadius: '6px', color: '#fff' }} />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                  <input type="checkbox" checked={noIndex} onChange={e => setNoIndex(e.target.checked)} />
                  No Index (Hide from search engines)
                </label>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
                <button type="submit" disabled={saveMutation.isPending} style={{ width: '100%', padding: '12px', background: '#D4AF37', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                  {saveMutation.isPending ? 'Saving...' : 'Save SEO Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
