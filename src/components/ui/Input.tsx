import React, { ReactNode } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  TextInputProps, StyleProp, ViewStyle,
} from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  onRightPress?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
}

export default function Input({
  label, error, hint, leftIcon, rightIcon, onRightPress, containerStyle, ...rest
}: InputProps) {
  return (
    <View style={containerStyle}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.wrap, error ? styles.wrapError : null]}>
        {leftIcon ? <View style={styles.iconLeft}>{leftIcon}</View> : null}
        <TextInput
          placeholderTextColor={colors.textMuted}
          style={[styles.input, leftIcon ? styles.inputWithLeft : null]}
          {...rest}
        />
        {rightIcon ? (
          <TouchableOpacity style={styles.iconRight} onPress={onRightPress} activeOpacity={0.7}>
            {rightIcon}
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs, fontWeight: '600' },
  wrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgSoft, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md,
    minHeight: 52,
  },
  wrapError: { borderColor: colors.danger, backgroundColor: colors.dangerSoft },
  input: { flex: 1, ...typography.body, color: colors.textPrimary, paddingVertical: 0 },
  inputWithLeft: { marginLeft: spacing.sm },
  iconLeft: { marginRight: spacing.xs },
  iconRight: { padding: spacing.xs },
  error: { ...typography.small, color: colors.danger, marginTop: spacing.xs },
  hint: { ...typography.small, color: colors.textMuted, marginTop: spacing.xs },
});
