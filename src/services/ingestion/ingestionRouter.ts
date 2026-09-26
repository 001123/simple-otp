/**
 * Unified Ingestion Router & Duplicate Detection Service
 *
 * Central intake pipeline orchestrating token ingestion across all channels:
 * - Live Camera QR scanning
 * - Photo Gallery QR decoding
 * - Auto-detected clipboard content
 * - Manual entry form submissions
 *
 * Implements strict duplicate detection comparing normalized (issuer, account, secret).
 * Supports both in-memory account arrays and persistent VaultStorageService instances.
 */

import { parseOtpAuthUri } from '@/services/otp/uriParser';
import {
  validateManualEntryForm,
  createOtpAccountFromManual,
  generateDefaultId,
  type ManualEntryFormValues,
} from './manualInput';
import type { ClipboardDetectionResult } from './clipboard';
import type { OtpAccount, VaultStorageService } from '@/types/otp';

export type IngestionStatus = 'success' | 'duplicate' | 'invalid';

export interface IngestionResult {
  status: IngestionStatus;
  account?: OtpAccount;
  existingAccount?: OtpAccount;
  error?: string;
}

export interface IngestionOptions {
  saveToVault?: boolean; // Default false
  vault?: VaultStorageService;
  idGenerator?: () => string;
}

export type IngestionSource = 'camera' | 'gallery' | 'clipboard' | 'manual';

export interface IngestionRequest {
  source: IngestionSource;
  payload: string | ManualEntryFormValues | ClipboardDetectionResult;
  manualOverrides?: Partial<ManualEntryFormValues>;
}

/**
 * Normalizes an account attribute for duplicate comparison.
 */
function normalizeSecretForComparison(secret: string): string {
  return (secret || '').replace(/[\s\-_=.]/g, '').toUpperCase();
}

/**
 * Checks if an existing vault account matches an incoming candidate account
 * based on the canonical triplet: (issuer, account, secret).
 *
 * @param candidate - Candidate account to inspect
 * @param existingAccounts - List of existing vault accounts
 * @returns Matching existing account if found, otherwise undefined
 */
export function findDuplicateAccount(
  candidate: { issuer?: string; account: string; secret: string },
  existingAccounts: OtpAccount[]
): OtpAccount | undefined {
  const candIssuer = (candidate.issuer ?? '').trim().toLowerCase();
  const candAccount = (candidate.account ?? '').trim().toLowerCase();
  const candSecret = normalizeSecretForComparison(candidate.secret);

  return existingAccounts.find((existing) => {
    const exIssuer = (existing.issuer ?? '').trim().toLowerCase();
    const exAccount = (existing.account ?? '').trim().toLowerCase();
    const exSecret = normalizeSecretForComparison(existing.secret);

    return exIssuer === candIssuer && exAccount === candAccount && exSecret === candSecret;
  });
}

/**
 * Alias for findDuplicateAccount conforming to DISPATCH.md naming
 */
export const checkAccountDuplicate = findDuplicateAccount;

/**
 * Resolves existing accounts from either an array or a VaultStorageService instance.
 */
async function resolveAccounts(
  target: OtpAccount[] | VaultStorageService
): Promise<{ accounts: OtpAccount[]; vault?: VaultStorageService }> {
  if (Array.isArray(target)) {
    return { accounts: target };
  }
  const accounts = await target.getAccounts();
  return { accounts, vault: target };
}

/**
 * Ingests an account from an otpauth:// URI (used by Camera QR, Gallery QR, and Clipboard URI).
 *
 * @param uri - Raw otpauth:// URI
 * @param vaultOrAccounts - Existing accounts array or VaultStorageService
 * @param options - Ingestion options
 * @returns IngestionResult
 */
export async function ingestFromUri(
  uri: string,
  vaultOrAccounts: OtpAccount[] | VaultStorageService,
  options: IngestionOptions = {}
): Promise<IngestionResult> {
  let parsed;
  try {
    parsed = parseOtpAuthUri(uri);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { status: 'invalid', error: msg };
  }

  const { accounts, vault } = await resolveAccounts(vaultOrAccounts);
  const activeVault = options.vault || vault;

  const duplicate = findDuplicateAccount(parsed, accounts);
  if (duplicate) {
    return {
      status: 'duplicate',
      existingAccount: duplicate,
      error: `Account already exists in vault: ${duplicate.issuer ? duplicate.issuer + ' (' + duplicate.account + ')' : duplicate.account}`,
    };
  }

  const generateId = options.idGenerator || generateDefaultId;
  const candidateAccount: OtpAccount = {
    id: generateId(),
    type: parsed.type,
    issuer: parsed.issuer,
    account: parsed.account,
    secret: parsed.secret,
    algorithm: parsed.algorithm,
    digits: parsed.digits,
    period: parsed.period,
    counter: parsed.counter,
    createdAt: Date.now(),
  };

  if (options.saveToVault && activeVault) {
    try {
      await activeVault.saveAccount(candidateAccount);
    } catch (saveErr: unknown) {
      const msg = saveErr instanceof Error ? saveErr.message : String(saveErr);
      return { status: 'invalid', error: `Vault save error: ${msg}` };
    }
  }

  return {
    status: 'success',
    account: candidateAccount,
  };
}

