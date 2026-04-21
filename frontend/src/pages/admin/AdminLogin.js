import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCustomDomain } from '../../hooks/useCustomDomain';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Loader2, LogIn } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();
  const { domainGym, isCustomDomain, loading: domainLoading } = useCustomDomain();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Por favor ingresa email y contraseña');
      return;
    }

    setLoading(true);
    try {
      await loginAdmin(email, password);
      toast.success('Bienvenido!');
      navigate('/admin');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Credenciales invalidas');
    } finally {
      setLoading(false);
    }
  };

  if (domainLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="animate-spin text-zinc-500" size={32} />
      </div>
    );
  }

  const gymColor = domainGym?.primary_color || 'var(--gym-primary)';
  const gymName = domainGym?.name;
  const gymLogo = domainGym?.logo_url;
  const API = process.env.REACT_APP_BACKEND_URL;

  return (
    <div className="min-h-screen bg-[#050505] flex relative overflow-hidden">
      {/* Left side - decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center">
        {/* Gradient background */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0800 50%, #0a0a0a 100%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-[0.08]" style={{ background: 'radial-gradient(circle, #FF6600, transparent 70%)' }} />
        
        {/* Content */}
        <div className="relative z-10 text-center px-12">
          {gymLogo ? (
            <img 
              src={gymLogo.startsWith('/') ? `${API}${gymLogo}` : gymLogo} 
              alt={gymName} 
              className="w-28 h-28 object-contain mx-auto mb-8 rounded-2xl"
            />
          ) : (
            <img src="/logo192.png" alt="Gym24" className="w-28 h-28 mx-auto mb-8 rounded-2xl" style={{ boxShadow: '0 0 60px rgba(255,102,0,0.15)' }} />
          )}
          <h2 className="text-5xl font-black tracking-tighter mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {gymName ? (
              <span style={{ color: gymColor }}>{gymName}</span>
            ) : (
              <><span style={{ color: '#FF6600' }}>Gym</span><span className="text-white">24</span></>
            )}
          </h2>
          <p className="text-[#555] text-lg font-light">Control de acceso inteligente</p>
          
          <div className="mt-16 flex justify-center gap-10">
            <div className="text-center">
              <p className="text-3xl font-black" style={{ color: '#FF6600' }}>QR</p>
              <p className="text-[#444] text-xs mt-1 uppercase tracking-widest">Dinamico</p>
            </div>
            <div className="w-px bg-[#1a1a1a]" />
            <div className="text-center">
              <p className="text-3xl font-black" style={{ color: '#FF6600' }}>24/7</p>
              <p className="text-[#444] text-xs mt-1 uppercase tracking-widest">Acceso</p>
            </div>
            <div className="w-px bg-[#1a1a1a]" />
            <div className="text-center">
              <p className="text-3xl font-black" style={{ color: '#FF6600' }}>100%</p>
              <p className="text-[#444] text-xs mt-1 uppercase tracking-widest">Seguro</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            {gymLogo ? (
              <img src={gymLogo.startsWith('/') ? `${API}${gymLogo}` : gymLogo} alt={gymName} className="w-20 h-20 object-contain mx-auto mb-4 rounded-xl" />
            ) : (
              <img src="/logo192.png" alt="Gym24" className="w-20 h-20 mx-auto mb-4 rounded-xl" />
            )}
            <h1 className="text-3xl font-black tracking-tighter" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {gymName ? (
                <span style={{ color: gymColor }}>{gymName}</span>
              ) : (
                <><span style={{ color: '#FF6600' }}>Gym</span>24</>
              )}
            </h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>Panel de Administracion</h2>
            <p style={{ color: 'var(--text-muted)' }} className="text-sm">Inicia sesion con tus credenciales</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@tunegocio.com"
                className="input-dark h-12"
                data-testid="admin-email-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Contrasena
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-dark h-12"
                data-testid="admin-password-input"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-base font-bold rounded-xl"
              style={{ background: 'linear-gradient(135deg, #FF6600, #E65C00)', color: '#FFF' }}
              data-testid="admin-login-btn"
            >
              {loading ? (
                <Loader2 className="animate-spin mr-2" size={20} />
              ) : (
                <LogIn className="mr-2" size={20} />
              )}
              Iniciar Sesion
            </Button>
          </form>

          {isCustomDomain && !domainGym && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-red-400 text-sm text-center">Dominio no configurado</p>
            </div>
          )}

          <p className="text-center text-xs mt-8" style={{ color: 'var(--text-dim)' }}>
            {gymName ? `Acceso exclusivo para personal de ${gymName}` : 'Acceso exclusivo para administradores'}
          </p>
        </div>
      </div>
    </div>
  );
}
