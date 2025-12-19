import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight, LineHeight, FontFamily } from '../../constants/typography';

type TextVariant =
  | 'displayLarge'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'bodyLarge'
  | 'body'
  | 'bodySmall'
  | 'caption'
  | 'tiny'
  | 'gpa'
  | 'gradePoints';

type TextColor = 'primary' | 'secondary' | 'tertiary' | 'muted' | 'success' | 'error' | 'warning' | 'info' | 'teal';

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: TextColor;
  weight?: keyof typeof FontWeight;
  mono?: boolean;
  center?: boolean;
  uppercase?: boolean;
  children: React.ReactNode;
}

export function Text({
  variant = 'body',
  color = 'primary',
  weight,
  mono = false,
  center = false,
  uppercase = false,
  style,
  children,
  ...props
}: TextProps) {
  const variantStyle = styles[variant];
  const colorStyle = colorStyles[color];

  return (
    <RNText
      style={[
        variantStyle,
        colorStyle,
        weight && { fontWeight: FontWeight[weight] },
        mono && { fontFamily: FontFamily.mono },
        center && { textAlign: 'center' },
        uppercase && { textTransform: 'uppercase', letterSpacing: 0.5 },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  displayLarge: {
    fontSize: FontSize.displayLarge,
    fontWeight: FontWeight.extraBold,
    lineHeight: FontSize.displayLarge * LineHeight.tight,
    color: Colors.text.primary,
  },
  h1: {
    fontSize: FontSize.h1,
    fontWeight: FontWeight.bold,
    lineHeight: FontSize.h1 * LineHeight.tight,
    color: Colors.text.primary,
  },
  h2: {
    fontSize: FontSize.h2,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.h2 * LineHeight.tight,
    color: Colors.text.primary,
  },
  h3: {
    fontSize: FontSize.h3,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.h3 * LineHeight.tight,
    color: Colors.text.primary,
  },
  bodyLarge: {
    fontSize: FontSize.bodyLarge,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.bodyLarge * LineHeight.normal,
    color: Colors.text.primary,
  },
  body: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.body * LineHeight.normal,
    color: Colors.text.primary,
  },
  bodySmall: {
    fontSize: FontSize.bodySmall,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.bodySmall * LineHeight.normal,
    color: Colors.text.primary,
  },
  caption: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.caption * LineHeight.normal,
    color: Colors.text.secondary,
  },
  tiny: {
    fontSize: FontSize.tiny,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.tiny * LineHeight.normal,
    color: Colors.text.secondary,
  },
  gpa: {
    fontSize: FontSize.displayLarge,
    fontWeight: FontWeight.extraBold,
    lineHeight: FontSize.displayLarge * LineHeight.tight,
    color: Colors.text.primary,
    fontFamily: FontFamily.mono,
  },
  gradePoints: {
    fontSize: FontSize.h3,
    fontWeight: FontWeight.bold,
    lineHeight: FontSize.h3 * LineHeight.tight,
    fontFamily: FontFamily.mono,
    color: Colors.text.primary,
  },
});

const colorStyles = StyleSheet.create({
  primary: { color: Colors.text.primary },
  secondary: { color: Colors.text.secondary },
  tertiary: { color: Colors.text.tertiary },
  muted: { color: Colors.text.muted },
  success: { color: Colors.accent.success },
  error: { color: Colors.accent.error },
  warning: { color: Colors.accent.warning },
  info: { color: Colors.accent.info },
  teal: { color: Colors.primary.main },
});
