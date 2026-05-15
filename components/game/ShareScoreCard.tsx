import React, { forwardRef, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Theme, PaletteName, TileStyle } from '@/constants/theme';
import { getTileColor, getTileFg } from '@/constants/theme';
import type { Tile, BlockedCell } from '@/hooks/use-game';
import { ShareBoardSnapshot } from '@/components/game/ShareBoardSnapshot';
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
};

export const SHARE_CARD_W = 360;
export const SHARE_CARD_H = 720;
export const SHARE_BOARD_PREVIEW_W = 268;
const THUMB_BOARD = 168;
const HERO_BOARD = 264;

function MosaicChips({
  values,
  palette,
  theme,
}: {
  values: number[];
  palette: PaletteName;
  theme: Theme;
}) {
  return (
    <View style={styles.mosaicWrap}>
      {values.map(v => {
        const bg = getTileColor(palette, v);
        const fg = getTileFg(palette);
        return (
          <View
            key={v}
            style={[
              styles.mosaicChip,
              { backgroundColor: bg, borderColor: theme.line },
            ]}
          >
            <Text style={[styles.mosaicChipText, { color: fg }]}>{v}</Text>
          </View>
        );
      })}
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
  },
  ref,
) {
  const heroTileBg = getTileColor(palette, maxTile);
  const heroTileFg = getTileFg(palette);
  const maxTileBadgeBg = getTileColor(palette, maxTile);
  const maxTileBadgeFg = getTileFg(palette);

  const mosaicValues = useMemo(() => {
    const set = new Set<number>();
    for (const t of tiles) {
      if (!t.dying) set.add(t.value);
    }
    return Array.from(set).sort((a, b) => b - a).slice(0, 18);
  }, [tiles]);

  const reachedWin = maxTile >= targetTile;
  const paletteLabel = palette.charAt(0).toUpperCase() + palette.slice(1);

  const brandBlock = (
    <View style={styles.brandBlock}>
      <Text style={[styles.brand, { color: theme.ink }]}>
        Lucid <Text style={[styles.brandItalic, { color: theme.ink }]}>Merge</Text>
      </Text>
    </View>
  );

  return (
    <View
      ref={ref}
      collapsable={false}
      style={[
        styles.root,
        {
          backgroundColor: theme.bg,
          borderRadius: theme.radiusBoard + 6,
          borderWidth: 1,
          borderColor: theme.line,
        },
      ]}
    >
      <View
        style={[
          styles.inner,
          {
            backgroundColor: theme.board,
            borderRadius: theme.radiusBoard,
            borderWidth: 1,
            borderColor: theme.line,
            margin: 12,
          },
        ]}
      >
        {template === 'vertical_hero' ? (
          <View style={styles.templateBody}>
            <View style={styles.thumbBoard}>
              <ShareBoardSnapshot
                tiles={tiles}
                blockedCells={blockedCells}
                size={gridSize}
                boardWidth={THUMB_BOARD}
                palette={palette}
                showNumbers={showNumbers}
                tileStyle={tileStyle}
                theme={theme}
              />
            </View>
            {brandBlock}
            <Text style={[styles.playerName, { color: theme.ink2 }]}>{displayName}</Text>
            <Text style={[styles.heroScore, { color: theme.ink }]}>
              {score.toLocaleString()}
            </Text>
            <Text style={[styles.pointsLabel, { color: theme.ink3 }]}>points</Text>
            {mosaicValues.length > 0 ? (
              <MosaicChips values={mosaicValues} palette={palette} theme={theme} />
            ) : null}
            <View style={styles.boardSection}>
              <ShareBoardSnapshot
                tiles={tiles}
                blockedCells={blockedCells}
                size={gridSize}
                boardWidth={HERO_BOARD}
                palette={palette}
                showNumbers={showNumbers}
                tileStyle={tileStyle}
                theme={theme}
              />
            </View>
            <View style={styles.chipRow}>
              <View style={[styles.chip, { backgroundColor: theme.bg2, borderColor: theme.line }]}>
                <Text style={[styles.chipText, { color: theme.ink2 }]}>{modeLabel}</Text>
              </View>
              <View style={[styles.chip, { backgroundColor: theme.bg2, borderColor: theme.line }]}>
                <Text style={[styles.chipText, { color: theme.ink2 }]}>
                  {gridSize}×{gridSize}
                </Text>
              </View>
              <View
                style={[
                  styles.chipHero,
                  { backgroundColor: heroTileBg, borderColor: theme.line },
                ]}
              >
                <Text style={[styles.chipHeroText, { color: heroTileFg }]}>{maxTile}</Text>
                <Text style={[styles.chipHeroHint, { color: heroTileFg, opacity: 0.85 }]}>
                  max
                </Text>
              </View>
            </View>
            <View style={styles.bottomSpacer} />
            <Text style={[styles.footerLine, { color: theme.ink3 }]}>
              {paletteLabel} · swipe to merge
            </Text>
          </View>
        ) : (
          <View style={styles.templateBody}>
            <View style={styles.thumbBoard}>
              <ShareBoardSnapshot
                tiles={tiles}
                blockedCells={blockedCells}
                size={gridSize}
                boardWidth={THUMB_BOARD}
                palette={palette}
                showNumbers={showNumbers}
                tileStyle={tileStyle}
                theme={theme}
              />
            </View>
            {brandBlock}
            <View
              style={[
                styles.achievementBadge,
                {
                  backgroundColor: maxTileBadgeBg,
                  borderColor: theme.line,
                },
              ]}
            >
              <Text style={[styles.achievementBadgeNum, { color: maxTileBadgeFg }]}>{maxTile}</Text>
            </View>
            <Text style={[styles.achieveLine1, { color: theme.ink2 }]}>
              {displayName}
              <Text style={{ color: theme.ink3 }}> reached</Text>
            </Text>
            <Text style={[styles.achieveLine2, { color: theme.ink }]}>
              {reachedWin
                ? SHARE_CARD_PALETTE_TAGLINE[palette]
                : `toward ${targetTile}.`}
            </Text>
            <Text style={[styles.achieveScore, { color: theme.ink }]}>
              {score.toLocaleString()}
              <Text style={[styles.achievePts, { color: theme.ink3 }]}> pts</Text>
            </Text>
            <Text style={[styles.achieveMeta, { color: theme.ink2 }]}>
              {modeLabel} {gridSize}×{gridSize}
            </Text>
            <View style={styles.boardSectionTight}>
              <ShareBoardSnapshot
                tiles={tiles}
                blockedCells={blockedCells}
                size={gridSize}
                boardWidth={SHARE_BOARD_PREVIEW_W}
                palette={palette}
                showNumbers={showNumbers}
                tileStyle={tileStyle}
                theme={theme}
              />
            </View>
            <View style={styles.bottomSpacer} />
            <Text style={[styles.footerLine, { color: theme.ink3 }]}>
              Lucid Merge · {paletteLabel}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    width: SHARE_CARD_W,
    height: SHARE_CARD_H,
    overflow: 'hidden',
  },
  inner: {
    flex: 1,
    overflow: 'hidden',
  },
  templateBody: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    alignItems: 'center',
  },
  thumbBoard: {
    marginBottom: 6,
  },
  brandBlock: {
    marginTop: 4,
    marginBottom: 6,
  },
  brand: {
    fontSize: 24,
    fontFamily: 'Fraunces_300Light',
    letterSpacing: -0.45,
    textAlign: 'center',
  },
  brandItalic: {
    fontFamily: 'Fraunces_300Light_Italic',
  },
  playerName: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    marginBottom: 2,
    textAlign: 'center',
  },
  heroScore: {
    fontSize: 48,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  pointsLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    marginTop: 2,
    marginBottom: 8,
    textTransform: 'lowercase',
  },
  mosaicWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    maxWidth: 320,
    marginBottom: 10,
  },
  mosaicChip: {
    minWidth: 36,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  mosaicChipText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontVariant: ['tabular-nums'],
  },
  boardSection: {
    marginTop: 4,
    marginBottom: 8,
  },
  boardSectionTight: {
    marginTop: 8,
    marginBottom: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  chip: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 7,
    paddingHorizontal: 11,
  },
  chipText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.15,
  },
  chipHero: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 7,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
  },
  chipHeroText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    fontVariant: ['tabular-nums'],
  },
  chipHeroHint: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    textTransform: 'lowercase',
  },
  achievementBadge: {
    marginTop: 8,
    marginBottom: 10,
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 22,
    borderWidth: 1,
  },
  achievementBadgeNum: {
    fontSize: 52,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  achieveLine1: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  achieveLine2: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 4,
    marginBottom: 10,
    paddingHorizontal: 12,
  },
  achieveScore: {
    fontSize: 28,
    fontFamily: 'Inter_600SemiBold',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  achievePts: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
  },
  achieveMeta: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    marginTop: 6,
    marginBottom: 4,
    textAlign: 'center',
  },
  footerLine: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 0.12,
    textAlign: 'center',
  },
  bottomSpacer: {
    flex: 1,
    minHeight: 6,
    width: '100%',
  },
});
