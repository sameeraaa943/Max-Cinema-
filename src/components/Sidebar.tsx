import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Film,
  Tv,
  Star,
  TrendingUp,
  BookOpen,
  Home,
  BarChart2,
  DollarSign,
  Settings,
  ClipboardList,
  LogOut,
  ChevronRight,
  Diamond,
  X,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../services/api';
import { toast } from 'sonner';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  label: string;
  path: string;
}

const navSections: { title: string; items: NavItem[] }[] = [
  {
    title: 'MAIN',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    ],
  },
  {
    title: 'CONTENT',
    items: [
      { icon: Film, label: 'Movies', path: '/movies' },
      { icon: Tv, label: 'TV Shows', path: '/tv-shows' },
      { icon: Star, label: 'Featured', path: '/featured' },
      { icon: TrendingUp, label: 'Trending', path: '/trending' },
      { icon: BookOpen, label: 'Collections', path: '/collections' },
    ],
  },
  {
    title: 'WEBSITE',
    items: [
      { icon: Home, label: 'Homepage', path: '/homepage' },
    ],
  },
  {
    title: 'INSIGHTS',
    items: [
      { icon: BarChart2, label: 'Analytics', path: '/analytics' },
      { icon: DollarSign, label: 'Ads', path: '/ads' },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { icon: Settings, label: 'Settings', path: '/settings' },
      { icon: ClipboardList, label: 'Audit Log', path: '/audit-log' },
    ],
  },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors on logout
    }
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full flex flex-col
          sidebar-transition
          lg:relative lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{
          width: '260px',
          minWidth: '260px',
          background: 'linear-gradient(180deg, #0D0D0D 0%, #070707 100%)',
          borderRight: '1px solid #242424',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-6 py-6"
          style={{ borderBottom: '1px solid #242424' }}
        >
          <div
            className="flex items-center justify-center rounded-lg pulse-gold"
            style={{
              width: '36px',
              height: '36px',
              background: 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.05))',
              border: '1px solid rgba(212,175,55,0.4)',
            }}
          >
            <Diamond size={16} style={{ color: '#D4AF37' }} />
          </div>
          <div>
            <div
              className="font-cinzel font-bold text-sm tracking-widest gold-text"
              style={{ letterSpacing: '0.15em' }}
            >
              CINESCOPE
            </div>
            <div
              className="text-xs tracking-widest"
              style={{ color: '#8A8A8A', letterSpacing: '0.2em', marginTop: '1px' }}
            >
              CONTROL
            </div>
          </div>
          {/* Close button on mobile */}
          <button
            onClick={onClose}
            className="ml-auto lg:hidden p-1 rounded cursor-pointer"
            style={{ color: '#8A8A8A' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {navSections.map((section) => (
            <div key={section.title} className="mb-6">
              <div
                className="px-3 mb-2 text-xs font-semibold tracking-widest"
                style={{ color: '#8A8A8A', letterSpacing: '0.15em' }}
              >
                {section.title}
              </div>
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.label}
                    to={item.path}
                    end={item.path === '/'}
                    onClick={() => {
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={({ isActive }) => `
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1
                      transition-all duration-200 text-left
                      ${isActive ? 'nav-active' : ''}
                    `}
                    style={({ isActive }) => ({
                      color: isActive ? '#D4AF37' : '#8A8A8A',
                      backgroundColor: isActive ? 'rgba(212, 175, 55, 0.08)' : 'transparent',
                    })}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon size={16} style={{ flexShrink: 0 }} />
                        <span className="text-sm font-medium">{item.label}</span>
                        {isActive && (
                          <ChevronRight
                            size={12}
                            className="ml-auto"
                            style={{ color: '#D4AF37', opacity: 0.8 }}
                          />
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}

          {/* Logout Action */}
          <div className="mb-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all duration-200 text-left cursor-pointer"
              style={{ color: '#ef4444' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <LogOut size={16} style={{ flexShrink: 0 }} />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </nav>

        {/* Bottom info */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ borderTop: '1px solid #242424' }}
        >
          <div className="text-xs" style={{ color: '#8A8A8A' }}>
            <span className="gold-text font-semibold">v2.0</span>
            <span className="mx-2" style={{ color: '#242424' }}>|</span>
            Control API
          </div>
          <a
            href="https://cinescopecodespactor.netlify.app"
            target="_blank"
            rel="noreferrer"
            className="text-xs hover:underline"
            style={{ color: '#D4AF37' }}
          >
            Public Site ↗
          </a>
        </div>
      </aside>
    </>
  );
}
