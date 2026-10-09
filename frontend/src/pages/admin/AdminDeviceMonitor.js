import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { Wifi, WifiOff, RefreshCw, Cpu } from 'lucide-react';
import { DeviceMonitorCard } from '../../components/DeviceMonitorCard';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminDeviceMonitor() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDevices = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/devices/status`);
      setDevices(res.data);
    } catch { toast.error('Error al cargar dispositivos'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDevices(); const i = setInterval(fetchDevices, 10000); return () => clearInterval(i); }, [fetchDevices]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[var(--gym-primary)] border-t-transparent rounded-full animate-spin" /></div>;

  const onlineCount = devices.filter(d => d.computed_status === 'online').length;
  const offlineCount = devices.filter(d => d.computed_status === 'offline').length;

  return (
    <div className="space-y-6" data-testid="device-monitor-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Monitor RPi</h1>
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm">Estado de dispositivos Raspberry Pi</p>
        </div>
        <Button onClick={fetchDevices} variant="outline" size="sm" className="border-zinc-700 text-zinc-300" data-testid="refresh-devices-btn">
          <RefreshCw size={16} className="mr-2" /> Actualizar
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card text-center">
          <Wifi size={22} className="mx-auto text-emerald-500 mb-2" />
          <p className="text-2xl font-bold text-emerald-500">{onlineCount}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>En linea</p>
        </div>
        <div className="stat-card text-center">
          <WifiOff size={22} className="mx-auto text-red-500 mb-2" />
          <p className="text-2xl font-bold text-red-500">{offlineCount}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Offline</p>
        </div>
        <div className="stat-card text-center">
          <Cpu size={22} className="mx-auto mb-2" style={{ color: 'var(--text-secondary)' }} />
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{devices.length}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total</p>
        </div>
      </div>

      {/* Devices */}
      {devices.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
          <Cpu size={48} className="mx-auto mb-4 opacity-40" />
          <p>No hay dispositivos registrados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {devices.map((d) => <DeviceMonitorCard key={d.id} d={d} onRefresh={fetchDevices} />)}
        </div>
      )}
    </div>
  );
}
