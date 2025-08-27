// File: theme.ts
// A centralized file for our new design system's colors and styles.

export const Colors = {
  primary: '#0052cc', // A strong, professional blue
  primaryLight: '#4c8cff',
  secondary: '#5E6C84',
  background: '#F4F5F7', // A light, neutral gray for backgrounds
  white: '#FFFFFF',
  darkText: '#172B4D',
  lightText: '#5E6C84',
  success: '#36B37E',
  danger: '#FF5630',
  warning: '#FFAB00',
  border: '#DFE1E6',
  error: '#FF5630',
  textPrimary: '#172B4D',
  textSecondary: '#5E6C84',
  textTertiary: '#8993A4',
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
};

export const Sizing = {
  borderRadius: 12,
  padding: 16,
  margin: 16,
};

// By adding "as const", we tell TypeScript to infer the most specific types possible.
// For example, fontWeight will be inferred as the literal type 'bold', not the general type 'string'.
export const Typography = {
  h1: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.darkText,
  },
  h2: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.darkText,
  },
  body: {
    fontSize: 16,
    color: Colors.lightText,
  },
  bodyLarge: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  label: {
    fontSize: 14,
    color: Colors.secondary,
    marginBottom: 8,
  },
  labelMedium: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
} as const;