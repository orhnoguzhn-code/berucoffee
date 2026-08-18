import React from 'react';
import { View, Text, StyleProp, ViewStyle } from 'react-native';
import { colors } from '../../theme';

const AVATAR_COLORS = ['#0E7A4A', '#0B5E39', '#128A55', '#C89B3C', '#8A6A1F'];

interface Props {
  name?: string;
  uri?: string | null;
  size?: number;
  colorIndex?: number;
  style?: StyleProp<ViewStyle>;
}

export default function Avatar({ name = '', uri, size = 44, colorIndex = 0, style }: Props) {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  const bg = AVATAR_COLORS[Math.abs(colorIndex) % AVATAR_COLORS.length];

  return (
    <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }, style]}>
      {uri ? (
        <Text style={{ fontSize: size * 0.5, color: colors.textOnPrimary }}>🖼</Text>
      ) : (
        <Text style={{ fontSize: size * 0.44, color: colors.textOnPrimary, fontWeight: '800' }}>{initial}</Text>
      )}
    </View>
  );
}
