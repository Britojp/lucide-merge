import React, {
  createContext, useContext, useState, useEffect, useCallback, useRef,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTheme } from '@/constants/theme';
import type { Theme, PaletteName, ThemeName, TileStyle, GridSize } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/utils/supabase';
import type { GameModeId } from '@/lib/game-modes';

export interface AppSettings {
  size: GridSize;
  palette: PaletteName;
  themeName: ThemeName;
  tileStyle: TileStyle;
  showNumbers: boolean;
  sfxEnabled: boolean;
  modeId: GameModeId;
}

const DEFAULTS: AppSettings = {
  size: 4,
  palette: 'pastel',
  themeName: 'light',
  tileStyle: 'matte',
  showNumbers: true,
  sfxEnabled: true,
  modeId: 'classic',
};

const STORAGE_KEY = 'lucid.settings';

interface SettingsContextValue {
  settings: AppSettings;
  theme: Theme;
  updateSettings: (partial: Partial<AppSettings>) => void;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULTS,
  theme: getTheme('light'),
  updateSettings: () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);
  const [ready, setReady] = useState(false);
  const { user } = useAuth();
  const syncTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Load from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        try {
          setSettings(s => ({ ...s, ...JSON.parse(raw) }));
        } catch {}
      }
      setReady(true);
    });
  }, []);

  // On login: pull cloud settings and merge (cloud wins)
  useEffect(() => {
    if (!user || !ready) return;
    supabase
      .from('profiles')
      .select('settings')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        const cloud = data?.settings;
        if (cloud && typeof cloud === 'object' && Object.keys(cloud).length > 0) {
          setSettings(s => {
            const merged = { ...s, ...cloud };
            AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            return merged;
          });
        }
      });
  }, [user?.id, ready]);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...partial };
      // Persist locally immediately
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      // Debounce cloud sync
      if (user) {
        clearTimeout(syncTimer.current);
        syncTimer.current = setTimeout(() => {
          supabase
            .from('profiles')
            .update({ settings: next })
            .eq('id', user.id);
        }, 800);
      }
      return next;
    });
  }, [user]);

  const theme = getTheme(settings.themeName);

  return (
    <SettingsContext.Provider value={{ settings, theme, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
