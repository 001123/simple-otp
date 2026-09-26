/**
 * Crypto Polyfill for React Native / Expo Runtime
 *
 * Ensures standard Web Crypto API (globalThis.crypto) is available in environments
 * like React Native Hermes/JSC where globalThis.crypto is undefined by default.
 * Backed natively by expo-crypto (iOS SecRandomCopyBytes / Android SecureRandom).
 */

import * as Crypto from 'expo-crypto';

// Polyfill globalThis.crypto if missing or incomplete
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as unknown as { crypto: Partial<globalThis.Crypto> }).crypto = {};
}

if (!globalThis.crypto.getRandomValues) {
  globalThis.crypto.getRandomValues = <T extends ArrayBufferView | null>(array: T): T => {
    if (!array) return array;
    return Crypto.getRandomValues(array as any) as unknown as T;
  };
}

if (!globalThis.crypto.randomUUID) {
  globalThis.crypto.randomUUID = () => Crypto.randomUUID() as `${string}-${string}-${string}-${string}-${string}`;
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
