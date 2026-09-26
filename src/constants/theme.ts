/**
 * Theme color palette definitions for light and dark modes.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const BrandColors = {
  primary: '#F76B00',
  primaryLight: '#F88100',
  primaryDark: '#EE4200',
  accentYellow: '#FFC820',
  pearlWhite: '#FFFFFF',
  blushPink: '#FF8A9E',
  gradient: {
    start: '#F88100',
    end: '#EE4200',
  },
} as const;

export const SemanticColors = {
  success: '#34C759',
  urgent: '#FF3B30',
  warning: '#FF9500',
  countdownNormal: '#F76B00',
  countdownUrgent: '#FF3B30',
  neutral: '#8E8E93',
} as const;

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
    primary: BrandColors.primary,
    tint: BrandColors.primary,
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
    primary: BrandColors.primary,
    tint: BrandColors.primaryLight,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
