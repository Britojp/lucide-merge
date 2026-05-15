import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  Alert,
  Share,
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  GestureResponderEvent,
  Platform,
} from 'react-native';
import {
  Clock3,
  CircleQuestionMark,
  Gamepad2,
  Moon,
  RotateCcw,
  Settings,
  Share2,
  Sun,
  Trophy,
  Undo2,
  User,
  UserRound,
} from 'lucide-react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useGame } from '@/hooks/use-game';
import type { Direction, Tile } from '@/hooks/use-game';
import { useSound } from '@/hooks/use-sound';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import type { Theme } from '@/constants/theme';
import { Board } from '@/components/game/Board';
import { ScoreBox } from '@/components/game/ScoreBox';
import { GameOverlay } from '@/components/game/GameOverlay';
import { HelpModal } from '@/components/game/HelpModal';
import { SettingsModal } from '@/components/game/SettingsModal';
import { AudioEngine } from '@/components/game/AudioEngine';
import {
  hapticGameOver,
  hapticMergeStrongest,
  hapticSpawn,
  hapticUndo,
  hapticVictory,
} from '@/lib/game-haptics';
import { readCloudBestFromProfile } from '@/lib/cloud-best-scores';
import { GAME_MODES, modeConfig, modeHasTimeLimit } from '@/lib/game-modes';
import type { GameModeId } from '@/lib/game-modes';
import { buildReplay, challengeDateFromSeed } from '@/lib/game-run';
import { ghostDiffOneMoveAhead } from '@/lib/game-simulator';
import { createSessionStatsSnapshot } from '@/lib/session-telemetry';
import { supabase } from '@/utils/supabase';
import { GhostReplayHud } from '@/components/game/GhostReplayHud';
import { TimedStartOverlay } from '@/components/game/TimedStartOverlay';
import { FirstLaunchTourModal } from '@/components/game/FirstLaunchTourModal';
import { useFirstLaunchTour } from '@/hooks/use-first-launch-tour';
import { useShareCardTemplate } from '@/hooks/use-share-card-template';
import { ShareScoreCard, SHARE_CARD_W, SHARE_CARD_H } from '@/components/game/ShareScoreCard';
import { ShareMenuModal } from '@/components/game/ShareMenuModal';
import { captureShareScorePng } from '@/lib/capture-share-score';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';

const SWIPE_THRESHOLD = 24;
const REPLAY_STEP_MS = 420;

type RankedReplay = {
  replay_seed: string;
  replay_moves: Direction[];
  score: number;
  max_tile: number;
};

