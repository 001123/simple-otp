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
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';

import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
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
  emoji: string;
  desc: string;
}

const PET_OPTIONS: PetOption[] = [
  {
    id: 'cipher-cat',
    name: 'Cipher Cat',
    vietnameseName: 'Mèo Cipher',
    emoji: '🐱',
    desc: 'Tinh nghịch, nhanh nhẹn, luôn cảnh giác bảo vệ khoá bảo mật.',
  },
  {
    id: 'byte-dog',
    name: 'Byte Dog',
    vietnameseName: 'Chó Byte',
    emoji: '🐶',
    desc: 'Trung thành, đáng tin cậy, chuyên gia canh gác cổng 2FA.',
  },
  {
    id: 'shield-bunny',
    name: 'Shield Bunny',
    vietnameseName: 'Thỏ Shield',
    emoji: '🐰',
    desc: 'Thông minh, cẩn thận, chuyên gia về mã hoá và sao lưu.',
  },
];

export function SettingsModal({
  visible,
  onClose,
  onAccountsRestored,
  onOpenAcademy,
}: SettingsModalProps) {
  const theme = useTheme();

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
        'Sinh trắc học không khả dụng',
        'Thiết bị chưa cài đặt hoặc không hỗ trợ Face ID / Vân tay / PIN.'
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
          Alert.alert('Lỗi xác thực', 'Không thể thay đổi trạng thái khoá sinh trắc học.');
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
      setExportError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (exportPassphrase !== exportConfirmPass) {
      setExportError('Mật khẩu xác nhận không khớp.');
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
        Alert.alert('Không hỗ trợ chia sẻ', 'Thiết bị không hỗ trợ tính năng chia sẻ tệp.');
        setShowExportModal(false);
        return;
      }

      await Sharing.shareAsync(backupFile.uri, {
        mimeType: 'application/octet-stream',
        dialogTitle: 'Lưu tệp sao lưu Simple OTP',
        UTI: 'public.data',
      });

      setShowExportModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Alert.alert('Thành công', 'Đã xuất tệp sao lưu mã hoá an toàn.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setExportError(`Lỗi sao lưu: ${msg || 'Không xác định'}`);
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
      Alert.alert('Lỗi chọn tệp', msg || 'Không thể đọc tệp đã chọn.');
    }
  };

  const handleConfirmDecrypt = async () => {
    if (!restorePassphrase) {
      setRestoreError('Vui lòng nhập mật khẩu giải mã.');
      return;
    }
    if (!restoreFileContent) {
      setRestoreError('Không tìm thấy nội dung tệp sao lưu.');
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
        setRestoreError('Mật khẩu không chính xác hoặc dữ liệu sao lưu bị hỏng.');
      } else {
        setRestoreError(`Giải mã thất bại: ${msg}`);
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
        'Khôi phục thành công',
        `Đã nạp ${pendingAccounts.length} tài khoản vào kho bảo mật.`
      );
      onAccountsRestored?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      Alert.alert('Lỗi lưu trữ', `Không thể ghi tài khoản: ${msg}`);
    }
  };

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
              <Text style={[styles.headerTitle, { color: theme.text }]}>⚙️ Cài đặt</Text>
              <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                Bảo mật, Thú cưng & Sao lưu
              </Text>
            </View>

            <TouchableOpacity
              testID="settings-close-button"
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: theme.backgroundElement }]}
              accessibilityRole="button"
              accessibilityLabel="Đóng cài đặt"
            >
              <Text style={[styles.closeBtnText, { color: theme.text }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {/* 1. Mascot Companion Picker */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                🐾 Thú cưng đồng hành
              </Text>
              <Text style={[styles.sectionDesc, { color: theme.textSecondary }]}>
                Chọn linh vật bảo vệ kho mã và tương tác cùng bạn
              </Text>

              <View style={styles.petList}>
                {PET_OPTIONS.map((pet) => {
                  const isSelected = selectedPet === pet.id;
                  return (
                    <TouchableOpacity
                      key={pet.id}
                      testID={`pet-select-${pet.id}`}
                      onPress={() => handleSelectPet(pet.id)}
                      style={[
                        styles.petCard,
                        {
                          backgroundColor: isSelected
                            ? theme.backgroundSelected
                            : theme.backgroundElement,
                          borderColor: isSelected ? '#3B82F6' : 'transparent',
                        },
                      ]}
                    >
                      <Text style={styles.petEmoji}>{pet.emoji}</Text>
                      <View style={styles.petMeta}>
                        <View style={styles.petNameRow}>
                          <Text style={[styles.petName, { color: theme.text }]}>
                            {pet.vietnameseName} ({pet.name})
                          </Text>
                          {isSelected && (
                            <Text style={styles.activeBadge}>✓ Đang chọn</Text>
                          )}
                        </View>
                        <Text style={[styles.petDesc, { color: theme.textSecondary }]}>
                          {pet.desc}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {onOpenAcademy && (
                <TouchableOpacity
                  testID="open-academy-button"
                  onPress={onOpenAcademy}
                  style={[styles.academyBtn, { backgroundColor: theme.backgroundElement }]}
                >
                  <Text style={[styles.academyBtnText, { color: theme.text }]}>
                    🎓 Mở Pet Academy (Học bảo mật 2FA)
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* 2. Biometrics Lock */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                🔒 Khoá bảo vệ sinh trắc học
              </Text>
              <Text style={[styles.sectionDesc, { color: theme.textSecondary }]}>
                Yêu cầu Face ID, Vân tay hoặc PIN máy mỗi khi mở hoặc chuyển lại ứng dụng
              </Text>

              <View style={[styles.settingRow, { backgroundColor: theme.backgroundElement }]}>
                <View style={styles.settingRowText}>
                  <Text style={[styles.settingLabel, { color: theme.text }]}>
                    {bioTypes.includes('FACIAL_RECOGNITION')
                      ? 'Khoá bằng Face ID / PIN'
                      : 'Khoá bằng Vân tay / PIN'}
                  </Text>
                  <Text style={[styles.settingSub, { color: theme.textSecondary }]}>
                    {hasBiometrics
                      ? 'Tự động che mờ màn hình và khoá khi thoát ra ngoài'
                      : 'Thiết bị không hỗ trợ hoặc chưa cài sinh trắc học'}
                  </Text>
                </View>

                {isBioLoading ? (
                  <ActivityIndicator size="small" color="#3B82F6" />
                ) : (
                  <Switch
                    testID="biometric-lock-switch"
                    value={isBioEnabled}
                    onValueChange={handleToggleBiometrics}
                    disabled={!hasBiometrics}
                    trackColor={{ false: '#767577', true: '#3B82F6' }}
                  />
                )}
              </View>
            </View>

            {/* 3. Encrypted Backup & Restore */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                📦 Sao lưu & Khôi phục dữ liệu
              </Text>
              <Text style={[styles.sectionDesc, { color: theme.textSecondary }]}>
                Mã hoá toàn diện chuẩn AES-256-GCM với 100.000 vòng lặp PBKDF2
              </Text>

              <View style={styles.backupActions}>
                <TouchableOpacity
                  testID="export-backup-button"
                  onPress={handleStartExport}
                  style={[styles.actionBtn, styles.exportBtn]}
                >
                  <Text style={styles.actionBtnText}>📤 Xuất sao lưu mã hoá (.simpleotp)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  testID="restore-backup-button"
                  onPress={handleStartRestore}
                  style={[styles.actionBtn, styles.restoreBtn]}
                >
                  <Text style={styles.actionBtnText}>📥 Khôi phục từ tệp sao lưu</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 4. About & Zero-Network Guarantee */}
            <View style={[styles.section, styles.aboutSection, { backgroundColor: theme.backgroundElement }]}>
              <Text style={[styles.aboutTitle, { color: theme.text }]}>
                🛡️ Cam kết Offline 100%
              </Text>
              <Text style={[styles.aboutText, { color: theme.textSecondary }]}>
                Simple OTP v1.0.0 hoàn toàn không sử dụng kết nối mạng, không gửi phân tích dữ liệu, và không lưu trữ đám mây. Mọi khoá OTP được mã hoá an toàn trong phần cứng thiết bị của bạn.
              </Text>
            </View>
          </ScrollView>

          {/* Sub-Modal: Export Passphrase Input */}
          {showExportModal && (
            <View style={styles.dialogOverlay}>
              <View style={[styles.dialogCard, { backgroundColor: theme.background }]}>
                <Text style={[styles.dialogTitle, { color: theme.text }]}>
                  Thiết lập mật khẩu sao lưu
                </Text>
                <Text style={[styles.dialogDesc, { color: theme.textSecondary }]}>
                  Nhập mật khẩu để mã hoá tệp sao lưu. Bạn bắt buộc phải nhớ mật khẩu này để khôi phục sau này.
                </Text>

                <TextInput
                  testID="export-passphrase-input"
                  style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
                  placeholder="Mật khẩu bảo vệ (tối thiểu 6 ký tự)"
                  placeholderTextColor={theme.textSecondary}
                  secureTextEntry
                  value={exportPassphrase}
                  onChangeText={setExportPassphrase}
                />

                <TextInput
                  testID="export-confirm-passphrase-input"
                  style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
                  placeholder="Xác nhận lại mật khẩu"
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
                    <Text style={{ color: theme.text }}>Huỷ bỏ</Text>
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
                      <Text style={styles.primaryBtnText}>Xuất & Chia sẻ</Text>
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
                  Giải mã tệp sao lưu
                </Text>
                <Text style={[styles.dialogDesc, { color: theme.textSecondary }]}>
                  Tệp: {restoreFileName}
                </Text>

                <TextInput
                  testID="restore-passphrase-input"
                  style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
                  placeholder="Nhập mật khẩu đã dùng khi sao lưu"
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
                    <Text style={{ color: theme.text }}>Huỷ bỏ</Text>
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
                      <Text style={styles.primaryBtnText}>Giải mã</Text>
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
                  Tuỳ chọn nạp tài khoản
                </Text>
                <Text style={[styles.dialogDesc, { color: theme.textSecondary }]}>
                  Tìm thấy {pendingAccounts.length} tài khoản trong tệp sao lưu. Bạn muốn nạp như thế nào?
                </Text>

                <TouchableOpacity
                  testID="restore-merge-button"
                  onPress={() => handleApplyRestore('merge')}
                  style={[styles.choiceBtn, { backgroundColor: theme.backgroundElement }]}
                >
                  <Text style={[styles.choiceTitle, { color: theme.text }]}>➕ Hợp nhất (Merge)</Text>
                  <Text style={[styles.choiceDesc, { color: theme.textSecondary }]}>
                    Giữ các tài khoản hiện tại, cập nhật hoặc thêm tài khoản mới từ bản sao lưu.
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  testID="restore-replace-button"
                  onPress={() => {
                    Alert.alert(
                      'Xác nhận thay thế toàn bộ',
                      'Thao tác này sẽ xoá sạch các tài khoản hiện tại và thay thế hoàn toàn bằng tệp sao lưu.',
                      [
                        { text: 'Huỷ bỏ', style: 'cancel' },
                        {
                          text: 'Đồng ý thay thế',
                          style: 'destructive',
                          onPress: () => handleApplyRestore('replace'),
                        },
                      ]
                    );
                  }}
                  style={[styles.choiceBtn, styles.dangerChoiceBtn]}
                >
                  <Text style={styles.dangerChoiceTitle}>⚠️ Thay thế toàn bộ (Replace)</Text>
                  <Text style={[styles.choiceDesc, { color: theme.textSecondary }]}>
                    Xoá toàn bộ kho mã hiện tại và khôi phục chính xác từ bản sao lưu.
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowStrategyModal(false)}
                  style={[styles.dialogBtn, { marginTop: 12, backgroundColor: theme.backgroundElement }]}
                >
                  <Text style={{ textAlign: 'center', color: theme.text }}>Huỷ bỏ</Text>
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
  petList: {
    gap: Spacing.two,
  },
  petCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: 16,
    borderWidth: 2,
    gap: Spacing.three,
  },
  petEmoji: {
    fontSize: 32,
  },
  petMeta: {
    flex: 1,
  },
  petNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  petName: {
    fontSize: 15,
    fontWeight: '600',
  },
  activeBadge: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '700',
  },
  petDesc: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  academyBtn: {
    padding: Spacing.three,
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
    padding: Spacing.three,
    borderRadius: 14,
    alignItems: 'center',
  },
  exportBtn: {
    backgroundColor: '#1E40AF',
  },
  restoreBtn: {
    backgroundColor: '#059669',
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
    color: '#EF4444',
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
    backgroundColor: '#3B82F6',
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
    color: '#EF4444',
  },
  choiceDesc: {
    fontSize: 12,
  },
});
