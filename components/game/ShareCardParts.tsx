import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Theme, PaletteName } from '@/constants/theme';
import { getTileColor, getTileFg } from '@/constants/theme';
import { formatShareScore } from '@/lib/format-share-score';
import type { LeaderboardRankSnapshot } from '@/lib/share-leaderboard-rank';

export function ShareCardLogo({ palette }: { palette: PaletteName }) {
  const fg = getTileFg(palette);
  return (
    <View style={logoStyles.wrap}>
      <View style={[logoStyles.tile, { backgroundColor: getTileColor(palette, 2), left: 0, top: 1, zIndex: 1 }]} />
      <View
        style={[logoStyles.tile, { backgroundColor: getTileColor(palette, 4), left: 11, top: 0, zIndex: 2 }]}
      />
      <View
        style={[logoStyles.tile, logoStyles.tileFront, { backgroundColor: getTileColor(palette, 8), left: 5, top: 11, zIndex: 3 }]}
      >
        <Text style={[logoStyles.tileNum, { color: fg }]}>4</Text>
      </View>
    </View>
  );
}

export function ShareCardBrandHeader({ theme }: { theme: Theme }) {
  return (
    <View style={brandStyles.row}>
      <Text style={[brandStyles.wordmark, { color: theme.ink }]}>
        Lucid <Text style={brandStyles.wordmarkItalic}>Merge</Text>
      </Text>
    </View>
  );
}

export function ShareCardModePill({
  label,
  theme,
}: {
  label: string;
  theme: Theme;
}) {
  return (
    <View style={[pillStyles.pill, { backgroundColor: theme.bg, borderColor: theme.line }]}>
      <View style={[pillStyles.dot, { backgroundColor: getTileColor('pastel', 4) }]} />
      <Text style={[pillStyles.text, { color: theme.ink2 }]}>{label}</Text>
    </View>
  );
}

export function ShareCardHeroRankFooter({
  rank,
  theme,
  showTopPercent,
  inline,
}: {
  rank: LeaderboardRankSnapshot | null;
  theme: Theme;
  showTopPercent: boolean;
  inline?: boolean;
}) {
  if (!rank || rank.position <= 0) return null;

  return (
    <View style={[rankStyles.wrap, inline ? rankStyles.wrapInline : null]}>
      {showTopPercent ? (
        <Text style={[rankStyles.position, { color: theme.ink }]}>#{rank.position}</Text>
      ) : null}
      <Text
        style={[
          showTopPercent ? rankStyles.rest : rankStyles.restAchievement,
          { color: theme.ink3 },
        ]}
      >
        {showTopPercent ? '' : `#${rank.position} `}
        of {formatShareScore(rank.total)}
        {showTopPercent ? ` · top ${rank.topPercent}%` : ''}
      </Text>
    </View>
  );
}

const logoStyles = StyleSheet.create({
  wrap: {
    width: 34,
    height: 30,
    marginRight: 10,
  },
  tile: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  tileFront: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  tileNum: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    fontVariant: ['tabular-nums'],
  },
});

const brandStyles = StyleSheet.create({
  row: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    fontSize: 22,
    fontFamily: 'Fraunces_300Light',
    letterSpacing: -0.4,
  },
  wordmarkItalic: {
    fontFamily: 'Fraunces_300Light_Italic',
  },
});

const pillStyles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  text: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.1,
  },
});

const rankStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 14,
    paddingHorizontal: 8,
  },
  wrapInline: {
    marginTop: 0,
    paddingHorizontal: 0,
  },
  position: {
    fontSize: 26,
    fontFamily: 'Fraunces_300Light_Italic',
    letterSpacing: -0.8,
    fontVariant: ['tabular-nums'],
  },
  rest: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 0.05,
  },
  restAchievement: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 0.05,
  },
});
