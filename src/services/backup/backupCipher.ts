/**
 * Encrypted Backup Cipher Engine
 *
 * Implements password-based authenticated encryption for Simple OTP vault backups (.simpleotp):
 * - PBKDF2-HMAC-SHA256 key derivation with 100,000 iterations
 * - NIST SP 800-38D AES-256-GCM authenticated encryption (12-byte IV, 16-byte tag)
 * - Pure TypeScript Base64 encoding/decoding without Node Buffer dependency
 * - Tamper detection (AEAD tag verification, ciphertext and parameter validation)
 */

import { pbkdf2 } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { gcm } from '@noble/ciphers/aes.js';
import type {
  EncryptedBackupContainer,
  OtpAccount,
  DecryptedBackupPayload,
} from '@/types/otp';
import { validateBase32 } from '../otp/base32';
import { getRandomValues } from '@/services/crypto/cryptoPolyfill';

export const PBKDF2_ITERATIONS = 100_000;
export const SALT_BYTES_LEN = 16;
export const IV_BYTES_LEN = 12;
export const TAG_BYTES_LEN = 16;
export const KEY_BYTES_LEN = 32;

// --- Base64 Utilities (Pure TypeScript, Zero-Dependency) ---

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function bytesToBase64(bytes: Uint8Array): string {
  let result = '';
  const len = bytes.length;
  for (let i = 0; i < len; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < len ? bytes[i + 1] : 0;
    const b2 = i + 2 < len ? bytes[i + 2] : 0;

    const triplet = (b0 << 16) | (b1 << 8) | b2;

    result += BASE64_CHARS[(triplet >> 18) & 63];
    result += BASE64_CHARS[(triplet >> 12) & 63];
    result += i + 1 < len ? BASE64_CHARS[(triplet >> 6) & 63] : '=';
    result += i + 2 < len ? BASE64_CHARS[triplet & 63] : '=';
  }
  return result;
}

export function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/\s+/g, '');
  if (clean.length === 0) return new Uint8Array(0);

  const lookup = new Uint8Array(128);
  for (let i = 0; i < BASE64_CHARS.length; i++) {
    lookup[BASE64_CHARS.charCodeAt(i)] = i;
  }

  const unpadded = clean.replace(/=/g, '');
  const byteLen = Math.floor((unpadded.length * 6) / 8);
  const bytes = new Uint8Array(byteLen);
  let byteIndex = 0;

  for (let i = 0; i < clean.length; i += 4) {
    const chunk = clean.slice(i, i + 4);
    const c0 = lookup[chunk.charCodeAt(0)];
    const c1 = lookup[chunk.charCodeAt(1)];
    const c2 = chunk[2] === '=' ? 0 : lookup[chunk.charCodeAt(2)];
    const c3 = chunk[3] === '=' ? 0 : lookup[chunk.charCodeAt(3)];

    const sextet = (c0 << 18) | (c1 << 12) | (c2 << 6) | c3;

    if (byteIndex < byteLen) bytes[byteIndex++] = (sextet >> 16) & 255;
    if (chunk[2] !== '=' && byteIndex < byteLen) bytes[byteIndex++] = (sextet >> 8) & 255;
    if (chunk[3] !== '=' && byteIndex < byteLen) bytes[byteIndex++] = sextet & 255;
  }
  return bytes;
}

// --- Key Derivation ---

export function deriveKey(
  passphrase: string,
  salt: Uint8Array,
  iterations: number = PBKDF2_ITERATIONS
): Uint8Array {
  if (!passphrase || typeof passphrase !== 'string') {
    throw new Error('Passphrase cannot be empty: Passphrase must be a non-empty string');
  }
  if (!salt || salt.length < SALT_BYTES_LEN) {
    throw new Error(`Salt must be at least ${SALT_BYTES_LEN} bytes`);
  }
  if (iterations < 10_000) {
    throw new Error('Iterations must be at least 10,000');
  }

  return pbkdf2(sha256, passphrase, salt, { c: iterations, dkLen: KEY_BYTES_LEN });
}

// --- Backup Encryption ---

export interface EncryptBackupOptions {
  salt?: Uint8Array; // Override for deterministic testing
  iv?: Uint8Array; // Override for deterministic testing
  iterations?: number;
  format?: 'simpleotp' | 'simpleotp-encrypted';
}

export async function encryptBackup(
  accounts: OtpAccount[],
  passphrase: string,
  options?: EncryptBackupOptions
): Promise<EncryptedBackupContainer> {
  if (!passphrase || typeof passphrase !== 'string') {
    throw new Error('Passphrase cannot be empty: Passphrase must be a non-empty string');
  }

  // 1. Generate or assign salt
  const salt =
    options?.salt ?? getRandomValues(new Uint8Array(SALT_BYTES_LEN));
  if (salt.length < SALT_BYTES_LEN) {
    throw new Error(`Salt must be at least ${SALT_BYTES_LEN} bytes`);
  }

  // 2. Generate or assign IV
  const iv = options?.iv ?? getRandomValues(new Uint8Array(IV_BYTES_LEN));
  if (iv.length !== IV_BYTES_LEN) {
    throw new Error(`IV must be exactly ${IV_BYTES_LEN} bytes`);
  }

  const iterations = options?.iterations ?? PBKDF2_ITERATIONS;

  // 3. Derive 256-bit key
  const key = deriveKey(passphrase, salt, iterations);

  // 4. Construct payload
  const payload: DecryptedBackupPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    app: 'Simple OTP',
    accounts,
  };
  const plaintextBytes = new TextEncoder().encode(JSON.stringify(payload));

  // 5. Encrypt with AES-256-GCM
  const cipher = gcm(key, iv);
  const encrypted = cipher.encrypt(plaintextBytes);

  // @noble/ciphers aes-gcm appends 16-byte tag to ciphertext
  const ciphertextBytes = encrypted.slice(0, -TAG_BYTES_LEN);
  const tagBytes = encrypted.slice(-TAG_BYTES_LEN);

  return {
    format: options?.format ?? 'simpleotp',
    version: 1,
    createdAt: new Date().toISOString(),
    kdf: {
      algorithm: 'PBKDF2-HMAC-SHA256',
      iterations,
      salt: bytesToBase64(salt),
    },
    cipher: {
      algorithm: 'AES-256-GCM',
      iv: bytesToBase64(iv),
      tag: bytesToBase64(tagBytes),
    },
    ciphertext: bytesToBase64(ciphertextBytes),
  };
}

