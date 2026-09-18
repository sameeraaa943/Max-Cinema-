import { Film, Star, Settings, TrendingUp, BookOpen } from 'lucide-react';
import { recentActivity } from '../data/mockData';

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  update: { icon: Film, color: '#D4AF37', bg: 'rgba(212,175,55,0.1)' },
  featured: { icon: Star, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  settings: { icon: Settings, color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
  collection: { icon: BookOpen, color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
  trending: { icon: TrendingUp, color: '#fb923c', bg: 'rgba(251,146,60,0.1)' },
};

export default function RecentActivity() {
  return (
    <div
      className="card-hover fade-in-up delay-700 rounded-2xl p-5 sm:p-6"
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
            Recent Activity
          </h2>
          <p className="text-xs mt-0.5" style={{ color: '#8A8A8A' }}>
            Latest changes to your platform
          </p>
        </div>
        <button
          className="text-xs font-medium transition-colors px-3 py-1.5 rounded-lg"
          style={{
            color: '#8A8A8A',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid #242424',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#8A8A8A'; e.currentTarget.style.borderColor = '#242424'; }}
        >
          View All
        </button>
      </div>

      {/* Activity Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div
          className="absolute left-5 top-5 bottom-5"
          style={{
            width: '1px',
            background: 'linear-gradient(180deg, #242424 0%, transparent 100%)',
          }}
        />

        <div className="flex flex-col gap-1">
          {recentActivity.map((item, i) => {
            const config = typeConfig[item.type];
            const Icon = config.icon;
            return (
              <div
                key={item.id}
                className="flex gap-4 p-3 rounded-xl transition-all duration-200 relative"
                style={{ animationDelay: `${0.7 + i * 0.1}s` }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                {/* Icon */}
                <div
                  className="flex items-center justify-center rounded-xl shrink-0 relative z-10"
                  style={{
                    width: '36px',
                    height: '36px',
                    background: config.bg,
                    border: `1px solid ${config.color}25`,
                  }}
                >
                  <Icon size={15} style={{ color: config.color }} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium leading-tight"
                    style={{ color: '#FFFFFF' }}
                  >
                    {item.action}
                  </p>
                  <p
                    className="text-xs mt-0.5 truncate"
                    style={{ color: '#8A8A8A' }}
                  >
                    {item.detail}
                  </p>
                </div>

                {/* Time */}
                <span className="text-xs shrink-0 mt-0.5" style={{ color: '#8A8A8A' }}>
                  {item.time}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