/**
 * Ingests an account from a manual input form.
 *
 * @param form - Manual form values
 * @param vaultOrAccounts - Existing accounts array or VaultStorageService
 * @param options - Ingestion options
 * @returns IngestionResult
 */
export async function ingestFromManual(
  form: ManualEntryFormValues,
  vaultOrAccounts: OtpAccount[] | VaultStorageService,
  options: IngestionOptions = {}
): Promise<IngestionResult> {
  const validation = validateManualEntryForm(form);
  if (!validation.isValid || !validation.normalized) {
    const errorDetails = Object.values(validation.errors).join(', ');
    return { status: 'invalid', error: errorDetails };
  }

  const { accounts, vault } = await resolveAccounts(vaultOrAccounts);
  const activeVault = options.vault || vault;
  const norm = validation.normalized;

  const duplicate = findDuplicateAccount(norm, accounts);
  if (duplicate) {
    return {
      status: 'duplicate',
      existingAccount: duplicate,
      error: `Account already exists in vault: ${duplicate.issuer ? duplicate.issuer + ' (' + duplicate.account + ')' : duplicate.account}`,
    };
  }

  const generateId = options.idGenerator || generateDefaultId;
  const candidateAccount = createOtpAccountFromManual(form, generateId);

  if (options.saveToVault && activeVault) {
    try {
      await activeVault.saveAccount(candidateAccount);
    } catch (saveErr: unknown) {
      const msg = saveErr instanceof Error ? saveErr.message : String(saveErr);
      return { status: 'invalid', error: `Vault save error: ${msg}` };
    }
  }

  return {
    status: 'success',
    account: candidateAccount,
  };
}

/**
 * Ingests an account from a clipboard detection result.
 *
 * @param detection - Detection result from checkClipboard()
 * @param vaultOrAccounts - Existing accounts array or VaultStorageService
 * @param manualOverrides - Optional overrides (e.g. required account name when type is 'secret')
 * @param options - Ingestion options
 * @returns IngestionResult
 */
export async function ingestFromClipboard(
  detection: ClipboardDetectionResult,
  vaultOrAccounts: OtpAccount[] | VaultStorageService,
  manualOverrides: Partial<ManualEntryFormValues> = {},
  options: IngestionOptions = {}
): Promise<IngestionResult> {
  if (!detection.detected || !detection.payload) {
    return { status: 'invalid', error: 'No OTP token or secret detected in clipboard' };
  }

  if (detection.type === 'uri') {
    return ingestFromUri(detection.payload, vaultOrAccounts, options);
  }

  if (detection.type === 'secret') {
    const accountName = manualOverrides.account?.trim() || detection.parsed?.account?.trim();
    if (!accountName) {
      return {
        status: 'invalid',
        error: 'Account name is required for raw secret ingestion',
      };
    }

    const formValues: ManualEntryFormValues = {
      account: accountName,
      issuer: manualOverrides.issuer ?? detection.parsed?.issuer,
      secret: detection.payload,
      type: manualOverrides.type ?? detection.parsed?.type ?? 'totp',
      algorithm: manualOverrides.algorithm ?? detection.parsed?.algorithm ?? 'SHA1',
      digits: manualOverrides.digits ?? detection.parsed?.digits ?? 6,
      period: manualOverrides.period ?? detection.parsed?.period ?? 30,
      counter: manualOverrides.counter ?? detection.parsed?.counter ?? 0,
    };

    return ingestFromManual(formValues, vaultOrAccounts, options);
  }

  return { status: 'invalid', error: 'Unknown clipboard detection type' };
}

/**
 * Universal polymorphic ingestion router.
 * Dispatches requests to the appropriate channel handler based on request.source.
 *
 * @param request - Ingestion request containing source, payload, and optional overrides
 * @param vaultOrAccounts - Existing accounts array or VaultStorageService
 * @param options - Ingestion options
 * @returns IngestionResult
 */
export async function routeIngestion(
  request: IngestionRequest,
  vaultOrAccounts: OtpAccount[] | VaultStorageService,
  options: IngestionOptions = {}
): Promise<IngestionResult> {
  switch (request.source) {
    case 'camera':
    case 'gallery': {
      if (typeof request.payload !== 'string') {
        return { status: 'invalid', error: 'QR scan payload must be a string URI' };
      }
      return ingestFromUri(request.payload, vaultOrAccounts, options);
    }
    case 'manual': {
      if (!request.payload || typeof request.payload !== 'object') {
        return { status: 'invalid', error: 'Manual payload must be a form values object' };
      }
      return ingestFromManual(request.payload as ManualEntryFormValues, vaultOrAccounts, options);
    }
    case 'clipboard': {
      if (!request.payload || typeof request.payload !== 'object') {
        return { status: 'invalid', error: 'Clipboard payload must be a ClipboardDetectionResult' };
      }
      return ingestFromClipboard(
        request.payload as ClipboardDetectionResult,
        vaultOrAccounts,
        request.manualOverrides,
        options
      );
    }
    default:
      return { status: 'invalid', error: `Unsupported ingestion source: ${(request as IngestionRequest).source}` };
  }
}
