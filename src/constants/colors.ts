export const Colors = {
  primary: {
    main: '#0891B2',
    light: '#06B6D4',
    dark: '#0E7490',
    veryDark: '#164E63',
  },

  background: {
    app: '#0F172A',
    surface: '#1E293B',
    elevated: '#334155',
    subtle: '#1E3A4A',
  },

  text: {
    primary: '#F1F5F9',
    secondary: '#94A3B8',
    tertiary: '#64748B',
    muted: '#475569',
  },

  grades: {
    A: '#10B981',
    B: '#3B82F6',
    C: '#F59E0B',
    D: '#F97316',
    F: '#EF4444',
  },

  accent: {
    info: '#3B82F6',
    warning: '#F59E0B',
    error: '#EF4444',
    success: '#10B981',
    purple: '#8B5CF6',
    pink: '#EC4899',
  },

  ui: {
    border: '#334155',
    divider: '#1E293B',
    overlay: 'rgba(15, 23, 42, 0.9)',
    shadow: 'rgba(0, 0, 0, 0.5)',
  },

  status: {
    online: '#10B981',
    offline: '#64748B',
    syncing: '#3B82F6',
    error: '#EF4444',
  },

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export const getGradeColor = (grade: string): string => {
  const gradeUpper = grade.toUpperCase();
  if (gradeUpper.startsWith('A')) return Colors.grades.A;
  if (gradeUpper.startsWith('B')) return Colors.grades.B;
  if (gradeUpper.startsWith('C')) return Colors.grades.C;
  if (gradeUpper.startsWith('D')) return Colors.grades.D;
  return Colors.grades.F;
};

export const getGPAColor = (gpa: number): string => {
  if (gpa >= 4.0) return Colors.grades.A;
  if (gpa >= 3.0) return Colors.grades.B;
  if (gpa >= 2.0) return Colors.grades.C;
  if (gpa >= 1.0) return Colors.grades.D;
  return Colors.grades.F;
};

export type ColorScheme = typeof Colors;
