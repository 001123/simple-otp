/**
 * Hardware-Backed Secure Vault Storage (Strategy C)
 *
 * Implements persistent, encrypted storage for OTP accounts:
 * - Master Vault Key (MVK): 256-bit random key stored in hardware-backed SecureStore (Keychain/Keystore)
 * - Database File (vault.enc): AES-256-GCM encrypted database in expo-file-system
 * - Completely eliminates the iOS Keychain 2048-byte limit
 * - Atomic write serialization via Promise mutex queue to prevent race conditions
 */

import * as SecureStore from 'expo-secure-store';
import { File, Paths } from 'expo-file-system';
import { gcm } from '@noble/ciphers/aes.js';
import type { OtpAccount, VaultStorageService } from '@/types/otp';
import { generateHotp } from '@/services/crypto/otpEngine';
import {
  bytesToBase64,
  base64ToBytes,
  IV_BYTES_LEN,
  TAG_BYTES_LEN,
} from '@/services/backup/backupCipher';
import { getRandomValues } from '@/services/crypto/cryptoPolyfill';

export const MVK_SECURE_STORE_KEY = 'simpleotp_vault_key';
export const VAULT_FILE_NAME = 'vault.enc';

interface EncryptedVaultContainer {
  version: 1;
  iv: string; // Base64 (12 bytes)
  tag: string; // Base64 (16 bytes)
  ciphertext: string; // Base64
}

export class VaultStorage implements VaultStorageService {
  private cachedMvk: Uint8Array | null = null;
  private writeQueue: Promise<unknown> = Promise.resolve();

  private getVaultFile(): File {
    return new File(Paths.document, VAULT_FILE_NAME);
  }

  // --- Mutex Serialization for Disk Writes ---
  private enqueueWrite<T>(op: () => Promise<T>): Promise<T> {
    const next = this.writeQueue.then(op, op);
    this.writeQueue = next;
    return next;
  }

