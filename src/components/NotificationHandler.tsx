import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, StatusBar, Platform, Easing, PanResponder } from 'react-native';
import Icon from './ui/Icon';
import { navigationRef } from '../navigation/AppNavigator';
import { useI18n } from '../i18n/I18nContext';

const AUTO_HIDE_MS = 4000;

const TYPE_STYLE: Record<string, { icon: string; tint: string; color: string; labelKey: string }> = {
  gift: { icon: 'gift', tint: '#E7F4EC', color: '#0E7A4A', labelKey: 'notification.typeGift' },
  admin: { icon: 'megaphone', tint: '#FBF3DC', color: '#C89B3C', labelKey: 'notification.typeAdmin' },
  system: { icon: 'bellRing', tint: '#EAF1FF', color: '#2563EB', labelKey: 'notification.typeSystem' },
  purchase: { icon: 'order', tint: '#EAF1FF', color: '#2563EB', labelKey: 'notification.typePurchase' },
  free: { icon: 'coffee', tint: '#E7F4EC', color: '#0E7A4A', labelKey: 'notification.typeFree' },
};

export default function NotificationHandler({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const [notif, setNotif] = useState<{ title: string; body: string; data?: any } | null>(null);
  const [visible, setVisible] = useState(false);
  const slide = useRef(new Animated.Value(-140)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const panX = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(1)).current;
  const timer = useRef<any>(null);
  const topPad = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 12;

  const finishHide = () => {
    panX.setValue(0);
    setVisible(false);
    setNotif(null);
  };

  const hideNow = useRef(() => {});
  hideNow.current = () => {
    if (timer.current) clearTimeout(timer.current);
    progress.stopAnimation();
    Animated.parallel([
      Animated.timing(slide, { toValue: -140, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(fade, { toValue: 0, duration: 190, useNativeDriver: true }),
    ]).start(() => finishHide());
  };

  const swipeOut = useRef(() => {});
  swipeOut.current = () => {
    if (timer.current) clearTimeout(timer.current);
    progress.stopAnimation();
    Animated.parallel([
      Animated.timing(panX, { toValue: -420, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => finishHide());
  };

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.4,
      onPanResponderMove: (_, g) => {
        panX.setValue(Math.max(-420, Math.min(0, g.dx)));
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < -80) {
          swipeOut.current();
        } else {
          Animated.spring(panX, { toValue: 0, useNativeDriver: true, bounciness: 0, speed: 32 }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(panX, { toValue: 0, useNativeDriver: true, bounciness: 0, speed: 32 }).start();
      },
    })
  ).current;

  const show = (n: { title: string; body: string; data?: any }) => {
    if (timer.current) clearTimeout(timer.current);
    setNotif(n);
    setVisible(true);
    slide.setValue(-140);
    fade.setValue(0);
    panX.setValue(0);
    progress.setValue(1);
    Animated.parallel([
      Animated.spring(slide, { toValue: 0, useNativeDriver: true, speed: 30, bounciness: 8 }),
      Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    Animated.timing(progress, {
      toValue: 0,
      duration: AUTO_HIDE_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
    timer.current = setTimeout(() => hideNow.current(), AUTO_HIDE_MS);
  };

  const openNotifications = () => {
    hideNow.current();
    const tryNav = () => {
      if (navigationRef.isReady()) {
        navigationRef.navigate('Notifications');
      } else {
        setTimeout(tryNav, 250);
      }
    };
    tryNav();
  };

  useEffect(() => {
    let unsubMsg: (() => void) | null = null;
    let unsubOpen: (() => void) | null = null;

    (async () => {
      try {
        const {
          onMessageReceived,
          onNotificationOpened,
          getInitialNotification,
          emitNotificationReceived,
        } = require('../services/notification');

        unsubMsg = onMessageReceived((remoteMessage: any) => {
          const title = remoteMessage.notification?.title || remoteMessage.data?.title || 'Bildirim';
          const body = remoteMessage.notification?.body || remoteMessage.data?.message || '';
          show({ title, body, data: remoteMessage.data });
          emitNotificationReceived(remoteMessage);
        });

        unsubOpen = onNotificationOpened(() => {
          openNotifications();
        });

        const initial = await getInitialNotification();
        if (initial) {
          setTimeout(openNotifications, 400);
        }
      } catch {
        // Firebase messaging not available
      }
    })();

    return () => {
      if (unsubMsg) unsubMsg();
      if (unsubOpen) unsubOpen();
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  if (!visible || !notif) return <>{children}</>;

  const style = TYPE_STYLE[notif.data?.type] || TYPE_STYLE.system;

  return (
    <>
      {children}
      <Animated.View
        className="absolute left-3 right-3"
        style={{
          top: topPad + 6,
          transform: [{ translateY: slide }, { translateX: panX }],
          opacity: fade,
          zIndex: 999,
          elevation: 14,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.14,
          shadowRadius: 16,
        }}
        {...pan.panHandlers}
      >
        <View
          style={{
            backgroundColor: 'rgba(255,255,255,0.97)',
            borderRadius: 20,
            borderWidth: 1,
            borderColor: 'rgba(14,122,74,0.12)',
            overflow: 'hidden',
          }}
        >
          <View className="px-3.5 py-3 flex-row items-center gap-3">
            <View className="w-11 h-11 rounded-2xl items-center justify-center" style={{ backgroundColor: style.tint }}>
              <Icon name={style.icon} size={19} color={style.color} />
            </View>

            <View className="flex-1 pr-1">
              <View className="flex-row items-center gap-1.5">
                <View
                  className="rounded-full px-2 py-0.5"
                  style={{ backgroundColor: `${style.tint}66` }}
                >
                  <Text className="text-[9px] font-extrabold tracking-wide uppercase" style={{ color: style.color }}>
                    {t(style.labelKey)}
                  </Text>
                </View>
              </View>
              <Text className="text-ink text-[13.5px] font-extrabold tracking-tight mt-1.5" numberOfLines={1}>
                {notif.title}
              </Text>
              {!!notif.body && (
                <Text className="text-ink-muted text-[11.5px] mt-0.5 leading-4" numberOfLines={1}>
                  {notif.body}
                </Text>
              )}
            </View>

            <TouchableOpacity
              className="w-9 h-9 rounded-full items-center justify-center"
              style={{ backgroundColor: `${style.tint}55` }}
              onPress={openNotifications}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              activeOpacity={0.75}
            >
              <Icon name="arrow" size={15} color={style.color} style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>
          </View>

          <View style={{ height: 3, backgroundColor: 'rgba(14,122,74,0.08)' }}>
            <Animated.View style={{ height: 3, width: progressWidth, backgroundColor: style.color }} />
          </View>
        </View>
      </Animated.View>
    </>
  );
}