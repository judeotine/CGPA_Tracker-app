import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { BorderRadius, Layout } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';

type IconButtonVariant = 'default' | 'primary' | 'ghost' | 'danger';
type IconButtonSize = 'small' | 'medium' | 'large';

interface IconButtonProps {
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  disabled?: boolean;
  style?: ViewStyle;
}

export function IconButton({
  icon,
  onPress,
  variant = 'default',
  size = 'medium',
  disabled = false,
  style,
}: IconButtonProps) {
  const iconSize = size === 'small' ? 18 : size === 'large' ? 28 : 24;
  const iconColor = getIconColor(variant, disabled);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        styles.base,
        sizeStyles[size],
        variantStyles[variant],
        disabled && styles.disabled,
        variant === 'primary' && !disabled && Shadows.level2,
        style,
      ]}
    >
      <Feather name={icon} size={iconSize} color={iconColor} />
    </TouchableOpacity>
  );
}

function getIconColor(variant: IconButtonVariant, disabled: boolean): string {
  if (disabled) return Colors.text.tertiary;

  switch (variant) {
    case 'primary':
      return Colors.white;
    case 'danger':
      return Colors.accent.error;
    case 'ghost':
      return Colors.text.primary;
    default:
      return Colors.text.primary;
  }
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.small,
  },
  disabled: {
    opacity: 0.5,
  },
});

const sizeStyles = StyleSheet.create({
  small: {
    width: 32,
    height: 32,
  },
  medium: {
    width: 44,
    height: 44,
  },
  large: {
    width: Layout.fabSize,
    height: Layout.fabSize,
    borderRadius: BorderRadius.full,
  },
});

const variantStyles = StyleSheet.create({
  default: {
    backgroundColor: Colors.background.surface,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  primary: {
    backgroundColor: Colors.primary.main,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: `${Colors.accent.error}20`,
  },
});
