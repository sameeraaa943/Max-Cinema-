import { Film, Tv, Eye, Star, TrendingUp, TrendingDown } from 'lucide-react';
import { stats } from '../data/mockData';

const iconMap: Record<string, React.ElementType> = {
  movies: Film,
  tvshows: Tv,
  views: Eye,
  featured: Star,
};

const colorMap: Record<string, { bg: string; icon: string; glow: string }> = {
  movies: {
    bg: 'rgba(212,175,55,0.08)',
    icon: '#D4AF37',
    glow: 'rgba(212,175,55,0.15)',
  },
  tvshows: {
    bg: 'rgba(139,92,246,0.08)',
    icon: '#a78bfa',
    glow: 'rgba(139,92,246,0.15)',
  },
  views: {
    bg: 'rgba(59,130,246,0.08)',
    icon: '#60a5fa',
    glow: 'rgba(59,130,246,0.15)',
  },
  featured: {
    bg: 'rgba(16,185,129,0.08)',
    icon: '#34d399',
    glow: 'rgba(16,185,129,0.15)',
  },
};

export default function StatCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map((stat, i) => {
        const Icon = iconMap[stat.id];
        const colors = colorMap[stat.id];
        const isFeatured = stat.id === 'featured';

        return (
          <div
            key={stat.id}
            className={`card-hover fade-in-up delay-${(i + 2) * 100} rounded-2xl p-5`}
            style={{
              background: '#121212',
              border: '1px solid #242424',
              opacity: 0,
            }}
          >
            {/* Top row: icon + change badge */}
            <div className="flex items-start justify-between mb-4">
              <div
                className="flex items-center justify-center rounded-xl"
                style={{
                  width: '42px',
                  height: '42px',
                  background: colors.bg,
                  border: `1px solid ${colors.glow}`,
                }}
              >
                <Icon size={18} style={{ color: colors.icon }} />
              </div>

              {/* Change badge */}
              <div
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold"
                style={{
                  background: isFeatured
                    ? 'rgba(16,185,129,0.1)'
                    : stat.positive
                    ? 'rgba(16,185,129,0.1)'
                    : 'rgba(239,68,68,0.1)',
                  color: isFeatured
                    ? '#34d399'
                    : stat.positive
                    ? '#34d399'
                    : '#f87171',
                }}
              >
                {!isFeatured && (
                  stat.positive
                    ? <TrendingUp size={10} />
                    : <TrendingDown size={10} />
                )}
                {stat.change}
              </div>
            </div>

            {/* Value */}
            <div
              className="text-3xl font-bold tracking-tight count-up"
              style={{ color: '#FFFFFF' }}
            >
              {stat.value}
            </div>

            {/* Label + subtitle */}
            <div className="mt-2 flex flex-col gap-0.5">
              <span className="text-sm font-semibold" style={{ color: '#FFFFFF' }}>
                {stat.label}
              </span>
              <span className="text-xs" style={{ color: '#8A8A8A' }}>
                {stat.subtitle}
              </span>
            </div>

            {/* Bottom accent line */}
            <div
              className="mt-4 h-px w-full rounded"
              style={{
                background: `linear-gradient(90deg, ${colors.glow}, transparent)`,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

