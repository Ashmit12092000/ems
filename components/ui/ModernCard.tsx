import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Colors, BorderRadius, Spacing, Shadows } from '../../theme/theme';

interface ModernCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: keyof typeof Spacing;
  style?: ViewStyle;
}

export const ModernCard: React.FC<ModernCardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  style,
}) => {
  const getCardStyle = () => {
    const baseStyle = [styles.card, { padding: Spacing[padding] }];

    switch (variant) {
      case 'elevated':
        return [...baseStyle, styles.elevated];
      case 'outlined':
        return [...baseStyle, styles.outlined];
      default:
        return [...baseStyle, styles.default];
    }
  };

  return (
    <View style={[getCardStyle(), style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.lg,
    margin: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    // Use boxShadow for web compatibility
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
      },
    }),
  },
  default: {
    ...Shadows.small,
  },
  elevated: {
    ...Shadows.medium,
  },
  outlined: {
    borderWidth: 1,
    borderColor: Colors.border,
  },
});