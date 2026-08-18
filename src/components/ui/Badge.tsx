import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

type BadgeVariant = 'success' | 'warning' | 'info' | 'danger' | 'neutral' | 'gold' | 'primary';

const palette: Record<BadgeVariant, { bg: string; fg: string }> = {
  success: { bg: colors.successSoft, fg: '#166534' },
  warning: { bg: colors.warningSoft, fg: '#92400E' },
  info: { bg: colors.infoSoft, fg: '#1E40AF' },
  danger: { bg: colors.dangerSoft, fg: '#991B1B' },
  neutral: { bg: colors.bgMuted, fg: colors.textSecondary },
  gold: { bg: colors.goldSoft, fg: '#8A6A1F' },
  primary: { bg: colors.primarySoft, fg: colors.primaryDark },
};

interface Props {
  label: string;
  variant?: BadgeVariant;
  style?: StyleProp<ViewStyle>;
}

export default function Badge({ label, variant = 'neutral', style }: Props) {
  const { bg, fg } = palette[variant];
  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.text, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  text: { ...typography.small, fontWeight: '700' },
});
