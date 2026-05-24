import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { Dumbbell, Plus, Trash2, Pencil, Save, Loader2 } from 'lucide-react';
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

const IMG_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';

const DEFAULT_EXERCISES = {
  pecho: [
    { name: 'Press de Banca', machine: 'Banco plano + barra', series: 4, reps: '10-12', img: 'Barbell_Bench_Press_-_Medium_Grip', description: 'Acuestate en el banco, agarra la barra a la anchura de los hombros.' },
    { name: 'Press Inclinado con Mancuernas', machine: 'Banco inclinado + mancuernas', series: 3, reps: '12', img: 'Dumbbell_Bench_Press', description: 'Banco a 30-45 grados.' },
    { name: 'Aperturas en Maquina', machine: 'Pec Deck / Contractora', series: 3, reps: '15', img: 'Butterfly', description: 'Junta los brazos por delante del pecho.' },
    { name: 'Cruces en Polea', machine: 'Polea alta doble', series: 3, reps: '12-15', img: 'Cable_Crossover', description: 'Junta las manos por delante con brazos estirados.' },
  ],
  hombros: [
    { name: 'Press Militar', machine: 'Barra + rack', series: 4, reps: '10', img: 'Barbell_Shoulder_Press', description: 'Empuja la barra desde los hombros hacia arriba.' },
    { name: 'Elevaciones Laterales', machine: 'Mancuernas', series: 3, reps: '15', img: 'Side_Lateral_Raise', description: 'Sube mancuernas a los lados.' },
    { name: 'Elevaciones Frontales', machine: 'Mancuernas', series: 3, reps: '12', img: 'Front_Dumbbell_Raise', description: 'Sube el peso por delante.' },
  ],
  biceps: [
    { name: 'Curl con Barra', machine: 'Barra recta o Z', series: 4, reps: '10-12', img: 'Barbell_Curl', description: 'Flexiona los codos para subir la barra.' },
    { name: 'Curl Alterno', machine: 'Mancuernas', series: 3, reps: '12', img: 'Alternate_Dumbbell_Curl', description: 'Alterna cada mancuerna.' },
    { name: 'Curl Martillo', machine: 'Mancuernas', series: 3, reps: '12', img: 'Hammer_Curls', description: 'Agarre neutro.' },
  ],
  triceps: [
    { name: 'Extension en Polea', machine: 'Polea alta + cuerda', series: 4, reps: '12', img: 'Triceps_Pushdown', description: 'Empuja la cuerda hacia abajo.' },
    { name: 'Press Frances', machine: 'Barra Z', series: 3, reps: '12', img: 'EZ-Bar_Skullcrusher', description: 'Baja la barra hacia la frente.' },
    { name: 'Fondos en Banco', machine: 'Banco', series: 3, reps: '12', img: 'Bench_Dips', description: 'Baja el cuerpo flexionando codos.' },
  ],
  abdomen: [
    { name: 'Crunch Abdominal', machine: 'Colchoneta', series: 4, reps: '20', img: 'Crunches', description: 'Eleva los hombros del suelo.' },
    { name: 'Plancha Frontal', machine: 'Colchoneta', series: 3, reps: '45 seg', img: 'Plank', description: 'Mantén el cuerpo recto.' },
    { name: 'Elevacion de Piernas', machine: 'Barra', series: 3, reps: '15', img: 'Hanging_Leg_Raise', description: 'Sube las piernas colgado.' },
  ],
  dorsales: [
    { name: 'Jalon al Pecho', machine: 'Polea alta', series: 4, reps: '12', img: 'Wide-Grip_Lat_Pulldown', description: 'Tira de la barra al pecho.' },
    { name: 'Dominadas', machine: 'Barra', series: 3, reps: '8-10', img: 'Pullups', description: 'Sube hasta pasar la barbilla.' },
    { name: 'Remo con Barra', machine: 'Barra', series: 4, reps: '10', img: 'Bent_Over_Barbell_Row', description: 'Tira de la barra al abdomen.' },
  ],
  espalda_media: [
    { name: 'Remo en Polea', machine: 'Polea baja', series: 4, reps: '12', img: 'Seated_Cable_Rows', description: 'Tira del agarre al abdomen.' },
  ],
  trapecios: [
    { name: 'Encogimientos', machine: 'Barra o mancuernas', series: 4, reps: '12', img: 'Barbell_Shrug', description: 'Sube los hombros a las orejas.' },
    { name: 'Face Pull', machine: 'Polea alta + cuerda', series: 3, reps: '15', img: 'Face_Pull', description: 'Tira de la cuerda hacia la cara.' },
  ],
  lumbares: [
    { name: 'Hiperextensiones', machine: 'Banco', series: 3, reps: '15', img: 'Hyperextensions__Back_Extensions_', description: 'Baja y sube el torso.' },
    { name: 'Peso Muerto Rumano', machine: 'Barra', series: 4, reps: '10', img: 'Romanian_Deadlift', description: 'Baja la barra por las piernas.' },
  ],
  cuadriceps: [
    { name: 'Sentadilla', machine: 'Rack + barra', series: 4, reps: '10', img: 'Barbell_Squat', description: 'Baja hasta muslos paralelos.' },
    { name: 'Prensa', machine: 'Maquina de prensa', series: 4, reps: '12', img: 'Leg_Press', description: 'Empuja la plataforma.' },
    { name: 'Extension de Piernas', machine: 'Maquina', series: 3, reps: '15', img: 'Leg_Extensions', description: 'Extiende las piernas.' },
  ],
  isquiotibiales: [
    { name: 'Curl Femoral', machine: 'Maquina', series: 4, reps: '12', img: 'Lying_Leg_Curls', description: 'Flexiona las rodillas.' },
    { name: 'Peso Muerto Rumano', machine: 'Barra', series: 4, reps: '10', img: 'Romanian_Deadlift', description: 'Estira atras del muslo.' },
  ],
  gluteos: [
    { name: 'Hip Thrust', machine: 'Banco + barra', series: 4, reps: '12', img: 'Barbell_Hip_Thrust', description: 'Sube la cadera apretando gluteos.' },
    { name: 'Sentadilla Sumo', machine: 'Barra', series: 3, reps: '12', img: 'Sumo_Deadlift', description: 'Piernas abiertas, pies afuera.' },
  ],
  gemelos: [
    { name: 'Elevacion de Talones', machine: 'Maquina o Smith', series: 4, reps: '20', img: 'Standing_Calf_Raises', description: 'Sube y baja los talones.' },
    { name: 'Gemelos Sentado', machine: 'Maquina sentado', series: 3, reps: '20', img: 'Seated_Calf_Raise', description: 'Sube los talones sentado.' },
  ],
  antebrazos: [
    { name: 'Curl de Muneca', machine: 'Barra', series: 3, reps: '20', img: 'Palms-Up_Barbell_Wrist_Curl_Over_A_Bench', description: 'Flexiona las munecas.' },
  ],
};

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
      ) : (
        <div className="space-y-6">
          {/* Custom exercises */}
          {filteredExercises.length > 0 && (
            <div>
              <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: '#FF6600', fontFamily: 'Outfit' }}>
                <Pencil size={14} /> Ejercicios Personalizados ({filteredExercises.length})
              </h2>
              <div className="space-y-3">
                {filteredExercises.map(ex => (
                  <div key={ex.id} className="stat-card flex items-start gap-4" data-testid={`exercise-${ex.id}`}>
                    {ex.image_url ? (
                      <img src={ex.image_url} alt={ex.name} className="w-20 h-20 rounded-xl object-cover shrink-0" style={{ background: '#111' }} />
                    ) : (
                      <div className="w-20 h-20 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,102,0,0.06)' }}>
                        <Dumbbell size={24} style={{ color: '#FF6600' }} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold" style={{ fontFamily: 'Outfit' }}>{ex.name}</h3>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{ex.machine}</p>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-lg mt-1 inline-block" style={{ background: 'rgba(255,102,0,0.08)', color: '#FF6600' }}>{ex.series}x{ex.reps}</span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => openEdit(ex)} className="p-2 rounded-lg hover:bg-zinc-800"><Pencil size={16} style={{ color: 'var(--text-muted)' }} /></button>
                      <button onClick={() => handleDelete(ex.id)} className="p-2 rounded-lg hover:bg-red-500/10"><Trash2 size={16} className="text-red-500" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Default exercises */}
          {(DEFAULT_EXERCISES[selectedGroup] || []).length > 0 && (
            <div>
              <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-secondary)', fontFamily: 'Outfit' }}>
                <Dumbbell size={14} /> Ejercicios del Sistema ({(DEFAULT_EXERCISES[selectedGroup] || []).length})
              </h2>
              <div className="space-y-3">
                {(DEFAULT_EXERCISES[selectedGroup] || []).map((ex, i) => (
                  <div key={i} className="stat-card flex items-start gap-4 opacity-80">
                    {ex.img ? (
                      <img src={`${IMG_BASE}/${ex.img}/0.jpg`} alt={ex.name} className="w-20 h-20 rounded-xl object-cover shrink-0" style={{ background: '#111' }} onError={e => e.target.style.display='none'} />
                    ) : (
                      <div className="w-20 h-20 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <Dumbbell size={24} style={{ color: 'var(--text-dim)' }} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold" style={{ fontFamily: 'Outfit' }}>{ex.name}</h3>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{ex.machine}</p>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-lg mt-1 inline-block" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>{ex.series}x{ex.reps}</span>
                      {ex.description && <p className="text-xs mt-1 line-clamp-1" style={{ color: 'var(--text-dim)' }}>{ex.description}</p>}
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-lg shrink-0" style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-dim)' }}>Por defecto</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredExercises.length === 0 && !(DEFAULT_EXERCISES[selectedGroup] || []).length && (
            <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
              <Dumbbell size={48} className="mx-auto mb-4 opacity-30" />
              <p>No hay ejercicios para esta zona</p>
            </div>
          )}
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
