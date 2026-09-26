import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  Alert,
  ActionSheetIOS,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import type { OtpAccount } from '@/types/otp';
import { generateHotp } from '@/services/crypto/otpEngine';
import { copyWithAutoClear } from '@/services/security/clipboardClear';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Fonts } from '@/constants/theme';

export interface HotpCardProps {
  account: OtpAccount;
  onCopy?: (code: string) => void;
  onIncrement?: (account: OtpAccount) => Promise<void> | void;
  onRename?: (account: OtpAccount) => void;
  onDelete?: (account: OtpAccount) => void;
  onExportQr?: (account: OtpAccount) => void;
  testID?: string;
}

export const HotpCard: React.FC<HotpCardProps> = ({
  account,
  onCopy,
  onIncrement,
  onRename,
  onDelete,
  onExportQr,
  testID = `hotp-card-${account.id}`,
}) => {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const [isIncrementing, setIsIncrementing] = useState<boolean>(false);
  const [copiedRecently, setCopiedRecently] = useState<boolean>(false);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  // Generate HOTP code for current counter
  const code = useMemo(() => {
    try {
      return generateHotp(account, account.counter ?? 0);
    } catch {
      return '------';
    }
  }, [account]);

  // Formatted code with center space
  const formattedCode = useMemo(() => {
    if (!code || code === '------') return '------';
    if (code.length === 8) {
      return `${code.slice(0, 4)} ${code.slice(4)}`;
    }
    return `${code.slice(0, 3)} ${code.slice(3)}`;
  }, [code]);

  // Increment counter handler
  const handleIncrement = useCallback(async () => {
    if (isIncrementing) return;
    setIsIncrementing(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      await onIncrement?.(account);
    } catch (e) {
      console.warn('Increment failed:', e);
    } finally {
      setIsIncrementing(false);
    }
  }, [account, isIncrementing, onIncrement]);

  // Copy handler
  const handleCopy = useCallback(async () => {
    if (!code || code === '------') return;
    try {
      await copyWithAutoClear(code);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      setCopiedRecently(true);
      onCopy?.(code);
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
      feedbackTimerRef.current = setTimeout(() => {
        setCopiedRecently(false);
      }, 1500);
    } catch (e) {
      console.warn('Copy failed:', e);
    }
  }, [code, onCopy]);

  const confirmDelete = useCallback(() => {
    Alert.alert(
      'Xoá tài khoản',
      `Bạn có chắc chắn muốn xoá tài khoản ${account.issuer || account.account}?`,
      [
        { text: 'Huỷ', style: 'cancel' },
        { text: 'Xoá', style: 'destructive', onPress: () => onDelete?.(account) },
      ]
    );
  }, [account, onDelete]);

  // Options menu
  const handleOptionsMenu = useCallback(() => {
    const title = account.issuer || account.account;
    const options = ['Huỷ', '✏️ Đổi tên', '📱 Xuất mã QR', '🗑️ Xoá tài khoản'];
    const destructiveIndex = 3;
    const cancelIndex = 0;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title,
          options,
          cancelButtonIndex: cancelIndex,
          destructiveButtonIndex: destructiveIndex,
        },
        (btnIdx) => {
          if (btnIdx === 1) onRename?.(account);
          if (btnIdx === 2) onExportQr?.(account);
          if (btnIdx === 3) confirmDelete();
        }
      );
    } else {
      Alert.alert(title, 'Chọn thao tác cho tài khoản này:', [
        { text: 'Huỷ', style: 'cancel' },
        { text: '✏️ Đổi tên', onPress: () => onRename?.(account) },
        { text: '📱 Xuất mã QR', onPress: () => onExportQr?.(account) },
        { text: '🗑️ Xoá', style: 'destructive', onPress: () => confirmDelete() },
      ]);
    }
  }, [account, onRename, onExportQr, confirmDelete]);

  const initialLetter = (account.issuer || account.account || '?')[0].toUpperCase();
  const cardBg = isDark ? '#1C1D21' : '#FFFFFF';
  const borderCol = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
  const textColor = isDark ? '#FFFFFF' : '#111827';
  const subtextColor = isDark ? '#9CA3AF' : '#6B7280';

  return (
    <View
      testID={testID}
      style={[
        styles.cardContainer,
        { backgroundColor: cardBg, borderColor: borderCol },
      ]}
      accessibilityRole="text"
      accessibilityLabel={`Mã HOTP ${account.issuer || ''} ${account.account}, bộ đếm ${account.counter ?? 0}, mã là ${code}`}
    >
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.issuerCluster}>
          <View style={[styles.avatarBadge, { backgroundColor: '#10B981' }]}>
            <Text style={styles.avatarText}>{initialLetter}</Text>
          </View>
          <View style={styles.titleInfo}>
            <Text style={[styles.issuerText, { color: textColor }]} numberOfLines={1}>
              {account.issuer || account.account}
            </Text>
            {Boolean(account.issuer) && (
              <Text style={[styles.accountSubtext, { color: subtextColor }]} numberOfLines={1}>
                {account.account}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.headerRightCluster}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>HOTP</Text>
          </View>
          <View style={styles.counterBadge}>
            <Text style={styles.counterBadgeText}>{`#${account.counter ?? 0}`}</Text>
          </View>
          <TouchableOpacity
            testID={`${testID}-options-btn`}
            onPress={handleOptionsMenu}
            style={styles.moreButton}
            accessibilityRole="button"
            accessibilityLabel="Tuỳ chọn tài khoản"
          >
            <Text style={[styles.moreText, { color: subtextColor }]}>⋯</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Code & Refresh Row */}
      <View style={styles.codeRow}>
        <TouchableOpacity
          testID={`${testID}-copy-tap`}
          activeOpacity={0.7}
          onPress={handleCopy}
          style={styles.codeCluster}
          accessibilityRole="button"
          accessibilityLabel="Chạm để sao chép mã HOTP"
        >
          <Text style={[styles.codeText, { color: isDark ? '#F9FAFB' : '#1E293B' }]}>
            {formattedCode}
          </Text>
          {copiedRecently && (
            <View style={styles.copiedPill}>
              <Text style={styles.copiedPillText}>Đã chép! ✓</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Lấy mã mới button */}
        <TouchableOpacity
          testID={`${testID}-refresh-btn`}
          disabled={isIncrementing}
          onPress={handleIncrement}
          style={styles.refreshButton}
          accessibilityRole="button"
          accessibilityLabel="Lấy mã HOTP mới"
        >
          {isIncrementing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <View style={styles.refreshBtnContent}>
              <Text style={styles.refreshBtnIcon}>🔄</Text>
              <Text style={styles.refreshBtnText}>Mã mới</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      default: {},
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  issuerCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  avatarBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  titleInfo: {
    flex: 1,
  },
  issuerText: {
    fontSize: 16,
    fontWeight: '700',
  },
  accountSubtext: {
    fontSize: 12.5,
    marginTop: 1,
  },
  headerRightCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    color: '#10B981',
    fontSize: 10.5,
    fontWeight: '700',
  },
  counterBadge: {
    backgroundColor: 'rgba(107, 114, 128, 0.14)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  counterBadgeText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#6B7280',
  },
  moreButton: {
    padding: 6,
    marginLeft: 2,
  },
  moreText: {
    fontSize: 18,
    fontWeight: '800',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  codeCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  codeText: {
    fontFamily: Fonts.mono,
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  copiedPill: {
    backgroundColor: '#10B981',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  copiedPillText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
  },
  refreshButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  refreshBtnIcon: {
    fontSize: 14,
  },
  refreshBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
