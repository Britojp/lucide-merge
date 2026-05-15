import type { GridSize } from '@/constants/theme';
import type { GameModeConfig } from '@/lib/game-modes';
import type { Tile, BlockedCell, Direction } from '@/hooks/use-game';

type SimState = {
  tiles: Tile[];
  blockedCells: BlockedCell[];
  score: number;
  movesUsed: number;
  maxTile: number;
  size: GridSize;
  runSeed: string;
};

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function createRng(seed: string): () => number {
  let x = hashSeed(seed);
  return () => {
    x += 0x6d2b79f5;
    let t = x;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function keyOf(r: number, c: number): string {
  return `${r}:${c}`;
}

function emptyGrid(n: number): (Tile | null)[][] {
  return Array.from({ length: n }, () => Array(n).fill(null));
}

function tilesToGrid(tiles: Tile[], n: number): (Tile | null)[][] {
  const g = emptyGrid(n);
  for (const t of tiles) {
    if (!t.dying) g[t.r][t.c] = t;
  }
  return g;
}

function highestTile(tiles: Tile[]): number {
  if (tiles.length === 0) return 0;
  return tiles.reduce((acc, t) => Math.max(acc, t.value), 0);
}

function chooseBlockedCells(size: number, count: number, rng: () => number): BlockedCell[] {
  if (count <= 0) return [];
  const cells: BlockedCell[] = [];
  const picks = new Set<string>();
  while (cells.length < count && picks.size < size * size - 2) {
    const r = Math.floor(rng() * size);
    const c = Math.floor(rng() * size);
    const k = keyOf(r, c);
    if (picks.has(k)) continue;
    picks.add(k);
    cells.push({ r, c });
  }
  return cells;
}

function placeRandom(
  tiles: Tile[],
  n: number,
  blockedSet: Set<string>,
  spawnTwoChance: number,
  rng: () => number,
  count: number,
  nextId: { v: number },
): Tile[] {
  const grid = tilesToGrid(tiles, n);
  const empty: [number, number][] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (blockedSet.has(keyOf(r, c))) continue;
      if (!grid[r][c]) empty.push([r, c]);
    }
  }
  const result = [...tiles];
  for (let i = 0; i < count && empty.length > 0; i++) {
    const idx = Math.floor(rng() * empty.length);
    const [r, c] = empty.splice(idx, 1)[0];
    const value = rng() < spawnTwoChance ? 2 : 4;
    nextId.v -= 1;
    result.push({ id: nextId.v, value, r, c, isNew: true });
  }
  return result;
}

function slideRow(row: (Tile | null)[]): { row: (Tile | null)[]; dying: Tile[]; gained: number } {
  const cells = row.filter(Boolean) as Tile[];
  const out: (Tile | null)[] = [];
  const dying: Tile[] = [];
  let gained = 0;
  let i = 0;
  while (i < cells.length) {
    if (i + 1 < cells.length && cells[i].value === cells[i + 1].value) {
      const val = cells[i].value * 2;
      gained += val;
      dying.push({ ...cells[i + 1], dying: true });
      out.push({ ...cells[i], value: val, mergedFrom: true });
      i += 2;
    } else {
      out.push(cells[i]);
      i++;
    }
  }
  while (out.length < row.length) out.push(null);
  return { row: out, dying, gained };
}

function slideRowWithBlocks(
  row: (Tile | null)[],
  blocked: boolean[],
): { row: (Tile | null)[]; dying: Tile[]; gained: number } {
  const output: (Tile | null)[] = Array(row.length).fill(null);
  const dying: Tile[] = [];
  let gained = 0;
  let start = 0;
  while (start < row.length) {
    while (start < row.length && blocked[start]) start++;
    if (start >= row.length) break;
    let end = start;
    while (end < row.length && !blocked[end]) end++;
    const section = row.slice(start, end);
    const slid = slideRow(section);
    for (let i = 0; i < slid.row.length; i++) {
      output[start + i] = slid.row[i];
    }
    dying.push(...slid.dying);
    gained += slid.gained;
    start = end;
  }
  return { row: output, dying, gained };
}

