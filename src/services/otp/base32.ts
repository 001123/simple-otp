/**
 * RFC 4648 Base32 Encoder, Decoder, and Validator
 *
 * Implements RFC 4648 §6 standard Base32 alphabet (A-Z, 2-7) with:
 * - Constant-time lookup table
 * - Character set validation before structural length checks
 * - Strict trailing bit canonical validation (RFC 4648 §3.5)
 * - Structural length validation (mod 8 not in {1, 3, 6})
 * - Sanitization of user input (whitespace, dashes, dots, underscores, lowercase)
 * - Zero external runtime dependencies (100% pure TypeScript & Uint8Array)
 */

import type {
  Base32ValidationResult,
  Base32DecodeOptions,
  Base32EncodeOptions,
} from '@/types/otp';

export type { Base32ValidationResult, Base32DecodeOptions, Base32EncodeOptions };

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * 128-entry ASCII lookup table for O(1) character-to-value resolution.
 * Initialized to -1 for non-alphabet characters.
 */
const LOOKUP = new Int8Array(128).fill(-1);
for (let i = 0; i < ALPHABET.length; i++) {
  LOOKUP[ALPHABET.charCodeAt(i)] = i;
}

/**
 * Sanitizes a raw Base32 string by stripping whitespace, hyphens, underscores,
 * and periods, and converting all characters to uppercase.
 *
 * @param secret - Raw input string
 * @returns Sanitized uppercase string without whitespace or formatting delimiters
 */
export function sanitizeBase32(secret: string): string {
  if (typeof secret !== 'string') {
    throw new TypeError('Secret must be a string');
  }
  return secret.replace(/[\s\-_.]/g, '').toUpperCase();
}

/**
 * Validates a Base32 secret string. Checks character set, padding structure,
 * unpadded length mod 8, and strict trailing residual bits.
 *
 * @param secret - Base32 string to validate
 * @returns Object with `isValid`, optional `error` message, and `cleaned` unpadded uppercase string
 */
export function validateBase32(secret: string): Base32ValidationResult {
  if (typeof secret !== 'string') {
    return { isValid: false, error: 'Secret must be a string', cleaned: '' };
  }

  const sanitized = secret.replace(/[\s\-_.]/g, '').toUpperCase();
  if (sanitized.length === 0) {
    return { isValid: false, error: 'Secret cannot be empty', cleaned: '' };
  }

  let unpadded = sanitized;
  const firstEqual = sanitized.indexOf('=');

  if (firstEqual !== -1) {
    // '=' padding must only appear at the end
    for (let i = firstEqual; i < sanitized.length; i++) {
      if (sanitized[i] !== '=') {
        return {
          isValid: false,
          error: 'Padding character "=" must only appear at the end (non-padding character found after "=")',
          cleaned: sanitized,
        };
      }
    }

    const paddingCount = sanitized.length - firstEqual;
    if (sanitized.length % 8 !== 0) {
      return {
        isValid: false,
        error: `Padded Base32 length (${sanitized.length}) must be a multiple of 8`,
        cleaned: sanitized,
      };
    }

    if (![0, 1, 3, 4, 6].includes(paddingCount)) {
      return {
        isValid: false,
        error: `Invalid Base32 padding count (${paddingCount})`,
        cleaned: sanitized,
      };
    }

    unpadded = sanitized.slice(0, firstEqual);
  }

  const len = unpadded.length;

  // 1. Character set validation first
  for (let i = 0; i < len; i++) {
    const code = unpadded.charCodeAt(i);
    if (code >= 128 || LOOKUP[code] === -1) {
      return {
        isValid: false,
        error: `Invalid character in Base32 string: "${unpadded[i]}" at index ${i}. Allowed characters are A-Z and 2-7.`,
        cleaned: unpadded,
      };
    }
  }

  // 2. RFC 4648 §6: unpadded lengths mod 8 of 1, 3, or 6 are structurally impossible
  const rem = len % 8;
  if (rem === 1 || rem === 3 || rem === 6) {
    return {
      isValid: false,
      error: `Invalid unpadded Base32 length: unpadded length mod 8 cannot be ${rem} (length ${len})`,
      cleaned: unpadded,
    };
  }

  // 3. Strict trailing bits validation
  let buffer = 0;
  let bitsLeft = 0;

  for (let i = 0; i < len; i++) {
    const code = unpadded.charCodeAt(i);
    buffer = (buffer << 5) | LOOKUP[code];
    bitsLeft += 5;
    if (bitsLeft >= 8) {
      bitsLeft -= 8;
    }
  }

  // RFC 4648 §3.5: verify unused trailing bits are zero
  if (bitsLeft > 0) {
    const residual = buffer & ((1 << bitsLeft) - 1);
    if (residual !== 0) {
      return {
        isValid: false,
        error: `Invalid Base32: Non-zero residual bits (${residual}) in final quantum (RFC 4648 §3.5)`,
        cleaned: unpadded,
      };
    }
  }

  return { isValid: true, cleaned: unpadded };
}

