import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, radius, spacing, shadow, typography } from '../../theme';

interface Props {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  elevated?: boolean;
}

export default function Card({ children, style, padded = true, elevated = true }: Props) {
  return (
    <View style={[styles.card, padded && styles.padded, elevated && shadow.sm, style]}>
      {children}
    </View>
  );
}

export function CardHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.xl },
  padded: { padding: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  title: { ...typography.heading, color: colors.textPrimary },
  subtitle: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
});
