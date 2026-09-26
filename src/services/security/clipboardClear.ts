/**
 * src/services/security/clipboardClear.ts
 *
 * Clipboard Auto-Clear Security Service for Simple OTP.
 * Ensures temporary sensitive tokens (TOTP / HOTP codes, secret keys)
 * copied to the system clipboard are automatically wiped after 30 seconds,
 * while conditionally preserving clipboard content if replaced by the user.
 */

import * as Clipboard from 'expo-clipboard';
import { AppState, type AppStateStatus, type NativeEventSubscription } from 'react-native';

export const CLIPBOARD_CLEAR_TIMEOUT_MS = 30_000; // 30 seconds

export interface ClipboardAutoClearState {
  activeToken: string | null;
  copiedAt: number | null; // epoch ms
  timeoutMs: number;
  timerId: ReturnType<typeof setTimeout> | null;
}

export class ClipboardAutoClearManager {
  private activeToken: string | null = null;
  private copiedAt: number | null = null;
  private timeoutMs: number = CLIPBOARD_CLEAR_TIMEOUT_MS;
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private appStateSubscription: NativeEventSubscription | null = null;

  constructor() {
    this.initAppStateListener();
  }

  private initAppStateListener(): void {
    if (this.appStateSubscription || typeof AppState?.addEventListener !== 'function') {
      return;
    }
    try {
      this.appStateSubscription = AppState.addEventListener('change', async (nextState: AppStateStatus) => {
        if (nextState === 'active') {
          await this.handleResumeToActive();
        }
      });
    } catch {
      // Gracefully handle environments without AppState support
    }
  }

  /**
   * Copies sensitive token to clipboard and schedules conditional auto-clear after delayMs.
   */
  async copyWithAutoClear(
    token: string,
    delayMs: number = CLIPBOARD_CLEAR_TIMEOUT_MS
  ): Promise<boolean> {
    if (!token) return false;

    // 1. Write to system clipboard
    let success = true;
    if (typeof Clipboard?.setStringAsync === 'function') {
      try {
        await Clipboard.setStringAsync(token);
      } catch (err) {
        console.warn('[ClipboardClear] Failed to set clipboard string:', err);
        success = false;
      }
    }

    // 2. Schedule conditional auto-clear
    this.scheduleClear(token, delayMs);
    return success;
  }

  /**
   * Schedules or reschedules auto-clear for a designated token.
   */
  scheduleClear(token: string, delayMs: number = CLIPBOARD_CLEAR_TIMEOUT_MS): void {
    this.cancelPendingTimer();
    this.initAppStateListener();

    this.activeToken = token;
    this.copiedAt = Date.now();
    this.timeoutMs = delayMs;

    this.timerId = setTimeout(async () => {
      await this.executeConditionalClear(token);
    }, delayMs);
  }

  /**
   * Executes conditional clear: checks if clipboard still equals expectedToken, and if so wipes it.
   */
  private async executeConditionalClear(expectedToken: string): Promise<boolean> {
    this.cancelPendingTimer();
    const tokenToClear = expectedToken || this.activeToken;
    this.resetState();

    if (!tokenToClear) return false;

    try {
      // Defensive check for test mocks that may omit hasStringAsync or getStringAsync
      if (typeof Clipboard?.hasStringAsync === 'function') {
        const hasString = await Clipboard.hasStringAsync();
        if (!hasString) return false;
      }

      if (typeof Clipboard?.getStringAsync === 'function') {
        const currentContent = await Clipboard.getStringAsync();
        if (currentContent !== tokenToClear) {
          // User copied something else; preserve user's new clipboard content
          return false;
        }
      }

      // Clipboard still holds the sensitive token: wipe it
      if (typeof Clipboard?.setStringAsync === 'function') {
        await Clipboard.setStringAsync('');
        return true;
      }
    } catch (err) {
      console.warn('[ClipboardClear] Error performing conditional clear:', err);
    }
    return false;
  }

  /**
   * Handles app returning to active foreground from background.
   */
  private async handleResumeToActive(): Promise<void> {
    if (!this.activeToken || !this.copiedAt) return;

    const elapsed = Date.now() - this.copiedAt;
    if (elapsed >= this.timeoutMs) {
      // Expiration deadline passed while in background; clear immediately
      await this.executeConditionalClear(this.activeToken);
    } else {
      // Re-arm timer for remaining duration
      const remaining = this.timeoutMs - elapsed;
      this.cancelPendingTimer();
      this.timerId = setTimeout(async () => {
        if (this.activeToken) {
          await this.executeConditionalClear(this.activeToken);
        }
      }, remaining);
    }
  }

  /**
   * Cancels any pending auto-clear timer without modifying clipboard.
   */
  cancelClear(): void {
    this.cancelPendingTimer();
    this.resetState();
  }

  /**
   * Explicitly wipes the clipboard immediately.
   */
  async clearImmediately(): Promise<void> {
    this.cancelClear();
    if (typeof Clipboard?.setStringAsync === 'function') {
      try {
        await Clipboard.setStringAsync('');
      } catch (err) {
        console.warn('[ClipboardClear] Error clearing clipboard immediately:', err);
      }
    }
  }

  private cancelPendingTimer(): void {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  private resetState(): void {
    this.activeToken = null;
    this.copiedAt = null;
  }

  getState(): Readonly<ClipboardAutoClearState> {
    return {
      activeToken: this.activeToken,
      copiedAt: this.copiedAt,
      timeoutMs: this.timeoutMs,
      timerId: this.timerId,
    };
  }

  /**
   * Cleanup and reset helper for Jest tests.
   */
  resetForTesting(): void {
    this.cancelPendingTimer();
    this.resetState();
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }
}

// Export singleton instance and convenience helper functions
export const clipboardAutoClearManager = new ClipboardAutoClearManager();

export async function copyWithAutoClear(
  token: string,
  delayMs?: number
): Promise<boolean> {
  return clipboardAutoClearManager.copyWithAutoClear(token, delayMs);
}

export function scheduleClipboardClear(
  token: string,
  delayMs?: number
): void {
  clipboardAutoClearManager.scheduleClear(token, delayMs);
}

export function cancelClipboardClear(): void {
  clipboardAutoClearManager.cancelClear();
}

export async function clearClipboardImmediately(): Promise<void> {
  return clipboardAutoClearManager.clearImmediately();
}

export function resetClipboardAutoClearForTesting(): void {
  clipboardAutoClearManager.resetForTesting();
}
