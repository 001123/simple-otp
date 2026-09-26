import React, { useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Image,
  Pressable,
  ImageSourcePropType,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import type { PetCompanionProps, PetId, PetState } from '@/types/pet';

// State offset map into the 16-frame horizontal strip (4 frames per state)
export const STATE_OFFSETS: Record<PetState, number> = {
  IDLE: 0,
  COPIED: 4,
  WARNING: 8,
  EMPTY: 12,
};

// Loop durations for 4 frames
export const STATE_DURATIONS: Record<PetState, number> = {
  IDLE: 1000,   // 250ms per frame
  COPIED: 600,  // 150ms per frame
  WARNING: 500, // 125ms per frame
  EMPTY: 1200,  // 300ms per frame
};

// Sprite image sources
export const PET_SPRITES: Record<PetId, ImageSourcePropType> = {
  'cipher-cat': require('@/assets/images/pets/cipher-cat-sprites.png'),
  'byte-dog': require('@/assets/images/pets/byte-dog-sprites.png'),
  'shield-bunny': require('@/assets/images/pets/shield-bunny-sprites.png'),
};

const DEFAULT_DISPLAY_SIZE = 72;
const NUM_FRAMES_PER_STATE = 4;
const TOTAL_FRAMES = 16;

export const PetCompanion: React.FC<PetCompanionProps> = ({
  petId,
  state,
  onTap,
  displaySize = DEFAULT_DISPLAY_SIZE,
}) => {
  // Shared values
  const frameProgress = useSharedValue(0);
  const stateOffset = useSharedValue(STATE_OFFSETS[state]);
  const bounceY = useSharedValue(0);
  const shakeX = useSharedValue(0);

  // Sync state offset to UI thread
  useEffect(() => {
    stateOffset.value = STATE_OFFSETS[state];
  }, [state, stateOffset]);

  // Sprite frame stepping loop
  useEffect(() => {
    frameProgress.value = 0;
    const duration = STATE_DURATIONS[state] || 1000;

    frameProgress.value = withRepeat(
      withTiming(NUM_FRAMES_PER_STATE, {
        duration,
        easing: Easing.linear,
      }),
      -1, // Infinite loop
      false // Restart from 0
    );

    return () => {
      cancelAnimation(frameProgress);
    };
  }, [state, frameProgress]);

  // Container physics (Bounce on COPIED, Shake on WARNING)
  useEffect(() => {
    if (state === 'COPIED') {
      bounceY.value = withSequence(
        withTiming(-14, { duration: 180, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 180, easing: Easing.in(Easing.quad) }),
        withTiming(-8, { duration: 120, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 120, easing: Easing.in(Easing.quad) })
      );
      shakeX.value = withTiming(0, { duration: 50 });
    } else if (state === 'WARNING') {
      bounceY.value = withTiming(0, { duration: 50 });
      shakeX.value = withRepeat(
        withSequence(
          withTiming(-3, { duration: 60, easing: Easing.linear }),
          withTiming(3, { duration: 60, easing: Easing.linear }),
          withTiming(0, { duration: 60, easing: Easing.linear })
        ),
        -1,
        true
      );
    } else {
      bounceY.value = withTiming(0, { duration: 100 });
      shakeX.value = withTiming(0, { duration: 100 });
    }

    return () => {
      cancelAnimation(bounceY);
      cancelAnimation(shakeX);
    };
  }, [state, bounceY, shakeX]);

  // Worklet style for stepped horizontal translation
  const animatedSpriteStyle = useAnimatedStyle(() => {
    'worklet';
    const subFrame = Math.floor(frameProgress.value) % NUM_FRAMES_PER_STATE;
    const currentFrame = stateOffset.value + subFrame;
    return {
      transform: [
        { translateX: -currentFrame * displaySize },
      ],
    };
  });

  // Worklet style for container physics
  const animatedContainerStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [
        { translateY: bounceY.value },
        { translateX: shakeX.value },
      ],
    };
  });

  const spriteSource = useMemo(() => {
    return PET_SPRITES[petId] || PET_SPRITES['cipher-cat'];
  }, [petId]);

  const stripWidth = TOTAL_FRAMES * displaySize;

  return (
    <Pressable
      testID="pet-companion-touch"
      onPress={onTap}
      accessibilityRole="button"
      accessibilityLabel={`Linh vật thú cưng ${petId}, trạng thái ${state}`}
      accessibilityHint="Chạm để tương tác và mở Pet Academy"
      style={styles.touchTarget}
    >
      <Animated.View style={[styles.companionWrapper, animatedContainerStyle]}>
        <View
          testID="pet-clipping-viewport"
          style={[
            styles.clippingViewport,
            { width: displaySize, height: displaySize },
          ]}
        >
          <Animated.View
            testID="pet-sprite-animated-view"
            style={[
              { width: stripWidth, height: displaySize },
              animatedSpriteStyle,
            ]}
          >
            <Image
              testID="pet-sprite-image"
              source={spriteSource}
              style={{ width: stripWidth, height: displaySize }}
              resizeMode="cover"
            />
          </Animated.View>
        </View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  touchTarget: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  companionWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  clippingViewport: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
});
