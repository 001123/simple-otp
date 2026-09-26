import React, { useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import * as Haptics from 'expo-haptics';
import { copyWithAutoClear } from '@/services/security/clipboardClear';

import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { generateOtpAuthUri } from '@/services/otp/uriParser';
import type { OtpAccount } from '@/types/otp';

export interface AccountQrModalProps {
  visible: boolean;
  account: OtpAccount | null;
  onClose: () => void;
}

export function AccountQrModal({ visible, account, onClose }: AccountQrModalProps) {
  const theme = useTheme();
  const [copiedKey, setCopiedKey] = useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Generate standard otpauth:// URI
  const otpUri = useMemo(() => {
    if (!account) return '';
    try {
      return generateOtpAuthUri(account);
    } catch {
      return '';
    }
  }, [account]);

  // Format secret into 4-character spaced chunks for human readability
  const formattedSecret = useMemo(() => {
    if (!account?.secret) return '';
    return account.secret.replace(/\s+/g, '').match(/.{1,4}/g)?.join(' ') || account.secret;
  }, [account]);

  const handleCopySecret = async () => {
    if (!account?.secret) return;
    try {
      const cleanSecret = account.secret.replace(/\s+/g, '');
      await copyWithAutoClear(cleanSecret);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      setCopiedKey(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopiedKey(false), 2000);
    } catch {
      // Ignore clipboard error
    }
  };

  if (!visible || !account) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      testID="account-qr-modal"
    >
      <View style={styles.overlay}>
        <SafeAreaView style={[styles.sheet, { backgroundColor: theme.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.headerTitle, { color: theme.text }]}>
                📲 Chuyển tài khoản (QR)
              </Text>
              <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                Quét mã này từ thiết bị khác để chuyển mã 2FA
              </Text>
            </View>

            <TouchableOpacity
              testID="account-qr-close-button"
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: theme.backgroundElement }]}
              accessibilityRole="button"
              accessibilityLabel="Đóng mã QR"
            >
              <Text style={[styles.closeBtnText, { color: theme.text }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {/* QR Card */}
            <View style={styles.qrCard}>
              {otpUri ? (
                <QRCode
                  testID="account-qr-code"
                  value={otpUri}
                  size={220}
                  color="#000000"
                  backgroundColor="#FFFFFF"
                  quietZone={10}
                />
              ) : (
                <Text style={styles.errorText}>Không thể tạo mã QR cho tài khoản này.</Text>
              )}
            </View>

            {/* Account Information Card */}
            <View style={[styles.infoCard, { backgroundColor: theme.backgroundElement }]}>
              <View style={styles.accountRow}>
                <Text style={[styles.issuerName, { color: theme.text }]}>
                  {account.issuer ? `${account.issuer}` : 'Tài khoản'}
                </Text>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>
                    {account.type.toUpperCase()}{' '}
                    {account.type === 'totp' ? `(${account.period ?? 30}s)` : `#${account.counter ?? 0}`}
                  </Text>
                </View>
              </View>

              <Text style={[styles.accountEmail, { color: theme.textSecondary }]}>
                {account.account}
              </Text>

              <View style={styles.algoRow}>
                <Text style={[styles.algoText, { color: theme.textSecondary }]}>
                  Thuật toán: {account.algorithm} • {account.digits} chữ số
                </Text>
              </View>

              {/* Secret display with copy */}
              <View style={styles.secretContainer}>
                <Text style={[styles.secretLabel, { color: theme.textSecondary }]}>
                  Khoá bí mật (Base32):
                </Text>
                <View style={styles.secretBox}>
                  <Text
                    testID="account-qr-secret-text"
                    style={[styles.secretText, { color: theme.text }]}
                    selectable
                  >
                    {formattedSecret}
                  </Text>

                  <TouchableOpacity
                    testID="account-qr-copy-secret-button"
                    onPress={handleCopySecret}
                    style={[
                      styles.copyBtn,
                      { backgroundColor: copiedKey ? '#10B981' : '#3B82F6' },
                    ]}
                  >
                    <Text style={styles.copyBtnText}>
                      {copiedKey ? '✓ Đã chép' : 'Sao chép'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Security Warning Notice */}
            <View style={styles.warningCard}>
              <Text style={styles.warningTitle}>⚠️ Cảnh báo bảo mật</Text>
              <Text style={styles.warningText}>
                Mã QR này chứa toàn bộ quyền sinh mã xác thực 2FA. Tuyệt đối không chụp màn hình gửi lên mạng hoặc để người lạ quét mã.
              </Text>
            </View>
          </View>
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '94%',
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
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
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
    alignItems: 'center',
    gap: Spacing.three,
  },
  qrCard: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    width: '100%',
    padding: Spacing.three,
    borderRadius: 16,
    gap: Spacing.one,
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  issuerName: {
    fontSize: 16,
    fontWeight: '700',
  },
  typeBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  typeBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  accountEmail: {
    fontSize: 13,
  },
  algoRow: {
    marginTop: 4,
  },
  algoText: {
    fontSize: 12,
  },
  secretContainer: {
    marginTop: Spacing.two,
    gap: 4,
  },
  secretLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  secretBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(150,150,150,0.1)',
    padding: Spacing.two,
    borderRadius: 10,
    gap: Spacing.two,
  },
  secretText: {
    fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }),
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    letterSpacing: 1,
  },
  copyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  copyBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  warningCard: {
    width: '100%',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderWidth: 1,
    borderRadius: 14,
    padding: Spacing.three,
    gap: 4,
  },
  warningTitle: {
    color: '#B45309',
    fontSize: 13,
    fontWeight: '700',
  },
  warningText: {
    color: '#92400E',
    fontSize: 12,
    lineHeight: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    padding: Spacing.three,
  },
});
