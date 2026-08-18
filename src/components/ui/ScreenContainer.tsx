import React, { ReactNode } from 'react';
import {
  View, ScrollView, RefreshControl, StyleSheet, StyleProp, ViewStyle,
  SafeAreaView,
} from 'react-native';
import { colors } from '../../theme';

interface Props {
  children?: ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  edges?: boolean;
}

export default function ScreenContainer({
  children, scroll = true, refreshing, onRefresh, style, contentStyle, edges = true,
}: Props) {
  const inner = (
    <View style={styles.content}>
      {children}
    </View>
  );

  if (!scroll) {
    return (
      <SafeAreaView style={[styles.safe, style]}>
        {inner}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, style]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, contentStyle]}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={!!refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1 },
  scrollContent: { paddingBottom: 32 },
});
