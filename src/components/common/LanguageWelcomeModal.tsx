import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { ShieldCheck, Globe, Check, ArrowRight } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { BrandColors } from '@/constants/theme';
import {
  SUPPORTED_LANGUAGES,
  getSavedLanguagePreference,
  setAppLanguage,
  setLanguageInitialized,
} from '@/services/i18n';

export interface LanguageWelcomeModalProps {
  visible: boolean;
  onComplete: () => void;
}

export function LanguageWelcomeModal({ visible, onComplete }: LanguageWelcomeModalProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  // Selected language preference ('system' | 'vi' | 'en')
  const [selectedPref, setSelectedPref] = useState<'system' | 'vi' | 'en'>('system');

  useEffect(() => {
    let mounted = true;
    if (visible) {
      getSavedLanguagePreference().then((saved) => {
        if (mounted) {
          setSelectedPref(saved || 'system');
        }
      });
    }
    return () => {
      mounted = false;
    };
  }, [visible]);

  const handleSelect = async (code: 'system' | 'vi' | 'en') => {
    setSelectedPref(code);
    await setAppLanguage(code);
    Haptics.selectionAsync().catch(() => {});
  };

  const handleConfirm = async () => {
    await setAppLanguage(selectedPref);
    await setLanguageInitialized(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    onComplete();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={() => {}} // Block dismissal via hardware back
      testID="language-welcome-modal"
    >
      <View style={styles.overlay}>
        <SafeAreaView style={[styles.dialog, { backgroundColor: theme.background }]}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Header Badge & Icon */}
            <View style={styles.header}>
              <View style={styles.mascotEmblem}>
                <ShieldCheck size={38} color={BrandColors.primary} strokeWidth={2} />
              </View>
              <View style={[styles.badge, { backgroundColor: 'rgba(247, 107, 0, 0.12)' }]}>
                <Text style={[styles.badgeText, { color: BrandColors.primary }]}>
                  {t('welcome.badge')}
                </Text>
              </View>

              <Text style={[styles.title, { color: theme.text }]}>
                {t('welcome.title')}
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                {t('welcome.subtitle')}
              </Text>
            </View>

            {/* Language Selector Section */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                {t('welcome.selectLanguageTitle')}
              </Text>
              <Text style={[styles.sectionDesc, { color: theme.textSecondary }]}>
                {t('welcome.selectLanguageDesc')}
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalScroll}
              contentContainerStyle={styles.langScrollContainer}
            >
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = selectedPref === lang.code;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    testID={`welcome-lang-option-${lang.code}`}
                    style={[
                      styles.langPill,
                      {
                        backgroundColor: isSelected
                          ? 'rgba(247, 107, 0, 0.08)'
                          : theme.backgroundElement,
                        borderColor: isSelected ? BrandColors.primary : theme.backgroundSelected,
                      },
                    ]}
                    onPress={() => handleSelect(lang.code as 'system' | 'vi' | 'en')}
                    activeOpacity={0.7}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                  >
                    {lang.code === 'system' ? (
                      <Globe
                        size={18}
                        color={isSelected ? BrandColors.primary : theme.text}
                        strokeWidth={2}
                      />
                    ) : (
                      <Text style={styles.flagEmoji}>{lang.flag}</Text>
                    )}
                    <Text
                      style={[
                        styles.langName,
                        {
                          color: isSelected ? BrandColors.primary : theme.text,
                          fontWeight: isSelected ? '700' : '600',
                        },
                      ]}
                    >
                      {lang.titleKey ? t(lang.titleKey) : lang.name}
                    </Text>
                    {isSelected && (
                      <View style={styles.radioCheckmark}>
                        <Check size={12} color="#FFFFFF" strokeWidth={3} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </ScrollView>

          {/* Confirm Button */}
          <View style={[styles.footer, { borderTopColor: theme.backgroundSelected }]}>
            <TouchableOpacity
              testID="welcome-get-started-button"
              style={[styles.confirmButton, { backgroundColor: BrandColors.primary }]}
              onPress={handleConfirm}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <Text style={styles.confirmButtonText}>
                {t('common.getStarted')}
              </Text>
              <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.5} style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dialog: {
    width: '100%',
    maxHeight: '92%',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  mascotEmblem: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(60, 135, 247, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  sectionHeader: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  sectionDesc: {
    fontSize: 13,
  },
  horizontalScroll: {
    marginHorizontal: -24,
    marginBottom: 16,
  },
  langScrollContainer: {
    paddingHorizontal: 24,
    gap: 8,
    paddingVertical: 4,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 8,
  },
  flagEmoji: {
    fontSize: 20,
  },
  langName: {
    fontSize: 15,
    fontWeight: '700',
  },
  radioCheckmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  footer: {
    padding: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  confirmButton: {
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: BrandColors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
