import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GridSize } from '@/constants/theme';
import type { GameModeConfig, GameModeId } from '@/lib/game-modes';
import { modeConfig, seedForMode } from '@/lib/game-modes';

export interface Tile {
  id: number;
  value: number;
  r: number;
  c: number;
  mergedFrom?: boolean;
  isNew?: boolean;
  dying?: boolean;
}

export interface BlockedCell {
  r: number;
  c: number;
}

export type Direction = 'left' | 'right' | 'up' | 'down';

export type EndReason = 'board' | 'timer' | 'moves' | null;

export interface GameState {
  tiles: Tile[];
  blockedCells: BlockedCell[];
  score: number;
  best: number;
  won: boolean;
  keepGoing: boolean;
  over: boolean;
  size: GridSize;
  animating: boolean;
  modeId: GameModeId;
  movesUsed: number;
  movesRemaining: number | null;
  replayMoves: Direction[];
  maxTile: number;
  runSeed: string;
  endedBy: EndReason;
}

interface MoveSnapshot {
  tiles: Tile[];
  score: number;
  won: boolean;
  over: boolean;
  movesUsed: number;
  movesRemaining: number | null;
  replayMoves: Direction[];
  endedBy: EndReason;
  maxTile: number;
}

interface UseGameOptions {
  modeId: GameModeId;
  modeRules?: GameModeConfig;
  seed?: string;
}

let nextId = 1;

function makeId() {
  return nextId++;
}

function keyOf(r: number, c: number): string {
  return `${r}:${c}`;
}

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
    x += 0x6D2B79F5;
    let t = x;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
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
    const key = keyOf(r, c);
    if (picks.has(key)) continue;
    picks.add(key);
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
  count = 1,
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
    result.push({ id: makeId(), value, r, c, isNew: true });
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

function canMove(tiles: Tile[], n: number, blockedSet: Set<string>): boolean {
  const grid = tilesToGrid(tiles, n);
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (blockedSet.has(keyOf(r, c))) continue;
      if (!grid[r][c]) return true;
      if (
        r + 1 < n &&
        !blockedSet.has(keyOf(r + 1, c)) &&
        grid[r + 1][c]?.value === grid[r][c]?.value
      ) return true;
      if (
        c + 1 < n &&
        !blockedSet.has(keyOf(r, c + 1)) &&
        grid[r][c + 1]?.value === grid[r][c]?.value
      ) return true;
    }
  }
  return false;
}

function initState(size: GridSize, best: number, modeRules: GameModeConfig, runSeed: string): GameState {
  const rng = createRng(runSeed);
  const blockedCells = chooseBlockedCells(size, modeRules.blockedCellCount, rng);
  const blockedSet = new Set(blockedCells.map(cell => keyOf(cell.r, cell.c)));
  return {
    tiles: placeRandom([], size, blockedSet, modeRules.spawnTwoChance, rng, 2),
    blockedCells,
    score: 0,
    best,
    won: false,
    keepGoing: false,
    over: false,
    size,
    animating: false,
    modeId: modeRules.id,
    movesUsed: 0,
    movesRemaining: modeRules.moveLimit,
    replayMoves: [],
    maxTile: 0,
    runSeed,
    endedBy: null,
  };
}

function bestKey(size: GridSize, modeId: GameModeId): string {
  return `lucid.best.${modeId}.${size}`;
}

const SETTLE_MS = 180;
const CLEAR_MS = 180;

