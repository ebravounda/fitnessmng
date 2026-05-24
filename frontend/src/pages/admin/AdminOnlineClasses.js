import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Video, Plus, Trash2, Loader2, Play, Clock, Upload, Search } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CATEGORIES = [
  { value: 'yoga', label: 'Yoga' },
  { value: 'spinning', label: 'Spinning' },
  { value: 'pilates', label: 'Pilates' },
  { value: 'crossfit', label: 'CrossFit' },
  { value: 'zumba', label: 'Zumba' },
  { value: 'boxeo', label: 'Boxeo' },
  { value: 'funcional', label: 'Funcional' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'fuerza', label: 'Fuerza' },
  { value: 'estiramiento', label: 'Estiramiento' },
  { value: 'natacion', label: 'Natacion' },
  { value: 'general', label: 'General' },
];

export default function AdminOnlineClasses() {
  const { admin } = useAuth();
  const [classes, setClasses] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [duration, setDuration] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const [assignedTo, setAssignedTo] = useState('all');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [memberSearch, setMemberSearch] = useState('');
  const fileRef = useRef(null);

  useEffect(() => { fetchClasses(); fetchMembers(); }, []);

  const fetchMembers = async () => {
    try {
      const gymId = admin?.gym_id || '';
      const res = await axios.get(`${API}/members${gymId ? `?gym_id=${gymId}` : ''}`);
      const data = Array.isArray(res.data) ? res.data : res.data.members || [];
      setMembers(data);
    } catch {}
  };

  useEffect(() => { fetchClasses(); }, []);

  const fetchClasses = async () => {
    try {
      const gymId = admin?.gym_id || '';
      const res = await axios.get(`${API}/classes/online${gymId ? `?gym_id=${gymId}` : ''}`);
      setClasses(res.data);
    } catch { toast.error('Error al cargar clases'); }
    finally { setLoading(false); }
  };

  const handleUpload = async () => {
    if (!title || !videoFile) { toast.error('Titulo y video son obligatorios'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('title', title);
      fd.append('description', description);
      fd.append('category', category);
      fd.append('duration_minutes', duration || '0');
      fd.append('assigned_to', assignedTo === 'all' ? 'all' : selectedMembers.join(','));
      fd.append('video', videoFile);
      await axios.post(`${API}/classes/online`, fd, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 300000 });
      toast.success('Clase subida correctamente');
      setShowCreate(false);
      setTitle(''); setDescription(''); setCategory('general'); setDuration(''); setVideoFile(null); setAssignedTo('all'); setSelectedMembers([]);
      fetchClasses();
    } catch (err) { toast.error(err.response?.data?.detail || 'Error al subir'); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminar esta clase?')) return;
    try { await axios.delete(`${API}/classes/online/${id}`); toast.success('Eliminada'); fetchClasses(); }
    catch { toast.error('Error'); }
  };

  const formatSize = (bytes) => {
    if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  return (
    <div className="space-y-6" data-testid="admin-online-classes">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit' }}>Clases Online</h1>
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm">{classes.length} videos subidos</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="btn-gym-primary" data-testid="add-class-btn">
          <Plus size={18} className="mr-2" /> Subir Video
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-zinc-500" size={32} /></div>
      ) : classes.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
          <Video size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-bold mb-1">No hay clases online</p>
          <p className="text-xs">Sube videos para que los socios entrenen desde casa</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map(cls => (
            <div key={cls.id} className="stat-card overflow-hidden" data-testid={`class-card-${cls.id}`}>
              {/* Video player or thumbnail */}
              {playingId === cls.id ? (
                <video src={`${API}/classes/online/${cls.id}/video`} controls autoPlay className="w-full rounded-xl mb-3" style={{ maxHeight: '200px' }} />
              ) : (
                <div className="w-full h-32 rounded-xl mb-3 flex items-center justify-center cursor-pointer bg-zinc-800 hover:bg-zinc-700 transition-colors" onClick={() => setPlayingId(cls.id)}>
                  <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,102,0,0.15)' }}>
                    <Play size={28} style={{ color: '#FF6600' }} />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <h3 className="font-bold" style={{ fontFamily: 'Outfit' }}>{cls.title}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: 'rgba(255,102,0,0.1)', color: '#FF6600', border: '1px solid rgba(255,102,0,0.15)' }}>
                    {CATEGORIES.find(c => c.value === cls.category)?.label || cls.category}
                  </span>
                  {cls.duration_minutes > 0 && (
                    <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-dim)' }}>
                      <Clock size={12} /> {cls.duration_minutes} min
                    </span>
                  )}
                  <span className="text-xs" style={{ color: 'var(--text-dim)' }}>{formatSize(cls.video_size || 0)}</span>
                  <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: cls.assigned_to === 'all' ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)', color: cls.assigned_to === 'all' ? '#10B981' : '#3B82F6', border: `1px solid ${cls.assigned_to === 'all' ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)'}` }}>
                    {cls.assigned_to === 'all' ? 'Todos' : `${(cls.member_ids || []).length} socios`}
                  </span>
                </div>
                {cls.description && <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{cls.description}</p>}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>{new Date(cls.created_at).toLocaleDateString('es-ES')}</span>
                  <button onClick={() => handleDelete(cls.id)} className="text-red-500 hover:text-red-400 p-1" data-testid={`delete-class-${cls.id}`}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload size={20} style={{ color: '#FF6600' }} />
              Subir Clase Online
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Titulo *</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Yoga para principiantes" className="input-dark" data-testid="class-title-input" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Categoria</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white" data-testid="class-category-select">
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Duracion (minutos)</label>
              <Input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="45" className="input-dark" data-testid="class-duration-input" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Descripcion</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descripcion de la clase..." className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white resize-none h-20" data-testid="class-desc-input" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Asignar a</label>
              <select value={assignedTo} onChange={e => { setAssignedTo(e.target.value); if (e.target.value === 'all') setSelectedMembers([]); }}
                className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white" data-testid="class-assigned-select">
                <option value="all">Todos los socios</option>
                <option value="specific">Socios especificos</option>
              </select>
              
              {assignedTo === 'specific' && (
                <div className="mt-2 space-y-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input value={memberSearch} onChange={e => setMemberSearch(e.target.value)} placeholder="Buscar socio..."
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-zinc-800 border border-zinc-700 text-white" />
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1 rounded-xl bg-zinc-800/50 p-2 border border-zinc-700/50">
                    {members
                      .filter(m => !memberSearch || m.name.toLowerCase().includes(memberSearch.toLowerCase()) || m.code.includes(memberSearch.toUpperCase()))
                      .slice(0, 20)
                      .map(m => (
                        <label key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-700/50 cursor-pointer">
                          <input type="checkbox" checked={selectedMembers.includes(m.id)}
                            onChange={e => setSelectedMembers(prev => e.target.checked ? [...prev, m.id] : prev.filter(id => id !== m.id))}
                            className="rounded accent-orange-500" />
                          <span className="text-sm">{m.name}</span>
                          <span className="text-[10px] font-mono ml-auto" style={{ color: 'var(--text-dim)' }}>{m.code}</span>
                        </label>
                      ))
                    }
                  </div>
                  {selectedMembers.length > 0 && (
                    <p className="text-xs" style={{ color: '#FF6600' }}>{selectedMembers.length} socios seleccionados</p>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Video *</label>
              <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-zinc-700 hover:border-orange-500/50 rounded-xl p-6 text-center cursor-pointer transition-colors" data-testid="class-video-upload">
                {videoFile ? (
                  <div>
                    <Video size={24} className="mx-auto mb-2" style={{ color: '#FF6600' }} />
                    <p className="text-sm font-medium">{videoFile.name}</p>
                    <p className="text-xs text-zinc-500">{formatSize(videoFile.size)}</p>
                  </div>
                ) : (
                  <div>
                    <Upload size={24} className="mx-auto mb-2 text-zinc-500" />
                    <p className="text-sm text-zinc-400">Haz clic para seleccionar video</p>
                    <p className="text-xs text-zinc-600">MP4, MOV, AVI (max 500MB)</p>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={e => setVideoFile(e.target.files[0])} />
            </div>
            <Button onClick={handleUpload} disabled={uploading || !title || !videoFile} className="w-full btn-gym-primary" data-testid="upload-class-btn">
              {uploading ? <><Loader2 size={16} className="animate-spin mr-2" /> Subiendo...</> : <><Upload size={16} className="mr-2" /> Subir Clase</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
