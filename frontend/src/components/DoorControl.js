import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { DoorOpen, DoorClosed, Loader2, CheckCircle2, Zap } from 'lucide-react';
import { getGymDoors, openGymDoor, getGymDoorCommand } from '../lib/api';

const DONE = ['executed', 'failed', 'expired'];
const LABEL = { entrada: 'entrada', salida: 'salida' };

const waitForResult = async (commandId, maxMs) => {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const { data } = await getGymDoorCommand(commandId);
    if (DONE.includes(data.status)) return data;
    await new Promise((r) => setTimeout(r, 300));
  }
  return { status: 'timeout' };
};

const DoorButton = ({ door, direction, state, onOpen }) => {
  const Icon = direction === 'entrada' ? DoorOpen : DoorClosed;
  const busy = state === 'opening';
  const ok = state === 'ok';
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => onOpen(door, direction)}
      className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 px-5 py-4 rounded-xl font-bold text-sm transition-[background-color,transform,border-color] active:scale-95 disabled:opacity-80 border ${
        ok ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
          : direction === 'entrada' ? 'bg-[var(--gym-primary)] border-transparent text-white hover:brightness-110'
            : 'bg-zinc-900 border-zinc-700 text-zinc-100 hover:border-[var(--gym-primary)]/60'
      }`}
      data-testid={`door-open-${direction}-${door.id}`}
    >
      {busy ? <Loader2 size={18} className="animate-spin" /> : ok ? <CheckCircle2 size={18} /> : <Icon size={18} />}
      {ok ? 'Abierto' : `Abrir ${LABEL[direction]}`}
    </button>
  );
};

const DoorRow = ({ door, states, onOpen }) => {
  const online = door.computed_status === 'online';
  return (
    <div className="flex flex-col lg:flex-row lg:items-center gap-3" data-testid={`door-row-${door.id}`}>
      <div className="flex items-center gap-2 lg:w-56 min-w-0">
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${online ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate" data-testid={`door-name-${door.id}`}>{door.name || 'Torno'}</p>
          <p className="text-[11px] flex items-center gap-1" style={{ color: 'var(--text-dim)' }} data-testid={`door-mode-${door.id}`}>
            {!online ? 'Sin conexion' : door.instant ? <><Zap size={11} className="text-amber-400" /> Instantaneo</> : 'Hasta 20 s (actualiza la Raspberry)'}
          </p>
        </div>
      </div>
      <div className="flex gap-3 flex-1">
        {['entrada', 'salida'].map((dir) => (
          <DoorButton key={dir} door={door} direction={dir} state={states[`${door.id}-${dir}`]} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
};

export const DoorControl = () => {
  const [doors, setDoors] = useState([]);
  const [states, setStates] = useState({});

  const fetchDoors = useCallback(async () => {
    try { setDoors((await getGymDoors()).data); } catch { /* sin permisos o sin tornos */ }
  }, []);

  useEffect(() => {
    fetchDoors();
    const t = setInterval(fetchDoors, 15000);
    return () => clearInterval(t);
  }, [fetchDoors]);

  const setState = (key, value) => setStates((s) => ({ ...s, [key]: value }));

  const handleOpen = async (door, direction) => {
    const key = `${door.id}-${direction}`;
    setState(key, 'opening');
    try {
      const { data } = await openGymDoor(door.id, direction);
      const result = await waitForResult(data.command_id, door.instant ? 8000 : 25000);
      if (result.status === 'executed') {
        setState(key, 'ok');
        toast.success(`Torno de ${LABEL[direction]} abierto`);
        setTimeout(() => setState(key, null), 2500);
        return;
      }
      toast.error(result.status === 'timeout' || result.status === 'expired'
        ? 'La Raspberry no respondio. Revisa su conexion.'
        : `Error: ${result.output || 'no se pudo abrir'}`);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error al abrir el torno');
    }
    setState(key, null);
  };

  if (!doors.length) return null;
  return (
    <div className="stat-card space-y-4" data-testid="door-control">
      <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Control de tornos</p>
      {doors.map((door) => <DoorRow key={door.id} door={door} states={states} onOpen={handleOpen} />)}
    </div>
  );
};
