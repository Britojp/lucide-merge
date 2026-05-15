import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { supabaseAuthStorage } from '@/lib/supabase-auth-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY!;

let browserClient: SupabaseClient | null = null;

function createBrowserSupabase(): SupabaseClient {
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      storage: supabaseAuthStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
}

function getSupabase(): SupabaseClient {
  if (typeof window === 'undefined') {
    throw new Error('Supabase só está disponível no cliente (browser ou app).');
  }
  if (!browserClient) browserClient = createBrowserSupabase();
  return browserClient;
}

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getSupabase();
    const value = Reflect.get(client, prop, receiver);
    if (typeof value === 'function') return value.bind(client);
    return value;
  },
});

export type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  best_score: number;
  best_scores: Record<string, number>;
};

export type UserProgress = {
  user_id: string;
  xp: number;
  level: number;
  last_played_at: string | null;
  updated_at: string;
};

export type AchievementDef = {
  id: string;
  title: string;
  description: string;
  xp_reward: number;
};

export type UserAchievementEntry = {
  achievement_id: string;
  earned_at: string;
};

export type MissionStateRow = {
  mission_id: string;
  progress: number;
  completed_at: string | null;
  mission_defs: { title: string; xp_reward: number } | null;
};