export default function GameScreen() {
  const { width } = useWindowDimensions();
  const boardWidth = Math.min(560, width * 0.92);

  const { settings, theme, updateSettings } = useSettings();
  const { tourPending, completeTour } = useFirstLaunchTour();
  const { shareCardTemplate, setShareCardTemplate } = useShareCardTemplate();
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareCardRef = useRef<View>(null);
  const [dailySeed, setDailySeed] = useState<string | null>(null);
  const [forcedSeed, setForcedSeed] = useState<string | null>(null);
  const [bestReplay, setBestReplay] = useState<RankedReplay | null>(null);
  const [isReplayingBest, setIsReplayingBest] = useState(false);
  const [timedPlayStarted, setTimedPlayStarted] = useState(false);
  const [timeLeftMs, setTimeLeftMs] = useState<number | null>(null);

  const modeRules = useMemo(() => modeConfig(settings.modeId), [settings.modeId]);
  const activeSeed = forcedSeed ?? (settings.modeId === 'daily_challenge' ? dailySeed ?? undefined : undefined);

  const { state, move, undo, reset, continueGame, setBest, setTimerExpired } = useGame(settings.size, {
    modeId: settings.modeId,
    modeRules,
    seed: activeSeed,
  });
  const { audioRef, play, setSfx } = useSound();
  const { user, profile, syncBestScore } = useAuth();

  const shareDisplayName = useMemo(() => {
    if (!profile) return 'Player';
    const n = profile.display_name?.trim();
    if (n) return n;
    const e = profile.email?.split('@')[0]?.trim();
    return e || 'Player';
  }, [profile]);
  const sessionStartedAtRef = useRef<number>(Date.now());
  const mergesTotalRef = useRef(0);
  const undosRef = useRef(0);
  const spawnsRef = useRef(0);
  const submittedRunRef = useRef(false);

  useEffect(() => {
    const cloud = readCloudBestFromProfile(profile, settings.modeId, settings.size);
    if (cloud > 0) setBest(cloud);
  }, [profile?.best_scores, settings.size, settings.modeId, setBest]);

  useEffect(() => {
    if (user && state.best > 0) syncBestScore(state.best, settings.size, settings.modeId);
  }, [state.best, user, syncBestScore, settings.size, settings.modeId]);

  // Sync SFX toggle with audio engine
  useEffect(() => { setSfx(settings.sfxEnabled); }, [settings.sfxEnabled]);

  useEffect(() => {
    submittedRunRef.current = false;
    mergesTotalRef.current = 0;
    undosRef.current = 0;
    spawnsRef.current = 0;
    if (!modeHasTimeLimit(modeRules)) {
      setTimedPlayStarted(true);
      sessionStartedAtRef.current = Date.now();
    } else if (isReplayingBest) {
      setTimedPlayStarted(true);
    } else {
      setTimedPlayStarted(false);
    }
  }, [state.runSeed, settings.modeId, modeRules, isReplayingBest]);

  useEffect(() => {
    if (settings.modeId !== 'daily_challenge') {
      setDailySeed(null);
      return;
    }
    const challengeDate = new Date().toISOString().slice(0, 10);
    supabase
      .from('daily_challenges')
      .select('seed')
      .eq('challenge_date', challengeDate)
      .maybeSingle()
      .then(({ data }) => {
        setDailySeed(data?.seed ?? challengeDate);
      });
  }, [settings.modeId]);

  useEffect(() => {
    setForcedSeed(null);
  }, [settings.modeId, settings.size]);

  useEffect(() => {
    if (modeRules.timeLimitMs == null) {
      setTimeLeftMs(null);
      return;
    }
    setTimeLeftMs(modeRules.timeLimitMs);
  }, [state.runSeed, modeRules.timeLimitMs]);

  useEffect(() => {
    if (
      timeLeftMs == null
      || state.over
      || state.won
      || state.animating
      || !timedPlayStarted
      || isReplayingBest
    ) {
      return;
    }
    const tick = setInterval(() => {
      setTimeLeftMs(prev => {
        if (prev == null) return prev;
        const next = Math.max(0, prev - 250);
        if (next === 0) {
          setTimerExpired();
          clearInterval(tick);
        }
        return next;
      });
    }, 250);
    return () => clearInterval(tick);
  }, [timeLeftMs, state.over, state.won, state.animating, timedPlayStarted, isReplayingBest, setTimerExpired]);

  useEffect(() => {
    if (!user) {
      setBestReplay(null);
      return;
    }
    supabase
      .from('game_runs')
      .select('replay_seed, replay_moves, score, max_tile')
      .eq('mode_id', settings.modeId)
      .eq('grid_size', settings.size)
      .eq('is_completed', true)
      .order('score', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) {
          setBestReplay(null);
          return;
        }
        setBestReplay({
          replay_seed: data.replay_seed as string,
          replay_moves: (data.replay_moves as Direction[]) ?? [],
          score: data.score as number,
          max_tile: data.max_tile as number,
        });
      });
  }, [user, settings.modeId, settings.size, state.runSeed]);

  // Sound: detect merges and spawns
  const prevTilesRef = useRef<Tile[]>([]);
  const prevWonRef   = useRef(false);
  const prevOverRef  = useRef(false);

  useEffect(() => {
    const prev = prevTilesRef.current;
    const curr = state.tiles;
    prevTilesRef.current = curr;

    const newMerges = curr.filter(
      t => t.mergedFrom && !prev.some(p => p.id === t.id && p.mergedFrom),
    );
    if (newMerges.length > 0) {
      mergesTotalRef.current += newMerges.length;
      const values = newMerges.map(t => t.value);
      setTimeout(() => hapticMergeStrongest(values, settings.sfxEnabled), 48);
      newMerges
        .sort((a, b) => a.value - b.value)
        .forEach((t, i) => setTimeout(() => play('merge', t.value), i * 38));
    }

    const newSpawns = curr.filter(t => t.isNew && !prev.some(p => p.id === t.id));
    if (newSpawns.length > 0) {
      spawnsRef.current += newSpawns.length;
      play('spawn');
      hapticSpawn(settings.sfxEnabled);
    }
  }, [state.tiles, play, settings.sfxEnabled]);

  useEffect(() => {
    if (state.won && !state.keepGoing && !prevWonRef.current) {
      play('victory');
      hapticVictory(settings.sfxEnabled);
    }
    prevWonRef.current = state.won && !state.keepGoing;
  }, [state.won, state.keepGoing, play, settings.sfxEnabled]);

  useEffect(() => {
    if (state.over && !prevOverRef.current) {
      play('gameover');
      hapticGameOver(settings.sfxEnabled);
    }
    prevOverRef.current = state.over;
  }, [state.over, play, settings.sfxEnabled]);

  useEffect(() => {
    const sessionEnded = state.over || (state.won && !state.keepGoing);
    if (!sessionEnded || submittedRunRef.current || !user) return;
    submittedRunRef.current = true;

    const durationMs = Math.max(1000, Date.now() - sessionStartedAtRef.current);
    const replay = buildReplay(state.modeId, state.size, state.runSeed, state.replayMoves);
    const runPayload = {
      user_id: user.id,
      mode_id: state.modeId,
      grid_size: state.size,
      score: state.score,
      max_tile: Math.max(state.maxTile, 0),
      duration_ms: durationMs,
      move_count: state.replayMoves.length,
      merges_total: mergesTotalRef.current,
      replay_seed: state.runSeed,
      replay_moves: replay.moves,
      challenge_date: challengeDateFromSeed(state.runSeed, state.modeId),
      is_completed: true,
      ended_by: state.endedBy,
      session_stats: createSessionStatsSnapshot(undosRef.current, spawnsRef.current),
    };

    supabase
      .from('game_runs')
      .insert(runPayload)
      .select('id')
      .single()
      .then(({ data }) => {
        if (!data?.id) return;
        return supabase.from('run_replays').upsert({
          run_id: data.id,
          user_id: user.id,
          replay_json: replay,
          is_public: false,
        });
      });

    supabase.rpc('record_player_progress', {
      p_user_id: user.id,
      p_score: state.score,
      p_max_tile: state.maxTile,
      p_duration_ms: durationMs,
      p_merge_count: mergesTotalRef.current,
      p_mode_id: state.modeId,
    });
  }, [
    user,
    state.over,
    state.won,
    state.keepGoing,
    state.modeId,
    state.size,
    state.score,
    state.maxTile,
    state.runSeed,
    state.replayMoves,
    state.endedBy,
  ]);

  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const awaitingTimedStart =
    modeHasTimeLimit(modeRules) && !timedPlayStarted && !isReplayingBest;

  const handleTimedStart = useCallback(() => {
    setTimedPlayStarted(true);
    sessionStartedAtRef.current = Date.now();
  }, []);

  const handleTouchStart = useCallback((e: GestureResponderEvent) => {
    if (isReplayingBest || awaitingTimedStart) return;
    touchStart.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
  }, [isReplayingBest, awaitingTimedStart]);

  const handleTouchEnd = useCallback((e: GestureResponderEvent) => {
    if (isReplayingBest || awaitingTimedStart) return;
    if (!touchStart.current) return;
    const dx = e.nativeEvent.pageX - touchStart.current.x;
    const dy = e.nativeEvent.pageY - touchStart.current.y;
    touchStart.current = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD) return;
    const dir: Direction = Math.abs(dx) >= Math.abs(dy)
      ? (dx > 0 ? 'right' : 'left')
      : (dy > 0 ? 'down' : 'up');
    play('swipe');
    move(dir);
  }, [isReplayingBest, awaitingTimedStart, move, play]);

  const ghostOverlayTiles = useMemo(() => {
    if (!isReplayingBest || !bestReplay) return [];
    return ghostDiffOneMoveAhead(
      settings.size,
      modeRules,
      bestReplay.replay_seed,
      bestReplay.replay_moves,
      state.replayMoves.length,
    );
  }, [
    isReplayingBest,
    bestReplay,
    settings.size,
    modeRules,
    state.replayMoves.length,
  ]);

  const handleUndo = useCallback(() => {
    undosRef.current += 1;
    hapticUndo(settings.sfxEnabled);
    play('undo');
    undo();
  }, [undo, play, settings.sfxEnabled]);

  const handleShareRun = useCallback(async () => {
    if (state.replayMoves.length === 0) {
      Alert.alert('No replay', 'Play a session to generate a move sequence.');
      return;
    }
    const payload = {
      modeId: state.modeId,
      gridSize: state.size,
      seed: state.runSeed,
      moves: state.replayMoves,
      score: state.score,
      maxTile: state.maxTile,
    };
    await Share.share({
      message: `My Lucid Merge run:\n${JSON.stringify(payload)}`,
    });
  }, [state]);

  const runShareScoreImage = useCallback(async () => {
    try {
      const uri = await captureShareScorePng(shareCardRef);
      const ok = await Sharing.isAvailableAsync();
      if (!ok) {
        Alert.alert('Sharing unavailable', 'This device cannot share files.');
        return;
      }
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        UTI: 'public.png',
        dialogTitle: 'Share your score',
      });
    } catch (e) {
      Alert.alert('Could not share', e instanceof Error ? e.message : 'Unknown error');
    }
  }, []);

  const runSaveScoreImage = useCallback(async () => {
    try {
      const perm = await MediaLibrary.requestPermissionsAsync(true);
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Allow access to save your score card to photos.');
        return;
      }
      const uri = await captureShareScorePng(shareCardRef);
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Saved', 'Your score card was saved to your photo library.');
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Unknown error');
    }
  }, []);

  const handleWatchBestRun = useCallback(async () => {
    if (!bestReplay || bestReplay.replay_moves.length === 0) {
      Alert.alert('No best run', 'There is no saved replay for this mode yet.');
      return;
    }
    setIsReplayingBest(true);
    setForcedSeed(bestReplay.replay_seed);
    await new Promise(resolve => setTimeout(resolve, 120));
    reset();
    await new Promise(resolve => setTimeout(resolve, 300));
    for (const dir of bestReplay.replay_moves) {
      move(dir);
      await new Promise(resolve => setTimeout(resolve, REPLAY_STEP_MS));
    }
    setIsReplayingBest(false);
    setForcedSeed(null);
  }, [bestReplay, move, reset]);

  const showOverlay = (state.won && !state.keepGoing) || state.over;
  const formattedTime = timeLeftMs == null
    ? null
    : `${String(Math.floor(timeLeftMs / 1000 / 60)).padStart(2, '0')}:${String(Math.floor((timeLeftMs / 1000) % 60)).padStart(2, '0')}`;

  return (
    <>
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]} edges={['top', 'bottom']}>
      <AudioEngine ref={audioRef} />

      <View style={[styles.header, { width: boardWidth }]}>
        <Text style={[styles.title, { color: theme.ink }]}>
          Lucid <Text style={[styles.titleItalic, { color: theme.ink }]}>Merge</Text>
        </Text>
        <View style={styles.scores}>
          <ScoreBox label="SCORE" value={state.score} theme={theme} large />
          <ScoreBox label="BEST" value={state.best} theme={theme} />
        </View>
      </View>

      <View style={[styles.modeBar, { width: boardWidth }]}>
        <View style={[styles.modeChip, { backgroundColor: theme.bg2, borderColor: theme.line }]}>
          <AppIcon icon={Gamepad2} size={14} color={theme.ink2} />
          <Text style={[styles.modeChipText, { color: theme.ink2 }]}>{GAME_MODES[state.modeId].label}</Text>
        </View>
        {formattedTime && (
          <View style={[styles.modeChip, { backgroundColor: theme.bg2, borderColor: theme.line }]}>
            <AppIcon icon={Clock3} size={14} color={theme.ink2} />
            <Text style={[styles.modeChipText, { color: theme.ink2 }]}>{formattedTime}</Text>
          </View>
        )}
        {state.movesRemaining != null && (
          <View style={[styles.modeChip, { backgroundColor: theme.bg2, borderColor: theme.line }]}>
            <Text style={[styles.modeChipText, { color: theme.ink2 }]}>Moves: {state.movesRemaining}</Text>
          </View>
        )}
      </View>

      <GhostReplayHud
        theme={theme}
        visible={isReplayingBest && !!bestReplay}
        boardWidth={boardWidth}
        currentStep={state.replayMoves.length}
        totalSteps={bestReplay?.replay_moves.length ?? 0}
        targetScore={bestReplay?.score ?? 0}
        targetMaxTile={bestReplay?.max_tile ?? 0}
        moves={bestReplay?.replay_moves ?? []}
        fromIndex={state.replayMoves.length}
      />

      <View style={{ width: boardWidth, position: 'relative' }} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <Board
          tiles={state.tiles}
          ghostOverlayTiles={ghostOverlayTiles}
          blockedCells={state.blockedCells}
          size={state.size}
          boardWidth={boardWidth}
          palette={settings.palette}
          showNumbers={settings.showNumbers}
          tileStyle={settings.tileStyle}
          theme={theme}
        />
        {awaitingTimedStart && (
          <TimedStartOverlay theme={theme} onStart={handleTimedStart} />
        )}
        {showOverlay && (
          <GameOverlay
            type={state.over ? 'over' : 'won'}
            endedBy={state.endedBy}
            theme={theme}
            onContinue={!state.over ? continueGame : undefined}
            onRestart={reset}
            onWatchBestRun={bestReplay ? handleWatchBestRun : undefined}
          />
        )}
      </View>

      <View style={[styles.footer, { width: boardWidth }]}>
        <View style={[styles.iconBar, { backgroundColor: theme.bg2, borderColor: theme.line }]}>
          <FooterBtn
            icon={<AppIcon icon={RotateCcw} color={theme.ink2} size={21} />}
            onPress={reset}
            theme={theme}
            title="Restart"
            disabled={isReplayingBest || awaitingTimedStart}
          />
          <FooterBtn
            icon={<AppIcon icon={Undo2} color={theme.ink2} size={21} />}
            onPress={handleUndo}
            theme={theme}
            title="Undo"
            disabled={isReplayingBest || awaitingTimedStart}
          />
          <FooterBtn
            icon={
              <AppIcon
                icon={settings.themeName === 'dim' ? Sun : Moon}
                color={theme.ink2}
                size={21}
              />
            }
            onPress={() => updateSettings({ themeName: settings.themeName === 'dim' ? 'light' : 'dim' })}
            theme={theme}
            title="Toggle theme"
          />
          <FooterBtn
            icon={<AppIcon icon={Settings} color={theme.ink2} size={21} />}
            onPress={() => setShowSettings(true)}
            theme={theme}
            title="Settings"
          />
          <FooterBtn
            icon={<AppIcon icon={CircleQuestionMark} color={theme.ink2} size={21} />}
            onPress={() => setShowHelp(true)}
            theme={theme}
            title="Help"
          />
          <FooterBtn
            icon={<AppIcon icon={Trophy} color={theme.ink2} size={21} />}
            onPress={() => router.push(user ? '/leaderboard' : '/auth')}
            theme={theme}
            title="Leaderboard"
          />
          <FooterBtn
            icon={
              <AppIcon icon={user ? UserRound : User} color={theme.ink2} size={21} />
            }
            onPress={() => router.push(user ? '/profile' : '/auth')}
            theme={theme}
            title={user ? 'Profile' : 'Sign in'}
          />
        </View>
        <View style={styles.hintRow}>
          <Text style={[styles.hint, { color: theme.ink3 }]}>
            {isReplayingBest ? 'Playing your best run…' : 'Swipe to merge'}
          </Text>
          <Pressable
            onPress={() => setShowShareMenu(true)}
            style={[styles.shareBtn, { borderColor: theme.line, backgroundColor: theme.bg2 }]}
          >
            <AppIcon icon={Share2} size={14} color={theme.ink2} />
            <Text style={[styles.shareBtnText, { color: theme.ink2 }]}>Share</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.shareCardOffscreen} pointerEvents="none">
        <ShareScoreCard
          ref={shareCardRef}
          template={shareCardTemplate}
          theme={theme}
          palette={settings.palette}
          tiles={state.tiles}
          blockedCells={state.blockedCells}
          gridSize={state.size}
          showNumbers={settings.showNumbers}
          tileStyle={settings.tileStyle}
          score={state.score}
          modeLabel={GAME_MODES[state.modeId].label}
          maxTile={state.maxTile}
          targetTile={modeRules.targetTile}
          displayName={shareDisplayName}
        />
      </View>

      <HelpModal visible={showHelp} theme={theme} onClose={() => setShowHelp(false)} />
      <SettingsModal visible={showSettings} onClose={() => setShowSettings(false)} />
      <ShareMenuModal
        visible={showShareMenu}
        theme={theme}
        canShareRunData={state.replayMoves.length > 0}
        allowImageActions={Platform.OS === 'ios' || Platform.OS === 'android'}
        shareCardTemplate={shareCardTemplate}
        onChangeShareCardTemplate={setShareCardTemplate}
        onClose={() => setShowShareMenu(false)}
        onShareImage={runShareScoreImage}
        onSaveImage={runSaveScoreImage}
        onShareRunData={handleShareRun}
      />
    </SafeAreaView>
    {tourPending ? <FirstLaunchTourModal theme={theme} onComplete={completeTour} /> : null}
    </>
  );
}

