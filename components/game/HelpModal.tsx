import React from 'react';
import { Modal, View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import type { Theme } from '@/constants/theme';
import { GAME_MODES, modeConfig, type GameModeId } from '@/lib/game-modes';
import { modeBulletSummary, modeRulesFootnote } from '@/lib/mode-copy';

interface Props {
  visible: boolean;
  theme: Theme;
  onClose: () => void;
}

export function HelpModal({ visible, theme, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose}>
        <Pressable
          style={[styles.card, { backgroundColor: theme.bg, borderColor: theme.line }]}
          onPress={() => {}}
        >
          <Text style={[styles.title, { color: theme.ink }]}>How to drift.</Text>
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={[styles.p, { color: theme.ink2 }]}>
              Swipe in any direction. All tiles slide. Two tiles with the same number merge into one.
            </Text>
            <Text style={[styles.p, { color: theme.ink2 }]}>
              Each move spawns a new tile (90% chance of 2, 10% of 4).
            </Text>
            <Text style={[styles.p, { color: theme.ink2 }]}>
              Reach <Text style={{ fontWeight: '700', color: theme.ink2 }}>2048</Text> to win — then keep going as long as you like.
            </Text>
            <Text style={[styles.p, { color: theme.ink2 }]}>
              Use undo to take back your last move. You have up to 20 undos per game.
            </Text>
            <Text style={[styles.h2, { color: theme.ink }]}>Game modes</Text>
            {(Object.keys(GAME_MODES) as GameModeId[]).map(id => {
              const cfg = modeConfig(id);
              return (
                <View key={id} style={styles.modeSection}>
                  <Text style={[styles.modeTitle, { color: theme.ink2 }]}>{GAME_MODES[id].label}</Text>
                  <Text style={[styles.modeTag, { color: theme.ink3 }]}>{modeRulesFootnote(cfg)}</Text>
                  <Text style={[styles.modeDesc, { color: theme.ink2 }]}>{GAME_MODES[id].description}</Text>
                  {modeBulletSummary(id).map((line, i) => (
                    <Text key={i} style={[styles.modeBullet, { color: theme.ink2 }]}>
                      • {line}
                    </Text>
                  ))}
                </View>
              );
            })}
            <Text style={[styles.hint, { color: theme.ink3 }]}>
              A grid of 4, 5 or 6 — choose in settings.
            </Text>
          </ScrollView>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.close,
              { borderColor: theme.line, backgroundColor: theme.bg2, opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <Text style={[styles.closeText, { color: theme.ink2 }]}>CLOSE</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(20,16,8,0.32)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 22,
    borderWidth: 1,
    padding: 26,
    gap: 14,
  },
  title: {
    fontSize: 26,
    fontFamily: 'Fraunces_400Regular',
    letterSpacing: -0.3,
  },
  body: {
    maxHeight: 420,
  },
  h2: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 6,
  },
  modeSection: {
    marginBottom: 14,
    gap: 4,
  },
  modeTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  modeTag: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  modeDesc: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  modeBullet: {
    fontSize: 12.5,
    lineHeight: 18,
    paddingLeft: 2,
  },
  p: {
    fontSize: 13.5,
    lineHeight: 21,
    marginBottom: 10,
  },
  hint: {
    fontSize: 12,
    marginBottom: 4,
  },
  close: {
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  closeText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.6,
  },
});
