import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ScrollView,
} from 'react-native';
import type { Theme } from '@/constants/theme';
import { SHARE_CARD_TEMPLATE_OPTIONS, type ShareCardTemplateId } from '@/lib/share-card-templates';

interface Props {
  visible: boolean;
  theme: Theme;
  canShareRunData: boolean;
  allowImageActions: boolean;
  shareCardTemplate: ShareCardTemplateId;
  onChangeShareCardTemplate: (id: ShareCardTemplateId) => void;
  onClose: () => void;
  onShareImage: () => void;
  onSaveImage: () => void;
  onShareRunData: () => void;
}

export function ShareMenuModal({
  visible,
  theme,
  canShareRunData,
  allowImageActions,
  shareCardTemplate,
  onChangeShareCardTemplate,
  onClose,
  onShareImage,
  onSaveImage,
  onShareRunData,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose}>
        <Pressable
          style={[styles.card, { backgroundColor: theme.bg, borderColor: theme.line }]}
          onPress={() => {}}
        >
          <Text style={[styles.title, { color: theme.ink }]}>Share</Text>
          <Text style={[styles.sub, { color: theme.ink3 }]}>
            {allowImageActions
              ? 'Pick a card layout, then share or save your image.'
              : Platform.OS === 'web'
                ? 'On web, only run data sharing is available.'
                : 'Image sharing is not available on this platform.'}
          </Text>

          {allowImageActions ? (
            <View style={[styles.templateBox, { borderColor: theme.line, backgroundColor: theme.bg2 }]}>
              <Text style={[styles.sectionLabel, { color: theme.ink3 }]}>Card layout</Text>
              {SHARE_CARD_TEMPLATE_OPTIONS.map(opt => {
                const active = shareCardTemplate === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => onChangeShareCardTemplate(opt.id)}
                    style={({ pressed }) => [
                      styles.templateRow,
                      {
                        borderColor: active ? theme.ink : theme.line,
                        backgroundColor: active ? theme.bg : theme.bg2,
                        opacity: pressed ? 0.88 : 1,
                      },
                    ]}
                  >
                    <View style={styles.templateRowText}>
                      <Text style={[styles.templateTitle, { color: theme.ink }]}>{opt.title}</Text>
                      <Text style={[styles.templateHint, { color: theme.ink3 }]}>{opt.hint}</Text>
                      <Text style={[styles.templateRef, { color: theme.ink3 }]}>{opt.designReference}</Text>
                    </View>
                    <Text style={[styles.templateCheck, { color: active ? theme.ink : theme.line }]}>
                      {active ? '✓' : ''}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <ScrollView style={styles.actionsScroll} showsVerticalScrollIndicator={false}>
            {allowImageActions ? (
              <>
                <Pressable
                  onPress={() => { onClose(); onShareImage(); }}
                  style={({ pressed }) => [
                    styles.row,
                    { borderColor: theme.line, backgroundColor: theme.bg2, opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Text style={[styles.rowTitle, { color: theme.ink }]}>Share image</Text>
                  <Text style={[styles.rowHint, { color: theme.ink3 }]}>Instagram, Messages, etc.</Text>
                </Pressable>
                <Pressable
                  onPress={() => { onClose(); onSaveImage(); }}
                  style={({ pressed }) => [
                    styles.row,
                    { borderColor: theme.line, backgroundColor: theme.bg2, opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Text style={[styles.rowTitle, { color: theme.ink }]}>Save image</Text>
                  <Text style={[styles.rowHint, { color: theme.ink3 }]}>Photo library</Text>
                </Pressable>
              </>
            ) : null}

            {canShareRunData ? (
              <Pressable
                onPress={() => { onClose(); onShareRunData(); }}
                style={({ pressed }) => [
                  styles.row,
                  { borderColor: theme.line, backgroundColor: theme.bg2, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Text style={[styles.rowTitle, { color: theme.ink }]}>Share run (data)</Text>
                <Text style={[styles.rowHint, { color: theme.ink3 }]}>JSON with moves & seed</Text>
              </Pressable>
            ) : null}

            {!allowImageActions && !canShareRunData ? (
              <Text style={[styles.empty, { color: theme.ink3 }]}>
                Play at least one move to share run data. Image sharing needs the iOS or Android app.
              </Text>
            ) : null}
          </ScrollView>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.cancel,
              { borderColor: theme.line, backgroundColor: theme.bg2, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={[styles.cancelText, { color: theme.ink2 }]}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(20,16,8,0.36)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '88%',
    borderRadius: 22,
    borderWidth: 1,
    padding: 22,
    gap: 10,
  },
  title: { fontSize: 22, fontWeight: '600', letterSpacing: -0.3 },
  sub: { fontSize: 13, lineHeight: 19, marginBottom: 2 },
  templateBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    gap: 8,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 2,
    marginLeft: 4,
  },
  templateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 10,
  },
  templateRowText: { flex: 1, gap: 2 },
  templateTitle: { fontSize: 15, fontWeight: '600' },
  templateHint: { fontSize: 12, fontWeight: '500', lineHeight: 16 },
  templateRef: { fontSize: 10, fontWeight: '500', lineHeight: 14, marginTop: 2 },
  templateCheck: { fontSize: 16, fontWeight: '700', width: 22, textAlign: 'center' },
  actionsScroll: { maxHeight: 220 },
  row: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 4,
    marginBottom: 10,
  },
  rowTitle: { fontSize: 16, fontWeight: '600' },
  rowHint: { fontSize: 12, fontWeight: '500' },
  empty: { fontSize: 13, lineHeight: 20, marginVertical: 8 },
  cancel: {
    marginTop: 4,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelText: { fontSize: 14, fontWeight: '600' },
});
