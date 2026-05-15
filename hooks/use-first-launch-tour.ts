import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ONBOARDING_STORAGE_KEY } from '@/lib/onboarding-tour';

type TourGate = 'loading' | 'pending' | 'done';

export function useFirstLaunchTour() {
  const [gate, setGate] = useState<TourGate>('loading');

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(ONBOARDING_STORAGE_KEY).then(raw => {
      if (cancelled) return;
      setGate(raw === '1' ? 'done' : 'pending');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const completeTour = useCallback(() => {
    AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, '1');
    setGate('done');
  }, []);

  return {
    tourPending: gate === 'pending',
    tourLoading: gate === 'loading',
    completeTour,
  };
}
