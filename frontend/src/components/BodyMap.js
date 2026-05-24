import { useState } from 'react';

const MUSCLE_GROUPS = {
  front: [
    { id: 'pecho', label: 'Pecho', d: 'M 85,75 C 85,70 90,62 100,60 L 100,60 C 110,62 115,70 115,75 L 115,90 C 110,92 105,93 100,93 C 95,93 90,92 85,90 Z' },
    { id: 'hombros', label: 'Hombros', d: 'M 72,60 C 72,52 78,48 85,52 L 85,70 C 80,68 75,66 72,60 Z M 128,60 C 128,52 122,48 115,52 L 115,70 C 120,68 125,66 128,60 Z' },
    { id: 'biceps', label: 'Biceps', d: 'M 70,72 C 68,68 66,64 68,60 L 72,60 C 75,66 76,72 76,78 L 76,100 C 73,98 71,94 70,88 Z M 130,72 C 132,68 134,64 132,60 L 128,60 C 125,66 124,72 124,78 L 124,100 C 127,98 129,94 130,88 Z' },
    { id: 'antebrazos', label: 'Antebrazos', d: 'M 68,100 C 66,96 64,90 66,84 L 70,88 C 71,94 72,98 72,102 L 70,118 C 68,114 67,108 68,100 Z M 132,100 C 134,96 136,90 134,84 L 130,88 C 129,94 128,98 128,102 L 130,118 C 132,114 133,108 132,100 Z' },
    { id: 'abdomen', label: 'Abdomen', d: 'M 88,94 L 112,94 L 112,130 C 108,133 104,134 100,134 C 96,134 92,133 88,130 Z' },
    { id: 'cuadriceps', label: 'Cuadriceps', d: 'M 82,136 C 82,134 85,132 88,130 L 88,170 C 86,172 84,170 82,168 Z M 118,136 C 118,134 115,132 112,130 L 112,170 C 114,172 116,170 118,168 Z' },
    { id: 'gemelos_f', label: 'Tibiales', d: 'M 84,172 L 88,172 L 86,200 L 82,200 Z M 116,172 L 112,172 L 114,200 L 118,200 Z' },
  ],
  back: [
    { id: 'trapecios', label: 'Trapecios', d: 'M 88,48 L 100,42 L 112,48 L 112,58 L 100,55 L 88,58 Z' },
    { id: 'dorsales', label: 'Dorsales', d: 'M 82,62 C 82,58 85,56 88,58 L 88,95 C 86,98 84,96 82,92 Z M 118,62 C 118,58 115,56 112,58 L 112,95 C 114,98 116,96 118,92 Z' },
    { id: 'espalda_media', label: 'Espalda Media', d: 'M 88,60 L 112,60 L 112,90 C 108,92 104,93 100,93 C 96,93 92,92 88,90 Z' },
    { id: 'triceps', label: 'Triceps', d: 'M 70,62 C 68,58 67,54 70,50 L 76,55 L 76,82 C 73,80 71,76 70,70 Z M 130,62 C 132,58 133,54 130,50 L 124,55 L 124,82 C 127,80 129,76 130,70 Z' },
    { id: 'lumbares', label: 'Lumbares', d: 'M 90,94 L 110,94 L 110,125 C 106,128 100,130 100,130 C 100,130 94,128 90,125 Z' },
    { id: 'gluteos', label: 'Gluteos', d: 'M 84,130 C 84,126 88,124 92,126 L 100,134 C 96,138 90,140 86,138 C 84,136 84,134 84,130 Z M 116,130 C 116,126 112,124 108,126 L 100,134 C 104,138 110,140 114,138 C 116,136 116,134 116,130 Z' },
    { id: 'isquiotibiales', label: 'Isquiotibiales', d: 'M 84,142 L 88,140 L 90,170 L 84,170 Z M 116,142 L 112,140 L 110,170 L 116,170 Z' },
    { id: 'gemelos', label: 'Gemelos', d: 'M 84,172 C 84,168 86,166 88,168 L 88,200 L 82,200 C 82,194 83,180 84,172 Z M 116,172 C 116,168 114,166 112,168 L 112,200 L 118,200 C 118,194 117,180 116,172 Z' },
  ]
};

