import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, RefreshControl, useWindowDimensions, Animated, Easing, DeviceEventEmitter, ActivityIndicator } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { cssInterop } from 'nativewind';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useI18n } from '../i18n/I18nContext';
import api, { resolveImageUrl } from '../services/api';
import { NOTIF_EVENT } from '../services/notification';
import Icon from '../components/ui/Icon';
import ReanimatedAnimated, { useSharedValue, useAnimatedStyle, withTiming, cancelAnimation, interpolate, Extrapolation, Easing as ReEasing } from 'react-native-reanimated';
import { CoffeeStoryRight } from '../components/RewardStory';
import AlertModal from '../components/AlertModal';

const AnimatedView = Animated.View;
cssInterop(AnimatedView, { className: 'style' });

function getInitials(name: string): string {
  return name?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

function getGreeting(hour: number, t: (k: string) => string): string {
  if (hour < 12) return t('home.morning');
  if (hour < 18) return t('home.afternoon');
  return t('home.evening');
}

const NOTIF_META: Record<string, { icon: string; tint: string; color: string }> = {
  gift: { icon: 'gift', tint: 'bg-primary-soft', color: '#0E7A4A' },
  admin: { icon: 'megaphone', tint: 'bg-gold-soft', color: '#C89B3C' },
  system: { icon: 'info', tint: 'bg-info-soft', color: '#2563EB' },
};

function notifTimeAgo(iso: string, t: (k: string, p?: any) => string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return t('notification.timeJustNow');
  if (min < 60) return t('notification.timeMin', { n: min });
  const hr = Math.floor(min / 60);
  if (hr < 24) return t('notification.timeHour', { n: hr });
  return t('notification.timeDay', { n: Math.floor(hr / 24) });
}

const OFFER_ART: Record<number, { icon: string; tint: string; color: string }> = {
  0: { icon: 'gift', tint: 'bg-primary-soft', color: '#0E7A4A' },
  1: { icon: 'coffee', tint: 'bg-gold-soft', color: '#C89B3C' },
  2: { icon: 'ticket', tint: 'bg-info-soft', color: '#2563EB' },
  3: { icon: 'star', tint: 'bg-danger-soft', color: '#DC2626' },
};

const POP_ART: { tint: string; color: string }[] = [
  { tint: '#E7F4EC', color: '#0E7A4A' },
  { tint: '#FBF3DC', color: '#C89B3C' },
  { tint: '#EAF1FF', color: '#2563EB' },
  { tint: '#FBE9E9', color: '#DC2626' },
];

/* orbit points around the reward ring (r=41, center 52,52) for the comet animation */
const ORBIT_KEYS = Array.from({ length: 17 }, (_, i) => i / 16);
const ORBIT_POINTS = (offsetFrac: number) =>
  Array.from({ length: 17 }, (_, i) => {
    const a = -Math.PI / 2 + offsetFrac * Math.PI * 2 + (i / 16) * Math.PI * 2;
    return { x: 52 + 41 * Math.cos(a), y: 52 + 41 * Math.sin(a) };
  });

function Skeleton({ className }: { className: string }) {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <AnimatedView className={className} style={{ opacity }} />;
}


export default function HomeScreen({ navigation }: any) {
  const { user, token, logout } = useAuth();
  const { itemCount, addItem } = useCart();
  const { t, language } = useI18n();
  const { width: winW } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState<any>(null);
  const [loyalty, setLoyalty] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [offerCardH, setOfferCardH] = useState(0);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const fetchUnread = useCallback(async () => {
    if (!token) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data.count ?? 0);
    } catch {
      // ignore
    }
  }, [token]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(NOTIF_EVENT, () => {
      setUnreadCount((c) => c + 1);
    });
    return () => { sub.remove(); };
  }, []);

  useFocusEffect(useCallback(() => { fetchUnread(); }, [fetchUnread]));

  const loadNotifs = useCallback(async () => {
    setNotifLoading(true);
    try {
      const res = await api.get('/notifications', { params: { limit: 12 } });
      const list: any[] = res.data.data || [];
      setNotifs(list);
      if (list.some((n) => !n.is_read)) {
        api.put('/notifications/read-all').catch(() => {});
        setUnreadCount(0);
        setNotifs(list.map((n) => ({ ...n, is_read: true })));
      }
    } catch {
      // ignore
    } finally {
      setNotifLoading(false);
    }
  }, []);

  const deleteNotif = useCallback((id: number) => {
    setNotifs((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount(0);
    api.delete(`/notifications/${id}`).catch(() => {});
  }, []);

  const deleteAllNotifs = useCallback(() => {
    if (notifs.length === 0) return;
    setNotifs([]);
    setUnreadCount(0);
    api.delete('/notifications').catch(() => {});
  }, [notifs.length]);

  const closeNotif = useCallback(() => setNotifOpen(false), []);

  const toggleNotif = useCallback(() => {
    if (notifOpen) {
      setNotifOpen(false);
    } else {
      setNotifOpen(true);
      loadNotifs();
    }
  }, [notifOpen, loadNotifs]);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    const gate = new Promise<void>((resolve) => setTimeout(resolve, 4000));
    try {
      const tasks: Promise<void>[] = [
        api.get('/menu/items').then((r) => setMenuItems((r.data.data || []).filter((i: any) => i.is_popular).slice(0, 6))),
        api.get('/offers').then((r) => setOffers(r.data.data || [])),
        api.get('/settings/public').then((r) => setSettings(r.data.data || null)),
      ];
      if (token) {
        tasks.push(
          api.get('/users/profile').then((r) => setProfile(r.data.data)),
          api.get('/loyalty/status').then((r) => setLoyalty(r.data.data)),
        );
      } else {
        setProfile(null);
        setLoyalty(null);
      }
      await Promise.race([Promise.all(tasks), gate]);
    } catch (err) {
      console.log('Home fetch error:', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadedOnce = useRef(false);
  useFocusEffect(useCallback(() => { load(loadedOnce.current ? { silent: true } : undefined); loadedOnce.current = true; }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load({ silent: true });
    setRefreshing(false);
  }, [load]);

  const localize = (item: any, field: string) => {
    const suffix = language === 'en' ? '_en' : language === 'de' ? '_de' : language === 'ru' ? '_ru' : '';
    return item[field + suffix] || item[field];
  };

  /* Responsive card widths based on screen dimension. */
  const cardGutter = 20;
  const offerW = Math.min(260, winW - cardGutter * 2 - 28);
  const popularW = Math.min(158, (winW - cardGutter * 2 - 24) / 2);

  const data = profile || user;
  const userName = data?.name || 'Beru';
  const initials = getInitials(userName);
  const stars = loyalty?.stars ?? data?.star_balance ?? 0;
  const tier = loyalty?.tier ?? 'green';
  const progress = loyalty?.tier_progress || { current: 0, next: 150, percent: 0, remaining: 150 };
  const wallet = data?.wallet_balance ?? 0;
  const isGold = tier === 'gold';
  const isPlatinum = tier === 'platinum';
  const tierLabel = isPlatinum ? t('home.platinum') : isGold ? t('home.gold') : t('home.rewards');

  const threshold = settings?.threshold ?? profile?.threshold ?? 10;
  const totalPurchases = loyalty?.total_purchases ?? data?.total_purchases ?? 0;
  const freeBalance = loyalty?.free_balance ?? data?.free_balance ?? 0;
  const inCycle = totalPurchases % threshold;
  const remainingToFree = inCycle === 0 ? 0 : threshold - inCycle;
  const coffeePercent = Math.min(100, Math.round((inCycle / threshold) * 100));
  const talkMessage =
    inCycle === 0
      ? t('home.beruTalkStart')
      : inCycle >= threshold / 2
        ? t('home.beruTalkHalf', { n: remainingToFree })
        : t('home.beruTalkMid', { n: remainingToFree });

  const open = useCallback(
    (screen: string, params?: any) => {
      if (token || screen === 'Order') {
        navigation.navigate(screen, params);
      } else {
        navigation.navigate('Auth', { screen: 'PhoneLogin' });
      }
    },
    [token, navigation],
  );

  const greeting = getGreeting(new Date().getHours(), t);

  /* ---- entrance animations ---- */
  const heroAnim = useRef(new Animated.Value(0)).current;
  const walletAnim = useRef(new Animated.Value(0)).current;
  const popularAnim = useRef(new Animated.Value(0)).current;
  const offersAnim = useRef(new Animated.Value(0)).current;
  const quickAnim = useRef(new Animated.Value(0)).current;
  const ctaAnim = useRef(new Animated.Value(0)).current;
  const coffeeSwapAnim = useRef(new Animated.Value(0)).current;
  const coffeeLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  /* breathing gold glow behind the reward ring */
  const heroGlow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(heroGlow, { toValue: 1, duration: 2300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(heroGlow, { toValue: 0, duration: 2300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [heroGlow]);

  /* 3D tilt of the badge image inside the ring */
  const iconTilt = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(iconTilt, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.delay(350),
        Animated.timing(iconTilt, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.delay(350),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [iconTilt]);
  const iconTiltStyle = {
    transform: [
      { perspective: 500 },
      { rotateY: iconTilt.interpolate({ inputRange: [0, 1], outputRange: ['-48deg', '48deg'] }) },
    ],
  };

  const runEntrance = useCallback(() => {
    heroAnim.setValue(0);
    walletAnim.setValue(0);
    popularAnim.setValue(0);
    offersAnim.setValue(0);
    quickAnim.setValue(0);
    ctaAnim.setValue(0);
    const anim = (v: Animated.Value, delay: number) =>
      Animated.timing(v, { toValue: 1, duration: 520, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    Animated.parallel([
      anim(heroAnim, 0),
      anim(walletAnim, 80),
      anim(popularAnim, 150),
      anim(offersAnim, 210),
      anim(quickAnim, 280),
      anim(ctaAnim, 350),
    ]).start();
  }, [heroAnim, walletAnim, popularAnim, offersAnim, quickAnim, ctaAnim]);

  const playCoffeeSwap = useCallback(() => {
    if (coffeeLoopRef.current) coffeeLoopRef.current.stop();
    coffeeSwapAnim.setValue(0);
    coffeeLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.delay(1600),
        Animated.timing(coffeeSwapAnim, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.back(1.8)),
          useNativeDriver: false,
        }),
        Animated.delay(1800),
        Animated.timing(coffeeSwapAnim, {
          toValue: 0,
          duration: 550,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: false,
        }),
      ]),
    );
    coffeeLoopRef.current.start();
  }, [coffeeSwapAnim]);

  /* animate again the moment sections actually mount (data arrived) */
  useEffect(() => {
    if (loading) return;
    runEntrance();
    playCoffeeSwap();
  }, [loading, runEntrance, playCoffeeSwap]);

  /* replay on every screen focus for a lively feel */
  useFocusEffect(
    useCallback(() => {
      if (!loading) {
        runEntrance();
        playCoffeeSwap();
      }
    }, [loading, runEntrance, playCoffeeSwap]),
  );

  const entrance = (v: Animated.Value) => ({
    opacity: v,
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [24, 0], extrapolate: 'clamp' }) }],
  });
  const heroStyle = {
    ...entrance(heroAnim),
    transform: [
      { translateY: heroAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0], extrapolate: 'clamp' }) },
      { scale: heroAnim.interpolate({ inputRange: [0, 1], outputRange: [1.04, 1], extrapolate: 'clamp' }) },
    ],
  };
  const walletStyle = entrance(walletAnim);
  const popularStyle = entrance(popularAnim);
  const offersStyle = entrance(offersAnim);
  const quickStyle = entrance(quickAnim);
  const ctaStyle = entrance(ctaAnim);

  /* progress bar fill */
  const progressAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 1000,
      delay: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress.percent, progressAnim]);
  const progressStyle = {
    width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${Math.min(progress.percent, 100)}%`] }),
  };

  /* coffee card progress fill */
  const coffeeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    coffeeAnim.setValue(0);
    Animated.timing(coffeeAnim, {
      toValue: 1,
      duration: 1000,
      delay: 450,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [coffeePercent, coffeeAnim]);
  const coffeeBarStyle = {
    width: coffeeAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${coffeePercent}%`] }),
  };

  /* star badge pulse */
  const starScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(starScale, { toValue: 1.12, duration: 700, useNativeDriver: true }),
        Animated.timing(starScale, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [starScale]);
  const starStyle = { transform: [{ scale: starScale }] };

  /* steam wisps rising from the coffee badge */
  const steamAnims = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  useEffect(() => {
    const loops = steamAnims.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 1100),
          Animated.timing(v, {
            toValue: 1,
            duration: 3200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.delay(900),
          Animated.timing(v, {
            toValue: 0,
            duration: 1,
            useNativeDriver: true,
          }),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [steamAnims]);

  /* gold sparkles around the reward ring */
  const sparkleAnims = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(0))).current;
  useEffect(() => {
    const loops = sparkleAnims.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 700),
          Animated.timing(v, {
            toValue: 1,
            duration: 650,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(v, {
            toValue: 0,
            duration: 650,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.delay(1500 - i * 150),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [sparkleAnims]);

  /* ---- "Kahve Ritüeli" cinematic loop (syncs comet, pour, burst, shimmer) ---- */
  const cometT = useRef(new Animated.Value(0)).current;
  const pourT = useRef(new Animated.Value(0)).current;
  const burstT = useRef(new Animated.Value(0)).current;
  const shimmerT = useRef(new Animated.Value(0)).current;
  const counterPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const ritual = Animated.loop(
      Animated.sequence([
        /* Faz 1 (0-3.2s): comet glides along the progress arc */
        Animated.timing(cometT, { toValue: 1, duration: 3000, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
        Animated.delay(200),
        /* Faz 2 (3.4-7.4s): espresso drop falls into the cup, counter pulses */
        Animated.timing(pourT, { toValue: 1, duration: 2400, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(counterPulse, { toValue: 1, duration: 500, easing: Easing.out(Easing.back(2)), useNativeDriver: true }),
          Animated.timing(counterPulse, { toValue: 0, duration: 500, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        ]),
        Animated.delay(400),
        /* Faz 3 (7.8-10.6s): burst ring expands, card shimmer sweeps */
        Animated.parallel([
          Animated.timing(burstT, { toValue: 1, duration: 1400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.delay(300),
          Animated.timing(shimmerT, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
        ]),
        Animated.delay(300),
        /* reset */
        Animated.parallel([
          Animated.timing(cometT, { toValue: 0, duration: 1, useNativeDriver: true }),
          Animated.timing(pourT, { toValue: 0, duration: 1, useNativeDriver: true }),
          Animated.timing(burstT, { toValue: 0, duration: 1, useNativeDriver: true }),
          Animated.timing(shimmerT, { toValue: 0, duration: 1, useNativeDriver: true }),
        ]),
        Animated.delay(400),
      ]),
    );
    ritual.start();
    return () => ritual.stop();
  }, [cometT, pourT, burstT, shimmerT, counterPulse]);

  /* card-wide breathing gold glow overlay */
  const cardGlowT = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(cardGlowT, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(cardGlowT, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    glow.start();
    return () => glow.stop();
  }, [cardGlowT]);

  /* reward card story — characters acting on both sides of the badge */
  const storyT = useSharedValue(0);
  const leftSceneDim = useAnimatedStyle(() => ({
    opacity: 1,
  }));
  const rightSceneDim = useAnimatedStyle(() => ({
    opacity: interpolate(storyT.value, [0.02, 0.05, 0.97, 0.995], [1, 0.15, 0.15, 1], Extrapolation.CLAMP),
  }));
  useEffect(() => {
    storyT.value = 0;
    storyT.value = withTiming(1, { duration: 11000, easing: ReEasing.linear });
    return () => cancelAnimation(storyT);
  }, [storyT]);

  const quickActions = [
    { key: 'Order', icon: 'order', label: t('menu.title'), tint: 'bg-primary-soft', color: '#0E7A4A' },
    { key: 'History', icon: 'history', label: t('tabs.orders'), tint: 'bg-info-soft', color: '#2563EB' },
    { key: 'QRKodum', icon: 'qr', label: t('pay.title'), tint: 'bg-gold-soft', color: '#C89B3C' },
    { key: 'Settings', icon: 'settings', label: t('account.settings'), tint: 'bg-brand-muted', color: '#4B5563' },
  ];

  const bottomPad = 24 + insets.bottom + 56;

  return (
    <SafeAreaView className="flex-1 bg-primary-tint" edges={['top']}>
      {/* Header */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0E7A4A" colors={['#0E7A4A']} />}
      >
        {/* Hero zone: header + reward card in one color-gradient band */}
        <View className="overflow-hidden rounded-b-[36px]">
          <LinearGradient
            colors={['#0B6E43', '#0E7A4A', '#17A86F']}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0.85 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <View className="absolute -top-20 -right-16 w-60 h-60 rounded-full bg-white/6" />
          <View className="absolute top-16 -left-14 w-48 h-48 rounded-full" style={{ backgroundColor: 'rgba(200,155,60,0.15)' }} />
          <View className="absolute bottom-2 right-0 w-44 h-44 rounded-full bg-white/5" />

          {/* Header */}
          <View className="px-5 pt-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="w-11 h-11 rounded-full bg-white/15 border border-white/25 items-center justify-center shadow-sm shadow-black/10">
                  <Text className="text-sm font-extrabold text-white">{initials}</Text>
                </View>
                <View>
                  <Text className="text-xs text-white/70 font-medium">{greeting},</Text>
                  <Text className="text-lg font-extrabold text-white tracking-tight" numberOfLines={1}>{userName}</Text>
                </View>
              </View>
              <View className="flex-row items-center gap-2">
                <TouchableOpacity className="w-10 h-10 rounded-full bg-white/15 border border-white/20 items-center justify-center shadow-sm shadow-black/10" onPress={() => (token ? navigation.navigate('Account') : navigation.navigate('Auth', { screen: 'Login' }))} activeOpacity={0.8}>
                  <Icon name="account" size={18} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  className={`w-10 h-10 rounded-full border items-center justify-center shadow-sm shadow-black/10 ${notifOpen ? 'bg-white/25 border-white/40' : 'bg-white/15 border-white/20'}`}
                  onPress={() => { if (!token) { navigation.navigate('Auth', { screen: 'PhoneLogin' }); return; } toggleNotif(); }}
                  activeOpacity={0.8}>
                  <Icon name="bell" size={18} color="#fff" />
                  {unreadCount > 0 && !notifOpen && (
                    <View className="absolute -top-1 -right-1 min-w-5 h-5 rounded-full bg-[#E5484D] items-center justify-center px-1 border-2 border-white/40">
                      <Text className="text-white text-[10px] font-extrabold">{unreadCount > 99 ? '99+' : unreadCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity className="w-10 h-10 rounded-full bg-white/15 border border-white/20 items-center justify-center shadow-sm shadow-black/10" onPress={() => navigation.navigate('Cart')} activeOpacity={0.8}>
                  <Icon name="cart" size={18} color="#fff" />
                  {itemCount > 0 && (
                    <View className="absolute -top-1 -right-1 min-w-5 h-5 rounded-full bg-white items-center justify-center px-1 border-2 border-white/40">
                      <Text className="text-[#0E7A4A] text-[10px] font-extrabold">{itemCount > 99 ? '99+' : itemCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Hero reward card */}
          <AnimatedView
            style={[heroStyle, { shadowColor: '#000000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 16, elevation: 8 }]}
            className="mx-5 mt-4 mb-6 rounded-[24px]"
          >
            <View className="overflow-hidden rounded-[24px]">
            <LinearGradient
              colors={['#0E7A4A', '#0A5C38', '#06341F']}
              locations={[0, 0.5, 1]}
              start={{ x: 0.1, y: 0 }}
              end={{ x: 0.9, y: 1 }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />
            <View className="absolute -top-14 -left-12 w-44 h-44 rounded-full bg-white/8" />
            <View className="absolute -bottom-20 -right-14 w-56 h-56 rounded-full bg-white/5" />
            <View className="absolute top-6 -right-16 w-52 h-52 rounded-full" style={{ backgroundColor: 'rgba(200,155,60,0.13)' }} />
            <View className="absolute -bottom-24 left-8 w-48 h-48 rounded-full" style={{ backgroundColor: 'rgba(200,155,60,0.08)' }} />
            <View className="absolute top-0 left-2 w-[60px] h-[180px] rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.05)', transform: [{ rotate: '14deg' }] }} />
            <AnimatedView
              className="absolute top-[30px] left-1/2 -ml-[70px] w-[140px] h-[140px] rounded-full"
              style={{ backgroundColor: 'rgba(200,155,60,1)', opacity: heroGlow.interpolate({ inputRange: [0, 1], outputRange: [0.07, 0.16] }) }}
            />

            <View className="p-3.5">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <AnimatedView className="w-8 h-8 rounded-full bg-white/20 items-center justify-center" style={starStyle}>
                    <Icon name="starFill" size={14} color="#FFD9A0" />
                  </AnimatedView>
                  <View>
                    <Text className="text-[8px] font-semibold text-white/70 uppercase tracking-widest">{t('rewards.tier')}</Text>
                    <Text className="text-[13px] font-bold text-white tracking-tight leading-4">
                      {isPlatinum ? 'Platinum' : isGold ? 'Gold' : tierLabel}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => open('Rewards')} activeOpacity={0.8} hitSlop={10} className="flex-row items-center gap-1.5">
                  <Text className="text-[9px] font-semibold text-white/70">{t('common.details')}</Text>
                  <View className="w-6 h-6 rounded-full bg-white/15 items-center justify-center">
                    <Icon name="arrow" size={10} color="#fff" />
                  </View>
                </TouchableOpacity>
              </View>

              <View className="mt-2.5 mb-7 self-center items-center justify-center" style={{ width: 104, height: 104 }}>
                  {(() => {
                    const progress = threshold > 0 ? Math.min(inCycle / threshold, 1) : 0;
                    const sideAngle = progress * Math.PI;
                    const arc = (angle: number, sweep: number, key: string) => {
                      const x = 52 + 41 * Math.sin(angle);
                      const y = 52 - 41 * Math.cos(angle);
                      return (
                        <Path
                          key={key}
                          d={`M 52 93 A 41 41 0 ${Math.abs(Math.PI - angle) > Math.PI ? 1 : 0} ${sweep} ${x} ${y}`}
                          stroke="#C89B3C"
                          strokeWidth={7}
                          strokeLinecap="round"
                          fill="none"
                        />
                      );
                    };
                    return (
                      <Svg width={104} height={104}>
                        <Circle cx={52} cy={52} r={41} stroke="rgba(255,255,255,0.22)" strokeWidth={7} fill="none" />
                        {sideAngle > 0 && arc(Math.PI - sideAngle, 0, 'right')}
                        {sideAngle > 0 && arc(Math.PI + sideAngle, 1, 'left')}
                      </Svg>
                    );
                  })()}
                <AnimatedView className="absolute w-16 h-16 rounded-full overflow-hidden" style={iconTiltStyle}>
                  <Image
                    source={require('../../assets/odulkartıbedavakahve.webp')}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                </AnimatedView>

                {/* Steam wisps rising from the coffee badge */}
                {steamAnims.map((v, i) => (
                  <AnimatedView
                    key={`steam-${i}`}
                    className="absolute w-[10px] h-[16px] rounded-full"
                    style={{
                      left: 40 + i * 9,
                      top: 6,
                      backgroundColor: 'rgba(255,255,255,0.55)',
                      opacity: v.interpolate({ inputRange: [0, 0.2, 0.7, 1], outputRange: [0, 0.5, 0.3, 0] }),
                      transform: [
                        { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -30] }) },
                        { scaleX: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) },
                        { scaleY: v.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.3] }) },
                      ],
                    }}
                  />
                ))}

                {/* Gold sparkles around the ring */}
                {[
                  { x: 91, y: 39 },
                  { x: 76, y: 85 },
                  { x: 28, y: 85 },
                  { x: 13, y: 39 },
                  { x: 52, y: 93 },
                ].map((pos, i) => (
                  <AnimatedView
                    key={`sparkle-${i}`}
                    className="absolute w-[7px] h-[7px] rounded-full"
                    style={{
                      left: pos.x - 3.5,
                      top: pos.y - 3.5,
                      backgroundColor: '#F0C75E',
                      opacity: sparkleAnims[i],
                      transform: [{ scale: sparkleAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.2] }) }],
                      shadowColor: '#F0C75E',
                      shadowOpacity: 0.8,
                      shadowRadius: 4,
                      shadowOffset: { width: 0, height: 0 },
                      elevation: 3,
                    }}
                  />
                ))}

                {/* Comet gliding along the progress arc */}
                {(() => {
                  const mk = (pts: { x: number; y: number }[], size: number, op: number | Animated.AnimatedInterpolation<number>, color: string) => (
                    <AnimatedView
                      className="absolute rounded-full"
                      style={{
                        width: size,
                        height: size,
                        left: -size / 2,
                        top: -size / 2,
                        backgroundColor: color,
                        opacity: op,
                        transform: [
                          { translateX: cometT.interpolate({ inputRange: ORBIT_KEYS, outputRange: pts.map((p) => p.x), extrapolate: 'clamp' }) },
                          { translateY: cometT.interpolate({ inputRange: ORBIT_KEYS, outputRange: pts.map((p) => p.y), extrapolate: 'clamp' }) },
                        ],
                        shadowColor: '#F7D98A',
                        shadowOpacity: 0.9,
                        shadowRadius: 6,
                        shadowOffset: { width: 0, height: 0 },
                        elevation: 4,
                      }}
                    />
                  );
                  return (
                    <>
                      {mk(ORBIT_POINTS(0), 8, cometT.interpolate({ inputRange: [0, 0.05, 0.95, 1], outputRange: [0, 1, 1, 0] }), '#F7D98A')}
                      {mk(ORBIT_POINTS(-0.07), 6, 0.55, '#F0C75E')}
                      {mk(ORBIT_POINTS(-0.14), 4, 0.3, '#F0C75E')}
                    </>
                  );
                })()}

                {/* Espresso drop falling into the cup */}
                <AnimatedView
                  className="absolute"
                  style={{
                    width: 12,
                    height: 16,
                    left: 52 - 6,
                    top: 4,
                    borderRadius: 999,
                    backgroundColor: 'rgba(240,199,94,0.95)',
                    opacity: pourT.interpolate({ inputRange: [0, 0.06, 0.9, 1], outputRange: [0, 0.95, 0.95, 0] }),
                    transform: [
                      { translateY: pourT.interpolate({ inputRange: [0, 1], outputRange: [0, 48] }) },
                      { scaleY: pourT.interpolate({ inputRange: [0, 0.92, 1], outputRange: [1, 1, 0.55] }) },
                    ],
                    shadowColor: '#F0C75E',
                    shadowOpacity: 0.9,
                    shadowRadius: 5,
                    shadowOffset: { width: 0, height: 0 },
                    elevation: 4,
                  }}
                />
                {/* Impact splash around the cup */}
                <AnimatedView
                  className="absolute rounded-full"
                  style={{
                    width: 40,
                    height: 40,
                    left: 52 - 20,
                    top: 52 - 20,
                    borderWidth: 2.5,
                    borderColor: 'rgba(240,199,94,0.9)',
                    opacity: pourT.interpolate({ inputRange: [0.82, 0.9, 1], outputRange: [0, 0.85, 0] }),
                    transform: [{ scale: pourT.interpolate({ inputRange: [0.82, 1], outputRange: [0.3, 1.4] }) }],
                  }}
                />

                {/* Expanding reward burst ring */}
                <AnimatedView
                  className="absolute rounded-full"
                  style={{
                    width: 84,
                    height: 84,
                    left: 52 - 42,
                    top: 52 - 42,
                    borderWidth: 3,
                    borderColor: '#F0C75E',
                    opacity: burstT.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 0.7, 0] }),
                    transform: [{ scale: burstT.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.5] }) }],
                    shadowColor: '#F0C75E',
                    shadowOpacity: 0.8,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 0 },
                    elevation: 5,
                  }}
                />

                <AnimatedView
                  className="absolute left-full ml-3"
                  style={{ top: 29, transform: [{ scale: counterPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] }) }] }}
                >
                  <ReanimatedAnimated.View style={rightSceneDim}>
                    <Text className="text-[46px] font-extrabold text-white leading-none tracking-tight">
                    {inCycle}
                    <Text
                      className="text-[24px] font-extrabold text-gold"
                      style={{ textShadowColor: 'rgba(200,155,60,0.7)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 }}
                    >
                      /{threshold}
                    </Text>
                  </Text>
                  </ReanimatedAnimated.View>
                </AnimatedView>
                <CoffeeStoryRight story={storyT} message={talkMessage} />
                <View className="absolute right-full mr-4 items-end" style={{ width: 185 }}>
                  <ReanimatedAnimated.View style={leftSceneDim}>
                    <Text className="text-[16px] font-semibold text-white/85 tracking-tight leading-5" numberOfLines={1}>
                      {t('home.coffeeEveryPre', { threshold })}
                    </Text>
                    <Text className="mt-1 text-[23px] font-extrabold text-gold tracking-tight leading-7">
                      {t('home.coffeeEveryPost')}
                    </Text>
                  </ReanimatedAnimated.View>
                </View>
              </View>

              <View className="mt-1.5 flex-row items-end">
                <Text className="text-[26px] font-extrabold text-white leading-none">{stars}</Text>
                <Text className="text-[9px] font-semibold text-white/80 ml-2 mb-1">{t('rewards.stars')}</Text>
                <View className="flex-1" />
                <Text className="text-[9px] font-bold text-white/80 mb-1.5">
                  {progress.current}{progress.next > 0 ? ` / ${progress.next}` : ''}
                </Text>
              </View>

              <View className="mt-1.5 h-1 rounded-full bg-white/20 overflow-hidden">
                <AnimatedView className="h-full rounded-full bg-gold" style={progressStyle} />
              </View>
              <View className="mt-1 flex-row items-center justify-between">
                <Text className="text-[9px] font-semibold text-white/70">
                  {isGold || isPlatinum
                    ? <>{stars} <Icon name="starFill" size={10} color="#C89B3C" /> · {isPlatinum ? 'Platinum' : 'Gold'}</>
                    : <>{t('rewards.nextReward')}: {progress.remaining}</>}
                </Text>
                <View className="flex-row items-baseline">
                  <Text className="text-[10px] font-semibold text-white/70">{t('home.freeRight')}</Text>
                  <Text className="text-[17px] font-extrabold text-gold leading-none ml-1.5">{loyalty?.free_balance ?? 0}</Text>
                </View>
              </View>
            </View>

            {/* Breathing gold wash over the whole card */}
            <AnimatedView
              pointerEvents="none"
              className="absolute inset-0"
              style={{ backgroundColor: 'rgba(200,155,60,1)', opacity: cardGlowT.interpolate({ inputRange: [0, 1], outputRange: [0.03, 0.09] }) }}
            />
            {/* Diagonal light sweep */}
            <AnimatedView
              pointerEvents="none"
              className="absolute -top-1/2 -left-1/4 w-[60%] h-[200%]"
              style={{
                backgroundColor: 'rgba(255,255,255,0.9)',
                opacity: shimmerT.interpolate({ inputRange: [0, 0.15, 0.85, 1], outputRange: [0, 0.16, 0.16, 0] }),
                transform: [
                  { rotate: '-18deg' },
                  { translateX: shimmerT.interpolate({ inputRange: [0, 1], outputRange: [-winW * 1.1, winW * 1.3] }) },
                ],
              }}
            />
          </View>
        </AnimatedView>
        </View>

        {/* Wallet strip */}
        <AnimatedView style={walletStyle} className="mx-5 mt-4 flex-row items-center gap-3 rounded-3xl bg-white p-4 shadow-md shadow-black/5">
          <View className="w-12 h-12 rounded-2xl bg-primary-soft items-center justify-center">
            <Icon name="pay" size={22} color="#0E7A4A" />
          </View>
          <View className="flex-1">
            <Text className="text-xs text-ink-muted font-medium">{t('pay.wallet')} · {t('pay.balance')}</Text>
            <Text className="text-xl font-extrabold text-ink tracking-tight">₺{Number(wallet).toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            onPress={() => open('Pay')}
            activeOpacity={0.85}
            style={{
              backgroundColor: '#D4AF37',
              borderRadius: 999,
              paddingVertical: 10,
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 7,
              shadowColor: '#D4AF37',
              shadowOpacity: 0.4,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 3 },
              elevation: 4,
            }}
          >
            <Icon name="plus" size={15} color="#FFFFFF" />
            <Text className="text-[13px] font-extrabold text-white" style={{ textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>
              {t('home.addBalance')}
            </Text>
          </TouchableOpacity>
        </AnimatedView>

        {/* Popular now */}
        {loading ? (
          <View className="mt-6">
            <Skeleton className="mx-5 w-40 h-5 rounded-md bg-brand-muted" />
            <View className="mt-3 flex-row gap-3 px-5">
              <Skeleton className="w-[158px] h-[212px] rounded-3xl bg-brand-muted" />
              <Skeleton className="w-[158px] h-[212px] rounded-3xl bg-brand-muted" />
            </View>
          </View>
        ) : menuItems.length > 0 ? (
          <AnimatedView style={popularStyle} className="mt-6">
            <View className="flex-row items-center justify-between px-5 mb-3">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-xl bg-primary items-center justify-center shadow-md shadow-primary/25 relative overflow-hidden">
                  <View className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-white/20" />
                  <Icon name="fire" size={17} color="#fff" />
                </View>
                <View>
                  <Text className="text-[17px] font-extrabold text-ink tracking-tight leading-6">{t('home.popularTitle')}</Text>
                  <Text className="text-[11px] font-medium text-ink-muted leading-4">{t('home.popularSubtitle')}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => open('Order')} activeOpacity={0.7} className="flex-row items-center gap-1">
                <Text className="text-[12px] font-bold text-primary uppercase tracking-wide">{t('common.seeAll')}</Text>
                <Icon name="arrow" size={11} color="#0E7A4A" />
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
              {menuItems.map((item, idx) => {
                const art = POP_ART[idx % 4];
                const hasImage = !!item.image_url;
                const imgH = Math.round(popularW * 0.98);
                const hasCustom = (item.customization_options || []).length > 0;
                const quickAdd = () => {
                  if (hasCustom) {
                    navigation.navigate('ProductDetail', { item });
                    return;
                  }
                  addItem({ menu_item_id: item.id, item_name: localize(item, 'name'), base_price: parseFloat(item.price) });
                };
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={{ width: popularW }}
                    className="rounded-[24px] bg-white overflow-hidden shadow-md shadow-black/5"
                    onPress={() => navigation.navigate('ProductDetail', { item })}
                    activeOpacity={0.9}
                  >
                    {idx === 0 && (
                      <View className="absolute top-0 left-0 z-20 flex-row items-center gap-1 rounded-br-3xl bg-primary px-2.5 py-1.5">
                        <Icon name="fire" size={11} color="#FFFFFF" />
                        <Text className="text-[9px] font-black text-white uppercase tracking-wide">{t('home.popularBadge')}</Text>
                      </View>
                    )}
                    <View style={{ height: imgH }} className="relative">
                      {hasImage ? (
                        <Image source={{ uri: resolveImageUrl(item.image_url) }} className="w-full h-full" resizeMode="cover" />
                      ) : (
                        <View className="flex-1 items-center justify-center" style={{ backgroundColor: art.tint }}>
                          <View className="w-12 h-12 rounded-2xl bg-white/70 items-center justify-center">
                            <Icon name="coffee" size={26} color={art.color} />
                          </View>
                        </View>
                      )}
                      <View className="absolute top-2 right-2 rounded-full bg-white/90 px-2 py-0.5">
                        <Text className="text-[9px] font-bold text-ink uppercase tracking-wide" numberOfLines={1}>
                          {localize(item, 'category_name')}
                        </Text>
                      </View>
                    </View>
                    <View className="p-3">
                      <Text className="text-[13px] font-bold text-ink leading-4" numberOfLines={2}>{localize(item, 'name')}</Text>
                      <View className="mt-2 flex-row items-center justify-between">
                        <Text className="text-[15px] font-extrabold text-primary">₺{parseFloat(item.price).toFixed(2)}</Text>
                        <TouchableOpacity
                          className="w-7 h-7 rounded-full bg-primary items-center justify-center shadow-md shadow-primary/30"
                          onPress={quickAdd}
                          activeOpacity={0.85}
                        >
                          <Icon name="plus" size={14} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </AnimatedView>
        ) : null}

        {/* Offers */}
        {loading ? (
          <View className="mt-6">
            <Skeleton className="mx-5 w-36 h-5 rounded-md bg-brand-muted" />
            <View className="mt-3 flex-row gap-3 px-5">
              <Skeleton className="w-[260px] h-[170px] rounded-3xl bg-brand-muted" />
              <Skeleton className="w-[260px] h-[170px] rounded-3xl bg-brand-muted" />
            </View>
          </View>
        ) : (
          <AnimatedView style={offersStyle} className="mt-6">
            <View className="flex-row items-center justify-between px-5 mb-3">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-xl bg-gold items-center justify-center shadow-md shadow-gold/25 relative overflow-hidden">
                  <View className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-white/20" />
                  <Icon name="gift" size={17} color="#fff" />
                </View>
                <View>
                  <Text className="text-[17px] font-extrabold text-ink tracking-tight leading-6">{t('home.offersTitle')}</Text>
                  <Text className="text-[11px] font-medium text-ink-muted leading-4">{t('home.offersSubtitle')}</Text>
                </View>
              </View>
              <View className="flex-row items-center gap-1">
                <Text className="text-[12px] font-bold text-primary uppercase tracking-wide">{t('common.seeAll')}</Text>
                <Icon name="arrow" size={11} color="#0E7A4A" />
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}>
              <TouchableOpacity
                key="loyalty-card"
                style={{ width: offerW, height: offerCardH > 0 ? offerCardH : undefined, shadowColor: '#0A5C38', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 }}
                onPress={() => open('Rewards')}
                activeOpacity={0.9}
              >
                <View className="flex-1 rounded-[22px] overflow-hidden">
                  <LinearGradient
                    colors={['#128A55', '#0B6E43', '#06341F']}
                    locations={[0, 0.55, 1]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                  />
                  <View className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-white/8" />
                  <View className="absolute -bottom-14 -left-10 w-32 h-32 rounded-full" style={{ backgroundColor: 'rgba(200,155,60,0.18)' }} />
                  <View className="absolute top-1/2 -right-8 w-24 h-24 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
                  <View className="absolute top-0 left-3 w-[26px] h-[110px] rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.07)', transform: [{ rotate: '14deg' }] }} />

                  <View className="p-3.5 flex-1">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-1.5">
                        <Icon name="coffee" size={12} color="#FFD9A0" />
                        <Text className="text-[10px] font-extrabold text-gold uppercase tracking-widest">{t('home.coffeeCard')}</Text>
                      </View>
                      <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' }}>
                        <Text className="text-[8.5px] font-bold text-white/90 uppercase tracking-wider">{t('rewards.tier')}</Text>
                      </View>
                    </View>

                    <View className="mt-2.5 flex-1 flex-row items-center justify-center">
                      <View className="items-center justify-center" style={{ width: 124, height: 124 }}>
                        <Svg width={124} height={124}>
                          <Circle cx={62} cy={62} r={46} stroke="rgba(255,255,255,0.22)" strokeWidth={7} fill="none" />
                          {(() => {
                            const progress = threshold > 0 ? Math.min(inCycle / threshold, 1) : 0;
                            const sideAngle = progress * Math.PI;
                            const arc = (angle: number, sweep: number, key: string) => {
                              const x = 62 + 46 * Math.sin(angle);
                              const y = 62 - 46 * Math.cos(angle);
                              return (
                                <Path
                                  key={key}
                                  d={`M 62 108 A 46 46 0 ${Math.abs(Math.PI - angle) > Math.PI ? 1 : 0} ${sweep} ${x} ${y}`}
                                  stroke="#C89B3C"
                                  strokeWidth={7}
                                  strokeLinecap="round"
                                  fill="none"
                                />
                              );
                            };
                            return (
                              <>
                                {sideAngle > 0 && arc(Math.PI - sideAngle, 0, 'right')}
                                {sideAngle > 0 && arc(Math.PI + sideAngle, 1, 'left')}
                              </>
                            );
                          })()}
                        </Svg>
                        <View className="absolute inset-0 items-center justify-center">
                          <AnimatedView
                            className="absolute items-center"
                            style={{
                              opacity: coffeeSwapAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
                              transform: [
                                { scale: coffeeSwapAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.6] }) },
                                { translateY: coffeeSwapAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) },
                              ],
                            }}
                          >
                            <Text className="text-[30px] font-extrabold text-white tracking-tight">
                              {inCycle}
                              <Text className="text-[17px] font-bold text-gold">/{threshold}</Text>
                            </Text>
                          </AnimatedView>
                          <AnimatedView
                            className="absolute items-center"
                            style={{
                              opacity: coffeeSwapAnim,
                              transform: [
                                { scale: coffeeSwapAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
                              ],
                            }}
                          >
                            <View
                              className="w-16 h-16 rounded-full overflow-hidden items-center justify-center"
                              style={{ shadowColor: '#D4AF37', shadowOpacity: 0.6, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 6 }}
                            >
                              <Image
                                source={require('../../assets/odulkartıbedavakahve.webp')}
                                className="w-full h-full"
                                resizeMode="cover"
                              />
                            </View>
                          </AnimatedView>
                        </View>
                      </View>

                      <View className="flex-1 ml-4 items-start pr-3">
                        <Text className="text-[13px] font-medium text-white/85 tracking-tight leading-5" numberOfLines={2}>
                          {t('home.coffeeEveryPre', { threshold })}
                        </Text>
                        <Text className="mt-0.5 text-[19px] font-extrabold text-gold tracking-tight leading-6">
                          {t('home.coffeeEveryPost')}
                        </Text>
                        <View
                          className="mt-2 self-start flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
                          style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' }}
                        >
                          <Icon name="coffee" size={12} color="#FFD9A0" />
                          <Text className="text-[12.5px] font-extrabold text-[#FFD9A0] tracking-tight">
                            {remainingToFree > 0 ? t('home.remaining', { n: remainingToFree }) : t('home.freeRight')}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  <View
                    className="flex-row items-center justify-between px-4 py-2"
                    style={{ backgroundColor: 'rgba(255,255,255,0.10)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.14)' }}
                  >
                    <View className="flex-row items-center gap-1.5">
                      <View className="w-6 h-6 rounded-full items-center justify-center" style={{ backgroundColor: '#D4AF37' }}>
                        <Icon name="coffee" size={11} color="#6B4E1B" />
                      </View>
                      <Text className="text-[10px] font-extrabold text-white/85 uppercase tracking-wider">{t('home.freeRight')}</Text>
                    </View>
                    <View className="flex-row items-baseline">
                      <Text className="text-[20px] font-extrabold text-gold tracking-tight leading-none">{freeBalance}</Text>
                      <Text className="text-[9px] font-bold text-white/60 uppercase tracking-widest ml-1">x</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
              {offers.map((offer, i) => {
                const art = OFFER_ART[i % 4];
                return (
                  <TouchableOpacity
                    key={offer.id}
                    style={{ width: offerW, height: offerCardH > 0 ? offerCardH : undefined }}
                    className="rounded-[20px] overflow-hidden shadow-sm shadow-black/5 border border-line/60"
                    onPress={() => open('Rewards')}
                    activeOpacity={0.9}
                    onLayout={(e) => {
                      const h = e.nativeEvent.layout.height;
                      setOfferCardH((prev) => (h > prev ? h : prev));
                    }}
                  >
                    {offer.image_url ? (
                      <Image source={{ uri: resolveImageUrl(offer.image_url) }} className="absolute inset-0 w-full h-full" resizeMode="stretch" />
                    ) : (
                      <View className="absolute inset-0" style={{ backgroundColor: art.tint }} />
                    )}
                    <LinearGradient
                      colors={['rgba(20,12,8,0.28)', 'rgba(20,12,8,0.94)']}
                      locations={[0, 1]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                    />
                    {offer.badge ? (
                      <View className="absolute top-3 left-3 rounded-full bg-white/95 px-2.5 py-1">
                        <Text className="text-[9px] font-extrabold text-ink uppercase tracking-wide">{offer.badge}</Text>
                      </View>
                    ) : null}
                    <View className="absolute top-3 right-3 w-11 h-11 rounded-2xl bg-white/90 items-center justify-center shadow-sm shadow-black/10">
                      <Icon name={art.icon} size={20} color={art.color} />
                    </View>
                    <View className="flex-1 justify-end p-3.5" style={{ minHeight: 205 }}>
                      {Number(offer.discount_value) > 0 && (
                        <View className="self-start mb-1.5 rounded-full px-2.5 py-1" style={{ backgroundColor: '#D4AF37' }}>
                          <Text className="text-[10px] font-extrabold text-[#2D1B16]">
                            {offer.discount_type === 'percent' ? `%${offer.discount_value}` : `₺${Number(offer.discount_value).toFixed(0)}`}
                          </Text>
                        </View>
                      )}
                      <Text className="text-[14px] font-bold text-white leading-5" numberOfLines={2}>{localize(offer, 'title')}</Text>
                      <Text className="text-[11px] text-white/80 mt-1 leading-4" numberOfLines={1}>{localize(offer, 'description')}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </AnimatedView>
        )}

        {/* Quick actions */}
        <AnimatedView style={quickStyle} className="mt-6">
          <Text className="text-lg font-extrabold text-ink tracking-tight px-5 mb-3">{t('home.shortcuts')}</Text>
          <View className="px-5 flex-row gap-3">
            {quickActions.map((a) => (
              <TouchableOpacity key={a.key} className="flex-1 rounded-3xl bg-white p-4 items-center shadow-md shadow-black/5" onPress={() => open(a.key)} activeOpacity={0.85}>
                <View className={`w-12 h-12 rounded-2xl ${a.tint} items-center justify-center mb-2.5`}>
                  <Icon name={a.icon} size={24} color={a.color} />
                </View>
                <Text className="text-xs font-bold text-ink text-center leading-4">{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </AnimatedView>

        {/* Browse CTA */}
        <AnimatedView style={ctaStyle}>
          <TouchableOpacity className="mx-5 mt-6 rounded-3xl p-5 relative overflow-hidden" onPress={() => open('Order')} activeOpacity={0.85} style={{ backgroundColor: '#128A55' }}>
            <View className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/15" />
            <View className="absolute -bottom-8 -left-4 w-24 h-24 rounded-full bg-white/10" />
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-base font-extrabold text-white tracking-tight">{t('home.browseMenu')}</Text>
                <Text className="text-xs text-white/80 mt-1 leading-4">{t('home.browseDesc')}</Text>
              </View>
              <View className="w-12 h-12 rounded-full bg-white items-center justify-center shadow-md shadow-black/20">
                <Icon name="arrow" size={20} color="#0B5E39" style={{ transform: [{ rotate: '180deg' }] }} />
              </View>
            </View>
          </TouchableOpacity>
        </AnimatedView>

        {token && (
          <TouchableOpacity className="items-center py-5" onPress={() => setLogoutOpen(true)} activeOpacity={0.6}>
            <Text className="text-sm font-semibold text-ink-muted">{t('account.logout')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <AlertModal
        visible={logoutOpen}
        title={t('account.logout')}
        message={t('account.logoutConfirm')}
        type="question"
        icon="logout"
        buttons={[
          { text: t('common.cancel'), style: 'cancel', onPress: () => setLogoutOpen(false) },
          {
            text: t('account.logout'),
            style: 'destructive',
            onPress: () => {
              setLogoutOpen(false);
              logout();
            },
          },
        ]}
      />

      {/* Notification dropdown */}
      {notifOpen && (
        <>
          <TouchableOpacity
            className="absolute inset-0 z-40"
            activeOpacity={1}
            onPress={closeNotif}
            style={{ backgroundColor: 'rgba(0,0,0,0.18)' }}
          />
          <View
            className="absolute right-2 z-50 rounded-2xl bg-white overflow-hidden border border-line/60"
            style={{
              top: insets.top + 68,
              width: Math.min(winW - 16, 400),
              maxHeight: 440,
              elevation: 14,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.22,
              shadowRadius: 16,
            }}
          >
            <View className="flex-row items-center justify-between px-4 py-3" style={{ backgroundColor: '#0B6E43' }}>
              <View className="flex-row items-center gap-2">
                <Icon name="bell" size={16} color="#fff" />
                <Text className="text-sm font-extrabold text-white">{t('notification.title')}</Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                {notifs.length > 0 && (
                  <TouchableOpacity className="px-2.5 py-1.5 rounded-full bg-white/15" onPress={deleteAllNotifs} activeOpacity={0.7}>
                    <Text className="text-[11px] font-bold text-white">{t('notification.deleteAll')}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity className="w-7 h-7 rounded-full bg-white/15 items-center justify-center" onPress={closeNotif} activeOpacity={0.7}>
                  <Icon name="close" size={13} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {notifLoading ? (
              <View className="items-center justify-center py-10">
                <ActivityIndicator size="small" color="#0E7A4A" />
                <Text className="mt-2 text-xs text-ink-muted">{t('common.loading')}</Text>
              </View>
            ) : notifs.length === 0 ? (
              <View className="items-center justify-center py-10 px-6">
                <View className="w-12 h-12 rounded-full bg-primary-soft items-center justify-center mb-2">
                  <Icon name="bell" size={22} color="#0E7A4A" />
                </View>
                <Text className="text-sm font-bold text-ink">{t('notification.empty')}</Text>
                <Text className="text-xs text-ink-muted mt-1 text-center leading-4">{t('notification.emptyDesc')}</Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 330 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                {notifs.map((n) => {
                  const meta = NOTIF_META[n.type] || NOTIF_META.system;
                  let title = n.title;
                  if (n.type === 'gift' && n.data?.sender_name && !title.includes(n.data.sender_name)) {
                    title = t('notification.giftTitle', { name: n.data.sender_name });
                  }
                  const body = n.type === 'gift' && n.data?.note ? `“${n.data.note}”` : n.body;
                  return (
                    <View key={n.id} className="flex-row items-center gap-3 px-4 py-3 border-b border-line/40">
                      <View className={`w-9 h-9 rounded-xl ${meta.tint} items-center justify-center`}>
                        <Icon name={meta.icon} size={16} color={meta.color} />
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center justify-between gap-2">
                          <Text className="text-[13px] font-bold text-ink flex-1" numberOfLines={1}>{title}</Text>
                          <Text className="text-[10px] text-ink-muted">{notifTimeAgo(n.created_at, t)}</Text>
                        </View>
                        {!!body && (
                          <Text className="text-[11px] text-ink-muted mt-0.5 leading-4" numberOfLines={2}>{body}</Text>
                        )}
                      </View>
                      <TouchableOpacity className="w-7 h-7 rounded-full bg-brand-muted items-center justify-center" onPress={() => deleteNotif(n.id)} activeOpacity={0.7} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                        <Icon name="trash" size={13} color="#1A1A1A" />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </ScrollView>
            )}

            <TouchableOpacity
              className="py-2.5 items-center border-t border-line/50"
              onPress={() => { closeNotif(); open('Notifications'); }}
              activeOpacity={0.7}>
              <Text className="text-xs font-bold text-primary">{t('notification.seeAll')}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
