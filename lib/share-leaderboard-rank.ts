import type { GridSize } from '@/constants/theme';
import type { GameModeId } from '@/lib/game-modes';
import { readCloudBest } from '@/lib/cloud-best-scores';

export type LeaderboardRankSnapshot = {
  position: number;
  total: number;
  topPercent: number;
};

export type LeaderboardRankEntry = {
  id: string;
  best_scores: Record<string, number> | null;
};

export function computeLeaderboardRank(
  entries: LeaderboardRankEntry[],
  userId: string | null | undefined,
  userBestScore: number,
  modeId: GameModeId,
  size: GridSize,
): LeaderboardRankSnapshot | null {
  const ranked = entries
    .map(entry => ({
      id: entry.id,
      score: readCloudBest(entry.best_scores, modeId, size),
    }))
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  const total = ranked.length;
  if (total === 0 || !userId || userBestScore <= 0) return null;

  const listedIndex = ranked.findIndex(entry => entry.id === userId);
  let position =
    listedIndex >= 0
      ? listedIndex + 1
      : ranked.findIndex(entry => userBestScore >= entry.score) + 1;

  if (position <= 0) position = total;

  const topPercent = Math.max(1, Math.ceil((position / total) * 100));
  return { position, total, topPercent };
}
