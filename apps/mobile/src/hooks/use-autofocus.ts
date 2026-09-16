import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import type { TextInput } from 'react-native';

// autoFocus is unreliable on a pushed screen: the outgoing screen stays mounted
// through the transition and takes the focus back. Focusing once the screen is
// the active route keeps the keyboard opening on every entry.
export function useAutoFocus() {
  const ref = useRef<TextInput>(null);
  useFocusEffect(useCallback(() => {
    const timer = setTimeout(() => ref.current?.focus(), 120);
    return () => clearTimeout(timer);
  }, []));
  return ref;
}
