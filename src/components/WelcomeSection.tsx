import { Calendar } from 'lucide-react';

export default function WelcomeSection() {
  return (
    <div className="fade-in-up delay-100">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-bold tracking-tight"
            style={{ color: '#FFFFFF' }}
          >
            Dashboard
          </h1>
          <p className="mt-1 text-sm sm:text-base" style={{ color: '#8A8A8A' }}>
            Welcome back,{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #F0D060 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontWeight: 600,
              }}
            >
              Admin
            </span>
            . Here's an overview of your CineScope platform.
          </p>
        </div>

        {/* Date Badge */}
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-xl self-start sm:self-auto"
          style={{
            background: 'rgba(212,175,55,0.08)',
            border: '1px solid rgba(212,175,55,0.2)',
          }}
        >
          <Calendar size={13} style={{ color: '#D4AF37' }} />
          <span className="text-xs font-medium" style={{ color: '#D4AF37' }}>
            September 18, 2026
          </span>
        </div>
      </div>

      {/* Subtle divider */}
      <div
        className="mt-5"
        style={{
          height: '1px',
          background: 'linear-gradient(90deg, #242424, transparent)',
        }}
      />
    </div>
  );
}

