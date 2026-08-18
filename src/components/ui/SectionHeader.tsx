import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface Props {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

export default function SectionHeader({ title, subtitle, action, style, children }: Props) {
  return (
    <View style={[styles.row, style]}>
      <View style={{ flex: 1 }}>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {action}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  title: { ...typography.heading, color: colors.textPrimary },
  subtitle: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
});
