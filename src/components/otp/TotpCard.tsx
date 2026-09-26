import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  Alert,
  ActionSheetIOS,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import type { OtpAccount } from '@/types/otp';
import { generateTotp, getTotpProgress } from '@/services/crypto/otpEngine';
import { copyWithAutoClear } from '@/services/security/clipboardClear';
import { CountdownRing } from './CountdownRing';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from 'react-i18next';
import { MoreHorizontal, Copy, Check } from 'lucide-react-native';
import { BrandColors, SemanticColors, Fonts } from '@/constants/theme';

export interface TotpCardProps {
  account: OtpAccount;
  currentTimestamp?: number; // Unix epoch seconds
  onCopy?: (code: string) => void;
  onRename?: (account: OtpAccount) => void;
  onDelete?: (account: OtpAccount) => void;
  onExportQr?: (account: OtpAccount) => void;
  onOptionsPress?: (account: OtpAccount) => void;
  testID?: string;
  showCopiedToast?: boolean;
}

export const TotpCard: React.FC<TotpCardProps> = ({
  account,
  currentTimestamp,
  onCopy,
  onRename,
  onDelete,
  onExportQr,
  onOptionsPress,
  testID = `totp-card-${account.id}`,
  showCopiedToast = false,
}) => {
  const { t } = useTranslation();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const [copiedRecently, setCopiedRecently] = useState<boolean>(false);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  // Compute code and countdown progress
  const code = useMemo(() => {
    try {
      return generateTotp(account, currentTimestamp);
    } catch {
      return '------';
    }
  }, [account, currentTimestamp]);

  const { remainingSeconds, progress, isUrgent } = useMemo(() => {
    try {
      return getTotpProgress(account, currentTimestamp);
    } catch {
      return { remainingSeconds: 30, progress: 1, isUrgent: false };
    }
  }, [account, currentTimestamp]);

  // Format code with center space
  const formattedCode = useMemo(() => {
    if (!code || code === '------') return '------';
    if (code.length === 8) {
      return `${code.slice(0, 4)} ${code.slice(4)}`;
    }
    return `${code.slice(0, 3)} ${code.slice(3)}`;
  }, [code]);

  // 1-Tap Copy Handler
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
      t('cards.deleteConfirmTitle'),
      t('cards.deleteConfirmMsg', { name: account.issuer || account.account }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: () => onDelete?.(account) },
      ]
    );
  }, [account, onDelete, t]);

  // Card Options Menu (ActionSheet)
  const handleOptionsMenu = useCallback(() => {
    if (onOptionsPress) {
      onOptionsPress(account);
      return;
    }

    const title = account.issuer || account.account;
    const options = [
      t('common.cancel'),
      t('cards.actions.rename'),
      t('cards.actions.exportQr'),
      t('cards.actions.delete'),
    ];
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
      Alert.alert(title, `${t('common.edit')}:`, [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('cards.actions.rename'), onPress: () => onRename?.(account) },
        { text: t('cards.actions.exportQr'), onPress: () => onExportQr?.(account) },
        { text: t('common.delete'), style: 'destructive', onPress: () => confirmDelete() },
      ]);
    }
  }, [account, onOptionsPress, onRename, onExportQr, confirmDelete, t]);

  // Monogram letter and color
  const initialLetter = (account.issuer || account.account || '?')[0].toUpperCase();
  const cardBg = isDark ? '#1C1D21' : '#FFFFFF';
  const borderCol = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
  const textColor = isDark ? '#FFFFFF' : '#111827';
  const subtextColor = isDark ? '#9CA3AF' : '#6B7280';
  const codeColor = isUrgent ? SemanticColors.urgent : (isDark ? '#F9FAFB' : '#1E293B');

  return (
    <View
      testID={testID}
      style={[
        styles.cardContainer,
        { backgroundColor: cardBg, borderColor: borderCol },
      ]}
      accessibilityRole="text"
      accessibilityLabel={`Mã xác thực ${account.issuer || ''} ${account.account}, mã là ${code}`}
    >
      {/* Top Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.issuerCluster}>
          <View style={styles.avatarBadge}>
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
            <Text style={styles.typeBadgeText}>TOTP</Text>
          </View>
          {account.period !== 30 && (
            <View style={styles.periodBadge}>
              <Text style={styles.periodBadgeText}>{`${account.period}s`}</Text>
            </View>
          )}
          <TouchableOpacity
            testID={`${testID}-options-btn`}
            onPress={handleOptionsMenu}
            style={styles.moreButton}
            accessibilityRole="button"
            accessibilityLabel="Tuỳ chọn tài khoản"
          >
            <MoreHorizontal size={20} color={subtextColor} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Code & Action Row */}
      <TouchableOpacity
        testID={`${testID}-copy-tap`}
        activeOpacity={0.7}
        onPress={handleCopy}
        style={styles.codeRow}
        accessibilityRole="button"
        accessibilityLabel="Chạm để sao chép mã"
      >
        <View style={styles.codeCluster}>
          <Text style={[styles.codeText, { color: codeColor }]}>
            {formattedCode}
          </Text>
          {copiedRecently && showCopiedToast ? (
            <View style={styles.copiedPill}>
              <Check size={12} color="#FFFFFF" strokeWidth={2.5} style={{ marginRight: 4 }} />
              <Text style={styles.copiedPillText}>{t('cards.copiedPill')}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.actionCluster}>
          <CountdownRing
            testID={`${testID}-ring`}
            remainingSeconds={remainingSeconds}
            period={account.period || 30}
            progress={progress}
            isUrgent={isUrgent}
            size={42}
            strokeWidth={3.5}
          />
          <View style={styles.copyIconWrapper}>
            {copiedRecently ? (
              <Check size={18} color={SemanticColors.success} strokeWidth={2.5} />
            ) : (
              <Copy size={18} color={subtextColor} strokeWidth={2} />
            )}
          </View>
        </View>
      </TouchableOpacity>
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
    backgroundColor: BrandColors.primary,
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
    backgroundColor: 'rgba(247, 107, 0, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    color: BrandColors.primary,
    fontSize: 10.5,
    fontWeight: '700',
  },
  periodBadge: {
    backgroundColor: 'rgba(107, 114, 128, 0.14)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  periodBadgeText: {
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
    gap: 10,
  },
  codeText: {
    fontFamily: Fonts.mono,
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  copiedPill: {
    backgroundColor: SemanticColors.success,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  copiedPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  actionCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  copyIconWrapper: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  copyIcon: {
    fontSize: 18,
  },
});
