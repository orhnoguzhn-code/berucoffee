import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon, { ICONS } from './ui/Icon';

export interface AlertButton {
  text: string;
  onPress: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface Props {
  visible: boolean;
  title: string;
  message: string;
  buttons: AlertButton[];
  icon?: string;
  type?: 'success' | 'error' | 'info' | 'question';
}

type IconTheme = { icon?: string; color: string; from: string; to: string };

const TYPE_CONFIG: Record<string, IconTheme> = {
  success: { icon: 'success', color: '#0B7A49', from: '#E4F3EA', to: '#F5FBF7' },
  error: { icon: 'alert', color: '#D13B33', from: '#FBE7E6', to: '#FEF6F6' },
  question: { icon: 'info', color: '#A16207', from: '#FAEBD4', to: '#FDF7EC' },
  info: { icon: 'info', color: '#2455C4', from: '#E4EDF9', to: '#F3F7FC' },
};

const ICON_THEMES: Record<string, IconTheme> = {
  logout: { color: '#A16207', from: '#FAEBD4', to: '#FDF7EC' },
  success: TYPE_CONFIG.success,
  alert: TYPE_CONFIG.error,
  info: TYPE_CONFIG.info,
  help: TYPE_CONFIG.info,
};

export default function AlertModal({ visible, title, message, buttons, icon, type }: Props) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [visible, anim]);

  const isConfirm = buttons.length === 2;
  const dismiss = () => buttons[0]?.onPress();

  const customIcon = icon && typeof ICONS[icon] !== 'undefined' ? icon : null;
  const config = TYPE_CONFIG[type || ''] || TYPE_CONFIG.success;
  const iconName: string = customIcon || config.icon || 'info';
  const theme = (customIcon && ICON_THEMES[customIcon]) || (customIcon ? { color: '#4A4E57', from: '#EDEFF2', to: '#F8F9FB' } : config);

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] });
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });
  const cardOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={dismiss} statusBarTranslucent>
      <View style={styles.overlay}>
        <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={dismiss} />
        <Animated.View style={[styles.card, { opacity: cardOpacity, transform: [{ scale }, { translateY }] }]}>
          <LinearGradient colors={[theme.from, theme.to]} style={styles.iconWrap}>
            <Icon name={iconName} size={30} color={theme.color} strokeWidth={2.2} />
          </LinearGradient>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.btnRow}>
            {buttons.map((btn, i) => {
              const isOutline = isConfirm && i === 0;
              const isDestructive = btn.style === 'destructive';
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.btn,
                    isOutline && styles.btnOutline,
                    !isOutline && !isDestructive && styles.btnPrimary,
                    isDestructive && !isOutline && styles.btnDestructive,
                  ]}
                  onPress={btn.onPress}
                  activeOpacity={0.85}
                >
                  <Text style={[
                    styles.btnText,
                    isOutline && styles.btnTextOutline,
                    !isOutline && !isDestructive && styles.btnTextPrimary,
                    isDestructive && !isOutline && styles.btnTextDestructive,
                  ]}>
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(18,18,24,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 26,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 28,
    elevation: 20,
  },
  iconWrap: {
    width: 62,
    height: 62,
    borderRadius: 31,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 14,
    color: '#6E6E73',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
    paddingHorizontal: 6,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  btn: {
    flex: 1,
    minHeight: 50,
    borderRadius: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: '#0E7A4A',
  },
  btnOutline: {
    backgroundColor: '#F5F5F7',
    borderWidth: 1,
    borderColor: '#E4E4E9',
  },
  btnDestructive: {
    backgroundColor: '#DC2626',
  },
  btnText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  btnTextPrimary: { color: '#FFFFFF' },
  btnTextOutline: { color: '#3A3A3C' },
  btnTextDestructive: { color: '#FFFFFF' },
});