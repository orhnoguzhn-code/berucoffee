import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useI18n } from '../i18n/I18nContext';
import api from '../services/api';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-warning-soft text-[#92400E]',
  confirmed: 'bg-info-soft text-[#1E40AF]',
  preparing: 'bg-warning-soft text-[#92400E]',
  ready: 'bg-success-soft text-[#065F46]',
  completed: 'bg-brand-muted text-[#374151]',
  cancelled: 'bg-danger-soft text-[#991B1B]',
};

export default function MyOrdersScreen() {
  const { t, language } = useI18n();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detail, setDetail] = useState<any>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.get('/orders');
      setOrders(res.data.data || []);
    } catch (err) {
      console.log('Orders fetch error:', (err as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchOrders(); }, [fetchOrders]));

  const onRefresh = () => { setRefreshing(true); fetchOrders(); };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#0E7A4A" />
        <Text className="mt-3 text-ink-muted text-sm">{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <FlatList
        data={orders}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0E7A4A" colors={['#0E7A4A']} />}
        renderItem={({ item }) => {
          const st = STATUS_STYLES[item.status] || STATUS_STYLES.pending;
          const isOpen = detail?.id === item.id;
          return (
            <TouchableOpacity
              className="bg-white rounded-2xl p-4 my-1.5 border border-line shadow-sm shadow-black/5"
              onPress={() => setDetail(isOpen ? null : item)}
              activeOpacity={0.85}
            >
              <View className="flex-row justify-between items-center mb-1.5">
                <View className="flex-row items-center gap-2.5">
                  <Text className="text-base font-extrabold text-ink">#{item.id}</Text>
                  <View className={`px-2.5 py-1 rounded-xl ${st.split(' ')[0]}`}>
                    <Text className={`text-xs font-bold ${st.split(' ')[1]}`}>{t(`orders.status.${item.status}`)}</Text>
                  </View>
                </View>
                <Text className="text-lg font-extrabold text-primary">₺{Number(item.total_amount).toFixed(2)}</Text>
              </View>
              <Text className="text-xs text-ink-muted mb-1">
                {new Date(item.created_at).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
                  day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
                })}
              </Text>
              <Text className="text-[13px] text-ink-secondary">{item.items?.length || 0} {t('menu.itemsLower')}</Text>

              {isOpen && (
                <View className="mt-3">
                  <View className="h-px bg-line mb-3" />
                  {item.items?.map((oi: any, idx: number) => (
                    <View key={idx} className="flex-row justify-between py-1.5">
                      <Text className="text-sm text-ink">{oi.quantity}x {oi.item_name}</Text>
                      <Text className="text-sm text-primary font-bold">₺{Number(oi.subtotal).toFixed(2)}</Text>
                    </View>
                  ))}
                  {item.note ? (
                    <View className="mt-3 p-3 bg-primary-tint rounded-xl">
                      <Text className="text-xs font-bold text-ink-secondary uppercase mb-1">{t('menu.note')}:</Text>
                      <Text className="text-sm text-ink">{item.note}</Text>
                    </View>
                  ) : null}
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View className="items-center pt-20">
            <View className="w-20 h-20 rounded-full bg-white items-center justify-center mb-5 shadow-md shadow-black/10">
              <Text className="text-4xl">📋</Text>
            </View>
            <Text className="text-lg font-bold text-ink mb-1.5">{t('menu.noOrders')}</Text>
            <Text className="text-sm text-ink-secondary text-center leading-5 px-5">{t('menu.noOrdersDesc')}</Text>
          </View>
        }
      />
    </View>
  );
}