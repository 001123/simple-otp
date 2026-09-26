/**
 * otpauth:// Key URI Parser & Serializer
 *
 * Implements the standard Google Authenticator Key URI Format specification:
 * - Scheme validation (`otpauth:`) and OTP type parsing (`totp` vs `hotp`)
 * - Label decoding with issuer prefix extraction and multiple colon handling
 * - Parameter precedence: query parameter `issuer` takes precedence over label prefix
 * - Safe unknown query parameter tolerance
 * - Strict parameter validation (`secret`, `algorithm`, `digits`, `period`, `counter`)
 * - Mutual exclusion: rejection of counter on TOTP and period on HOTP
 * - Two-way generation of standardized, compact `otpauth://` URIs
 */

import { validateBase32 } from './base32';
import type {
  OtpAccount,
  OtpAlgorithm,
  OtpType,
  ParsedOtpAuthUri,
} from '@/types/otp';

export type { OtpAccount, OtpAlgorithm, OtpType, ParsedOtpAuthUri };

/**
 * Parses a standard `otpauth://` URI into a structured OTP configuration object.
 *
 * @param uri - Raw URI string (e.g. from QR code or clipboard)
 * @returns Structured token configuration without database metadata (id, createdAt)
 * @throws Error if scheme, type, secret, or required parameters are invalid
 */
export function parseOtpAuthUri(uri: string): ParsedOtpAuthUri {
  if (!uri || typeof uri !== 'string') {
    throw new Error('URI_PARSE_ERROR: Invalid URI: URI must be a non-empty string');
  }

  const trimmed = uri.trim();
  if (!trimmed.toLowerCase().startsWith('otpauth://')) {
    throw new Error('URI_PARSE_ERROR: Invalid URI scheme. Expected otpauth://');
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`URI_PARSE_ERROR: Invalid URI syntax: ${message}`);
  }

  const rawType = (url.host || url.hostname || '').toLowerCase();
  if (rawType !== 'totp' && rawType !== 'hotp') {
    throw new Error(`URI_PARSE_ERROR: Invalid OTP type "${rawType}". Expected "totp" or "hotp"`);
  }
  const type = rawType as OtpType;

  // Extract and decode label
  const rawPath = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
  let decodedLabel: string;
  try {
    decodedLabel = decodeURIComponent(rawPath);
  } catch {
    decodedLabel = rawPath;
  }

  const params = url.searchParams;
  const queryIssuer = params.get('issuer')?.trim();

  let labelIssuer: string | undefined;
  let account: string;

  // If queryIssuer is present and label starts with `${queryIssuer}:`
  if (
    queryIssuer &&
    decodedLabel.toLowerCase().startsWith(queryIssuer.toLowerCase() + ':')
  ) {
    labelIssuer = queryIssuer;
    account = decodedLabel.slice(queryIssuer.length + 1).trim();
  } else {
    const colonIndex = decodedLabel.indexOf(':');
    if (colonIndex !== -1) {
      labelIssuer = decodedLabel.slice(0, colonIndex).trim() || undefined;
      account = decodedLabel.slice(colonIndex + 1).trim();
    } else {
      account = decodedLabel.trim();
    }
  }

  if (!account) {
    throw new Error('URI_PARSE_ERROR: Missing account name in URI label');
  }

  // Precedence rule: query parameter issuer overrides label issuer
  const resolvedIssuer = queryIssuer || labelIssuer || undefined;

  // Secret parsing & Base32 validation
  const secretParam = params.get('secret');
  if (!secretParam || !secretParam.trim()) {
    throw new Error('URI_PARSE_ERROR: Missing required parameter: secret');
  }

  const validation = validateBase32(secretParam);
  if (!validation.isValid) {
    throw new Error(`URI_PARSE_ERROR: Invalid Base32 secret: ${validation.error}`);
  }
  const secret = validation.cleaned;

  // Algorithm parsing (default: SHA1)
  let algorithm: OtpAlgorithm = 'SHA1';
  const algoParam = params.get('algorithm');
  if (algoParam && algoParam.trim()) {
    const normalized = algoParam.trim().toUpperCase().replace(/[-_]/g, '');
    if (normalized === 'SHA1' || normalized === 'SHA256' || normalized === 'SHA512') {
      algorithm = normalized as OtpAlgorithm;
    } else {
      throw new Error(`URI_PARSE_ERROR: Unsupported algorithm "${algoParam}". Must be SHA1, SHA256, or SHA512`);
    }
  }

  // Digits parsing (default: 6)
  let digits: 6 | 8 = 6;
  const digitsParam = params.get('digits');
  if (digitsParam && digitsParam.trim()) {
    const d = parseInt(digitsParam.trim(), 10);
    if (d === 6 || d === 8) {
      digits = d;
    } else {
      throw new Error(`URI_PARSE_ERROR: Invalid digits "${digitsParam}". Must be 6 or 8`);
    }
  }

  // Mutual exclusion: Check counter on TOTP and period on HOTP
  if (type === 'totp') {
    if (params.has('counter')) {
      throw new Error('URI_PARSE_ERROR: Counter parameter is invalid for TOTP');
    }
  } else {
    if (params.has('period')) {
      throw new Error('URI_PARSE_ERROR: Period parameter is invalid for HOTP');
    }
  }

  // Period parsing (default: 30 for TOTP)
  let period = 30;
  const periodParam = params.get('period');
  if (periodParam && periodParam.trim()) {
    const p = parseInt(periodParam.trim(), 10);
    if (!isNaN(p) && p > 0) {
      period = p;
    } else {
      throw new Error('URI_PARSE_ERROR: Invalid period. Must be a positive integer');
    }
  }

  // Counter parsing (required for HOTP)
  let counter = 0;
  const counterParam = params.get('counter');
  if (type === 'hotp') {
    if (counterParam === null || counterParam === undefined || counterParam.trim() === '') {
      throw new Error('URI_PARSE_ERROR: Missing required parameter for HOTP: counter');
    }
    const c = parseInt(counterParam.trim(), 10);
    if (!isNaN(c) && c >= 0) {
      counter = c;
    } else {
      throw new Error('URI_PARSE_ERROR: Invalid counter. Must be a non-negative integer');
    }
  } else if (counterParam && counterParam.trim()) {
    const c = parseInt(counterParam.trim(), 10);
    if (!isNaN(c) && c >= 0) {
      counter = c;
    }
  }

  return {
    type,
    issuer: resolvedIssuer,
    account,
    secret,
    algorithm,
    digits,
    period,
    counter,
  };
}