export default function BodyMap({ view = 'front', selectedMuscle, onSelectMuscle }) {
  const [hoveredMuscle, setHoveredMuscle] = useState(null);
  const muscles = MUSCLE_GROUPS[view] || [];

  return (
    <div className="relative flex flex-col items-center">
      <svg viewBox="55 30 90 185" className="w-full max-w-[280px]" style={{ filter: 'drop-shadow(0 0 20px rgba(255,102,0,0.05))' }}>
        {/* Body silhouette */}
        <defs>
          <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#2a2a2a' }} />
            <stop offset="100%" style={{ stopColor: '#1a1a1a' }} />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Head */}
        <ellipse cx="100" cy="38" rx="10" ry="12" fill="url(#bodyGrad)" stroke="#333" strokeWidth="0.5" />
        
        {/* Neck */}
        <rect x="96" y="48" width="8" height="6" fill="url(#bodyGrad)" stroke="#333" strokeWidth="0.3" />
        
        {/* Torso */}
        <path d="M 78,55 C 78,52 85,48 100,48 C 115,48 122,52 122,55 L 125,65 L 128,55 C 134,50 136,60 134,75 L 132,90 L 130,105 L 128,115 L 126,120 L 68,120 L 72,115 L 70,105 L 68,90 L 66,75 C 64,60 66,50 72,55 L 75,65 L 78,55 Z"
          fill="url(#bodyGrad)" stroke="#333" strokeWidth="0.5" />
        
        {/* Hips/Pelvis */}
        <path d="M 80,120 L 120,120 L 122,138 L 100,142 L 78,138 Z"
          fill="url(#bodyGrad)" stroke="#333" strokeWidth="0.5" />
        
        {/* Left Leg */}
        <path d="M 80,138 L 92,140 L 90,175 L 88,200 L 82,200 L 80,175 Z"
          fill="url(#bodyGrad)" stroke="#333" strokeWidth="0.5" />
        
        {/* Right Leg */}
        <path d="M 120,138 L 108,140 L 110,175 L 112,200 L 118,200 L 120,175 Z"
          fill="url(#bodyGrad)" stroke="#333" strokeWidth="0.5" />
        
        {/* Left Arm */}
        <path d="M 72,55 C 66,50 62,55 64,70 L 66,85 L 68,100 L 66,115 L 64,122 L 70,122 L 72,115 L 74,100 L 76,85 L 78,55 Z"
          fill="url(#bodyGrad)" stroke="#333" strokeWidth="0.5" />
        
        {/* Right Arm */}
        <path d="M 128,55 C 134,50 138,55 136,70 L 134,85 L 132,100 L 134,115 L 136,122 L 130,122 L 128,115 L 126,100 L 124,85 L 122,55 Z"
          fill="url(#bodyGrad)" stroke="#333" strokeWidth="0.5" />

        {/* Muscle zones - interactive */}
        {muscles.map((muscle) => {
          const isSelected = selectedMuscle === muscle.id;
          const isHovered = hoveredMuscle === muscle.id;
          return (
            <path
              key={muscle.id}
              d={muscle.d}
              fill={isSelected ? 'rgba(255,102,0,0.6)' : isHovered ? 'rgba(255,102,0,0.3)' : 'rgba(255,102,0,0.08)'}
              stroke={isSelected ? '#FF6600' : isHovered ? 'rgba(255,102,0,0.5)' : 'rgba(255,102,0,0.15)'}
              strokeWidth={isSelected ? '1' : '0.5'}
              style={{ cursor: 'pointer', transition: 'all 0.3s ease', filter: isSelected ? 'url(#glow)' : 'none' }}
              onClick={() => onSelectMuscle(muscle.id)}
              onMouseEnter={() => setHoveredMuscle(muscle.id)}
              onMouseLeave={() => setHoveredMuscle(null)}
              data-testid={`muscle-${muscle.id}`}
            />
          );
        })}

        {/* Labels for selected/hovered */}
        {muscles.map((muscle) => {
          const isActive = selectedMuscle === muscle.id || hoveredMuscle === muscle.id;
          if (!isActive) return null;
          // Calculate label position from path center
          const pathParts = muscle.d.match(/[\d.]+/g)?.map(Number) || [];
          const xs = pathParts.filter((_, i) => i % 2 === 0);
          const ys = pathParts.filter((_, i) => i % 2 === 1);
          const cx = xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 100;
          const cy = ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : 100;
          return (
            <text
              key={`label-${muscle.id}`}
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize="4.5"
              fontWeight="bold"
              fontFamily="Outfit, sans-serif"
              style={{ pointerEvents: 'none', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
            >
              {muscle.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
