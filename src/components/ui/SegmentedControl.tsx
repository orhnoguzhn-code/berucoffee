import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

interface Segment {
  key: string;
  label: string;
}

interface Props {
  segments: Segment[];
  value: string;
  onChange: (key: string) => void;
}

export default function SegmentedControl({ segments, value, onChange }: Props) {
  return (
    <View style={styles.track}>
      {segments.map(seg => {
        const active = seg.key === value;
        return (
          <TouchableOpacity
            key={seg.key}
            activeOpacity={0.8}
            onPress={() => onChange(seg.key)}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{seg.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.bgSoft,
    borderRadius: radius.full,
    padding: spacing.xs,
    marginHorizontal: spacing.xl,
  },
  segment: {
    flex: 1,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: { backgroundColor: colors.white, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  label: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  labelActive: { color: colors.textPrimary, fontWeight: '700' },
});
