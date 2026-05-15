import type { GridSize } from '@/constants/theme';
import type { Direction } from '@/hooks/use-game';
import type { GameModeId } from '@/lib/game-modes';

export interface RunStats {
  merges: number;
  spawns: number;
  maxTile: number;
  durationMs: number;
}

export interface RunReplay {
  version: 1;
  modeId: GameModeId;
  gridSize: GridSize;
  seed: string;
  moves: Direction[];
  createdAt: string;
}

export interface PersistedRun {
  id?: string;
  mode_id: GameModeId;
  grid_size: GridSize;
  score: number;
  max_tile: number;
  duration_ms: number;
  move_count: number;
  merges_total: number;
  replay_seed: string;
  replay_moves: Direction[];
  challenge_date: string | null;
  is_completed: boolean;
}

export function challengeDateFromSeed(seed: string, modeId: GameModeId): string | null {
  if (modeId !== 'daily_challenge') return null;
  const candidate = seed.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(candidate)) return null;
  return candidate;
}

export function buildReplay(
  modeId: GameModeId,
  gridSize: GridSize,
  seed: string,
  moves: Direction[],
): RunReplay {
  return {
    version: 1,
    modeId,
    gridSize,
    seed,
    moves,
    createdAt: new Date().toISOString(),
  };
}
