import { useEffect, useMemo, useState } from 'react';
import type { GridSize } from '@/constants/theme';
import type { GameModeId } from '@/lib/game-modes';
import {
  computeLeaderboardRank,
  type LeaderboardRankEntry,
  type LeaderboardRankSnapshot,
} from '@/lib/share-leaderboard-rank';
import { supabase } from '@/utils/supabase';

export function useShareLeaderboardRank(
  userId: string | null | undefined,
  userBestScore: number,
  modeId: GameModeId,
  gridSize: GridSize,
): LeaderboardRankSnapshot | null {
  const [entries, setEntries] = useState<LeaderboardRankEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('leaderboard_public')
      .select('id, best_scores')
      .then(({ data }) => {
        if (!cancelled) setEntries((data as LeaderboardRankEntry[]) ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(
    () => computeLeaderboardRank(entries, userId, userBestScore, modeId, gridSize),
    [entries, userId, userBestScore, modeId, gridSize],
  );
}
