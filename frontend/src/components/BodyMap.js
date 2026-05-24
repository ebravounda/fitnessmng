import { useState } from 'react';

// Clickable zones as percentage coordinates over the body images
// [x%, y%, width%, height%] relative to image
const FRONT_ZONES = [
  { id: 'hombros', label: 'Hombros', x: 12, y: 14, w: 16, h: 8 ,  x2: 72, y2: 14, w2: 16, h2: 8 },
  { id: 'pecho', label: 'Pecho', x: 28, y: 16, w: 44, h: 12 },
  { id: 'biceps', label: 'Biceps', x: 8, y: 22, w: 14, h: 14,  x2: 78, y2: 22, w2: 14, h2: 14 },
  { id: 'abdomen', label: 'Abdomen', x: 32, y: 28, w: 36, h: 18 },
  { id: 'antebrazos', label: 'Antebrazos', x: 4, y: 36, w: 14, h: 14,  x2: 82, y2: 36, w2: 14, h2: 14 },
  { id: 'cuadriceps', label: 'Cuadriceps', x: 24, y: 48, w: 22, h: 20,  x2: 54, y2: 48, w2: 22, h2: 20 },
  { id: 'gemelos_f', label: 'Tibiales / Gemelos', x: 26, y: 70, w: 18, h: 16,  x2: 56, y2: 70, w2: 18, h2: 16 },
];

const BACK_ZONES = [
  { id: 'trapecios', label: 'Trapecios', x: 30, y: 10, w: 40, h: 10 },
  { id: 'dorsales', label: 'Dorsales', x: 18, y: 18, w: 22, h: 16,  x2: 60, y2: 18, w2: 22, h2: 16 },
  { id: 'espalda_media', label: 'Espalda Media', x: 32, y: 20, w: 36, h: 12 },
  { id: 'triceps', label: 'Triceps', x: 8, y: 22, w: 14, h: 14,  x2: 78, y2: 22, w2: 14, h2: 14 },
  { id: 'lumbares', label: 'Lumbares', x: 34, y: 32, w: 32, h: 10 },
  { id: 'gluteos', label: 'Gluteos', x: 28, y: 42, w: 44, h: 10 },
  { id: 'isquiotibiales', label: 'Isquiotibiales', x: 24, y: 52, w: 22, h: 18,  x2: 54, y2: 52, w2: 22, h2: 18 },
  { id: 'gemelos', label: 'Gemelos', x: 26, y: 70, w: 18, h: 16,  x2: 56, y2: 70, w2: 18, h2: 16 },
];

function Zone({ zone, x, y, w, h, isSelected, isHovered, onClick, onHover, onLeave }) {
  return (
    <div
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onTouchStart={onHover}
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        width: `${w}%`,
        height: `${h}%`,
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        background: isSelected
          ? 'rgba(255, 102, 0, 0.45)'
          : isHovered
            ? 'rgba(255, 102, 0, 0.25)'
            : 'transparent',
        border: isSelected
          ? '2px solid rgba(255, 102, 0, 0.8)'
          : isHovered
            ? '1px solid rgba(255, 102, 0, 0.4)'
            : '1px solid transparent',
        boxShadow: isSelected
          ? '0 0 20px rgba(255, 102, 0, 0.3), inset 0 0 15px rgba(255, 102, 0, 0.15)'
          : 'none',
        zIndex: isSelected || isHovered ? 10 : 1,
      }}
      data-testid={`muscle-zone-${zone.id}`}
    >
      {(isSelected || isHovered) && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.85)',
          padding: '4px 10px',
          borderRadius: '8px',
          whiteSpace: 'nowrap',
          border: '1px solid rgba(255,102,0,0.4)',
        }}>
          <span style={{ color: '#FF6600', fontSize: '11px', fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>
            {zone.label}
          </span>
        </div>
      )}
    </div>
  );
}

export default function BodyMap({ view = 'front', selectedMuscle, onSelectMuscle }) {
  const [hoveredMuscle, setHoveredMuscle] = useState(null);
  const zones = view === 'front' ? FRONT_ZONES : BACK_ZONES;
  const imageSrc = view === 'front' ? '/images/body_front.png' : '/images/body_back.png';

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative w-full max-w-[300px] mx-auto">
        {/* Real anatomy image */}
        <img
          src={imageSrc}
          alt={`Cuerpo ${view === 'front' ? 'frontal' : 'posterior'}`}
          className="w-full h-auto rounded-xl"
          style={{ filter: 'brightness(0.9) contrast(1.1)' }}
          draggable={false}
        />

        {/* Clickable zones overlay */}
        {zones.map((zone) => {
          const isSelected = selectedMuscle === zone.id;
          const isHovered = hoveredMuscle === zone.id;
          return (
            <div key={zone.id}>
              <Zone
                zone={zone}
                x={zone.x} y={zone.y} w={zone.w} h={zone.h}
                isSelected={isSelected}
                isHovered={isHovered}
                onClick={() => onSelectMuscle(zone.id === selectedMuscle ? null : zone.id)}
                onHover={() => setHoveredMuscle(zone.id)}
                onLeave={() => setHoveredMuscle(null)}
              />
              {/* Mirror zone for symmetric muscles (arms, legs) */}
              {zone.x2 !== undefined && (
                <Zone
                  zone={zone}
                  x={zone.x2} y={zone.y2} w={zone.w2} h={zone.h2}
                  isSelected={isSelected}
                  isHovered={isHovered}
                  onClick={() => onSelectMuscle(zone.id === selectedMuscle ? null : zone.id)}
                  onHover={() => setHoveredMuscle(zone.id)}
                  onLeave={() => setHoveredMuscle(null)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
