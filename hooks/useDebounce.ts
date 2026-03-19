'use client';

import { useRef, useCallback } from 'react';

/**
 * Returns a wrapped version of the callback that ignores rapid successive calls.
 * Useful for protecting submit buttons against double-clicks / accidental re-taps.
 *
 * @param callback  The function to guard.
 * @param delayMs   Minimum interval between calls (default 1 000 ms).
 */
export function useDebounceCallback<T extends (...args: any[]) => any>(
  callback: T,
  delayMs = 1000,
) {
  const lastCall = useRef(0);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall.current < delayMs) return;
      lastCall.current = now;
      return callback(...args);
    },
    [callback, delayMs],
  ) as (...args: Parameters<T>) => ReturnType<T> | undefined;
}
