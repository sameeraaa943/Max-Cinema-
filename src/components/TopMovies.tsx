import { Star } from 'lucide-react';
import { topMovies } from '../data/mockData';

const posterColors = [
  'linear-gradient(135deg, #1a3a4a 0%, #0d1f2a 100%)',
  'linear-gradient(135deg, #2a1a4a 0%, #150d2a 100%)',
  'linear-gradient(135deg, #1a1a3a 0%, #0d0d1f 100%)',
  'linear-gradient(135deg, #3a2a1a 0%, #1f150d 100%)',
  'linear-gradient(135deg, #3a1a1a 0%, #1f0d0d 100%)',
];

const movieLetters = ['I', 'I', 'D', 'D', 'A'];

export default function TopMovies() {
  return (
    <div
      className="card-hover fade-in-up delay-700 rounded-2xl p-5 sm:p-6 flex flex-col"
      style={{
        background: '#121212',
        border: '1px solid #242424',
        opacity: 0,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold" style={{ color: '#FFFFFF' }}>
            Top Movies
          </h2>
          <p className="text-xs mt-0.5" style={{ color: '#8A8A8A' }}>
            Highest rated this month
          </p>
        </div>
        <button
          className="text-xs font-medium transition-colors px-3 py-1.5 rounded-lg"
          style={{
            color: '#D4AF37',
            background: 'rgba(212,175,55,0.08)',
            border: '1px solid rgba(212,175,55,0.2)',
          }}
        >
          View All
        </button>
      </div>

      {/* Movie List */}
      <div className="flex flex-col gap-3">
        {topMovies.map((movie, i) => (
          <div
            key={movie.rank}
            className="flex items-center gap-3 group transition-all duration-200 rounded-xl p-2 -mx-2"
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            {/* Rank */}
            <span
              className="text-xs font-bold w-5 text-center shrink-0 font-cinzel"
              style={{ color: '#8A8A8A' }}
            >
              {movie.rank}
            </span>

            {/* Poster thumbnail */}
            <div
              className="rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
              style={{
                width: '36px',
                height: '48px',
                background: posterColors[i],
                color: '#D4AF37',
                border: '1px solid rgba(255,255,255,0.06)',
                fontSize: '16px',
              }}
            >
              {movieLetters[i]}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-semibold truncate transition-colors"
                style={{ color: '#FFFFFF' }}
              >
                {movie.title}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#8A8A8A' }}>
                {movie.genre} · {movie.year}
              </p>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1 shrink-0">
              <Star size={11} style={{ color: '#D4AF37' }} fill="#D4AF37" />
              <span className="text-xs font-semibold" style={{ color: '#D4AF37' }}>
                {movie.rating}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer accent */}
      <div
        className="mt-5 pt-4"
        style={{ borderTop: '1px solid #242424' }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: '#8A8A8A' }}>
            Showing top 5 of 12,482 movies
          </span>
          <div
            className="text-xs px-2 py-1 rounded"
            style={{ background: 'rgba(212,175,55,0.08)', color: '#D4AF37' }}
          >
            IMDb Ratings
          </div>
        </div>
      </div>
    </div>
  );
}

