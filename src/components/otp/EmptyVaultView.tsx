import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';

export interface EmptyVaultViewProps {
  isSearchEmpty?: boolean;
  searchQuery?: string;
  onAddAccount?: () => void;
  onClearSearch?: () => void;
}

export const EmptyVaultView: React.FC<EmptyVaultViewProps> = ({
  isSearchEmpty = false,
  searchQuery = '',
  onAddAccount,
  onClearSearch,
}) => {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const textColor = isDark ? '#FFFFFF' : '#111827';
  const subtextColor = isDark ? '#9CA3AF' : '#6B7280';

  if (isSearchEmpty) {
    return (
      <View testID="empty-search-view" style={styles.container}>
        <Text style={styles.iconGraphic}>🔍</Text>
        <Text style={[styles.title, { color: textColor }]}>
          Không tìm thấy tài khoản
        </Text>
        <Text style={[styles.subtitle, { color: subtextColor }]}>
          Không có tài khoản nào khớp với từ khoá &quot;{searchQuery}&quot;.
        </Text>
        {Boolean(onClearSearch) && (
          <TouchableOpacity
            testID="clear-search-btn"
            onPress={onClearSearch}
            style={styles.clearSearchBtn}
            accessibilityRole="button"
            accessibilityLabel="Xoá bộ lọc tìm kiếm"
          >
            <Text style={styles.clearSearchText}>Xoá bộ lọc</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View testID="empty-vault-view" style={styles.container}>
      <Text style={styles.iconGraphic}>🛡️</Text>
      <Text style={[styles.title, { color: textColor }]}>
        Chưa có tài khoản 2FA nào
      </Text>
      <Text style={[styles.subtitle, { color: subtextColor }]}>
        Thêm tài khoản 2FA đầu tiên bằng cách quét mã QR hoặc nhập khoá bí mật để bé thú cưng bắt đầu canh giữ.
      </Text>
      {Boolean(onAddAccount) && (
        <TouchableOpacity
          testID="empty-add-account-btn"
          onPress={onAddAccount}
          style={styles.addButton}
          accessibilityRole="button"
          accessibilityLabel="Thêm tài khoản ngay"
        >
          <Text style={styles.addBtnText}>➕ Thêm tài khoản ngay</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 56,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGraphic: {
    fontSize: 54,
    marginBottom: 16,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 290,
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  clearSearchBtn: {
    backgroundColor: 'rgba(107, 114, 128, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  clearSearchText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#6B7280',
  },
});
