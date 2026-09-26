import { hmac } from '@noble/hashes/hmac.js';
import { sha1 } from '@noble/hashes/legacy.js';
import { sha256, sha512 } from '@noble/hashes/sha2.js';
import { decodeBase32 } from './base32';
import type {
  OtpAccount,
  OtpAlgorithm,
  TotpProgress,
  VerifyTotpResult,
  VerifyHotpResult,
} from '@/types/otp';

export type {
  OtpAccount,
  OtpAlgorithm,
  TotpProgress,
  VerifyTotpResult,
  VerifyHotpResult,
};

export { parseOtpAuthUri, generateOtpAuthUri } from '../otp/uriParser';

/**
 * Normalizes algorithm identifier to standard OtpAlgorithm.
 * Supports variations like 'sha1', 'SHA-256', 'sha512'.
 */
export function normalizeAlgorithm(algo?: string): OtpAlgorithm {
  if (!algo) return 'SHA1';
  const clean = algo.toUpperCase().replace(/[-_]/g, '');
  if (clean === 'SHA1' || clean === 'SHA256' || clean === 'SHA512') {
    return clean;
  }
  throw new Error(`Unsupported algorithm: ${algo}`);
}

/**
 * Maps OtpAlgorithm to corresponding @noble/hashes hash function.
 */
function getHashFunction(algo: OtpAlgorithm) {
  switch (algo) {
    case 'SHA256':
      return sha256;
    case 'SHA512':
      return sha512;
    case 'SHA1':
    default:
      return sha1;
  }
}

/**
 * Encodes a 64-bit integer into an 8-byte big-endian Uint8Array.
 * Universal across Node and Hermes without requiring Buffer.
 */
export function counterToBytes(counter: number | bigint): Uint8Array {
  if (typeof counter === 'number' && (!Number.isFinite(counter) || !Number.isInteger(counter) || counter < 0)) {
    throw new RangeError('Counter must be a non-negative integer');
  }
  if (typeof counter === 'bigint' && counter < 0n) {
    throw new RangeError('Counter must be a non-negative integer');
  }
  const buffer = new Uint8Array(8);
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  view.setBigUint64(0, BigInt(counter), false);
  return buffer;
}

/**
 * RFC 4226 §5.3 Dynamic Truncation.
 * Extracts a 31-bit unsigned integer from an HMAC digest.
 */
export function dynamicTruncation(digest: Uint8Array): number {
  if (digest.length < 20) {
    throw new Error('HMAC digest too short for dynamic truncation');
  }
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  return binary >>> 0;
}

/**
 * Formats a binary code into a zero-padded decimal string of specified length.
 */
export function formatOtp(binaryCode: number, digits: 6 | 8 = 6): string {
  if (digits !== 6 && digits !== 8) {
    throw new RangeError(`Unsupported digits count: ${digits}. Must be 6 or 8.`);
  }
  const modulus = 10 ** digits;
  const otpNumber = binaryCode % modulus;
  return String(otpNumber).padStart(digits, '0');
}

/**
 * Resolves secret input to raw byte array.
 * Supports both Base32 encoded strings and raw Uint8Array.
 */
function resolveSecretBytes(secret: string | Uint8Array): Uint8Array {
  if (secret instanceof Uint8Array) {
    if (secret.length === 0) {
      throw new Error('Secret key cannot be empty');
    }
    return secret;
  }
  if (typeof secret === 'string') {
    const trimmed = secret.trim();
    if (!trimmed) {
      throw new Error('Secret key cannot be empty');
    }
    return decodeBase32(trimmed);
  }
  throw new TypeError('Secret must be a Base32 string or Uint8Array');
}

/**
 * Low-level HOTP generator over raw secret bytes and moving counter.
 */
export function generateHotpRaw(
  secretBytes: Uint8Array,
  counter: number | bigint,
  digits: 6 | 8 = 6,
  algorithm: OtpAlgorithm = 'SHA1'
): string {
  const algo = normalizeAlgorithm(algorithm);
  const hashFn = getHashFunction(algo);
  const counterBuffer = counterToBytes(counter);
  const digest = hmac(hashFn, secretBytes, counterBuffer);
  const binaryCode = dynamicTruncation(digest);
  return formatOtp(binaryCode, digits);
}

/**
 * Low-level TOTP generator over raw secret bytes and timestamp in seconds.
 */
export function generateTotpRaw(
  secretBytes: Uint8Array,
  timestampSeconds: number,
  period: number = 30,
  digits: 6 | 8 = 6,
  algorithm: OtpAlgorithm = 'SHA1'
): string {
  if (!Number.isFinite(period) || period <= 0) {
    throw new RangeError('Period must be a positive integer');
  }
  if (!Number.isFinite(timestampSeconds) || timestampSeconds < 0) {
    throw new RangeError('Timestamp cannot be negative');
  }
  const counter = Math.floor(timestampSeconds / period);
  return generateHotpRaw(secretBytes, counter, digits, algorithm);
}

/**
 * Generates an RFC 6238 TOTP token for an OtpAccount.
 * @param account The account configuration object.
 * @param timestamp Optional Unix timestamp in seconds (defaults to Date.now() / 1000).
 */
