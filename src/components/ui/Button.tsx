import React from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator, StyleSheet,
  StyleProp, ViewStyle, TextStyle,
} from 'react-native';
import { colors, radius, spacing, typography, shadow } from '../../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface Props {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const bgByVariant: Record<ButtonVariant, string> = {
  primary: colors.primary,
  secondary: colors.primaryDark,
  outline: 'transparent',
  ghost: 'transparent',
  danger: colors.danger,
};

const textByVariant: Record<ButtonVariant, string> = {
  primary: colors.textOnPrimary,
  secondary: colors.textOnPrimary,
  outline: colors.primary,
  ghost: colors.primary,
  danger: colors.textOnPrimary,
};

const heightBySize: Record<ButtonSize, number> = {
  sm: 36,
  md: 44,
  lg: 52,
  xl: 58,
};

const radiusBySize: Record<ButtonSize, number> = {
  sm: radius.full,
  md: radius.full,
  lg: radius.full,
  xl: radius.lg,
};

export default function Button({
  title, onPress, variant = 'primary', size = 'lg',
  loading, disabled, fullWidth = true, icon, style, textStyle,
}: Props) {
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        styles.base,
        {
          height: heightBySize[size],
          borderRadius: radiusBySize[size],
          backgroundColor: isOutline || isGhost ? 'transparent' : bgByVariant[variant],
          borderWidth: isOutline ? 1.5 : 0,
          borderColor: colors.primary,
        },
        (disabled || loading) && { opacity: 0.5 },
        fullWidth && styles.full,
        !isGhost && shadow.sm,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textByVariant[variant]} />
      ) : (
        <>
          {icon ? <View style={{ marginRight: spacing.sm }}>{icon}</View> : null}
          <Text
            style={[
              styles.text,
              { color: isGhost && !disabled ? colors.primary : textByVariant[variant], fontSize: size === 'sm' ? 14 : 16 },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  full: { width: '100%' },
  text: { fontWeight: '700' },
});
