import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { generateQR } from '../../lib/api';
import { getMembershipStatus, getDaysRemaining } from '../../lib/utils';
import { getLabels } from '../../lib/businessLabels';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2, AlertTriangle, CheckCircle, CreditCard, BarChart3, Calendar, Clock, Trophy, Dumbbell, Download, Smartphone, Video } from 'lucide-react';
import { Button } from '../../components/ui/button';

export default function MemberHome() {
  const { member, gym, membership } = useAuth();
  const labels = getLabels(gym?.business_type || 'gym');
  const navigate = useNavigate();
  const [qrCode, setQrCode] = useState('');
  const [expiresAt, setExpiresAt] = useState(0);
  const [refreshSeconds, setRefreshSeconds] = useState(10);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [error, setError] = useState(null);
  const [qrMode, setQrMode] = useState('dynamic');
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // PWA Install Prompt
  useEffect(() => {
    const dismissed = localStorage.getItem(`pwa_install_dismissed_${gym?.id}`);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    const gymAllows = gym?.show_pwa_install_prompt !== false;
    
    if (dismissed || isStandalone || !gymAllows) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    
    // For iOS (no beforeinstallprompt), show manual instructions
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS && !isStandalone && gymAllows && !dismissed) {
      setShowInstallBanner(true);
    }
    
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [gym]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  const dismissInstallBanner = () => {
    localStorage.setItem(`pwa_install_dismissed_${gym?.id}`, 'true');
    setShowInstallBanner(false);
  };

  const fetchQR = useCallback(async () => {
    try {
      setError(null);
      const response = await generateQR();
      setQrCode(response.data.qr_code);
      setExpiresAt(response.data.expires_at);
      setRefreshSeconds(response.data.refresh_seconds);
      setCountdown(response.data.refresh_seconds);
      setQrMode(response.data.qr_mode || 'dynamic');
      setLoading(false);
    } catch (err) {
      console.error('Error generating QR:', err);
      setError('Error al generar QR');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQR();
  }, [fetchQR]);

  // Countdown timer - only for dynamic QR
  useEffect(() => {
    if (qrMode === 'static') return;
    if (countdown <= 0) {
      fetchQR();
      return;
    }

    const timer = setInterval(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, fetchQR, qrMode]);

  const membershipStatus = getMembershipStatus(membership);
  const daysRemaining = membership ? getDaysRemaining(membership.end_date) : 0;
  const isPending = member?.status === 'pending' || (!membership && member?.status !== 'active' && member?.status !== 'suspended');
  const isPaymentSuspended = member?.status === 'suspended' && (
    member?.suspension_type === 'payment' || 
    (member?.suspension_reason || '').toLowerCase().includes('vencida')
  );
  const hasActiveMembership = membership && membership.status === 'active' && membershipStatus.status !== 'expired';

  // Calculate countdown ring
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (countdown / refreshSeconds) * circumference;

  const QRDisplay = ({ size = 200, showTimer = true }) => (
    <div className="relative">
      {showTimer && (
        <svg className="absolute -inset-4 w-[calc(100%+32px)] h-[calc(100%+32px)]" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#27272A" strokeWidth="2" />
          <circle
            cx="50" cy="50" r="45" fill="none"
            stroke="var(--gym-primary)" strokeWidth="2" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 50 50)"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
      )}
      <AnimatePresence mode="wait">
        <motion.div
          key={qrCode}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-white p-4 rounded-2xl"
        >
          {qrCode ? (
            <QRCodeSVG value={qrCode} size={size} level="H" includeMargin={false} bgColor="#FFFFFF" fgColor="#000000" />
          ) : (
            <div style={{ width: size, height: size }} className="bg-zinc-200 animate-pulse rounded" />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );

  const showPaymentAlert = membershipStatus.status === 'expired' || membershipStatus.status === 'expiring';

  return (
    <div className="space-y-5" data-testid="member-home">
      {/* PWA Install Banner */}
      <AnimatePresence>
        {showInstallBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative p-4 rounded-2xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(255,102,0,0.08), rgba(255,102,0,0.03))', border: '1px solid rgba(255,102,0,0.15)' }}
            data-testid="pwa-install-banner"
          >
            <button onClick={dismissInstallBanner} className="absolute top-3 right-3 p-1 rounded-full" style={{ color: 'var(--text-dim)' }} data-testid="dismiss-install-btn">
              <X size={16} />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,102,0,0.15)' }}>
                <Smartphone size={24} style={{ color: '#FF6600' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm" style={{ fontFamily: 'Outfit' }}>Instalar App</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                  {deferredPrompt ? 'Acceso directo en tu pantalla de inicio' : /iPad|iPhone|iPod/.test(navigator.userAgent) ? 'Safari > Compartir > Agregar a inicio' : 'Menu > Agregar a pantalla de inicio'}
                </p>
              </div>
              {deferredPrompt && (
                <Button onClick={handleInstall} size="sm" className="btn-gym-primary text-xs px-4 shrink-0" data-testid="install-pwa-btn">
                  <Download size={14} className="mr-1" /> Instalar
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending / Suspended blocks */}
      {isPending && !isPaymentSuspended && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl text-center" style={{ background: 'rgba(255,102,0,0.06)', border: '1px solid rgba(255,102,0,0.15)' }}
          data-testid="pending-payment-block">
          <CreditCard size={36} className="mx-auto mb-3" style={{ color: '#FF6600' }} />
          <p className="font-bold text-lg mb-1" style={{ color: '#FF6600', fontFamily: 'Outfit' }}>Pago Pendiente</p>
          <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>Realiza el pago de tu {labels.membership.toLowerCase()} para habilitar el acceso.</p>
          <Button onClick={() => navigate('/app/membership')} className="btn-gym-primary" data-testid="pay-membership-btn">
            <CreditCard size={16} className="mr-2" /> Pagar {labels.membership}
          </Button>
        </motion.div>
      )}

      {isPaymentSuspended && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl text-center" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}
          data-testid="payment-suspended-block">
          <AlertTriangle size={36} className="mx-auto mb-3 text-red-500" />
          <p className="text-red-400 font-bold text-lg mb-1" style={{ fontFamily: 'Outfit' }}>Cuenta Suspendida</p>
          <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>Tu {labels.membership.toLowerCase()} ha vencido. Renueva para recuperar el acceso.</p>
          <Button onClick={() => navigate('/app/membership')} className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl" data-testid="renew-membership-btn">
            <CreditCard size={16} className="mr-2" /> Renovar
          </Button>
        </motion.div>
      )}

      {showPaymentAlert && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl flex items-start gap-3"
          style={{ background: membershipStatus.status === 'expired' ? 'rgba(239,68,68,0.06)' : 'rgba(245,158,11,0.06)', border: `1px solid ${membershipStatus.status === 'expired' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)'}` }}
          data-testid="payment-alert">
          <AlertTriangle size={20} className={`shrink-0 mt-0.5 ${membershipStatus.status === 'expired' ? 'text-red-500' : 'text-amber-500'}`} />
          <div className="flex-1">
            <p className={`font-bold text-sm ${membershipStatus.status === 'expired' ? 'text-red-400' : 'text-amber-400'}`} style={{ fontFamily: 'Outfit' }}>
              {membershipStatus.status === 'expired' ? 'Membresia vencida' : `Vence en ${daysRemaining} dias`}
            </p>
            <Button onClick={() => navigate('/app/membership')} className="mt-2 btn-gym-primary text-xs h-8 px-4" data-testid="pay-now-btn">
              <CreditCard size={14} className="mr-1" /> {membershipStatus.status === 'expired' ? 'Renovar' : 'Pagar'}
            </Button>
          </div>
        </motion.div>
      )}

      {/* ===== MAIN QR CARD - Fitness 24 Style ===== */}
      {!isPending && !isPaymentSuspended ? (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden"
        style={{ background: 'linear-gradient(180deg, rgba(255,102,0,0.06) 0%, rgba(10,10,10,0.95) 30%)', border: '1px solid rgba(255,102,0,0.12)' }}
        data-testid="qr-container"
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #FF6600, transparent)' }} />
        
        {/* Member info header */}
        <div className="px-5 pt-5 pb-3">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#FF6600', fontFamily: 'Outfit' }}>Tu acceso</p>
          <h2 className="text-xl font-bold" style={{ fontFamily: 'Outfit' }}>{member?.name}</h2>
          <p className="font-mono text-xs mt-1" style={{ color: 'var(--text-dim)' }}>{member?.code}</p>
        </div>

        {/* QR Code centered */}
        <div 
          className="flex justify-center py-4 cursor-pointer"
          onClick={() => setFullscreen(true)}
          data-testid="qr-expand-btn"
        >
          {loading ? (
            <div className="w-[180px] h-[180px] rounded-2xl animate-pulse" style={{ background: 'var(--bg-tertiary)' }} />
          ) : error ? (
            <div className="w-[180px] h-[180px] rounded-2xl flex items-center justify-center" style={{ background: 'var(--bg-tertiary)' }}>
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          ) : (
            <QRDisplay size={typeof window !== 'undefined' && window.innerWidth < 380 ? 160 : 190} />
          )}
        </div>

        {/* Timer / Status bar */}
        <div className="px-5 pb-5">
          {qrMode === 'dynamic' ? (
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,102,0,0.06)', border: '1px solid rgba(255,102,0,0.1)' }}>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Actualiza en</span>
              <span className="font-mono font-bold text-lg" style={{ color: '#FF6600' }} data-testid="qr-countdown">{countdown}s</span>
            </div>
          ) : (
            <div className="flex items-center justify-center p-3 rounded-xl" style={{ background: 'rgba(255,102,0,0.06)' }}>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>QR fijo - no caduca</span>
            </div>
          )}
          
          <button onClick={() => setFullscreen(true)} className="mt-3 flex items-center gap-2 mx-auto text-xs transition-colors" style={{ color: 'var(--text-dim)' }}>
            <Maximize2 size={13} /> Pantalla completa
          </button>
        </div>
      </motion.div>
      ) : null}

      {/* Membership Status - Compact card */}
      {membership && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex items-center justify-between p-4 rounded-2xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              membershipStatus.color === 'success' ? 'bg-emerald-500/10' : membershipStatus.color === 'warning' ? 'bg-amber-500/10' : 'bg-red-500/10'
            }`}>
              <CheckCircle size={20} className={
                membershipStatus.color === 'success' ? 'text-emerald-500' : membershipStatus.color === 'warning' ? 'text-amber-500' : 'text-red-500'
              } />
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Tu {labels.membership}</p>
              <p className="font-bold text-sm" style={{ fontFamily: 'Outfit' }}>{daysRemaining > 0 ? `${daysRemaining} dias` : 'Vencida'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-mono" style={{ color: 'var(--text-dim)' }}>{membership.plan_name || ''}</p>
          </div>
        </motion.div>
      )}

      {!membership && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="p-5 rounded-2xl text-center" style={{ background: 'rgba(255,102,0,0.04)', border: '1px solid rgba(255,102,0,0.1)' }}>
          <CreditCard size={28} className="mx-auto mb-2" style={{ color: '#FF6600' }} />
          <p className="font-bold text-sm" style={{ color: '#FF6600', fontFamily: 'Outfit' }}>Sin {labels.membership} Activa</p>
          <Button onClick={() => navigate('/app/membership')} className="mt-3 btn-gym-primary text-xs h-9" data-testid="get-membership-btn">
            Ver Planes
          </Button>
        </motion.div>
      )}

      {/* Quick Nav Grid - Fitness 24 style with orange icons */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { icon: BarChart3, label: 'Estadisticas', path: '/app/stats', testId: 'nav-stats' },
            { icon: Trophy, label: 'Logros', path: '/app/achievements', testId: 'nav-achievements' },
            { icon: Dumbbell, label: 'Rutinas', path: '/app/routines', testId: 'nav-routines' },
            { icon: Calendar, label: 'Clases', path: '/app/classes', testId: 'nav-classes' },
            { icon: Clock, label: 'Accesos', path: '/app/history', testId: 'nav-history' },
            { icon: CreditCard, label: labels.membership, path: '/app/membership', testId: 'nav-membership' },
            { icon: Video, label: 'Clases Online', path: '/app/online-classes', testId: 'nav-online-classes' },
          ].map(({ icon: Icon, label, path, testId }) => (
            <button 
              key={path}
              onClick={() => navigate(path)} 
              className="flex flex-col items-center gap-2 py-4 rounded-2xl transition-all active:scale-95"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
              data-testid={testId}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,102,0,0.08)' }}>
                <Icon size={20} style={{ color: '#FF6600' }} />
              </div>
              <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)', fontFamily: 'Outfit' }}>{label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Fullscreen QR Modal */}
      <AnimatePresence>
        {fullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="qr-fullscreen"
            onClick={() => setFullscreen(false)}
            data-testid="qr-fullscreen-modal"
          >
            <button
              onClick={() => setFullscreen(false)}
              className="absolute top-6 right-6 p-3 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors"
              data-testid="close-fullscreen-btn"
            >
              <X size={24} />
            </button>

            <div className="text-center mb-8">
              {gym?.logo_url ? (
                <img src={gym.logo_url.startsWith('/') ? `${process.env.REACT_APP_BACKEND_URL}${gym.logo_url}` : gym.logo_url} alt={gym?.name} className="h-16 max-w-[160px] mx-auto mb-4 object-contain" />
              ) : (
                <div 
                  className="w-16 h-16 rounded-xl mx-auto mb-4 flex items-center justify-center font-black text-2xl"
                  style={{ backgroundColor: 'var(--gym-primary)', color: 'var(--gym-primary-foreground)' }}
                >
                  {gym?.name?.charAt(0)}
                </div>
              )}
              <h2 className="text-xl font-bold">{member?.name}</h2>
              <p className="text-zinc-400 font-mono">{member?.code}</p>
            </div>

            <div onClick={(e) => e.stopPropagation()}>
              <QRDisplay size={280} />
            </div>

            <div className="mt-8 text-center">
              <p className="text-zinc-500 text-sm mb-1">Muestra este código en el escáner</p>
              {qrMode === 'dynamic' ? (
                <p className="font-mono text-lg" style={{ color: 'var(--gym-primary)' }}>
                  Actualiza en {countdown}s
                </p>
              ) : (
                <p className="text-sm text-zinc-400">QR fijo - no caduca</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
