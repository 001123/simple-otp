import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { privacyShieldManager } from '@/services/security/privacyShield';

export function PrivacyShield() {
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
          <Text style={styles.emblemEmoji}>{isLocked ? '🔒' : '🛡️'}</Text>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: theme.text }]}>
          {isLocked ? 'Khoá bảo vệ Simple OTP' : 'Chế độ riêng tư đang bật'}
        </Text>

        {/* Description */}
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          {isLocked
            ? 'Kho mã xác thực đã được khoá an toàn. Chạm vào nút bên dưới để mở khoá bằng Face ID / Vân tay / PIN.'
            : 'Màn hình được che mờ để bảo vệ mã xác thực 2FA khỏi nhìn trộm khi chuyển đổi ứng dụng.'}
        </Text>

        {/* Unlock Action Button */}
        {isLocked && (
          <TouchableOpacity
            testID="privacy-shield-unlock-button"
            onPress={handleUnlock}
            disabled={isUnlocking}
            style={styles.unlockBtn}
            accessibilityRole="button"
            accessibilityLabel="Mở khoá ứng dụng"
          >
            {isUnlocking ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.unlockBtnText}>Mở khoá ứng dụng</Text>
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
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
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
    backgroundColor: '#3B82F6',
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  unlockBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
