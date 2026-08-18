import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, Alert, ScrollView, TextInput, KeyboardAvoidingView, Platform, Keyboard, Animated, Vibration } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { useFocusEffect } from '@react-navigation/native';
import { useI18n } from '../i18n/I18nContext';
import api from '../services/api';
import Icon from '../components/ui/Icon';
import TransactionDetailSheet from '../components/TransactionDetailSheet';

const PRESET_AMOUNTS = [10, 25, 50, 100, 250];
const MIN_AMOUNT = 10;
const MAX_AMOUNT = 500;
const POLL_INTERVAL_MS = 3000;

const ALERT_KINDS: Record<string, { icon: string; bg: string; soft: string }> = {
  purchase: { icon: '🛒', bg: '#0E7A4A', soft: '#DCF3E6' },
  free: { icon: '🎁', bg: '#C89B3C', soft: '#FBF3DC' },
  topup: { icon: '💳', bg: '#0D9488', soft: '#D9F2EE' },
  rejected: { icon: '✖', bg: '#DC2626', soft: '#FDE5E5' },
  expired: { icon: '⏰', bg: '#64748B', soft: '#F1F5F9' },
};

export default function PayScreen({ navigation }: any) {
  const { t, language } = useI18n();
  const [profile, setProfile] = useState<any>(null);
  const [qrToken, setQrToken] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showTopup, setShowTopup] = useState(false);
  const [amount, setAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState('');
  const [creating, setCreating] = useState(false);

  const [topupReq, setTopupReq] = useState<any>(null);
  const [qrTopupVisible, setQrTopupVisible] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const countdownRef = useRef<any>(null);
  const pollRef = useRef<any>(null);
  const [kbHeight, setKbHeight] = useState(0);
  const [qrNotice, setQrNotice] = useState(false);
  const qrTokenRef = useRef('');
  const [scanAlert, setScanAlert] = useState<{
    kind: 'purchase' | 'free' | 'topup' | 'rejected' | 'expired';
    total?: number;
    free?: number;
    amount?: number;
    wallet?: number;
  } | null>(null);
  const seenTxIdRef = useRef<number | null>(null);
  const alertAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) => setKbHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKbHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  useEffect(() => {
    const iv = setInterval(async () => {
      try {
        const res = await api.get('/users/qr');
        const newToken = res.data?.data?.qr_token;
        if (newToken && newToken !== qrTokenRef.current) {
          qrTokenRef.current = newToken;
          setQrToken(newToken);
          setQrNotice(true);
          setTimeout(() => setQrNotice(false), 4000);
        }
      } catch (err) {
        console.log('QR poll error:', (err as Error).message);
      }
    }, 10000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await api.get('/users/transactions');
        const list: any[] = res.data?.data || [];
        if (!list.length) return;
        const maxId = Math.max(...list.map((t: any) => Number(t.id)));
        if (seenTxIdRef.current === null) {
          seenTxIdRef.current = maxId;
          return;
        }
        const fresh = list.find(
          (t: any) =>
            Number(t.id) > (seenTxIdRef.current || 0) &&
            (t.type === 'purchase' || t.type === 'free') &&
            Date.now() - new Date(t.created_at).getTime() < 60000
        );
        if (!fresh) return;
        seenTxIdRef.current = maxId;
        setTransactions(list);
        const prof = await api.get('/users/profile');
        const p = prof.data?.data;
        setProfile(p);
        setScanAlert({ kind: fresh.type, total: p?.total_purchases ?? 0, free: p?.free_balance ?? 0 });
        Vibration.vibrate(120);
      } catch (err) {
        console.log('Tx poll error:', (err as Error).message);
      }
    };
    const iv = setInterval(check, 5000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (!scanAlert) return;
    alertAnim.setValue(0);
    Animated.spring(alertAnim, { toValue: 1, speed: 22, bounciness: 10, useNativeDriver: true }).start();
  }, [scanAlert, alertAnim]);

  const handleRefreshQr = useCallback(async () => {
    try {
      const res = await api.post('/users/qr/rotate');
      const newToken = res.data?.data?.qr_token;
      if (newToken) {
        qrTokenRef.current = newToken;
        setQrToken(newToken);
        setQrNotice(true);
        setTimeout(() => setQrNotice(false), 4000);
      }
    } catch (err) {
      Alert.alert(t('common.error'));
    }
  }, [t]);

  const load = useCallback(async () => {
    try {
      const [profRes, qrRes, txRes] = await Promise.all([
        api.get('/users/profile'),
        api.get('/users/qr'),
        api.get('/users/transactions'),
      ]);
      setProfile(profRes.data.data);
      setQrToken(qrRes.data.data.qr_token);
      qrTokenRef.current = qrRes.data.data.qr_token;
      setTransactions(txRes.data.data || []);
      seenTxIdRef.current = (txRes.data.data || []).length
        ? Math.max(...(txRes.data.data as any[]).map((t: any) => Number(t.id)))
        : null;
    } catch (err) {
      console.log('Pay load error:', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const stopTopupWatchers = useCallback(() => {
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const closeQrTopup = useCallback(() => {
    stopTopupWatchers();
    setQrTopupVisible(false);
    setTopupReq(null);
    setShowTopup(false);
  }, [stopTopupWatchers]);

  const handleCreateQr = async () => {
    const value = customAmount.trim() !== '' ? parseFloat(customAmount.replace(',', '.')) : amount;
    if (isNaN(value) || value < MIN_AMOUNT || value > MAX_AMOUNT) {
      Alert.alert(t('pay.wallet'), t('pay.topupMinMax'));
      return;
    }
    setCreating(true);
    try {
      const res = await api.post('/topup/request', { amount: value });
      const data = res.data.data;
      setTopupReq(data);
      setShowTopup(false);
      setQrTopupVisible(true);
      const totalSecs = Math.max(0, Math.floor((new Date(data.expires_at).getTime() - Date.now()) / 1000));
      setSecondsLeft(totalSecs);

      countdownRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            stopTopupWatchers();
            setQrTopupVisible(false);
            setTopupReq(null);
            setScanAlert({ kind: 'expired' });
            return 0;
          }
          return s - 1;
        });
      }, 1000);

      pollRef.current = setInterval(async () => {
        try {
          const pollRes = await api.get(`/topup/request/${data.token}`);
          const status = pollRes.data.data.status;
          if (status === 'approved') {
            stopTopupWatchers();
            setQrTopupVisible(false);
            setTopupReq(null);
            load();
            try {
              const prof = await api.get('/users/profile');
              setProfile(prof.data?.data);
              setScanAlert({ kind: 'topup', amount: data.amount, wallet: prof.data?.data?.wallet_balance ?? 0 });
            } catch {
              setScanAlert({ kind: 'topup', amount: data.amount, wallet: 0 });
            }
            Vibration.vibrate(120);
          } else if (status === 'rejected') {
            stopTopupWatchers();
            setQrTopupVisible(false);
            setTopupReq(null);
            setScanAlert({ kind: 'rejected' });
            Vibration.vibrate(80);
          } else if (status === 'expired') {
            stopTopupWatchers();
            setQrTopupVisible(false);
            setTopupReq(null);
            setScanAlert({ kind: 'expired' });
          }
        } catch (err) {
          console.log('Topup poll error:', (err as Error).message);
        }
      }, POLL_INTERVAL_MS);
    } catch (err: any) {
      Alert.alert(t('common.error'), err.response?.data?.message || t('common.error'));
    } finally {
      setCreating(false);
    }
  };

  const userName = profile?.name || 'Beru';
  const wallet = profile?.wallet_balance ?? 0;
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  const alertCfg = scanAlert ? ALERT_KINDS[scanAlert.kind] || ALERT_KINDS.topup : null;
  const alertTitle = scanAlert
    ? scanAlert.kind === 'topup' ? t('pay.topupApproved')
      : scanAlert.kind === 'rejected' ? t('pay.topupRejected')
      : scanAlert.kind === 'expired' ? t('pay.alertExpiredTitle')
      : scanAlert.kind === 'free' ? t('pay.scanFreeTitle')
      : t('pay.scanPurchaseTitle')
    : '';
  const alertMsg = scanAlert
    ? scanAlert.kind === 'topup'
      ? t('pay.topupApprovedMsg', { amount: String(scanAlert.amount ?? 0) })
      : scanAlert.kind === 'rejected' ? t('pay.topupRejectedMsg')
      : scanAlert.kind === 'expired' ? t('pay.topupExpired')
      : scanAlert.kind === 'free'
        ? t('pay.scanFreeMsg', { n: scanAlert.free ?? 0 })
        : t('pay.scanPurchaseMsg', { n: scanAlert.total ?? 0 })
    : '';
  const alertChips: { label: string; value: string }[] = scanAlert
    ? scanAlert.kind === 'purchase' || scanAlert.kind === 'free'
      ? [
          { label: t('pay.coffeeTotal'), value: String(scanAlert.total ?? 0) },
          { label: t('pay.freeBalance'), value: String(scanAlert.free ?? 0) },
        ]
      : scanAlert.kind === 'topup'
        ? [
            { label: t('pay.alertAmount'), value: `₺${Number(scanAlert.amount || 0).toFixed(2)}` },
            { label: t('pay.wallet'), value: `₺${Number(scanAlert.wallet || 0).toFixed(2)}` },
          ]
        : []
    : [];

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-primary-tint">
        <ActivityIndicator size="large" color="#0E7A4A" />
        <Text className="mt-3 text-ink-muted text-sm">{t('common.loading')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-primary-tint" edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <View className="mb-4">
          <Text className="text-2xl font-extrabold text-ink">{t('pay.title')}</Text>
          <Text className="text-xs text-ink-muted mt-0.5">{t('pay.subtitle')}</Text>
        </View>

        {/* Pay card */}
        <View className="bg-primary-dark rounded-[28px] p-5 items-center shadow-xl shadow-primary-dark/40 relative overflow-hidden" style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' }}>
          <View className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
          <View className="absolute -bottom-14 -left-8 w-44 h-44 rounded-full bg-white/5" />

          <View className="flex-row justify-between items-center w-full mb-4 z-10">
            <View className="flex-row items-center gap-2">
              <View className="w-9 h-9 rounded-full bg-white/20 items-center justify-center">
                <Icon name="coffee" size={17} color="#FFFFFF" />
              </View>
              <Text className="text-base font-extrabold text-white">Beru Pay</Text>
            </View>
            <Text className="text-[10px] font-bold text-white/60 uppercase tracking-widest">QR</Text>
          </View>

          <View className="bg-white rounded-3xl p-3.5 shadow-lg shadow-black/30 z-10">
            {qrToken ? <QRCode value={qrToken} size={190} backgroundColor="#fff" color="#0B5E39" /> : null}
          </View>

          <View className="w-full mt-4 z-10">
            <TouchableOpacity
              className="self-center flex-row items-center gap-2 bg-white/15 rounded-full px-4 py-2 border border-white/10"
              onPress={() => setShowQrModal(true)}
              activeOpacity={0.85}
            >
              <Icon name="eye" size={15} color="#FFFFFF" />
              <Text className="text-white text-[13px] font-bold">{t('pay.showQr')}</Text>
            </TouchableOpacity>
          </View>

          {qrNotice ? (
            <View className="mt-3 flex-row items-center gap-1.5 bg-gold rounded-full px-3.5 py-1.5 z-10" style={{ shadowColor: '#C9A54A', shadowOpacity: 0.4, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 }}>
              <Icon name="refresh" size={13} color="#FFFFFF" />
              <Text className="text-[11px] font-bold text-white">{t('pay.qrRenewed')}</Text>
            </View>
          ) : null}

          <Text className="text-xs text-white/80 mt-4 z-10">{t('pay.hint')}</Text>

          <View className="flex-row justify-between items-center w-full mt-4 z-10">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-full bg-white items-center justify-center">
                <Text className="text-primary font-extrabold text-base">{userName.charAt(0).toUpperCase()}</Text>
              </View>
              <Text className="text-sm font-semibold text-white" numberOfLines={1}>{userName}</Text>
            </View>
            <TouchableOpacity className="flex-row items-center bg-white/15 rounded-full px-3.5 py-2" onPress={handleRefreshQr} activeOpacity={0.7}>
              <Icon name="refresh" size={15} color="#fff" />
              <Text className="text-white text-[13px] font-bold ml-1.5">{t('pay.refresh')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Wallet */}
        <View className="bg-white rounded-3xl p-4 mt-4 shadow-md shadow-black/5">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="w-12 h-12 rounded-2xl bg-primary-soft items-center justify-center">
                <Icon name="pay" size={22} color="#0E7A4A" />
              </View>
              <View>
                <Text className="text-xs text-ink-muted">{t('pay.wallet')} · {t('pay.balance')}</Text>
                <Text className="text-xl font-extrabold text-ink tracking-tight mt-0.5">₺{Number(wallet).toFixed(2)}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setShowTopup(true)}
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
                {t('pay.topup')}
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            className="mt-3 flex-row items-center justify-center gap-2 bg-gold-soft rounded-2xl py-3.5 border-[1.5px] border-[#ECD9A6]"
            onPress={() => navigation.navigate('GiftCoffee')}
            activeOpacity={0.8}
          >
            <Icon name="gift" size={18} color="#B8860B" />
            <Text className="text-sm font-bold text-[#7A5A00]">{t('gift.sendFriend')}</Text>
          </TouchableOpacity>
        </View>

        {/* Actions */}
        <View className="flex-row gap-3 mt-4">
          <TouchableOpacity
            className="flex-1 bg-white rounded-3xl p-4 items-center shadow-sm shadow-black/5"
            onPress={() => navigation.navigate('QROkut')}
            activeOpacity={0.85}
          >
            <View className="w-12 h-12 rounded-2xl bg-primary-soft items-center justify-center mb-2.5">
              <Icon name="scan" size={22} color="#0E7A4A" />
            </View>
            <Text className="text-sm font-bold text-ink">{t('pay.scan')}</Text>
            <Text className="text-[10px] text-ink-muted text-center mt-0.5 leading-4">{t('pay.scanHint')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 bg-white rounded-3xl p-4 items-center shadow-sm shadow-black/5"
            onPress={() => navigation.navigate('Rewards')}
            activeOpacity={0.85}
          >
            <View className="w-12 h-12 rounded-2xl bg-gold-soft items-center justify-center mb-2.5">
              <Icon name="gift" size={22} color="#C89B3C" />
            </View>
            <Text className="text-sm font-bold text-ink">{t('rewards.gift')}</Text>
          </TouchableOpacity>
        </View>

        {/* Recent transactions */}
        <View className="bg-white rounded-3xl mt-4 p-4 shadow-md shadow-black/5">
          <TouchableOpacity className="flex-row items-center justify-between mb-2" onPress={() => navigation.navigate('History')} activeOpacity={0.7}>
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-xl bg-primary-soft items-center justify-center">
                <Icon name="history" size={16} color="#0E7A4A" />
              </View>
              <Text className="text-base font-bold text-ink">{t('pay.recentTx')}</Text>
            </View>
            <View className="flex-row items-center gap-0.5">
              <Text className="text-xs font-bold text-primary">{t('pay.viewAll')}</Text>
              <Icon name="arrow" size={14} color="#0E7A4A" />
            </View>
          </TouchableOpacity>

          {transactions.length === 0 ? (
            <Text className="text-sm text-ink-muted text-center py-5">{t('pay.txEmpty')}</Text>
          ) : (
            transactions.slice(0, 4).map((item, idx) => {
              const isFree = item.type === 'free';
              const isTopup = item.type === 'topup';
              const isGift = item.type === 'gift';
              const label = isTopup ? t('history.topup') : isFree ? t('history.free') : isGift ? t('history.gift') : t('history.purchase');
              const icon = isTopup ? 'card' : isGift ? 'gift' : isFree ? 'coffee' : 'order';
              const chipBg = isTopup ? 'bg-gold' : 'bg-primary';
              const chipText = isTopup
                ? `+₺${Number(item.amount || 0).toFixed(0)}`
                : isFree ? '☕' : isGift ? `₺${Number(item.amount || 0).toFixed(0)}` : '+';
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.7}
                  onPress={() => setSelectedTx(item)}
                  className={`flex-row items-center py-2.5 ${idx > 0 ? 'border-t border-brand-muted/60' : ''}`}
                >
                  <View className={`w-10 h-10 rounded-2xl items-center justify-center mr-3 ${isTopup ? 'bg-gold-soft' : 'bg-primary-tint'}`}>
                    <Icon name={icon} size={18} color={isTopup ? '#C89B3C' : '#0E7A4A'} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-ink">{label}</Text>
                    {isGift && item.gift_person_name ? (
                      <Text className="text-[11px] font-semibold text-ink-secondary mt-0.5" numberOfLines={1}>
                        {item.gift_direction === 'sent' ? `→ ${t('history.detailTo')}: ` : `← ${t('history.detailFrom')}: `}
                        {item.gift_person_name}
                      </Text>
                    ) : null}
                    {isGift && item.gift_message ? (
                      <Text className="text-[11px] text-ink-muted mt-0.5 italic" numberOfLines={1}>
                        “{item.gift_message}”
                      </Text>
                    ) : null}
                    <Text className="text-[11px] text-ink-muted mt-0.5">
                      {new Date(item.created_at).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <View className={`rounded-xl px-3 py-1.5 ${chipBg}`}>
                    <Text className="text-xs font-bold text-white">{chipText}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* QR content modal */}
      <Modal visible={showQrModal} transparent animationType="fade" onRequestClose={() => setShowQrModal(false)}>
        <View className="flex-1 justify-center px-8 bg-black/60">
          <View className="bg-white rounded-[28px] p-6 shadow-xl shadow-black/30">
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center gap-2.5">
                <View className="w-10 h-10 rounded-2xl bg-primary-soft items-center justify-center">
                  <Icon name="qr" size={19} color="#0E7A4A" />
                </View>
                <View>
                  <Text className="text-lg font-bold text-ink">{t('pay.showQr')}</Text>
                  <Text className="text-xs text-ink-muted">{t('pay.hint')}</Text>
                </View>
              </View>
              <TouchableOpacity className="w-9 h-9 rounded-full bg-brand-soft items-center justify-center" onPress={() => setShowQrModal(false)} activeOpacity={0.7}>
                <Icon name="close" size={16} color="#4B5563" />
              </TouchableOpacity>
            </View>
            <View className="bg-primary-tint rounded-2xl px-5 py-5" style={{ borderWidth: 1, borderColor: '#E4F3EC' }}>
              <Text className="text-lg font-bold text-ink text-center leading-7 tracking-widest" selectable>
                {qrToken}
              </Text>
            </View>
          </View>
        </View>
      </Modal>

{/* Top-up modal */}
        <Modal visible={showTopup} transparent animationType="slide" onRequestClose={() => setShowTopup(false)}>
          <KeyboardAvoidingView className="flex-1 justify-end" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View className="flex-1 bg-black/55" style={{ paddingBottom: Platform.OS === 'android' ? kbHeight : 0 }}>
              <TouchableOpacity className="flex-1" activeOpacity={1} onPress={() => setShowTopup(false)} />
              <View className="bg-white rounded-t-[28px] pb-6">
                <View className="w-10 h-1 rounded bg-brand-muted self-center mt-3 mb-2" />

                <View className="flex-row items-center gap-3 px-6 pt-2">
                  <View className="w-11 h-11 rounded-2xl bg-primary-soft items-center justify-center">
                    <Icon name="pay" size={20} color="#0E7A4A" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-extrabold text-ink tracking-tight">{t('pay.topup')}</Text>
                    <Text className="text-xs text-ink-muted mt-0.5 leading-4">{t('pay.topupHint')}</Text>
                  </View>
                  <TouchableOpacity className="w-9 h-9 rounded-full bg-brand-soft items-center justify-center" onPress={() => setShowTopup(false)} activeOpacity={0.7}>
                    <Icon name="close" size={16} color="#4B5563" />
                  </TouchableOpacity>
                </View>

                <View className="mx-6 mt-4 bg-primary-tint rounded-2xl px-4 py-3 flex-row items-center justify-between" style={{ borderWidth: 1, borderColor: '#DCEFE6' }}>
                  <Text className="text-[13px] font-semibold text-ink-secondary">{t('pay.currentBalance')}</Text>
                  <Text className="text-lg font-extrabold text-ink tabular-nums">₺{Number(wallet).toFixed(2)}</Text>
                </View>

                <Text className="text-xs font-semibold text-ink-secondary uppercase tracking-wide px-6 mt-5 mb-2.5">{t('pay.amountLabel')}</Text>
                <View className="flex-row gap-2 px-6">
                  {PRESET_AMOUNTS.map((a) => {
                    const selected = amount === a;
                    return (
                      <TouchableOpacity
                        key={a}
                        className={`flex-1 h-12 rounded-2xl items-center justify-center border ${selected ? 'bg-primary border-primary' : 'bg-white border-line'}`}
                        style={selected ? { shadowColor: '#0E7A4A', shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 } : undefined}
                        onPress={() => { setAmount(a); setCustomAmount(''); }}
                        activeOpacity={0.85}
                      >
                        <Text className={`text-sm font-extrabold ${selected ? 'text-white' : 'text-ink-secondary'}`}>₺{a}</Text>
                        {selected ? <Icon name="check" size={13} color="#FFFFFF" style={{ marginTop: 1 }} /> : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View className="mx-6 mt-3 h-[52px] flex-row items-center rounded-2xl bg-brand-soft border border-line px-4">
                  <Text className="text-base font-extrabold text-ink-muted mr-2">₺</Text>
                  <TextInput
                    className="flex-1 text-base font-bold text-ink tracking-tight"
                    placeholder={`${t('pay.topupCustom')} (₺${MIN_AMOUNT}–₺${MAX_AMOUNT})`}
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={customAmount}
                    onChangeText={(v) => { setCustomAmount(v); setAmount(0); }}
                  />
                </View>

                <TouchableOpacity
                  className="mx-6 mt-5 h-[54px] rounded-full bg-primary items-center justify-center flex-row gap-2"
                  style={{ shadowColor: '#0E7A4A', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 }}
                  onPress={handleCreateQr}
                  disabled={creating}
                  activeOpacity={0.85}
                >
                  {creating ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Icon name="qr" size={18} color="#FFFFFF" />
                      <Text className="text-base font-extrabold text-white tracking-tight">{t('pay.topupCreateQr')}</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity className="mt-3 mx-6 h-[46px] rounded-full bg-[#DC2626] items-center justify-center" onPress={() => setShowTopup(false)} activeOpacity={0.85}>
                  <Text className="text-sm font-bold text-white">{t('common.cancel')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

      {/* Top-up QR modal */}
      <Modal visible={qrTopupVisible} transparent animationType="fade" onRequestClose={closeQrTopup}>
        <View className="flex-1 justify-center px-8 bg-black/60">
          <View className="bg-white rounded-[28px] p-6 shadow-xl shadow-black/30">
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center gap-2.5">
                <View className="w-10 h-10 rounded-2xl bg-primary-soft items-center justify-center">
                  <Icon name="qr" size={19} color="#0E7A4A" />
                </View>
                <View>
                  <Text className="text-lg font-bold text-ink">{t('pay.topupQrTitle')}</Text>
                  <Text className="text-xs text-ink-muted">₺{topupReq?.amount}</Text>
                </View>
              </View>
              <TouchableOpacity className="w-9 h-9 rounded-full bg-brand-soft items-center justify-center" onPress={closeQrTopup} activeOpacity={0.7}>
                <Icon name="close" size={16} color="#4B5563" />
              </TouchableOpacity>
            </View>

            <View className="bg-white rounded-3xl p-3.5 self-center shadow-md shadow-black/10" style={{ borderWidth: 1, borderColor: '#E4F3EC' }}>
              {topupReq?.token ? <QRCode value={topupReq.token} size={200} backgroundColor="#fff" color="#0B5E39" /> : null}
            </View>

            <View className="mt-4 bg-primary-tint rounded-2xl px-4 py-3 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View className="w-7 h-7 rounded-full bg-white items-center justify-center">
                  <ActivityIndicator size="small" color="#0E7A4A" />
                </View>
                <Text className="text-sm font-bold text-primary">{t('pay.topupWaiting')}</Text>
              </View>
              <Text className="text-sm font-extrabold text-primary tabular-nums">{mm}:{ss}</Text>
            </View>

            <Text className="text-xs text-ink-muted text-center mt-3">{t('pay.topupQrHint')}</Text>
            <TouchableOpacity className="py-3 items-center mt-1" onPress={closeQrTopup} activeOpacity={0.7}>
              <Text className="text-sm font-semibold text-ink-muted">{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={!!scanAlert} transparent animationType="fade" onRequestClose={() => setScanAlert(null)}>
        <View className="flex-1 items-center justify-center px-8 bg-black/60">
          <Animated.View
            style={{
              width: '100%', maxWidth: 340,
              opacity: alertAnim,
              transform: [{ scale: alertAnim.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] }) }],
            }}
          >
            <View className="bg-white rounded-[28px] pt-7 pb-6 px-6 items-center overflow-hidden" style={{ shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 10 }}>
              <View className="absolute top-0 h-1.5 rounded-b-full" style={{ width: 72, backgroundColor: alertCfg?.bg }} />

              <View className="w-24 h-24 rounded-full items-center justify-center" style={{ backgroundColor: alertCfg?.soft }}>
                <View className="w-16 h-16 rounded-full items-center justify-center" style={{ backgroundColor: alertCfg?.bg }}>
                  <Text className="text-[30px]">{alertCfg?.icon}</Text>
                </View>
              </View>

              <Text className="text-xl font-extrabold text-ink text-center mt-4">{alertTitle}</Text>
              {!!alertMsg && (
                <Text className="text-sm text-ink-muted text-center mt-2 leading-5">{alertMsg}</Text>
              )}

              {alertChips.length > 0 && (
                <View className="flex-row gap-2.5 mt-4 w-full">
                  {alertChips.map((chip) => (
                    <View key={chip.label} className="flex-1 rounded-2xl px-3 py-3 items-center bg-brand-soft" style={{ borderWidth: 1, borderColor: '#EDE8DE' }}>
                      <Text className="text-lg font-extrabold text-ink">{chip.value}</Text>
                      <Text className="text-[11px] text-ink-muted font-semibold mt-0.5">{chip.label}</Text>
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity
                className="mt-5 w-full h-[50px] rounded-full items-center justify-center"
                style={{ backgroundColor: alertCfg?.bg }}
                onPress={() => setScanAlert(null)}
                activeOpacity={0.85}
              >
                <Text className="text-white font-bold">{t('common.ok')}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      <TransactionDetailSheet tx={selectedTx} onClose={() => setSelectedTx(null)} />
    </SafeAreaView>
  );
}