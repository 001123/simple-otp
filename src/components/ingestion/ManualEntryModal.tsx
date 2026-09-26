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
import { useTheme } from '@/hooks/use-theme';
import {
  sanitizeManualSecret,
  validateManualSecret,
  validateManualEntryForm,
  createOtpAccountFromManual,
  type ManualEntryFormValues,
} from '@/services/ingestion/manualInput';
import { findDuplicateAccount } from '@/services/ingestion/ingestionRouter';
import type { OtpAccount, OtpType, OtpAlgorithm } from '@/types/otp';

export interface ManualEntryModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (account: OtpAccount) => void;
  existingAccounts: OtpAccount[];
  initialValues?: Partial<ManualEntryFormValues>;
  testID?: string;
}

export function ManualEntryModal({
  visible,
  onClose,
  onSave,
  existingAccounts,
  initialValues,
  testID = 'manual-entry-modal',
}: ManualEntryModalProps) {
  const theme = useTheme();

  // Form State
  const [issuer, setIssuer] = useState('');
  const [account, setAccount] = useState('');
  const [secret, setSecret] = useState('');
  const [type, setType] = useState<OtpType>('totp');
  const [algorithm, setAlgorithm] = useState<OtpAlgorithm>('SHA1');
  const [digits, setDigits] = useState<6 | 8>(6);
  const [period, setPeriod] = useState('30');
  const [counter, setCounter] = useState('0');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Validation feedback state
  const [secretError, setSecretError] = useState<string | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);

  // Initialize or reset form values
  useEffect(() => {
    if (visible) {
      setIssuer(initialValues?.issuer || '');
      setAccount(initialValues?.account || '');
      const initialSecret = initialValues?.secret ? sanitizeManualSecret(initialValues.secret) : '';
      setSecret(initialSecret);
      setType((initialValues?.type as OtpType) || 'totp');
      setAlgorithm((initialValues?.algorithm as OtpAlgorithm) || 'SHA1');
      setDigits((initialValues?.digits as 6 | 8) || 6);
      setPeriod(String(initialValues?.period || 30));
      setCounter(String(initialValues?.counter || 0));
      setSecretError(null);
      setAccountError(null);
      setShowAdvanced(false);
    }
  }, [visible, initialValues]);

  // Real-time secret change handler
  const handleSecretChange = (text: string) => {
    const cleaned = sanitizeManualSecret(text);
    setSecret(cleaned);

    if (cleaned.length === 0) {
      setSecretError(null);
      return;
    }

    const validation = validateManualSecret(cleaned);
    if (!validation.isValid) {
      setSecretError(validation.error || 'Khóa Base32 không hợp lệ');
    } else {
      setSecretError(null);
    }
  };

  // 1-Tap Paste from clipboard
  const handlePasteSecret = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        handleSecretChange(text);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
    } catch {
      // Graceful fallback
    }
  };

  // Submit Handler with Duplicate Detection
  const handleSubmit = () => {
    setAccountError(null);
    setSecretError(null);

    const formValues: ManualEntryFormValues = {
      account,
      issuer: issuer.trim() || undefined,
      secret,
      type,
      algorithm,
      digits,
      period: type === 'totp' ? parseInt(period, 10) || 30 : 30,
      counter: type === 'hotp' ? parseInt(counter, 10) || 0 : 0,
    };

    const validation = validateManualEntryForm(formValues);
    if (!validation.isValid) {
      if (validation.errors.account) setAccountError(validation.errors.account);
      if (validation.errors.secret) setSecretError(validation.errors.secret);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      return;
    }

    // Duplicate Check
    const duplicate = findDuplicateAccount(
      { issuer: formValues.issuer, account: formValues.account, secret: formValues.secret },
      existingAccounts
    );

    if (duplicate) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      Alert.alert(
        'Tài khoản đã tồn tại',
        `Tài khoản "${duplicate.issuer ? duplicate.issuer + ' (' + duplicate.account + ')' : duplicate.account}" với khóa này đã có trong kho lưu trữ của bạn.`,
        [{ text: 'Đã hiểu', style: 'cancel' }]
      );
      return;
    }

    // Construct Canonical Account Model
    const newAccount = createOtpAccountFromManual(formValues);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    onSave(newAccount);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      testID={testID}
      accessibilityLabel="Nhập khoá thủ công"
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} testID={`${testID}-cancel`}>
              <Text style={[styles.headerCancelText, { color: theme.textSecondary }]}>Hủy</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Nhập khoá thủ công</Text>
            <TouchableOpacity onPress={handleSubmit} testID={`${testID}-submit`}>
              <Text style={styles.headerSaveText}>Lưu</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.formScroll}
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Field: Issuer */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                Tên tổ chức / Dịch vụ (Tùy chọn)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.backgroundElement, color: theme.text },
                ]}
                placeholder="VD: Google, GitHub, Amazon..."
                placeholderTextColor={theme.textSecondary}
                value={issuer}
                onChangeText={setIssuer}
                testID={`${testID}-input-issuer`}
                autoCapitalize="words"
              />
            </View>

            {/* Field: Account Name */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                Tên tài khoản / Email <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.backgroundElement, color: theme.text },
                  accountError ? styles.inputError : null,
                ]}
                placeholder="VD: user@example.com hoặc username"
                placeholderTextColor={theme.textSecondary}
                value={account}
                onChangeText={(val) => {
                  setAccount(val);
                  if (accountError) setAccountError(null);
                }}
                testID={`${testID}-input-account`}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {accountError && (
                <Text style={styles.errorText} testID={`${testID}-error-account`}>
                  {accountError}
                </Text>
              )}
            </View>

            {/* Field: Secret Key (Base32) */}
            <View style={styles.fieldGroup}>
              <View style={styles.secretHeaderRow}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                  Khóa bí mật (Base32) <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <TouchableOpacity
                  onPress={handlePasteSecret}
                  style={styles.pasteButton}
                  testID={`${testID}-paste-secret`}
                >
                  <Text style={styles.pasteButtonText}>📋 Dán</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[
                  styles.input,
                  styles.monoInput,
                  { backgroundColor: theme.backgroundElement, color: theme.text },
                  secretError ? styles.inputError : null,
                ]}
                placeholder="VD: JBSWY3DPEHPK3PXP"
                placeholderTextColor={theme.textSecondary}
                value={secret}
                onChangeText={handleSecretChange}
                testID={`${testID}-input-secret`}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              {secretError ? (
                <Text style={styles.errorText} testID={`${testID}-error-secret`}>
                  {secretError}
                </Text>
              ) : (
                <Text style={[styles.helperText, { color: theme.textSecondary }]}>
                  Chỉ gồm các chữ cái A-Z và chữ số 2-7. Tự động loại bỏ dấu cách.
                </Text>
              )}
            </View>

            {/* Field: Type Selection (TOTP vs HOTP) */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                Loại mã xác thực
              </Text>
              <View style={styles.segmentedRow}>
                <TouchableOpacity
                  style={[
                    styles.segmentOption,
                    type === 'totp' && styles.segmentActive,
                    { backgroundColor: type === 'totp' ? '#3c87f7' : theme.backgroundElement },
                  ]}
                  onPress={() => setType('totp')}
                  testID={`${testID}-type-totp`}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      { color: type === 'totp' ? '#FFFFFF' : theme.text },
                    ]}
                  >
                    ⏱️ Theo thời gian (TOTP)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.segmentOption,
                    type === 'hotp' && styles.segmentActive,
                    { backgroundColor: type === 'hotp' ? '#3c87f7' : theme.backgroundElement },
                  ]}
                  onPress={() => setType('hotp')}
                  testID={`${testID}-type-hotp`}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      { color: type === 'hotp' ? '#FFFFFF' : theme.text },
                    ]}
                  >
                    🔢 Theo số đếm (HOTP)
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
              <Text style={styles.advancedToggleText}>
                {showAdvanced ? '▼ Thu gọn tùy chọn nâng cao' : '▶ Tùy chọn nâng cao (Thuật toán, Số chữ số...)'}
              </Text>
            </TouchableOpacity>

            {/* Advanced Settings Section */}
            {showAdvanced && (
              <View style={styles.advancedSection} testID={`${testID}-advanced-section`}>
                {/* Algorithm Selector */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                    Thuật toán băm (Algorithm)
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
                              algorithm === algo ? '#3c87f7' : theme.backgroundElement,
                          },
                        ]}
                        onPress={() => setAlgorithm(algo)}
                        testID={`${testID}-algo-${algo.toLowerCase()}`}
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
                    Số chữ số hiển thị (Digits)
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
                              digits === d ? '#3c87f7' : theme.backgroundElement,
                          },
                        ]}
                        onPress={() => setDigits(d)}
                        testID={`${testID}-digits-${d}`}
                      >
                        <Text
                          style={[
                            styles.segmentText,
                            { color: digits === d ? '#FFFFFF' : theme.text },
                          ]}
                        >
                          {d} Chữ số
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Period for TOTP */}
                {type === 'totp' && (
                  <View style={styles.fieldGroup}>
                    <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                      Chu kỳ đổi mã (Giây)
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
                    />
                  </View>
                )}

                {/* Counter for HOTP */}
                {type === 'hotp' && (
                  <View style={styles.fieldGroup}>
                    <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                      Bộ đếm ban đầu (Counter)
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
                    />
                  </View>
                )}
              </View>
            )}

            {/* Bottom Primary Save Button */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              testID={`${testID}-bottom-save`}
            >
              <Text style={styles.submitButtonText}>Thêm tài khoản vào kho</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#8E8E93',
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
    color: '#3c87f7',
  },
  formScroll: {
    flex: 1,
  },
  formContent: {
    padding: 20,
    gap: 18,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  requiredAsterisk: {
    color: '#EF4444',
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  monoInput: {
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }),
    letterSpacing: 1,
  },
  inputError: {
    borderWidth: 1.5,
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  helperText: {
    fontSize: 12,
    marginTop: 2,
  },
  secretHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pasteButton: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pasteButtonText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: '#3c87f7',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
  },
  advancedToggle: {
    paddingVertical: 8,
  },
  advancedToggleText: {
    color: '#3c87f7',
    fontSize: 13,
    fontWeight: '600',
  },
  advancedSection: {
    gap: 16,
    paddingTop: 8,
  },
  submitButton: {
    backgroundColor: '#3c87f7',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
