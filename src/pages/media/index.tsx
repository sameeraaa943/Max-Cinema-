// File: src/pages/media/index.tsx
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Image, Upload, Trash2, Search, Grid, List, ExternalLink, Copy, Loader2, X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { mediaApi } from '../../services/api';

const cardStyle: React.CSSProperties = {
  background: '#121212', border: '1px solid #242424', borderRadius: 12, overflow: 'hidden', position: 'relative',
};
const btnGold: React.CSSProperties = {
  background: 'linear-gradient(135deg, #D4AF37, #C5A028)', color: '#070707', border: 'none',
  borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
};
const btnGhost: React.CSSProperties = {
  background: 'transparent', color: '#8A8A8A', border: '1px solid #242424',
  borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
};
const inputStyle: React.CSSProperties = {
  background: '#121212', border: '1px solid #242424', borderRadius: 8, color: '#fff',
  padding: '8px 12px', fontSize: 14, outline: 'none', width: '100%',
};

const TYPE_COLORS: Record<string, string> = {
  IMAGE: '#2563eb', VIDEO: '#7c3aed', DOCUMENT: '#d97706', OTHER: '#6b7280',
};
const TYPES = ['ALL', 'IMAGE', 'VIDEO', 'DOCUMENT', 'OTHER'];

