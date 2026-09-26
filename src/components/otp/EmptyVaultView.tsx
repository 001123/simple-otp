import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Search, ShieldCheck, Plus } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { BrandColors } from '@/constants/theme';

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
  const { t } = useTranslation();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const textColor = isDark ? '#FFFFFF' : '#111827';
  const subtextColor = isDark ? '#9CA3AF' : '#6B7280';

  if (isSearchEmpty) {
    return (
      <View testID="empty-search-view" style={styles.container}>
        <View style={styles.iconGraphicContainer}>
          <Search size={48} color={subtextColor} strokeWidth={1.75} />
        </View>
        <Text style={[styles.title, { color: textColor }]}>
          {t('empty.searchTitle')}
        </Text>
        <Text style={[styles.subtitle, { color: subtextColor }]}>
          {t('empty.searchSubtitle', { query: searchQuery })}
        </Text>
        {Boolean(onClearSearch) && (
          <TouchableOpacity
            testID="clear-search-btn"
            onPress={onClearSearch}
            style={styles.clearSearchBtn}
            accessibilityRole="button"
            accessibilityLabel={t('empty.clearFilter')}
          >
            <Text style={styles.clearSearchText}>{t('empty.clearFilter')}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View testID="empty-vault-view" style={styles.container}>
      <View style={styles.iconGraphicContainer}>
        <ShieldCheck size={56} color={BrandColors.primary} strokeWidth={1.75} />
      </View>
      <Text style={[styles.title, { color: textColor }]}>
        {t('empty.vaultTitle')}
      </Text>
      <Text style={[styles.subtitle, { color: subtextColor }]}>
        {t('empty.vaultSubtitle')}
      </Text>
      {Boolean(onAddAccount) && (
        <TouchableOpacity
          testID="empty-add-account-btn"
          onPress={onAddAccount}
          style={styles.addButton}
          accessibilityRole="button"
          accessibilityLabel={t('empty.addAccountNow')}
        >
          <Plus size={18} color="#FFFFFF" strokeWidth={2.5} style={{ marginRight: 6 }} />
          <Text style={styles.addBtnText}>{t('empty.addAccountNow')}</Text>
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
  iconGraphicContainer: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: BrandColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: BrandColors.primaryDark,
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