export function generateTotp(account: OtpAccount, timestamp?: number): string {
  if (timestamp !== undefined && (!Number.isFinite(timestamp) || timestamp < 0)) {
    throw new RangeError('Timestamp cannot be negative');
  }
  const ts = timestamp !== undefined ? timestamp : Math.floor(Date.now() / 1000);
  const secretBytes = resolveSecretBytes(account.secret);
  if (account.period !== undefined && (!Number.isFinite(account.period) || account.period <= 0)) {
    throw new RangeError('Period must be a positive integer');
  }
  const period = account.period !== undefined ? account.period : 30;
  const digits = account.digits || 6;
  const algorithm = account.algorithm || 'SHA1';
  return generateTotpRaw(secretBytes, ts, period, digits, algorithm);
}

/**
 * Generates an RFC 4226 HOTP token for an OtpAccount.
 * @param account The account configuration object.
 * @param counter Optional counter override (defaults to account.counter).
 */
export function generateHotp(account: OtpAccount, counter?: number): string {
  const c = counter !== undefined ? counter : (account.counter ?? 0);
  const secretBytes = resolveSecretBytes(account.secret);
  const digits = account.digits || 6;
  const algorithm = account.algorithm || 'SHA1';
  return generateHotpRaw(secretBytes, c, digits, algorithm);
}

/**
 * Computes the real-time progress, remaining seconds, and urgency status for a TOTP token.
 * @param account The account configuration object.
 * @param timestamp Optional Unix timestamp in seconds (defaults to Date.now() / 1000).
 */
export function getTotpProgress(account: OtpAccount, timestamp?: number): TotpProgress {
  const ts = timestamp !== undefined ? timestamp : Date.now() / 1000;
  if (account.period !== undefined && (!Number.isFinite(account.period) || account.period <= 0)) {
    throw new RangeError('Period must be a positive integer');
  }
  const period = account.period > 0 ? account.period : 30;

  // Integer remaining seconds
  const currentSec = Math.floor(ts);
  const elapsedSec = ((currentSec % period) + period) % period;
  const remainingSeconds = period - elapsedSec;

  // Floating-point progress for smooth 60fps animations: 1.0 -> 0.0
  const elapsedFloat = ((ts % period) + period) % period;
  const remainingFloat = period - elapsedFloat;
  const progress = Math.max(0, Math.min(1, remainingFloat / period));

  // Urgency threshold: active when 5 or fewer seconds remain
  const isUrgent = remainingSeconds <= 5;

  return {
    remainingSeconds,
    progress,
    isUrgent,
  };
}

/**
 * Constant-time string equality check to mitigate timing analysis attacks.
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Verifies a TOTP token within an acceptable time-drift step window.
 * @param token The user-submitted OTP code.
 * @param account The account configuration object.
 * @param timestamp Optional Unix timestamp in seconds.
 * @param window Number of time steps to check before and after (default 1).
 */
export function verifyTotp(
  token: string,
  account: OtpAccount,
  timestamp: number = Math.floor(Date.now() / 1000),
  window: number = 1
): VerifyTotpResult {
  const period = account.period || 30;
  const currentStep = Math.floor(timestamp / period);
  const secretBytes = resolveSecretBytes(account.secret);
  const digits = account.digits || 6;
  const algo = account.algorithm || 'SHA1';

  for (let d = -window; d <= window; d++) {
    const step = currentStep + d;
    if (step < 0) continue;
    const expected = generateHotpRaw(secretBytes, step, digits, algo);
    if (constantTimeEqual(token, expected)) {
      return { valid: true, delta: d };
    }
  }

  return { valid: false };
}

/**
 * Verifies an HOTP token within a forward look-ahead resynchronization window.
 * @param token The user-submitted OTP code.
 * @param account The account configuration object.
 * @param currentCounter Starting counter (defaults to account.counter).
 * @param lookAheadWindow Maximum counter steps to check forward (default 10).
 */
export function verifyHotp(
  token: string,
  account: OtpAccount,
  currentCounter?: number,
  lookAheadWindow: number = 10
): VerifyHotpResult {
  const start = currentCounter !== undefined ? currentCounter : (account.counter ?? 0);
  const secretBytes = resolveSecretBytes(account.secret);
  const digits = account.digits || 6;
  const algo = account.algorithm || 'SHA1';

  for (let c = start; c <= start + lookAheadWindow; c++) {
    const expected = generateHotpRaw(secretBytes, c, digits, algo);
    if (constantTimeEqual(token, expected)) {
      return { valid: true, matchedCounter: c };
    }
  }

  return { valid: false };
}

/**
 * Increments an account's HOTP counter and returns the new account state and generated code.
 */
export function incrementHotpCounter(account: OtpAccount): {
  account: OtpAccount;
  newCode: string;
} {
  const newCounter = (account.counter ?? 0) + 1;
  const updatedAccount: OtpAccount = {
    ...account,
    counter: newCounter,
  };
  const newCode = generateHotp(updatedAccount, newCounter);
  return { account: updatedAccount, newCode };
}
