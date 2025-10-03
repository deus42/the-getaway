import React, { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  delay: number;
  duration: number;
}

interface DataStreamParticlesProps {
  color?: string;
  count?: number;
  side?: 'left' | 'right';
}

const DataStreamParticles: React.FC<DataStreamParticlesProps> = ({
  color = '#38bdf8',
  count = 3,
  side = 'left',
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: i,
        x: side === 'left' ? 0 : 100,
        delay: Math.random() * 3,
        duration: 2 + Math.random() * 2,
      });
    }
    setParticles(newParticles);
  }, [count, side]);

  return (
    <>
      {particles.map((particle) => (
        <div
          key={particle.id}
          style={{
            position: 'absolute',
            [side]: '2px',
            top: 0,
            width: '2px',
            height: '20px',
            background: `linear-gradient(to bottom, transparent, ${color}, transparent)`,
            boxShadow: `0 0 6px ${color}`,
            pointerEvents: 'none',
            animation: `stream-flow ${particle.duration}s linear infinite`,
            animationDelay: `${particle.delay}s`,
            opacity: 0.4,
            zIndex: 8,
          }}
        />
      ))}
      <style>{`
        @keyframes stream-flow {
          0% {
            transform: translateY(-100%);
            opacity: 0;
          }
          10% {
            opacity: 0.6;
          }
          90% {
            opacity: 0.6;
          }
          100% {
            transform: translateY(calc(100vh + 100%));
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
};

export default DataStreamParticles;
