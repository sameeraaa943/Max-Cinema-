import { Film, Tv, Star, BookOpen, Plus, Pencil, Globe } from 'lucide-react';

const actions = [
  {
    icon: Film,
    label: 'Add Movie',
    color: '#D4AF37',
    bg: 'rgba(212,175,55,0.1)',
    border: 'rgba(212,175,55,0.25)',
    hoverBorder: 'rgba(212,175,55,0.5)',
    prefix: Plus,
  },
  {
    icon: Tv,
    label: 'Add TV Show',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.1)',
    border: 'rgba(167,139,250,0.25)',
    hoverBorder: 'rgba(167,139,250,0.5)',
    prefix: Plus,
  },
  {
    icon: Star,
    label: 'Manage Featured',
    color: '#34d399',
    bg: 'rgba(52,211,153,0.1)',
    border: 'rgba(52,211,153,0.25)',
    hoverBorder: 'rgba(52,211,153,0.5)',
    prefix: Pencil,
  },
  {
    icon: BookOpen,
    label: 'New Collection',
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.1)',
    border: 'rgba(96,165,250,0.25)',
    hoverBorder: 'rgba(96,165,250,0.5)',
    prefix: Plus,
  },
  {
    icon: Globe,
    label: 'Homepage Settings',
    color: '#fb923c',
    bg: 'rgba(251,146,60,0.1)',
    border: 'rgba(251,146,60,0.25)',
    hoverBorder: 'rgba(251,146,60,0.5)',
    prefix: Pencil,
  },
];

export default function QuickActions() {
  return (
    <div
      className="card-hover fade-in-up delay-800 rounded-2xl p-5 sm:p-6"
      style={{
        background: '#121212',
        border: '1px solid #242424',
        opacity: 0,
      }}
    >
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-base font-semibold" style={{ color: '#FFFFFF' }}>
          Quick Actions
        </h2>
        <p className="text-xs mt-0.5" style={{ color: '#8A8A8A' }}>
          Common management tasks
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2.5">
        {actions.map((action) => {
          const Icon = action.icon;
          const Prefix = action.prefix;
          return (
            <button
              key={action.label}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left group"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid ${action.border}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = action.bg;
                e.currentTarget.style.borderColor = action.hoverBorder;
                e.currentTarget.style.transform = 'translateX(3px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                e.currentTarget.style.borderColor = action.border;
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              {/* Icon */}
              <div
                className="flex items-center justify-center rounded-lg shrink-0"
                style={{
                  width: '32px',
                  height: '32px',
                  background: action.bg,
                  border: `1px solid ${action.border}`,
                }}
              >
                <Icon size={15} style={{ color: action.color }} />
              </div>

              {/* Label */}
              <span className="text-sm font-medium" style={{ color: '#FFFFFF' }}>
                {action.label}
              </span>

              {/* Prefix icon */}
              <Prefix
                size={13}
                className="ml-auto opacity-40 group-hover:opacity-100 transition-opacity"
                style={{ color: action.color }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

