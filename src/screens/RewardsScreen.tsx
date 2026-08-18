import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useI18n } from '../i18n/I18nContext';
import api from '../services/api';
import Icon from '../components/ui/Icon';
import Button from '../components/ui/Button';

export default function RewardsScreen({ navigation }: any) {
  const { t, language } = useI18n();
  const [loyalty, setLoyalty] = useState<any>(null);
  const [giftCards, setGiftCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<number | null>(null);

  const localize = (item: any, field: string) => {
    const suffix = language === 'en' ? '_en' : language === 'de' ? '_de' : language === 'ru' ? '_ru' : '';
    return item[field + suffix] || item[field];
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [loyRes, giftRes] = await Promise.all([
        api.get('/loyalty/status'),
        api.get('/gift-cards'),
      ]);
      setLoyalty(loyRes.data.data);
      setGiftCards(giftRes.data.data || []);
    } catch (err) {
      console.log('Rewards load error:', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleRedeem = async (rewardId: number, starsCost: number) => {
    setRedeeming(rewardId);
    try {
      await api.post('/rewards/redeem', { reward_id: rewardId });
      Alert.alert(t('rewards.title'), `-${starsCost} ⭐`);
      load();
    } catch (err: any) {
      Alert.alert(t('common.error'), err.response?.data?.message || t('common.error'));
    } finally {
      setRedeeming(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#0E7A4A" />
      </SafeAreaView>
    );
  }

  const stars = loyalty?.stars ?? 0;
  const tier = loyalty?.tier ?? 'green';
  const isGold = tier === 'gold';
  const isPlatinum = tier === 'platinum';
  const tierCardBg = isPlatinum ? 'bg-[#3E4A52]' : isGold ? 'bg-gold' : 'bg-primary-dark';
  const tierName = isPlatinum ? 'Beru Platinum' : isGold ? 'Beru Gold' : 'Beru Green';
  const progress = loyalty?.tier_progress || { current: 0, next: 150, percent: 0, remaining: 150 };
  const rewards = loyalty?.rewards || [];
  const redeemable = loyalty?.redeemable || [];

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <View className="mb-4">
          <Text className="text-2xl font-extrabold text-ink">{t('rewards.title')}</Text>
          <Text className="text-xs text-ink-muted mt-0.5">{t('rewards.subtitle')}</Text>
        </View>

        {/* Tier card */}
        <View className="relative">
          <View className="absolute inset-0 rounded-[28px] bg-black/25 translate-y-1.5" />
          <View className={`relative rounded-[28px] p-5 shadow-lg shadow-black/20 overflow-hidden ${tierCardBg}`}>
            <View className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
            <View className="absolute -bottom-16 -left-10 w-44 h-44 rounded-full bg-white/5" />
            <View className="absolute -top-1/2 -left-1/4 w-[75%] h-[200%] bg-white/10 rotate-[18deg]" />
            <View className="absolute top-5 right-16">
              <Icon name="starFill" size={10} color="#FFFFFF" style={{ opacity: 0.35 }} />
            </View>
            <View className="absolute bottom-16 right-8">
              <Icon name="starFill" size={7} color="#FFFFFF" style={{ opacity: 0.25 }} />
            </View>

            <View className="flex-row justify-between items-start">
              <View>
                <Text className="text-[10px] text-white/90 uppercase tracking-widest">{t('rewards.tier')}</Text>
                <Text className="text-lg font-bold text-white mt-1" style={{ textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>
                  {tierName}
                </Text>
              </View>
              <View className="w-12 h-12 rounded-full bg-white items-center justify-center shadow-md shadow-black/30">
                <View className={`w-9 h-9 rounded-full items-center justify-center ${isGold ? 'bg-gold-soft' : 'bg-gold-soft'}`}>
                  <Icon name="starFill" size={20} color="#C89B3C" />
                </View>
              </View>
            </View>

            <View className="flex-row items-baseline mt-5">
              <Text className="text-4xl font-extrabold text-white" style={{ textShadowColor: 'rgba(0,0,0,0.25)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 }}>
                {stars}
              </Text>
              <Text className="text-sm text-white/90 ml-2" style={{ textShadowColor: 'rgba(0,0,0,0.25)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>
                {t('rewards.stars')}
              </Text>
            </View>

            <View className="mt-4">
              <View className="flex-row justify-between mb-1.5">
                <Text className="text-xs text-white/90">
                  {isGold || isPlatinum ? `${isPlatinum ? 'Platinum' : 'Gold'} · ${stars} ⭐` : `${t('rewards.nextReward')}: ${progress.remaining} ⭐`}
                </Text>
                <Text className="text-xs text-white/90 font-bold">{progress.current}{progress.next > 0 ? ` / ${progress.next}` : ''}</Text>
              </View>
              <View className="h-2.5 bg-black/25 rounded-full overflow-hidden shadow-inner">
                <View className="h-full rounded-full bg-gold shadow-sm shadow-black/40" style={{ width: `${Math.min(progress.percent, 100)}%` }} />
              </View>
            </View>
          </View>
        </View>

        {loyalty?.free_balance > 0 && (
          <View className="flex-row items-center gap-2 bg-primary-tint rounded-2xl p-4 mt-4">
            <Icon name="coffee" size={20} color="#0E7A4A" />
            <Text className="text-sm font-semibold text-primary">{t('home.freeRight')}: {loyalty.free_balance}</Text>
          </View>
        )}

        <Text className="text-lg font-bold text-ink mt-5 mb-3">{t('rewards.catalog')}</Text>
        {rewards.length === 0 ? (
          <View className="items-center py-12">
            <Icon name="star" size={36} color="#9CA3AF" />
            <Text className="text-sm text-ink-muted mt-3">{t('rewards.empty')}</Text>
          </View>
        ) : (
          rewards.map((reward: any) => {
            const canRedeem = redeemable.some((r: any) => r.id === reward.id);
            return (
              <View key={reward.id} className="flex-row items-center bg-white rounded-2xl p-4 mb-3 border border-line gap-3 shadow-sm shadow-black/5">
                <View className="w-11 h-11 rounded-xl bg-primary-soft items-center justify-center">
                  <Icon name="coffee" size={22} color="#0E7A4A" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-ink">{localize(reward, 'title')}</Text>
                  {reward.description ? <Text className="text-xs text-ink-secondary mt-0.5" numberOfLines={1}>{localize(reward, 'description')}</Text> : null}
                </View>
                <Button
                  title={`${reward.stars_cost} ⭐`}
                  size="sm"
                  variant={canRedeem ? 'primary' : 'outline'}
                  style={{ width: 96 }}
                  disabled={!canRedeem}
                  loading={redeeming === reward.id}
                  onPress={() => handleRedeem(reward.id, reward.stars_cost)}
                />
              </View>
            );
          })
        )}

        <View className="flex-row justify-between items-center">
          <Text className="text-lg font-bold text-ink mt-5 mb-3">{t('rewards.gift')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Account')} activeOpacity={0.7}>
            <Text className="text-sm font-semibold text-primary mt-5 mb-3">{t('common.seeAll')}</Text>
          </TouchableOpacity>
        </View>
        {giftCards.length === 0 ? (
          <View className="items-center py-10">
            <Icon name="gift" size={36} color="#9CA3AF" />
            <Text className="text-sm text-ink-muted mt-3">{t('gift.empty')}</Text>
          </View>
        ) : (
          giftCards.map((card: any) => (
            <View key={card.id} className="flex-row items-center justify-between bg-gold-soft rounded-2xl p-4 mb-3 border border-gold">
              <View>
                <Text className="text-xs text-ink-secondary">{t('gift.balance')}</Text>
                <Text className="text-lg font-extrabold text-gold mt-0.5">₺{Number(card.balance).toFixed(2)}</Text>
              </View>
              <Text className="text-[11px] text-gold tracking-widest font-semibold">{card.code}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}