import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, type Profile } from '@/utils/supabase';
import type { GridSize } from '@/constants/theme';
import type { GameModeId } from '@/lib/game-modes';
import { cloudBestScoreKey, readCloudBest } from '@/lib/cloud-best-scores';

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  syncBestScore: (score: number, size: GridSize, modeId: GameModeId) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  session: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
  syncBestScore: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('id, email, display_name, best_score, best_scores')
      .eq('id', userId)
      .single();
    if (data) setProfile(data as Profile);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  const syncBestScore = useCallback(async (score: number, size: GridSize, modeId: GameModeId) => {
    if (!user) return;
    const currentScores = profile?.best_scores ?? {};
    if (score <= readCloudBest(currentScores, modeId, size)) return;

    const key = cloudBestScoreKey(modeId, size);
    const newBestScores = { ...currentScores, [key]: score };
    const { data } = await supabase
      .from('profiles')
      .update({ best_scores: newBestScores, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select('id, email, display_name, best_score, best_scores')
      .single();
    if (data) setProfile(data as Profile);
  }, [user, profile]);

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signOut, refreshProfile, syncBestScore }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
