import { Platform, ViewStyle } from 'react-native';
import { Colors } from './colors';

export const Shadows = {
  level1: Platform.select<ViewStyle>({
    ios: {
      shadowColor: Colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    android: {
      elevation: 2,
    },
    default: {
      shadowColor: Colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
  }),

  level2: Platform.select<ViewStyle>({
    ios: {
      shadowColor: Colors.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
    },
    android: {
      elevation: 4,
    },
    default: {
      shadowColor: Colors.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
    },
  }),

  level3: Platform.select<ViewStyle>({
    ios: {
      shadowColor: Colors.black,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
    },
    android: {
      elevation: 8,
    },
    default: {
      shadowColor: Colors.black,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
    },
  }),

  level4: Platform.select<ViewStyle>({
    ios: {
      shadowColor: Colors.black,
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.6,
      shadowRadius: 24,
    },
    android: {
      elevation: 16,
    },
    default: {
      shadowColor: Colors.black,
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.6,
      shadowRadius: 24,
    },
  }),

  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  } as ViewStyle,
} as const;

export const Glows = {
  primary: Platform.select<ViewStyle>({
    ios: {
      shadowColor: Colors.primary.main,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
    },
    android: {
      elevation: 4,
    },
    default: {
      shadowColor: Colors.primary.main,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
    },
  }),

  success: Platform.select<ViewStyle>({
    ios: {
      shadowColor: Colors.accent.success,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
    },
    android: {
      elevation: 4,
    },
    default: {
      shadowColor: Colors.accent.success,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
    },
  }),

  error: Platform.select<ViewStyle>({
    ios: {
      shadowColor: Colors.accent.error,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
    },
    android: {
      elevation: 4,
    },
    default: {
      shadowColor: Colors.accent.error,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
    },
  }),
} as const;

export type ShadowLevel = keyof typeof Shadows;
