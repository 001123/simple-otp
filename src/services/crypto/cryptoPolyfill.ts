/**
 * Crypto Polyfill for React Native / Expo Runtime
 *
 * Ensures standard Web Crypto API (globalThis.crypto) is available in environments
 * like React Native Hermes/JSC where globalThis.crypto is undefined by default.
 * Backed natively by expo-crypto (iOS SecRandomCopyBytes / Android SecureRandom).
 */

import * as Crypto from 'expo-crypto';

// Polyfill globalThis.crypto if missing or incomplete safely
try {
  if (typeof globalThis.crypto === 'undefined') {
    try {
      (globalThis as unknown as { crypto: Partial<globalThis.Crypto> }).crypto = {};
    } catch {
      // Ignore if crypto property cannot be set on globalThis
    }
  }

  if (globalThis.crypto) {
    if (!globalThis.crypto.getRandomValues) {
      try {
        globalThis.crypto.getRandomValues = <T extends ArrayBufferView | null>(array: T): T => {
          if (!array) return array;
          return Crypto.getRandomValues(array as any) as unknown as T;
        };
      } catch {
        try {
          Object.defineProperty(globalThis.crypto, 'getRandomValues', {
            value: <T extends ArrayBufferView | null>(array: T): T => {
              if (!array) return array;
              return Crypto.getRandomValues(array as any) as unknown as T;
            },
            configurable: true,
            writable: true,
          });
        } catch {
          // Ignore if read-only
        }
      }
    }

    if (!globalThis.crypto.randomUUID) {
      try {
        globalThis.crypto.randomUUID = () =>
          Crypto.randomUUID() as `${string}-${string}-${string}-${string}-${string}`;
      } catch {
        try {
          Object.defineProperty(globalThis.crypto, 'randomUUID', {
            value: () => Crypto.randomUUID() as `${string}-${string}-${string}-${string}-${string}`,
            configurable: true,
            writable: true,
          });
        } catch {
          // Ignore if read-only
        }
      }
    }
  }
} catch {
  // Global defensive fallback ensures runtime does not crash
}

/**
 * Universal secure random values generator.
 * Fills typedArray with cryptographically secure random bytes across Web, Node, and React Native.
 */
export function getRandomValues<T extends ArrayBufferView>(array: T): T {
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    return globalThis.crypto.getRandomValues(array as any) as unknown as T;
  }
  return Crypto.getRandomValues(array as any) as unknown as T;
}
