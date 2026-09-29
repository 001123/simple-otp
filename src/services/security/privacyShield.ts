/**
 * Privacy Shield Service
 * Manages OS-level screen capture prevention (Android FLAG_SECURE & iOS native blur)
 * and React Native AppState-driven visual cover for multitasking and biometric locking.
 */

import { AppState, type AppStateStatus, Platform } from 'react-native';
import * as ScreenCapture from 'expo-screen-capture';
import {
  isBiometricLockEnabled,
  authenticateWithBiometrics,
  isBiometricAuthenticating,
} from '@/services/security/biometrics';

export const SCREEN_CAPTURE_KEY = 'simpleotp_privacy_shield';

export type PrivacyShieldListener = (isShielded: boolean, isLocked: boolean) => void;

export class PrivacyShieldManager {
  private isShielded = false;
  private isLocked = false;
  private wasInBackground = false;
  private isUnlocking = false;
  private listeners: Set<PrivacyShieldListener> = new Set();
  private appStateSubscription: { remove: () => void } | null = null;
  private isScreenProtectionActive = false;
  private currentAppState: AppStateStatus =
    typeof AppState.currentState === 'string' ? AppState.currentState : 'active';

  /**
   * Enables OS-level screen capture prevention.
   * On Android: sets FLAG_SECURE (blanks App Switcher & blocks screenshots).
   * On iOS: enables App Switcher blur overlay and blocks recording.
   */
  async enablePrivacyShield(): Promise<void> {
    try {
      await ScreenCapture.preventScreenCaptureAsync(SCREEN_CAPTURE_KEY);
      if (Platform.OS === 'ios' && typeof ScreenCapture.enableAppSwitcherProtectionAsync === 'function') {
        await ScreenCapture.enableAppSwitcherProtectionAsync(0.8);
      }
      this.isScreenProtectionActive = true;
    } catch {
      // Gracefully handle environments without screen capture support
    }
  }

  /**
   * Disables OS-level screen capture prevention.
   */
  async disablePrivacyShield(): Promise<void> {
    try {
      await ScreenCapture.allowScreenCaptureAsync(SCREEN_CAPTURE_KEY);
      if (Platform.OS === 'ios' && typeof ScreenCapture.disableAppSwitcherProtectionAsync === 'function') {
        await ScreenCapture.disableAppSwitcherProtectionAsync();
      }
      this.isScreenProtectionActive = false;
    } catch {
      // Gracefully handle environments without screen capture support
    }
  }

  /**
   * Subscribes a listener to privacy shield visibility and lock state changes.
   */
  subscribe(listener: PrivacyShieldListener): () => void {
    this.listeners.add(listener);
    listener(this.isShielded, this.isLocked);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.isShielded, this.isLocked);
    }
  }

  /**
   * Handles React Native AppState transitions.
   */
  async handleAppStateChange(nextState: AppStateStatus): Promise<void> {
    const prevState = this.currentAppState;
    this.currentAppState = nextState;

    if (nextState === 'inactive') {
      // Synchronously mount visual shield before OS takes multitasking snapshot
      this.isShielded = true;
      this.notify();
    } else if (nextState === 'background') {
      // Mark that the app was genuinely moved to background
      this.wasInBackground = true;
      this.isShielded = true;
      this.notify();
    } else if (nextState === 'active') {
      // If a biometric prompt was currently displayed, ignore AppState transitions caused by it
      if (typeof isBiometricAuthenticating === 'function' && isBiometricAuthenticating()) {
        return;
      }

      // If an unlock is already in progress, avoid duplicate invocation
      if (this.isUnlocking) {
        return;
      }

      const resumedFromBackground = this.wasInBackground;
      this.wasInBackground = false;

      // If the app only went inactive (e.g. Face ID prompt, system alert, Control Center)
      // without entering background, do not lock the vault.
      const isTransientInactive = prevState === 'inactive' && !resumedFromBackground;

      const bioEnabled = await isBiometricLockEnabled();
      // Abort if state transitioned away from active while awaiting SecureStore
      if (this.currentAppState !== 'active') return;

      if (bioEnabled && !isTransientInactive) {
        // Biometrics required: shield remains mounted, app enters locked state
        this.isShielded = true;
        this.isLocked = true;
        this.notify();
        await this.unlockWithBiometrics();
      } else if (!this.isLocked) {
        if (this.currentAppState !== 'active') return;
        // No biometrics or transient inactive transition: immediately unshield
        this.isShielded = false;
        this.isLocked = false;
        this.notify();
      }
    }
  }

  /**
   * Starts listening to React Native AppState events.
   */
  startListening(): () => void {
    if (this.appStateSubscription) return () => this.stopListening();

    const sub = AppState.addEventListener('change', (state) => {
      this.handleAppStateChange(state);
    });
    this.appStateSubscription = sub;

    // Default initialization: check if biometric lock requires initial shield
    isBiometricLockEnabled().then((enabled) => {
      if (enabled) {
        this.isShielded = true;
        this.isLocked = true;
        this.notify();
        // Only prompt user if app is currently in active state
        if (
          this.currentAppState === 'active' &&
          (AppState.currentState === 'active' || typeof AppState.currentState !== 'string' || !AppState.currentState)
        ) {
          this.unlockWithBiometrics();
        }
      }
    });

    return () => this.stopListening();
  }

  stopListening(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }

  /**
   * Prompts user with biometrics to unlock the vault and dismiss the shield.
   */
  async unlockWithBiometrics(): Promise<boolean> {
    if (this.isUnlocking) return false;
    this.isUnlocking = true;
    try {
      const res = await authenticateWithBiometrics('Mở khoá Simple OTP');
      if (res.success) {
        // Guard against unshielding only if app was genuinely sent to background while prompt was shown
        if (this.currentAppState === 'background') return false;

        this.isLocked = false;
        this.isShielded = false;
        this.notify();
        return true;
      }
      return false;
    } finally {
      this.isUnlocking = false;
    }
  }

  // Getters and helper setters for inspection and testing
  isShieldMounted(): boolean {
    return this.isShielded;
  }

  isVaultLocked(): boolean {
    return this.isLocked;
  }

  getCurrentAppState(): AppStateStatus {
    return this.currentAppState;
  }

  isScreenCaptureProtected(): boolean {
    return this.isScreenProtectionActive;
  }

  setShieldMounted(shielded: boolean): void {
    this.isShielded = shielded;
    this.notify();
  }

  setVaultLocked(locked: boolean): void {
    this.isLocked = locked;
    this.notify();
  }
}

export const privacyShieldManager = new PrivacyShieldManager();

export async function enablePrivacyShield(): Promise<void> {
  return privacyShieldManager.enablePrivacyShield();
}

export async function disablePrivacyShield(): Promise<void> {
  return privacyShieldManager.disablePrivacyShield();
}
