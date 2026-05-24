import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Video, Play, Clock, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CATEGORY_LABELS = {
  yoga: 'Yoga', spinning: 'Spinning', pilates: 'Pilates', crossfit: 'CrossFit',
  zumba: 'Zumba', boxeo: 'Boxeo', funcional: 'Funcional', cardio: 'Cardio',
  fuerza: 'Fuerza', estiramiento: 'Estiramiento', natacion: 'Natacion', general: 'General'
};

export default function MemberOnlineClasses() {
  const navigate = useNavigate();
  const { gym } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [playingId, setPlayingId] = useState(null);

  useEffect(() => {
    const gymId = gym?.id || '';
    axios.get(`${API}/classes/online${gymId ? `?gym_id=${gymId}` : ''}`)
      .then(res => setClasses(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [gym]);

  const categories = ['all', ...new Set(classes.map(c => c.category))];
  const filtered = classes.filter(c => {
    if (selectedCategory !== 'all' && c.category !== selectedCategory) return false;
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4" data-testid="member-online-classes">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/app')} className="p-2 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
          <ArrowLeft size={18} style={{ color: 'var(--text-secondary)' }} />
        </button>
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'Outfit' }}>Clases Online</h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Entrena desde donde quieras</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-dim)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar clase..." className="w-full pl-10 pr-4 py-3 rounded-xl text-sm" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }} data-testid="search-classes" />
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
        {categories.map(cat => (
          <button key={cat} onClick={() => setSelectedCategory(cat)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0"
            style={selectedCategory === cat
              ? { background: 'rgba(255,102,0,0.15)', color: '#FF6600', border: '1px solid rgba(255,102,0,0.3)' }
              : { background: 'var(--bg-tertiary)', color: 'var(--text-muted)', border: '1px solid var(--border-primary)' }}
            data-testid={`cat-${cat}`}
          >
            {cat === 'all' ? 'Todas' : CATEGORY_LABELS[cat] || cat}
          </button>
        ))}
      </div>

      {/* Classes */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
          <Video size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-bold">No hay clases disponibles</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((cls, i) => (
            <motion.div key={cls.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
              data-testid={`class-${cls.id}`}
            >
              {playingId === cls.id ? (
                <video src={`${API}/classes/online/${cls.id}/video`} controls autoPlay className="w-full" style={{ maxHeight: '250px' }} data-testid="class-video-player" />
              ) : (
                <div className="w-full h-40 flex items-center justify-center cursor-pointer relative" style={{ background: 'linear-gradient(135deg, #0a0a0a, #141414)' }} onClick={() => setPlayingId(cls.id)}>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center transition-transform hover:scale-110" style={{ background: 'rgba(255,102,0,0.15)', border: '2px solid rgba(255,102,0,0.3)' }}>
                    <Play size={30} style={{ color: '#FF6600', marginLeft: '3px' }} />
                  </div>
                  <span className="absolute bottom-2 right-3 text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(0,0,0,0.7)', color: 'var(--text-muted)' }}>
                    {cls.duration_minutes > 0 ? `${cls.duration_minutes} min` : 'Video'}
                  </span>
                </div>
              )}
              <div className="p-4 space-y-2">
                <h3 className="font-bold" style={{ fontFamily: 'Outfit' }}>{cls.title}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] px-2 py-0.5 rounded-lg" style={{ background: 'rgba(255,102,0,0.08)', color: '#FF6600' }}>
                    {CATEGORY_LABELS[cls.category] || cls.category}
                  </span>
                  {cls.duration_minutes > 0 && (
                    <span className="text-[11px] flex items-center gap-1" style={{ color: 'var(--text-dim)' }}>
                      <Clock size={11} /> {cls.duration_minutes} min
                    </span>
                  )}
                </div>
                {cls.description && <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{cls.description}</p>}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
