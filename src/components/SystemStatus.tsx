import { systemStatus } from '../data/mockData';

const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  online: {
    label: 'Online',
    color: '#34d399',
    bg: 'rgba(52,211,153,0.12)',
    dot: '#34d399',
  },
  demo: {
    label: 'Demo',
    color: '#D4AF37',
    bg: 'rgba(212,175,55,0.12)',
    dot: '#D4AF37',
  },
  disconnected: {
    label: 'Not Connected',
    color: '#8A8A8A',
    bg: 'rgba(138,138,138,0.08)',
    dot: '#8A8A8A',
  },
  offline: {
    label: 'Offline',
    color: '#f87171',
    bg: 'rgba(248,113,113,0.12)',
    dot: '#f87171',
  },
};

export default function SystemStatus() {
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
      <div className="flex items-center gap-2 mb-5">
        <div
          className="rounded-full status-online"
          style={{ width: '7px', height: '7px', background: '#34d399' }}
        />
        <h2 className="text-base font-semibold" style={{ color: '#FFFFFF' }}>
          System Status
        </h2>
      </div>

      {/* Status items */}
      <div className="flex flex-col gap-3">
        {systemStatus.map((item) => {
          const config = statusConfig[item.status];
          return (
            <div
              key={item.label}
              className="flex items-center justify-between gap-3 p-3 rounded-xl transition-colors"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid #242424',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
            >
              {/* Left: dot + label */}
              <div className="flex items-center gap-2.5">
                <div
                  className={`rounded-full shrink-0 ${item.status === 'online' ? 'status-online' : ''}`}
                  style={{ width: '7px', height: '7px', background: config.dot }}
                />
                <div>
                  <p className="text-sm font-medium" style={{ color: '#FFFFFF' }}>
                    {item.label}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#8A8A8A' }}>
                    {item.detail}
                  </p>
                </div>
              </div>

              {/* Right: status badge */}
              <div
                className="px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0"
                style={{ background: config.bg, color: config.color }}
              >
                {config.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <p
        className="text-xs mt-4 text-center"
        style={{ color: '#8A8A8A' }}
      >
        This is a UI-only demo dashboard
      </p>
    </div>
  );
}

