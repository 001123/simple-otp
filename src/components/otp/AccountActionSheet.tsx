import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
  X,
  Pencil,
  QrCode,
  Trash2,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { BrandColors, SemanticColors } from '@/constants/theme';
import type { OtpAccount } from '@/types/otp';

export interface AccountActionSheetProps {
  visible: boolean;
  account: OtpAccount | null;
  onClose: () => void;
  onEdit: (account: OtpAccount) => void;
  onExportQr: (account: OtpAccount) => void;
  onDelete: (account: OtpAccount) => void;
  testID?: string;
}

export const AccountActionSheet: React.FC<AccountActionSheetProps> = ({
  visible,
  account,
  onClose,
  onEdit,
  onExportQr,
  onDelete,
  testID = 'account-action-sheet',
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    if (!visible) {
      setIsConfirmingDelete(false);
    }
  }, [visible]);

  if (!visible || !account) {
    return null;
  }

  const initialLetter = (account.issuer || account.account || '?')[0].toUpperCase();
  const accountDisplayName = account.issuer || account.account;

  const handleEditPress = () => {
    onClose();
    onEdit(account);
  };

  const handleQrPress = () => {
    onClose();
    onExportQr(account);
  };

  const handleConfirmDelete = () => {
    onDelete(account);
    setIsConfirmingDelete(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
      testID={testID}
      accessibilityLabel={t('accountSheet.title')}
    >
      <Pressable style={styles.overlay} onPress={onClose} testID={`${testID}-backdrop`}>
        <Pressable
          style={[styles.sheetContainer, { backgroundColor: theme.background }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Drag Handle Bar */}
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.textSecondary }]}>
              {isConfirmingDelete ? t('accountSheet.deleteConfirmTitle') : t('accountSheet.title')}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: theme.backgroundElement }]}
              accessibilityLabel={t('common.close')}
              testID={`${testID}-close`}
            >
              <X size={18} color={theme.text} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {!isConfirmingDelete ? (
            <>
              {/* Account Basic Info Card */}
              <View
                style={[
                  styles.accountCard,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
                ]}
                testID={`${testID}-info-card`}
              >
                <View style={styles.accountTopRow}>
                  <View style={styles.avatarBadge}>
                    <Text style={styles.avatarText}>{initialLetter}</Text>
                  </View>
                  <View style={styles.accountNameCluster}>
                    <Text style={[styles.issuerTitle, { color: theme.text }]} numberOfLines={1}>
                      {accountDisplayName}
                    </Text>
                    {Boolean(account.issuer) && (
                      <Text style={[styles.accountSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>
                        {account.account}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Technical Metadata Badges */}
                <View style={styles.badgeRow}>
                  <View style={[styles.badge, styles.typeBadge]}>
                    <Text style={styles.typeBadgeText}>{account.type.toUpperCase()}</Text>
                  </View>

                  <View style={[styles.badge, { backgroundColor: theme.background }]}>
                    <Text style={[styles.badgeText, { color: theme.textSecondary }]}>
                      {account.algorithm}
                    </Text>
                  </View>

                  <View style={[styles.badge, { backgroundColor: theme.background }]}>
                    <Text style={[styles.badgeText, { color: theme.textSecondary }]}>
                      {t('accountSheet.digits', { digits: account.digits })}
                    </Text>
                  </View>

                  {account.type === 'totp' ? (
                    <View style={[styles.badge, { backgroundColor: theme.background }]}>
                      <Text style={[styles.badgeText, { color: theme.textSecondary }]}>
                        {t('accountSheet.periodSec', { seconds: account.period || 30 })}
                      </Text>
                    </View>
                  ) : (
                    <View style={[styles.badge, { backgroundColor: theme.background }]}>
                      <Text style={[styles.badgeText, { color: theme.textSecondary }]}>
                        {t('accountSheet.counterTimes', { counter: account.counter || 0 })}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Action List */}
              <View style={styles.actionList}>
                {/* 1. Edit Action */}
                <TouchableOpacity
                  style={[styles.actionItem, { backgroundColor: theme.backgroundElement }]}
                  onPress={handleEditPress}
                  testID={`${testID}-option-edit`}
                  accessibilityRole="button"
                  accessibilityLabel={t('accountSheet.editAction')}
                >
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(247, 107, 0, 0.12)' }]}>
                    <Pencil size={20} color={BrandColors.primary} strokeWidth={2} />
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={[styles.actionTitle, { color: theme.text }]}>
                      {t('accountSheet.editAction')}
                    </Text>
                    <Text style={[styles.actionDescription, { color: theme.textSecondary }]}>
                      {t('accountSheet.editDesc')}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={theme.textSecondary} strokeWidth={2} />
                </TouchableOpacity>

                {/* 2. Show QR Code Action */}
                <TouchableOpacity
                  style={[styles.actionItem, { backgroundColor: theme.backgroundElement }]}
                  onPress={handleQrPress}
                  testID={`${testID}-option-qr`}
                  accessibilityRole="button"
                  accessibilityLabel={t('accountSheet.qrAction')}
                >
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(52, 199, 89, 0.12)' }]}>
                    <QrCode size={20} color={SemanticColors.success} strokeWidth={2} />
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={[styles.actionTitle, { color: theme.text }]}>
                      {t('accountSheet.qrAction')}
                    </Text>
                    <Text style={[styles.actionDescription, { color: theme.textSecondary }]}>
                      {t('accountSheet.qrDesc')}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={theme.textSecondary} strokeWidth={2} />
                </TouchableOpacity>

                {/* 3. Delete Action */}
                <TouchableOpacity
                  style={[styles.actionItem, { backgroundColor: theme.backgroundElement }]}
                  onPress={() => setIsConfirmingDelete(true)}
                  testID={`${testID}-option-delete`}
                  accessibilityRole="button"
                  accessibilityLabel={t('accountSheet.deleteAction')}
                >
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 59, 48, 0.12)' }]}>
                    <Trash2 size={20} color={SemanticColors.urgent} strokeWidth={2} />
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={[styles.actionTitle, { color: SemanticColors.urgent }]}>
                      {t('accountSheet.deleteAction')}
                    </Text>
                    <Text style={[styles.actionDescription, { color: theme.textSecondary }]}>
                      {t('accountSheet.deleteDesc')}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={theme.textSecondary} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            /* In-sheet Delete Confirmation State */
            <View style={styles.deleteConfirmContainer} testID={`${testID}-delete-confirm-view`}>
              <View style={[styles.warningBox, { backgroundColor: 'rgba(255, 59, 48, 0.08)', borderColor: 'rgba(255, 59, 48, 0.25)' }]}>
                <View style={styles.warningHeader}>
                  <AlertTriangle size={24} color={SemanticColors.urgent} strokeWidth={2.2} />
                  <Text style={[styles.warningTitle, { color: SemanticColors.urgent }]}>
                    {t('accountSheet.deleteConfirmTitle')}
                  </Text>
                </View>
                <Text style={[styles.warningMessage, { color: theme.text }]}>
                  {t('accountSheet.deleteConfirmWarning')}
                </Text>
              </View>

              <View style={[styles.accountTargetCard, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
                <Text style={[styles.targetLabel, { color: theme.textSecondary }]}>
                  {t('accountSheet.deleteAccountTarget')}
                </Text>
                <Text style={[styles.targetName, { color: theme.text }]} numberOfLines={1}>
                  {account.issuer ? `${account.issuer} (${account.account})` : account.account}
                </Text>
              </View>

              <View style={styles.deleteButtonGroup}>
                <TouchableOpacity
                  style={styles.confirmDeleteButton}
                  onPress={handleConfirmDelete}
                  testID={`${testID}-confirm-delete-btn`}
                  accessibilityRole="button"
                  accessibilityLabel={t('accountSheet.confirmDeleteBtn')}
                >
                  <Trash2 size={18} color="#FFFFFF" strokeWidth={2.2} style={{ marginRight: 8 }} />
                  <Text style={styles.confirmDeleteButtonText}>
                    {t('accountSheet.confirmDeleteBtn')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.cancelDeleteButton, { backgroundColor: theme.backgroundElement }]}
                  onPress={() => setIsConfirmingDelete(false)}
                  testID={`${testID}-cancel-delete-btn`}
                  accessibilityRole="button"
                  accessibilityLabel={t('accountSheet.cancelDeleteBtn')}
                >
                  <Text style={[styles.cancelDeleteButtonText, { color: theme.text }]}>
                    {t('accountSheet.cancelDeleteBtn')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <SafeAreaView edges={['bottom']} />
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(128, 128, 128, 0.4)',
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  accountTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BrandColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 20,
  },
  accountNameCluster: {
    flex: 1,
  },
  issuerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  accountSubtitle: {
    fontSize: 13.5,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadge: {
    backgroundColor: 'rgba(247, 107, 0, 0.14)',
  },
  typeBadgeText: {
    color: BrandColors.primary,
    fontWeight: '700',
    fontSize: 11.5,
    letterSpacing: 0.5,
  },
  badgeText: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  actionList: {
    gap: 10,
    marginBottom: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15.5,
    fontWeight: '600',
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 12.5,
  },
  deleteConfirmContainer: {
    paddingVertical: 6,
  },
  warningBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  warningMessage: {
    fontSize: 13.5,
    lineHeight: 19,
  },
  accountTargetCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 18,
  },
  targetLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  targetName: {
    fontSize: 15,
    fontWeight: '600',
  },
  deleteButtonGroup: {
    gap: 10,
    marginBottom: 6,
  },
  confirmDeleteButton: {
    backgroundColor: SemanticColors.urgent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  confirmDeleteButtonText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '700',
  },
  cancelDeleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  cancelDeleteButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
