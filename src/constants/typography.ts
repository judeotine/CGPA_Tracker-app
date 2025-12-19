import { Platform } from 'react-native';

export const FontFamily = {
  primary: Platform.select({
    ios: 'SF Pro Display',
    android: 'Roboto',
    default: 'Inter',
  }),
  mono: Platform.select({
    ios: 'SF Mono',
    android: 'monospace',
    default: 'JetBrains Mono',
  }),
} as const;

export const FontSize = {
  displayLarge: 48,
  h1: 32,
  h2: 24,
  h3: 20,
  bodyLarge: 18,
  body: 16,
  bodySmall: 14,
  caption: 12,
  tiny: 10,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extraBold: '800' as const,
};

export const LineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
};

export const TextStyles = {
  displayLarge: {
    fontSize: FontSize.displayLarge,
    fontWeight: FontWeight.extraBold,
    lineHeight: FontSize.displayLarge * LineHeight.tight,
  },
  h1: {
    fontSize: FontSize.h1,
    fontWeight: FontWeight.bold,
    lineHeight: FontSize.h1 * LineHeight.tight,
  },
  h2: {
    fontSize: FontSize.h2,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.h2 * LineHeight.tight,
  },
  h3: {
    fontSize: FontSize.h3,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.h3 * LineHeight.tight,
  },
  bodyLarge: {
    fontSize: FontSize.bodyLarge,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.bodyLarge * LineHeight.normal,
  },
  body: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.body * LineHeight.normal,
  },
  bodySmall: {
    fontSize: FontSize.bodySmall,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.bodySmall * LineHeight.normal,
  },
  caption: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.caption * LineHeight.normal,
  },
  tiny: {
    fontSize: FontSize.tiny,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.tiny * LineHeight.normal,
  },
  gpa: {
    fontSize: FontSize.displayLarge,
    fontWeight: FontWeight.extraBold,
    lineHeight: FontSize.displayLarge * LineHeight.tight,
    fontFamily: FontFamily.mono,
  },
  gradePoints: {
    fontSize: FontSize.h3,
    fontWeight: FontWeight.bold,
    lineHeight: FontSize.h3 * LineHeight.tight,
    fontFamily: FontFamily.mono,
  },
} as const;