export function useGame(size: GridSize, options: UseGameOptions) {
  const modeRules = options.modeRules ?? modeConfig(options.modeId);
  const initialSeed = options.seed ?? seedForMode(modeRules.id);
  const [state, setState] = useState<GameState>(() => initState(size, 0, modeRules, initialSeed));
  const history = useRef<MoveSnapshot[]>([]);
  const lockRef = useRef(false);
  const prevSizeRef = useRef(size);
  const prevModeRef = useRef(modeRules.id);
  const prevSeedRef = useRef(initialSeed);

  const resetState = useCallback((nextSize: GridSize, best = 0) => {
    const seed = options.seed ?? seedForMode(modeRules.id);
    prevSeedRef.current = seed;
    return initState(nextSize, best, modeRules, seed);
  }, [modeRules, options.seed]);

  useEffect(() => {
    const changed = prevSizeRef.current !== size || prevModeRef.current !== modeRules.id;
    prevSizeRef.current = size;
    prevModeRef.current = modeRules.id;
    if (changed) {
      lockRef.current = false;
      history.current = [];
      setState(() => resetState(size, 0));
    }

    AsyncStorage.getItem(bestKey(size, modeRules.id)).then(v => {
      const best = parseInt(v ?? '0', 10) || 0;
      setState(s => {
        if (s.size !== size || s.modeId !== modeRules.id) return s;
        return { ...s, best: Math.max(s.best, best) };
      });
    });
  }, [size, modeRules.id, resetState]);

  useEffect(() => {
    if (!options.seed) return;
    if (prevSeedRef.current === options.seed) return;
    prevSeedRef.current = options.seed;
    lockRef.current = false;
    history.current = [];
    setState(s => initState(s.size, s.best, modeRules, options.seed!));
  }, [options.seed, modeRules]);

  const saveBest = useCallback((score: number, prev: number) => {
    if (score > prev) AsyncStorage.setItem(bestKey(size, modeRules.id), String(score));
  }, [modeRules.id, size]);

  const move = useCallback((dir: Direction) => {
    if (lockRef.current) return;
    setState(s => {
      if (s.animating || s.over || (s.won && !s.keepGoing)) return s;

      const blockedSet = new Set(s.blockedCells.map(cell => keyOf(cell.r, cell.c)));
      const liveTiles = s.tiles.filter(t => !t.dying);
      const { tiles, gained, changed } = moveBoard(liveTiles, dir, s.size, blockedSet);
      if (!changed) return s;

      history.current = [{
        tiles: liveTiles,
        score: s.score,
        won: s.won,
        over: s.over,
        movesUsed: s.movesUsed,
        movesRemaining: s.movesRemaining,
        replayMoves: s.replayMoves,
        endedBy: s.endedBy,
        maxTile: s.maxTile,
      }, ...history.current].slice(0, 40);

      const newScore = s.score + gained;
      const newBest = Math.max(s.best, newScore);
      saveBest(newScore, s.best);

      lockRef.current = true;
      return {
        ...s,
        tiles,
        score: newScore,
        best: newBest,
        animating: true,
        movesUsed: s.movesUsed + 1,
        movesRemaining: s.movesRemaining == null ? null : Math.max(0, s.movesRemaining - 1),
        replayMoves: [...s.replayMoves, dir],
      };
    });

    setTimeout(() => {
      setState(s => {
        if (s.over) return s;
        const rng = createRng(`${s.runSeed}:${s.movesUsed}:${s.score}`);
        const blockedSet = new Set(s.blockedCells.map(cell => keyOf(cell.r, cell.c)));
        const settled = placeRandom(
          s.tiles.filter(t => !t.dying),
          s.size,
          blockedSet,
          modeRules.spawnTwoChance,
          rng,
          1,
        );
        const hasWon = !s.won && !s.keepGoing && settled.some(t => t.value >= modeRules.targetTile);
        const boardStuck = !canMove(settled.filter(t => !t.dying), s.size, blockedSet);
        const exhaustedMoves = s.movesRemaining === 0;
        const overByBoard = modeRules.allowBoardGameOver && boardStuck;
        const over = exhaustedMoves || overByBoard;
        const endedBy: EndReason =
          exhaustedMoves ? 'moves' : overByBoard ? 'board' : null;
        return {
          ...s,
          tiles: settled,
          won: s.won || hasWon,
          over,
          endedBy,
          maxTile: Math.max(s.maxTile, highestTile(settled)),
          animating: true,
        };
      });
    }, SETTLE_MS);

    setTimeout(() => {
      setState(s => ({
        ...s,
        tiles: s.tiles.map(t => ({ ...t, mergedFrom: false, isNew: false })).filter(t => !t.dying),
        animating: false,
      }));
      lockRef.current = false;
    }, SETTLE_MS + CLEAR_MS);
  }, [modeRules, saveBest]);

  const undo = useCallback(() => {
    if (lockRef.current || history.current.length === 0) return;
    setState(s => {
      const prev = history.current.shift();
      if (!prev) return s;
      return {
        ...s,
        tiles: prev.tiles,
        score: prev.score,
        won: prev.won,
        over: prev.over,
        movesUsed: prev.movesUsed,
        movesRemaining: prev.movesRemaining,
        replayMoves: prev.replayMoves,
        endedBy: prev.endedBy,
        maxTile: prev.maxTile,
      };
    });
  }, []);

  const reset = useCallback(() => {
    lockRef.current = false;
    history.current = [];
    setState(s => initState(s.size, s.best, modeRules, options.seed ?? seedForMode(modeRules.id)));
  }, [modeRules, options.seed]);

  const continueGame = useCallback(() => {
    setState(s => ({ ...s, keepGoing: true }));
  }, []);

  const setBest = useCallback((newBest: number) => {
    setState(s => {
      if (newBest <= s.best) return s;
      AsyncStorage.setItem(bestKey(size, modeRules.id), String(newBest));
      return { ...s, best: newBest };
    });
  }, [modeRules.id, size]);

  const setTimerExpired = useCallback(() => {
    setState(s => {
      if (s.over) return s;
      return { ...s, over: true, endedBy: 'timer' };
    });
  }, []);

  return { state, move, undo, reset, continueGame, setBest, setTimerExpired };
}
