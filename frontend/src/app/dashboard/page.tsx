'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Music, Eye, Trash2, Heart, Plus, ShieldCheck, Disc } from 'lucide-react';
import { api, Song } from '@/lib/api';

export default function DashboardPage() {
  const [user, setUser] = useState<{ id: string; email: string; is_premium: boolean } | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Quick credentials registration state
  const [loginEmail, setLoginEmail] = useState('');
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    const localUser = localStorage.getItem('heartbeat_user');
    if (localUser) {
      const parsed = JSON.parse(localUser);
      setUser(parsed);
      fetchSongs(parsed.id);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchSongs = async (userId: string) => {
    try {
      setLoading(true);
      const res = await api.listUserSongs(userId);
      setSongs(res);
    } catch (err) {
      console.error(err);
      setError('Could not retrieve generated songs.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim()) return;

    try {
      setLoading(true);
      const res = await api.login(loginEmail);
      localStorage.setItem('heartbeat_user', JSON.stringify(res));
      setUser(res);
      fetchSongs(res.id);
    } catch (err) {
      console.error(err);
      setError('Failed to login.');
      setLoading(false);
    }
  };

  const handleDelete = async (songId: string) => {
    if (!confirm('Are you sure you want to delete this song dedication?')) return;

    try {
      await api.deleteSong(songId);
      setSongs(prev => prev.filter(s => s.id !== songId));
    } catch (err) {
      console.error(err);
      alert('Delete failed.');
    }
  };

  // Toggles premium state locally for sandbox verification
  const handleLocalUpgradeToggle = async () => {
    if (!user) return;
    setIsUpgrading(true);
    try {
      const updatedUser = await api.togglePremiumTest(user.id);
      localStorage.setItem('heartbeat_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      if (user) fetchSongs(user.id);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center bg-zinc-950 text-white min-h-[calc(100vh-64px)]">
        <Disc className="h-10 w-10 text-rose-500 animate-spin mb-4" />
        <span className="text-zinc-500 text-sm">Loading dashboard assets...</span>
      </div>
    );
  }

  // If no user session exists (not even guest, show credentials sign-in)
  if (!user) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center py-12 px-4 bg-zinc-950 min-h-[calc(100vh-64px)]">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-8 rounded-3xl border border-white/10 max-w-md w-full"
        >
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
              <Heart className="h-6 w-6 text-rose-500 fill-rose-500/10" /> Login to Dashboard
            </h2>
            <p className="text-xs text-zinc-500 mt-1">Access your generated songs and premium settings</p>
          </div>

          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-zinc-400">Email Address</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                placeholder="e.g. name@domain.com"
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-full bg-gradient-to-r from-rose-500 to-purple-600 text-white font-semibold hover:opacity-95 transition-all shadow-md mt-2"
            >
              Sign In
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 max-w-7xl mx-auto w-full bg-zinc-950 min-h-[calc(100vh-64px)]">
      {/* User profile card banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 border-b border-white/5 pb-6">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-rose-500">My Workspace</span>
          <h1 className="text-3xl font-extrabold text-white mt-1">User Dashboard</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Logged in as {user.email}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Premium test toggle */}
          <button
            onClick={handleLocalUpgradeToggle}
            disabled={isUpgrading}
            className={`flex items-center gap-1.5 px-4.5 py-2.5 rounded-full text-xs font-bold transition-all border ${
              user.is_premium
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 cursor-default'
                : 'bg-zinc-900 hover:bg-zinc-800 border-white/10 text-white shadow-sm'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            {user.is_premium ? '★ Premium Active' : 'Upgrade to Premium (Free Sandbox)'}
          </button>

          <Link
            href="/builder"
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-md"
          >
            <Plus className="h-4 w-4" /> Generate New
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm font-light mb-6">
          {error}
        </div>
      )}

      {/* Song List */}
      {songs.length === 0 ? (
        <div className="glass p-12 rounded-3xl border border-white/10 text-center flex flex-col items-center justify-center min-h-[300px]">
          <Music className="h-12 w-12 text-zinc-600 mb-4" />
          <h3 className="text-lg font-bold text-white mb-1">No songs generated yet</h3>
          <p className="text-sm text-zinc-500 font-light max-w-sm leading-relaxed mb-6">
            You haven&apos;t customized any songs yet. Head over to the song builder to generate a personalized song.
          </p>
          <Link
            href="/builder"
            className="px-6 py-3 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 text-white text-sm font-bold shadow-md hover:scale-[1.02] transition-all"
          >
            Start Song Builder
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {songs.map((song) => (
            <motion.div
              key={song.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass p-5 rounded-2xl border border-white/10 flex flex-col gap-4 relative overflow-hidden group"
            >
              {/* Cover Art and Info */}
              <div className="flex gap-4">
                <div className="h-20 w-20 rounded-xl overflow-hidden border border-white/5 flex-shrink-0 relative">
                  <Image
                    src={song.cover_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=200&auto=format&fit=crop'}
                    alt="Album cover"
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                  {song.status === 'generating' && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                      <Disc className="h-5 w-5 text-rose-500 animate-spin" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                    song.status === 'completed'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : song.status === 'failed'
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                      : 'bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse'
                  }`}>
                    {song.status}
                  </span>
                  <h3 className="font-bold text-white text-base truncate mt-1.5">{song.title || `For ${song.receiver_name}`}</h3>
                  <p className="text-xs text-zinc-500 mt-0.5 truncate">To: {song.receiver_name} ({song.relationship})</p>
                </div>
              </div>

              {/* Status details & actions */}
              <div className="flex justify-between items-center border-t border-white/5 pt-4 mt-auto">
                <span className="text-[10px] text-zinc-500">
                  {new Date(song.created_at).toLocaleDateString()}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDelete(song.id)}
                    aria-label="Delete song"
                    title="Delete song"
                    className="p-2 rounded-lg bg-zinc-900 border border-white/5 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <Link
                    href={`/song/${song.id}`}
                    className="flex items-center gap-1 px-3 py-2 bg-rose-500 hover:bg-rose-600 rounded-lg text-xs font-bold text-white transition-all shadow-sm"
                  >
                    <Eye className="h-3.5 w-3.5" /> View
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
