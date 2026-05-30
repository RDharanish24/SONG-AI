'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SlideshowProps {
  images?: string[];
  mood: string;
}

const FALLBACK_MOOD_IMAGES: Record<string, string[]> = {
  romantic: [
    'https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=600&auto=format&fit=crop'
  ],
  sad: [
    'https://images.unsplash.com/photo-1484790894379-0a4e9aedd197?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=600&auto=format&fit=crop'
  ],
  happy: [
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=600&auto=format&fit=crop'
  ]
};

export default function Slideshow({ images = [], mood }: SlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Decide which slide deck to use
  const slides = images.length > 0 
    ? images 
    : (FALLBACK_MOOD_IMAGES[mood] || FALLBACK_MOOD_IMAGES['romantic']);

  useEffect(() => {
    if (slides.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000); // 5 seconds slide duration

    return () => clearInterval(interval);
  }, [slides]);

  return (
    <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/60 z-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-black/80 z-10" />

      <AnimatePresence mode="wait">
        <motion.img
          key={currentIndex}
          src={slides[currentIndex]}
          alt="Memory slide"
          className="w-full h-full object-cover"
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 0.6, scale: 1.02 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
        />
      </AnimatePresence>
    </div>
  );
}
