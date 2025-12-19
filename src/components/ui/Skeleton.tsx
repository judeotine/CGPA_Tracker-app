import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';
import { BorderRadius, Spacing } from '../../constants/spacing';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = '100%' as `${number}%`,
  height = 20,
  borderRadius = BorderRadius.small,
  style,
}: SkeletonProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function SkeletonCard({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.cardHeader}>
        <Skeleton width={60} height={20} borderRadius={BorderRadius.full} />
        <Skeleton width={24} height={24} borderRadius={BorderRadius.full} />
      </View>
      <Skeleton width="70%" height={24} style={styles.marginTop} />
      <Skeleton width="40%" height={16} style={styles.marginTopSmall} />
      <View style={styles.cardStats}>
        <Skeleton width={80} height={16} />
        <Skeleton width={60} height={16} />
      </View>
      <Skeleton width="100%" height={4} style={styles.marginTop} />
    </View>
  );
}

export function SkeletonCourseCard({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.courseCard, style]}>
      <View style={styles.courseCardLeft}>
        <Skeleton width="80%" height={18} />
        <Skeleton width="30%" height={14} style={styles.marginTopSmall} />
        <View style={styles.courseStats}>
          <Skeleton width={50} height={14} />
          <Skeleton width={50} height={14} />
          <Skeleton width={40} height={24} borderRadius={BorderRadius.small} />
        </View>
      </View>
      <View style={styles.courseCardRight}>
        <Skeleton width={50} height={30} />
        <Skeleton width={40} height={12} style={styles.marginTopSmall} />
      </View>
    </View>
  );
}

export function SkeletonCGPA({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.cgpaCard, style]}>
      <Skeleton width={100} height={14} />
      <Skeleton width={120} height={56} style={styles.marginTop} />
      <Skeleton width={80} height={14} style={styles.marginTopSmall} />
      <Skeleton width={140} height={14} style={styles.marginTop} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.background.elevated,
  },
  card: {
    backgroundColor: Colors.background.surface,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardStats: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  courseCard: {
    backgroundColor: Colors.background.surface,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.ui.border,
    borderLeftWidth: 4,
    borderLeftColor: Colors.background.elevated,
    flexDirection: 'row',
  },
  courseCardLeft: {
    flex: 1,
  },
  courseCardRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  courseStats: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    alignItems: 'center',
  },
  cgpaCard: {
    alignItems: 'center',
    padding: Spacing.lg,
  },
  marginTop: {
    marginTop: Spacing.md,
  },
  marginTopSmall: {
    marginTop: Spacing.sm,
  },
});
