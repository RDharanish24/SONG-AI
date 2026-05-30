const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Health check helper
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL.replace('/api/v1', '')}/health`, { 
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    return res.ok;
  } catch (err) {
    console.error('Backend health check failed:', err);
    return false;
  }
}

export interface SongRequest {
  sender_name: string;
  receiver_name: string;
  relationship: string;
  mood: string;
  language: string;
  singer_vibe: string;
  occasion: string;
  memories?: string;
  theme?: string;
  voice_gender?: string;
  duration?: number;
}

export interface Song {
  id: string;
  user_id?: string;
  sender_name: string;
  receiver_name: string;
  relationship: string;
  mood: string;
  language: string;
  singer_vibe: string;
  occasion: string;
  memories?: string;
  title?: string;
  audio_url?: string;
  video_url?: string;
  cover_url?: string;
  duration?: number;
  theme: string;
  voice_gender: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  task_id?: string;
  is_public: boolean;
  created_at: string;
}

export interface Lyrics {
  id: string;
  song_id: string;
  raw_text: string;
  structured_lyrics?: Array<{ time: number; text: string }>;
  created_at: string;
}

export interface SongDetails {
  song: Song;
  lyrics?: Lyrics;
  views_count: number;
  is_favorite: boolean;
}

export interface AdminMetrics {
  total_users: number;
  total_songs: number;
  premium_users: number;
  total_views: number;
  api_credits: number;
}

export const api = {
  async login(email: string, fullName?: string) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, full_name: fullName }),
    });
    if (!res.ok) throw new Error('Login failed');
    return res.json();
  },

  async togglePremiumTest(userId: string) {
    const res = await fetch(`${API_BASE_URL}/auth/premium/${userId}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Premium upgrade failed');
    return res.json();
  },

  async generateSong(data: SongRequest, userId?: string): Promise<Song> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (userId) headers['user-id'] = userId;

    const res = await fetch(`${API_BASE_URL}/songs/generate`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Song generation failed');
    return res.json();
  },

  async checkStatus(songId: string): Promise<Song> {
    const res = await fetch(`${API_BASE_URL}/songs/status/${songId}`);
    if (!res.ok) throw new Error('Status check failed');
    return res.json();
  },

  async getSongDetails(songId: string, userId?: string, viewerIp?: string, userAgent?: string): Promise<SongDetails> {
    const headers: Record<string, string> = {};
    if (userId) headers['user-id'] = userId;

    const query = new URLSearchParams();
    if (viewerIp) query.append('viewer_ip', viewerIp);
    if (userAgent) query.append('user_agent', userAgent);

    const res = await fetch(`${API_BASE_URL}/songs/details/${songId}?${query.toString()}`, { headers });
    if (!res.ok) throw new Error('Failed to load song details');
    return res.json();
  },

  async listUserSongs(userId: string): Promise<Song[]> {
    const res = await fetch(`${API_BASE_URL}/songs/user/list?user_id=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch user songs');
    return res.json();
  },

  async deleteSong(songId: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/songs/${songId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete song');
  },

  async toggleFavorite(songId: string, userId: string): Promise<{ is_favorite: boolean }> {
    const res = await fetch(`${API_BASE_URL}/songs/${songId}/favorite?user_id=${userId}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to toggle favorite');
    return res.json();
  },

  async createCheckoutSession(userId: string, amount = 4.99): Promise<{ checkout_url: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/payments/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, price_amount: amount }),
      });
      if (!res.ok) {
        const errorBody = await res.text();
        console.error(`Checkout session failed (${res.status}):`, errorBody);
        throw new Error(`Failed to create payment checkout session: ${res.status} ${errorBody}`);
      }
      return res.json();
    } catch (err) {
      console.error('Checkout session error:', err);
      throw err;
    }
  },

  async getAdminMetrics(): Promise<AdminMetrics> {
    const res = await fetch(`${API_BASE_URL}/admin/metrics`);
    if (!res.ok) throw new Error('Failed to fetch admin metrics');
    return res.json();
  },

  async getRecentGenerations(): Promise<Song[]> {
    const res = await fetch(`${API_BASE_URL}/admin/generations`);
    if (!res.ok) throw new Error('Failed to fetch recent generations');
    return res.json();
  },

  async moderateSong(songId: string, isPublic: boolean): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/admin/moderate/${songId}?is_public=${isPublic}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to moderate song');
  }
};
