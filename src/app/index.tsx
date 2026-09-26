import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Settings, Search, X, Plus } from 'lucide-react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useVault } from '@/hooks/useVault';
import { usePetCompanion } from '@/hooks/usePetCompanion';
import { BrandColors } from '@/constants/theme';
import type { OtpAccount } from '@/types/otp';
import { generateDefaultId, type ManualEntryFormValues } from '@/services/ingestion/manualInput';
import { pickAndScanGalleryQr, type ScannerScanResult } from '@/services/ingestion/scanner';
import { checkClipboard } from '@/services/ingestion/clipboard';
import { findDuplicateAccount } from '@/services/ingestion/ingestionRouter';
import {
  isLanguageInitialized,
  setupLocaleAppStateListener,
} from '@/services/i18n';

import { TotpCard } from '@/components/otp/TotpCard';
import { HotpCard } from '@/components/otp/HotpCard';
import { EmptyVaultView } from '@/components/otp/EmptyVaultView';
import { RenameAccountModal } from '@/components/otp/RenameAccountModal';
import { AccountActionSheet } from '@/components/otp/AccountActionSheet';
import { EditAccountModal } from '@/components/otp/EditAccountModal';
import { IngestionSheet } from '@/components/ingestion/IngestionSheet';
import { CameraScannerModal } from '@/components/ingestion/CameraScannerModal';
import { ManualEntryModal } from '@/components/ingestion/ManualEntryModal';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { AccountQrModal } from '@/components/settings/AccountQrModal';
import { PrivacyShield } from '@/components/common/PrivacyShield';
import { PetCompanion } from '@/components/pet/PetCompanion';
import { SpeechBubble } from '@/components/pet/SpeechBubble';
import { PetAcademyModal } from '@/components/pet/PetAcademyModal';
import { LanguageWelcomeModal } from '@/components/common/LanguageWelcomeModal';

