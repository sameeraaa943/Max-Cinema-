// File: src/pages/media/index.tsx
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Image, Upload, Trash2, Search, Grid, List, ExternalLink, Copy, Plus, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { mediaApi } from '../../services/api';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import EmptyState from '../../components/ui/EmptyState';

type ViewMode = 'grid' | 'list';
type MediaTypeFilter = 'ALL' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'OTHER';

const TYPE_COLORS: Record<string, string> = {
  IMAGE: '#3B82F6', VIDEO: '#8B5CF6', DOCUMENT: '#F59E0B', OTHER: '#6B7280',
};

interface MediaAsset {
  id: string; filename: string; url: string; type: string;
  alt?: string; description?: string; usageCount?: number;
  width?: number; height?: number; fileSize?: number; createdAt: string;
}

interface AddFormState {
  filename: string; url: string; type: string; alt: string; description: string;
}

export default function MediaPage() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [typeFilter, setTypeFilter] = useState<MediaTypeFilter>('ALL');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<AddFormState>({ filename: '', url: '', type: 'IMAGE', alt: '', description: '' });

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading } = useQuery({
    queryKey: ['media', { search, type: typeFilter, page }],
    queryFn: () => mediaApi.list({ search: search || undefined, type: typeFilter === 'ALL' ? undefined : typeFilter, page, limit: 20 }).then(r => r.data),
  });

  const assets: MediaAsset[] = data?.data?.items || [];
  const total = data?.data?.total || 0;
  const totalPages = data?.data?.totalPages || 1;

  const createMutation = useMutation({
    mutationFn: () => mediaApi.create({ filename: form.filename, url: form.url, type: form.type, alt: form.alt, description: form.description }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['media'] }); toast.success('Media asset added'); setShowAddModal(false); setForm({ filename: '', url: '', type: 'IMAGE', alt: '', description: '' }); },
    onError: () => toast.error('Failed to add media asset'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => mediaApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['media'] }); toast.success('Asset deleted'); setDeleteId(null); },
    onError: () => toast.error('Failed to delete asset'),
  });

  const copyUrl = (url: string) => { navigator.clipboard.writeText(url); toast.success('URL copied'); };

  const formatSize = (bytes?: number) => bytes ? `${(bytes / 1024).toFixed(1)} KB` : '—';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-cinzel tracking-wide flex items-center gap-2">
            <Image size={22} style={{ color: '#D4AF37' }} /> Media Library
          </h1>
          <p className="text-xs mt-1" style={{ color: '#8A8A8A' }}>Upload and manage images, videos, and documents</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setViewMode('grid')} className="p-2 rounded-lg" style={{ backgroundColor: viewMode === 'grid' ? '#D4AF37' : '#1A1A1A', color: viewMode === 'grid' ? '#070707' : '#8A8A8A', border: '1px solid #242424' }}><Grid size={16} /></button>
          <button onClick={() => setViewMode('list')} className="p-2 rounded-lg" style={{ backgroundColor: viewMode === 'list' ? '#D4AF37' : '#1A1A1A', color: viewMode === 'list' ? '#070707' : '#8A8A8A', border: '1px solid #242424' }}><List size={16} /></button>
          <button onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold" style={{ background: 'linear-gradient(135deg, #D4AF37, #C5A028)', color: '#070707' }}>
            <Plus size={15} /> Upload Media
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3" style={{ backgroundColor: '#121212', border: '1px solid #242424', borderRadius: 12, padding: '12px 16px' }}>
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8A8A8A' }} />
          <input type="text" placeholder="Search by filename..." value={searchInput} onChange={e => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg text-xs focus:outline-none" style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFF' }} />
        </div>
        <div className="flex gap-1 flex-wrap">
          {(['ALL', 'IMAGE', 'VIDEO', 'DOCUMENT', 'OTHER'] as MediaTypeFilter[]).map(t => (
            <button key={t} onClick={() => { setTypeFilter(t); setPage(1); }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ backgroundColor: typeFilter === t ? '#D4AF37' : '#1A1A1A', color: typeFilter === t ? '#070707' : '#8A8A8A', border: '1px solid #242424' }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#121212', border: '1px solid #242424' }}>
        {isLoading ? (
          <div className="p-6"><LoadingSkeleton lines={4} height="60px" /></div>
        ) : assets.length === 0 ? (
          <EmptyState title="No media assets" description="Click Upload Media to add your first asset." icon={Image} action={{ label: 'Upload Media', onClick: () => setShowAddModal(true) }} />
        ) : viewMode === 'grid' ? (
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {assets.map(asset => (
              <div key={asset.id} className="group relative rounded-xl overflow-hidden" style={{ backgroundColor: '#0D0D0D', border: '1px solid #1E1E1E', aspectRatio: '1' }}>
                {asset.type === 'IMAGE' ? (
                  <img src={asset.url} alt={asset.alt || asset.filename} className="w-full h-full object-cover" onError={e => (e.target as HTMLElement).style.display = 'none'} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ color: TYPE_COLORS[asset.type] || '#555' }}>
                    <Upload size={28} />
                  </div>
                )}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2" style={{ backgroundColor: 'rgba(7,7,7,0.85)' }}>
                  <span className="text-[10px] text-center px-1 truncate w-full text-white">{asset.filename}</span>
                  <div className="flex gap-1">
                    <button onClick={() => copyUrl(asset.url)} className="p-1.5 rounded" style={{ backgroundColor: '#1A1A1A', color: '#D4AF37' }}><Copy size={12} /></button>
                    <button onClick={() => window.open(asset.url, '_blank')} className="p-1.5 rounded" style={{ backgroundColor: '#1A1A1A', color: '#8A8A8A' }}><ExternalLink size={12} /></button>
                    <button onClick={() => setDeleteId(asset.id)} className="p-1.5 rounded" style={{ backgroundColor: '#3D0000', color: '#FF6666' }}><Trash2 size={12} /></button>
                  </div>
                </div>
                <div className="absolute top-1 left-1 px-1 py-0.5 rounded text-[9px] font-medium" style={{ backgroundColor: TYPE_COLORS[asset.type] || '#555', color: '#FFF' }}>{asset.type}</div>
              </div>
            ))}
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-wider border-b" style={{ backgroundColor: '#0D0D0D', color: '#8A8A8A', borderColor: '#242424' }}>
                <th className="py-3 px-4">Preview</th>
                <th className="py-3 px-4">Filename</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Usage</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y text-xs" style={{ borderColor: '#1F1F1F' }}>
              {assets.map(asset => (
                <tr key={asset.id} className="hover:bg-white/[0.02]">
                  <td className="py-2 px-4">
                    {asset.type === 'IMAGE' ? <img src={asset.url} alt={asset.filename} className="w-10 h-10 object-cover rounded" /> : <div className="w-10 h-10 rounded flex items-center justify-center" style={{ backgroundColor: '#1A1A1A', color: TYPE_COLORS[asset.type] || '#555' }}><Upload size={16} /></div>}
                  </td>
                  <td className="py-2 px-4 max-w-xs truncate" style={{ color: '#CCC' }}>{asset.filename}</td>
                  <td className="py-2 px-4"><span className="px-2 py-0.5 rounded text-[10px]" style={{ backgroundColor: TYPE_COLORS[asset.type] + '22', color: TYPE_COLORS[asset.type] }}>{asset.type}</span></td>
                  <td className="py-2 px-4" style={{ color: '#8A8A8A' }}>{formatSize(asset.fileSize)}</td>
                  <td className="py-2 px-4" style={{ color: '#8A8A8A' }}>{asset.usageCount ?? 0} uses</td>
                  <td className="py-2 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => copyUrl(asset.url)} className="p-1.5 rounded" style={{ color: '#D4AF37' }}><Copy size={14} /></button>
                      <button onClick={() => window.open(asset.url, '_blank')} className="p-1.5 rounded" style={{ color: '#8A8A8A' }}><ExternalLink size={14} /></button>
                      <button onClick={() => setDeleteId(asset.id)} className="p-1.5 rounded" style={{ color: '#FF6666' }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t text-xs" style={{ borderColor: '#242424', color: '#8A8A8A' }}>
            <span>{total} assets</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded border disabled:opacity-30" style={{ border: '1px solid #242424' }}>Prev</button>
              <span>{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1.5 rounded border disabled:opacity-30" style={{ border: '1px solid #242424' }}>Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }} onClick={() => setShowAddModal(false)}>
          <div className="w-full max-w-md rounded-2xl p-6 space-y-4" style={{ backgroundColor: '#121212', border: '1px solid #242424' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">Add Media Asset</h3>
              <button onClick={() => setShowAddModal(false)} style={{ color: '#8A8A8A' }}><X size={18} /></button>
            </div>
            {[
              { label: 'Filename *', key: 'filename', placeholder: 'movie-poster.jpg' },
              { label: 'URL *', key: 'url', placeholder: 'https://...' },
              { label: 'Alt Text', key: 'alt', placeholder: 'Descriptive alt text' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-medium mb-1" style={{ color: '#8A8A8A' }}>{f.label}</label>
                <input type="text" placeholder={f.placeholder} value={form[f.key as keyof AddFormState]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-xs focus:outline-none" style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFF' }} />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#8A8A8A' }}>Type</label>
              <select value={form.type} onChange={e => setForm(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-xs focus:outline-none" style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFF' }}>
                {['IMAGE', 'VIDEO', 'DOCUMENT', 'OTHER'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            {form.url && form.type === 'IMAGE' && (
              <div className="rounded-lg overflow-hidden" style={{ maxHeight: 120 }}>
                <img src={form.url} alt="preview" className="w-full h-full object-contain" style={{ maxHeight: 120 }} />
              </div>
            )}
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-lg text-xs" style={{ backgroundColor: '#1A1A1A', border: '1px solid #242424', color: '#8A8A8A' }}>Cancel</button>
              <button onClick={() => createMutation.mutate()} disabled={!form.filename || !form.url || createMutation.isPending}
                className="px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #D4AF37, #C5A028)', color: '#070707' }}>
                {createMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Add Asset
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete Asset"
        message="Are you sure you want to delete this media asset? If it's still referenced, content may break."
        confirmLabel="Delete Asset"
        danger
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
