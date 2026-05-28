import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Loader2, QrCode, AlertOctagon, Mail, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function MemberLogin() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [remember, setRemember] = useState(true);
  const [showRecover, setShowRecover] = useState(false);
  const [docId, setDocId] = useState('');
  const [recoverLoading, setRecoverLoading] = useState(false);
  const { loginMember } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code || code.length < 6) {
      toast.error('Ingresa tu codigo de socio (6 caracteres)');
      return;
    }

    setLoading(true);
    try {
      await loginMember(code.toUpperCase(), remember);
      toast.success('Bienvenido!');
      navigate('/app');
    } catch (error) {
      const detail = error.response?.data?.detail || '';
      if (detail === 'Cuenta Bloqueada') {
        setBlocked(true);
      } else {
        toast.error(detail || 'Codigo no encontrado');
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

  const handleRecoverCode = async (e) => {
    e.preventDefault();
    if (!docId.trim()) {
      toast.error('Ingresa tu DNI / NIE / Pasaporte');
      return;
    }
    setRecoverLoading(true);
    try {
      const res = await axios.post(`${API}/members/recover-code`, { document_id: docId.trim() });
      toast.success(res.data.message || 'Si el documento esta registrado, recibiras tu numero de socio por email.');
      setShowRecover(false);
      setDocId('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al recuperar codigo');
    } finally {
      setRecoverLoading(false);
    }
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

  if (showRecover) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-[-30%] right-[-20%] w-[500px] h-[500px] rounded-full opacity-[0.06]" style={{ background: 'radial-gradient(circle, #FF6600, transparent 70%)' }} />
        <div className="absolute bottom-[-20%] left-[-15%] w-[400px] h-[400px] rounded-full opacity-[0.04]" style={{ background: 'radial-gradient(circle, #FF6600, transparent 70%)' }} />

        <div className="relative z-10 w-full max-w-sm">
          <button
            onClick={() => { setShowRecover(false); setDocId(''); }}
            className="flex items-center gap-2 mb-6 text-sm transition-colors"
            style={{ color: 'var(--text-muted)' }}
            data-testid="recover-back-btn"
          >
            <ArrowLeft size={16} /> Volver al inicio de sesion
          </button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mb-4">
              <Mail size={32} className="text-orange-500" />
            </div>
            <h1 className="text-2xl font-black mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Recupera tu numero de socio
            </h1>
            <p style={{ color: 'var(--text-muted)' }} className="text-sm">
              Ingresa tu DNI / NIE / Pasaporte y te enviaremos tu codigo de socio por email.
            </p>
          </div>

          <form onSubmit={handleRecoverCode} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                DNI / NIE / Pasaporte
              </label>
              <Input
                type="text"
                value={docId}
                onChange={(e) => setDocId(e.target.value)}
                placeholder="12345678A"
                className="input-dark h-14 text-lg"
                autoComplete="off"
                data-testid="recover-document-input"
                autoFocus
              />
            </div>

            <Button
              type="submit"
              disabled={recoverLoading || !docId.trim()}
              className="w-full h-14 text-lg font-bold rounded-xl"
              style={{ background: docId.trim() ? 'linear-gradient(135deg, #FF6600, #E65C00)' : '#1a1a1a', color: docId.trim() ? '#FFF' : '#555' }}
              data-testid="recover-submit-btn"
            >
              {recoverLoading ? (
                <Loader2 className="animate-spin mr-2" size={24} />
              ) : (
                <Mail className="mr-2" size={20} />
              )}
              Enviar mi codigo
            </Button>
          </form>

          <p className="text-center text-xs mt-6" style={{ color: 'var(--text-dim)' }}>
            Solo recibiras el email si tu DNI esta registrado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden">
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
          </div>

          {/* Remember me checkbox */}
          <label className="flex items-center justify-center gap-2 cursor-pointer select-none" data-testid="remember-toggle">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 rounded accent-orange-500"
            />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Recordar sesion (30 dias)
            </span>
          </label>

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

        <div className="mt-6 text-center space-y-3">
          <button
            type="button"
            onClick={() => setShowRecover(true)}
            className="text-sm font-medium transition-colors hover:text-orange-400"
            style={{ color: '#FF6600' }}
            data-testid="recover-code-link"
          >
            Recupera tu numero de socio
          </button>
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
            No tienes cuenta? Consulta en recepcion
          </p>
        </div>
      </div>
    </div>
  );
}
