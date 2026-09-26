import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import type { OtpAccount } from '@/types/otp';
import { vaultStorage } from '@/services/storage/vaultStorage';
import { getTotpProgress } from '@/services/crypto/otpEngine';

export interface UseVaultResult {
  accounts: OtpAccount[];
  filteredAccounts: OtpAccount[];
  isLoading: boolean;
  isRefreshing: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
  now: number;
  hasUrgentTotp: boolean;
  refreshAccounts: () => Promise<void>;
  saveAccount: (account: OtpAccount) => Promise<void>;
  updateAccount: (account: OtpAccount) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  renameAccount: (id: string, newIssuer: string, newAccount: string) => Promise<void>;
  incrementHotp: (id: string) => Promise<{ newCounter: number; newCode: string }>;
}

export function useVault(): UseVaultResult {
  const [accounts, setAccounts] = useState<OtpAccount[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [now, setNow] = useState<number>(() => Math.floor(Date.now() / 1000));

  const isMountedRef = useRef<boolean>(true);

  // Load accounts from hardware-backed encrypted vault
  const loadAccounts = useCallback(async () => {
    try {
      await vaultStorage.initializeVault();
      const loaded = await vaultStorage.getAccounts();
      if (isMountedRef.current) {
        setAccounts(loaded);
      }
    } catch (err) {
      console.error('Failed to load accounts from vault:', err);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  // Initial mount
  useEffect(() => {
    isMountedRef.current = true;
    loadAccounts();
    return () => {
      isMountedRef.current = false;
    };
  }, [loadAccounts]);

  // Synchronized 1-second clock heartbeat for TOTP tokens & AppState foreground resync
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && isMountedRef.current) {
        setNow(Math.floor(Date.now() / 1000));
      }
    });

    return () => {
      clearInterval(timer);
      subscription?.remove?.();
    };
  }, []);

  // Pull-to-refresh handler
  const refreshAccounts = useCallback(async () => {
    setIsRefreshing(true);
    await loadAccounts();
  }, [loadAccounts]);

  // Real-time sub-millisecond in-memory search filter (case-insensitive literal match)
  const filteredAccounts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter((acc) => {
      const issuerMatch = acc.issuer ? acc.issuer.toLowerCase().includes(q) : false;
      const accountMatch = acc.account.toLowerCase().includes(q);
      return issuerMatch || accountMatch;
    });
  }, [accounts, searchQuery]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  // Urgency detection across all visible TOTP tokens (<= 5s)
  const hasUrgentTotp = useMemo(() => {
    return accounts.some((acc) => {
      if (acc.type !== 'totp') return false;
      try {
        const { isUrgent } = getTotpProgress(acc, now);
        return isUrgent;
      } catch {
        return false;
      }
    });
  }, [accounts, now]);

  // Account operations
  const saveAccount = useCallback(async (account: OtpAccount) => {
    await vaultStorage.saveAccount(account);
    const updated = await vaultStorage.getAccounts();
    if (isMountedRef.current) setAccounts(updated);
  }, []);

  const updateAccount = useCallback(async (account: OtpAccount) => {
    await vaultStorage.updateAccount(account);
    const updated = await vaultStorage.getAccounts();
    if (isMountedRef.current) setAccounts(updated);
  }, []);

  const deleteAccount = useCallback(async (id: string) => {
    await vaultStorage.deleteAccount(id);
    const updated = await vaultStorage.getAccounts();
    if (isMountedRef.current) setAccounts(updated);
  }, []);

  const renameAccount = useCallback(async (id: string, newIssuer: string, newAccount: string) => {
    const target = accounts.find((a) => a.id === id);
    if (!target) return;
    const updated: OtpAccount = {
      ...target,
      issuer: newIssuer.trim() || undefined,
      account: newAccount.trim(),
    };
    await vaultStorage.updateAccount(updated);
    const fresh = await vaultStorage.getAccounts();
    if (isMountedRef.current) setAccounts(fresh);
  }, [accounts]);

  const incrementHotp = useCallback(async (id: string) => {
    const result = await vaultStorage.incrementHotpCounter(id);
    const updated = await vaultStorage.getAccounts();
    if (isMountedRef.current) setAccounts(updated);
    return result;
  }, []);

  return {
    accounts,
    filteredAccounts,
    isLoading,
    isRefreshing,
    searchQuery,
    setSearchQuery,
    clearSearch,
    now,
    hasUrgentTotp,
    refreshAccounts,
    saveAccount,
    updateAccount,
    deleteAccount,
    renameAccount,
    incrementHotp,
  };
}
