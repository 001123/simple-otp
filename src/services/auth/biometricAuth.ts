/**
 * Biometric Authentication Adapter & Facade
 * Conforming to PROJECT.md line 251 and interface specifications.
 */

import {
  checkBiometricAvailability,
  authenticateWithBiometrics,
} from '@/services/security/biometrics';

export interface BiometricAuthService {
  isBiometricAvailable(): Promise<boolean>;
  isBiometricEnrolled(): Promise<boolean>;
  authenticateUser(reason?: string): Promise<{ success: boolean; error?: string }>;
}

export class BiometricAuth implements BiometricAuthService {
  async isBiometricAvailable(): Promise<boolean> {
    const avail = await checkBiometricAvailability();
    return avail.hasHardware;
  }

  async isBiometricEnrolled(): Promise<boolean> {
    const avail = await checkBiometricAvailability();
    return avail.isEnrolled;
  }

  async authenticateUser(reason?: string): Promise<{ success: boolean; error?: string }> {
    const result = await authenticateWithBiometrics(reason);
    return {
      success: result.success,
      error: typeof result.error === 'string' ? result.error : result.error ? String(result.error) : undefined,
    };
  }
}

export const biometricAuthService = new BiometricAuth();
export * from '@/services/security/biometrics';
