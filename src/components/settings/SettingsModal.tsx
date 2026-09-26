import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Switch,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import {
  X,
  Globe,
  PawPrint,
  Cat,
  Dog,
  Rabbit,
  GraduationCap,
  Fingerprint,
  Database,
  Upload,
  Download,
  ShieldCheck,
  Plus,
  AlertTriangle,
  Check,
} from 'lucide-react-native';

import { useTheme } from '@/hooks/use-theme';
import { Spacing, BrandColors, SemanticColors } from '@/constants/theme';
import { petStorage } from '@/services/pet/petStorage';
import {
  checkBiometricAvailability,
  isBiometricLockEnabled,
  setBiometricLockEnabled,
  type BiometricType,
} from '@/services/security/biometrics';
import {
  exportEncryptedBackup,
  restoreEncryptedBackup,
} from '@/services/backup/backupCipher';
import { vaultStorage } from '@/services/storage/vaultStorage';
import {
  SUPPORTED_LANGUAGES,
  getSavedLanguagePreference,
  setAppLanguage,
} from '@/services/i18n';
import type { PetId } from '@/types/pet';
import type { OtpAccount } from '@/types/otp';

export interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onAccountsRestored?: () => void;
  onOpenAcademy?: () => void;
}

interface PetOption {
  id: PetId;
  name: string;
  vietnameseName: string;
  desc: string;
}

const PET_ICONS: Record<PetId, React.ComponentType<any>> = {
  'cipher-cat': Cat,
  'byte-dog': Dog,
  'shield-bunny': Rabbit,
};

const PET_OPTIONS: PetOption[] = [
  {
    id: 'cipher-cat',
    name: 'Cipher Cat',
    vietnameseName: 'Mèo Cipher',
    desc: 'Tinh nghịch, nhanh nhẹn, luôn cảnh giác bảo vệ khoá bảo mật.',
  },
  {
    id: 'byte-dog',
    name: 'Byte Dog',
    vietnameseName: 'Chó Byte',
    desc: 'Trung thành, đáng tin cậy, chuyên gia canh gác cổng 2FA.',
  },
  {
    id: 'shield-bunny',
    name: 'Shield Bunny',
    vietnameseName: 'Thỏ Shield',
    desc: 'Thông minh, cẩn thận, chuyên gia về mã hoá và sao lưu.',
  },
];

