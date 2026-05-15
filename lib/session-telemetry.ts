import { Platform } from 'react-native';

export type SessionStatsPayload = {
  undos: number;
  spawns: number;
  platform: string;
};

export function createSessionStatsSnapshot(undos: number, spawns: number): SessionStatsPayload {
  return {
    undos,
    spawns,
    platform: Platform.OS,
  };
}
