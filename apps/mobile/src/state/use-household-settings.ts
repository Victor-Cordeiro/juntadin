import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { usePrototype } from '@/state/prototype-context';

export type NotificationSettings = {
  limitAlerts: boolean;
  recurringDue: boolean;
  weeklySummary: boolean;
  partnerActivity: boolean;
};

export type HouseholdSettings = {
  enabled: boolean;
  familyName: string;
  monthlyLimitCents: string | null;
  inviteCode: string | null;
  currency: string;
  timezone: string;
  /** Local file path of the profile photo — lives only on this install. */
  photoUri: string | null;
  partnerPhotoUri: string | null;
  /** Category name → limit in cents, as a string so it survives JSON round-trips. */
  categoryLimits: Record<string, string>;
  notifications: NotificationSettings;
};

const initialNotifications: NotificationSettings = { limitAlerts: true, recurringDue: true, weeklySummary: false, partnerActivity: false };
const initial: HouseholdSettings = {
  enabled: false, familyName: '', monthlyLimitCents: null, inviteCode: null,
  currency: 'BRL', timezone: 'America/Sao_Paulo', categoryLimits: {}, notifications: initialNotifications,
  photoUri: null, partnerPhotoUri: null,
};

const key = (userId: string) => `@juntadin/household-settings/${userId}`;

type Value = {
  settings: HouseholdSettings;
  ready: boolean;
  update(changes: Partial<HouseholdSettings>): void;
  generateInvite(): string;
};

const Context = createContext<Value | null>(null);

/**
 * One shared copy of the settings for the whole app. Screens must not each hold their
 * own, or a change saved on one screen is invisible to every screen already mounted.
 */
export function HouseholdProvider({ children }: PropsWithChildren) {
  const { session } = usePrototype();
  const userId = session?.id;
  // Keyed by the user it belongs to, so switching account never shows the previous
  // person's settings and the state needs no effect to correct itself afterwards.
  const [loaded, setLoaded] = useState<{ userId: string; settings: HouseholdSettings } | null>(null);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    AsyncStorage.getItem(key(userId))
      .then((raw) => {
        if (!active) return;
        const saved = raw ? JSON.parse(raw) : {};
        setLoaded({ userId, settings: { ...initial, ...saved, notifications: { ...initialNotifications, ...(saved.notifications ?? {}) }, categoryLimits: saved.categoryLimits ?? {} } });
      })
      .catch(() => { if (active) setLoaded({ userId, settings: initial }); });
    return () => { active = false; };
  }, [userId]);

  const isCurrent = Boolean(userId) && loaded?.userId === userId;
  const settings = isCurrent && loaded ? loaded.settings : initial;
  const ready = !userId || isCurrent;

  const update = useCallback((changes: Partial<HouseholdSettings>) => {
    if (!userId) return;
    setLoaded((current) => {
      const base = current?.userId === userId ? current.settings : initial;
      const next = { ...base, ...changes };
      AsyncStorage.setItem(key(userId), JSON.stringify(next)).catch(() => undefined);
      return { userId, settings: next };
    });
  }, [userId]);

  const generateInvite = useCallback(() => {
    const code = Math.random().toString(36).slice(2, 10).toUpperCase();
    update({ enabled: true, inviteCode: code });
    return code;
  }, [update]);

  const value = useMemo<Value>(() => ({ settings, ready, update, generateInvite }), [generateInvite, ready, settings, update]);
  return createElement(Context.Provider, { value }, children);
}

export function useHouseholdSettings(): Value {
  const value = useContext(Context);
  if (!value) throw new Error('useHouseholdSettings must be used inside HouseholdProvider');
  return value;
}
