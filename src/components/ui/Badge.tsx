import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, getGradeColor } from '../../constants/colors';
import { BorderRadius, Spacing, ComponentSpacing } from '../../constants/spacing';
import { Text } from './Text';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'grade' | 'credit';
type BadgeSize = 'small' | 'medium' | 'large';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  grade?: string;
  style?: ViewStyle;
}

export function Badge({
  label,
  variant = 'default',
  size = 'medium',
  grade,
  style,
}: BadgeProps) {
  const getColors = (): { bg: string; text: string } => {
    switch (variant) {
      case 'success':
        return { bg: `${Colors.accent.success}20`, text: Colors.accent.success };
      case 'warning':
        return { bg: `${Colors.accent.warning}20`, text: Colors.accent.warning };
      case 'error':
        return { bg: `${Colors.accent.error}20`, text: Colors.accent.error };
      case 'info':
        return { bg: `${Colors.accent.info}20`, text: Colors.accent.info };
      case 'credit':
        return { bg: Colors.primary.veryDark, text: Colors.primary.light };
      case 'grade':
        const gradeColor = getGradeColor(grade || label);
        return { bg: `${gradeColor}20`, text: gradeColor };
      default:
        return { bg: Colors.background.elevated, text: Colors.text.secondary };
    }
  };

  const colors = getColors();

  return (
    <View
      style={[
        styles.base,
        sizeStyles[size],
        { backgroundColor: colors.bg },
        style,
      ]}
    >
      <Text
        variant={size === 'small' ? 'tiny' : 'caption'}
        weight={size === 'large' ? 'bold' : 'semibold'}
        style={{ color: colors.text }}
      >
        {label}
      </Text>
    </View>
  );
}

interface GradeBadgeProps {
  grade: string;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

export function GradeBadge({ grade, size = 'medium', style }: GradeBadgeProps) {
  const gradeColor = getGradeColor(grade);

  return (
    <View
      style={[
        styles.gradeBadge,
        gradeSizeStyles[size],
        { backgroundColor: `${gradeColor}20` },
        style,
      ]}
    >
      <Text
        variant={size === 'large' ? 'h2' : size === 'medium' ? 'h3' : 'bodyLarge'}
        weight="extraBold"
        style={{ color: gradeColor }}
      >
        {grade}
      </Text>
    </View>
  );
}

interface StatusBadgeProps {
  status: 'completed' | 'in_progress' | 'not_started';
  style?: ViewStyle;
}

export function StatusBadge({ status, style }: StatusBadgeProps) {
  const config = {
    completed: { label: 'Completed', color: Colors.accent.success },
    in_progress: { label: 'In Progress', color: Colors.accent.info },
    not_started: { label: 'Not Started', color: Colors.text.tertiary },
  };

  const { label, color } = config[status];

  return (
    <View
      style={[
        styles.statusBadge,
        { backgroundColor: `${color}20` },
        style,
      ]}
    >
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <Text variant="tiny" weight="medium" style={{ color }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.small,
    alignSelf: 'flex-start',
  },
  gradeBadge: {
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: Spacing.xs,
  },
});

const sizeStyles = StyleSheet.create({
  small: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  medium: {
    paddingHorizontal: ComponentSpacing.badgePadding.horizontal,
    paddingVertical: ComponentSpacing.badgePadding.vertical,
  },
  large: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
});

const gradeSizeStyles = StyleSheet.create({
  small: {
    width: 36,
    height: 36,
  },
  medium: {
    width: 48,
    height: 48,
  },
  large: {
    width: 64,
    height: 64,
  },
});
