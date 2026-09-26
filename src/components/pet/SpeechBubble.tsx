import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ChevronRight } from 'lucide-react-native';
import { BrandColors } from '@/constants/theme';
import type { SpeechBubbleProps } from '@/types/pet';

export function SpeechBubble({
  message,
  visible = true,
  actionText,
  onAction,
  onActionPress,
  onDismiss,
  autoDismissMs = 4000,
  position = 'left',
  testID = 'pet-speech-bubble',
}: SpeechBubbleProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reanimated shared values
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.85);
  const translateX = useSharedValue(-8);

  const isVisible = Boolean(visible && message);
  const handleAction = onAction || onActionPress;

  useEffect(() => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }

    if (isVisible) {
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, { damping: 14, stiffness: 180 });
      translateX.value = withSpring(0, { damping: 14, stiffness: 180 });

      if (autoDismissMs > 0 && onDismiss) {
        dismissTimerRef.current = setTimeout(() => {
          onDismiss();
        }, autoDismissMs);
      }
    } else {
      opacity.value = withTiming(0, { duration: 180 });
      scale.value = withTiming(0.88, { duration: 180 });
      translateX.value = withTiming(-4, { duration: 180 });
    }

    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, [isVisible, message, autoDismissMs, onDismiss, opacity, scale, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
    ],
  }));

  if (!message && !isVisible) {
    return null;
  }

  const bgColor = isDark ? '#1F2228' : '#FFFFFF';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';
  const textColor = isDark ? '#F3F4F6' : '#111827';

  return (
    <Animated.View
      testID={testID}
      style={[
        styles.container,
        position === 'left' ? styles.positionLeft : styles.positionTop,
        animatedStyle,
      ]}
      pointerEvents={isVisible ? 'auto' : 'none'}
    >
      <Pressable
        testID={`${testID}-bubble`}
        onPress={onDismiss}
        style={[
          styles.bubble,
          { backgroundColor: bgColor, borderColor },
        ]}
        accessibilityRole="text"
        accessibilityLabel={`Bong bóng thoại: ${message}`}
      >
        <Text style={[styles.text, { color: textColor }]}>
          {message}
        </Text>

        {Boolean(actionText && handleAction) && (
          <Pressable
            testID={`${testID}-action`}
            accessibilityRole="button"
            accessibilityLabel={actionText || 'Hành động'}
            onPress={(e) => {
              e.stopPropagation();
              handleAction?.();
            }}
            style={({ pressed }) => [
              styles.actionButton,
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={styles.actionText}>{actionText}</Text>
            <ChevronRight size={13} color="#FFFFFF" strokeWidth={2.5} style={{ marginLeft: 2 }} />
          </Pressable>
        )}

        {/* Right-pointing tail directed toward the mascot head */}
        {position === 'left' && (
          <View
            style={[
              styles.tailRight,
              { borderLeftColor: bgColor },
            ]}
          />
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 900,
  },
  positionLeft: {
    right: 100,
    bottom: 160,
    maxWidth: 220,
  },
  positionTop: {
    right: 12,
    bottom: 248,
    maxWidth: 240,
  },
  bubble: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.18,
        shadowRadius: 6,
      },
      android: {
        elevation: 5,
      },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.18,
        shadowRadius: 6,
      },
    }),
  },
  text: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  actionButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  tailRight: {
    position: 'absolute',
    right: -7,
    bottom: 16,
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftWidth: 8,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
});
