import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Image as ImageIcon,
  Trash2,
  Search,
  Grid,
  List,
  ExternalLink,
  Copy,
  Loader2,
  Plus,
  FileText,
  Film,
} from 'lucide-react';
import { toast } from 'sonner';
import { mediaApi } from '../../services/api';

export default function MediaLibraryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form State
  const [filename, setFilename] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState('IMAGE');
  const [alt, setAlt] = useState('');

  // Fetch Media
  const { data, isLoading } = useQuery({
    queryKey: ['media-library', search, selectedType],
    queryFn: () => mediaApi.list({ search, type: selectedType === 'ALL' ? undefined : selectedType }),
  });

  const items = data?.data?.data?.items || data?.data?.items || [];

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (formData: any) => mediaApi.create(formData),
    onSuccess: () => {
      toast.success('Media asset added');
      queryClient.invalidateQueries({ queryKey: ['media-library'] });
      setIsAddOpen(false);
      setFilename('');
      setUrl('');
      setAlt('');
    },
    onError: () => toast.error('Failed to add media'),
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => mediaApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-library'] });
      toast.success('Media asset deleted');
    },
  });

  const handleCopyUrl = (mediaUrl: string) => {
    navigator.clipboard.writeText(mediaUrl);
    toast.success('URL copied to clipboard');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !filename.trim()) {
      toast.error('Filename and URL are required');
      return;
    }
    createMutation.mutate({ filename, url, type, alt });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-cinzel tracking-wide">Media Library</h1>
          <p className="text-xs text-muted mt-1">
            Central repository for posters, backdrops, banners, and trailer assets.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold btn-gold transition-all self-start sm:self-auto"
          style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)', color: '#070707' }}
        >
          <Plus size={16} />
          <span>Add Media Asset</span>
        </button>
      </div>

      {/* Filters & View Switcher */}
      <div
        className="p-3 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3"
        style={{ backgroundColor: '#121212', border: '1px solid #242424' }}
      >
        <div className="relative flex-1 w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search media by filename or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg text-xs transition-colors focus:outline-none"
            style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Type Filter */}
          <div className="flex gap-1 overflow-x-auto">
            {['ALL', 'IMAGE', 'VIDEO', 'DOCUMENT'].map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  backgroundColor: selectedType === t ? '#D4AF37' : '#0D0D0D',
                  color: selectedType === t ? '#070707' : '#8A8A8A',
                  border: selectedType === t ? '1px solid #D4AF37' : '1px solid #242424',
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* View Mode */}
          <div className="flex bg-[#0D0D0D] border border-[#242424] rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-[#242424] text-white' : 'text-muted'}`}
            >
              <Grid size={14} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-[#242424] text-white' : 'text-muted'}`}
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Media Grid or List */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-muted">
          <Loader2 size={16} className="animate-spin text-gold mx-auto mb-2" />
          <span>Loading media assets...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-[#242424] bg-[#121212]">
          <ImageIcon size={32} className="mx-auto text-muted mb-2 opacity-50" />
          <h3 className="text-sm font-semibold text-white">No Media Assets Found</h3>
          <p className="text-xs text-muted mt-1">Upload an image or trailer link to get started.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {items.map((item: any) => (
            <div
              key={item.id}
              className="group rounded-xl overflow-hidden bg-[#121212] border border-[#242424] flex flex-col relative"
            >
              <div className="aspect-[2/3] bg-black relative overflow-hidden flex items-center justify-center">
                {item.type === 'IMAGE' ? (
                  <img
                    src={item.url}
                    alt={item.alt || item.filename}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as any).style.display = 'none';
                    }}
                  />
                ) : item.type === 'VIDEO' ? (
                  <Film size={24} className="text-purple-400" />
                ) : (
                  <FileText size={24} className="text-blue-400" />
                )}

                {/* Overlay actions on hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleCopyUrl(item.url)}
                    className="p-2 rounded-lg bg-black/80 text-white hover:text-gold transition-colors"
                    title="Copy URL"
                  >
                    <Copy size={13} />
                  </button>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-black/80 text-white hover:text-gold transition-colors"
                    title="Open Link"
                  >
                    <ExternalLink size={13} />
                  </a>
                  <button
                    onClick={() => deleteMutation.mutate(item.id)}
                    className="p-2 rounded-lg bg-red-500/80 text-white hover:bg-red-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div className="p-2.5">
                <div className="text-xs font-medium text-white truncate">{item.filename}</div>
                <div className="text-[10px] text-muted font-mono uppercase mt-0.5">{item.type}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden border border-[#242424] bg-[#121212]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#242424] bg-[#0D0D0D] text-[11px] text-muted uppercase">
                <th className="py-3 px-4">Preview</th>
                <th className="py-3 px-4">Filename</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">URL</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e1e]">
              {items.map((item: any) => (
                <tr key={item.id} className="hover:bg-white/[0.02]">
                  <td className="py-2.5 px-4 w-16">
                    <img src={item.url} alt="" className="w-10 h-10 object-cover rounded bg-black" />
                  </td>
                  <td className="py-2.5 px-4 font-medium text-white">{item.filename}</td>
                  <td className="py-2.5 px-4 font-mono text-[10px] text-muted">{item.type}</td>
                  <td className="py-2.5 px-4 font-mono text-muted text-[11px] max-w-xs truncate">{item.url}</td>
                  <td className="py-2.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleCopyUrl(item.url)} className="p-1.5 rounded hover:bg-white/5 text-muted hover:text-white">
                        <Copy size={13} />
                      </button>
                      <button onClick={() => deleteMutation.mutate(item.id)} className="p-1.5 rounded hover:bg-red-500/10 text-muted hover:text-red-400">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Media Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl p-6 bg-[#121212] border border-[#242424]">
            <h2 className="text-lg font-bold text-white font-cinzel">Add Media Asset</h2>
            <form onSubmit={handleCreate} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-muted font-medium mb-1">Asset Name</label>
                <input
                  type="text"
                  placeholder="e.g. Oppenheimer Poster 4K"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0D0D0D] border border-[#242424] text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-muted font-medium mb-1">Direct URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0D0D0D] border border-[#242424] text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-muted font-medium mb-1">Media Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0D0D0D] border border-[#242424] text-white focus:outline-none"
                >
                  <option value="IMAGE">Image</option>
                  <option value="VIDEO">Video / Trailer</option>
                  <option value="DOCUMENT">Document</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#242424]">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#0D0D0D] border border-[#242424] text-muted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 rounded-lg font-semibold btn-gold"
                  style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)', color: '#070707' }}
                >
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
