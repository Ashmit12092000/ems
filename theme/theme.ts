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
    label: {
      fontSize: 14,
      color: Colors.secondary,
      marginBottom: 8,
    },
  } as const;
  