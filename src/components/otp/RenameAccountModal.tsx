import React, { useState, useEffect } from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Pencil } from 'lucide-react-native';
import type { OtpAccount } from '@/types/otp';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { BrandColors } from '@/constants/theme';

export interface RenameAccountModalProps {
  visible: boolean;
  account: OtpAccount | null;
  onClose: () => void;
  onSave: (id: string, newIssuer: string, newAccount: string) => Promise<void>;
}

export const RenameAccountModal: React.FC<RenameAccountModalProps> = ({
  visible,
  account,
  onClose,
  onSave,
}) => {
  const { t } = useTranslation();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const [issuer, setIssuer] = useState<string>('');
  const [accountName, setAccountName] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (account) {
      setIssuer(account.issuer || '');
      setAccountName(account.account || '');
    }
  }, [account]);

  const handleSave = async () => {
    if (!account) return;
    const trimmedAccount = accountName.trim();
    const trimmedIssuer = issuer.endsWith('-- ') ? issuer : issuer.trim();
    if (!trimmedAccount) return;

    setIsSaving(true);
    try {
      await onSave(account.id, trimmedIssuer, trimmedAccount);
      onClose();
    } catch (error) {
      console.warn('Failed to rename account:', error);
      Alert.alert(t('common.error'), t('rename.errSaveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  if (!visible || !account) return null;

  const bg = isDark ? '#1F2228' : '#FFFFFF';
  const textCol = isDark ? '#FFFFFF' : '#111827';
  const subCol = isDark ? '#9CA3AF' : '#6B7280';
  const inputBg = isDark ? '#2A2D34' : '#F3F4F6';
  const borderCol = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';

  return (
    <Modal
      testID="rename-account-modal"
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <View style={[styles.dialog, { backgroundColor: bg, borderColor: borderCol }]}>
          <View style={styles.titleRow}>
            <Pencil size={20} color={textCol} strokeWidth={2} style={{ marginRight: 8 }} />
            <Text style={[styles.title, { color: textCol }]}>{t('rename.title')}</Text>
          </View>

          <Text style={[styles.label, { color: subCol }]}>{t('rename.issuerLabel')}</Text>
          <TextInput
            testID="rename-issuer-input"
            value={issuer}
            onChangeText={setIssuer}
            placeholder={t('rename.issuerPlaceholder')}
            placeholderTextColor={subCol}
            style={[styles.input, { backgroundColor: inputBg, color: textCol }]}
            editable={!isSaving}
          />

          <Text style={[styles.label, { color: subCol }]}>{t('rename.accountLabel')}</Text>
          <TextInput
            testID="rename-account-input"
            value={accountName}
            onChangeText={setAccountName}
            placeholder={t('rename.accountPlaceholder')}
            placeholderTextColor={subCol}
            style={[styles.input, { backgroundColor: inputBg, color: textCol }]}
            editable={!isSaving}
          />

          <View style={styles.btnRow}>
            <TouchableOpacity
              testID="rename-cancel-btn"
              onPress={onClose}
              disabled={isSaving}
              style={styles.cancelBtn}
            >
              <Text style={[styles.cancelBtnText, { color: subCol }]}>{t('rename.cancelBtn')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="rename-save-btn"
              disabled={isSaving || !accountName.trim()}
              onPress={handleSave}
              style={[
                styles.saveBtn,
                (!accountName.trim() || isSaving) && styles.saveBtnDisabled,
              ]}
            >
              <Text style={styles.saveBtnText}>{t('rename.saveBtn')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  label: {
    fontSize: 12.5,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  cancelBtnText: {
    fontWeight: '600',
    fontSize: 14,
  },
  saveBtn: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
