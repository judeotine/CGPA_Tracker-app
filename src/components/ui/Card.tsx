import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';
import { BorderRadius, Spacing, ComponentSpacing } from '../../constants/spacing';
import { Shadows, ShadowLevel } from '../../constants/shadows';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type CardVariant = 'default' | 'elevated' | 'hero' | 'outline';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  shadow?: ShadowLevel;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: 'none' | 'small' | 'medium' | 'large';
  gradient?: boolean;
  leftBorderColor?: string;
}

export function Card({
  children,
  variant = 'default',
  shadow = 'level1',
  onPress,
  style,
  padding = 'medium',
  gradient = false,
  leftBorderColor,
}: CardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  }, [scale]);

  const cardStyles = [
    styles.base,
    variantStyles[variant],
    paddingStyles[padding],
    Shadows[shadow],
    leftBorderColor ? { borderLeftWidth: 4, borderLeftColor: leftBorderColor } : undefined,
    style,
  ].filter(Boolean) as ViewStyle[];

  const content = gradient ? (
    <LinearGradient
      colors={[Colors.background.subtle, Colors.background.surface]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradient, paddingStyles[padding]]}
    >
      {children}
    </LinearGradient>
  ) : (
    children
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[cardStyles, gradient && styles.gradientWrapper, animatedStyle]}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return (
    <View style={[cardStyles, gradient && styles.gradientWrapper]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.background.surface,
    borderRadius: BorderRadius.medium,
    overflow: 'hidden',
  },
  gradient: {
    borderRadius: BorderRadius.medium,
  },
  gradientWrapper: {
    padding: 0,
    backgroundColor: 'transparent',
  },
});

const variantStyles = StyleSheet.create({
  default: {
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  elevated: {
    borderWidth: 0,
  },
  hero: {
    borderRadius: BorderRadius.large,
    borderWidth: 0,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
});

const paddingStyles = StyleSheet.create({
  none: {
    padding: 0,
  },
  small: {
    padding: Spacing.sm,
  },
  medium: {
    padding: ComponentSpacing.cardPadding.horizontal,
  },
  large: {
    padding: ComponentSpacing.cardPadding.large,
  },
});
