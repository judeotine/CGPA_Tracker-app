import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { BorderRadius, Spacing, Layout } from '../../constants/spacing';
import { FontSize, FontFamily } from '../../constants/typography';
import { Text } from './Text';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  icon?: keyof typeof Feather.glyphMap;
  rightIcon?: keyof typeof Feather.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export function Input({
  label,
  error,
  icon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputStyle,
  editable = true,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const inputContainerStyles = [
    styles.inputContainer,
    isFocused ? styles.inputContainerFocused : undefined,
    error ? styles.inputContainerError : undefined,
    !editable ? styles.inputContainerDisabled : undefined,
  ].filter(Boolean) as ViewStyle[];

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text variant="caption" color="secondary" style={styles.label}>
          {label}
        </Text>
      )}
      <View style={inputContainerStyles}>
        {icon && (
          <Feather
            name={icon}
            size={Layout.iconSize.medium}
            color={isFocused ? Colors.primary.main : Colors.text.tertiary}
            style={styles.icon}
          />
        )}
        <TextInput
          style={[
            styles.input,
            icon && styles.inputWithIcon,
            rightIcon && styles.inputWithRightIcon,
            inputStyle,
          ]}
          placeholderTextColor={Colors.text.tertiary}
          selectionColor={Colors.primary.main}
          editable={editable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
            <Feather
              name={rightIcon}
              size={Layout.iconSize.medium}
              color={Colors.text.tertiary}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <View style={styles.errorContainer}>
          <Feather
            name="alert-circle"
            size={14}
            color={Colors.accent.error}
            style={styles.errorIcon}
          />
          <Text variant="caption" color="error">
            {error}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    marginBottom: Spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.surface,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.ui.border,
    height: Layout.inputHeight,
  },
  inputContainerFocused: {
    borderColor: Colors.primary.main,
    borderWidth: 2,
  },
  inputContainerError: {
    borderColor: Colors.accent.error,
  },
  inputContainerDisabled: {
    backgroundColor: Colors.background.app,
    opacity: 0.7,
  },
  icon: {
    marginLeft: Spacing.md,
  },
  rightIcon: {
    padding: Spacing.md,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.body,
    color: Colors.text.primary,
    fontFamily: FontFamily.primary,
  },
  inputWithIcon: {
    paddingLeft: Spacing.sm,
  },
  inputWithRightIcon: {
    paddingRight: 0,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  errorIcon: {
    marginRight: Spacing.xs,
  },
});