  /**
   * Initializes the vault. Retrieves or generates the 256-bit Master Vault Key (MVK)
   * stored securely in hardware-backed SecureStore.
   */
  async initializeVault(): Promise<void> {
    if (this.cachedMvk) return;

    let mvkB64 = await SecureStore.getItemAsync(MVK_SECURE_STORE_KEY);

    if (!mvkB64) {
      // First run: generate 32 cryptographically secure random bytes
      const rawMvk = getRandomValues(new Uint8Array(32));
      mvkB64 = bytesToBase64(rawMvk);

      await SecureStore.setItemAsync(MVK_SECURE_STORE_KEY, mvkB64, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED,
      });

      this.cachedMvk = rawMvk;
    } else {
      const decoded = base64ToBytes(mvkB64);
      if (decoded.length !== 32) {
        throw new Error('Corrupted Master Vault Key: invalid key length in SecureStore');
      }
      this.cachedMvk = decoded;
    }
  }

  /**
   * Reads and decrypts all OTP accounts from the encrypted database file.
   */
  async getAccounts(): Promise<OtpAccount[]> {
    if (!this.cachedMvk) {
      await this.initializeVault();
    }

    const file = this.getVaultFile();
    if (!file.exists) {
      return [];
    }

    const fileContent = await file.text();
    if (!fileContent || fileContent.trim() === '') {
      return [];
    }

    let container: EncryptedVaultContainer;
    try {
      container = JSON.parse(fileContent);
    } catch {
      throw new Error('Corrupted vault file: malformed JSON');
    }

    if (!container.iv || !container.tag || !container.ciphertext) {
      throw new Error('Corrupted vault file: missing cryptographic envelope parameters');
    }

    const iv = base64ToBytes(container.iv);
    const tag = base64ToBytes(container.tag);
    const ciphertext = base64ToBytes(container.ciphertext);

    const sealed = new Uint8Array(ciphertext.length + tag.length);
    sealed.set(ciphertext, 0);
    sealed.set(tag, ciphertext.length);

    try {
      const cipher = gcm(this.cachedMvk!, iv);
      const decryptedBytes = cipher.decrypt(sealed);
      const plaintext = new TextDecoder().decode(decryptedBytes);
      const parsed = JSON.parse(plaintext) as OtpAccount[];
      return parsed.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    } catch {
      throw new Error('Vault decryption failure: unable to decrypt account database with MVK');
    }
  }

  /**
   * Internal helper to encrypt and persist accounts array to disk.
   */
  private async persistAccounts(accounts: OtpAccount[]): Promise<void> {
    if (!this.cachedMvk) {
      await this.initializeVault();
    }

    const iv = getRandomValues(new Uint8Array(IV_BYTES_LEN));
    const plaintext = JSON.stringify(accounts);
    const plaintextBytes = new TextEncoder().encode(plaintext);

    const cipher = gcm(this.cachedMvk!, iv);
    const encrypted = cipher.encrypt(plaintextBytes);

    const ciphertext = encrypted.slice(0, -TAG_BYTES_LEN);
    const tag = encrypted.slice(-TAG_BYTES_LEN);

    const container: EncryptedVaultContainer = {
      version: 1,
      iv: bytesToBase64(iv),
      tag: bytesToBase64(tag),
      ciphertext: bytesToBase64(ciphertext),
    };

    const file = this.getVaultFile();
    if (!file.exists) {
      file.create();
    }
    file.write(JSON.stringify(container));
  }

  /**
   * Adds a new OTP account to the vault.
   */
  async saveAccount(account: OtpAccount): Promise<void> {
    if (!account.id) throw new Error('Account missing required field: id');
    if (!account.account) throw new Error('Account missing required field: account');
    if (!account.secret) throw new Error('Account missing required field: secret');
    if (account.type !== 'totp' && account.type !== 'hotp') {
      throw new Error(`Invalid account type: ${account.type}`);
    }

    return this.enqueueWrite(async () => {
      const accounts = await this.getAccounts();
      if (accounts.some((a) => a.id === account.id)) {
        throw new Error(`Account with ID ${account.id} already exists`);
      }
      accounts.push(account);
      await this.persistAccounts(accounts);
    });
  }

  /**
   * Updates an existing OTP account.
   */
  async updateAccount(account: OtpAccount): Promise<void> {
    return this.enqueueWrite(async () => {
      const accounts = await this.getAccounts();
      const index = accounts.findIndex((a) => a.id === account.id);
      if (index === -1) {
        throw new Error(`Account not found: ${account.id}`);
      }
      accounts[index] = account;
      await this.persistAccounts(accounts);
    });
  }

  /**
   * Deletes an OTP account by ID.
   */
  async deleteAccount(id: string): Promise<void> {
    return this.enqueueWrite(async () => {
      const accounts = await this.getAccounts();
      const filtered = accounts.filter((a) => a.id !== id);
      if (filtered.length === accounts.length) {
        throw new Error(`Account not found: ${id}`);
      }
      await this.persistAccounts(filtered);
    });
  }

  /**
   * Increments the moving counter for an HOTP account and generates the new OTP code.
   */
  async incrementHotpCounter(id: string): Promise<{ newCounter: number; newCode: string }> {
    return this.enqueueWrite(async () => {
      const accounts = await this.getAccounts();
      const account = accounts.find((a) => a.id === id);
      if (!account) {
        throw new Error(`Account not found: ${id}`);
      }
      if (account.type !== 'hotp') {
        throw new Error(`Cannot increment counter on non-HOTP account: ${id}`);
      }

      const newCounter = (account.counter ?? 0) + 1;
      account.counter = newCounter;

      const newCode = generateHotp(account, newCounter);
      await this.persistAccounts(accounts);

      return { newCounter, newCode };
    });
  }

  /**
   * Filters accounts by query matching issuer or account name.
   */
  async searchAccounts(query: string): Promise<OtpAccount[]> {
    const cleanQuery = query.trim().toLowerCase();
    const all = await this.getAccounts();
    if (!cleanQuery) {
      return all;
    }
    return all.filter((acc) => {
      const issuerMatch = acc.issuer ? acc.issuer.toLowerCase().includes(cleanQuery) : false;
      const accountMatch = acc.account.toLowerCase().includes(cleanQuery);
      return issuerMatch || accountMatch;
    });
  }

  /**
   * Wipes the local database file and deletes MVK from SecureStore (for factory reset).
   */
  async resetVault(): Promise<void> {
    return this.enqueueWrite(async () => {
      const file = this.getVaultFile();
      if (file.exists) {
        file.delete();
      }
      await SecureStore.deleteItemAsync(MVK_SECURE_STORE_KEY);
      this.cachedMvk = null;
    });
  }
}

export const vaultStorage = new VaultStorage();
