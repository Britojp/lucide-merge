import * as Haptics from 'expo-haptics';

const MERGE_STRONG_VALUE = 128;

export function hapticMergeStrongest(mergedTileValues: number[], feedbackEnabled: boolean): void {
  if (!feedbackEnabled || mergedTileValues.length === 0) return;
  const strongest = Math.max(...mergedTileValues);
  void Haptics.impactAsync(
    strongest >= MERGE_STRONG_VALUE
      ? Haptics.ImpactFeedbackStyle.Medium
      : Haptics.ImpactFeedbackStyle.Light,
  );
}

export function hapticVictory(feedbackEnabled: boolean): void {
  if (!feedbackEnabled) return;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export function hapticGameOver(feedbackEnabled: boolean): void {
  if (!feedbackEnabled) return;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

export function hapticSpawn(feedbackEnabled: boolean): void {
  if (!feedbackEnabled) return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function hapticUndo(feedbackEnabled: boolean): void {
  if (!feedbackEnabled) return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}
