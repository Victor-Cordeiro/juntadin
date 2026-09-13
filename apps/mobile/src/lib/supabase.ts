import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const isWebServer = Platform.OS === 'web' && typeof window === 'undefined';

const serverStorage = {
  getItem: async () => null,
  setItem: async () => undefined,
  removeItem: async () => undefined,
};

export const isSupabaseConfigured = Boolean(url && publishableKey && !publishableKey.includes('replace-with'));

export const supabase = isSupabaseConfigured
  ? createClient(url!, publishableKey!, {
      auth: {
        storage: isWebServer ? serverStorage : AsyncStorage,
        autoRefreshToken: !isWebServer,
        persistSession: !isWebServer,
        detectSessionInUrl: Platform.OS === 'web' && !isWebServer,
      },
    })
  : null;
