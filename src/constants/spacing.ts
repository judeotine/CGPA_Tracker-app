export const BASE_UNIT = 4;

export const Spacing = {
  xs: BASE_UNIT,
  sm: BASE_UNIT * 2,
  md: BASE_UNIT * 4,
  lg: BASE_UNIT * 6,
  xl: BASE_UNIT * 8,
  '2xl': BASE_UNIT * 12,
  '3xl': BASE_UNIT * 16,
} as const;

export const ComponentSpacing = {
  cardPadding: {
    horizontal: Spacing.md,
    vertical: Spacing.md,
    large: 20,
  },
  screenPadding: {
    horizontal: Spacing.md,
    vertical: Spacing.md,
    large: Spacing.lg,
  },
  sectionGap: Spacing.lg,
  listItemSpacing: Spacing.sm + BASE_UNIT,
  inputPadding: Spacing.md,
  buttonPadding: {
    horizontal: Spacing.md,
    vertical: Spacing.sm + BASE_UNIT,
  },
  iconGap: Spacing.sm,
  badgePadding: {
    horizontal: Spacing.sm + BASE_UNIT,
    vertical: 6,
  },
} as const;

export const BorderRadius = {
  small: 8,
  medium: 12,
  large: 16,
  xLarge: 20,
  full: 9999,
} as const;

export const Layout = {
  bottomTabHeight: 60,
  headerHeight: 56,
  fabSize: 56,
  inputHeight: 52,
  buttonHeight: 52,
  buttonHeightLarge: 56,
  avatarSize: {
    small: 32,
    medium: 40,
    large: 100,
    xlarge: 120,
  },
  iconSize: {
    small: 16,
    medium: 20,
    large: 24,
    xlarge: 32,
    hero: 48,
  },
} as const;

export type SpacingScale = typeof Spacing;