function moveBoard(
  tiles: Tile[],
  dir: Direction,
  n: number,
  blockedSet: Set<string>,
): { tiles: Tile[]; gained: number; changed: boolean } {
  const grid = tilesToGrid(tiles, n);
  let gained = 0;
  let changed = false;
  const dying: Tile[] = [];

  const process = (
    extractRow: (r: number) => (Tile | null)[],
    blockedMask: (r: number) => boolean[],
    placeRow: (r: number, row: (Tile | null)[]) => void,
  ) => {
    for (let i = 0; i < n; i++) {
      const row = extractRow(i);
      const blocked = blockedMask(i);
      const res = slideRowWithBlocks(row, blocked);
      dying.push(...res.dying);
      gained += res.gained;
      if (!changed) {
        for (let j = 0; j < n; j++) {
          if (blocked[j]) continue;
          const a = row[j];
          const b = res.row[j];
          if ((a?.id ?? -1) !== (b?.id ?? -1) || (a?.value ?? 0) !== (b?.value ?? 0)) {
            changed = true;
            break;
          }
        }
      }
      placeRow(i, res.row);
    }
  };

  if (dir === 'left') {
    process(
      r => grid[r],
      r => Array.from({ length: n }, (_, c) => blockedSet.has(keyOf(r, c))),
      (r, row) => {
        row.forEach((t, c) => {
          if (blockedSet.has(keyOf(r, c))) {
            grid[r][c] = null;
            return;
          }
          grid[r][c] = t ? { ...t, r, c } : null;
        });
      },
    );
  } else if (dir === 'right') {
    process(
      r => [...grid[r]].reverse(),
      r => Array.from({ length: n }, (_, c) => blockedSet.has(keyOf(r, n - 1 - c))),
      (r, row) => {
        row.reverse().forEach((t, c) => {
          if (blockedSet.has(keyOf(r, c))) {
            grid[r][c] = null;
            return;
          }
          grid[r][c] = t ? { ...t, r, c } : null;
        });
      },
    );
  } else if (dir === 'up') {
    process(
      c => grid.map(row => row[c]),
      c => Array.from({ length: n }, (_, r) => blockedSet.has(keyOf(r, c))),
      (c, col) => {
        col.forEach((t, r) => {
          if (blockedSet.has(keyOf(r, c))) {
            grid[r][c] = null;
            return;
          }
          grid[r][c] = t ? { ...t, r, c } : null;
        });
      },
    );
  } else {
    process(
      c => grid.map(row => row[c]).reverse(),
      c => Array.from({ length: n }, (_, r) => blockedSet.has(keyOf(n - 1 - r, c))),
      (c, col) => {
        col.reverse().forEach((t, r) => {
          if (blockedSet.has(keyOf(r, c))) {
            grid[r][c] = null;
            return;
          }
          grid[r][c] = t ? { ...t, r, c } : null;
        });
      },
    );
  }

  const live = grid.flat().filter(Boolean) as Tile[];
  return { tiles: [...live, ...dying], gained, changed };
}

function simInit(size: GridSize, modeRules: GameModeConfig, runSeed: string): SimState {
  const rng = createRng(runSeed);
  const blockedCells = chooseBlockedCells(size, modeRules.blockedCellCount, rng);
  const blockedSet = new Set(blockedCells.map(cell => keyOf(cell.r, cell.c)));
  const nextId = { v: 0 };
  const tiles = placeRandom([], size, blockedSet, modeRules.spawnTwoChance, rng, 2, nextId);
  return {
    tiles,
    blockedCells,
    score: 0,
    movesUsed: 0,
    maxTile: 0,
    size,
    runSeed,
  };
}

function applyFullMove(s: SimState, dir: Direction, modeRules: GameModeConfig, nextId: { v: number }): SimState | null {
  const blockedSet = new Set(s.blockedCells.map(cell => keyOf(cell.r, cell.c)));
  const liveTiles = s.tiles.filter(t => !t.dying);
  const { tiles, gained, changed } = moveBoard(liveTiles, dir, s.size, blockedSet);
  if (!changed) return null;
  const newScore = s.score + gained;
  const newMovesUsed = s.movesUsed + 1;
  const rng = createRng(`${s.runSeed}:${newMovesUsed}:${newScore}`);
  const settled = placeRandom(
    tiles.filter(t => !t.dying),
    s.size,
    blockedSet,
    modeRules.spawnTwoChance,
    rng,
    1,
    nextId,
  );
  const cleaned = settled.map(t => ({ ...t, mergedFrom: false, isNew: false })).filter(t => !t.dying);
  const maxTile = Math.max(s.maxTile, highestTile(cleaned));
  return {
    ...s,
    tiles: cleaned,
    score: newScore,
    movesUsed: newMovesUsed,
    maxTile,
  };
}

export function simulateAfterMoveSteps(
  size: GridSize,
  modeRules: GameModeConfig,
  runSeed: string,
  moves: Direction[],
  stepsCompleted: number,
): { tiles: Tile[]; blockedCells: BlockedCell[] } {
  const nextId = { v: 0 };
  let s: SimState = simInit(size, modeRules, runSeed);
  const n = Math.min(Math.max(0, stepsCompleted), moves.length);
  for (let i = 0; i < n; i++) {
    const next = applyFullMove(s, moves[i], modeRules, nextId);
    if (!next) break;
    s = next;
  }
  return { tiles: s.tiles.filter(t => !t.dying), blockedCells: s.blockedCells };
}

export function ghostDiffOneMoveAhead(
  size: GridSize,
  modeRules: GameModeConfig,
  runSeed: string,
  fullMoves: Direction[],
  currentCompletedMoves: number,
): Tile[] {
  const base = simulateAfterMoveSteps(size, modeRules, runSeed, fullMoves, currentCompletedMoves);
  const ahead = simulateAfterMoveSteps(size, modeRules, runSeed, fullMoves, currentCompletedMoves + 1);
  const liveMap = new Map(base.tiles.map(t => [`${t.r}:${t.c}`, t.value]));
  return ahead.tiles
    .filter(g => liveMap.get(`${g.r}:${g.c}`) !== g.value)
    .map((g, i) => ({ ...g, id: -3000 - i }));
}
