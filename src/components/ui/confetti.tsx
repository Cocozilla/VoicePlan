
'use client';

import { useEffect, useState } from 'react';

const NUM_CONFETTI = 30;
const COLORS = ['#FFC700', '#FF0000', '#2E3191', '#41BBC7'];

export function Confetti() {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: NUM_CONFETTI }).map(() => ({
      x: Math.random() * 100 - 50,
      y: Math.random() * 100 - 50,
      angle: Math.random() * 360,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      opacity: 1,
      scale: 1,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
      {particles.map((particle, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full animate-confetti"
          style={
            {
              '--x': `${particle.x}px`,
              '--y': `${particle.y}px`,
              '--angle': `${particle.angle}deg`,
              '--color': particle.color,
              '--delay': `${i * 0.02}s`,
            } as React.CSSProperties
          }
        />
      ))}
       <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translate(0, 0) rotate(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(var(--x), var(--y)) rotate(var(--angle)) scale(0);
            opacity: 0;
          }
        }
        .animate-confetti {
          background-color: var(--color);
          animation: confetti 0.75s ease-out forwards;
          animation-delay: var(--delay);
        }
      `}</style>
    </div>
  );
}
