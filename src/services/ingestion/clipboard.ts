/**
 * Clipboard Ingestion & Auto-Detection Service
 *
 * Implements automated clipboard inspection for OTP URIs and raw Base32 secrets:
 * - Content analysis supporting both standard `otpauth://` URIs and raw Base32 secret keys (>=16 chars)
 * - Cache tracking to suppress repeated prompts for the same copied token
 * - AppState lifecycle integration for auto-detection on app resume
 * - Safe handling of iOS 16+ permission denials and non-string clipboard contents
 */

import * as Clipboard from 'expo-clipboard';
import { AppState, type AppStateStatus, type NativeEventSubscription } from 'react-native';
import { validateBase32 } from '@/services/otp/base32';
import { parseOtpAuthUri } from '@/services/otp/uriParser';
import type { OtpAccount, ParsedOtpAuthUri } from '@/types/otp';

export type ClipboardDetectionType = 'uri' | 'secret';

export interface ClipboardDetectionResult {
  detected: boolean;
  type?: ClipboardDetectionType;
  payload?: string;
  parsed?: Partial<OtpAccount> | ParsedOtpAuthUri;
}

export interface CheckClipboardOptions {
  force?: boolean; // When true, ignores lastCheckedString cache
}

// In-memory cache to prevent repeated prompts for identical clipboard contents
let lastCheckedString: string | null = null;

/**
 * Retrieves the currently cached last-checked clipboard string.
 */
export function getLastCheckedClipboard(): string | null {
  return lastCheckedString;
}

/**
 * Manually updates the cached clipboard string.
 */
export function setLastCheckedClipboard(content: string | null): void {
  lastCheckedString = content;
}

/**
 * Resets the clipboard cache, allowing the next check to re-evaluate previously seen text.
 */
export function clearClipboardCache(): void {
  lastCheckedString = null;
}

/**
 * Pure analyzer that inspects a raw string and determines if it is an OTP URI or raw Base32 secret.
 *
 * @param content - Raw string to analyze
 * @returns Detection result with detected status, type, and parsed metadata
 */
export function analyzeClipboardContent(content: string): ClipboardDetectionResult {
  if (typeof content !== 'string') {
    return { detected: false };
  }

  const trimmed = content.trim();
  if (!trimmed) {
    return { detected: false };
  }

  // 1. Check for otpauth:// URI
  if (trimmed.toLowerCase().startsWith('otpauth://')) {
    try {
      const parsed = parseOtpAuthUri(trimmed);
      return {
        detected: true,
        type: 'uri',
        payload: trimmed,
        parsed,
      };
    } catch {
      // Invalid otpauth URI format
      return { detected: false };
    }
  }

  // 2. Filter out PEM headers/blocks, cryptographic keys, and certificates
  const isPemContent =
    trimmed.startsWith('-----') ||
    /-----\s*(BEGIN|END)/i.test(trimmed) ||
    /\b(PRIVATE KEY|PUBLIC KEY|CERTIFICATE)\b/i.test(trimmed);

  if (isPemContent) {
    return { detected: false };
  }

  // 3. Check for raw Base32 secret key (>= 16 characters after delimiter sanitization)
  const sanitized = trimmed.replace(/[\s\-_.]/g, '').toUpperCase();
  if (sanitized.length >= 16) {
    const validation = validateBase32(sanitized);
    if (validation.isValid) {
      return {
        detected: true,
        type: 'secret',
        payload: validation.cleaned,
        parsed: {
          type: 'totp',
          secret: validation.cleaned,
          algorithm: 'SHA1',
          digits: 6,
          period: 30,
          counter: 0,
        },
      };
    }
  }

  return { detected: false };
}

/**
 * Checks the system clipboard for OTP content.
 * Respects cache unless options.force is true.
 *
 * @param options - Configuration options (e.g. force re-check)
 * @returns Promise resolving to ClipboardDetectionResult
 */
export async function checkClipboard(
  options: CheckClipboardOptions = {}
): Promise<ClipboardDetectionResult> {
  try {
    const hasString = await Clipboard.hasStringAsync();
    if (!hasString) {
      return { detected: false };
    }

    const raw = await Clipboard.getStringAsync();
    if (!raw || typeof raw !== 'string') {
      return { detected: false };
    }

    const trimmed = raw.trim();
    if (!trimmed) {
      return { detected: false };
    }

    // Cache check: avoid repeated prompts for the exact same text
    if (!options.force && trimmed === lastCheckedString) {
      return { detected: false };
    }

    lastCheckedString = trimmed;
    return analyzeClipboardContent(trimmed);
  } catch {
    // Graceful error handling (e.g. platform permission rejection)
    return { detected: false };
  }
}

/**
 * Alias conforming to DISPATCH.md naming
 */
export const checkClipboardForOtp = checkClipboard;

/**
 * Subscribes to AppState transitions, automatically triggering checkClipboard()
 * when the application transitions from background/inactive to active.
 *
 * @param onDetected - Callback invoked when a new OTP token or secret is found
 * @returns Unsubscribe function
 */
export function subscribeClipboardDetection(
  onDetected: (result: ClipboardDetectionResult) => void
): () => void {
  let currentAppState: AppStateStatus = AppState.currentState;

  const subscription: NativeEventSubscription = AppState.addEventListener(
    'change',
    async (nextAppState: AppStateStatus) => {
      if (
        (currentAppState === 'background' || currentAppState === 'inactive') &&
        nextAppState === 'active'
      ) {
        const result = await checkClipboard();
        if (result.detected) {
          onDetected(result);
        }
      }
      currentAppState = nextAppState;
    }
  );

  return () => {
    subscription.remove();
  };
}