export default function MediaLibraryPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Add modal state
  const [form, setForm] = useState({ filename: '', url: '', type: 'IMAGE', alt: '', description: '' });

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ['media', debouncedSearch, typeFilter, page],
    queryFn: () => mediaApi.list({ search: debouncedSearch || undefined, type: typeFilter === 'ALL' ? undefined : typeFilter, page, limit: 20 }).then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => mediaApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['media'] }); toast.success('Asset deleted'); },
    onError: () => toast.error('Failed to delete asset'),
  });

  const createMutation = useMutation({
    mutationFn: () => mediaApi.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['media'] }); toast.success('Asset added'); setShowModal(false); setForm({ filename: '', url: '', type: 'IMAGE', alt: '', description: '' }); },
    onError: () => toast.error('Failed to add asset'),
  });

  const items: any[] = data?.data || [];
  const total: number = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  const copyUrl = (url: string) => { navigator.clipboard.writeText(url); toast.success('URL copied!'); };

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image size={28} color="#D4AF37" />
          <div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, fontFamily: 'Cinzel, serif' }}>Media Library</h1>
            <p style={{ color: '#8A8A8A', fontSize: 13, marginTop: 2 }}>Manage posters, backdrops, logos and other assets</p>
          </div>
        </div>
        <button style={btnGold} onClick={() => setShowModal(true)}>
          <Plus size={16} /> Upload Media
        </button>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} color="#8A8A8A" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            style={{ ...inputStyle, paddingLeft: 32 }}
            placeholder="Search assets..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {TYPES.map(t => (
            <button key={t} onClick={() => { setTypeFilter(t); setPage(1); }} style={{
              background: typeFilter === t ? '#D4AF37' : '#121212',
              color: typeFilter === t ? '#070707' : '#8A8A8A',
              border: '1px solid #242424', borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600,
            }}>{t}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => setView('grid')} style={{ ...btnGhost, padding: '8px 10px', color: view === 'grid' ? '#D4AF37' : '#8A8A8A', borderColor: view === 'grid' ? '#D4AF37' : '#242424' }}><Grid size={16} /></button>
          <button onClick={() => setView('list')} style={{ ...btnGhost, padding: '8px 10px', color: view === 'list' ? '#D4AF37' : '#8A8A8A', borderColor: view === 'list' ? '#D4AF37' : '#242424' }}><List size={16} /></button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
          <Loader2 size={32} color="#D4AF37" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && items.length === 0 && (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <Image size={48} color="#242424" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: '#8A8A8A' }}>No media assets. Click Upload Media to add your first asset.</p>
        </div>
      )}

      {/* Grid View */}
      {!isLoading && items.length > 0 && view === 'grid' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
          {items.map((item: any) => (
            <div
              key={item.id}
              style={cardStyle}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div style={{ height: 140, background: '#1a1a1a', overflow: 'hidden', position: 'relative' }}>
                {item.type === 'IMAGE' ? (
                  <img src={item.url} alt={item.alt || item.filename} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Image size={40} color="#242424" />
                  </div>
                )}
                {/* Hover overlay */}
                {hoveredId === item.id && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <button onClick={() => copyUrl(item.url)} style={{ ...btnGold, fontSize: 12, padding: '6px 12px' }}><Copy size={12} /> Copy URL</button>
                    <button onClick={() => window.open(item.url, '_blank')} style={{ ...btnGhost, fontSize: 12, padding: '6px 12px' }}><ExternalLink size={12} /> Open</button>
                    <button onClick={() => deleteMutation.mutate(item.id)} style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444', border: '1px solid #ef4444', borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><Trash2 size={12} /> Delete</button>
                  </div>
                )}
              </div>
              <div style={{ padding: 10 }}>
                <span style={{ background: TYPE_COLORS[item.type] || '#6b7280', color: '#fff', borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 700 }}>{item.type}</span>
                <p style={{ color: '#fff', fontSize: 12, marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.filename}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {!isLoading && items.length > 0 && view === 'list' && (
        <div style={cardStyle}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #242424' }}>
                {['Preview', 'Filename', 'Type', 'URL', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: '#8A8A8A', fontSize: 12, fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item: any) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                  <td style={{ padding: '10px 16px' }}>
                    {item.type === 'IMAGE'
                      ? <img src={item.url} alt={item.filename} style={{ width: 48, height: 36, objectFit: 'cover', borderRadius: 4 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      : <div style={{ width: 48, height: 36, background: '#1a1a1a', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Image size={16} color="#242424" /></div>
                    }
                  </td>
                  <td style={{ padding: '10px 16px', color: '#fff', fontSize: 13 }}>{item.filename}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ background: TYPE_COLORS[item.type] || '#6b7280', color: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{item.type}</span>
                  </td>
                  <td style={{ padding: '10px 16px', color: '#8A8A8A', fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.url}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => copyUrl(item.url)} style={{ ...btnGhost, padding: '4px 8px', fontSize: 11 }}><Copy size={12} /></button>
                      <button onClick={() => window.open(item.url, '_blank')} style={{ ...btnGhost, padding: '4px 8px', fontSize: 11 }}><ExternalLink size={12} /></button>
                      <button onClick={() => deleteMutation.mutate(item.id)} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', marginTop: 24 }}>
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ ...btnGhost, opacity: page === 1 ? 0.4 : 1 }}>Previous</button>
          <span style={{ color: '#8A8A8A', fontSize: 13 }}>Page {page} of {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={{ ...btnGhost, opacity: page === totalPages ? 0.4 : 1 }}>Next</button>
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ ...cardStyle, width: '100%', maxWidth: 500, padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>Add Media Asset</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#8A8A8A', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Filename *', key: 'filename', placeholder: 'poster.jpg' },
                { label: 'URL *', key: 'url', placeholder: 'https://...' },
                { label: 'Alt Text', key: 'alt', placeholder: 'Alternative text' },
                { label: 'Description', key: 'description', placeholder: 'Optional description' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label style={{ color: '#8A8A8A', fontSize: 12, display: 'block', marginBottom: 4 }}>{label}</label>
                  <input style={inputStyle} placeholder={placeholder} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
              <div>
                <label style={{ color: '#8A8A8A', fontSize: 12, display: 'block', marginBottom: 4 }}>Type</label>
                <select style={{ ...inputStyle }} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {['IMAGE', 'VIDEO', 'DOCUMENT', 'OTHER'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            {form.url && form.type === 'IMAGE' && (
              <div style={{ marginTop: 12 }}>
                <img src={form.url} alt="preview" style={{ maxHeight: 120, borderRadius: 8, objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => setShowModal(false)} style={{ ...btnGhost, flex: 1, justifyContent: 'center' }}>Cancel</button>
              <button
                onClick={() => createMutation.mutate()}
                disabled={!form.filename || !form.url || createMutation.isPending}
                style={{ ...btnGold, flex: 1, justifyContent: 'center', opacity: (!form.filename || !form.url) ? 0.5 : 1 }}
              >
                {createMutation.isPending ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={14} />}
                Add Asset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
