import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface Props {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export default function EmptyState({ icon = '📭', title, description, action, style }: Props) {
  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.desc}>{description}</Text> : null}
      {action ? <View style={{ marginTop: spacing.lg }}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', padding: spacing.xxxl },
  iconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.bgSoft, alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  icon: { fontSize: 30 },
  title: { ...typography.subheading, color: colors.textPrimary, textAlign: 'center' },
  desc: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm, lineHeight: 20 },
});
