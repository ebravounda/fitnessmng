import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Globe, MapPin, Thermometer, Cpu, MemoryStick, HardDrive, Clock, Wifi, ScanLine, Camera,
  Power, RotateCcw, DoorOpen, DoorClosed, Video, Loader2, CheckCircle2, XCircle, Hourglass, Link2,
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from './ui/alert-dialog';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const COMMANDS = [
  { id: 'open_entrada', label: 'Abrir entrada', icon: DoorOpen },
  { id: 'open_salida', label: 'Abrir salida', icon: DoorClosed },
  { id: 'test_video', label: 'Video prueba', icon: Video },
  { id: 'pair_readers', label: 'Emparejar lectores', icon: Link2, hint: 'Escanea un QR en el lector de ENTRADA en los proximos 60 s' },
  { id: 'restart_service', label: 'Reiniciar servicio', icon: RotateCcw, confirm: true },
  { id: 'reboot', label: 'Reiniciar RPi', icon: Power, confirm: true, danger: true },
];

const STATUS_UI = {
  pending: { label: 'Pendiente', icon: Hourglass, cls: 'text-amber-400' },
  delivered: { label: 'Ejecutando', icon: Loader2, cls: 'text-sky-400 animate-spin' },
  executed: { label: 'OK', icon: CheckCircle2, cls: 'text-emerald-400' },
  failed: { label: 'Error', icon: XCircle, cls: 'text-red-400' },
  expired: { label: 'Expirado', icon: XCircle, cls: 'text-zinc-500' },
};

const formatUptime = (s) => {
  if (s == null) return '-';
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  return d ? `${d}d ${h}h` : `${h}h ${m}m`;
};

const formatAgo = (sec) => {
  if (sec == null) return 'nunca';
  if (sec < 60) return `hace ${sec}s`;
  if (sec < 3600) return `hace ${Math.floor(sec / 60)} min`;
  if (sec < 86400) return `hace ${Math.floor(sec / 3600)} h`;
  return `hace ${Math.floor(sec / 86400)} d`;
};

const Metric = ({ icon: Icon, label, value, alert, testId }) => (
  <div className={`rounded-lg px-3 py-2 border ${alert ? 'border-red-500/40 bg-red-500/10' : 'border-zinc-800 bg-zinc-900/40'}`} data-testid={testId}>
    <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
      <Icon size={12} /> {label}
    </div>
    <p className={`text-sm font-mono font-bold mt-0.5 truncate ${alert ? 'text-red-400' : ''}`} title={String(value)}>{value}</p>
  </div>
);

const pct = (v) => (v == null ? '-' : `${v}%`);

const DeviceMetrics = ({ d, isOnline }) => {
  const readers = d.qr_readers || [];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2" data-testid={`device-metrics-${d.id}`}>
      <Metric icon={MapPin} label="IP local" value={d.local_ip || '-'} testId={`device-local-ip-${d.id}`} />
      <Metric icon={Globe} label="IP publica" value={d.ip_address || '-'} testId={`device-public-ip-${d.id}`} />
      <Metric icon={Thermometer} label="Temp" value={d.cpu_temp == null ? '-' : `${d.cpu_temp}°C`} alert={d.cpu_temp > 70} testId={`device-temp-${d.id}`} />
      <Metric icon={Cpu} label="CPU" value={pct(d.cpu_usage)} alert={d.cpu_usage > 90} testId={`device-cpu-${d.id}`} />
      <Metric icon={MemoryStick} label="RAM" value={pct(d.memory_usage)} alert={d.memory_usage > 90} testId={`device-ram-${d.id}`} />
      <Metric icon={HardDrive} label="Disco" value={pct(d.disk_usage)} alert={d.disk_usage > 90} testId={`device-disk-${d.id}`} />
      <Metric icon={Clock} label="Encendida" value={formatUptime(d.uptime)} testId={`device-uptime-${d.id}`} />
      <Metric icon={Wifi} label="WiFi" value={d.wifi_signal == null ? 'Cable / -' : `${d.wifi_signal}/70`} alert={d.wifi_signal != null && d.wifi_signal < 25} testId={`device-wifi-${d.id}`} />
      <Metric icon={ScanLine} label="Lectores QR" value={readers.length ? `${readers.length} detectado(s)` : 'Ninguno'} alert={isOnline && d.software_version && !readers.length} testId={`device-readers-${d.id}`} />
      <Metric icon={Camera} label="Camara" value={d.camera || 'No detectada'} alert={isOnline && d.software_version && !d.camera} testId={`device-camera-${d.id}`} />
      <Metric icon={ScanLine} label="Ultimo escaneo" value={d.last_scan_result || '-'} testId={`device-last-scan-${d.id}`} />
      <Metric icon={Cpu} label="Version" value={d.software_version || 'Antigua'} testId={`device-version-${d.id}`} />
      <Metric icon={Link2} label="Asignacion" value={d.pairing ? 'Esperando QR en ENTRADA...' : (d.reader_mode || '-')} alert={isOnline && (d.reader_mode || '').includes('SIN EMPAREJAR')} testId={`device-reader-mode-${d.id}`} />
      <Metric icon={RotateCcw} label="Inversion" value={[d.invert_readers && 'Lectores', d.invert_relays && 'Reles'].filter(Boolean).join(' + ') || 'No'} testId={`device-inversion-${d.id}`} />
    </div>
  );
};

