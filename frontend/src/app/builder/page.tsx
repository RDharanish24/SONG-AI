'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, ArrowLeft, Send, Disc, Compass, Volume2, Clock } from 'lucide-react';
import { api, SongRequest } from '@/lib/api';

const RELATIONSHIPS = ['lover', 'friend', 'mom', 'dad', 'wife', 'husband', 'crush', 'sibling'];
const MOODS = [
  { id: 'romantic', label: 'Romantic ❤️', desc: 'Warm, deep, and passionate' },
  { id: 'emotional', label: 'Emotional 🥺', desc: 'Melodious, touching, and sensitive' },
  { id: 'sad', label: 'Sad 🌧️', desc: 'Poetic, slow, and heart-aching' },
  { id: 'happy', label: 'Happy ✨', desc: 'Upbeat, energetic, and joyful' },
  { id: 'motivational', label: 'Motivational ⚡', desc: 'Inspiring, epic, and driving' },
  { id: 'nostalgic', label: 'Nostalgic 📻', desc: 'Retro, vintage, and warm' },
];
const LANGUAGES = ['English', 'Tamil', 'Hindi', 'Telugu'];
const OCCASIONS = ['birthday', 'anniversary', 'friendship day', 'proposal', 'apology', 'random surprise'];
const VIBES = [
  { name: 'Sid Sriram vibe', desc: 'Soulful, expressive, carnatic-fusion' },
  { name: 'Anirudh vibe', desc: 'High-energy, modern synth, electronic' },
  { name: 'AR Rahman vibe', desc: 'Cinematic, ambient, world-class melody' }
];

