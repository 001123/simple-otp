/**
 * Biometric Authentication Service
 *
 * Wraps expo-local-authentication with hardware checks, enrollment verification,
 * PIN fallback, and SecureStore-backed configuration persistence.
 */

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

export const BIOMETRIC_LOCK_STORE_KEY = 'simpleotp_biometric_lock_enabled';

export type BiometricType = 'FINGERPRINT' | 'FACIAL_RECOGNITION' | 'IRIS';

export interface BiometricAvailability {
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedTypes: BiometricType[];
  canAuthenticate: boolean;
  securityLevel: LocalAuthentication.SecurityLevel;
}

export interface BiometricAuthResult {
  success: boolean;
  error?: LocalAuthentication.LocalAuthenticationError | string;
  warning?: string;
}

export interface BiometricAuthOptions {
  promptMessage?: string;
  cancelLabel?: string;
  fallbackLabel?: string;
  disableDeviceFallback?: boolean;
}

/**
 * Checks hardware availability, enrollment status, and supported biometric types.
 */
export async function checkBiometricAvailability(): Promise<BiometricAvailability> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) {
      return {
        hasHardware: false,
        isEnrolled: false,
        supportedTypes: [],
        canAuthenticate: false,
        securityLevel: LocalAuthentication.SecurityLevel.NONE,
      };
    }

    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const rawTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const securityLevel = await LocalAuthentication.getEnrolledLevelAsync();

    const supportedTypes: BiometricType[] = (rawTypes ?? []).map((type) => {
      switch (type) {
        case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
          return 'FACIAL_RECOGNITION';
        case LocalAuthentication.AuthenticationType.IRIS:
          return 'IRIS';
        case LocalAuthentication.AuthenticationType.FINGERPRINT:
        default:
          return 'FINGERPRINT';
      }
    });

    return {
      hasHardware: true,
      isEnrolled,
      supportedTypes,
      canAuthenticate: hasHardware && isEnrolled,
      securityLevel,
    };
  } catch {
    return {
      hasHardware: false,
      isEnrolled: false,
      supportedTypes: [],
      canAuthenticate: false,
      securityLevel: LocalAuthentication.SecurityLevel.NONE,
    };
  }
}

/**
 * Invokes native biometric prompt with system passcode/PIN fallback.
 */
export async function authenticateWithBiometrics(
  promptMessage = 'Xác thực để mở Simple OTP',
  options?: BiometricAuthOptions
): Promise<BiometricAuthResult> {
  try {
    const availability = await checkBiometricAvailability();
    if (!availability.hasHardware) {
      return { success: false, error: 'not_available' };
    }
    if (!availability.isEnrolled) {
      return { success: false, error: 'not_enrolled' };
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: options?.cancelLabel ?? 'Huỷ bỏ',
      fallbackLabel: options?.fallbackLabel ?? 'Sử dụng mật mã máy',
      disableDeviceFallback: options?.disableDeviceFallback ?? false, // Allows device PIN/passcode fallback
      biometricsSecurityLevel: 'strong',
      requireConfirmation: true,
    });

    if (result.success) {
      return { success: true };
    }

    return {
      success: false,
      error: result.error,
      warning: result.warning,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: message || 'unknown',
    };
  }
}

/**
 * Checks whether biometric vault locking is enabled in user settings.
 */
export async function isBiometricLockEnabled(): Promise<boolean> {
  try {
    const value = await SecureStore.getItemAsync(BIOMETRIC_LOCK_STORE_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

/**
 * Alias for isBiometricLockEnabled to conform to naming conventions.
 */
export const getBiometricLockSetting = isBiometricLockEnabled;

/**
 * Updates biometric lock configuration with mandatory authentication verification.
 */
export async function setBiometricLockEnabled(
  enabled: boolean,
  verifyWithAuth = true
): Promise<{ success: boolean; error?: string }> {
  try {
    if (enabled) {
      const avail = await checkBiometricAvailability();
      if (!avail.canAuthenticate) {
        return { success: false, error: 'BIOMETRICS_UNAVAILABLE' };
      }
      if (verifyWithAuth) {
        const auth = await authenticateWithBiometrics('Xác nhận kích hoạt khoá sinh trắc học');
        if (!auth.success) {
          return { success: false, error: typeof auth.error === 'string' ? auth.error : 'auth_failed' };
        }
      }
      await SecureStore.setItemAsync(BIOMETRIC_LOCK_STORE_KEY, 'true', {
        keychainAccessible: SecureStore.WHEN_UNLOCKED,
      });
      return { success: true };
    } else {
      if (verifyWithAuth) {
        const auth = await authenticateWithBiometrics('Xác nhận tắt khoá sinh trắc học');
        if (!auth.success) {
          return { success: false, error: typeof auth.error === 'string' ? auth.error : 'auth_failed' };
        }
      }
      await SecureStore.setItemAsync(BIOMETRIC_LOCK_STORE_KEY, 'false', {
        keychainAccessible: SecureStore.WHEN_UNLOCKED,
      });
      return { success: true };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message || 'storage_error' };
  }
}

/**
 * Alias for setBiometricLockEnabled to conform to naming conventions.
 */
export const setBiometricLockSetting = setBiometricLockEnabled;
