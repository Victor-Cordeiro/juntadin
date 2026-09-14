import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

export type HouseholdSettings = {
  enabled: boolean;
  familyName: string;
  monthlyLimitCents: string | null;
  inviteCode: string | null;
};

const initial: HouseholdSettings = { enabled: false, familyName: '', monthlyLimitCents: null, inviteCode: null };
const key = (userId: string) => `@juntadin/household-settings/${userId}`;

export function useHouseholdSettings(userId?: string) {
  const [settings, setSettings] = useState(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!userId) return;
    AsyncStorage.getItem(key(userId))
      .then((raw) => setSettings(raw ? { ...initial, ...JSON.parse(raw) } : initial))
      .finally(() => setReady(true));
  }, [userId]);

  const update = useCallback((changes: Partial<HouseholdSettings>) => {
    if (!userId) return;
    setSettings((current) => {
      const next = { ...current, ...changes };
      AsyncStorage.setItem(key(userId), JSON.stringify(next)).catch(() => undefined);
      return next;
    });
  }, [userId]);

  const generateInvite = useCallback(() => {
    const code = Math.random().toString(36).slice(2, 10).toUpperCase();
    update({ enabled: true, inviteCode: code });
    return code;
  }, [update]);

  return { settings, ready, update, generateInvite };
}
