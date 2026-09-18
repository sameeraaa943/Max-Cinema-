import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Bell, ChevronDown, Settings, LogOut, Menu, Shield } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../services/api';
import { toast } from 'sonner';

interface HeaderProps {
  onMenuToggle: () => void;
}

const routeTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/movies': 'Movies Management',
  '/movies/new': 'Add New Movie',
  '/tv-shows': 'TV Shows Management',
  '/tv-shows/new': 'Add New TV Show',
  '/featured': 'Featured Content',
  '/trending': 'Trending Content',
  '/collections': 'Curated Collections',
  '/homepage': 'Homepage Configuration',
  '/analytics': 'Analytics & Performance',
  '/ads': 'Advertisement Management',
  '/settings': 'System Settings',
  '/audit-log': 'Audit & Security Logs',
};

export default function Header({ onMenuToggle }: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const currentTitle = routeTitles[location.pathname] || 'CineScope Control';

  const notifications = [
    { id: 1, text: 'Supabase PostgreSQL connected', time: 'Just now' },
    { id: 2, text: 'Custom Analytics tracker active', time: '5m ago' },
    { id: 3, text: 'TMDB API import engine enabled', time: '10m ago' },
  ];

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'A';
  const roleLabel = user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin';

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6"
      style={{
        height: '64px',
        background: 'rgba(7,7,7,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid #242424',
      }}
    >
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg transition-colors"
          style={{ color: '#8A8A8A' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#D4AF37'; e.currentTarget.style.background = 'rgba(212,175,55,0.08)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#8A8A8A'; e.currentTarget.style.background = 'transparent'; }}
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold" style={{ color: '#FFFFFF' }}>
            {currentTitle}
          </span>
          <span
            className="hidden sm:inline-block text-[10px] tracking-wider px-2 py-0.5 rounded font-mono uppercase"
            style={{ backgroundColor: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}
          >
            {roleLabel}
          </span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setDropdownOpen(false); }}
            className="relative flex items-center justify-center rounded-lg transition-all duration-200"
            style={{
              width: '38px',
              height: '38px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid #242424',
              color: '#8A8A8A',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)'; e.currentTarget.style.color = '#D4AF37'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#242424'; e.currentTarget.style.color = '#8A8A8A'; }}
          >
            <Bell size={16} />
            <span
              className="absolute top-0 right-0 translate-x-1 -translate-y-1 flex items-center justify-center rounded-full text-xs font-bold"
              style={{
                width: '16px',
                height: '16px',
                background: '#D4AF37',
                color: '#070707',
                fontSize: '9px',
              }}
            >
              3
            </span>
          </button>

          {/* Notifications Dropdown */}
          {notifOpen && (
            <div
              className="absolute right-0 top-full mt-2 rounded-xl overflow-hidden dropdown-animate"
              style={{
                width: '300px',
                background: '#121212',
                border: '1px solid #242424',
                boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                zIndex: 100,
              }}
            >
              <div
                className="px-4 py-3 flex items-center justify-between"
                style={{ borderBottom: '1px solid #242424' }}
              >
                <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: '#8A8A8A' }}>
                  System Alerts
                </span>
                <span className="text-xs" style={{ color: '#D4AF37' }}>3 active</span>
              </div>
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="px-4 py-3 flex items-start gap-3 transition-colors"
                  style={{ borderBottom: '1px solid rgba(36,36,36,0.5)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div
                    className="rounded-full mt-1.5 shrink-0"
                    style={{ width: '6px', height: '6px', background: '#D4AF37' }}
                  />
                  <div>
                    <p className="text-sm" style={{ color: '#FFFFFF' }}>{n.text}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#8A8A8A' }}>{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Admin Profile */}
        <div className="relative">
          <button
            onClick={() => { setDropdownOpen(!dropdownOpen); setNotifOpen(false); }}
            className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 rounded-xl transition-all duration-200"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid #242424',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#242424'; }}
          >
            {/* Avatar */}
            <div
              className="flex items-center justify-center rounded-full text-xs font-bold"
              style={{
                width: '32px',
                height: '32px',
                background: 'linear-gradient(135deg, #D4AF37, #C5A028)',
                color: '#070707',
                flexShrink: 0,
              }}
            >
              {initial}
            </div>
            <div className="hidden sm:block text-left">
              <span className="text-sm font-medium block leading-tight" style={{ color: '#FFFFFF' }}>
                {user?.name || 'Administrator'}
              </span>
              <span className="text-[11px] block leading-tight" style={{ color: '#8A8A8A' }}>
                {user?.email || 'admin@cinescope.com'}
              </span>
            </div>
            <ChevronDown
              size={14}
              className={`hidden sm:block transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
              style={{ color: '#8A8A8A' }}
            />
          </button>

          {/* Profile Dropdown */}
          {dropdownOpen && (
            <div
              className="absolute right-0 top-full mt-2 rounded-xl overflow-hidden dropdown-animate"
              style={{
                width: '220px',
                background: '#121212',
                border: '1px solid #242424',
                boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                zIndex: 100,
              }}
            >
              <div className="px-4 py-3" style={{ borderBottom: '1px solid #242424' }}>
                <p className="text-sm font-semibold" style={{ color: '#FFFFFF' }}>{user?.name || 'Administrator'}</p>
                <p className="text-xs mt-0.5" style={{ color: '#8A8A8A' }}>{user?.email || 'admin@cinescope.com'}</p>
              </div>

              <Link
                to="/settings"
                onClick={() => setDropdownOpen(false)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left"
                style={{ color: '#8A8A8A' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#FFFFFF'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8A8A8A'; }}
              >
                <Settings size={14} />
                Settings & System
              </Link>

              <Link
                to="/audit-log"
                onClick={() => setDropdownOpen(false)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left"
                style={{ color: '#8A8A8A' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#FFFFFF'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8A8A8A'; }}
              >
                <Shield size={14} />
                Security & Audit Log
              </Link>

              <div style={{ borderTop: '1px solid #242424' }}>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left cursor-pointer"
                  style={{ color: '#ef4444' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <LogOut size={14} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
