export type GameModeId =
  | 'classic'
  | 'time_attack'
  | 'zen'
  | 'daily_challenge'
  | 'limited_moves'
  | 'hard';

export interface GameModeConfig {
  id: GameModeId;
  label: string;
  description: string;
  targetTile: number;
  spawnTwoChance: number;
  moveLimit: number | null;
  timeLimitMs: number | null;
  blockedCellCount: number;
  allowBoardGameOver: boolean;
}

export const GAME_MODES: Record<GameModeId, GameModeConfig> = {
  classic: {
    id: 'classic',
    label: 'Classic',
    description: 'Default Lucid Merge mode.',
    targetTile: 2048,
    spawnTwoChance: 0.9,
    moveLimit: null,
    timeLimitMs: null,
    blockedCellCount: 0,
    allowBoardGameOver: true,
  },
  time_attack: {
    id: 'time_attack',
    label: 'Time Attack',
    description: 'Race the clock to score.',
    targetTile: 2048,
    spawnTwoChance: 0.9,
    moveLimit: null,
    timeLimitMs: 120000,
    blockedCellCount: 0,
    allowBoardGameOver: true,
  },
  zen: {
    id: 'zen',
    label: 'Zen',
    description: 'No game over from a blocked board.',
    targetTile: 4096,
    spawnTwoChance: 0.9,
    moveLimit: null,
    timeLimitMs: null,
    blockedCellCount: 0,
    allowBoardGameOver: false,
  },
  daily_challenge: {
    id: 'daily_challenge',
    label: 'Daily',
    description: 'Daily challenge with a fixed seed.',
    targetTile: 2048,
    spawnTwoChance: 0.85,
    moveLimit: 160,
    timeLimitMs: null,
    blockedCellCount: 1,
    allowBoardGameOver: true,
  },
  limited_moves: {
    id: 'limited_moves',
    label: 'Moves',
    description: 'Score as much as you can with limited moves.',
    targetTile: 2048,
    spawnTwoChance: 0.9,
    moveLimit: 120,
    timeLimitMs: null,
    blockedCellCount: 0,
    allowBoardGameOver: true,
  },
  hard: {
    id: 'hard',
    label: 'Hard',
    description: 'Harsher spawns and fixed blocked cells.',
    targetTile: 2048,
    spawnTwoChance: 0.7,
    moveLimit: null,
    timeLimitMs: null,
    blockedCellCount: 2,
    allowBoardGameOver: true,
  },
};

export function modeHasTimeLimit(config: GameModeConfig): boolean {
  return config.timeLimitMs != null;
}

export function modeConfig(modeId: GameModeId): GameModeConfig {
  return GAME_MODES[modeId];
}

export function seedForMode(modeId: GameModeId): string {
  if (modeId === 'daily_challenge') {
    return new Date().toISOString().slice(0, 10);
  }
  return `${modeId}-${Date.now()}`;
}
