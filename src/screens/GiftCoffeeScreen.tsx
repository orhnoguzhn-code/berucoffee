import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useI18n } from '../i18n/I18nContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { normalizeTRPhone } from '../utils/validators';
import Icon from '../components/ui/Icon';
import Button from '../components/ui/Button';

export default function GiftCoffeeScreen({ navigation }: any) {
  const { t, language } = useI18n();
  const { user, loadUser } = useAuth();
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [giftAmount, setGiftAmount] = useState<number>(0);
  const [balance, setBalance] = useState<number>(Number((user as any)?.wallet_balance ?? 0));
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sentGifts, setSentGifts] = useState<any[]>([]);
  const [cancelling, setCancelling] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const [settingsRes, profileRes, giftsRes] = await Promise.all([
        api.get('/settings/public'),
        api.get('/users/profile'),
        api.get('/gift-coffee/mine'),
      ]);
      setGiftAmount(Number(settingsRes.data.data.gift_amount ?? 0));
      setBalance(Number(profileRes.data.data.wallet_balance ?? 0));
      const myId = (user as any)?.id;
      setSentGifts((giftsRes.data.data || []).filter((g: any) => g.sender_id === myId));
    } catch (err) {
      console.log('Gift load error:', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const doCancel = async (gift: any) => {
    setCancelling(gift.id);
    try {
      await api.post(`/gift-coffee/${gift.id}/cancel`);
      setBalance((b) => b + Number(gift.amount || 0));
      Alert.alert(t('gift.cancelSuccess'));
      loadUser();
      load();
    } catch (err: any) {
      Alert.alert(t('common.error'), t('gift.cancelError'));
      load();
    } finally {
      setCancelling(null);
    }
  };

  const handleCancel = (gift: any) => {
    Alert.alert(t('gift.cancel'), t('gift.cancelConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('gift.cancel'), style: 'destructive', onPress: () => doCancel(gift) },
    ]);
  };

  const handleSend = async () => {
    const normalized = normalizeTRPhone(phone);
    if (!normalized) {
      Alert.alert(t('common.error'), t('gift.phoneInvalid'));
      return;
    }
    if ((user as any)?.phone && normalizeTRPhone((user as any).phone) === normalized) {
      Alert.alert(t('common.error'), t('gift.selfSend'));
      return;
    }
    setSending(true);
    try {
      const res = await api.post('/gift-coffee/send', { phone: normalized, message: note.trim() });
      const name = res.data?.data?.recipient_name || '';
      const amount = res.data?.data?.amount ?? giftAmount;
      Alert.alert(t('gift.sendSuccess'), t('gift.sendSuccessMsg', { amount, name }), [
        { text: t('common.ok'), onPress: () => { loadUser(); navigation.goBack(); } },
      ]);
    } catch (err: any) {
      const msg = err.response?.data?.message || '';
      let display = t('common.error');
      if (msg.includes('yetersiz')) display = t('gift.insufficient');
      else if (msg.includes('bulunamadı')) display = t('gift.notUser');
      else if (msg.includes('Kendinize')) display = t('gift.selfSend');
      else if (msg.includes('tanımlanmadı')) display = t('gift.notConfigured');
      else if (msg) display = msg;
      Alert.alert(t('common.error'), display);
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-tint" edges={['top']}>
      <View className="flex-row items-center justify-between px-4 py-2.5">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-9 h-9 rounded-full bg-brand-muted items-center justify-center" activeOpacity={0.7}>
          <Icon name="back" size={18} color="#1A1A1A" />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-ink">{t('gift.coffeeSend')}</Text>
        <View className="w-9" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        {loading ? (
          <View className="flex-1 items-center justify-center py-24">
            <ActivityIndicator size="large" color="#0E7A4A" />
            <Text className="mt-3 text-ink-muted text-sm">{t('common.loading')}</Text>
          </View>
        ) : (
          <>
            <View className="bg-white rounded-3xl p-5 shadow-md shadow-black/5 mb-4">
              <View className="flex-row items-center gap-3">
                <View className="w-12 h-12 rounded-2xl bg-primary-soft items-center justify-center">
                  <Icon name="coffee" size={22} color="#0E7A4A" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-ink-muted">{t('gift.coffeeAmount')}</Text>
                  <Text className="text-2xl font-extrabold text-ink mt-0.5">₺{Number(giftAmount).toFixed(2)}</Text>
                </View>
              </View>
              <Text className="text-xs text-ink-muted mt-3 leading-5">{t('gift.coffeeHint')}</Text>
            </View>

            <View className="flex-row items-center justify-between bg-white rounded-3xl p-4 mb-4 shadow-md shadow-black/5">
              <View className="flex-row items-center gap-3">
                <View className="w-11 h-11 rounded-2xl bg-gold-soft items-center justify-center">
                  <Icon name="pay" size={20} color="#C89B3C" />
                </View>
                <View>
                  <Text className="text-xs text-ink-muted">{t('pay.wallet')} · {t('pay.balance')}</Text>
                  <Text className="text-lg font-extrabold text-ink mt-0.5">₺{balance.toFixed(2)}</Text>
                </View>
              </View>
              <Text className="text-[11px] text-ink-muted">{t('gift.balanceHint')}</Text>
            </View>

            <Text className="text-xs font-semibold text-ink-secondary mb-2 uppercase">{t('gift.phoneLabel')}</Text>
            <TextInput
              className="bg-white rounded-xl px-4 h-[52px] text-sm text-ink border border-line mb-4"
              value={phone}
              onChangeText={setPhone}
              placeholder={t('gift.phonePlaceholder')}
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
            />

            <Text className="text-xs font-semibold text-ink-secondary mb-2 uppercase">{t('gift.noteLabel')}</Text>
            <View className="bg-white rounded-xl border border-line mb-1.5">
              <TextInput
                className="px-4 py-3 text-sm text-ink min-h-[92px]"
                value={note}
                onChangeText={setNote}
                placeholder={t('gift.notePlaceholder')}
                placeholderTextColor="#9CA3AF"
                multiline
                maxLength={200}
                textAlignVertical="top"
              />
            </View>
            <Text className="text-right text-[11px] text-ink-muted mb-6">{note.length}/200</Text>

                        <Button title={t('gift.send')} loading={sending} onPress={handleSend} />

            {sentGifts.length > 0 && (
              <View className="mt-6">
                <Text className="text-xs font-semibold text-ink-secondary mb-2 uppercase">{t('gift.myGifts')}</Text>
                <View className="gap-2.5">
                  {sentGifts.map((g) => {
                    const cancelled = g.status === 'cancelled';
                    const used = g.status === 'used';
                    const badgeBg = cancelled ? '#F5F5F4' : used ? '#F5F5F4' : '#DCF3E6';
                    const badgeColor = cancelled ? '#A8A29E' : used ? '#78716C' : '#0E7A4A';
                    const badgeLabel = cancelled ? t('gift.statusCancelled') : used ? t('gift.statusUsed') : t('gift.statusActive');
                    return (
                      <View
                        key={g.id}
                        className="bg-white rounded-2xl p-3.5 border border-line"
                        style={{ opacity: cancelled ? 0.65 : 1 }}
                      >
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center gap-2.5 flex-1">
                            <View className="w-10 h-10 rounded-2xl bg-gold-soft items-center justify-center">
                              <Icon name="gift" size={18} color="#C89B3C" />
                            </View>
                            <View className="flex-1">
                              <Text className="text-sm font-bold text-ink" numberOfLines={1}>
                                {g.recipient_name || '—'}
                              </Text>
                              <Text className="text-[11px] text-ink-muted mt-0.5">
                                {new Date(g.created_at).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
                                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                                })}
                              </Text>
                            </View>
                          </View>
                          <View className="items-end gap-1">
                            <Text className="text-sm font-extrabold text-ink">₺{Number(g.amount || 0).toFixed(2)}</Text>
                            <View className="rounded-full px-2.5 py-0.5" style={{ backgroundColor: badgeBg }}>
                              <Text className="text-[10px] font-bold" style={{ color: badgeColor }}>{badgeLabel}</Text>
                            </View>
                          </View>
                        </View>
                        {!!g.message && (
                          <Text className="text-[11px] text-ink-muted italic mt-2" numberOfLines={1}>“{g.message}”</Text>
                        )}
                        {!used && !cancelled && (
                          <TouchableOpacity
                            className="mt-2.5 self-start rounded-full px-3.5 py-1.5 flex-row items-center gap-1.5"
                            style={{ backgroundColor: '#FDE5E5' }}
                            onPress={() => handleCancel(g)}
                            disabled={cancelling === g.id}
                            activeOpacity={0.8}
                          >
                            <Icon name="close" size={13} color="#DC2626" />
                            <Text className="text-xs font-bold" style={{ color: '#DC2626' }}>{t('gift.cancel')}</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}