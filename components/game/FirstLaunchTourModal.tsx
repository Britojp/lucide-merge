import React, { useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Theme } from '@/constants/theme';
import { ONBOARDING_STEPS } from '@/lib/onboarding-tour';

interface Props {
  theme: Theme;
  onComplete: () => void;
}

export function FirstLaunchTourModal({ theme, onComplete }: Props) {
  const { height } = useWindowDimensions();
  const bodyMax = Math.min(320, Math.max(200, height * 0.38));
  const [index, setIndex] = useState(0);
  const last = index >= ONBOARDING_STEPS.length - 1;
  const step = ONBOARDING_STEPS[index];

  const goNext = useCallback(() => {
    if (last) {
      onComplete();
      setIndex(0);
      return;
    }
    setIndex(i => Math.min(i + 1, ONBOARDING_STEPS.length - 1));
  }, [last, onComplete]);

  const goBack = useCallback(() => {
    setIndex(i => Math.max(0, i - 1));
  }, []);

  const handleSkip = useCallback(() => {
    onComplete();
    setIndex(0);
  }, [onComplete]);

  return (
    <Modal visible animationType="fade" presentationStyle="fullScreen" onRequestClose={handleSkip}>
      <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <Pressable onPress={handleSkip} hitSlop={12}>
            <Text style={[styles.skip, { color: theme.ink3 }]}>Skip tour</Text>
          </Pressable>
        </View>

        <View style={styles.main}>
          <Text style={[styles.kicker, { color: theme.ink3 }]}>
            {index + 1} / {ONBOARDING_STEPS.length}
          </Text>
          <Text style={[styles.title, { color: theme.ink }]}>{step.title}</Text>
          <ScrollView
            style={[styles.scroll, { maxHeight: bodyMax }]}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.body, { color: theme.ink2 }]}>{step.body}</Text>
          </ScrollView>
        </View>

        <View style={styles.dots}>
          {ONBOARDING_STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === index ? theme.ink : theme.line },
              ]}
            />
          ))}
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={goBack}
            disabled={index === 0}
            style={({ pressed }) => [
              styles.secondaryBtn,
              {
                borderColor: theme.line,
                backgroundColor: theme.bg2,
                opacity: index === 0 ? 0.35 : pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text style={[styles.secondaryLabel, { color: theme.ink2 }]}>Back</Text>
          </Pressable>
          <Pressable
            onPress={goNext}
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: theme.ink, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <Text style={[styles.primaryLabel, { color: theme.bg }]}>
              {last ? 'Get started' : 'Next'}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 24 },
  topBar: { alignItems: 'flex-end', paddingVertical: 8 },
  skip: { fontSize: 14, fontWeight: '500' },
  main: { flex: 1, justifyContent: 'center', gap: 14 },
  kicker: { fontSize: 12, fontWeight: '600', letterSpacing: 1.2 },
  title: { fontSize: 26, fontFamily: 'Fraunces_400Regular', letterSpacing: -0.4 },
  scroll: { marginTop: 4 },
  body: { fontSize: 16, lineHeight: 25 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  actions: { flexDirection: 'row', gap: 12, paddingBottom: 12 },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  secondaryLabel: { fontSize: 15, fontWeight: '600' },
  primaryBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryLabel: { fontSize: 15, fontWeight: '600', letterSpacing: 0.3 },
});
