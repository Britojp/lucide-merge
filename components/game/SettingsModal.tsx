import React, { useEffect, useState, useCallback } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PaletteName, ThemeName, TileStyle, GridSize } from '@/constants/theme';
import { useSettings } from '@/contexts/SettingsContext';
import { ModeIntroModal } from '@/components/game/ModeIntroModal';
import { GAME_MODES, modeConfig, type GameModeId } from '@/lib/game-modes';
import { modeRulesFootnote } from '@/lib/mode-copy';

interface Props {
  visible: boolean;
  onClose: () => void;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  const { theme } = useSettings();
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: theme.ink3 }]}>{label}</Text>
      <View style={styles.chips}>{children}</View>
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { theme } = useSettings();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active ? theme.ink : theme.bg2,
          borderColor: theme.line,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Text style={[styles.chipText, { color: active ? theme.bg : theme.ink2 }]}>{label}</Text>
    </Pressable>
  );
}

const MODE_INTRO_STORAGE_KEY = 'lucid.seen-mode-intros';

function isGameModeId(x: unknown): x is GameModeId {
  return typeof x === 'string' && x in GAME_MODES;
}

export function SettingsModal({ visible, onClose }: Props) {
  const { settings, theme, updateSettings } = useSettings();
  const [seenIntroModes, setSeenIntroModes] = useState<GameModeId[]>([]);
  const [introLoadDone, setIntroLoadDone] = useState(false);
  const [pendingIntroModeId, setPendingIntroModeId] = useState<GameModeId | null>(null);

  useEffect(() => {
    if (!visible) {
      setIntroLoadDone(false);
      setPendingIntroModeId(null);
      return;
    }
    let cancelled = false;
    AsyncStorage.getItem(MODE_INTRO_STORAGE_KEY).then(raw => {
      if (cancelled) return;
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as unknown;
          if (Array.isArray(parsed)) {
            setSeenIntroModes(parsed.filter(isGameModeId));
          } else {
            setSeenIntroModes([]);
          }
        } catch {
          setSeenIntroModes([]);
        }
      } else {
        setSeenIntroModes([]);
      }
      setIntroLoadDone(true);
    });
    return () => {
      cancelled = true;
    };
  }, [visible]);

  const persistSeenIntros = useCallback((next: GameModeId[]) => {
    setSeenIntroModes(next);
    AsyncStorage.setItem(MODE_INTRO_STORAGE_KEY, JSON.stringify(next));
  }, []);

  const handlePickMode = useCallback(
    (modeId: GameModeId) => {
      if (!introLoadDone || modeId === settings.modeId) return;
      if (seenIntroModes.includes(modeId)) {
        updateSettings({ modeId });
        return;
      }
      setPendingIntroModeId(modeId);
    },
    [introLoadDone, settings.modeId, seenIntroModes, updateSettings],
  );

  const handleIntroConfirm = useCallback(() => {
    if (!pendingIntroModeId) return;
    const id = pendingIntroModeId;
    const nextSeen = seenIntroModes.includes(id) ? seenIntroModes : [...seenIntroModes, id];
    persistSeenIntros(nextSeen);
    updateSettings({ modeId: id });
    setPendingIntroModeId(null);
  }, [pendingIntroModeId, seenIntroModes, persistSeenIntros, updateSettings]);

  const handleIntroCancel = useCallback(() => {
    setPendingIntroModeId(null);
  }, []);

  const activeModeRules = modeConfig(settings.modeId);
  const modeHint = modeRulesFootnote(activeModeRules);

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <Pressable style={styles.scrim} onPress={onClose}>
          <Pressable
            style={[styles.card, { backgroundColor: theme.bg, borderColor: theme.line }]}
            onPress={() => {}}
          >
            <Text style={[styles.title, { color: theme.ink }]}>Settings</Text>

            <Row label="GRID SIZE">
              {([4, 5, 6] as GridSize[]).map(s => (
                <Chip key={s} label={`${s}×${s}`} active={settings.size === s}
                  onPress={() => updateSettings({ size: s })} />
              ))}
            </Row>

            <View style={[styles.modeBlock, !introLoadDone && styles.modeBlockMuted]}>
              <Row label="MODE">
                {(Object.keys(GAME_MODES) as GameModeId[]).map(modeId => (
                  <Chip
                    key={modeId}
                    label={GAME_MODES[modeId].label}
                    active={settings.modeId === modeId}
                    onPress={() => handlePickMode(modeId)}
                  />
                ))}
              </Row>
              <Text style={[styles.modeHint, { color: theme.ink3 }]}>{modeHint}</Text>
              <Text style={[styles.modeDesc, { color: theme.ink2 }]}>
                {GAME_MODES[settings.modeId].description}
              </Text>
            </View>

            <Row label="PALETTE">
              {(['pastel', 'sand', 'mist', 'bloom'] as PaletteName[]).map(p => (
                <Chip key={p} label={p} active={settings.palette === p}
                  onPress={() => updateSettings({ palette: p })} />
              ))}
            </Row>

            <Row label="THEME">
              {(['light', 'dim'] as ThemeName[]).map(t => (
                <Chip key={t} label={t} active={settings.themeName === t}
                  onPress={() => updateSettings({ themeName: t })} />
              ))}
            </Row>

            <Row label="TILE STYLE">
              {(['matte', 'glass'] as TileStyle[]).map(s => (
                <Chip key={s} label={s} active={settings.tileStyle === s}
                  onPress={() => updateSettings({ tileStyle: s })} />
              ))}
            </Row>

            <Row label="NUMBERS">
              <Chip label="show" active={settings.showNumbers}
                onPress={() => updateSettings({ showNumbers: true })} />
              <Chip label="hide" active={!settings.showNumbers}
                onPress={() => updateSettings({ showNumbers: false })} />
            </Row>

            <Row label="SOUND FX">
              <Chip label="on" active={settings.sfxEnabled}
                onPress={() => updateSettings({ sfxEnabled: true })} />
              <Chip label="off" active={!settings.sfxEnabled}
                onPress={() => updateSettings({ sfxEnabled: false })} />
            </Row>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.close,
                { borderColor: theme.line, backgroundColor: theme.bg2, opacity: pressed ? 0.75 : 1 },
              ]}
            >
              <Text style={[styles.closeText, { color: theme.ink2 }]}>DONE</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
      <ModeIntroModal
        visible={visible && pendingIntroModeId != null}
        modeId={pendingIntroModeId}
        theme={theme}
        onConfirm={handleIntroConfirm}
        onCancel={handleIntroCancel}
      />
    </>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(20,16,8,0.32)',
    justifyContent: 'flex-end',
    padding: 16,
    paddingBottom: 32,
  },
  card: { borderRadius: 22, borderWidth: 1, padding: 24, gap: 16 },
  title: { fontSize: 22, fontWeight: '400', letterSpacing: -0.3, marginBottom: 4 },
  row: { gap: 8 },
  rowLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 1.4, textTransform: 'uppercase' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: '500' },
  close: { paddingVertical: 13, borderRadius: 14, borderWidth: 1, alignItems: 'center', marginTop: 4 },
  closeText: { fontSize: 12, fontWeight: '500', letterSpacing: 0.6 },
  modeBlock: { gap: 8 },
  modeBlockMuted: { opacity: 0.45 },
  modeHint: { fontSize: 11, fontWeight: '600', letterSpacing: 0.4 },
  modeDesc: { fontSize: 12, lineHeight: 17 },
});
