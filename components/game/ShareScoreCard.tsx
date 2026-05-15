import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Theme, PaletteName, TileStyle } from '@/constants/theme';
import { getTileColor, getTileFg } from '@/constants/theme';
import type { Tile, BlockedCell } from '@/hooks/use-game';
import { ShareBoardSnapshot } from '@/components/game/ShareBoardSnapshot';
import {
  ShareCardBrandHeader,
  ShareCardHeroRankFooter,
  ShareCardLogo,
  ShareCardModePill,
} from '@/components/game/ShareCardParts';
import { formatShareScore } from '@/lib/format-share-score';
import type { LeaderboardRankSnapshot } from '@/lib/share-leaderboard-rank';
import {
  SHARE_CARD_PALETTE_TAGLINE,
  type ShareCardTemplateId,
} from '@/lib/share-card-templates';

export type ShareScoreCardProps = {
  template: ShareCardTemplateId;
  theme: Theme;
  palette: PaletteName;
  tiles: Tile[];
  blockedCells: BlockedCell[];
  gridSize: number;
  showNumbers: boolean;
  tileStyle: TileStyle;
  score: number;
  modeLabel: string;
  maxTile: number;
  targetTile: number;
  displayName: string;
  leaderboardRank: LeaderboardRankSnapshot | null;
};

export const SHARE_CARD_W = 360;
export const SHARE_CARD_H = 720;
const HERO_BOARD_W = 300;

function ShareCardBrandRow({ theme, palette }: { theme: Theme; palette: PaletteName }) {
  return (
    <View style={styles.brandRow}>
      <ShareCardLogo palette={palette} />
      <ShareCardBrandHeader theme={theme} />
    </View>
  );
}

function ShareCardFooter({
  modeLabel,
  gridSize,
  theme,
  rank,
  showTopPercent,
}: {
  modeLabel: string;
  gridSize: number;
  theme: Theme;
  rank: LeaderboardRankSnapshot | null;
  showTopPercent: boolean;
}) {
  const modePillLabel = `${modeLabel} ${gridSize}×${gridSize}`;

  if (showTopPercent) {
    return (
      <View style={styles.footerHero}>
        <ShareCardModePill label={modePillLabel} theme={theme} />
        <ShareCardHeroRankFooter rank={rank} theme={theme} showTopPercent />
      </View>
    );
  }

  return (
    <View style={styles.footerAchievement}>
      <ShareCardModePill label={modePillLabel} theme={theme} />
      <ShareCardHeroRankFooter rank={rank} theme={theme} showTopPercent={false} inline />
    </View>
  );
}

export const ShareScoreCard = forwardRef<View, ShareScoreCardProps>(function ShareScoreCard(
  {
    template,
    theme,
    palette,
    tiles,
    blockedCells,
    gridSize,
    showNumbers,
    tileStyle,
    score,
    modeLabel,
    maxTile,
    targetTile,
    displayName,
    leaderboardRank,
  },
  ref,
) {
  const heroTileBg = getTileColor(palette, maxTile);
  const heroTileFg = getTileFg(palette);
  const reachedWin = maxTile >= targetTile;
  const tagline = reachedWin
    ? SHARE_CARD_PALETTE_TAGLINE[palette]
    : `toward ${targetTile}.`;
  const formattedScore = formatShareScore(score);
  const playerCaps = displayName.trim().toUpperCase() || 'PLAYER';
  const playerTitle = displayName.trim() || 'Player';

  return (
    <View ref={ref} collapsable={false} style={[styles.root, { backgroundColor: theme.bg }]}>
      {template === 'vertical_hero' ? (
        <View style={styles.heroBody}>
          <View style={styles.heroTop}>
            <ShareCardBrandRow theme={theme} palette={palette} />
            <Text style={[styles.heroPlayer, { color: theme.ink3 }]}>{playerCaps}</Text>
            <Text style={[styles.heroScore, { color: theme.ink }]}>{formattedScore}</Text>
            <Text style={[styles.heroPoints, { color: theme.ink3 }]}>points</Text>
          </View>

          <View style={styles.heroBoardWrap}>
            <ShareBoardSnapshot
              tiles={tiles}
              blockedCells={blockedCells}
              size={gridSize}
              boardWidth={HERO_BOARD_W}
              palette={palette}
              showNumbers={showNumbers}
              tileStyle={tileStyle}
              theme={theme}
            />
          </View>

          <ShareCardFooter
            modeLabel={modeLabel}
            gridSize={gridSize}
            theme={theme}
            rank={leaderboardRank}
            showTopPercent
          />
        </View>
      ) : (
        <View style={styles.achievementBody}>
          <ShareCardBrandRow theme={theme} palette={palette} />

          <View
            style={[
              styles.achievementTile,
              {
                backgroundColor: heroTileBg,
                shadowColor: theme.ink,
              },
            ]}
          >
            <Text style={[styles.achievementTileNum, { color: heroTileFg }]}>{maxTile}</Text>
          </View>

          <Text style={[styles.achievementLead, { color: theme.ink }]}>
            {playerTitle}
            <Text style={{ color: theme.ink2 }}> reached</Text>
          </Text>
          <Text style={[styles.achievementTagline, { color: theme.ink }]}>{tagline}</Text>

          <Text style={[styles.achievementScore, { color: theme.ink }]}>
            {formattedScore}
            <Text style={[styles.achievementPts, { color: theme.ink3 }]}> pts</Text>
          </Text>

          <View style={styles.achievementSpacer} />

          <ShareCardFooter
            modeLabel={modeLabel}
            gridSize={gridSize}
            theme={theme}
            rank={leaderboardRank}
            showTopPercent={false}
          />
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    width: SHARE_CARD_W,
    height: SHARE_CARD_H,
    overflow: 'hidden',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBody: {
    flex: 1,
    paddingTop: 32,
    paddingBottom: 36,
    paddingHorizontal: 30,
    justifyContent: 'space-between',
  },
  heroTop: {
    alignItems: 'center',
    gap: 10,
  },
  heroPlayer: {
    marginTop: 6,
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 3.2,
  },
  heroScore: {
    marginTop: 4,
    fontSize: 58,
    fontFamily: 'Fraunces_300Light',
    letterSpacing: -2.5,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  heroPoints: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    textTransform: 'lowercase',
    marginTop: -4,
  },
  heroBoardWrap: {
    alignItems: 'center',
    marginVertical: 8,
  },
  footerHero: {
    alignItems: 'center',
    gap: 0,
  },
  achievementBody: {
    flex: 1,
    paddingTop: 36,
    paddingBottom: 40,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  achievementTile: {
    marginTop: 28,
    marginBottom: 22,
    width: 148,
    height: 148,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '-7deg' }],
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
    elevation: 8,
  },
  achievementTileNum: {
    fontSize: 46,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  achievementLead: {
    fontSize: 20,
    fontFamily: 'Fraunces_300Light',
    textAlign: 'center',
    lineHeight: 28,
  },
  achievementTagline: {
    marginTop: 4,
    fontSize: 20,
    fontFamily: 'Fraunces_300Light_Italic',
    textAlign: 'center',
    lineHeight: 28,
  },
  achievementScore: {
    marginTop: 22,
    fontSize: 40,
    fontFamily: 'Fraunces_300Light_Italic',
    letterSpacing: -1.2,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  achievementPts: {
    fontSize: 18,
    fontFamily: 'Inter_500Medium',
  },
  achievementSpacer: {
    flex: 1,
    minHeight: 12,
    width: '100%',
  },
  footerAchievement: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    rowGap: 10,
  },
});
