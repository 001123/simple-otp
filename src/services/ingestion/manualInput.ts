/**
 * Manual Entry Validation & Model Construction Service
 *
 * Implements input validation and account model instantiation for manual entry:
 * - Real-time sanitization of Base32 secrets (stripping whitespace, hyphens, periods)
 * - RFC 4648 Base32 validation via validateBase32 with descriptive error reporting
 * - Field-level validation: account name, optional issuer, type, algorithm, digits, period, counter
 * - Canonical OtpAccount model construction with UUID v4 and creation timestamp
 */

import * as Crypto from 'expo-crypto';
import { validateBase32, sanitizeBase32 } from '@/services/otp/base32';
import type {
  OtpAccount,
  OtpAlgorithm,
  OtpType,
  Base32ValidationResult,
} from '@/types/otp';

export interface ManualEntryFormValues {
  account: string;
  issuer?: string;
  secret: string;
  type?: OtpType | string;
  algorithm?: OtpAlgorithm | string;
  digits?: 6 | 8 | number | string;
  period?: number | string;
  counter?: number | string;
}

export interface ManualEntryValidationErrors {
  account?: string;
  issuer?: string;
  secret?: string;
  type?: string;
  algorithm?: string;
  digits?: string;
  period?: string;
  counter?: string;
}

export interface NormalizedManualEntry {
  account: string;
  issuer?: string;
  secret: string;
  type: OtpType;
  algorithm: OtpAlgorithm;
  digits: 6 | 8;
  period: number;
  counter: number;
}

export interface ManualEntryValidationResult {
  isValid: boolean;
  errors: ManualEntryValidationErrors;
  normalized?: NormalizedManualEntry;
}

/**
 * Sanitizes user input for secret keys in real-time.
 * Strips whitespace, hyphens, underscores, dots, and converts to uppercase.
 */
export function sanitizeManualSecret(secret: string): string {
  if (typeof secret !== 'string') return '';
  return sanitizeBase32(secret);
}

/**
 * Validates a manual secret key against RFC 4648 Base32 specification.
 * Returns validation status and normalized uppercase secret.
 */
export function validateManualSecret(secret: string): Base32ValidationResult {
  if (typeof secret !== 'string') {
    return { isValid: false, error: 'Secret must be a string', cleaned: '' };
  }
  return validateBase32(secret);
}

/**
 * Validates all fields of a manual entry form.
 *
 * @param form - Form input values
 * @returns Validation result with field-specific errors and normalized data if valid
 */
