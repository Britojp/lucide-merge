import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Tile } from './Tile';
import type { BlockedCell, Tile as TileData } from '@/hooks/use-game';
import type { PaletteName, Theme, TileStyle } from '@/constants/theme';

interface Props {
  tiles: TileData[];
  ghostOverlayTiles?: TileData[];
  size: number;
  boardWidth: number;
  palette: PaletteName;
  showNumbers: boolean;
  tileStyle: TileStyle;
  theme: Theme;
  blockedCells?: BlockedCell[];
}

export function Board({
  tiles,
  ghostOverlayTiles = [],
  size,
  boardWidth,
  palette,
  showNumbers,
  tileStyle,
  theme,
  blockedCells = [],
}: Props) {
  const { pad, gap, cellSize } = useMemo(() => {
    const pad = Math.max(10, Math.round(boardWidth * 0.028));
    const gap = Math.max(8, Math.round(boardWidth * 0.022));
    const cellSize = Math.floor((boardWidth - 2 * pad - gap * (size - 1)) / size);
    return { pad, gap, cellSize };
  }, [boardWidth, size]);

  const placeholders = useMemo(() => {
    const cells = [];
    const blocked = new Set(blockedCells.map(cell => `${cell.r}:${cell.c}`));
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        cells.push({ r, c, key: `${r}-${c}`, blocked: blocked.has(`${r}:${c}`) });
      }
    }
    return cells;
  }, [size, blockedCells]);

  return (
    <View
      style={[
        styles.board,
        {
          width: boardWidth,
          height: boardWidth,
          borderRadius: theme.radiusBoard,
          backgroundColor: theme.board,
          padding: pad,
          shadowColor: '#2E2A24',
          shadowOffset: { width: 0, height: 18 },
          shadowOpacity: 0.07,
          shadowRadius: 30,
          elevation: 8,
        },
      ]}
    >
      {/* empty cell placeholders */}
      {placeholders.map(({ r, c, key, blocked }) => (
        <View
          key={key}
          style={[
            styles.cell,
            {
              width: cellSize,
              height: cellSize,
              left: c * (cellSize + gap) + pad,
              top: r * (cellSize + gap) + pad,
              borderRadius: theme.radiusTile,
              backgroundColor: blocked ? theme.ink3 : theme.cell,
              opacity: blocked ? 0.35 : 0.65,
            },
          ]}
        />
      ))}

      {ghostOverlayTiles.map(tile => (
        <Tile
          key={`ghost-${tile.id}`}
          tile={tile}
          cellSize={cellSize}
          gap={gap}
          pad={pad}
          palette={palette}
          showNumbers={showNumbers}
          tileStyle={tileStyle}
          theme={theme}
          ghost
        />
      ))}

      {tiles.map(tile => (
        <Tile
          key={tile.id}
          tile={tile}
          cellSize={cellSize}
          gap={gap}
          pad={pad}
          palette={palette}
          showNumbers={showNumbers}
          tileStyle={tileStyle}
          theme={theme}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    position: 'relative',
  },
  cell: {
    position: 'absolute',
  },
});
