import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Theme } from '@/constants/theme';
import type { Direction } from '@/hooks/use-game';

const ARROW: Record<Direction, string> = {
  left: '←',
  right: '→',
  up: '↑',
  down: '↓',
};

export function GhostReplayHud({
  theme,
  visible,
  boardWidth,
  currentStep,
  totalSteps,
  targetScore,
  targetMaxTile,
  moves,
  fromIndex,
}: {
  theme: Theme;
  visible: boolean;
  boardWidth: number;
  currentStep: number;
  totalSteps: number;
  targetScore: number;
  targetMaxTile: number;
  moves: Direction[];
  fromIndex: number;
}) {
  const preview = useMemo(
    () => moves.slice(fromIndex, fromIndex + 8).map(d => ARROW[d]).join('  '),
    [moves, fromIndex],
  );
  if (!visible) return null;
  const p = totalSteps <= 0 ? 0 : Math.min(1, currentStep / totalSteps);
  const fill = Math.max(0.004, p);
  const rest = Math.max(0.004, 1 - p);

  return (
    <View style={[styles.wrap, { width: boardWidth, borderColor: theme.line, backgroundColor: theme.bg2 }]}>
      <Text style={[styles.title, { color: theme.ink2 }]}>Best run replay</Text>
      <View style={[styles.barOuter, { backgroundColor: theme.cell }]}>
        <View style={{ flex: fill, height: 6, borderRadius: 4, backgroundColor: theme.ink }} />
        <View style={{ flex: rest, height: 6, borderRadius: 4, backgroundColor: 'transparent' }} />
      </View>
      <Text style={[styles.meta, { color: theme.ink3 }]}>
        Step {currentStep}/{totalSteps} · target {targetScore.toLocaleString()} pts · max tile {targetMaxTile}
      </Text>
      {preview.length > 0 && (
        <Text style={[styles.preview, { color: theme.ink }]} numberOfLines={2}>
          {preview}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 4,
  },
  title: { fontSize: 11, fontWeight: '600', letterSpacing: 0.6 },
  barOuter: {
    flexDirection: 'row',
    borderRadius: 6,
    overflow: 'hidden',
    height: 6,
  },
  meta: { fontSize: 11, fontWeight: '400' },
  preview: { fontSize: 18, letterSpacing: 2, fontWeight: '500' },
});
