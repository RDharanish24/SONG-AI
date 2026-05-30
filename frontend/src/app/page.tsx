'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Music, Sparkles, Share2, Send, Disc } from 'lucide-react';
import ParticleBackground from '@/components/ParticleBackground';

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: 'easeOut' as const } }
  };

  return (
    <div className="relative flex-1 flex flex-col justify-center items-center text-center px-4 overflow-hidden py-16 bg-zinc-950">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-[120px] pointer-events-none z-0 animate-pulse-slow" />
      <div className="absolute bottom-1/4 left-1/3 -translate-x-1/2 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Floating particles */}
      <ParticleBackground theme="romantic" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl z-10 flex flex-col items-center"
      >
        {/* Glow badge */}
        <motion.div 
          variants={itemVariants}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-6 cursor-default hover:bg-rose-500/20 transition-all"
        >
          <Sparkles className="h-3.5 w-3.5" /> Powered by Advanced AI Music
        </motion.div>

        {/* Premium title */}
        <motion.h1 
          variants={itemVariants}
          className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight"
        >
          Gift a Song. <br />
          <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 bg-clip-text text-transparent text-neon-glow">
            Express Your Love.
          </span>
        </motion.h1>

        {/* Captivating description */}
        <motion.p 
          variants={itemVariants}
          className="text-lg sm:text-xl text-zinc-400 max-w-2xl mb-10 leading-relaxed font-light"
        >
          Create customized, studio-quality AI-generated songs and cinematic dedication pages for the people who matter most. 
          Perfect for anniversaries, birthdays, apologies, or random surprises.
        </motion.p>

        {/* Call to Actions */}
        <motion.div 
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 mb-16"
        >
          <Link 
            href="/builder" 
            className="flex items-center justify-center gap-2 text-base font-semibold px-8 py-4 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 hover:scale-[1.03] transition-all text-white shadow-xl shadow-rose-500/20 group"
          >
            Create Dedication Song
            <Send className="h-4.5 w-4.5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link 
            href="/dashboard" 
            className="flex items-center justify-center gap-2 text-base font-semibold px-8 py-4 rounded-full bg-zinc-900 border border-white/10 hover:bg-zinc-800 hover:border-white/20 transition-all text-white"
          >
            <LayoutDashboard className="h-4.5 w-4.5" />
            View Dashboard
          </Link>
        </motion.div>

        {/* Key Features Grid */}
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full px-4 text-left"
        >
          <div className="glass-premium p-6 rounded-2xl flex flex-col gap-3 group hover:border-rose-500/40 transition-colors">
            <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl w-fit group-hover:scale-110 transition-transform">
              <Disc className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">AI Song Generation</h3>
            <p className="text-zinc-400 text-sm font-light leading-relaxed">
              Generate fully voiced, radio-quality customized music and emotional lyrics in Tamil, Hindi, English, and Telugu.
            </p>
          </div>

          <div className="glass-premium p-6 rounded-2xl flex flex-col gap-3 group hover:border-purple-500/40 transition-colors">
            <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl w-fit group-hover:scale-110 transition-transform">
              <Music className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Interactive Card Page</h3>
            <p className="text-zinc-400 text-sm font-light leading-relaxed">
              Gift a unique, shareable link with dynamic neon visualizers, scrolling synced lyrics, custom greetings, and memory slides.
            </p>
          </div>

          <div className="glass-premium p-6 rounded-2xl flex flex-col gap-3 group hover:border-pink-500/40 transition-colors">
            <div className="p-3 bg-pink-500/10 text-pink-500 rounded-xl w-fit group-hover:scale-110 transition-transform">
              <Share2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Cinematic Video Export</h3>
            <p className="text-zinc-400 text-sm font-light leading-relaxed">
              Compile and download vertical reels-ready MP4 visualizer videos with integrated lyrics overlay to post on social media.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

// Helper icons
function LayoutDashboard(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}
