import type { Theme } from "@/constants/theme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface Props {
  label: string;
  value: number;
  theme: Theme;
  large?: boolean;
}

export function ScoreBox({ label, value, theme, large }: Props) {
  return (
    <View style={[styles.box]}>
      <Text style={[styles.label, { color: theme.ink3 }]}>{label}</Text>
      <Text
        style={[styles.value, { color: theme.ink, fontSize: large ? 22 : 20 }]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: "column",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 18,
    minWidth: 86,
    borderRadius: 16,
  },
  label: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  value: {
    fontFamily: "Inter_500Medium",
    marginTop: 2,
    fontVariant: ["tabular-nums"],
  },
});
