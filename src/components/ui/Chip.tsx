import React from 'react';
import { TouchableOpacity, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  icon?: string;
  style?: StyleProp<ViewStyle>;
}

export default function Chip({ label, selected, onPress, disabled, icon, style }: ChipProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.chip,
        selected && styles.selected,
        disabled && { opacity: 0.4 },
        style,
      ]}
    >
      {icon ? <Text style={[styles.icon, selected && { color: colors.textOnPrimary }]}>{icon}</Text> : null}
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.bgSoft,
    borderWidth: 1, borderColor: colors.border,
    marginRight: spacing.sm, marginBottom: spacing.sm,
  },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  icon: { fontSize: 14, marginRight: spacing.xs, color: colors.textSecondary },
  label: { ...typography.bodyBold, color: colors.textSecondary },
  labelSelected: { color: colors.textOnPrimary },
});
