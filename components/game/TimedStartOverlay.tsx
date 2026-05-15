import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { Theme } from '@/constants/theme';

interface Props {
  theme: Theme;
  onStart: () => void;
}

export function TimedStartOverlay({ theme, onStart }: Props) {
  const bg =
    theme.bg === '#F5F3EF'
      ? 'rgba(245,243,239,0.82)'
      : 'rgba(31,28,22,0.82)';

  return (
    <View
      style={[
        StyleSheet.absoluteFillObject,
        {
          borderRadius: theme.radiusBoard,
          backgroundColor: bg,
          zIndex: 22,
          justifyContent: 'center',
          alignItems: 'center',
        },
      ]}
    >
      <Pressable
        onPress={onStart}
        style={({ pressed }) => [
          styles.btn,
          {
            borderColor: theme.line,
            backgroundColor: theme.bg2,
            opacity: pressed ? 0.88 : 1,
          },
        ]}
      >
        <Text style={[styles.btnText, { color: theme.ink }]}>START</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 18,
    borderWidth: 1,
  },
  btnText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 2,
  },
});