export function validateManualEntryForm(
  form: ManualEntryFormValues
): ManualEntryValidationResult {
  const errors: ManualEntryValidationErrors = {};

  // 1. Account Name validation (Required)
  const rawAccount = typeof form.account === 'string' ? form.account.trim() : '';
  if (!rawAccount) {
    errors.account = 'Account name is required';
  }

  // 2. Issuer validation (Optional)
  const rawIssuer = typeof form.issuer === 'string' ? form.issuer.trim() : '';
  const issuer = rawIssuer || undefined;

  // 3. Secret Key validation (Required Base32)
  const rawSecret = typeof form.secret === 'string' ? form.secret : '';
  let cleanedSecret = '';
  if (!rawSecret.trim()) {
    errors.secret = 'Secret key is required';
  } else {
    const secretValidation = validateBase32(rawSecret);
    if (!secretValidation.isValid) {
      errors.secret = secretValidation.error || 'Invalid Base32 secret';
    } else {
      cleanedSecret = secretValidation.cleaned;
    }
  }

  // 4. Type validation ('totp' | 'hotp', default 'totp')
  let type: OtpType = 'totp';
  if (form.type !== undefined && form.type !== null && form.type !== '') {
    const normalizedType = String(form.type).trim().toLowerCase();
    if (normalizedType === 'totp' || normalizedType === 'hotp') {
      type = normalizedType as OtpType;
    } else {
      errors.type = 'Invalid type: must be "totp" or "hotp"';
    }
  }

  // 5. Algorithm validation ('SHA1' | 'SHA256' | 'SHA512', default 'SHA1')
  let algorithm: OtpAlgorithm = 'SHA1';
  if (form.algorithm !== undefined && form.algorithm !== null && form.algorithm !== '') {
    const normAlgo = String(form.algorithm).trim().toUpperCase().replace(/[-_]/g, '');
    if (normAlgo === 'SHA1' || normAlgo === 'SHA256' || normAlgo === 'SHA512') {
      algorithm = normAlgo as OtpAlgorithm;
    } else {
      errors.algorithm = 'Invalid algorithm: must be SHA1, SHA256, or SHA512';
    }
  }

  // 6. Digits validation (6 | 8, default 6 when undefined; reject null, '', or non-6/8)
  let digits: 6 | 8 = 6;
  if (form.digits !== undefined) {
    if (form.digits === null || form.digits === '') {
      errors.digits = 'Invalid digits: must be 6 or 8';
    } else {
      const raw = typeof form.digits === 'string' ? form.digits.trim() : form.digits;
      if (raw === 6 || raw === '6') {
        digits = 6;
      } else if (raw === 8 || raw === '8') {
        digits = 8;
      } else {
        errors.digits = 'Invalid digits: must be 6 or 8';
      }
    }
  }

  // 7. Period validation (Positive integer, default 30 for TOTP)
  let period = 30;
  if (type === 'totp') {
    if (form.period !== undefined && form.period !== null && form.period !== '') {
      const p = typeof form.period === 'number' ? form.period : parseInt(String(form.period).trim(), 10);
      if (!isNaN(p) && p > 0 && Number.isInteger(p)) {
        period = p;
      } else {
        errors.period = 'Period must be a positive integer';
      }
    }
  }

  // 8. Counter validation (Non-negative integer, default 0 for HOTP)
  let counter = 0;
  if (type === 'hotp') {
    if (form.counter !== undefined && form.counter !== null && form.counter !== '') {
      const c = typeof form.counter === 'number' ? form.counter : parseInt(String(form.counter).trim(), 10);
      if (!isNaN(c) && c >= 0 && Number.isInteger(c)) {
        counter = c;
      } else {
        errors.counter = 'Counter must be a non-negative integer';
      }
    }
  }

  const isValid = Object.keys(errors).length === 0;

  return {
    isValid,
    errors,
    normalized: isValid
      ? {
          account: rawAccount,
          issuer,
          secret: cleanedSecret,
          type,
          algorithm,
          digits,
          period,
          counter,
        }
      : undefined,
  };
}

export function generateDefaultId(): string {
  try {
    if (typeof Crypto.randomUUID === 'function') {
      const id = Crypto.randomUUID();
      if (id) return id;
    }
  } catch {
    // Graceful fallback if native Crypto module is unavailable in test environment
  }
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Constructs an OtpAccount model from validated manual entry form values.
 * Generates a unique UUID v4 and records createdAt timestamp.
 *
 * @param form - Form input values
 * @param idGenerator - Optional custom ID generator (defaults to generateDefaultId)
 * @returns Fully constructed OtpAccount
 * @throws Error if form validation fails
 */
export function createOtpAccountFromManual(
  form: ManualEntryFormValues,
  idGenerator: () => string = generateDefaultId
): OtpAccount {
  const result = validateManualEntryForm(form);
  if (!result.isValid || !result.normalized) {
    const errorMessages = Object.entries(result.errors)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
    throw new Error(`MANUAL_ENTRY_INVALID: ${errorMessages}`);
  }

  const norm = result.normalized;
  return {
    id: idGenerator(),
    type: norm.type,
    issuer: norm.issuer,
    account: norm.account,
    secret: norm.secret,
    algorithm: norm.algorithm,
    digits: norm.digits,
    period: norm.period,
    counter: norm.counter,
    createdAt: Date.now(),
  };
}
