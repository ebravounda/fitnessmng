import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Loader2, QrCode, AlertOctagon } from 'lucide-react';
import { toast } from 'sonner';

export default function MemberLogin() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const { loginMember } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code || code.length < 6) {
      toast.error('Ingresa tu código de socio (6 caracteres)');
      return;
    }

    setLoading(true);
    try {
      await loginMember(code.toUpperCase());
      toast.success('¡Bienvenido!');
      navigate('/app');
    } catch (error) {
      const detail = error.response?.data?.detail || '';
      if (detail === 'Cuenta Bloqueada') {
        setBlocked(true);
      } else {
        toast.error(detail || 'Código no encontrado');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setCode(value);
    if (blocked) setBlocked(false);
  };

  if (blocked) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6" data-testid="member-blocked-screen">
        <div className="relative z-10 w-full max-w-sm text-center space-y-6">
          <div className="w-24 h-24 rounded-full bg-red-500/10 border-2 border-red-500/40 flex items-center justify-center mx-auto">
            <AlertOctagon size={48} className="text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black mb-2" style={{ fontFamily: 'Outfit' }}>Cuenta Bloqueada</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>El acceso ha sido temporalmente suspendido.</p>
          </div>
          <div className="p-4 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Comunicate con la administracion para mas informacion.</p>
          </div>
          <button onClick={() => setBlocked(false)} className="text-sm transition-colors" style={{ color: 'var(--text-muted)' }}>
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-[-30%] right-[-20%] w-[500px] h-[500px] rounded-full opacity-[0.06]" style={{ background: 'radial-gradient(circle, #FF6600, transparent 70%)' }} />
      <div className="absolute bottom-[-20%] left-[-15%] w-[400px] h-[400px] rounded-full opacity-[0.04]" style={{ background: 'radial-gradient(circle, #FF6600, transparent 70%)' }} />
      
      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="mb-6">
            <img src="/logo192.png" alt="Gym24" className="w-20 h-20 mx-auto rounded-2xl" style={{ boxShadow: '0 0 40px rgba(255,102,0,0.15)' }} />
          </div>
          <h1 className="text-4xl font-black tracking-tighter mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <span style={{ color: '#FF6600' }}>Gym</span>24
          </h1>
          <p style={{ color: 'var(--text-muted)' }} className="text-sm">Ingresa con tu codigo de socio</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-3 text-center" style={{ color: 'var(--text-secondary)' }}>
              Codigo de Socio
            </label>
            <Input
              type="text"
              value={code}
              onChange={handleCodeChange}
              placeholder="ABC123"
              className="input-dark text-center text-2xl font-mono tracking-[0.3em] h-16"
              style={{ borderColor: code.length === 6 ? '#FF6600' : undefined }}
              maxLength={6}
              autoComplete="off"
              data-testid="member-code-input"
            />
            <div className="flex justify-center gap-1.5 mt-3">
              {[0,1,2,3,4,5].map(i => (
                <div key={i} className="w-2 h-2 rounded-full transition-all" style={{ background: i < code.length ? '#FF6600' : '#222' }} />
              ))}
            </div>
            <p className="text-center text-xs mt-3" style={{ color: 'var(--text-dim)' }}>
              Tu codigo esta en tu tarjeta de socio o email de bienvenida
            </p>
          </div>

          <Button
            type="submit"
            disabled={loading || code.length < 6}
            className="w-full h-14 text-lg font-bold rounded-xl"
            style={{ background: code.length === 6 ? 'linear-gradient(135deg, #FF6600, #E65C00)' : '#1a1a1a', color: code.length === 6 ? '#FFF' : '#555' }}
            data-testid="member-login-btn"
          >
            {loading ? (
              <Loader2 className="animate-spin mr-2" size={24} />
            ) : (
              <QrCode className="mr-2" size={24} />
            )}
            Ingresar
          </Button>
        </form>

        <p className="text-center text-xs mt-8" style={{ color: 'var(--text-dim)' }}>
          ¿No tienes cuenta? Consulta en recepcion
        </p>
      </div>
    </div>
  );
}
