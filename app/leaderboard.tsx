import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import type { GridSize } from '@/constants/theme';
import { GAME_MODES, type GameModeId } from '@/lib/game-modes';
import { readCloudBest } from '@/lib/cloud-best-scores';

type Entry = {
  id: string;
  display_name: string | null;
  best_score: number;
  best_scores: Record<string, number> | null;
};

function playerName(entry: Entry) {
  if (entry.display_name) return entry.display_name;
  return 'Player';
}

function scoreForModeAndSize(entry: Entry, modeId: GameModeId, size: GridSize): number {
  return readCloudBest(entry.best_scores, modeId, size);
}

const MEDALS = ['🥇', '🥈', '🥉'];
const SIZES: GridSize[] = [4, 5, 6];
const MODE_IDS = Object.keys(GAME_MODES) as GameModeId[];

export default function LeaderboardScreen() {
  const { theme, settings } = useSettings();
  const { user } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<GridSize>(settings.size);
  const [selectedMode, setSelectedMode] = useState<GameModeId>(settings.modeId);

  useEffect(() => {
    supabase
      .from('leaderboard_public')
      .select('id, display_name, best_score, best_scores')
      .order('best_score', { ascending: false })
      .limit(200)
      .then(({ data }) => {
        setEntries((data as Entry[]) ?? []);
        setLoading(false);
      });
  }, []);

  const ranked = entries
    .map(e => ({
      ...e,
      rankScore: scoreForModeAndSize(e, selectedMode, selectedSize),
    }))
    .filter(e => e.rankScore > 0)
    .sort((a, b) => b.rankScore - a.rankScore)
    .slice(0, 50);

  const modeLabel = GAME_MODES[selectedMode].label;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <AppIcon icon={ChevronLeft} size={22} color={theme.ink2} />
        </Pressable>
        <Text style={[styles.title, { color: theme.ink }]}>Leaderboard</Text>
        <View style={{ width: 34 }} />
      </View>

      <Text style={[styles.sectionHint, { color: theme.ink3 }]}>
        Rankings by game mode and grid size
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.modeScroll}
      >
        {MODE_IDS.map(id => (
          <Pressable
            key={id}
            onPress={() => setSelectedMode(id)}
            style={[
              styles.modeChip,
              {
                backgroundColor: selectedMode === id ? theme.ink : theme.bg2,
                borderColor: theme.line,
              },
            ]}
          >
            <Text
              style={[
                styles.modeChipText,
                { color: selectedMode === id ? theme.bg : theme.ink2 },
              ]}
              numberOfLines={1}
            >
              {GAME_MODES[id].label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={[styles.tabs, { backgroundColor: theme.bg2, borderColor: theme.line }]}>
        {SIZES.map(s => (
          <Pressable
            key={s}
            onPress={() => setSelectedSize(s)}
            style={[
              styles.tab,
              selectedSize === s && { backgroundColor: theme.ink },
            ]}
          >
            <Text style={[
              styles.tabText,
              { color: selectedSize === s ? theme.bg : theme.ink2 },
            ]}>
              {s}×{s}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={theme.ink2} />
      ) : (
        <FlatList
          data={ranked}
          keyExtractor={item => `${item.id}-${selectedMode}-${selectedSize}`}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: theme.line }]} />}
          renderItem={({ item, index }) => {
            const isMe = item.id === user?.id;
            return (
              <View style={[styles.row, isMe && { backgroundColor: theme.bg2 }]}>
                <Text style={[styles.rank, { color: theme.ink3 }]}>
                  {index < 3 ? MEDALS[index] : `${index + 1}`}
                </Text>
                <Text
                  style={[styles.name, { color: theme.ink }, isMe && { fontWeight: '500' }]}
                  numberOfLines={1}
                >
                  {playerName(item)}{isMe ? ' (you)' : ''}
                </Text>
                <Text style={[styles.score, { color: theme.ink }]}>
                  {item.rankScore.toLocaleString()}
                </Text>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.empty, { color: theme.ink3 }]}>
                No scores yet for {modeLabel} on {selectedSize}×{selectedSize}.
              </Text>
              <Text style={[styles.emptySub, { color: theme.ink3 }]}>Be the first!</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: { padding: 6 },
  title: { fontSize: 18, fontWeight: '400', letterSpacing: -0.3 },
  sectionHint: {
    fontSize: 12,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  modeScroll: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 8,
  },
  modeChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    maxWidth: 160,
  },
  modeChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 4,
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    gap: 2,
  },
  tab: {
    flex: 1, paddingVertical: 7, borderRadius: 9,
    alignItems: 'center',
  },
  tabText: { fontSize: 13, fontWeight: '500' },
  list: { paddingHorizontal: 20, paddingVertical: 8 },
  separator: { height: 1, marginHorizontal: 4 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 12,
    borderRadius: 10, gap: 12,
  },
  rank: { width: 28, fontSize: 15, textAlign: 'center' },
  name: { flex: 1, fontSize: 15, fontWeight: '400' },
  score: { fontSize: 15, fontWeight: '300', letterSpacing: -0.3 },
  emptyContainer: { alignItems: 'center', marginTop: 60, gap: 6 },
  empty: { fontSize: 14 },
  emptySub: { fontSize: 13 },
});
