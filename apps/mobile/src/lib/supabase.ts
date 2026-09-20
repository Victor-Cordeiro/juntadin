import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const isWebServer = Platform.OS === 'web' && typeof window === 'undefined';

const serverStorage = {
  getItem: async () => null,
  setItem: async () => undefined,
  removeItem: async () => undefined,
};

const secureStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  }),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const isSupabaseConfigured = Boolean(url && publishableKey && !publishableKey.includes('replace-with'));

export const supabase = isSupabaseConfigured
  ? createClient(url!, publishableKey!, {
      auth: {
        storage: isWebServer ? serverStorage : Platform.OS === 'web' ? AsyncStorage : secureStorage,
        autoRefreshToken: !isWebServer,
        persistSession: !isWebServer,
        detectSessionInUrl: Platform.OS === 'web' && !isWebServer,
      },
    })
  : null;
