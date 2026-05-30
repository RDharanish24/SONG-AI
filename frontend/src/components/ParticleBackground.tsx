'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  type: 'heart' | 'sparkle' | 'circle';
}

export default function ParticleBackground({ theme = 'romantic' }: { theme?: string }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const particleTypes: ('heart' | 'sparkle' | 'circle')[] = 
      theme === 'romantic' ? ['heart', 'sparkle', 'circle'] : ['sparkle', 'circle'];
      
    const items = Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // percentage width
      y: Math.random() * 100 + 100, // start below the screen
      size: Math.random() * 20 + 10, // px
      delay: Math.random() * 5,
      duration: Math.random() * 10 + 15, // seconds
      type: particleTypes[Math.floor(Math.random() * particleTypes.length)]
    }));
    setParticles(items);
  }, [theme]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute text-rose-500/25 dark:text-rose-500/15"
          style={{
            left: `${p.x}%`,
            fontSize: `${p.size}px`,
          }}
          initial={{ y: '110vh', opacity: 0, scale: 0.5, rotate: 0 }}
          animate={{
            y: '-10vh',
            opacity: [0, 0.7, 0.7, 0],
            scale: [0.6, 1.2, 1, 0.6],
            rotate: [0, 45, -45, 90],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {p.type === 'heart' ? (
            '❤️'
          ) : p.type === 'sparkle' ? (
            '✨'
          ) : (
            <span 
              className="block rounded-full bg-gradient-to-tr from-purple-500/10 to-pink-500/20" 
              style={{ width: p.size, height: p.size }}
            />
          )}
        </motion.div>
      ))}
    </div>
  );
}
