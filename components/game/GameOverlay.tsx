import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { Theme } from '@/constants/theme';

interface Props {
  type: 'won' | 'over';
  theme: Theme;
  endedBy?: 'board' | 'timer' | 'moves' | null;
  onContinue?: () => void;
  onRestart: () => void;
  onWatchBestRun?: () => void;
}

export function GameOverlay({
  type,
  theme,
  endedBy,
  onContinue,
  onRestart,
  onWatchBestRun,
}: Props) {
  const isWon = type === 'won';
  const bg = theme.bg === '#F5F3EF'
    ? 'rgba(245,243,239,0.85)'
    : 'rgba(31,28,22,0.85)';
  const subtitle = isWon
    ? 'You reached the bloom.'
    : endedBy === 'timer'
      ? "Time's up. Keep calm, try again."
      : endedBy === 'moves'
        ? 'No moves left in this challenge.'
        : 'No moves left. Breathe, restart.';

  return (
    <View style={[styles.overlay, { backgroundColor: bg }]}>
      <Text style={[styles.title, { color: theme.ink }]}>
        {isWon ? 'Lucid.' : 'Hush.'}
      </Text>
      <Text style={[styles.subtitle, { color: theme.ink2 }]}>
        {subtitle}
      </Text>
      <View style={styles.actions}>
        {isWon && onContinue && (
          <Pressable
            onPress={onContinue}
            style={({ pressed }) => [
              styles.btn,
              { borderColor: theme.line, backgroundColor: theme.bg2, opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <Text style={[styles.btnText, { color: theme.ink2 }]}>KEEP GOING</Text>
          </Pressable>
        )}
        <Pressable
          onPress={onRestart}
          style={({ pressed }) => [
            styles.btn,
            { borderColor: theme.line, backgroundColor: theme.bg2, opacity: pressed ? 0.75 : 1 },
          ]}
        >
          <Text style={[styles.btnText, { color: theme.ink2 }]}>NEW GAME</Text>
        </Pressable>
        {onWatchBestRun && (
          <Pressable
            onPress={onWatchBestRun}
            style={({ pressed }) => [
              styles.btn,
              { borderColor: theme.line, backgroundColor: theme.bg2, opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <Text style={[styles.btnText, { color: theme.ink2 }]}>WATCH BEST RUN</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    zIndex: 30,
  },
  title: {
    fontSize: 44,
    fontFamily: 'Fraunces_400Regular',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
  },
  btnText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.6,
  },
});
