export const Colors = {
  // Primary brand colors - professional blues
  primary: '#2563EB', // Modern blue
  primaryLight: '#3B82F6',
  primaryDark: '#1D4ED8',

  // Secondary colors
  secondary: '#64748B', // Slate gray
  secondaryLight: '#94A3B8',

  // Neutral colors
  background: '#FFFFFF',
  backgroundSecondary: '#F8FAFC',
  backgroundTertiary: '#F1F5F9',

  // Text colors
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#64748B',
  textInverse: '#FFFFFF',

  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // UI colors
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  shadow: 'rgba(15, 23, 42, 0.08)',
  overlay: 'rgba(15, 23, 42, 0.6)',

  // Interactive colors
  interactive: '#2563EB',
  interactiveHover: '#1D4ED8',
  interactivePressed: '#1E40AF',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Shadow = {
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

export const BorderRadius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Typography = {
  // Display text
  displayLarge: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
    color: Colors.textPrimary,
  },
  displayMedium: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
    color: Colors.textPrimary,
  },

  // Headings
  headingLarge: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
    color: Colors.textPrimary,
  },
  headingMedium: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
    color: Colors.textPrimary,
  },
  headingSmall: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
    color: Colors.textPrimary,
  },

  // Body text
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    color: Colors.textPrimary,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    color: Colors.textTertiary,
  },

  // Labels and captions
  labelLarge: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
    color: Colors.textPrimary,
  },
  labelMedium: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
    color: Colors.textSecondary,
  },
  labelSmall: {
    fontSize: 10,
    fontWeight: '500' as const,
    lineHeight: 14,
    color: Colors.textTertiary,
  },
};

export const Shadows = {
  small: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
  },
  large: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const Animation = {
  fast: 150,
  normal: 250,
  slow: 350,
  easing: {
    easeOut: 'ease-out',
    easeIn: 'ease-in',
    easeInOut: 'ease-in-out',
  },
};