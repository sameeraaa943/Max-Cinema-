import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  TrendingUp,
  Plus,
  GripVertical,
  Trash2,
  Film,
  Tv,
  Search,
  Flame,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { trendingApi, moviesApi, tvShowsApi } from '../../services/api';
import { TrendingItem, Movie, TVShow } from '../../types';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';

function SortableTrendingRow({
  item,
  rank,
  onRemove,
  onUpdateScore,
}: {
  item: TrendingItem;
  rank: number;
  onRemove: (id: string) => void;
  onUpdateScore: (id: string, score: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.7 : 1,
  };

  const title = item.movie?.title || item.tvShow?.title || 'Untitled';
  const poster = item.movie?.posterUrl || item.tvShow?.posterUrl;
  const isMovie = item.contentType === 'MOVIE';

  const [score, setScore] = useState(item.trendingScore || 0);

  return (
    <div
      ref={setNodeRef}
      className="p-3 rounded-xl flex items-center gap-3 transition-colors card-hover mb-2 select-none"
      style={{
        ...style,
        backgroundColor: '#121212',
        border: '1px solid #242424',
      }}
    >
      <button {...attributes} {...listeners} className="p-1 text-muted hover:text-white cursor-grab active:cursor-grabbing">
        <GripVertical size={16} />
      </button>

      {/* Rank Badge */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm font-mono flex-shrink-0"
        style={
          rank === 1
            ? { backgroundColor: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid #ef4444' }
            : rank <= 3
            ? { backgroundColor: 'rgba(212,175,55,0.15)', color: '#D4AF37', border: '1px solid #D4AF37' }
            : { backgroundColor: '#1a1a1a', color: '#8A8A8A', border: '1px solid #242424' }
        }
      >
        #{rank}
      </div>

      {/* Poster */}
      <div className="w-10 h-14 rounded overflow-hidden flex-shrink-0 bg-[#1f1f1f] flex items-center justify-center">
        {poster ? (
          <img src={poster} alt="" className="w-full h-full object-cover" />
        ) : isMovie ? (
          <Film size={16} className="text-muted/50" />
        ) : (
          <Tv size={16} className="text-muted/50" />
        )}
      </div>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-xs text-white truncate">{title}</span>
          <span
            className="text-[10px] px-1.5 py-0.2 rounded font-mono uppercase font-semibold"
            style={
              isMovie
                ? { backgroundColor: 'rgba(212,175,55,0.12)', color: '#D4AF37' }
                : { backgroundColor: 'rgba(59,130,246,0.12)', color: '#60a5fa' }
            }
          >
            {isMovie ? 'Movie' : 'TV'}
          </span>
        </div>
      </div>

      {/* Trending Score Input */}
      <div className="flex items-center gap-1.5">
        <Flame size={14} className="text-red-400" />
        <input
          type="number"
          value={score}
          onChange={(e) => setScore(Number(e.target.value))}
          onBlur={() => onUpdateScore(item.id, score)}
          className="w-16 px-2 py-1 rounded text-xs text-center font-mono focus:outline-none"
          style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
          title="Trending Score (higher = hotter)"
        />
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(item.id)}
        className="p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
        title="Remove from trending"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

export default function TrendingPage() {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'MOVIE' | 'TV_SHOW'>('MOVIE');
  const [modalSearch, setModalSearch] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const { data: trendingData, isLoading } = useQuery({
    queryKey: ['trending-items'],
    queryFn: () => trendingApi.list(),
  });
  const trendingItems: TrendingItem[] = trendingData?.data?.data || [];

  const { data: moviesSearchData } = useQuery({
    queryKey: ['modal-movies-trending', modalSearch],
    queryFn: () => moviesApi.list({ search: modalSearch || undefined, limit: 10 }),
    enabled: isAddModalOpen && modalTab === 'MOVIE',
  });

  const { data: tvSearchData } = useQuery({
    queryKey: ['modal-tv-trending', modalSearch],
    queryFn: () => tvShowsApi.list({ search: modalSearch || undefined, limit: 10 }),
    enabled: isAddModalOpen && modalTab === 'TV_SHOW',
  });

  const modalMovies: Movie[] = moviesSearchData?.data?.data?.items || [];
  const modalTVShows: TVShow[] = tvSearchData?.data?.data?.items || [];

  const reorderMutation = useMutation({
    mutationFn: (orderedIds: string[]) => trendingApi.reorder(orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trending-items'] });
      toast.success('Trending ranks updated');
    },
    onError: () => toast.error('Failed to reorder trending items'),
  });

  const updateScoreMutation = useMutation({
    mutationFn: ({ id, score }: { id: string; score: number }) =>
      trendingApi.update(id, { trendingScore: score }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trending-items'] });
      toast.success('Trending score updated');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => trendingApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trending-items'] });
      toast.success('Removed from trending');
    },
    onError: () => toast.error('Failed to remove item'),
  });

  const addMutation = useMutation({
    mutationFn: (data: { contentType: string; movieId?: string; tvShowId?: string }) =>
      trendingApi.add(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trending-items'] });
      toast.success('Added to trending!');
      setIsAddModalOpen(false);
    },
    onError: (err: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.error((err as any).response?.data?.error || 'Failed to add item');
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = trendingItems.findIndex((i) => i.id === active.id);
      const newIndex = trendingItems.findIndex((i) => i.id === over.id);
      const newItems = arrayMove(trendingItems, oldIndex, newIndex);
      const orderedIds = newItems.map((i) => i.id);
      reorderMutation.mutate(orderedIds);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-cinzel tracking-wide flex items-center gap-2">
            <TrendingUp size={22} className="text-red-400" />
            <span>Trending Content</span>
          </h1>
          <p className="text-xs text-muted mt-1">
            Order and configure what titles are marked as trending across the public CineScope website
          </p>
        </div>

        <button
          onClick={() => { setIsAddModalOpen(true); setModalSearch(''); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition-all self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Add Trending Item</span>
        </button>
      </div>

      {isLoading ? (
        <LoadingSkeleton lines={5} height="60px" />
      ) : trendingItems.length === 0 ? (
        <EmptyState
          title="No trending content"
          description="Your trending list is currently empty. Add titles to highlight what's popular on the homepage."
          icon={TrendingUp}
          action={{
            label: 'Add First Trending Item',
            onClick: () => setIsAddModalOpen(true),
          }}
        />
      ) : (
        <div>
          <div className="text-xs text-muted mb-3 flex items-center gap-1.5">
            <GripVertical size={14} />
            <span>Drag items to reorder trending ranks (#1, #2, #3...)</span>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={trendingItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {trendingItems.map((item, index) => (
                  <SortableTrendingRow
                    key={item.id}
                    item={item}
                    rank={index + 1}
                    onRemove={(id) => removeMutation.mutate(id)}
                    onUpdateScore={(id, score) => updateScoreMutation.mutate({ id, score })}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl p-6 relative max-h-[85vh] flex flex-col fade-in-up"
            style={{ backgroundColor: '#121212', border: '1px solid #242424' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#242424]">
              <h3 className="text-sm font-semibold text-white">Add Content to Trending</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-muted hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setModalTab('MOVIE')}
                className="flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
                style={{
                  backgroundColor: modalTab === 'MOVIE' ? 'rgba(212,175,55,0.15)' : '#0D0D0D',
                  color: modalTab === 'MOVIE' ? '#D4AF37' : '#8A8A8A',
                  border: modalTab === 'MOVIE' ? '1px solid #D4AF37' : '1px solid #242424',
                }}
              >
                <Film size={14} />
                <span>Movies</span>
              </button>
              <button
                onClick={() => setModalTab('TV_SHOW')}
                className="flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
                style={{
                  backgroundColor: modalTab === 'TV_SHOW' ? 'rgba(59,130,246,0.15)' : '#0D0D0D',
                  color: modalTab === 'TV_SHOW' ? '#60a5fa' : '#8A8A8A',
                  border: modalTab === 'TV_SHOW' ? '1px solid #3b82f6' : '1px solid #242424',
                }}
              >
                <Tv size={14} />
                <span>TV Shows</span>
              </button>
            </div>

            <div className="relative mt-3">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder={modalTab === 'MOVIE' ? 'Search movies...' : 'Search TV shows...'}
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg text-xs focus:outline-none"
                style={{ backgroundColor: '#070707', border: '1px solid #242424', color: '#FFFFFF' }}
              />
            </div>

            <div className="flex-1 overflow-y-auto mt-4 divide-y divide-[#1f1f1f] max-h-72">
              {modalTab === 'MOVIE' ? (
                modalMovies.map((movie) => (
                  <div key={movie.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-11 rounded overflow-hidden bg-[#1f1f1f] flex-shrink-0">
                        {movie.posterUrl && <img src={movie.posterUrl} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-semibold text-white truncate">{movie.title}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => addMutation.mutate({ contentType: 'MOVIE', movieId: movie.id })}
                      className="px-3 py-1.5 rounded text-xs font-semibold bg-red-600 hover:bg-red-500 text-white flex-shrink-0"
                    >
                      Add Trending
                    </button>
                  </div>
                ))
              ) : (
                modalTVShows.map((show) => (
                  <div key={show.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-11 rounded overflow-hidden bg-[#1f1f1f] flex-shrink-0">
                        {show.posterUrl && <img src={show.posterUrl} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-semibold text-white truncate">{show.title}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => addMutation.mutate({ contentType: 'TV_SHOW', tvShowId: show.id })}
                      className="px-3 py-1.5 rounded text-xs font-semibold bg-red-600 hover:bg-red-500 text-white flex-shrink-0"
                    >
                      Add Trending
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
