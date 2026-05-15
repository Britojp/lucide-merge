import type { GridSize } from '@/constants/theme';
import type { GameModeId } from '@/lib/game-modes';
import type { Profile } from '@/utils/supabase';

export function cloudBestScoreKey(modeId: GameModeId, size: GridSize): string {
  return `${modeId}|${size}`;
}

export function readCloudBest(
  bestScores: Record<string, number> | null | undefined,
  modeId: GameModeId,
  size: GridSize,
): number {
  if (!bestScores) return 0;
  return bestScores[cloudBestScoreKey(modeId, size)] ?? 0;
}

export function readCloudBestFromProfile(
  profile: Pick<Profile, 'best_scores'> | null | undefined,
  modeId: GameModeId,
  size: GridSize,
): number {
  return readCloudBest(profile?.best_scores ?? null, modeId, size);
}