const CommandHistory = ({ commands, deviceId }) => {
  if (!commands?.length) return <p className="text-xs" style={{ color: 'var(--text-dim)' }} data-testid={`device-no-commands-${deviceId}`}>Sin comandos recientes</p>;
  return (
    <ul className="space-y-1" data-testid={`device-command-history-${deviceId}`}>
      {commands.map((c) => {
        const ui = STATUS_UI[c.status] || STATUS_UI.pending;
        const Icon = ui.icon;
        return (
          <li key={c.id} className="flex items-center gap-2 text-xs" data-testid={`command-row-${c.id}`}>
            <Icon size={13} className={ui.cls} />
            <span className="font-semibold">{c.label || c.command}</span>
            <span className={ui.cls.replace(' animate-spin', '')}>{ui.label}</span>
            <span className="truncate" style={{ color: 'var(--text-muted)' }}>{c.output || ''}</span>
            <span className="ml-auto shrink-0 font-mono" style={{ color: 'var(--text-dim)' }}>{new Date(c.created_at).toLocaleTimeString('es-ES')}</span>
          </li>
        );
      })}
    </ul>
  );
};

const CommandBar = ({ deviceId, isOnline, onSent }) => {
  const [sending, setSending] = useState(null);
  const [confirmCmd, setConfirmCmd] = useState(null);

  const send = async (cmd) => {
    setSending(cmd.id);
    try {
      await axios.post(`${API}/devices/${deviceId}/command`, { command: cmd.id });
      toast.success(cmd.hint || `"${cmd.label}" enviado`, { duration: cmd.hint ? 10000 : 4000 });
      onSent();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error al enviar comando');
    } finally { setSending(null); }
  };

  return (
    <div className="flex flex-wrap gap-2" data-testid={`device-commands-${deviceId}`}>
      {COMMANDS.map((cmd) => {
        const Icon = cmd.icon;
        return (
          <button
            key={cmd.id}
            type="button"
            disabled={!!sending}
            onClick={() => (cmd.confirm ? setConfirmCmd(cmd) : send(cmd))}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-colors disabled:opacity-50 ${cmd.danger ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' : 'border-zinc-700 text-zinc-300 hover:bg-[var(--gym-primary)]/10 hover:border-[var(--gym-primary)]/50'}`}
            data-testid={`cmd-${cmd.id}-${deviceId}`}
          >
            {sending === cmd.id ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />} {cmd.label}
          </button>
        );
      })}
      {!isOnline && <span className="text-xs self-center text-amber-400" data-testid={`device-offline-warning-${deviceId}`}>Offline: el comando se ejecutara al reconectar (max 10 min)</span>}
      <AlertDialog open={!!confirmCmd} onOpenChange={(o) => !o && setConfirmCmd(null)}>
        <AlertDialogContent data-testid="command-confirm-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmCmd?.label}?</AlertDialogTitle>
            <AlertDialogDescription>El control de acceso de este gimnasio dejara de funcionar durante unos segundos{confirmCmd?.id === 'reboot' ? ' (aprox. 1 minuto)' : ''}.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="command-confirm-cancel">Cancelar</AlertDialogCancel>
            <AlertDialogAction data-testid="command-confirm-ok" onClick={() => { send(confirmCmd); setConfirmCmd(null); }}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export const DeviceMonitorCard = ({ d, onRefresh }) => {
  const isOnline = d.computed_status === 'online';
  return (
    <div
      className="stat-card space-y-4"
      style={{ borderColor: isOnline ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.35)' }}
      data-testid={`device-card-${d.id}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-3 h-3 rounded-full shrink-0 ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
          <div className="min-w-0">
            <h3 className="font-bold truncate" data-testid={`device-name-${d.id}`}>{d.name || 'Dispositivo'}</h3>
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{d.gym_name}{d.hostname ? ` · ${d.hostname}` : ''}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className={`text-xs px-3 py-1.5 rounded-lg font-bold ${isOnline ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`} data-testid={`device-status-${d.id}`}>
            {isOnline ? 'EN LINEA' : 'OFFLINE'}
          </span>
          <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-dim)' }} data-testid={`device-last-ping-${d.id}`}>Ultima señal {formatAgo(d.seconds_since_ping)}</p>
        </div>
      </div>
      <DeviceMetrics d={d} isOnline={isOnline} />
      {!d.software_version && (
        <p className="text-xs text-amber-400" data-testid={`device-old-script-${d.id}`}>Esta Raspberry usa el script antiguo: actualiza raspberry_access_control.py para ver métricas y enviar comandos.</p>
      )}
      <CommandBar deviceId={d.id} isOnline={isOnline} onSent={onRefresh} />
      <CommandHistory commands={d.recent_commands} deviceId={d.id} />
    </div>
  );
};
