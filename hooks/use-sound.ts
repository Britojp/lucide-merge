import { useRef, useCallback } from 'react';
import type { WebView } from 'react-native-webview';

export type SoundEvent = 'merge' | 'swipe' | 'spawn' | 'undo' | 'victory' | 'gameover';

export function useSound() {
  const ref = useRef<WebView>(null);

  const play = useCallback((event: SoundEvent, value = 0) => {
    ref.current?.injectJavaScript(
      `window.playSound && window.playSound('${event}', ${value}); true;`
    );
  }, []);

  const setSfx = useCallback((enabled: boolean) => {
    ref.current?.injectJavaScript(
      `window.setSfxEnabled && window.setSfxEnabled(${enabled}); true;`
    );
  }, []);

  return { audioRef: ref, play, setSfx };
}
