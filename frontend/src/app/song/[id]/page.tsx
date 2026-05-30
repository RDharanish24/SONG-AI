'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Share2, Heart, Disc, Volume2, Copy, Sparkles, Star, Film, Download } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api, SongDetails } from '@/lib/api';
import ParticleBackground from '@/components/ParticleBackground';
import AudioVisualizer from '@/components/AudioVisualizer';
import Slideshow from '@/components/Slideshow';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SongDedicationPage(props: PageProps) {
  const resolvedParams = React.use(props.params);
  const songId = resolvedParams.id;

  const [data, setData] = useState<SongDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Audio playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [autoPlayAttempted, setAutoPlayAttempted] = useState(false);
  const [activeLyricIndex, setActiveLyricIndex] = useState(-1);

  // Download state
  const [downloading, setDownloading] = useState(false);

  // Sharing states
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Heart animation clicks
  const [clickHearts, setClickHearts] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const heartCounter = useRef(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);

  // Fetch song details
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        // Track analytics view automatically on page load
        const res = await api.getSongDetails(songId);
        setData(res);
        
        // Trigger celebratory confetti on load!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f43f5e', '#a855f7', '#ff69b4']
        });
      } catch (err) {
        setError('Dedication page could not be found.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [songId]);

  // Audio event bindings
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      
      // Update highlighted lyrics line
      if (data?.lyrics?.structured_lyrics) {
        const index = data.lyrics.structured_lyrics.findIndex(
          (line, idx) => {
            const nextLine = data.lyrics?.structured_lyrics?.[idx + 1];
            return audio.currentTime >= line.time && (!nextLine || audio.currentTime < nextLine.time);
          }
        );
        setActiveLyricIndex(index);

        // Auto-scroll lyrics container to active line
        if (index !== -1 && lyricsContainerRef.current) {
          const activeLineElement = lyricsContainerRef.current.children[index] as HTMLElement;
          if (activeLineElement) {
            lyricsContainerRef.current.scrollTo({
              top: activeLineElement.offsetTop - lyricsContainerRef.current.clientHeight / 2 + 20,
              behavior: 'smooth'
            });
          }
        }
      }
    };

    const onLoadedMetadata = () => {
      setDuration(audio.duration);
      // Attempt autoplay if autoPlayOption is set
      if (!autoPlayAttempted) {
        setAutoPlayAttempted(true);
        audio.play()
          .then(() => setIsPlaying(true))
          .catch(() => console.log('Autoplay blocked by browser policy. Play button is ready.'));
      }
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, [data, autoPlayAttempted]);

  // Ensure audio element honors initial volume and updates when volume changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
  }, [volume, data]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const value = parseFloat(e.target.value);
    audio.currentTime = value;
    setCurrentTime(value);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const value = parseFloat(e.target.value);
    audio.volume = value;
    setVolume(value);
  };

  const handleScreenClick = (e: React.MouseEvent) => {
    // Generate floating heart on tap/click
    const x = e.clientX;
    const y = e.clientY;
    const id = heartCounter.current++;
    setClickHearts(prev => [...prev, { id, x, y }]);
    setTimeout(() => {
      setClickHearts(prev => prev.filter(h => h.id !== id));
    }, 1500);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSocialShare = (platform: 'whatsapp' | 'twitter') => {
    const text = `Check out this personalized AI song dedicated to me! 💖 ${window.location.href}`;
    let url = '';
    if (platform === 'whatsapp') {
      url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    } else {
      url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    }
    window.open(url, '_blank');
  };

  const handleDownloadAudio = async () => {
    if (!data?.song?.audio_url) return;
    setDownloading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
      const response = await fetch(`${apiBase}/songs/download/audio/${songId}`);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HeartBeat-${data.song.receiver_name || 'song'}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      // Fallback: open audio URL directly
      if (data?.song?.audio_url) {
        window.open(data.song.audio_url, '_blank');
      }
    } finally {
      setDownloading(false);
    }
  };

  // Buy Premium integration trigger
  const handleUpgrade = async () => {
    if (!data?.song?.user_id) return;
    try {
      const res = await api.createCheckoutSession(data.song.user_id);
      window.location.href = res.checkout_url;
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center bg-zinc-950 text-white min-h-screen">
        <Disc className="h-12 w-12 text-rose-500 animate-spin mb-4" />
        <span className="text-zinc-500 text-sm animate-pulse">Loading dedication experience...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center bg-zinc-950 text-white px-4 min-h-screen">
        <Heart className="h-12 w-12 text-rose-600/30 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Failed to Load Page</h2>
        <p className="text-sm text-zinc-500">{error || 'Song record could not be fetched.'}</p>
      </div>
    );
  }

  const { song, lyrics } = data;

  return (
    <div 
      onClick={handleScreenClick}
      className="flex-1 flex flex-col items-center justify-center min-h-screen relative overflow-hidden bg-zinc-950 px-4 py-8 select-none"
    >
      {/* Immersive memory slideshow background */}
      <Slideshow mood={song.mood} />

      {/* Floating particles background */}
      <ParticleBackground theme={song.theme} />

      {/* Hidden audio player */}
      {song.audio_url && (
        <audio ref={audioRef} src={song.audio_url} preload="auto" crossOrigin="anonymous" />
      )}

      {/* Click-to-spawn hearts */}
      {clickHearts.map(h => (
        <motion.div
          key={h.id}
          className="fixed text-rose-500 text-2xl z-50 pointer-events-none"
          style={{ left: h.x - 12, top: h.y - 12 }}
          initial={{ scale: 0.5, y: 0, opacity: 1 }}
          animate={{ scale: 1.5, y: -80, opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        >
          ❤️
        </motion.div>
      ))}

      {/* Main card */}
      <div className="w-full max-w-4xl z-20 grid grid-cols-1 md:grid-cols-2 gap-8 items-center mt-6">
        
        {/* Left: Album cover visualizer & dedication details */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col gap-6"
        >
          {/* Greeting banner */}
          <div className="text-center md:text-left">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-2 text-neon-glow">
              For {song.receiver_name} 💖
            </h1>
            <p className="text-sm text-zinc-400 font-light">
              A custom {song.language} {song.mood} composition by <span className="font-semibold text-rose-400">{song.sender_name}</span>
            </p>
          </div>

          {/* Disk container */}
          <div className="relative aspect-square w-full max-w-[340px] mx-auto rounded-3xl overflow-hidden shadow-2xl group border border-white/10 bg-zinc-900/40 backdrop-blur-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={song.cover_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400&auto=format&fit=crop'} 
              alt="Album cover" 
              className={`w-full h-full object-cover transition-transform duration-1000 ${isPlaying ? 'scale-105' : ''}`}
            />
            {/* Spinning disc indicator */}
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md rounded-full p-2.5 border border-white/10">
              <Disc className={`h-5 w-5 text-rose-500 ${isPlaying ? 'animate-spin' : ''}`} />
            </div>
            {/* Free status label watermark */}
            {song.duration === 30 && (
              <div className="absolute bottom-4 left-4 bg-rose-500/80 backdrop-blur-md rounded-lg px-2.5 py-1 text-[10px] uppercase font-bold text-white border border-rose-400/20">
                Preview Tier
              </div>
            )}
          </div>

          {/* Interactive Player Controls */}
          <div className="glass-premium p-6 rounded-2xl border border-white/10 max-w-[340px] mx-auto w-full flex flex-col gap-4">
            
            {/* Audio Waveform */}
            <AudioVisualizer isPlaying={isPlaying} audioRef={audioRef} />

            {/* Time Slider */}
            <div className="flex flex-col gap-1">
              <input 
                type="range" 
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                aria-label="Seek audio"
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-light mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              {/* Volume Slider */}
              <div className="flex items-center gap-1.5 w-1/3">
                <Volume2 className="h-3.5 w-3.5 text-zinc-500" />
                <input 
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume}
                  onChange={handleVolumeChange}
                  aria-label="Adjust volume"
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              {/* Play Button */}
              <button 
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause audio" : "Play audio"}
                className="p-4 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg hover:scale-105 transition-all"
              >
                {isPlaying ? <Pause className="h-5 w-5 fill-white" /> : <Play className="h-5 w-5 fill-white ml-0.5" />}
              </button>

              {/* Download Button */}
              <button 
                type="button"
                onClick={handleDownloadAudio}
                disabled={downloading || !song.audio_url}
                aria-label="Download audio"
                className={`p-3.5 rounded-full border transition-all ${
                  downloading
                    ? 'bg-rose-500/20 border-rose-500/30 text-rose-400 animate-pulse'
                    : song.audio_url
                      ? 'bg-zinc-900 border-white/10 hover:border-rose-500/40 text-zinc-400 hover:text-rose-400'
                      : 'bg-zinc-900/50 border-white/5 text-zinc-600 cursor-not-allowed'
                }`}
              >
                <Download className={`h-4.5 w-4.5 ${downloading ? 'animate-bounce' : ''}`} />
              </button>

              {/* Share Button */}
              <button 
                type="button"
                onClick={() => setShowShareModal(true)}
                aria-label="Share song"
                className="p-3.5 rounded-full bg-zinc-900 border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white transition-all"
              >
                <Share2 className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Right: Synced scrolling lyrics and message dedication card */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col gap-6"
        >
          {/* Dedication memory note card */}
          {song.memories && (
            <div className="glass p-5 rounded-2xl border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 text-rose-500/10">
                <Heart className="h-16 w-16 fill-rose-500/5" />
              </div>
              <h3 className="text-xs uppercase font-bold tracking-wider text-rose-400 mb-2 flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-rose-400/20" /> Dedication Message
              </h3>
              <p className="text-sm text-zinc-300 font-light italic leading-relaxed">
                &ldquo;{song.memories}&rdquo;
              </p>
            </div>
          )}

          {/* Sync lyrics card */}
          <div className="glass-premium p-6 rounded-3xl flex flex-col gap-4 border border-white/10">
            <h3 className="text-xs uppercase font-bold tracking-wider text-purple-400 border-b border-white/5 pb-2 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Live Synced Lyrics
            </h3>
            
            <div 
              ref={lyricsContainerRef}
              className="h-[220px] overflow-y-auto pr-2 flex flex-col gap-5 scrollbar-thin scroll-smooth"
            >
              {lyrics?.structured_lyrics ? (
                lyrics.structured_lyrics.map((line, idx) => (
                  <motion.div
                    key={idx}
                    className={`text-base sm:text-lg font-bold leading-relaxed transition-colors duration-500 cursor-pointer ${
                      activeLyricIndex === idx
                        ? 'text-rose-500 text-neon-glow'
                        : 'text-zinc-500/80 hover:text-zinc-300'
                    }`}
                    onClick={() => {
                      if (audioRef.current) {
                        audioRef.current.currentTime = line.time;
                        setCurrentTime(line.time);
                        if (!isPlaying) togglePlay();
                      }
                    }}
                  >
                    {line.text}
                  </motion.div>
                ))
              ) : (
                <div className="text-zinc-500 text-sm font-light text-center mt-20">
                  Lyrics loaded. Play track to sync.
                </div>
              )}
            </div>
          </div>

          {/* Premium tier promo overlay if free song */}
          {song.duration === 30 && (
            <div className="glass p-5 rounded-2xl border border-rose-500/25 bg-rose-500/5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-col gap-1 text-center sm:text-left">
                <h4 className="text-sm font-bold text-white flex items-center justify-center sm:justify-start gap-1">
                  Upgrade to Premium <Star className="h-4.5 w-4.5 text-amber-400 fill-amber-400/20" />
                </h4>
                <p className="text-xs text-zinc-400 font-light max-w-xs">
                  Unlock the full 3-minute high-definition audio track and render vertical MP4 reels with lyrics overlays.
                </p>
              </div>
              <button 
                onClick={handleUpgrade}
                className="text-xs font-bold px-5 py-2.5 rounded-full bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-md hover:scale-[1.03] transition-all whitespace-nowrap"
              >
                Unlock Now ($4.99)
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Share Modal Dialog */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass p-8 rounded-3xl border border-white/10 max-w-md w-full flex flex-col gap-6"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-1.5"><Share2 className="h-5 w-5 text-rose-500" /> Share Song</h3>
                <button 
                  onClick={() => setShowShareModal(false)}
                  className="text-zinc-500 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed font-light">
                Share this magical dedication page with {song.receiver_name}. Anyone with the link can listen and see the lyrics scrolling.
              </p>

              {/* Copy URL Row */}
              <div className="flex gap-2">
                <input 
                  type="text" 
                  readOnly 
                  title="Share link URL"
                  aria-label="Share link URL"
                  value={window.location.href}
                  className="flex-1 bg-zinc-900 border border-white/5 rounded-xl px-3 py-2 text-xs text-zinc-400 focus:outline-none"
                />
                <button 
                  onClick={copyShareLink}
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-600 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-1.5"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>

              {/* Social sharing options */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button 
                  onClick={() => handleSocialShare('whatsapp')}
                  className="py-3 bg-zinc-900 border border-white/5 rounded-xl text-xs font-bold text-white hover:bg-white/5 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>WhatsApp</span>
                </button>
                <button 
                  onClick={() => handleSocialShare('twitter')}
                  className="py-3 bg-zinc-900 border border-white/5 rounded-xl text-xs font-bold text-white hover:bg-white/5 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Twitter / X</span>
                </button>
              </div>

              {/* Audio download CTA */}
              <div className="border-t border-white/5 pt-4 flex flex-col gap-3">
                {song.audio_url ? (
                  <button
                    onClick={handleDownloadAudio}
                    disabled={downloading}
                    className={`w-full py-3 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-md transition-all ${
                      downloading
                        ? 'bg-zinc-700 cursor-wait'
                        : 'bg-gradient-to-r from-rose-500 to-purple-600 hover:opacity-95'
                    }`}
                  >
                    <Download className={`h-4 w-4 ${downloading ? 'animate-spin' : ''}`} />
                    {downloading ? 'Downloading...' : 'Download Audio (MP3)'}
                  </button>
                ) : (
                  <button 
                    className="w-full py-3 bg-zinc-900 border border-white/5 rounded-xl text-xs font-bold text-zinc-500 flex items-center justify-center gap-1.5 cursor-not-allowed"
                    disabled
                  >
                    <Download className="h-4 w-4" /> Audio not ready yet
                  </button>
                )}

                {/* Video presentation download CTA */}
                {song.video_url ? (
                  <a 
                    href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/songs/download/${song.id}`} 
                    download={`HeartBeat-${song.receiver_name}.mp4`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3 bg-zinc-900 border border-white/10 hover:border-white/20 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Film className="h-4 w-4" /> Download Reels Video (MP4)
                  </a>
                ) : (
                  <button 
                    onClick={handleUpgrade}
                    className="w-full py-3 bg-zinc-900 border border-white/5 rounded-xl text-xs font-bold text-zinc-500 flex items-center justify-center gap-1.5 cursor-not-allowed"
                    disabled
                  >
                    <Film className="h-4 w-4" /> MP4 Video Export (Premium Only)
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