export function SettingsModal({
  visible,
  onClose,
  onAccountsRestored,
  onOpenAcademy,
}: SettingsModalProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  // Language selection preference ('system' | 'vi' | 'en')
  const [activeLangPref, setActiveLangPref] = useState<'system' | 'vi' | 'en'>('system');

  // Mascot selection
  const [selectedPet, setSelectedPet] = useState<PetId>('cipher-cat');

  // Biometric lock
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [bioTypes, setBioTypes] = useState<BiometricType[]>([]);
  const [isBioEnabled, setIsBioEnabled] = useState(false);
  const [isBioLoading, setIsBioLoading] = useState(false);

  // Backup Export dialog state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportPassphrase, setExportPassphrase] = useState('');
  const [exportConfirmPass, setExportConfirmPass] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Backup Restore state
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoreFileContent, setRestoreFileContent] = useState<string | null>(null);
  const [restoreFileName, setRestoreFileName] = useState('');
  const [restorePassphrase, setRestorePassphrase] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [pendingAccounts, setPendingAccounts] = useState<OtpAccount[] | null>(null);
  const [showStrategyModal, setShowStrategyModal] = useState(false);

  // Initial load
  useEffect(() => {
    if (!visible) return;

    // Load saved language preference
    getSavedLanguagePreference().then((saved) => {
      setActiveLangPref(saved || 'system');
    });

    // Load active pet
    petStorage.getSelectedPet().then(setSelectedPet);
    const unsubPet = petStorage.subscribe(setSelectedPet);

    // Load biometrics status
    checkBiometricAvailability().then((avail) => {
      setHasBiometrics(avail.canAuthenticate);
      setBioTypes(avail.supportedTypes);
    });
    isBiometricLockEnabled().then(setIsBioEnabled);

    return () => {
      unsubPet();
    };
  }, [visible]);

  // Handle language selection
  const handleSelectLanguage = async (code: 'system' | 'vi' | 'en') => {
    setActiveLangPref(code);
    await setAppLanguage(code);
    Haptics.selectionAsync().catch(() => {});
  };

  // Handle pet selection
  const handleSelectPet = async (petId: PetId) => {
    try {
      await petStorage.setSelectedPet(petId);
      setSelectedPet(petId);
      Haptics.selectionAsync().catch(() => {});
    } catch {
      // Ignore error
    }
  };

  // Handle biometric toggle
  const handleToggleBiometrics = async (newVal: boolean) => {
    if (!hasBiometrics && newVal) {
      Alert.alert(
        t('settings.biometricUnavailableTitle'),
        t('settings.biometricUnavailableDesc')
      );
      return;
    }

    setIsBioLoading(true);
    try {
      const res = await setBiometricLockEnabled(newVal, true);
      if (res.success) {
        setIsBioEnabled(newVal);
      } else {
        const current = await isBiometricLockEnabled();
        setIsBioEnabled(current);
        if (res.error && res.error !== 'user_cancel') {
          Alert.alert(t('common.error'), t('settings.biometricFailedTitle'));
        }
      }
    } catch {
      const current = await isBiometricLockEnabled();
      setIsBioEnabled(current);
    } finally {
      setIsBioLoading(false);
    }
  };

  // --- Export Flow Handlers ---
  const handleStartExport = () => {
    setExportPassphrase('');
    setExportConfirmPass('');
    setExportError(null);
    setShowExportModal(true);
  };

  const handleConfirmExport = async () => {
    if (!exportPassphrase || exportPassphrase.length < 6) {
      setExportError(t('backup.errPassLength'));
      return;
    }
    if (exportPassphrase !== exportConfirmPass) {
      setExportError(t('backup.errPassMismatch'));
      return;
    }

    setIsExporting(true);
    setExportError(null);

    try {
      const accounts = await vaultStorage.getAccounts();
      const container = await exportEncryptedBackup(accounts, exportPassphrase);
      const jsonStr = JSON.stringify(container, null, 2);

      const timestamp = new Date().toISOString().slice(0, 10);
      const fileName = `simpleotp_backup_${timestamp}.simpleotp`;
      const backupFile = new File(Paths.cache, fileName);

      if (!backupFile.exists) {
        backupFile.create();
      }
      backupFile.write(jsonStr);

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert(t('backup.shareUnavailableTitle'), t('backup.shareUnavailableMsg'));
        setShowExportModal(false);
        return;
      }

      await Sharing.shareAsync(backupFile.uri, {
        mimeType: 'application/octet-stream',
        dialogTitle: t('backup.exportShareDialogTitle'),
        UTI: 'public.data',
      });

      setShowExportModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Alert.alert(t('backup.exportSuccessTitle'), t('backup.exportSuccessMsg'));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setExportError(`${t('common.error')}: ${msg || 'Unknown'}`);
    } finally {
      setIsExporting(false);
    }
  };

  // --- Restore Flow Handlers ---
  const handleStartRestore = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['*/*', 'application/json', 'application/octet-stream'],
        copyToCacheDirectory: true,
      });

      if (res.canceled || !res.assets || res.assets.length === 0) {
        return;
      }

      const asset = res.assets[0];
      const pickedFile = new File(asset.uri);
      const content = await pickedFile.text();

      setRestoreFileContent(content);
      setRestoreFileName(asset.name || 'backup.simpleotp');
      setRestorePassphrase('');
      setRestoreError(null);
      setShowRestoreModal(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      Alert.alert(t('ingestion.galleryPickErrorTitle'), msg || 'Cannot read file.');
    }
  };

  const handleConfirmDecrypt = async () => {
    if (!restorePassphrase) {
      setRestoreError(t('backup.restoreErrEmpty'));
      return;
    }
    if (!restoreFileContent) {
      setRestoreError(t('backup.restoreErrContent'));
      return;
    }

    setIsRestoring(true);
    setRestoreError(null);

    try {
      const restored = await restoreEncryptedBackup(restoreFileContent, restorePassphrase);
      setPendingAccounts(restored);
      setShowRestoreModal(false);
      setShowStrategyModal(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('AUTH_FAILED') || msg.includes('Decryption failed')) {
        setRestoreError(t('backup.restoreErrWrongPass'));
      } else {
        setRestoreError(`${t('backup.restoreErrPrefix')}${msg}`);
      }
    } finally {
      setIsRestoring(false);
    }
  };

  const handleApplyRestore = async (mode: 'merge' | 'replace') => {
    if (!pendingAccounts) return;

    try {
      if (mode === 'replace') {
        await vaultStorage.resetVault();
        for (const acc of pendingAccounts) {
          await vaultStorage.saveAccount(acc);
        }
      } else {
        // Merge mode
        const existing = await vaultStorage.getAccounts();
        const existingIds = new Set(existing.map((a) => a.id));

        for (const acc of pendingAccounts) {
          if (existingIds.has(acc.id)) {
            await vaultStorage.updateAccount(acc);
          } else {
            await vaultStorage.saveAccount(acc);
          }
        }
      }

      setShowStrategyModal(false);
      setPendingAccounts(null);
      setRestoreFileContent(null);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Alert.alert(
        t('backup.restoreSuccessTitle'),
        t('backup.restoreSuccessMsg', { count: pendingAccounts.length })
      );
      onAccountsRestored?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      Alert.alert(t('backup.storageErrorTitle'), t('backup.storageErrorMsg', { msg }));
    }
  };

  const activePetOption =
    PET_OPTIONS.find((pet) => pet.id === selectedPet) || PET_OPTIONS[0];
  const activePetLocalizedName = t(`pet.${activePetOption.id}.name`, {
    defaultValue: activePetOption.vietnameseName,
  });
  const activePetLocalizedDesc = t(`pet.${activePetOption.id}.description`, {
    defaultValue: activePetOption.desc,
  });
  const activePetTitle = t(`pet.${activePetOption.id}.title`, {
    defaultValue: activePetOption.name,
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      testID="settings-modal"
    >
      <View style={styles.overlay}>
        <SafeAreaView style={[styles.sheet, { backgroundColor: theme.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.headerTitle, { color: theme.text }]}>
                {t('settings.title')}
              </Text>
              <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                {t('settings.subtitle')}
              </Text>
            </View>

            <TouchableOpacity
              testID="settings-close-button"
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: theme.backgroundElement }]}
              accessibilityRole="button"
              accessibilityLabel={t('settings.closeBtn')}
            >
              <X size={20} color={theme.text} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {/* 0. Language Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Globe size={18} color={theme.text} strokeWidth={2} style={{ marginRight: 8 }} />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  {t('settings.languageSection')}
                </Text>
              </View>
              <Text style={[styles.sectionDesc, { color: theme.textSecondary }]}>
                {t('settings.languageSubtitle')}
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.horizontalScroll}
                contentContainerStyle={styles.langScrollContainer}
              >
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const isSelected = activeLangPref === lang.code;
                  return (
                    <TouchableOpacity
                      key={lang.code}
                      testID={`settings-lang-option-${lang.code}`}
                      onPress={() => handleSelectLanguage(lang.code as 'system' | 'vi' | 'en')}
                      style={[
                        styles.langPill,
                        {
                          backgroundColor: isSelected
                            ? theme.backgroundSelected
                            : theme.backgroundElement,
                          borderColor: isSelected ? BrandColors.primary : 'transparent',
                        },
                      ]}
                      activeOpacity={0.7}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                    >
                      {lang.isSystem ? (
                        <Globe
                          size={18}
                          color={isSelected ? BrandColors.primary : theme.text}
                          strokeWidth={2}
                          style={{ marginRight: 2 }}
                        />
                      ) : (
                        <Text style={styles.langFlag}>{lang.flag}</Text>
                      )}
                      <Text
                        style={[
                          styles.langTitle,
                          {
                            color: isSelected ? BrandColors.primary : theme.text,
                            fontWeight: isSelected ? '700' : '600',
                          },
                        ]}
                      >
                        {lang.titleKey ? t(lang.titleKey) : lang.name}
                      </Text>
                      {isSelected && (
                        <Check size={16} color={BrandColors.primary} strokeWidth={2.5} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* 1. Mascot Companion Picker */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <PawPrint size={18} color={theme.text} strokeWidth={2} style={{ marginRight: 8 }} />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  {t('settings.mascotSection')}
                </Text>
              </View>
              <Text style={[styles.sectionDesc, { color: theme.textSecondary }]}>
                {t('settings.mascotSubtitle')}
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.horizontalScroll}
                contentContainerStyle={styles.petScrollContainer}
              >
                {PET_OPTIONS.map((pet) => {
                  const isSelected = selectedPet === pet.id;
                  const IconComp = PET_ICONS[pet.id] || Cat;
                  const localizedName = t(`pet.${pet.id}.name`, { defaultValue: pet.vietnameseName });

                  return (
                    <TouchableOpacity
                      key={pet.id}
                      testID={`pet-select-${pet.id}`}
                      onPress={() => handleSelectPet(pet.id)}
                      activeOpacity={0.7}
                      style={[
                        styles.petCard,
                        {
                          backgroundColor: isSelected
                            ? theme.backgroundSelected
                            : theme.backgroundElement,
                          borderColor: isSelected ? BrandColors.primary : 'transparent',
                        },
                      ]}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                    >
                      {isSelected && (
                        <View style={styles.petBadge}>
                          <Check size={10} color="#FFFFFF" strokeWidth={3} />
                        </View>
                      )}
                      <View
                        style={[
                          styles.petIconBox,
                          isSelected && { backgroundColor: 'rgba(247, 107, 0, 0.15)' },
                        ]}
                      >
                        <IconComp
                          size={24}
                          color={isSelected ? BrandColors.primary : theme.text}
                          strokeWidth={2}
                        />
                      </View>
                      <Text
                        style={[
                          styles.petName,
                          {
                            color: isSelected ? BrandColors.primary : theme.text,
                            fontWeight: isSelected ? '700' : '600',
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {localizedName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Active Pet Preview Card */}
              <View
                style={[
                  styles.petPreviewCard,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.backgroundSelected,
                  },
                ]}
              >
                <View style={styles.petPreviewHeader}>
                  <View style={styles.petPreviewBadge}>
                    <Text style={styles.petPreviewBadgeText}>{activePetTitle}</Text>
                  </View>
                  <Text style={[styles.petPreviewName, { color: theme.textSecondary }]}>
                    {activePetLocalizedName}
                  </Text>
                </View>
                <Text style={[styles.petPreviewDesc, { color: theme.textSecondary }]}>
                  {activePetLocalizedDesc}
                </Text>

                {onOpenAcademy && (
                  <TouchableOpacity
                    testID="open-academy-button"
                    onPress={onOpenAcademy}
                    style={[styles.academyBtn, { backgroundColor: theme.backgroundSelected }]}
                    activeOpacity={0.7}
                  >
                    <View style={styles.rowCentered}>
                      <GraduationCap
                        size={18}
                        color={BrandColors.primary}
                        strokeWidth={2}
                        style={{ marginRight: 8 }}
                      />
                      <Text style={[styles.academyBtnText, { color: theme.text }]}>
                        {t('settings.academyBtn')}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* 2. Biometrics Lock */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Fingerprint size={18} color={theme.text} strokeWidth={2} style={{ marginRight: 8 }} />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  {t('settings.biometricSection')}
                </Text>
              </View>
              <Text style={[styles.sectionDesc, { color: theme.textSecondary }]}>
                {t('settings.biometricSubtitle')}
              </Text>

              <View style={[styles.settingRow, { backgroundColor: theme.backgroundElement }]}>
                <View style={styles.settingRowText}>
                  <Text style={[styles.settingLabel, { color: theme.text }]}>
                    {bioTypes.includes('FACIAL_RECOGNITION')
                      ? 'Face ID / PIN'
                      : 'Fingerprint / PIN'}
                  </Text>
                  <Text style={[styles.settingSub, { color: theme.textSecondary }]}>
                    {hasBiometrics
                      ? t('settings.biometricSubtitle')
                      : t('settings.biometricUnavailableDesc')}
                  </Text>
                </View>

                {isBioLoading ? (
                  <ActivityIndicator size="small" color={BrandColors.primary} />
                ) : (
                  <Switch
                    testID="biometric-lock-switch"
                    value={isBioEnabled}
                    onValueChange={handleToggleBiometrics}
                    disabled={!hasBiometrics}
                    trackColor={{ false: '#767577', true: 'rgba(247, 107, 0, 0.38)' }}
                    thumbColor={isBioEnabled ? BrandColors.primary : '#f4f3f4'}
                    ios_backgroundColor="#767577"
                  />
                )}
              </View>
            </View>

            {/* 3. Encrypted Backup & Restore */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Database size={18} color={theme.text} strokeWidth={2} style={{ marginRight: 8 }} />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  {t('settings.backupSection')}
                </Text>
              </View>
              <Text style={[styles.sectionDesc, { color: theme.textSecondary }]}>
                {t('settings.backupSubtitle')}
              </Text>

              <View style={styles.backupActions}>
                <TouchableOpacity
                  testID="export-backup-button"
                  onPress={handleStartExport}
                  style={[styles.actionBtn, styles.exportBtn]}
                >
                  <Upload size={16} color="#FFFFFF" strokeWidth={2} style={{ marginRight: 6 }} />
                  <Text style={styles.actionBtnText}>{t('settings.exportBtn')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  testID="restore-backup-button"
                  onPress={handleStartRestore}
                  style={[styles.actionBtn, styles.restoreBtn]}
                >
                  <Download size={16} color={theme.text} strokeWidth={2} style={{ marginRight: 6 }} />
                  <Text style={styles.actionBtnText}>{t('settings.restoreBtn')}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 4. About & Zero-Network Guarantee */}
            <View style={[styles.section, styles.aboutSection, { backgroundColor: theme.backgroundElement }]}>
              <View style={styles.sectionHeaderRow}>
                <ShieldCheck size={20} color={SemanticColors.success} strokeWidth={2} style={{ marginRight: 8 }} />
                <Text style={[styles.aboutTitle, { color: theme.text }]}>
                  {t('settings.offlineGuaranteeTitle')}
                </Text>
              </View>
              <Text style={[styles.aboutText, { color: theme.textSecondary }]}>
                {t('settings.offlineGuaranteeDesc')}
              </Text>
            </View>
          </ScrollView>

          {/* Sub-Modal: Export Passphrase Input */}
          {showExportModal && (
            <View style={styles.dialogOverlay}>
              <View style={[styles.dialogCard, { backgroundColor: theme.background }]}>
                <Text style={[styles.dialogTitle, { color: theme.text }]}>
                  {t('backup.exportModalTitle')}
                </Text>
                <Text style={[styles.dialogDesc, { color: theme.textSecondary }]}>
                  {t('backup.exportModalSubtitle')}
                </Text>

                <TextInput
                  testID="export-passphrase-input"
                  style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
                  placeholder={t('backup.passphrasePlaceholder')}
                  placeholderTextColor={theme.textSecondary}
                  secureTextEntry
                  value={exportPassphrase}
                  onChangeText={setExportPassphrase}
                />

                <TextInput
                  testID="export-confirm-passphrase-input"
                  style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
                  placeholder={t('backup.confirmPassphrasePlaceholder')}
                  placeholderTextColor={theme.textSecondary}
                  secureTextEntry
                  value={exportConfirmPass}
                  onChangeText={setExportConfirmPass}
                />

                {exportError && <Text style={styles.errorText}>{exportError}</Text>}

                <View style={styles.dialogButtonRow}>
                  <TouchableOpacity
                    testID="export-cancel-button"
                    onPress={() => setShowExportModal(false)}
                    style={[styles.dialogBtn, { backgroundColor: theme.backgroundElement }]}
                  >
                    <Text style={{ color: theme.text }}>{t('common.cancel')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    testID="export-confirm-button"
                    onPress={handleConfirmExport}
                    disabled={isExporting}
                    style={[styles.dialogBtn, styles.primaryBtn]}
                  >
                    {isExporting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.primaryBtnText}>{t('backup.exportConfirmBtn')}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Sub-Modal: Restore Passphrase Decrypt */}
          {showRestoreModal && (
            <View style={styles.dialogOverlay}>
              <View style={[styles.dialogCard, { backgroundColor: theme.background }]}>
                <Text style={[styles.dialogTitle, { color: theme.text }]}>
                  {t('backup.restoreModalTitle')}
                </Text>
                <Text style={[styles.dialogDesc, { color: theme.textSecondary }]}>
                  {t('backup.restoreFileLabel')} {restoreFileName}
                </Text>

                <TextInput
                  testID="restore-passphrase-input"
                  style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
                  placeholder={t('backup.restorePassPlaceholder')}
                  placeholderTextColor={theme.textSecondary}
                  secureTextEntry
                  value={restorePassphrase}
                  onChangeText={setRestorePassphrase}
                />

                {restoreError && <Text style={styles.errorText}>{restoreError}</Text>}

                <View style={styles.dialogButtonRow}>
                  <TouchableOpacity
                    testID="restore-cancel-button"
                    onPress={() => setShowRestoreModal(false)}
                    style={[styles.dialogBtn, { backgroundColor: theme.backgroundElement }]}
                  >
                    <Text style={{ color: theme.text }}>{t('common.cancel')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    testID="restore-decrypt-button"
                    onPress={handleConfirmDecrypt}
                    disabled={isRestoring}
                    style={[styles.dialogBtn, styles.primaryBtn]}
                  >
                    {isRestoring ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.primaryBtnText}>{t('backup.restoreDecryptBtn')}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Sub-Modal: Restore Merge vs. Replace Choice */}
          {showStrategyModal && pendingAccounts && (
            <View style={styles.dialogOverlay}>
              <View style={[styles.dialogCard, { backgroundColor: theme.background }]}>
                <Text style={[styles.dialogTitle, { color: theme.text }]}>
                  {t('backup.strategyTitle')}
                </Text>
                <Text style={[styles.dialogDesc, { color: theme.textSecondary }]}>
                  {t('backup.strategySubtitle', { count: pendingAccounts.length })}
                </Text>

                <TouchableOpacity
                  testID="restore-merge-button"
                  onPress={() => handleApplyRestore('merge')}
                  style={[styles.choiceBtn, { backgroundColor: theme.backgroundElement }]}
                >
                  <View style={styles.choiceHeaderRow}>
                    <Plus size={16} color={BrandColors.primary} strokeWidth={2.5} style={{ marginRight: 6 }} />
                    <Text style={[styles.choiceTitle, { color: theme.text }]}>
                      {t('backup.mergeOptionTitle')}
                    </Text>
                  </View>
                  <Text style={[styles.choiceDesc, { color: theme.textSecondary }]}>
                    {t('backup.mergeOptionDesc')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  testID="restore-replace-button"
                  onPress={() => {
                    Alert.alert(
                      t('backup.replaceOptionTitle'),
                      t('backup.replaceOptionDesc'),
                      [
                        { text: t('common.cancel'), style: 'cancel' },
                        {
                          text: t('common.confirm'),
                          style: 'destructive',
                          onPress: () => handleApplyRestore('replace'),
                        },
                      ]
                    );
                  }}
                  style={[styles.choiceBtn, styles.dangerChoiceBtn]}
                >
                  <View style={styles.choiceHeaderRow}>
                    <AlertTriangle size={16} color={SemanticColors.urgent} strokeWidth={2} style={{ marginRight: 6 }} />
                    <Text style={styles.dangerChoiceTitle}>
                      {t('backup.replaceOptionTitle')}
                    </Text>
                  </View>
                  <Text style={[styles.choiceDesc, { color: theme.textSecondary }]}>
                    {t('backup.replaceOptionDesc')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowStrategyModal(false)}
                  style={[styles.dialogBtn, { marginTop: 12, backgroundColor: theme.backgroundElement }]}
                >
                  <Text style={{ textAlign: 'center', color: theme.text }}>{t('common.cancel')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '92%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionDesc: {
    fontSize: 13,
    marginBottom: Spacing.one,
  },
  horizontalScroll: {
    marginHorizontal: -Spacing.four,
  },
  langScrollContainer: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
    paddingVertical: Spacing.half,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: Spacing.three,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: Spacing.one + 2,
  },
  langFlag: {
    fontSize: 20,
  },
  langTitle: {
    fontSize: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  rowCentered: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  petScrollContainer: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.one + 2,
    paddingVertical: Spacing.half,
  },
  petCard: {
    width: 104,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    gap: 6,
  },
  petBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  petIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  petEmoji: {
    fontSize: 26,
  },
  petName: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  petPreviewCard: {
    padding: Spacing.three,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: Spacing.two,
    gap: Spacing.two,
  },
  petPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  petPreviewBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(247, 107, 0, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  petPreviewBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.primary,
  },
  petPreviewName: {
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 1,
  },
  petPreviewDesc: {
    fontSize: 13,
    lineHeight: 19,
  },
  academyBtn: {
    padding: Spacing.three - 4,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  academyBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: 16,
  },
  settingRowText: {
    flex: 1,
    paddingRight: Spacing.three,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  settingSub: {
    fontSize: 12,
    marginTop: 2,
  },
  backupActions: {
    gap: Spacing.two,
  },
  actionBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: Spacing.three,
    borderRadius: 14,
    alignItems: 'center',
  },
  exportBtn: {
    backgroundColor: BrandColors.primary,
  },
  restoreBtn: {
    backgroundColor: SemanticColors.success,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  aboutSection: {
    padding: Spacing.three,
    borderRadius: 16,
    marginTop: Spacing.two,
  },
  aboutTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  aboutText: {
    fontSize: 12,
    lineHeight: 18,
  },
  dialogOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    zIndex: 100,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: Spacing.four,
    gap: Spacing.three,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  dialogDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 14,
  },
  errorText: {
    color: SemanticColors.urgent,
    fontSize: 12,
    fontWeight: '500',
  },
  dialogButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  dialogBtn: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 10,
  },
  primaryBtn: {
    backgroundColor: BrandColors.primary,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  choiceBtn: {
    padding: Spacing.three,
    borderRadius: 12,
    gap: 4,
  },
  dangerChoiceBtn: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  choiceTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  dangerChoiceTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: SemanticColors.urgent,
  },
  choiceDesc: {
    fontSize: 12,
  },
});
