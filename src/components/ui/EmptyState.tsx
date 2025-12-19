import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing, Layout } from '../../constants/spacing';
import { Text } from './Text';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export function EmptyState({
  icon = 'inbox',
  title,
  description,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        <Feather
          name={icon}
          size={Layout.iconSize.hero}
          color={Colors.text.tertiary}
        />
      </View>
      <Text variant="h3" center style={styles.title}>
        {title}
      </Text>
      {description && (
        <Text variant="body" color="secondary" center style={styles.description}>
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          icon="plus"
          style={styles.button}
        />
      )}
    </View>
  );
}

export function NoSemestersEmpty({ onAdd }: { onAdd: () => void }) {
  return (
    <EmptyState
      icon="folder"
      title="No Semesters Yet"
      description="Start tracking your academic journey by adding your first semester"
      actionLabel="Add Your First Semester"
      onAction={onAdd}
    />
  );
}

export function NoCoursesEmpty({ onAdd }: { onAdd: () => void }) {
  return (
    <EmptyState
      icon="book-open"
      title="No Courses Added"
      description="Add courses to start calculating your semester GPA"
      actionLabel="Add Course"
      onAction={onAdd}
    />
  );
}

export function NoSearchResultsEmpty({ onClear }: { onClear: () => void }) {
  return (
    <EmptyState
      icon="search"
      title="No Results Found"
      description="Try adjusting your search"
      actionLabel="Clear Search"
      onAction={onClear}
    />
  );
}

export function OfflineEmpty() {
  return (
    <EmptyState
      icon="wifi-off"
      title="You're Offline"
      description="Your changes will sync when you reconnect"
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['2xl'],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.background.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.sm,
  },
  description: {
    maxWidth: 280,
    marginBottom: Spacing.lg,
  },
  button: {
    marginTop: Spacing.sm,
  },
});
