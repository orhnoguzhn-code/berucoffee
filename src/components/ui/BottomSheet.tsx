import React, { ReactNode } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback,
  Animated, Dimensions,
} from 'react-native';
import { useRef, useEffect } from 'react';
import { colors, radius, spacing, typography } from '../../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
  snapTo?: number;
}

const { height: SCREEN_H } = Dimensions.get('window');

export default function BottomSheet({ visible, onClose, title, children, snapTo = 0.6 }: Props) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 18 }).start();
    } else {
      Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: true }).start();
    }
  }, [visible]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [SCREEN_H * 0.8, 0] });

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>
      <Animated.View style={[styles.sheet, { height: SCREEN_H * snapTo, transform: [{ translateY }] }]}>
        <View style={styles.handleWrap}>
          <View style={styles.handle} />
        </View>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        <View style={styles.content}>{children}</View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl,
    paddingHorizontal: spacing.xl,
  },
  handleWrap: { alignItems: 'center', paddingTop: spacing.md, paddingBottom: spacing.sm },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },
  title: { ...typography.heading, color: colors.textPrimary, marginBottom: spacing.md },
  content: { flex: 1 },
});
