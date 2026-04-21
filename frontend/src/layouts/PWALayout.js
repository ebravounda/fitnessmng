import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { QrCode, User, Calendar, Bell, UserPlus, Sun, Moon, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';

const navItems = [
  { path: '/app', icon: QrCode, label: 'QR' },
  { path: '/app/classes', icon: Calendar, label: 'Clases' },
  { path: '/app/guests', icon: UserPlus, label: 'Invitados' },
  { path: '/app/notifications', icon: Bell, label: 'Avisos' },
  { path: '/app/profile', icon: User, label: 'Perfil' },
];

export const PWALayout = ({ children }) => {
  const { gym, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('gym24-theme') || 'dark');

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
    localStorage.setItem('gym24-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!window.matchMedia('(display-mode: standalone)').matches) {
        setShowInstallPrompt(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowInstallPrompt(false);
    setDeferredPrompt(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/app/login');
  };

  return (
    <div className="min-h-screen min-h-[100dvh]" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Header - minimal */}
      <header className="fixed top-0 left-0 right-0 z-40" style={{ background: 'rgba(5,5,5,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,102,0,0.08)' }}>
        <div className="flex items-center justify-between max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            {gym?.logo_url ? (
              <img 
                src={gym.logo_url.startsWith('/') ? `${process.env.REACT_APP_BACKEND_URL}${gym.logo_url}` : gym.logo_url} 
                alt={gym.name} 
                className="h-9 max-w-[100px] object-contain shrink-0"
              />
            ) : (
              <img src="/logo192.png" alt="Gym24" className="w-9 h-9 rounded-lg shrink-0" />
            )}
            <div className="min-w-0">
              <h1 className="font-bold text-sm truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>{gym?.name || 'Gym24'}</h1>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={toggleTheme} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--text-dim)' }} data-testid="pwa-theme-toggle-btn">
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button onClick={handleLogout} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--text-dim)' }} data-testid="pwa-logout-btn">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Install prompt */}
      {showInstallPrompt && (
        <div className="fixed top-14 left-3 right-3 z-50 max-w-lg mx-auto">
          <div className="rounded-2xl p-3 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, rgba(255,102,0,0.08), rgba(255,102,0,0.03))', border: '1px solid rgba(255,102,0,0.15)' }}>
            <img src="/logo192.png" alt="Gym24" className="w-10 h-10 rounded-xl shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-xs">Instalar App</p>
              <p className="text-[10px]" style={{ color: 'var(--text-dim)' }}>Acceso directo en tu inicio</p>
            </div>
            <button onClick={handleInstall} className="btn-gym-primary text-xs py-1.5 px-4 shrink-0" data-testid="install-pwa-btn">
              Instalar
            </button>
            <button onClick={() => setShowInstallPrompt(false)} className="p-1 shrink-0" style={{ color: 'var(--text-dim)' }}>
              <span className="text-lg leading-none">&times;</span>
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="pwa-content pt-14 px-3 sm:px-4">
        <div className="max-w-lg mx-auto py-4 sm:py-5">
          {children}
        </div>
      </main>

      {/* Bottom navigation - redesigned with orange accents */}
      <nav className="pwa-bottom-nav" data-testid="pwa-bottom-nav" style={{ background: 'rgba(5,5,5,0.95)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,102,0,0.1)' }}>
        <div className="max-w-lg mx-auto h-full flex items-center justify-around px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center gap-1 py-1.5 px-3 transition-all relative"
                data-testid={`pwa-nav-${item.label.toLowerCase()}`}
              >
                {/* Active indicator line */}
                {isActive && (
                  <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full" style={{ background: '#FF6600' }} />
                )}
                <div 
                  className="p-2 rounded-xl transition-all"
                  style={isActive 
                    ? { background: 'rgba(255,102,0,0.12)', color: '#FF6600' }
                    : { color: '#444' }
                  }
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                </div>
                <span 
                  className="text-[10px] font-semibold transition-colors"
                  style={{ color: isActive ? '#FF6600' : '#444', fontFamily: 'Outfit, sans-serif' }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
