import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import {
  ClipboardPaste,
  Clock,
  Hash,
  ChevronDown,
  ChevronRight,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { BrandColors, SemanticColors } from '@/constants/theme';
import {
  sanitizeManualSecret,
  validateManualSecret,
} from '@/services/ingestion/manualInput';
import type { OtpAccount, OtpType, OtpAlgorithm } from '@/types/otp';

export interface EditAccountModalProps {
  visible: boolean;
  account: OtpAccount | null;
  onClose: () => void;
  onSave: (updatedAccount: OtpAccount) => Promise<void> | void;
  testID?: string;
}

export const EditAccountModal: React.FC<EditAccountModalProps> = ({
  visible,
  account,
  onClose,
  onSave,
  testID = 'edit-account-modal',
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  // Form states
  const [issuer, setIssuer] = useState('');
  const [accountName, setAccountName] = useState('');
  const [secret, setSecret] = useState('');
  const [type, setType] = useState<OtpType>('totp');
  const [algorithm, setAlgorithm] = useState<OtpAlgorithm>('SHA1');
  const [digits, setDigits] = useState<6 | 8>(6);
  const [period, setPeriod] = useState('30');
  const [counter, setCounter] = useState('0');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Errors & saving status
  const [accountError, setAccountError] = useState<string | null>(null);
  const [secretError, setSecretError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible && account) {
      setIssuer(account.issuer || '');
      setAccountName(account.account || '');
      setSecret(account.secret || '');
      setType(account.type || 'totp');
      setAlgorithm(account.algorithm || 'SHA1');
      setDigits(account.digits || 6);
      setPeriod(String(account.period || 30));
      setCounter(String(account.counter || 0));
      setAccountError(null);
      setSecretError(null);
      setShowAdvanced(false);
      setIsSaving(false);
    }
  }, [visible, account]);

  const handleSecretChange = (text: string) => {
    const sanitized = sanitizeManualSecret(text);
    setSecret(sanitized);
    if (!sanitized) {
      setSecretError(null);
      return;
    }
    const valResult = validateManualSecret(sanitized);
    if (!valResult.isValid) {
      setSecretError(valResult.error || t('editAccount.errInvalidSecret'));
    } else {
      setSecretError(null);
    }
  };

  const handlePasteSecret = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        handleSecretChange(text);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
    } catch {
      // Ignore clipboard error
    }
  };

  const handleSubmit = async () => {
    if (!account) return;

    setAccountError(null);
    setSecretError(null);

    const trimmedAccount = accountName.trim();
    if (!trimmedAccount) {
      setAccountError(t('editAccount.errAccountEmpty'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      return;
    }

    const sanitizedSecret = sanitizeManualSecret(secret);
    if (!sanitizedSecret) {
      setSecretError(t('editAccount.errInvalidSecret'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      return;
    }

    const secretValidation = validateManualSecret(sanitizedSecret);
    if (!secretValidation.isValid) {
      setSecretError(secretValidation.error || t('editAccount.errInvalidSecret'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      return;
    }

    const parsedPeriod = parseInt(period, 10);
    const parsedCounter = parseInt(counter, 10);

    const updatedAccount: OtpAccount = {
      ...account,
      issuer: issuer.trim() || undefined,
      account: trimmedAccount,
      secret: sanitizedSecret,
      type,
      algorithm,
      digits,
      period: type === 'totp' ? (!isNaN(parsedPeriod) && parsedPeriod > 0 ? parsedPeriod : 30) : 30,
      counter: type === 'hotp' ? (!isNaN(parsedCounter) && parsedCounter >= 0 ? parsedCounter : 0) : 0,
    };

    setIsSaving(true);
    try {
      await onSave(updatedAccount);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      onClose();
    } catch (err) {
      console.warn('Failed to update account:', err);
      Alert.alert(t('common.error'), t('editAccount.errSaveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  if (!visible || !account) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      testID={testID}
      accessibilityLabel={t('editAccount.title')}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.headerButton}
              testID={`${testID}-cancel`}
              accessibilityRole="button"
              accessibilityLabel={t('editAccount.cancelBtn')}
            >
              <Text style={[styles.headerCancelText, { color: theme.textSecondary }]}>
                {t('editAccount.cancelBtn')}
              </Text>
            </TouchableOpacity>

            <View style={styles.headerTitleCluster}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>
                {t('editAccount.title')}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSaving}
              style={styles.headerButton}
              testID={`${testID}-save`}
              accessibilityRole="button"
              accessibilityLabel={t('editAccount.saveBtn')}
            >
              <Text style={[styles.headerSaveText, isSaving && { opacity: 0.6 }]}>
                {t('editAccount.saveBtn')}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.formScroll}
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Field: Service / Issuer */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                {t('editAccount.issuerLabel')}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.backgroundElement, color: theme.text },
                ]}
                placeholder={t('editAccount.issuerPlaceholder')}
                placeholderTextColor={theme.textSecondary}
                value={issuer}
                onChangeText={setIssuer}
                testID={`${testID}-input-issuer`}
                autoCapitalize="words"
                editable={!isSaving}
              />
            </View>

            {/* Field: Account Name */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                {t('editAccount.accountLabel')} <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.backgroundElement, color: theme.text },
                  accountError ? styles.inputError : null,
                ]}
                placeholder={t('editAccount.accountPlaceholder')}
                placeholderTextColor={theme.textSecondary}
                value={accountName}
                onChangeText={(val) => {
                  setAccountName(val);
                  if (accountError) setAccountError(null);
                }}
                testID={`${testID}-input-account`}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSaving}
              />
              {accountError && (
                <Text style={styles.errorText} testID={`${testID}-error-account`}>
                  {accountError}
                </Text>
              )}
            </View>

            {/* Field: Secret Key */}
            <View style={styles.fieldGroup}>
              <View style={styles.secretHeaderRow}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                  {t('editAccount.secretLabel')} <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <TouchableOpacity
                  onPress={handlePasteSecret}
                  style={styles.pasteButton}
                  testID={`${testID}-paste-secret`}
                  disabled={isSaving}
                >
                  <ClipboardPaste
                    size={13}
                    color={BrandColors.primary}
                    strokeWidth={2}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.pasteButtonText}>{t('editAccount.pasteSecret')}</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[
                  styles.input,
                  styles.monoInput,
                  { backgroundColor: theme.backgroundElement, color: theme.text },
                  secretError ? styles.inputError : null,
                ]}
                placeholder={t('editAccount.secretPlaceholder')}
                placeholderTextColor={theme.textSecondary}
                value={secret}
                onChangeText={handleSecretChange}
                testID={`${testID}-input-secret`}
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!isSaving}
              />
              {secretError && (
                <Text style={styles.errorText} testID={`${testID}-error-secret`}>
                  {secretError}
                </Text>
              )}
            </View>

            {/* Field: Type Selection */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                {t('editAccount.typeLabel')}
              </Text>
              <View style={styles.segmentedRow}>
                <TouchableOpacity
                  style={[
                    styles.segmentOption,
                    type === 'totp' && styles.segmentActive,
                    {
                      backgroundColor:
                        type === 'totp' ? BrandColors.primary : theme.backgroundElement,
                    },
                  ]}
                  onPress={() => setType('totp')}
                  testID={`${testID}-type-totp`}
                  disabled={isSaving}
                >
                  <Clock
                    size={15}
                    color={type === 'totp' ? '#FFFFFF' : theme.text}
                    strokeWidth={2}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.segmentText,
                      { color: type === 'totp' ? '#FFFFFF' : theme.text },
                    ]}
                  >
                    TOTP
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.segmentOption,
                    type === 'hotp' && styles.segmentActive,
                    {
                      backgroundColor:
                        type === 'hotp' ? BrandColors.primary : theme.backgroundElement,
                    },
                  ]}
                  onPress={() => setType('hotp')}
                  testID={`${testID}-type-hotp`}
                  disabled={isSaving}
                >
                  <Hash
                    size={15}
                    color={type === 'hotp' ? '#FFFFFF' : theme.text}
                    strokeWidth={2}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.segmentText,
                      { color: type === 'hotp' ? '#FFFFFF' : theme.text },
                    ]}
                  >
                    HOTP
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Advanced Settings Collapsible Toggle */}
            <TouchableOpacity
              style={styles.advancedToggle}
              onPress={() => setShowAdvanced((prev) => !prev)}
              testID={`${testID}-toggle-advanced`}
            >
              {showAdvanced ? (
                <ChevronDown
                  size={16}
                  color={BrandColors.primary}
                  strokeWidth={2}
                  style={{ marginRight: 6 }}
                />
              ) : (
                <ChevronRight
                  size={16}
                  color={BrandColors.primary}
                  strokeWidth={2}
                  style={{ marginRight: 6 }}
                />
              )}
              <Text style={styles.advancedToggleText}>{t('editAccount.advancedSettings')}</Text>
            </TouchableOpacity>

            {/* Advanced Settings Section */}
            {showAdvanced && (
              <View style={styles.advancedSection} testID={`${testID}-advanced-section`}>
                {/* Algorithm Selector */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                    {t('editAccount.algorithmLabel')}
                  </Text>
                  <View style={styles.segmentedRow}>
                    {(['SHA1', 'SHA256', 'SHA512'] as OtpAlgorithm[]).map((algo) => (
                      <TouchableOpacity
                        key={algo}
                        style={[
                          styles.segmentOption,
                          algorithm === algo && styles.segmentActive,
                          {
                            backgroundColor:
                              algorithm === algo ? BrandColors.primary : theme.backgroundElement,
                          },
                        ]}
                        onPress={() => setAlgorithm(algo)}
                        testID={`${testID}-algo-${algo.toLowerCase()}`}
                        disabled={isSaving}
                      >
                        <Text
                          style={[
                            styles.segmentText,
                            { color: algorithm === algo ? '#FFFFFF' : theme.text },
                          ]}
                        >
                          {algo}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Digits Selector */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                    {t('editAccount.digitsLabel')}
                  </Text>
                  <View style={styles.segmentedRow}>
                    {([6, 8] as const).map((d) => (
                      <TouchableOpacity
                        key={d}
                        style={[
                          styles.segmentOption,
                          digits === d && styles.segmentActive,
                          {
                            backgroundColor:
                              digits === d ? BrandColors.primary : theme.backgroundElement,
                          },
                        ]}
                        onPress={() => setDigits(d)}
                        testID={`${testID}-digits-${d}`}
                        disabled={isSaving}
                      >
                        <Text
                          style={[
                            styles.segmentText,
                            { color: digits === d ? '#FFFFFF' : theme.text },
                          ]}
                        >
                          {t('editAccount.digitsOption', { count: d })}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Period for TOTP */}
                {type === 'totp' && (
                  <View style={styles.fieldGroup}>
                    <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                      {t('editAccount.periodLabel')}
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        { backgroundColor: theme.backgroundElement, color: theme.text },
                      ]}
                      keyboardType="number-pad"
                      value={period}
                      onChangeText={setPeriod}
                      testID={`${testID}-input-period`}
                      editable={!isSaving}
                    />
                  </View>
                )}

                {/* Counter for HOTP */}
                {type === 'hotp' && (
                  <View style={styles.fieldGroup}>
                    <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                      {t('editAccount.counterLabel')}
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        { backgroundColor: theme.backgroundElement, color: theme.text },
                      ]}
                      keyboardType="number-pad"
                      value={counter}
                      onChangeText={setCounter}
                      testID={`${testID}-input-counter`}
                      editable={!isSaving}
                    />
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  headerButton: {
    minWidth: 60,
  },
  headerTitleCluster: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerCancelText: {
    fontSize: 16,
  },
  headerSaveText: {
    fontSize: 16,
    fontWeight: '700',
    color: BrandColors.primary,
    textAlign: 'right',
  },
  formScroll: {
    flex: 1,
  },
  formContent: {
    padding: 20,
    paddingBottom: 40,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    marginBottom: 8,
  },
  requiredAsterisk: {
    color: SemanticColors.urgent,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  monoInput: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1,
  },
  inputError: {
    borderColor: SemanticColors.urgent,
  },
  errorText: {
    color: SemanticColors.urgent,
    fontSize: 12,
    marginTop: 6,
    marginLeft: 2,
  },
  secretHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pasteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(247, 107, 0, 0.1)',
  },
  pasteButtonText: {
    color: BrandColors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: 10,
  },
  segmentOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  segmentActive: {
    shadowColor: BrandColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
  },
  advancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 10,
  },
  advancedToggleText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: BrandColors.primary,
  },
  advancedSection: {
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128, 128, 128, 0.15)',
    marginBottom: 12,
  },
});
