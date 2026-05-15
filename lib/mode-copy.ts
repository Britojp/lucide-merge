import {
  modeConfig,
  modeHasTimeLimit,
  type GameModeConfig,
  type GameModeId,
} from '@/lib/game-modes';

function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}:${String(r).padStart(2, '0')}` : `${r}s`;
}

export function modeBulletSummary(modeId: GameModeId): string[] {
  const config = modeConfig(modeId);
  const spawnPct = Math.round(config.spawnTwoChance * 100);
  switch (modeId) {
    case 'classic':
      return [
        `Standard spawns (${spawnPct}% twos).`,
        `Reach ${config.targetTile} to win, then keep playing if you like.`,
        'Game over when no moves remain.',
      ];
    case 'time_attack':
      return [
        `After you tap START, you have ${formatMs(config.timeLimitMs!)}.`,
        'The timer pauses until START — then every swipe counts.',
        'Push for the highest score before time runs out.',
      ];
    case 'zen':
      return [
        `Win target is ${config.targetTile}.`,
        'You do not lose from a completely blocked board.',
        'Otherwise normal merges and spawns.',
      ];
    case 'daily_challenge': {
      const blocked =
        config.blockedCellCount === 1
          ? 'one blocked cell'
          : `${config.blockedCellCount} blocked cells`;
      return [
        'Same seed for everyone on a given calendar day.',
        `You have ${config.moveLimit!} moves and ${blocked}.`,
        `Spawns: about ${spawnPct}% twos.`,
      ];
    }
    case 'limited_moves':
      return [
        `You have exactly ${config.moveLimit!} moves.`,
        'Maximize score before you run out.',
        `Spawns: about ${spawnPct}% twos.`,
      ];
    case 'hard':
      return [
        `Tougher spawns (~${spawnPct}% twos).`,
        `${config.blockedCellCount} blocked cells on the grid.`,
        `Still reach ${config.targetTile} to win.`,
      ];
    default:
      return [];
  }
}

export function modeIntroBody(modeId: GameModeId): string {
  return modeBulletSummary(modeId).map(line => `• ${line}`).join('\n');
}

export function modeRulesFootnote(config: GameModeConfig): string {
  const parts: string[] = [];
  parts.push(`Goal ${config.targetTile}`);
  if (modeHasTimeLimit(config)) parts.push(`Time ${formatMs(config.timeLimitMs!)} · START`);
  if (config.moveLimit != null) parts.push(`${config.moveLimit} moves`);
  if (config.blockedCellCount > 0) {
    parts.push(`${config.blockedCellCount} blocked`);
  }
  if (!config.allowBoardGameOver) parts.push('No board lock-out');
  if (config.spawnTwoChance <= 0.75) parts.push('Harder spawns');
  if (config.id === 'daily_challenge') parts.push('Daily seed');
  return parts.join(' · ');
}