/**
 * Decodes an RFC 4648 Base32 string into a Uint8Array of raw bytes.
 *
 * @param secret - Base32 string (padded or unpadded, case-insensitive, whitespace/hyphens tolerated)
 * @param options - Decoding options (strict mode for RFC 4648 §3.5 canonical bit validation)
 * @returns Uint8Array containing decoded bytes
 * @throws Error if character, padding, length, or residual bits are invalid
 */
export function decodeBase32(
  secret: string,
  options: Base32DecodeOptions = { strict: true }
): Uint8Array {
  if (typeof secret !== 'string') {
    throw new TypeError('Secret must be a string');
  }

  const sanitized = secret.replace(/[\s\-_.]/g, '').toUpperCase();
  if (sanitized.length === 0) {
    return new Uint8Array(0);
  }

  let unpadded = sanitized;
  const firstEqual = sanitized.indexOf('=');

  if (firstEqual !== -1) {
    for (let i = firstEqual; i < sanitized.length; i++) {
      if (sanitized[i] !== '=') {
        throw new Error('Invalid Base32: non-padding character found after "="');
      }
    }

    const paddingCount = sanitized.length - firstEqual;
    if (sanitized.length % 8 !== 0) {
      throw new Error(`Invalid Base32: padded length (${sanitized.length}) must be a multiple of 8`);
    }

    if (![0, 1, 3, 4, 6].includes(paddingCount)) {
      throw new Error(`Invalid Base32: invalid padding length (${paddingCount})`);
    }

    unpadded = sanitized.slice(0, firstEqual);
  }

  const len = unpadded.length;

  // 1. Character set validation first
  for (let i = 0; i < len; i++) {
    const code = unpadded.charCodeAt(i);
    if (code >= 128 || LOOKUP[code] === -1) {
      throw new Error(
        `Invalid character in Base32 string: "${unpadded[i]}" at index ${i}. Allowed characters are A-Z and 2-7.`
      );
    }
  }

  // 2. Length check
  const rem = len % 8;
  if (rem === 1 || rem === 3 || rem === 6) {
    throw new Error(`Invalid unpadded Base32 length: unpadded length mod 8 cannot be ${rem}`);
  }

  const fullBlocks = Math.floor(len / 8);
  const extraBytes = rem === 2 ? 1 : rem === 4 ? 2 : rem === 5 ? 3 : rem === 7 ? 4 : 0;
  const outLength = fullBlocks * 5 + extraBytes;
  const out = new Uint8Array(outLength);

  let buffer = 0;
  let bitsLeft = 0;
  let outIdx = 0;

  for (let i = 0; i < len; i++) {
    const code = unpadded.charCodeAt(i);
    const val = LOOKUP[code];
    buffer = (buffer << 5) | val;
    bitsLeft += 5;

    if (bitsLeft >= 8) {
      bitsLeft -= 8;
      out[outIdx++] = (buffer >> bitsLeft) & 0xff;
    }
  }

  const strict = options.strict ?? true;
  if (strict && bitsLeft > 0) {
    const residual = buffer & ((1 << bitsLeft) - 1);
    if (residual !== 0) {
      throw new Error(
        `Invalid Base32: Non-zero residual bits (${residual}) in final quantum (RFC 4648 §3.5)`
      );
    }
  }

  return out;
}

/**
 * Encodes a Uint8Array into a canonical RFC 4648 Base32 string.
 *
 * @param bytes - Byte buffer to encode
 * @param options - Encoding options (pad: true for standard '=' padding)
 * @returns Canonical uppercase Base32 string
 */
export function encodeBase32(
  bytes: Uint8Array,
  options: Base32EncodeOptions = { pad: true }
): string {
  if (!(bytes instanceof Uint8Array)) {
    throw new TypeError('Input must be a Uint8Array');
  }

  const len = bytes.length;
  if (len === 0) return '';

  const pad = options.pad ?? true;
  let out = '';
  let buffer = 0;
  let bitsLeft = 0;

  for (let i = 0; i < len; i++) {
    buffer = (buffer << 8) | bytes[i];
    bitsLeft += 8;

    while (bitsLeft >= 5) {
      bitsLeft -= 5;
      out += ALPHABET[(buffer >> bitsLeft) & 0x1f];
    }
  }

  if (bitsLeft > 0) {
    out += ALPHABET[(buffer << (5 - bitsLeft)) & 0x1f];
  }

  if (pad) {
    while (out.length % 8 !== 0) {
      out += '=';
    }
  }

  return out;
}
