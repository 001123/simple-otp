import React, { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useColorScheme } from '@/hooks/use-color-scheme';

export interface CountdownRingProps {
  remainingSeconds: number;
  period?: number;
  progress?: number;
  isUrgent?: boolean;
  size?: number;
  strokeWidth?: number;
  urgentColor?: string;
  normalColor?: string;
  trackColor?: string;
  showText?: boolean;
  testID?: string;
}

export const CountdownRing: React.FC<CountdownRingProps> = ({
  remainingSeconds,
  period = 30,
  progress,
  isUrgent = false,
  size = 44,
  strokeWidth = 3.5,
  urgentColor = '#EF4444',
  normalColor = '#2563EB',
  trackColor,
  showText = true,
  testID = 'countdown-ring',
}) => {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate normalized progress (1.0 -> 0.0)
  const normalizedProgress = useMemo(() => {
    if (typeof progress === 'number' && Number.isFinite(progress)) {
      return Math.max(0, Math.min(1, progress));
    }
    const p = period > 0 ? period : 30;
    return Math.max(0, Math.min(1, remainingSeconds / p));
  }, [progress, remainingSeconds, period]);

  // Stroke dash offset calculation
  const strokeDashoffset = useMemo(() => {
    const offset = circumference * (1 - normalizedProgress);
    return Number.isFinite(offset) ? offset : 0;
  }, [circumference, normalizedProgress]);

  const activeColor = isUrgent || remainingSeconds <= 5 ? urgentColor : normalColor;
  const resolvedTrackColor =
    trackColor ?? (isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)');

  const fontSize = Math.max(10, Math.round(size * 0.32));

  return (
    <View
      testID={testID}
      style={[styles.container, { width: size, height: size }]}
      accessibilityRole="progressbar"
      accessibilityLabel={`Thời gian còn lại ${remainingSeconds} giây`}
      accessibilityValue={{ min: 0, max: period, now: remainingSeconds }}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background Track */}
        <Circle
          testID={`${testID}-track`}
          cx={center}
          cy={center}
          r={radius}
          stroke={resolvedTrackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Animated Progress Circle */}
        <Circle
          testID={`${testID}-circle`}
          cx={center}
          cy={center}
          r={radius}
          stroke={activeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>

      {showText && (
        <View style={styles.textOverlay} pointerEvents="none">
          <Text
            testID={`${testID}-text`}
            style={[
              styles.text,
              {
                fontSize,
                color: activeColor,
              },
            ]}
            numberOfLines={1}
          >
            {remainingSeconds}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  textOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
});