export default function SingleScreenDashboard() {
  const { t } = useTranslation();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const {
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
  } = useVault();

  const petCompanion = usePetCompanion({
    accountCount: accounts.length,
    hasUrgentTimer: hasUrgentTotp,
  });

  // Modal and sheet states
  const [actionTarget, setActionTarget] = useState<OtpAccount | null>(null);
  const [editTarget, setEditTarget] = useState<OtpAccount | null>(null);
  const [renameTarget, setRenameTarget] = useState<OtpAccount | null>(null);
  const [isIngestionOpen, setIsIngestionOpen] = useState<boolean>(false);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [isManualOpen, setIsManualOpen] = useState<boolean>(false);
  const [manualInitialValues, setManualInitialValues] = useState<Partial<ManualEntryFormValues> | undefined>(undefined);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [accountForQr, setAccountForQr] = useState<OtpAccount | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(false);

  // Check language initialization on mount & register appState listener
  useEffect(() => {
    let isMounted = true;
    if (process.env.NODE_ENV !== 'test') {
      isLanguageInitialized().then((initialized) => {
        if (isMounted && !initialized) {
          setShowWelcomeModal(true);
        }
      });
    }

    const cleanupAppStateListener = setupLocaleAppStateListener();
    return () => {
      isMounted = false;
      cleanupAppStateListener();
    };
  }, []);

  // Copy handler connecting cards to mascot celebration
  const handleCardCopy = useCallback((_code: string) => {
    petCompanion.triggerCopied();
  }, [petCompanion]);

  // HOTP counter increment with companion feedback
  const handleHotpIncrement = useCallback(async (account: OtpAccount) => {
    const res = await incrementHotp(account.id);
    petCompanion.triggerSpeech(t('dashboard.hotpReadyToast', { counter: res.newCounter }), 3000);
  }, [incrementHotp, petCompanion, t]);

  // Handle Camera Scan Success
  const handleCameraScanSuccess = useCallback(async (scanResult: ScannerScanResult) => {
    setIsCameraOpen(false);
    const parsed = scanResult.account;
    const duplicate = findDuplicateAccount(
      { issuer: parsed.issuer, account: parsed.account, secret: parsed.secret },
      accounts
    );

    if (duplicate) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      Alert.alert(
        t('dashboard.duplicateTitle'),
        t('dashboard.duplicateMsg', {
          name: duplicate.issuer ? `${duplicate.issuer} (${duplicate.account})` : duplicate.account,
        })
      );
      return;
    }

    const newAccount: OtpAccount = {
      id: generateDefaultId(),
      type: parsed.type,
      issuer: parsed.issuer,
      account: parsed.account,
      secret: parsed.secret,
      algorithm: parsed.algorithm,
      digits: parsed.digits,
      period: parsed.period ?? 30,
      counter: parsed.counter ?? 0,
      createdAt: Date.now(),
    };

    await saveAccount(newAccount);
    petCompanion.triggerCopied();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    petCompanion.triggerSpeech(t('dashboard.scanSuccessToast'), 3000);
  }, [accounts, saveAccount, petCompanion, t]);

  // Handle Gallery Scan Flow
  const handleGalleryScan = useCallback(async () => {
    try {
      const outcome = await pickAndScanGalleryQr();
      if (outcome.canceled) return;

      if (outcome.error) {
        Alert.alert(t('dashboard.scanErrorTitle'), outcome.error.userMessage);
        return;
      }

      if (outcome.result) {
        const parsed = outcome.result.account;
        const duplicate = findDuplicateAccount(
          { issuer: parsed.issuer, account: parsed.account, secret: parsed.secret },
          accounts
        );

        if (duplicate) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
          Alert.alert(
            t('dashboard.duplicateTitle'),
            t('dashboard.duplicateMsgShort', {
              name: duplicate.issuer ? `${duplicate.issuer} (${duplicate.account})` : duplicate.account,
            })
          );
          return;
        }

        const newAccount: OtpAccount = {
          id: generateDefaultId(),
          type: parsed.type,
          issuer: parsed.issuer,
          account: parsed.account,
          secret: parsed.secret,
          algorithm: parsed.algorithm,
          digits: parsed.digits,
          period: parsed.period ?? 30,
          counter: parsed.counter ?? 0,
          createdAt: Date.now(),
        };

        await saveAccount(newAccount);
        petCompanion.triggerCopied();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        petCompanion.triggerSpeech(t('dashboard.gallerySuccessToast'), 3000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      Alert.alert(t('dashboard.galleryErrorTitle'), msg || t('dashboard.galleryErrorDefault'));
    }
  }, [accounts, saveAccount, petCompanion, t]);

  // Handle Clipboard Ingestion Flow
  const handleClipboardScan = useCallback(async () => {
    try {
      const res = await checkClipboard({ force: true });
      if (res.detected && res.type === 'uri' && res.parsed) {
        const parsed = res.parsed as Partial<OtpAccount>;
        if (!parsed.account || !parsed.secret) {
          Alert.alert(t('dashboard.invalidUriTitle'), t('dashboard.invalidUriMsg'));
          return;
        }

        const duplicate = findDuplicateAccount(
          { issuer: parsed.issuer, account: parsed.account, secret: parsed.secret },
          accounts
        );

        if (duplicate) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
          Alert.alert(
            t('dashboard.duplicateTitle'),
            t('dashboard.duplicateMsgShort', {
              name: duplicate.issuer ? `${duplicate.issuer} (${duplicate.account})` : duplicate.account,
            })
          );
          return;
        }

        const newAccount: OtpAccount = {
          id: generateDefaultId(),
          type: parsed.type || 'totp',
          issuer: parsed.issuer,
          account: parsed.account,
          secret: parsed.secret,
          algorithm: parsed.algorithm || 'SHA1',
          digits: parsed.digits === 8 ? 8 : 6,
          period: parsed.period ?? 30,
          counter: parsed.counter ?? 0,
          createdAt: Date.now(),
        };

        await saveAccount(newAccount);
        petCompanion.triggerCopied();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        petCompanion.triggerSpeech(t('dashboard.clipboardSuccessToast'), 3000);
      } else if (res.detected && res.type === 'secret' && res.payload) {
        // Open manual entry modal prefilled with secret
        setManualInitialValues({ secret: res.payload });
        setIsManualOpen(true);
      } else {
        Alert.alert(
          t('dashboard.clipboardNotFoundTitle'),
          t('dashboard.clipboardNotFoundMsg')
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      Alert.alert(t('dashboard.clipboardErrorTitle'), msg || t('dashboard.clipboardErrorDefault'));
    }
  }, [accounts, saveAccount, petCompanion, t]);

  // Manual save handler
  const handleManualSave = useCallback(async (account: OtpAccount) => {
    await saveAccount(account);
    petCompanion.triggerCopied();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    petCompanion.triggerSpeech(t('dashboard.manualSavedToast'), 3000);
  }, [saveAccount, petCompanion, t]);

  // Color variables
  const bgColor = isDark ? '#000000' : '#F9FAFB';
  const headerBg = isDark ? '#121316' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#111827';
  const subtextColor = isDark ? '#9CA3AF' : '#6B7280';
  const searchBg = isDark ? '#212226' : '#F0F0F3';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]} edges={['top', 'left', 'right']}>
      {/* Root-Level Privacy Shield Overlay */}
      <PrivacyShield />

      {/* Top Header */}
      <View style={[styles.headerContainer, { backgroundColor: headerBg }]}>
        <View style={styles.topRow}>
          <View style={styles.titleCluster}>
            <ShieldCheck size={24} color={BrandColors.primary} strokeWidth={2} style={styles.pawIcon} />
            <Text style={[styles.appTitle, { color: textColor }]}>Simple OTP</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{accounts.length}</Text>
            </View>
          </View>

          <TouchableOpacity
            testID="settings-btn"
            accessibilityRole="button"
            accessibilityLabel={t('settings.title')}
            onPress={() => setIsSettingsOpen(true)}
            style={styles.settingsBtn}
          >
            <Settings size={22} color={textColor} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Real-time search bar */}
        <View style={[styles.searchBar, { backgroundColor: searchBg }]}>
          <Search size={18} color={subtextColor} strokeWidth={2} style={styles.searchIcon} />
          <TextInput
            testID="search-input"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('dashboard.searchPlaceholder')}
            placeholderTextColor={subtextColor}
            style={[styles.searchInput, { color: textColor }]}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
          {Boolean(searchQuery) && (
            <TouchableOpacity
              testID="search-clear-btn"
              onPress={clearSearch}
              style={styles.clearBtn}
              accessibilityLabel={t('dashboard.clearSearchLabel')}
            >
              <X size={16} color={subtextColor} strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main OTP Cards List */}
      <FlatList
        testID="otp-cards-list"
        data={filteredAccounts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshAccounts}
            tintColor={BrandColors.primary}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyVaultView
              isSearchEmpty={Boolean(searchQuery)}
              searchQuery={searchQuery}
              onClearSearch={clearSearch}
              onAddAccount={() => setIsIngestionOpen(true)}
            />
          ) : null
        }
        renderItem={({ item }) =>
          item.type === 'totp' ? (
            <TotpCard
              account={item}
              currentTimestamp={now}
              onCopy={handleCardCopy}
              onRename={(acc) => setRenameTarget(acc)}
              onDelete={(acc) => deleteAccount(acc.id)}
              onExportQr={(acc) => setAccountForQr(acc)}
              onOptionsPress={setActionTarget}
            />
          ) : (
            <HotpCard
              account={item}
              onCopy={handleCardCopy}
              onIncrement={handleHotpIncrement}
              onRename={(acc) => setRenameTarget(acc)}
              onDelete={(acc) => deleteAccount(acc.id)}
              onExportQr={(acc) => setAccountForQr(acc)}
              onOptionsPress={setActionTarget}
            />
          )
        }
      />

      {/* Floating Action Button (FAB +) */}
      <TouchableOpacity
        testID="fab-add-account"
        onPress={() => setIsIngestionOpen(true)}
        style={styles.fabButton}
        accessibilityRole="button"
        accessibilityLabel={t('ingestion.sheetTitle')}
      >
        <Plus size={28} color="#FFFFFF" strokeWidth={2.5} />
      </TouchableOpacity>

      {/* Speech Bubble (Anchored bottom-right, to the left of the pet) */}
      <SpeechBubble
        testID="dashboard-pet-speech-bubble"
        visible={petCompanion.isSpeechVisible}
        message={petCompanion.speechMessage}
        actionText={petCompanion.speechActionText}
        onAction={petCompanion.openAcademy}
        onDismiss={petCompanion.dismissSpeech}
        position="left"
      />

      {/* Pet Companion (Anchored bottom-right) */}
      <View style={styles.petAnchor} testID="dashboard-pet-anchor">
        <PetCompanion
          petId={petCompanion.petId}
          state={petCompanion.petState}
          onTap={petCompanion.triggerTap}
          displaySize={88}
        />
      </View>

      {/* Ingestion Sheet */}
      <IngestionSheet
        visible={isIngestionOpen}
        onClose={() => setIsIngestionOpen(false)}
        onSelectCamera={() => setIsCameraOpen(true)}
        onSelectGallery={handleGalleryScan}
        onSelectClipboard={handleClipboardScan}
        onSelectManual={() => {
          setManualInitialValues(undefined);
          setIsManualOpen(true);
        }}
      />

      {/* Camera Scanner Modal */}
      <CameraScannerModal
        visible={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onScanSuccess={handleCameraScanSuccess}
        onOpenGallery={handleGalleryScan}
      />

      {/* Manual Entry Modal */}
      <ManualEntryModal
        visible={isManualOpen}
        onClose={() => setIsManualOpen(false)}
        onSave={handleManualSave}
        existingAccounts={accounts}
        initialValues={manualInitialValues}
      />

      {/* Account Action Sheet (Bottom Sheet Options Menu) */}
      <AccountActionSheet
        visible={Boolean(actionTarget)}
        account={actionTarget}
        onClose={() => setActionTarget(null)}
        onEdit={(acc) => {
          setActionTarget(null);
          setEditTarget(acc);
        }}
        onExportQr={(acc) => {
          setActionTarget(null);
          setAccountForQr(acc);
        }}
        onDelete={(acc) => {
          deleteAccount(acc.id);
          setActionTarget(null);
        }}
      />

      {/* Edit Account Modal */}
      <EditAccountModal
        visible={Boolean(editTarget)}
        account={editTarget}
        onClose={() => setEditTarget(null)}
        onSave={updateAccount}
      />

      {/* Rename Account Modal */}
      <RenameAccountModal
        visible={Boolean(renameTarget)}
        account={renameTarget}
        onClose={() => setRenameTarget(null)}
        onSave={renameAccount}
      />

      {/* Account QR Export Modal */}
      <AccountQrModal
        visible={Boolean(accountForQr)}
        account={accountForQr}
        onClose={() => setAccountForQr(null)}
      />

      {/* Settings Modal */}
      <SettingsModal
        visible={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onAccountsRestored={refreshAccounts}
        onOpenAcademy={petCompanion.openAcademy}
      />

      {/* Pet Academy Modal */}
      <PetAcademyModal
        visible={petCompanion.isAcademyOpen}
        onClose={petCompanion.closeAcademy}
        initialLessonId={petCompanion.academyLessonId}
        activePetId={petCompanion.petId}
      />

      {/* Language Welcome Modal for First-Launch / Language Choice */}
      <LanguageWelcomeModal
        visible={showWelcomeModal}
        onComplete={() => setShowWelcomeModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleCluster: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pawIcon: {
    fontSize: 22,
    marginRight: 8,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  countBadge: {
    marginLeft: 8,
    backgroundColor: 'rgba(247, 107, 0, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: {
    color: BrandColors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  settingsBtn: {
    padding: 6,
  },
  settingsIcon: {
    fontSize: 22,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14.5,
    padding: 0,
  },
  clearBtn: {
    padding: 4,
  },
  clearBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 256, // Keeps cards clear of FAB & larger Pet Companion
  },
  fabButton: {
    position: 'absolute',
    right: 28,
    bottom: 80,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BrandColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: BrandColors.primaryDark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      default: {},
    }),
    zIndex: 950,
  },
  fabIcon: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '600',
    lineHeight: 32,
    marginTop: -2,
  },
  petAnchor: {
    position: 'absolute',
    right: 12,
    bottom: 152,
    zIndex: 900,
  },
});
