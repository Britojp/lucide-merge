import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import type { Tile as TileData } from '@/hooks/use-game';
import { getTileColor, getTileFg, sizeForValue } from '@/constants/theme';
import type { PaletteName, Theme } from '@/constants/theme';

interface Props {
  tile: TileData;
  cellSize: number;
  gap: number;
  pad: number;
  palette: PaletteName;
  showNumbers: boolean;
  tileStyle: 'matte' | 'glass';
  theme: Theme;
  ghost?: boolean;
}

const ANIM_DURATION = 170;
const EASING = Easing.bezier(0.22, 0.61, 0.36, 1);

export function Tile({ tile, cellSize, gap, pad, palette, showNumbers, tileStyle, theme, ghost }: Props) {
  const left = tile.c * (cellSize + gap) + pad;
  const top = tile.r * (cellSize + gap) + pad;
  const bg = getTileColor(palette, tile.value);
  const fg = getTileFg(palette);
  const fontSize = sizeForValue(tile.value, cellSize);
  const borderColor = tileStyle === 'glass' ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.4)';

  const translateX = useSharedValue(left);
  const translateY = useSharedValue(top);
  const scale = useSharedValue(tile.isNew ? 0 : 1);
  const opacity = useSharedValue(tile.dying ? 1 : 1);
  const zIndex = useSharedValue(tile.dying ? 0 : tile.mergedFrom ? 20 : 10);

  useEffect(() => {
    translateX.value = withTiming(tile.c * (cellSize + gap) + pad, { duration: ANIM_DURATION, easing: EASING });
    translateY.value = withTiming(tile.r * (cellSize + gap) + pad, { duration: ANIM_DURATION, easing: EASING });
  }, [tile.r, tile.c, cellSize, gap, pad, translateX, translateY]);

  useEffect(() => {
    if (tile.isNew) {
      scale.value = withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(1.08, { duration: ANIM_DURATION + 60, easing: EASING }),
        withTiming(1, { duration: 60 })
      );
    }
  }, [tile.isNew, scale]);

  useEffect(() => {
    if (tile.mergedFrom) {
      scale.value = withSequence(
        withTiming(1.14, { duration: ANIM_DURATION + 60, easing: EASING }),
        withTiming(1, { duration: 80 })
      );
    }
  }, [tile.mergedFrom, scale]);

  useEffect(() => {
    if (tile.dying) {
      opacity.value = withTiming(0, { duration: ANIM_DURATION });
    }
    zIndex.value = tile.dying ? 0 : tile.mergedFrom ? 20 : 10;
  }, [tile.dying, tile.mergedFrom, opacity, zIndex]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
    zIndex: zIndex.value,
  }));

  if (ghost) {
    return (
      <View
        style={[
          styles.tile,
          {
            left,
            top,
            width: cellSize,
            height: cellSize,
            borderRadius: theme.radiusTile,
            backgroundColor: bg,
            opacity: 0.48,
            borderColor: theme.ink3,
            borderWidth: 2,
            borderStyle: 'dashed',
            zIndex: 4,
          },
        ]}
      >
        {showNumbers && (
          <Text style={[styles.label, { fontSize, color: fg }]} numberOfLines={1} adjustsFontSizeToFit>
            {tile.value}
          </Text>
        )}
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.tile,
        {
          width: cellSize,
          height: cellSize,
          borderRadius: theme.radiusTile,
          backgroundColor: bg,
          borderColor,
          shadowColor: '#2E2A24',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: tile.mergedFrom ? 6 : 4,
        },
        animStyle,
      ]}
    >
      {showNumbers && (
        <Text style={[styles.label, { fontSize, color: fg }]} numberOfLines={1} adjustsFontSizeToFit>
          {tile.value}
        </Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tile: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontVariant: ['tabular-nums'],
  },
});