/**
 * Generates a standard `otpauth://` URI from an OTP account object.
 *
 * @param account - OTP account or parsed config
 * @returns Formatted `otpauth://` URI string
 */
export function generateOtpAuthUri(
  account: OtpAccount | ParsedOtpAuthUri
): string {
  const type = account.type?.toLowerCase();
  if (type !== 'totp' && type !== 'hotp') {
    throw new Error(`Invalid OTP type "${account.type}". Expected "totp" or "hotp"`);
  }

  if (!account.account || !account.account.trim()) {
    throw new Error('Missing required field: account');
  }

  if (!account.secret || !account.secret.trim()) {
    throw new Error('Missing required field: secret');
  }

  const cleanAccount = account.account.trim();
  const cleanIssuer = account.issuer?.trim();

  // Label: [Issuer:]Account
  const label = cleanIssuer
    ? `${encodeURIComponent(cleanIssuer)}:${encodeURIComponent(cleanAccount)}`
    : encodeURIComponent(cleanAccount);

  const params = new URLSearchParams();

  // Secret is unpadded uppercase Base32 without spaces or dashes
  const cleanSecret = account.secret.replace(/[\s\-_=]/g, '').toUpperCase();
  params.set('secret', cleanSecret);

  if (cleanIssuer) {
    params.set('issuer', cleanIssuer);
  }

  if (account.algorithm && account.algorithm !== 'SHA1') {
    params.set('algorithm', account.algorithm);
  }

  if (account.digits && account.digits !== 6) {
    params.set('digits', account.digits.toString());
  }

  if (type === 'totp') {
    if (account.period && account.period !== 30) {
      params.set('period', account.period.toString());
    }
  } else {
    // HOTP must include counter
    params.set('counter', (account.counter ?? 0).toString());
  }

  return `otpauth://${type}/${label}?${params.toString()}`;
}