export default function BuilderPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string; is_premium: boolean } | null>(null);
  
  // Step navigation
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Initiating song generation...');
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<SongRequest>({
    sender_name: '',
    receiver_name: '',
    relationship: 'lover',
    mood: 'romantic',
    language: 'English',
    singer_vibe: 'Sid Sriram vibe',
    occasion: 'birthday',
    memories: '',
    theme: 'romantic',
    voice_gender: 'female',
    duration: 30, // 30s free tier default
  });

  useEffect(() => {
    // Authenticate user check (auto-register mock guest if not logged in to make user onboarding seamless!)
    let localUser = localStorage.getItem('heartbeat_user');
    if (!localUser) {
      const guestUser = {
        id: `guest_${Math.random().toString(36).substr(2, 9)}`,
        email: `guest_${Math.random().toString(36).substr(2, 5)}@heartbeat.ai`,
        is_premium: false
      };
      localStorage.setItem('heartbeat_user', JSON.stringify(guestUser));
      localUser = JSON.stringify(guestUser);
    }
    const parsed = JSON.parse(localUser);
    setUser(parsed);
    setFormData(prev => ({
      ...prev,
      duration: parsed.is_premium ? 180 : 30 // upgrade duration limit if premium
    }));
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const selectOption = (name: keyof SongRequest, value: string | number) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const nextStep = () => {
    if (step === 1 && (!formData.sender_name.trim() || !formData.receiver_name.trim())) {
      setError('Please fill in both names.');
      return;
    }
    setError(null);
    setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setError(null);
    setStep((prev) => prev - 1);
  };

  // Polls backend status
  const startStatusPolling = (id: string) => {
    const messages = [
      'Generating emotional custom lyrics...',
      'Mapping relationship & memory context...',
      'Composing instrumental music tracks...',
      'Synthesizing AI singer voice lines...',
      'Creating cinematic album cover art...',
      'Compiling visualizer video experience...',
      'Finalizing your custom dedication page...'
    ];
    let msgIndex = 0;

    const intervalId = setInterval(async () => {
      try {
        const song = await api.checkStatus(id);
        
        // Cycle load texts
        if (msgIndex < messages.length - 1) {
          setLoadingMessage(messages[msgIndex++]);
        }

        if (song.status === 'completed') {
          clearInterval(intervalId);
          router.push(`/song/${id}`);
        } else if (song.status === 'failed') {
          clearInterval(intervalId);
          setLoading(false);
          setError('AI music generation failed. Please try again.');
        }
      } catch (err) {
        console.error(err);
      }
    }, 3500);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setLoadingMessage('Composing your dedication request...');
    
    try {
      const activeUserId = user?.id || undefined;
      const song = await api.generateSong(formData, activeUserId);
      startStatusPolling(song.id);
    } catch (err: unknown) {
      setLoading(false);
      setError(err instanceof Error ? err.message : 'Something went wrong. Please check your network and backend.');
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center py-10 px-4 bg-zinc-950 relative min-h-[calc(100vh-64px)]">
      {/* Glow backgrounds */}
      <div className="absolute top-10 left-1/4 w-[350px] h-[350px] bg-rose-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[350px] h-[350px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-2xl z-10">
        <AnimatePresence mode="wait">
          {!loading ? (
            <motion.div
              key="form-container"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="glass p-8 rounded-3xl border border-white/10 relative overflow-hidden"
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-rose-500" />
                    Song Builder
                  </h2>
                  <p className="text-xs text-zinc-500 mt-1">Personalize your dedications end-to-end</p>
                </div>
                <div className="text-sm font-semibold text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
                  Step {step} of 3
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-light">
                  {error}
                </div>
              )}

              {/* Step Forms */}
              <div className="min-h-[280px]">
                {step === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex flex-col gap-6"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-sm text-zinc-400 font-medium">Your Name</label>
                        <input
                          type="text"
                          name="sender_name"
                          value={formData.sender_name}
                          onChange={handleInputChange}
                          placeholder="e.g. Rahul"
                          className="w-full bg-zinc-900/60 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-rose-500 transition-colors"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm text-zinc-400 font-medium">Their Name</label>
                        <input
                          type="text"
                          name="receiver_name"
                          value={formData.receiver_name}
                          onChange={handleInputChange}
                          placeholder="e.g. Priya"
                          className="w-full bg-zinc-900/60 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-rose-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-sm text-zinc-400 font-medium">Relationship</label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {RELATIONSHIPS.map((rel) => (
                          <button
                            key={rel}
                            type="button"
                            onClick={() => selectOption('relationship', rel)}
                            className={`py-2 px-3 rounded-xl border text-xs capitalize transition-all ${
                              formData.relationship === rel
                                ? 'bg-rose-500 border-rose-500 text-white font-semibold'
                                : 'bg-zinc-900 border-white/5 hover:border-white/15 text-zinc-400'
                            }`}
                          >
                            {rel}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-sm text-zinc-400 font-medium">Occasion</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {OCCASIONS.map((occ) => (
                          <button
                            key={occ}
                            type="button"
                            onClick={() => selectOption('occasion', occ)}
                            className={`py-2 px-3 rounded-xl border text-xs capitalize transition-all ${
                              formData.occasion === occ
                                ? 'bg-purple-600 border-purple-600 text-white font-semibold'
                                : 'bg-zinc-900 border-white/5 hover:border-white/15 text-zinc-400'
                            }`}
                          >
                            {occ}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex flex-col gap-6"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2">
                        <label className="text-sm text-zinc-400 font-medium flex items-center gap-1">
                          <Compass className="h-4 w-4 text-rose-400" /> Language
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {LANGUAGES.map((lang) => (
                            <button
                              key={lang}
                              type="button"
                              onClick={() => selectOption('language', lang)}
                              className={`py-2.5 rounded-xl border text-xs transition-all ${
                                formData.language === lang
                                  ? 'bg-rose-500 border-rose-500 text-white font-semibold'
                                  : 'bg-zinc-900/60 border-white/5 text-zinc-400'
                              }`}
                            >
                              {lang}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-sm text-zinc-400 font-medium flex items-center gap-1">
                          <Volume2 className="h-4 w-4 text-purple-400" /> Vocal Gender & Time
                        </label>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <button
                            type="button"
                            onClick={() => selectOption('voice_gender', 'female')}
                            className={`py-2.5 rounded-xl border text-xs transition-all ${
                              formData.voice_gender === 'female'
                                ? 'bg-purple-600 border-purple-600 text-white font-semibold'
                                : 'bg-zinc-900/60 border-white/5 text-zinc-400'
                            }`}
                          >
                            Female Vocals 👩‍🎤
                          </button>
                          <button
                            type="button"
                            onClick={() => selectOption('voice_gender', 'male')}
                            className={`py-2.5 rounded-xl border text-xs transition-all ${
                              formData.voice_gender === 'male'
                                ? 'bg-purple-600 border-purple-600 text-white font-semibold'
                                : 'bg-zinc-900/60 border-white/5 text-zinc-400'
                            }`}
                          >
                            Male Vocals 👨‍🎤
                          </button>
                        </div>
                        
                        {/* Premium check info */}
                        <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/80 border border-white/5">
                          <span className="text-[10px] text-zinc-400 flex items-center gap-1"><Clock className="h-3 w-3" /> Duration limit</span>
                          <span className="text-[10px] text-white font-bold bg-white/10 px-2 py-0.5 rounded">
                            {user?.is_premium ? '3:00 (Full)' : '0:30 (Preview)'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-sm text-zinc-400 font-medium">Singer Vibe & Beat Style</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {VIBES.map((vibe) => (
                          <button
                            key={vibe.name}
                            type="button"
                            onClick={() => selectOption('singer_vibe', vibe.name)}
                            className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                              formData.singer_vibe === vibe.name
                                ? 'bg-pink-500/10 border-pink-500 text-white font-semibold'
                                : 'bg-zinc-900 border-white/5 hover:border-white/10 text-zinc-400'
                            }`}
                          >
                            <span className="text-xs font-semibold text-white">{vibe.name}</span>
                            <span className="text-[10px] text-zinc-500 font-light leading-snug">{vibe.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex flex-col gap-6"
                  >
                    <div className="flex flex-col gap-2">
                      <label className="text-sm text-zinc-400 font-medium">Song Mood</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {MOODS.map((mood) => (
                          <button
                            key={mood.id}
                            type="button"
                            onClick={() => selectOption('mood', mood.id)}
                            className={`p-3 rounded-xl border text-left flex flex-col gap-0.5 transition-all ${
                              formData.mood === mood.id
                                ? 'bg-rose-500/10 border-rose-500 text-white font-semibold'
                                : 'bg-zinc-900 border-white/5 hover:border-white/10 text-zinc-400'
                            }`}
                          >
                            <span className="text-xs font-semibold text-white">{mood.label}</span>
                            <span className="text-[10px] text-zinc-500 font-light">{mood.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-sm text-zinc-400 font-medium flex items-center justify-between">
                        <span>Personal Memories & Custom Notes</span>
                        <span className="text-[10px] text-zinc-500">Highly recommended for unique lyrics</span>
                      </label>
                      <textarea
                        name="memories"
                        value={formData.memories}
                        onChange={handleInputChange}
                        rows={4}
                        placeholder="e.g. We first met on a rainy college bus ride. You fell asleep on my shoulder. I've loved you ever since..."
                        className="w-full bg-zinc-900/60 border border-white/10 rounded-xl p-3.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-rose-500 transition-colors resize-none"
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Navigation buttons */}
              <div className="flex justify-between items-center mt-8 border-t border-white/5 pt-6">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex items-center gap-1.5 text-sm px-4 py-2.5 rounded-full border border-white/10 text-zinc-300 hover:bg-white/5 transition-all"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                ) : (
                  <div />
                )}

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex items-center gap-1.5 text-sm px-6 py-2.5 rounded-full bg-rose-500 text-white font-semibold hover:opacity-90 transition-all shadow-md"
                  >
                    Next <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="flex items-center gap-1.5 text-sm px-8 py-3 rounded-full bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold hover:scale-[1.02] transition-all shadow-lg"
                  >
                    Generate Song <Send className="h-4 w-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            /* Immersive Loading Screen */
            <motion.div
              key="loader-container"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass p-12 rounded-3xl border border-white/10 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden"
            >
              {/* Spinner animation */}
              <div className="relative mb-8">
                <div className="w-24 h-24 rounded-full border-4 border-rose-500/10 border-t-rose-500 animate-spin" />
                <Disc className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 text-rose-500 animate-pulse" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">Composing Masterpiece</h2>
              <p className="text-sm text-rose-400 animate-pulse font-light tracking-wide min-h-[20px]">
                {loadingMessage}
              </p>
              
              <div className="mt-8 max-w-xs text-xs text-zinc-500 leading-relaxed font-light">
                Our artificial intelligence systems are weaving your thoughts, relationship, and vibe into studio-grade acoustics. This takes around 30-40 seconds.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
