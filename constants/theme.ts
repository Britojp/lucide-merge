export const LightTheme = {
  bg: '#F5F3EF',
  bg2: '#ECE7E1',
  board: '#E4DDD6',
  cell: '#DCD4CB',
  ink: '#2E2A24',
  ink2: '#6B645B',
  ink3: '#A39B91',
  accent: '#8C8378',
  line: 'rgba(46,42,36,0.08)',
  tileShadow: '0 8px 24px rgba(46,42,36,0.06)',
  boardShadow: '0 18px 60px rgba(46,42,36,0.06)',
  radiusTile: 22,
  radiusBoard: 28,
  radiusBtn: 18,
} as const;

export const DimTheme = {
  bg: '#1F1C16',
  bg2: '#26221B',
  board: '#2A251D',
  cell: '#322C23',
  ink: '#EFE9DF',
  ink2: '#B7AE9E',
  ink3: '#7B7264',
  accent: '#8C8378',
  line: 'rgba(255,255,255,0.05)',
  tileShadow: '0 10px 28px rgba(0,0,0,0.35)',
  boardShadow: '0 24px 80px rgba(0,0,0,0.4)',
  radiusTile: 22,
  radiusBoard: 28,
  radiusBtn: 18,
} as const;

export interface Theme {
  bg: string;
  bg2: string;
  board: string;
  cell: string;
  ink: string;
  ink2: string;
  ink3: string;
  accent: string;
  line: string;
  tileShadow: string;
  boardShadow: string;
  radiusTile: number;
  radiusBoard: number;
  radiusBtn: number;
}

// Legacy compat
export const Colors = {
  light: { text: '#2E2A24', background: '#F5F3EF', tint: '#8C8378', icon: '#6B645B', tabIconDefault: '#A39B91', tabIconSelected: '#8C8378' },
  dark: { text: '#EFE9DF', background: '#1F1C16', tint: '#B7AE9E', icon: '#B7AE9E', tabIconDefault: '#7B7264', tabIconSelected: '#B7AE9E' },
};

export const Palettes = {
  pastel: {
    fg: '#3A352D',
    tiles: {
      2: '#A8DADC', 4: '#B8C0FF', 8: '#CDB4DB', 16: '#FFC8DD',
      32: '#FFD6A5', 64: '#FDFFB6', 128: '#CAFFBF', 256: '#9BF6FF',
      512: '#BDB2FF', 1024: '#FFC6FF', 2048: '#FFADAD', 4096: '#FFB5A7',
    },
  },
  sand: {
    fg: '#3A352D',
    tiles: {
      2: '#EFE7DA', 4: '#E4D8C4', 8: '#D7C5A6', 16: '#C9B187',
      32: '#BFA071', 64: '#B08D5B', 128: '#9D7A48', 256: '#896839',
      512: '#74562C', 1024: '#5E4422', 2048: '#48331A', 4096: '#33240F',
    },
  },
  mist: {
    fg: '#2C3340',
    tiles: {
      2: '#E6ECF1', 4: '#D2DCE6', 8: '#BCCBD9', 16: '#A6B8CB',
      32: '#90A6BE', 64: '#7993B0', 128: '#6280A2', 256: '#536F8E',
      512: '#465E78', 1024: '#3B4F65', 2048: '#314253', 4096: '#293743',
    },
  },
  bloom: {
    fg: '#3A2C36',
    tiles: {
      2: '#FCEEF5', 4: '#F8D7E6', 8: '#F2BBD2', 16: '#EB9CBC',
      32: '#E07FA8', 64: '#D26597', 128: '#BC5188', 256: '#A14279',
      512: '#86376A', 1024: '#6C2E5A', 2048: '#54264A', 4096: '#3F1E3B',
    },
  },
} as const;

export type PaletteName = keyof typeof Palettes;
export type ThemeName = 'light' | 'dim';
export type TileStyle = 'matte' | 'glass';
export type GridSize = 4 | 5 | 6;

export function getTileColor(palette: PaletteName, value: number): string {
  const p = Palettes[palette];
  const capped = Math.min(4096, value) as keyof typeof p.tiles;
  return p.tiles[capped] ?? '#E4DDD6';
}

export function getTileFg(palette: PaletteName): string {
  return Palettes[palette].fg;
}

export function getTheme(name: ThemeName): Theme {
  return name === 'dim' ? DimTheme : LightTheme;
}

export function sizeForValue(value: number, cellSize: number): number {
  const base = Math.max(18, cellSize * 0.42);
  if (value < 100) return base;
  if (value < 1000) return base * 0.82;
  if (value < 10000) return base * 0.66;
  return base * 0.55;
}
