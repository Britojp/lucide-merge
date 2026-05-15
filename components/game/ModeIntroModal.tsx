import React from 'react';
import { Modal, View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import type { Theme } from '@/constants/theme';
import { GAME_MODES, type GameModeId } from '@/lib/game-modes';
import { modeIntroBody } from '@/lib/mode-copy';

interface Props {
  visible: boolean;
  modeId: GameModeId | null;
  theme: Theme;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ModeIntroModal({ visible, modeId, theme, onConfirm, onCancel }: Props) {
  if (!modeId) return null;
  const meta = GAME_MODES[modeId];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.scrim} onPress={onCancel}>
        <Pressable
          style={[styles.card, { backgroundColor: theme.bg, borderColor: theme.line }]}
          onPress={() => {}}
        >
          <Text style={[styles.title, { color: theme.ink }]}>{meta.label}</Text>
          <Text style={[styles.sub, { color: theme.ink3 }]}>{meta.description}</Text>
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={[styles.p, { color: theme.ink2 }]}>{modeIntroBody(modeId)}</Text>
          </ScrollView>
          <Pressable
            onPress={onConfirm}
            style={({ pressed }) => [
              styles.primary,
              { borderColor: theme.line, backgroundColor: theme.ink, opacity: pressed ? 0.88 : 1 },
            ]}
          >
            <Text style={[styles.primaryText, { color: theme.bg }]}>Got it</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(20,16,8,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 22,
    borderWidth: 1,
    padding: 24,
    gap: 10,
  },
  title: { fontSize: 22, fontWeight: '600', letterSpacing: -0.3 },
  sub: { fontSize: 13, lineHeight: 18 },
  body: { maxHeight: 220 },
  p: { fontSize: 14, lineHeight: 22 },
  primary: {
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryText: { fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },
});