function FooterBtn({
  label, icon, onPress, theme, title, disabled,
}: {
  label?: string; icon?: React.ReactNode;
  onPress: () => void; theme: Theme; title: string; disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.footerBtn,
        {
          backgroundColor: pressed && !disabled ? theme.bg2 : 'transparent',
          opacity: disabled ? 0.35 : 1,
        },
      ]}
    >
      {icon ?? <Text style={[styles.footerBtnText, { color: theme.ink2 }]}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, paddingVertical: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 34, fontFamily: 'Fraunces_300Light', letterSpacing: -0.7 },
  titleItalic: { fontFamily: 'Fraunces_300Light_Italic' },
  scores: { flexDirection: 'row', gap: 8 },
  footer: { alignItems: 'center', gap: 8 },
  modeBar: { flexDirection: 'row', gap: 8, marginTop: -8, marginBottom: -8 },
  modeChip: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modeChipText: { fontSize: 11, fontWeight: '500', letterSpacing: 0.2 },
  iconBar: {
    flexDirection: 'row', gap: 6,
    paddingVertical: 6, paddingHorizontal: 8,
    borderRadius: 18, borderWidth: 1,
  },
  footerBtn: { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  footerBtnText: { fontSize: 20 },
  hint: { fontSize: 12, letterSpacing: 0.2 },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  shareBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shareBtnText: { fontSize: 11, fontWeight: '500' },
  shareCardOffscreen: {
    position: 'absolute',
    left: -2000,
    top: 0,
    width: SHARE_CARD_W,
    height: SHARE_CARD_H,
    opacity: 1,
  },
});
