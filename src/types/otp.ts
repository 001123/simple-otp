/**
 * Domain Models & Types for Simple OTP
 */

export type OtpType = 'totp' | 'hotp';
export type OtpAlgorithm = 'SHA1' | 'SHA256' | 'SHA512';

export interface OtpAccount {
  id: string; // UUID v4
  type: OtpType;
  issuer?: string;
  account: string;
  secret: string; // Normalized Base32
  algorithm: OtpAlgorithm;
  digits: 6 | 8;
  period: number; // default 30 (for TOTP)
  counter: number; // moving factor (for HOTP)
  createdAt: number; // Unix epoch ms
}

export type ParsedOtpAuthUri = Omit<OtpAccount, 'id' | 'createdAt'>;

export interface TotpProgress {
  remainingSeconds: number;
  progress: number; // 1.0 -> 0.0
  isUrgent: boolean; // remainingSeconds <= 5
}

export interface VerifyTotpResult {
  valid: boolean;
  delta?: number;
}

export interface VerifyHotpResult {
  valid: boolean;
  matchedCounter?: number;
}

export interface Base32ValidationResult {
  isValid: boolean;
  error?: string;
  cleaned: string;
}

export interface Base32DecodeOptions {
  strict?: boolean; // default true (RFC 4648 §3.5)
}

export interface Base32EncodeOptions {
  pad?: boolean; // default true
}

export interface BackupKdfConfig {
  algorithm: 'PBKDF2-HMAC-SHA256' | 'PBKDF2';
  iterations: number; // 100000
  salt: string; // Base64 encoded (>= 16 bytes)
  hash?: string; // 'SHA-256'
  keyLength?: number; // 32
}

export interface BackupCipherConfig {
  algorithm: 'AES-256-GCM';
  iv: string; // Base64 encoded (12 bytes)
  tag: string; // Base64 encoded (16 bytes)
}

export interface EncryptedBackupContainer {
  $schema?: string;
  format: 'simpleotp' | 'simpleotp-encrypted';
  version: 1;
  createdAt?: string;
  kdf: BackupKdfConfig;
  cipher: BackupCipherConfig;
  ciphertext: string; // Base64 encoded encrypted payload
}

export interface DecryptedBackupPayload {
  version?: number;
  exportedAt?: string;
  app?: string;
  accounts: OtpAccount[];
}

export interface VaultStorageService {
  initializeVault(): Promise<void>;
  getAccounts(): Promise<OtpAccount[]>;
  saveAccount(account: OtpAccount): Promise<void>;
  updateAccount(account: OtpAccount): Promise<void>;
  deleteAccount(id: string): Promise<void>;
  incrementHotpCounter(id: string): Promise<{ newCounter: number; newCode: string }>;
  searchAccounts?(query: string): Promise<OtpAccount[]>;
}
