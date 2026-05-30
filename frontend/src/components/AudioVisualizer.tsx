'use client';

import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  isPlaying: boolean;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

export default function AudioVisualizer({ isPlaying, audioRef }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set dimensions
    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.clientWidth || 300;
      canvas.height = 80;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Render loop helper
    const draw = () => {
      if (!ctx || !canvas) return;
      
      const width = canvas.width;
      const height = canvas.height;
      
      ctx.clearRect(0, 0, width, height);

      // Define visual styling (Neon rose gradient)
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, '#f43f5e'); // Rose
      gradient.addColorStop(0.5, '#a855f7'); // Purple
      gradient.addColorStop(1, '#ec4899'); // Pink

      ctx.fillStyle = gradient;

      if (analyserRef.current && isPlaying) {
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        const barWidth = (width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          barHeight = (dataArray[i] / 255) * height;
          
          // Draw bar
          ctx.beginPath();
          ctx.roundRect(x, height - barHeight, barWidth - 2, barHeight, 4);
          ctx.fill();

          x += barWidth;
        }
      } else {
        // Mock fallback bounce waves if audio context is blocked/not playing
        const barWidth = 6;
        const gap = 4;
        const numBars = Math.floor(width / (barWidth + gap));
        
        for (let i = 0; i < numBars; i++) {
          const factor = isPlaying ? Math.sin(Date.now() * 0.005 + i * 0.5) * 0.4 + 0.6 : 0.15;
          const barHeight = (height * 0.7) * factor;
          const x = i * (barWidth + gap);
          
          ctx.beginPath();
          ctx.roundRect(x, height - barHeight - 5, barWidth, barHeight + 5, 3);
          ctx.fill();
        }
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    // Attempt to hook into audio context
    const setupAudioContext = () => {
      const audio = audioRef.current;
      if (!audio) return;

      try {
        if (!audioContextRef.current) {
          // Initialize AudioContext
          const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          const audioCtx = new AudioContextClass();
          const analyser = audioCtx.createAnalyser();
          
          // Set to crossOrigin anonymous to allow cross-domain track analysis
          audio.crossOrigin = 'anonymous';
          
          // Connect nodes
          const source = audioCtx.createMediaElementSource(audio);
          source.connect(analyser);
          analyser.connect(audioCtx.destination);

          // Configure analyser
          analyser.fftSize = 64;
          
          audioContextRef.current = audioCtx;
          analyserRef.current = analyser;
          sourceRef.current = source;
        }

        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume();
        }
      } catch (err) {
        // Web Audio connection failed (likely CORS or context block), fallback to mockup
        console.warn('Audio Visualizer running in high-fidelity fallback mode:', err);
      }
    };

    if (isPlaying) {
      setupAudioContext();
    }

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, audioRef]);

  return (
    <div className="w-full relative flex items-center justify-center">
      <canvas ref={canvasRef} className="opacity-80 drop-shadow-[0_0_10px_rgba(244,63,94,0.4)]" />
    </div>
  );
}
