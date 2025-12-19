import React, { useCallback } from 'react';
import {
  StyleSheet,
  ActivityIndicator,
  View,
  ViewStyle,
  TextStyle,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { BorderRadius, Layout, Spacing } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { Shadows } from '../../constants/shadows';
import { Text } from './Text';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Feather.glyphMap;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
}: ButtonProps) {
  const scale = useSharedValue(1);
  const isDisabled = disabled || loading;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    if (!isDisabled) {
      scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
    }
  }, [scale, isDisabled]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  }, [scale]);

  const buttonStyles = [
    styles.base,
    sizeStyles[size],
    variantStyles[variant],
    fullWidth ? styles.fullWidth : undefined,
    isDisabled ? styles.disabled : undefined,
    variant === 'primary' && !isDisabled ? Shadows.level2 : undefined,
  ].filter(Boolean) as ViewStyle[];

  const textColor = getTextColor(variant, isDisabled);
  const iconSize = size === 'small' ? 16 : size === 'large' ? 24 : 20;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={[buttonStyles, style, animatedStyle]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && (
            <Feather
              name={icon}
              size={iconSize}
              color={textColor}
              style={styles.iconLeft}
            />
          )}
          <Text
            style={[
              textStyles[size],
              { color: textColor },
            ]}
            weight="semibold"
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <Feather
              name={icon}
              size={iconSize}
              color={textColor}
              style={styles.iconRight}
            />
          )}
        </View>
      )}
    </AnimatedPressable>
  );
}

function getTextColor(variant: ButtonVariant, disabled: boolean): string {
  if (disabled) return Colors.text.tertiary;

  switch (variant) {
    case 'primary':
      return Colors.white;
    case 'danger':
      return Colors.white;
    case 'secondary':
      return Colors.text.primary;
    case 'outline':
      return Colors.primary.main;
    case 'ghost':
      return Colors.primary.main;
    default:
      return Colors.white;
  }
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.small,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  iconLeft: {
    marginRight: Spacing.sm,
  },
  iconRight: {
    marginLeft: Spacing.sm,
  },
});

const sizeStyles = StyleSheet.create({
  small: {
    height: 36,
    paddingHorizontal: Spacing.md,
  },
  medium: {
    height: Layout.buttonHeight,
    paddingHorizontal: Spacing.lg,
  },
  large: {
    height: Layout.buttonHeightLarge,
    paddingHorizontal: Spacing.xl,
  },
});

const textStyles = StyleSheet.create({
  small: {
    fontSize: FontSize.bodySmall,
  },
  medium: {
    fontSize: FontSize.body,
  },
  large: {
    fontSize: FontSize.bodyLarge,
  },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: Colors.primary.main,
  },
  secondary: {
    backgroundColor: Colors.background.surface,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary.main,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: Colors.accent.error,
  },
});
