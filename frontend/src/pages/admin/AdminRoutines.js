import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { Dumbbell, Plus, Trash2, Pencil, Save, Image, Loader2, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const MUSCLE_GROUPS = [
  { id: 'pecho', label: 'Pecho' },
  { id: 'hombros', label: 'Hombros' },
  { id: 'biceps', label: 'Biceps' },
  { id: 'triceps', label: 'Triceps' },
  { id: 'antebrazos', label: 'Antebrazos' },
  { id: 'abdomen', label: 'Abdomen' },
  { id: 'dorsales', label: 'Dorsales' },
  { id: 'espalda_media', label: 'Espalda Media' },
  { id: 'trapecios', label: 'Trapecios' },
  { id: 'lumbares', label: 'Lumbares' },
  { id: 'cuadriceps', label: 'Cuadriceps' },
  { id: 'isquiotibiales', label: 'Isquiotibiales' },
  { id: 'gluteos', label: 'Gluteos' },
  { id: 'gemelos', label: 'Gemelos' },
];

export default function AdminRoutines() {
  const { admin } = useAuth();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState('pecho');
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', machine: '', series: 3, reps: '12', description: '', muscle_group: 'pecho', image_url: '' });

  const fetchExercises = useCallback(async () => {
    try {
      const gymId = admin?.gym_id || '';
      const res = await axios.get(`${API}/exercises/custom${gymId ? `?gym_id=${gymId}` : ''}`);
      setExercises(res.data);
    } catch { toast.error('Error al cargar ejercicios'); }
    finally { setLoading(false); }
  }, [admin]);

  useEffect(() => { fetchExercises(); }, [fetchExercises]);

  const filteredExercises = exercises.filter(e => e.muscle_group === selectedGroup);

  const handleSave = async () => {
    if (!form.name) { toast.error('El nombre es obligatorio'); return; }
    setSaving(true);
    try {
      if (editingId) {
        await axios.put(`${API}/exercises/custom/${editingId}`, form);
        toast.success('Ejercicio actualizado');
      } else {
        await axios.post(`${API}/exercises/custom`, { ...form, muscle_group: selectedGroup });
        toast.success('Ejercicio creado');
      }
      setShowCreate(false);
      setEditingId(null);
      setForm({ name: '', machine: '', series: 3, reps: '12', description: '', muscle_group: selectedGroup, image_url: '' });
      fetchExercises();
    } catch (err) { toast.error(err.response?.data?.detail || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminar este ejercicio?')) return;
    try { await axios.delete(`${API}/exercises/custom/${id}`); toast.success('Eliminado'); fetchExercises(); }
    catch { toast.error('Error'); }
  };

  const openEdit = (ex) => {
    setForm({ name: ex.name, machine: ex.machine, series: ex.series, reps: ex.reps, description: ex.description, muscle_group: ex.muscle_group, image_url: ex.image_url || '' });
    setEditingId(ex.id);
    setShowCreate(true);
  };

  const openCreate = () => {
    setForm({ name: '', machine: '', series: 3, reps: '12', description: '', muscle_group: selectedGroup, image_url: '' });
    setEditingId(null);
    setShowCreate(true);
  };

  return (
    <div className="space-y-6" data-testid="admin-routines">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit' }}>Gestionar Rutinas</h1>
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm">Personaliza los ejercicios por zona muscular</p>
        </div>
        <Button onClick={openCreate} className="btn-gym-primary" data-testid="add-exercise-btn">
          <Plus size={18} className="mr-2" /> Nuevo Ejercicio
        </Button>
      </div>

      {/* Muscle group tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {MUSCLE_GROUPS.map(g => (
          <button key={g.id} onClick={() => setSelectedGroup(g.id)}
            className="px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all shrink-0"
            style={selectedGroup === g.id
              ? { background: 'linear-gradient(135deg, #FF6600, #E65C00)', color: '#FFF' }
              : { background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-primary)' }}
            data-testid={`group-tab-${g.id}`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* Exercise list */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-zinc-500" size={32} /></div>
      ) : filteredExercises.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
          <Dumbbell size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-bold mb-1">Sin ejercicios personalizados para {MUSCLE_GROUPS.find(g => g.id === selectedGroup)?.label}</p>
          <p className="text-xs mb-4">Los socios veran los ejercicios por defecto del sistema</p>
          <Button onClick={openCreate} className="btn-gym-primary" data-testid="add-first-exercise">
            <Plus size={16} className="mr-2" /> Crear Primer Ejercicio
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredExercises.map(ex => (
            <div key={ex.id} className="stat-card flex items-start gap-4" data-testid={`exercise-${ex.id}`}>
              {/* Image */}
              {ex.image_url ? (
                <img src={ex.image_url} alt={ex.name} className="w-20 h-20 rounded-xl object-cover shrink-0" style={{ background: '#111' }} />
              ) : (
                <div className="w-20 h-20 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,102,0,0.06)' }}>
                  <Dumbbell size={24} style={{ color: '#FF6600' }} />
                </div>
              )}
              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold" style={{ fontFamily: 'Outfit' }}>{ex.name}</h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{ex.machine}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ background: 'rgba(255,102,0,0.08)', color: '#FF6600' }}>
                    {ex.series}x{ex.reps}
                  </span>
                </div>
                {ex.description && <p className="text-xs mt-2 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{ex.description}</p>}
              </div>
              {/* Actions */}
              <div className="flex gap-1 shrink-0">
                <button onClick={() => openEdit(ex)} className="p-2 rounded-lg hover:bg-zinc-800 transition-colors" data-testid={`edit-${ex.id}`}>
                  <Pencil size={16} style={{ color: 'var(--text-muted)' }} />
                </button>
                <button onClick={() => handleDelete(ex.id)} className="p-2 rounded-lg hover:bg-red-500/10 transition-colors" data-testid={`delete-${ex.id}`}>
                  <Trash2 size={16} className="text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Dumbbell size={20} style={{ color: '#FF6600' }} />
              {editingId ? 'Editar Ejercicio' : 'Nuevo Ejercicio'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Zona Muscular</label>
              <select value={form.muscle_group} onChange={e => setForm(f => ({ ...f, muscle_group: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white" data-testid="exercise-group-select">
                {MUSCLE_GROUPS.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Nombre del Ejercicio *</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Press de Banca" className="input-dark" data-testid="exercise-name" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Maquina / Equipamiento</label>
              <Input value={form.machine} onChange={e => setForm(f => ({ ...f, machine: e.target.value }))} placeholder="Ej: Banco plano + barra" className="input-dark" data-testid="exercise-machine" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Series</label>
                <Input type="number" value={form.series} onChange={e => setForm(f => ({ ...f, series: parseInt(e.target.value) || 0 }))} className="input-dark" data-testid="exercise-series" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Repeticiones</label>
                <Input value={form.reps} onChange={e => setForm(f => ({ ...f, reps: e.target.value }))} placeholder="12" className="input-dark" data-testid="exercise-reps" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>URL de Imagen (opcional)</label>
              <Input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://ejemplo.com/imagen.jpg" className="input-dark" data-testid="exercise-image" />
              {form.image_url && (
                <img src={form.image_url} alt="Preview" className="mt-2 h-24 rounded-xl object-cover" style={{ background: '#111' }} onError={e => e.target.style.display='none'} />
              )}
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Descripcion / Instrucciones</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Como realizar el ejercicio..." className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white resize-none h-24" data-testid="exercise-desc" />
            </div>
            <Button onClick={handleSave} disabled={saving || !form.name} className="w-full btn-gym-primary" data-testid="save-exercise-btn">
              {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
              {editingId ? 'Guardar Cambios' : 'Crear Ejercicio'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
