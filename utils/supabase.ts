import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

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
