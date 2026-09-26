import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Lock, ShieldCheck, Fingerprint } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, BrandColors } from '@/constants/theme';
import { privacyShieldManager } from '@/services/security/privacyShield';

export function PrivacyShield() {
  const { t } = useTranslation();
  const theme = useTheme();

  const [isShielded, setIsShielded] = useState(() => privacyShieldManager.isShieldMounted());
  const [isLocked, setIsLocked] = useState(() => privacyShieldManager.isVaultLocked());
  const [isUnlocking, setIsUnlocking] = useState(false);

  useEffect(() => {
    // Start listening to AppState change events
    const stopListening = privacyShieldManager.startListening();

    // Subscribe to state notifications
    const unsubscribe = privacyShieldManager.subscribe((shielded, locked) => {
      setIsShielded(shielded);
      setIsLocked(locked);
    });

    return () => {
      unsubscribe();
      stopListening();
    };
  }, []);

  // When neither shielded nor locked, do not render overlay
  if (!isShielded && !isLocked) {
    return null;
  }

  const handleUnlock = async () => {
    setIsUnlocking(true);
    try {
      await privacyShieldManager.unlockWithBiometrics();
    } finally {
      setIsUnlocking(false);
    }
  };

  const isDarkMode = theme.background === '#000000';
  const bgColor = isDarkMode ? '#111214' : '#F4F5F8';

  return (
    <View
      style={[StyleSheet.absoluteFill, styles.container, { backgroundColor: bgColor }]}
      testID="privacy-shield-container"
      pointerEvents="auto"
    >
      <SafeAreaView style={styles.content}>
        {/* Shield Icon / Mascot Emblem */}
        <View style={styles.emblemContainer}>
          {isLocked ? (
            <Lock size={44} color={BrandColors.primary} strokeWidth={2} />
          ) : (
            <ShieldCheck size={44} color={BrandColors.primary} strokeWidth={2} />
          )}
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: theme.text }]}>
          {isLocked ? t('privacyShield.lockedTitle') : t('privacyShield.hiddenTitle')}
        </Text>

        {/* Description */}
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          {isLocked
            ? t('privacyShield.lockedDesc')
            : t('privacyShield.hiddenDesc')}
        </Text>

        {/* Unlock Action Button */}
        {isLocked && (
          <TouchableOpacity
            testID="privacy-shield-unlock-button"
            onPress={handleUnlock}
            disabled={isUnlocking}
            style={styles.unlockBtn}
            accessibilityRole="button"
            accessibilityLabel={t('privacyShield.unlockBtn')}
          >
            {isUnlocking ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <View style={styles.unlockBtnContent}>
                <Fingerprint size={20} color="#ffffff" strokeWidth={2} style={{ marginRight: 8 }} />
                <Text style={styles.unlockBtnText}>{t('privacyShield.unlockBtn')}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 99999, // Above all screens, modals, and tabs
    elevation: 99999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    gap: Spacing.three,
    maxWidth: 400,
  },
  emblemContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(247, 107, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  emblemEmoji: {
    fontSize: 48,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.two,
  },
  unlockBtn: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    shadowColor: BrandColors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  unlockBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
