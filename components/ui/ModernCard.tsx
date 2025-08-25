import React from 'react';
import { View, StyleSheet, Platform, ViewStyle } from 'react-native';
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
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
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
    borderWidth: 1,
    borderColor: Colors.border,
  },
  elevated: {
    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
      },
    }),
  },
  outlined: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
});