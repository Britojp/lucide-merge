import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { ChevronRight, LogOut, Pencil, Trophy, X, Sparkles, Target } from 'lucide-react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { GAME_MODES, type GameModeId } from '@/lib/game-modes';
import { readCloudBestFromProfile } from '@/lib/cloud-best-scores';
import {
  supabase,
  type AchievementDef,
  type MissionStateRow,
  type UserAchievementEntry,
  type UserProgress,
} from '@/utils/supabase';

function initials(profile: { display_name: string | null; email: string | null }) {
  const name = profile.display_name ?? profile.email ?? '?';
  return name.slice(0, 2).toUpperCase();
}

export default function ProfileScreen() {
  const { theme, settings } = useSettings();
  const { profile, loading, signOut, refreshProfile } = useAuth();
  const [bestScoresMode, setBestScoresMode] = useState<GameModeId>(settings.modeId);
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [progressLoading, setProgressLoading] = useState(true);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [achievementDefs, setAchievementDefs] = useState<AchievementDef[]>([]);
  const [earnedMap, setEarnedMap] = useState<Record<string, string>>({});
  const [missionRows, setMissionRows] = useState<MissionStateRow[]>([]);

  const loadProgression = useCallback(async (userId: string) => {
    setProgressLoading(true);
    const todayUtc = new Date().toISOString().slice(0, 10);
    const [pRes, defsRes, achRes, missRes] = await Promise.all([
      supabase.from('user_progress').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('achievement_defs').select('id, title, description, xp_reward').order('id'),
      supabase.from('user_achievements').select('achievement_id, earned_at').eq('user_id', userId),
      supabase
        .from('user_mission_state')
        .select('mission_id, progress, completed_at, mission_defs(title, xp_reward)')
        .eq('user_id', userId)
        .eq('mission_date', todayUtc),
    ]);
    if (pRes.data) setUserProgress(pRes.data as UserProgress);
    else setUserProgress(null);
    setAchievementDefs((defsRes.data as AchievementDef[]) ?? []);
    const earned: Record<string, string> = {};
    for (const row of (achRes.data as UserAchievementEntry[]) ?? []) {
      earned[row.achievement_id] = row.earned_at;
    }
    setEarnedMap(earned);
    const rawMissions = (missRes.data ?? []) as Array<{
      mission_id: string;
      progress: number;
      completed_at: string | null;
      mission_defs: { title: string; xp_reward: number } | { title: string; xp_reward: number }[] | null;
    }>;
    setMissionRows(
      rawMissions.map(r => ({
        mission_id: r.mission_id,
        progress: r.progress,
        completed_at: r.completed_at,
        mission_defs: Array.isArray(r.mission_defs) ? r.mission_defs[0] ?? null : r.mission_defs,
      })),
    );
    setProgressLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!profile?.id) return;
      loadProgression(profile.id);
    }, [profile?.id, loadProgression]),
  );

  async function handleSignOut() {
    await signOut();
    router.dismiss();
  }

  async function handleSaveName() {
    const trimmed = nameInput.trim();
    if (!trimmed || !profile) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: trimmed })
      .eq('id', profile.id);
    setSaving(false);
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    await refreshProfile();
    setEditing(false);
  }

  if (loading || !profile) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]} edges={['top', 'bottom']}>
        <ActivityIndicator style={{ flex: 1 }} color={theme.ink2} />
      </SafeAreaView>
    );
  }

  const displayName = profile.display_name ?? profile.email ?? 'Player';
  const xp = userProgress?.xp ?? 0;
  const level = userProgress?.level ?? 1;
  const nextLevelXp = level * 500;
  const prevLevelXp = (level - 1) * 500;
  const levelSpan = Math.max(1, nextLevelXp - prevLevelXp);
  const levelProgress = Math.min(1, Math.max(0, (xp - prevLevelXp) / levelSpan));

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Pressable style={styles.closeBtn} onPress={() => router.dismiss()}>
          <AppIcon icon={X} size={22} color={theme.ink2} />
        </Pressable>

        <View style={[styles.avatar, { backgroundColor: theme.ink }]}>
          <Text style={[styles.avatarText, { color: theme.bg }]}>{initials(profile)}</Text>
        </View>

        {editing ? (
          <View style={styles.editRow}>
            <TextInput
              style={[styles.nameInput, { borderColor: theme.line, color: theme.ink, backgroundColor: theme.bg2 }]}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Your name"
              placeholderTextColor={theme.ink3}
              autoFocus
              maxLength={32}
            />
            <Pressable onPress={handleSaveName} disabled={saving} style={[styles.saveBtn, { backgroundColor: theme.ink }]}>
              {saving
                ? <ActivityIndicator color={theme.bg} size="small" />
                : <Text style={[styles.saveBtnText, { color: theme.bg }]}>Save</Text>}
            </Pressable>
            <Pressable onPress={() => setEditing(false)} style={styles.cancelBtn}>
              <AppIcon icon={X} size={18} color={theme.ink3} />
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.nameRow} onPress={() => { setNameInput(profile.display_name ?? ''); setEditing(true); }}>
            <Text style={[styles.name, { color: theme.ink }]}>{displayName}</Text>
            <AppIcon icon={Pencil} size={14} color={theme.ink3} style={{ marginTop: 2 }} />
          </Pressable>
        )}

        {profile.display_name && profile.email && (
          <Text style={[styles.email, { color: theme.ink3 }]}>{profile.email}</Text>
        )}

        <View style={[styles.card, { backgroundColor: theme.bg2, borderColor: theme.line }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.ink }]}>Progress</Text>
          </View>
          {progressLoading ? (
            <ActivityIndicator color={theme.ink2} style={{ marginVertical: 12 }} />
          ) : (
            <>
              <Text style={[styles.levelLine, { color: theme.ink }]}>Level {level}</Text>
              <Text style={[styles.xpLine, { color: theme.ink3 }]}>{xp.toLocaleString()} XP</Text>
              <View style={[styles.barOuter, { backgroundColor: theme.cell }]}>
                <View style={{ flex: Math.max(0.02, levelProgress), height: 8, borderRadius: 6, backgroundColor: theme.ink }} />
                <View style={{ flex: Math.max(0.02, 1 - levelProgress), height: 8, borderRadius: 6, backgroundColor: 'transparent' }} />
              </View>
              <Text style={[styles.barHint, { color: theme.ink3 }]}>
                Next level at {nextLevelXp.toLocaleString()} XP
              </Text>
            </>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: theme.bg2, borderColor: theme.line }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.ink }]}>{'Today\'s missions'}</Text>
          </View>
          {progressLoading ? (
            <ActivityIndicator color={theme.ink2} style={{ marginVertical: 12 }} />
          ) : missionRows.length === 0 ? (
            <Text style={[styles.emptyHint, { color: theme.ink3 }]}>Play a session to record progress.</Text>
          ) : (
            missionRows.map(row => {
              const title = row.mission_defs?.title ?? row.mission_id;
              const done = !!row.completed_at;
              return (
                <View key={row.mission_id} style={[styles.listRow, { borderColor: theme.line }]}>
                  <Text style={[styles.listTitle, { color: theme.ink }]}>{title}</Text>
                  <Text style={[styles.listMeta, { color: done ? theme.ink2 : theme.ink3 }]}>
                    {done ? 'Completed' : `Progress: ${row.progress}`}
                    {row.mission_defs?.xp_reward != null ? ` · +${row.mission_defs.xp_reward} XP` : ''}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        <View style={[styles.card, { backgroundColor: theme.bg2, borderColor: theme.line }]}>
          <Text style={[styles.cardTitle, { color: theme.ink, marginBottom: 12 }]}>Achievements</Text>
          {progressLoading ? (
            <ActivityIndicator color={theme.ink2} style={{ marginVertical: 12 }} />
          ) : (
            achievementDefs.map(def => {
              const at = earnedMap[def.id];
              const unlocked = !!at;
              return (
                <View key={def.id} style={[styles.listRow, { borderColor: theme.line, opacity: unlocked ? 1 : 0.55 }]}>
                  <Text style={[styles.listTitle, { color: theme.ink }]}>{def.title}</Text>
                  <Text style={[styles.listMeta, { color: theme.ink3 }]}>{def.description}</Text>
                  <Text style={[styles.listMeta, { color: theme.ink2 }]}>
                    {unlocked ? `Unlocked · +${def.xp_reward} XP` : `+${def.xp_reward} XP`}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        <View style={[styles.card, { backgroundColor: theme.bg2, borderColor: theme.line }]}>
          <Text style={[styles.scoreLabel, { color: theme.ink3 }]}>BEST SCORES</Text>
          <Text style={[styles.scoreSectionHint, { color: theme.ink3 }]}>
            By mode and grid
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.modeScroll}
          >
            {(Object.keys(GAME_MODES) as GameModeId[]).map(id => (
              <Pressable
                key={id}
                onPress={() => setBestScoresMode(id)}
                style={[
                  styles.modeChip,
                  {
                    backgroundColor: bestScoresMode === id ? theme.ink : theme.bg,
                    borderColor: theme.line,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.modeChipText,
                    { color: bestScoresMode === id ? theme.bg : theme.ink2 },
                  ]}
                  numberOfLines={1}
                >
                  {GAME_MODES[id].label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={styles.scoreGrid}>
            {([4, 5, 6] as const).map(size => {
              const score = readCloudBestFromProfile(profile, bestScoresMode, size);
              return (
                <View key={size} style={styles.scoreCell}>
                  <Text style={[styles.scoreSizeLabel, { color: theme.ink3 }]}>{size}×{size}</Text>
                  <Text style={[styles.scoreSizeValue, { color: score > 0 ? theme.ink : theme.ink3 }]}>
                    {score > 0 ? score.toLocaleString() : '—'}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.actionsBlock}>
          <Pressable
            style={({ pressed }) => [styles.actionBtn, { borderColor: theme.line, backgroundColor: theme.bg2, opacity: pressed ? 0.75 : 1 }]}
            onPress={() => router.push('/leaderboard')}
          >
            <AppIcon icon={Trophy} size={18} color={theme.ink2} />
            <Text style={[styles.actionBtnText, { color: theme.ink }]}>Leaderboard</Text>
            <AppIcon icon={ChevronRight} size={16} color={theme.ink3} style={{ marginLeft: 'auto' }} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.actionBtn, { borderColor: theme.line, backgroundColor: theme.bg2, opacity: pressed ? 0.75 : 1 }]}
            onPress={handleSignOut}
          >
            <AppIcon icon={LogOut} size={18} color={theme.ink2} />
            <Text style={[styles.actionBtnText, { color: theme.ink }]}>Sign out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 28, paddingTop: 16, paddingBottom: 40 },
  closeBtn: { alignSelf: 'flex-end', padding: 6, marginBottom: 20 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    alignSelf: 'center', justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
  },
  avatarText: { fontSize: 24, fontWeight: '500' },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 2 },
  name: { fontSize: 20, fontWeight: '400', textAlign: 'center', letterSpacing: -0.3 },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  nameInput: {
    flex: 1, borderWidth: 1, borderRadius: 10,
    paddingVertical: 8, paddingHorizontal: 12,
    fontSize: 16, fontWeight: '400',
  },
  saveBtn: { borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14 },
  saveBtnText: { fontSize: 14, fontWeight: '500' },
  cancelBtn: { padding: 4 },
  email: { fontSize: 13, textAlign: 'center', marginTop: 2, marginBottom: 4 },
  card: {
    borderWidth: 1, borderRadius: 16,
    padding: 18,
    marginTop: 16,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  cardTitle: { fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },
  levelLine: { fontSize: 22, fontWeight: '500', marginBottom: 4 },
  xpLine: { fontSize: 13, marginBottom: 10 },
  barOuter: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    height: 8,
    marginBottom: 8,
  },
  barHint: { fontSize: 11 },
  emptyHint: { fontSize: 13, marginVertical: 8 },
  listRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
  },
  listTitle: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
  listMeta: { fontSize: 12, lineHeight: 16 },
  scoreLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 1.4, marginBottom: 6, textAlign: 'center' },
  scoreSectionHint: { fontSize: 11, textAlign: 'center', marginBottom: 10 },
  modeScroll: { flexDirection: 'row', gap: 8, marginBottom: 14, paddingHorizontal: 2 },
  modeChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    maxWidth: 140,
  },
  modeChipText: { fontSize: 11, fontWeight: '600' },
  scoreGrid: { flexDirection: 'row', alignItems: 'flex-start', width: '100%' },
  scoreCell: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: 6,
  },
  scoreSizeLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.8, textAlign: 'center', width: '100%' },
  scoreSizeValue: {
    fontSize: 22,
    fontWeight: '300',
    letterSpacing: -0.5,
    textAlign: 'center',
    width: '100%',
    fontVariant: ['tabular-nums'],
  } as any,
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderRadius: 14, padding: 16,
  },
  actionsBlock: { marginTop: 16, gap: 12, marginBottom: 8 },
  actionBtnText: { fontSize: 15, fontWeight: '400' },
});
