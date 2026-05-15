import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Tile, BlockedCell } from '@/hooks/use-game';
import type { Theme, PaletteName, TileStyle } from '@/constants/theme';
import { getTileColor, getTileFg, sizeForValue } from '@/constants/theme';

interface Props {
  tiles: Tile[];
  blockedCells: BlockedCell[];
  size: number;
  boardWidth: number;
  palette: PaletteName;
  showNumbers: boolean;
  tileStyle: TileStyle;
  theme: Theme;
}

export function ShareBoardSnapshot({
  tiles,
  blockedCells,
  size,
  boardWidth,
  palette,
  showNumbers,
  tileStyle,
  theme,
}: Props) {
  const { pad, gap, cellSize } = useMemo(() => {
    const p = Math.max(10, Math.round(boardWidth * 0.028));
    const g = Math.max(8, Math.round(boardWidth * 0.022));
    const cs = Math.floor((boardWidth - 2 * p - g * (size - 1)) / size);
    return { pad: p, gap: g, cellSize: cs };
  }, [boardWidth, size]);

  const blocked = useMemo(
    () => new Set(blockedCells.map(c => `${c.r}:${c.c}`)),
    [blockedCells],
  );

  const placeholders = useMemo(() => {
    const cells: { r: number; c: number; key: string; blockedCell: boolean }[] = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        cells.push({
          r,
          c,
          key: `${r}-${c}`,
          blockedCell: blocked.has(`${r}:${c}`),
        });
      }
    }
    return cells;
  }, [size, blocked]);

  const visibleTiles = useMemo(() => tiles.filter(t => !t.dying), [tiles]);

  const tileBorder =
    tileStyle === 'glass' ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.4)';

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
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.08,
          shadowRadius: 18,
          elevation: 6,
        },
      ]}
    >
      {placeholders.map(({ r, c, key, blockedCell }) => (
        <View
          key={key}
          style={[
            styles.abs,
            {
              width: cellSize,
              height: cellSize,
              left: c * (cellSize + gap) + pad,
              top: r * (cellSize + gap) + pad,
              borderRadius: theme.radiusTile,
              backgroundColor: blockedCell ? theme.ink3 : theme.cell,
              opacity: blockedCell ? 0.35 : 0.65,
            },
          ]}
        />
      ))}
      {visibleTiles.map(tile => {
        const fontSize = sizeForValue(tile.value, cellSize);
        const left = tile.c * (cellSize + gap) + pad;
        const top = tile.r * (cellSize + gap) + pad;
        return (
          <View
            key={tile.id}
            style={[
              styles.tile,
              {
                left,
                top,
                width: cellSize,
                height: cellSize,
                borderRadius: theme.radiusTile,
                backgroundColor: getTileColor(palette, tile.value),
                borderColor: tileBorder,
                zIndex: 10,
              },
            ]}
          >
            {showNumbers ? (
              <Text
                style={[
                  styles.tileNum,
                  { fontSize, color: getTileFg(palette) },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {tile.value}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    position: 'relative',
  },
  abs: {
    position: 'absolute',
  },
  tile: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  tileNum: {
    fontFamily: 'Inter_600SemiBold',
    fontVariant: ['tabular-nums'],
  },
});