// --- Backup Decryption ---

export async function decryptBackup(
  containerInput: EncryptedBackupContainer | string,
  passphrase: string
): Promise<OtpAccount[]> {
  if (!passphrase || typeof passphrase !== 'string') {
    throw new Error('Passphrase cannot be empty: Passphrase must be a non-empty string');
  }

  let container: EncryptedBackupContainer;
  if (typeof containerInput === 'string') {
    try {
      container = JSON.parse(containerInput);
    } catch {
      throw new Error('Invalid backup container: malformed JSON');
    }
  } else {
    container = containerInput;
  }

  // Schema Validation
  if (!container || typeof container !== 'object') {
    throw new Error('Invalid backup container schema: expected object');
  }
  if (container.format !== 'simpleotp' && container.format !== 'simpleotp-encrypted') {
    throw new Error(`Invalid backup container schema: Unsupported backup format: ${container.format}`);
  }
  if (container.version !== 1) {
    throw new Error(`Invalid backup container schema: Unsupported backup container version: ${container.version}`);
  }
  if (!container.kdf || !container.cipher || !container.ciphertext) {
    throw new Error(
      'Invalid backup container schema: missing required sections (kdf, cipher, ciphertext)'
    );
  }
  if (!container.kdf.salt || !container.cipher.iv || !container.cipher.tag) {
    throw new Error(
      'Invalid backup container schema: missing cryptographic parameters (salt, iv, tag)'
    );
  }

  const salt = base64ToBytes(container.kdf.salt);
  const iv = base64ToBytes(container.cipher.iv);
  const tag = base64ToBytes(container.cipher.tag);
  const ciphertext = base64ToBytes(container.ciphertext);

  if (salt.length < SALT_BYTES_LEN) {
    throw new Error(
      `Invalid salt length: expected at least ${SALT_BYTES_LEN} bytes, got ${salt.length}`
    );
  }
  if (iv.length !== IV_BYTES_LEN) {
    throw new Error(
      `Invalid IV length: expected ${IV_BYTES_LEN} bytes, got ${iv.length}`
    );
  }
  if (tag.length !== TAG_BYTES_LEN) {
    throw new Error(
      `Invalid tag length: expected ${TAG_BYTES_LEN} bytes, got ${tag.length}`
    );
  }

  const iterations = container.kdf.iterations ?? PBKDF2_ITERATIONS;
  const key = deriveKey(passphrase, salt, iterations);

  // Assemble sealed payload: ciphertext || tag
  const sealed = new Uint8Array(ciphertext.length + tag.length);
  sealed.set(ciphertext, 0);
  sealed.set(tag, ciphertext.length);

  let decryptedBytes: Uint8Array;
  try {
    const cipher = gcm(key, iv);
    decryptedBytes = cipher.decrypt(sealed);
  } catch {
    throw new Error('AUTH_FAILED: Decryption failed: invalid passphrase or corrupted backup');
  }

  let parsed: any;
  try {
    const plaintext = new TextDecoder().decode(decryptedBytes);
    parsed = JSON.parse(plaintext);
  } catch {
    throw new Error('Decryption failed: decrypted payload is not valid JSON');
  }

  // Account extraction and validation
  let rawAccounts: any[];
  if (Array.isArray(parsed)) {
    rawAccounts = parsed;
  } else if (parsed && Array.isArray(parsed.accounts)) {
    rawAccounts = parsed.accounts;
  } else {
    throw new Error('Invalid backup payload: missing accounts array');
  }

  return rawAccounts.map((acc, index) => {
    if (!acc.id || typeof acc.id !== 'string') {
      throw new Error(`Account at index ${index} missing valid id`);
    }
    if (acc.type !== 'totp' && acc.type !== 'hotp') {
      throw new Error(`Account at index ${index} invalid type: ${acc.type}`);
    }
    if (!acc.account || typeof acc.account !== 'string') {
      throw new Error(`Account at index ${index} missing account name`);
    }
    if (!acc.secret || typeof acc.secret !== 'string') {
      throw new Error(`Account at index ${index} missing secret`);
    }

    const base32Check = validateBase32(acc.secret);
    if (!base32Check.isValid) {
      throw new Error(
        `Invalid backup payload: Account at index ${index} (${acc.account}) has invalid Base32 secret: ${base32Check.error}`
      );
    }

    return {
      id: acc.id,
      type: acc.type,
      issuer: acc.issuer,
      account: acc.account,
      secret: acc.secret,
      algorithm: acc.algorithm || 'SHA1',
      digits: acc.digits === 8 ? 8 : 6,
      period: acc.period ?? 30,
      counter: acc.counter ?? 0,
      createdAt: acc.createdAt ?? Date.now(),
    };
  });
}

// Compatibility Aliases for test harness and alternate naming
export const exportEncryptedBackup = encryptBackup;
export const restoreEncryptedBackup = decryptBackup;
