import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SHARE_CARD_TEMPLATE_STORAGE_KEY,
  type ShareCardTemplateId,
} from '@/lib/share-card-templates';

function isTemplateId(x: string): x is ShareCardTemplateId {
  return x === 'vertical_hero' || x === 'vertical_achievement';
}

export function useShareCardTemplate() {
  const [template, setTemplateState] = useState<ShareCardTemplateId>('vertical_hero');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(SHARE_CARD_TEMPLATE_STORAGE_KEY).then(raw => {
      if (cancelled) return;
      if (raw && isTemplateId(raw)) setTemplateState(raw);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setTemplate = useCallback((next: ShareCardTemplateId) => {
    setTemplateState(next);
    AsyncStorage.setItem(SHARE_CARD_TEMPLATE_STORAGE_KEY, next);
  }, []);

  return { shareCardTemplate: template, setShareCardTemplate: setTemplate, shareCardTemplateReady: ready };
}
