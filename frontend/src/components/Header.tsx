'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Heart, Disc, LayoutDashboard, Settings } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string; is_premium: boolean } | null>(null);

  // Load user status on mount
  useEffect(() => {
    const localUser = localStorage.getItem('heartbeat_user');
    if (localUser) {
      setUser(JSON.parse(localUser));
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('heartbeat_user');
    setUser(null);
    router.push('/');
  };

  // Check if we are on the immersion song dedication page
  if (pathname.startsWith('/song/')) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 group">
          <Heart className="h-6 w-6 text-rose-500 fill-rose-500/10 group-hover:scale-110 transition-transform" />
          <span className="font-bold text-lg tracking-wider bg-gradient-to-r from-rose-500 to-purple-500 bg-clip-text text-transparent">
            HEARTBEAT AI
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/builder" className={`text-sm font-medium transition-colors hover:text-rose-400 ${pathname === '/builder' ? 'text-rose-500' : 'text-zinc-400'}`}>
            <span className="flex items-center gap-1.5"><Disc className="h-4 w-4" /> Build Song</span>
          </Link>
          {user && (
            <Link href="/dashboard" className={`text-sm font-medium transition-colors hover:text-rose-400 ${pathname === '/dashboard' ? 'text-rose-500' : 'text-zinc-400'}`}>
              <span className="flex items-center gap-1.5"><LayoutDashboard className="h-4 w-4" /> Dashboard</span>
            </Link>
          )}
          <Link href="/admin" className={`text-sm font-medium transition-colors hover:text-rose-400 ${pathname === '/admin' ? 'text-rose-500' : 'text-zinc-400'}`}>
            <span className="flex items-center gap-1.5"><Settings className="h-4 w-4" /> Admin</span>
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex flex-col text-right">
                <span className="text-xs font-semibold text-zinc-300 max-w-[120px] truncate">{user.email}</span>
                <span className={`text-[10px] uppercase font-bold tracking-wider ${user.is_premium ? 'text-amber-400' : 'text-zinc-500'}`}>
                  {user.is_premium ? '★ Premium' : 'Free Tier'}
                </span>
              </div>
              <button 
                onClick={handleLogout}
                className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
              >
                Log Out
              </button>
            </div>
          ) : (
            <Link 
              href="/dashboard" 
              className="text-sm font-semibold px-4 py-2 rounded-full bg-gradient-to-r from-rose-500 to-purple-600 hover:opacity-90 transition-all text-white shadow-lg shadow-rose-500/20"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
