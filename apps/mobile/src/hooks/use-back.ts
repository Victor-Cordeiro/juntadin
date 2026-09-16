import { useRouter, type Href } from 'expo-router';
import { useCallback } from 'react';

/**
 * Back navigation that still works when the stack is empty — opening a screen from a
 * deep link or reloading on it leaves nothing to pop, and router.back() would fail.
 */
export function useGoBack(fallback: Href) {
  const router = useRouter();
  return useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace(fallback);
  }, [fallback, router]);
}
