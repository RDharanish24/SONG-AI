'use client';

import React, { useEffect, useState } from 'react';
import { ShieldAlert, Users, Disc, Star, Eye, Zap, Lock, Unlock, Trash2 } from 'lucide-react';
import { api, Song, AdminMetrics } from '@/lib/api';

export default function AdminPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [metricData, recentSongs] = await Promise.all([
        api.getAdminMetrics(),
        api.getRecentGenerations()
      ]);
      setMetrics(metricData);
      setSongs(recentSongs);
    } catch (err) {
      console.error(err);
      setError('Failed to load administrative analytics.');
    } finally {
      setLoading(false);
    }
  };

  const handleModerateToggle = async (songId: string, currentPublicState: boolean) => {
    try {
      const targetState = !currentPublicState;
      await api.moderateSong(songId, targetState);
      
      // Update local state
      setSongs(prev => 
        prev.map(s => s.id === songId ? { ...s, is_public: targetState } : s)
      );
    } catch (err) {
      console.error(err);
      alert('Moderation failed.');
    }
  };

  const handleDelete = async (songId: string) => {
    if (!confirm('Are you sure you want to moderate and permanently delete this song?')) return;
    try {
      await api.deleteSong(songId);
      setSongs(prev => prev.filter(s => s.id !== songId));
      if (metrics) {
        setMetrics({ ...metrics, total_songs: metrics.total_songs - 1 });
      }
    } catch (err) {
      console.error(err);
      alert('Delete failed.');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center bg-zinc-950 text-white min-h-[calc(100vh-64px)]">
        <ShieldAlert className="h-10 w-10 text-rose-500 animate-pulse mb-4" />
        <span className="text-zinc-500 text-sm">Verifying administration session...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 max-w-7xl mx-auto w-full bg-zinc-950 min-h-[calc(100vh-64px)]">
      
      {/* Title */}
      <div className="mb-10 border-b border-white/5 pb-6">
        <span className="text-xs uppercase font-bold tracking-wider text-rose-500 flex items-center gap-1">
          <ShieldAlert className="h-4 w-4" /> Administrative Console
        </span>
        <h1 className="text-3xl font-extrabold text-white mt-1">Platform Control & Analytics</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Real-time system diagnostics and media moderation</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm font-light mb-6">
          {error}
        </div>
      )}

      {/* KPI metrics row */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
          <div className="glass p-5 rounded-2xl border border-white/5 flex flex-col gap-2">
            <Users className="h-5 w-5 text-zinc-500" />
            <span className="text-[10px] text-zinc-500 uppercase font-semibold">Total Users</span>
            <span className="text-2xl font-bold text-white">{metrics.total_users}</span>
          </div>

          <div className="glass p-5 rounded-2xl border border-white/5 flex flex-col gap-2">
            <Disc className="h-5 w-5 text-rose-500" />
            <span className="text-[10px] text-zinc-500 uppercase font-semibold">Generated Songs</span>
            <span className="text-2xl font-bold text-white">{metrics.total_songs}</span>
          </div>

          <div className="glass p-5 rounded-2xl border border-white/5 flex flex-col gap-2">
            <Star className="h-5 w-5 text-amber-500 fill-amber-500/10" />
            <span className="text-[10px] text-zinc-500 uppercase font-semibold">Premium Users</span>
            <span className="text-2xl font-bold text-white">{metrics.premium_users}</span>
          </div>

          <div className="glass p-5 rounded-2xl border border-white/5 flex flex-col gap-2">
            <Eye className="h-5 w-5 text-purple-500" />
            <span className="text-[10px] text-zinc-500 uppercase font-semibold">Platform Views</span>
            <span className="text-2xl font-bold text-white">{metrics.total_views}</span>
          </div>

          <div className="glass p-5 rounded-2xl border border-white/5 flex flex-col gap-2 col-span-2 md:col-span-1">
            <Zap className="h-5 w-5 text-cyan-400" />
            <span className="text-[10px] text-zinc-500 uppercase font-semibold">API Balance</span>
            <span className="text-2xl font-bold text-white">{metrics.api_credits.toFixed(1)}</span>
          </div>
        </div>
      )}

      {/* Content Moderation Section */}
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-1.5">
        <ShieldAlert className="h-5 w-5 text-purple-500" /> Recent System Generations
      </h2>

      <div className="glass rounded-2xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-zinc-400 uppercase font-bold">
                <th className="p-4">Track ID</th>
                <th className="p-4">Sender & Receiver</th>
                <th className="p-4">Vibe & Occasion</th>
                <th className="p-4">Status</th>
                <th className="p-4">Public Status</th>
                <th className="p-4 text-right">Moderator Actions</th>
              </tr>
            </thead>
            <tbody>
              {songs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500 font-light">
                    No generated tracks found in the system databases.
                  </td>
                </tr>
              ) : (
                songs.map((song) => (
                  <tr key={song.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="p-4 font-mono text-[10px] text-zinc-500 max-w-[120px] truncate">
                      {song.id}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-white">{song.title || 'Untitled Song'}</span>
                        <span className="text-zinc-500 text-[10px]">{song.sender_name} → {song.receiver_name} ({song.relationship})</span>
                      </div>
                    </td>
                    <td className="p-4 text-zinc-400">
                      <div className="flex flex-col gap-0.5">
                        <span>{song.singer_vibe}</span>
                        <span className="text-[10px] capitalize text-zinc-500">{song.occasion} ({song.mood})</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        song.status === 'completed' 
                          ? 'bg-emerald-500/10 text-emerald-400' 
                          : song.status === 'failed' 
                          ? 'bg-rose-500/10 text-rose-400' 
                          : 'bg-amber-500/10 text-amber-400 animate-pulse'
                      }`}>
                        {song.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleModerateToggle(song.id, song.is_public)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold border transition-all ${
                          song.is_public
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-400'
                            : 'bg-zinc-900 border-white/5 text-zinc-500 hover:bg-emerald-500/10 hover:border-emerald-500/20 hover:text-emerald-400'
                        }`}
                      >
                        {song.is_public ? (
                          <>
                            <Unlock className="h-3 w-3" /> Public
                          </>
                        ) : (
                          <>
                            <Lock className="h-3 w-3" /> Hidden
                          </>
                        )}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`/song/${song.id}`}
                          className="px-2.5 py-1 bg-zinc-900 border border-white/5 rounded text-[10px] font-bold text-zinc-300 hover:bg-white/5 hover:text-white transition-all"
                        >
                          Open Link
                        </a>
                        <button
                          onClick={() => handleDelete(song.id)}
                          className="p-1 bg-zinc-900 border border-white/5 hover:border-rose-500/20 rounded text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
