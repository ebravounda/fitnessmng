import { useState } from 'react';
import { ArrowLeft, RotateCcw, Dumbbell, Timer, Repeat, ChevronRight, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import BodyMap from '../../components/BodyMap';

const EXERCISES = {
  // FRONT
  pecho: {
    label: 'Pecho',
    icon: '💪',
    exercises: [
      { name: 'Press de Banca', machine: 'Banco plano + barra', series: 4, reps: '10-12', desc: 'Acuestate en el banco, agarra la barra a la anchura de los hombros. Baja hasta el pecho y empuja hacia arriba.', img: 'Barbell_Bench_Press_-_Medium_Grip' },
      { name: 'Press Inclinado con Mancuernas', machine: 'Banco inclinado + mancuernas', series: 3, reps: '12', desc: 'Banco a 30-45 grados. Sube las mancuernas desde el pecho hasta arriba.', img: 'Dumbbell_Bench_Press' },
      { name: 'Aperturas en Maquina', machine: 'Maquina Pec Deck / Contractora', series: 3, reps: '15', desc: 'Sentado en la maquina, junta los brazos por delante del pecho de forma controlada.', img: 'Butterfly' },
      { name: 'Fondos en Paralelas', machine: 'Barras paralelas', series: 3, reps: '8-10', desc: 'Agarrate de las barras, baja el cuerpo flexionando codos e impulsate hacia arriba.', img: 'Dips_-_Chest_Version' },
      { name: 'Cruces en Polea', machine: 'Polea alta doble', series: 3, reps: '12-15', desc: 'De pie entre las poleas, junta las manos por delante del cuerpo con los brazos casi estirados.', img: 'Cable_Crossover' },
    ]
  },
  hombros: {
    label: 'Hombros',
    icon: '🏋️',
    exercises: [
      { name: 'Press Militar', machine: 'Barra + rack o maquina de hombros', series: 4, reps: '10', desc: 'Sentado o de pie, empuja la barra desde los hombros hasta arriba de la cabeza.', img: 'Barbell_Shoulder_Press' },
      { name: 'Elevaciones Laterales', machine: 'Mancuernas ligeras', series: 3, reps: '15', desc: 'De pie, sube las mancuernas a los lados hasta la altura de los hombros.', img: 'Side_Lateral_Raise' },
      { name: 'Elevaciones Frontales', machine: 'Mancuernas o disco', series: 3, reps: '12', desc: 'De pie, sube el peso por delante hasta la altura de los ojos.', img: 'Front_Dumbbell_Raise' },
      { name: 'Pajaro Invertido', machine: 'Mancuernas o maquina', series: 3, reps: '15', desc: 'Inclinado hacia delante, abre los brazos hacia los lados trabajando el hombro posterior.', img: 'Reverse_Flyes' },
      { name: 'Encogimientos de Hombros', machine: 'Mancuernas pesadas o barra', series: 4, reps: '12', desc: 'De pie con peso en las manos, sube los hombros hacia las orejas.', img: 'Barbell_Shrug' },
    ]
  },
  biceps: {
    label: 'Biceps',
    icon: '💪',
    exercises: [
      { name: 'Curl con Barra', machine: 'Barra recta o Z', series: 4, reps: '10-12', desc: 'De pie, flexiona los codos para subir la barra hacia los hombros. No balancees el cuerpo.', img: 'Barbell_Curl' },
      { name: 'Curl Alterno con Mancuernas', machine: 'Mancuernas', series: 3, reps: '12 c/brazo', desc: 'Sentado o de pie, alterna subiendo cada mancuerna con rotacion de muneca.', img: 'Alternate_Dumbbell_Curl' },
      { name: 'Curl en Banco Scott', machine: 'Banco Scott + barra Z', series: 3, reps: '12', desc: 'Apoya los brazos en el banco inclinado y flexiona subiendo la barra.', img: 'Preacher_Curl' },
      { name: 'Curl Martillo', machine: 'Mancuernas', series: 3, reps: '12', desc: 'Como el curl normal pero con las palmas mirando hacia dentro (agarre neutro).', img: 'Hammer_Curls' },
      { name: 'Curl en Polea Baja', machine: 'Polea baja + barra', series: 3, reps: '15', desc: 'De pie frente a la polea, flexiona los codos para subir la barra.', img: 'Cable_Hammer_Curls_-_Rope_Attachment' },
    ]
  },
  antebrazos: {
    label: 'Antebrazos',
    icon: '✊',
    exercises: [
      { name: 'Curl de Muneca', machine: 'Barra o mancuernas', series: 3, reps: '20', desc: 'Sentado con los antebrazos apoyados, flexiona las munecas hacia arriba.', img: 'Palms-Up_Barbell_Wrist_Curl_Over_A_Bench' },
      { name: 'Curl de Muneca Invertido', machine: 'Barra o mancuernas', series: 3, reps: '15', desc: 'Igual que el anterior pero con las palmas hacia abajo.', img: 'Palms-Down_Wrist_Curl_Over_A_Bench' },
      { name: 'Agarre Farmer Walk', machine: 'Mancuernas pesadas', series: 3, reps: '30 seg', desc: 'Camina sosteniendo mancuernas pesadas a los lados durante 30 segundos.', img: 'Farmer_Walk' },
    ]
  },
  abdomen: {
    label: 'Abdomen / Core',
    icon: '🔥',
    exercises: [
      { name: 'Crunch Abdominal', machine: 'Colchoneta o maquina', series: 4, reps: '20', desc: 'Tumbado boca arriba, eleva los hombros del suelo contrayendo el abdomen.', img: 'Crunches' },
      { name: 'Plancha Frontal', machine: 'Colchoneta', series: 3, reps: '45 seg', desc: 'Apoyado en antebrazos y puntas de pies, mantén el cuerpo recto como una tabla.', img: 'Plank' },
      { name: 'Elevacion de Piernas', machine: 'Barra de dominadas o banco', series: 3, reps: '15', desc: 'Colgado de la barra, sube las piernas rectas hasta 90 grados.', img: 'Hanging_Leg_Raise' },
      { name: 'Russian Twist', machine: 'Disco o mancuerna', series: 3, reps: '20 (10+10)', desc: 'Sentado con las piernas elevadas, gira el torso tocando el peso a cada lado.', img: 'Russian_Twist' },
      { name: 'Crunch en Polea', machine: 'Polea alta + cuerda', series: 3, reps: '15', desc: 'De rodillas frente a la polea, flexiona el tronco hacia abajo contrayendo el abdomen.', img: 'Kneeling_Cable_Crunch_With_Alternating_Oblique_Twists' },
    ]
  },
  cuadriceps: {
    label: 'Cuadriceps',
    icon: '🦵',
    exercises: [
      { name: 'Sentadilla con Barra', machine: 'Rack de sentadillas + barra', series: 4, reps: '10', desc: 'Barra en la espalda, baja hasta que los muslos esten paralelos al suelo y sube.', img: 'Barbell_Squat' },
      { name: 'Prensa de Piernas', machine: 'Maquina de prensa', series: 4, reps: '12', desc: 'Sentado en la prensa, empuja la plataforma con los pies a la anchura de los hombros.', img: 'Leg_Press' },
      { name: 'Extension de Piernas', machine: 'Maquina de extensiones', series: 3, reps: '15', desc: 'Sentado, extiende las piernas hacia arriba de forma controlada.', img: 'Leg_Extensions' },
      { name: 'Zancadas con Mancuernas', machine: 'Mancuernas', series: 3, reps: '12 c/pierna', desc: 'Da un paso largo al frente, baja la rodilla trasera casi al suelo y vuelve.', img: 'Dumbbell_Lunges' },
      { name: 'Sentadilla Hack', machine: 'Maquina Hack', series: 3, reps: '12', desc: 'Apoyado en la maquina, baja y sube con las piernas.', img: 'Hack_Squat' },
    ]
  },
  gemelos_f: {
    label: 'Tibiales / Gemelos',
    icon: '🦶',
    exercises: [
      { name: 'Elevacion de Talones de Pie', machine: 'Maquina de gemelos o Smith', series: 4, reps: '20', desc: 'De pie, sube y baja los talones de forma controlada.', img: 'Standing_Calf_Raises' },
      { name: 'Elevacion de Talones Sentado', machine: 'Maquina de gemelos sentado', series: 3, reps: '20', desc: 'Sentado con las rodillas debajo del soporte, sube los talones.', img: 'Seated_Calf_Raise' },
      { name: 'Gemelos en Prensa', machine: 'Maquina de prensa', series: 3, reps: '15', desc: 'En la prensa, apoya solo la punta de los pies y empuja extendiendo los tobillos.', img: 'Calf_Press_On_The_Leg_Press_Machine' },
    ]
  },
  // BACK
  trapecios: {
    label: 'Trapecios',
    icon: '🏋️',
    exercises: [
      { name: 'Encogimientos con Barra', machine: 'Barra o mancuernas pesadas', series: 4, reps: '12', desc: 'De pie, sube los hombros hacia las orejas con peso en las manos.', img: 'Barbell_Shrug' },
      { name: 'Remo al Menton', machine: 'Barra o polea baja', series: 3, reps: '12', desc: 'De pie, sube la barra pegada al cuerpo hasta la altura del menton con los codos altos.', img: 'Upright_Barbell_Row' },
      { name: 'Face Pull', machine: 'Polea alta + cuerda', series: 3, reps: '15', desc: 'Tira de la cuerda hacia la cara abriendo los codos hacia los lados.', img: 'Face_Pull' },
    ]
  },
  dorsales: {
    label: 'Dorsales',
    icon: '🔙',
    exercises: [
      { name: 'Jalon al Pecho', machine: 'Polea alta / Maquina de jalon', series: 4, reps: '12', desc: 'Sentado, tira de la barra hacia el pecho con los codos apuntando al suelo.', img: 'Wide-Grip_Lat_Pulldown' },
      { name: 'Dominadas', machine: 'Barra de dominadas', series: 3, reps: '8-10', desc: 'Cuelgate de la barra y sube hasta que la barbilla pase la barra.', img: 'Pullups' },
      { name: 'Remo con Barra', machine: 'Barra', series: 4, reps: '10', desc: 'Inclinado hacia delante, tira de la barra hacia el abdomen.', img: 'Bent_Over_Barbell_Row' },
      { name: 'Remo con Mancuerna', machine: 'Banco plano + mancuerna', series: 3, reps: '12 c/brazo', desc: 'Apoyado con una rodilla en el banco, tira de la mancuerna hacia la cadera.', img: 'One-Arm_Dumbbell_Row' },
      { name: 'Pullover en Polea', machine: 'Polea alta + barra recta', series: 3, reps: '15', desc: 'De pie, empuja la barra hacia abajo con los brazos casi estirados.', img: 'Straight-Arm_Dumbbell_Pullover' },
    ]
  },
  espalda_media: {
    label: 'Espalda Media',
    icon: '🔙',
    exercises: [
      { name: 'Remo en Maquina', machine: 'Maquina de remo', series: 4, reps: '12', desc: 'Sentado en la maquina, tira de las agarraderas hacia el pecho apretando las escapulas.', img: 'Seated_Cable_Rows' },
      { name: 'Remo en Polea Baja', machine: 'Polea baja + triangulo', series: 3, reps: '12', desc: 'Sentado, tira del agarre hacia el abdomen manteniendo la espalda recta.', img: 'Seated_Cable_Rows' },
      { name: 'Remo T-Bar', machine: 'Barra T o landmine', series: 3, reps: '10', desc: 'Inclinado, tira de la barra T hacia el pecho.', img: 'Lying_T-Bar_Row' },
    ]
  },
  triceps: {
    label: 'Triceps',
    icon: '💪',
    exercises: [
      { name: 'Extension en Polea Alta', machine: 'Polea alta + barra o cuerda', series: 4, reps: '12', desc: 'De pie, empuja la barra/cuerda hacia abajo extendiendo los codos.', img: 'Triceps_Pushdown' },
      { name: 'Fondos en Banco', machine: 'Banco', series: 3, reps: '12', desc: 'Manos en el banco detras de ti, baja el cuerpo flexionando codos y sube.', img: 'Bench_Dips' },
      { name: 'Press Frances', machine: 'Barra Z o mancuernas', series: 3, reps: '12', desc: 'Tumbado, baja la barra hacia la frente y extiende los brazos.', img: 'EZ-Bar_Skullcrusher' },
      { name: 'Patada de Triceps', machine: 'Mancuerna', series: 3, reps: '12 c/brazo', desc: 'Inclinado con un brazo, extiende el codo hacia atras.', img: 'Tricep_Dumbbell_Kickback' },
      { name: 'Extension Sobre Cabeza', machine: 'Mancuerna o polea baja', series: 3, reps: '12', desc: 'Sentado o de pie, sube el peso por detras de la cabeza y extiende arriba.', img: 'Standing_Dumbbell_Triceps_Extension' },
    ]
  },
  lumbares: {
    label: 'Lumbares',
    icon: '🔙',
    exercises: [
      { name: 'Hiperextensiones', machine: 'Banco de hiperextensiones', series: 3, reps: '15', desc: 'Boca abajo en el banco, baja el torso y sube apretando los lumbares.', img: 'Hyperextensions__Back_Extensions_' },
      { name: 'Peso Muerto Rumano', machine: 'Barra', series: 4, reps: '10', desc: 'De pie, baja la barra deslizandola por las piernas manteniendo la espalda recta.', img: 'Romanian_Deadlift' },
      { name: 'Buenos Dias', machine: 'Barra ligera', series: 3, reps: '12', desc: 'Barra en la espalda, inclinate hacia delante y vuelve a subir.', img: 'Good_Morning' },
    ]
  },
  gluteos: {
    label: 'Gluteos',
    icon: '🍑',
    exercises: [
      { name: 'Hip Thrust', machine: 'Banco + barra', series: 4, reps: '12', desc: 'Espalda apoyada en el banco, barra sobre la cadera. Sube la cadera apretando gluteos.', img: 'Barbell_Hip_Thrust' },
      { name: 'Sentadilla Sumo', machine: 'Barra o mancuerna', series: 3, reps: '12', desc: 'Piernas mas abiertas de lo normal con pies hacia fuera. Baja y sube.', img: 'Sumo_Deadlift' },
      { name: 'Patada en Maquina', machine: 'Maquina de gluteos / Polea baja', series: 3, reps: '15 c/pierna', desc: 'De pie, patea hacia atras con la pierna contra la resistencia.', img: 'Glute_Kickback' },
      { name: 'Puente de Gluteos', machine: 'Colchoneta + disco', series: 3, reps: '20', desc: 'Tumbado boca arriba, sube la cadera apretando gluteos arriba.', img: 'Barbell_Glute_Bridge' },
    ]
  },
  isquiotibiales: {
    label: 'Isquiotibiales',
    icon: '🦵',
    exercises: [
      { name: 'Curl Femoral Tumbado', machine: 'Maquina de curl femoral', series: 4, reps: '12', desc: 'Boca abajo en la maquina, flexiona las rodillas llevando los talones a los gluteos.', img: 'Lying_Leg_Curls' },
      { name: 'Curl Femoral Sentado', machine: 'Maquina de curl sentado', series: 3, reps: '12', desc: 'Sentado, flexiona las piernas hacia atras contra la resistencia.', img: 'Seated_Leg_Curl' },
      { name: 'Peso Muerto Rumano', machine: 'Barra o mancuernas', series: 4, reps: '10', desc: 'Baja el peso con piernas casi rectas sintiendo el estiramiento atras del muslo.', img: 'Romanian_Deadlift' },
      { name: 'Peso Muerto a Una Pierna', machine: 'Mancuerna', series: 3, reps: '10 c/pierna', desc: 'De pie sobre una pierna, inclinate hacia delante con peso en la mano contraria.', img: 'Stiff-Legged_Dumbbell_Deadlift' },
    ]
  },
  gemelos: {
    label: 'Gemelos',
    icon: '🦶',
    exercises: [
      { name: 'Elevacion de Talones de Pie', machine: 'Maquina de gemelos o Smith', series: 4, reps: '20', desc: 'De pie sobre una plataforma, sube y baja los talones lentamente.', img: 'Standing_Calf_Raises' },
      { name: 'Elevacion de Talones Sentado', machine: 'Maquina de gemelos sentado', series: 3, reps: '20', desc: 'Sentado, sube los talones con las rodillas debajo del soporte.', img: 'Seated_Calf_Raise' },
      { name: 'Saltos de Pantorrilla', machine: 'Peso corporal', series: 3, reps: '15', desc: 'De pie, haz pequenos saltos impulsandote solo con los gemelos.', img: 'Calf_Press_On_The_Leg_Press_Machine' },
    ]
  }
};

const IMG_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';

export default function MemberRoutines() {
  const navigate = useNavigate();
  const [view, setView] = useState('front');
  const [selectedMuscle, setSelectedMuscle] = useState(null);
  const [expandedExercise, setExpandedExercise] = useState(null);

  const muscleData = selectedMuscle ? EXERCISES[selectedMuscle] : null;

  const handleSelectMuscle = (id) => {
    setSelectedMuscle(id === selectedMuscle ? null : id);
    setExpandedExercise(null);
  };

  return (
    <div className="space-y-4" data-testid="routines-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/app')} className="p-2 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }} data-testid="back-btn">
            <ArrowLeft size={18} style={{ color: 'var(--text-secondary)' }} />
          </button>
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>Rutinas</h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Toca una zona para ver ejercicios</p>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => { setView('front'); setSelectedMuscle(null); }}
          className="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
          style={view === 'front' 
            ? { background: 'linear-gradient(135deg, #FF6600, #E65C00)', color: '#FFF' } 
            : { background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-primary)' }}
          data-testid="view-front-btn"
        >
          Frontal
        </button>
        <button
          onClick={() => { setView('back'); setSelectedMuscle(null); }}
          className="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
          style={view === 'back' 
            ? { background: 'linear-gradient(135deg, #FF6600, #E65C00)', color: '#FFF' } 
            : { background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-primary)' }}
          data-testid="view-back-btn"
        >
          Posterior
        </button>
      </div>

      {/* Body Map */}
      <div className="rounded-2xl p-4 relative overflow-hidden" style={{ background: 'linear-gradient(180deg, rgba(255,102,0,0.03) 0%, var(--bg-secondary) 30%)', border: '1px solid var(--border-primary)' }}>
        <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,102,0,0.2), transparent)' }} />
        <BodyMap view={view} selectedMuscle={selectedMuscle} onSelectMuscle={handleSelectMuscle} />
        
        {/* Quick muscle buttons */}
        <div className="flex flex-wrap gap-1.5 justify-center mt-4">
          {Object.entries(EXERCISES)
            .filter(([id]) => {
              const frontIds = ['pecho', 'hombros', 'biceps', 'antebrazos', 'abdomen', 'cuadriceps', 'gemelos_f'];
              const backIds = ['trapecios', 'dorsales', 'espalda_media', 'triceps', 'lumbares', 'gluteos', 'isquiotibiales', 'gemelos'];
              return view === 'front' ? frontIds.includes(id) : backIds.includes(id);
            })
            .map(([id, data]) => (
              <button
                key={id}
                onClick={() => handleSelectMuscle(id)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                style={selectedMuscle === id
                  ? { background: 'rgba(255,102,0,0.15)', color: '#FF6600', border: '1px solid rgba(255,102,0,0.3)' }
                  : { background: 'var(--bg-tertiary)', color: 'var(--text-muted)', border: '1px solid var(--border-primary)' }}
                data-testid={`muscle-btn-${id}`}
              >
                {data.label}
              </button>
            ))
          }
        </div>
      </div>

      {/* Exercise List */}
      <AnimatePresence mode="wait">
        {muscleData && (
          <motion.div
            key={selectedMuscle}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2.5"
          >
            <div className="flex items-center gap-2 px-1">
              <Zap size={16} style={{ color: '#FF6600' }} />
              <h2 className="font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#FF6600' }}>{muscleData.label}</h2>
              <span className="text-xs" style={{ color: 'var(--text-dim)' }}>— {muscleData.exercises.length} ejercicios</span>
            </div>

            {muscleData.exercises.map((exercise, i) => {
              const isExpanded = expandedExercise === i;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-2xl overflow-hidden transition-all"
                  style={{ background: 'var(--bg-secondary)', border: isExpanded ? '1px solid rgba(255,102,0,0.2)' : '1px solid var(--border-primary)' }}
                  data-testid={`exercise-card-${i}`}
                >
                  <button
                    onClick={() => setExpandedExercise(isExpanded ? null : i)}
                    className="w-full flex items-center gap-3 p-4 text-left"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,102,0,0.08)' }}>
                      <Dumbbell size={18} style={{ color: '#FF6600' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm" style={{ fontFamily: 'Outfit' }}>{exercise.name}</p>
                      <p className="text-[11px] truncate" style={{ color: 'var(--text-dim)' }}>{exercise.machine}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-xs font-bold" style={{ color: '#FF6600' }}>{exercise.series}x{exercise.reps}</p>
                      </div>
                      <ChevronRight size={16} className="transition-transform" style={{ color: 'var(--text-dim)', transform: isExpanded ? 'rotate(90deg)' : 'none' }} />
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-0 space-y-3">
                          <div className="h-[1px] w-full" style={{ background: 'var(--border-primary)' }} />
                          
                          {/* Exercise images */}
                          {exercise.img && (
                            <div className="flex gap-2 overflow-x-auto rounded-xl">
                              <img src={`${IMG_BASE}/${exercise.img}/0.jpg`} alt={exercise.name} className="h-36 rounded-xl object-cover" style={{ background: '#111' }} onError={e => e.target.style.display='none'} />
                              <img src={`${IMG_BASE}/${exercise.img}/1.jpg`} alt={exercise.name} className="h-36 rounded-xl object-cover" style={{ background: '#111' }} onError={e => e.target.style.display='none'} />
                            </div>
                          )}
                          
                          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{exercise.desc}</p>
                          
                          <div className="flex gap-3">
                            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg" style={{ background: 'rgba(255,102,0,0.06)', border: '1px solid rgba(255,102,0,0.1)' }}>
                              <Repeat size={13} style={{ color: '#FF6600' }} />
                              <span className="text-xs font-semibold" style={{ color: '#FF6600' }}>{exercise.series} series</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg" style={{ background: 'rgba(255,102,0,0.06)', border: '1px solid rgba(255,102,0,0.1)' }}>
                              <Timer size={13} style={{ color: '#FF6600' }} />
                              <span className="text-xs font-semibold" style={{ color: '#FF6600' }}>{exercise.reps} reps</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)' }}>
                            <Dumbbell size={14} style={{ color: 'var(--text-muted)' }} />
                            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{exercise.machine}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!selectedMuscle && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
          <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(255,102,0,0.08)', border: '1px solid rgba(255,102,0,0.12)' }}>
            <Dumbbell size={28} style={{ color: '#FF6600' }} />
          </div>
          <p className="font-bold mb-1" style={{ fontFamily: 'Outfit' }}>Selecciona una zona</p>
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>Toca el cuerpo o los botones para ver ejercicios</p>
        </motion.div>
      )}
    </div>
  );
}
