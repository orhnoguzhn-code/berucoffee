import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ActivityIndicator, TouchableOpacity,
  ScrollView, RefreshControl, Modal, TextInput, Alert,
} from 'react-native';
import { useI18n } from '../i18n/I18nContext';
import api from '../services/api';

const STATUS_FLOW = ['pending', 'confirmed', 'preparing', 'ready', 'completed'];
const STATUS_LABELS: Record<string, string> = {
  pending: 'checkout.statusPending',
  confirmed: 'checkout.statusConfirmed',
  preparing: 'checkout.statusPreparing',
  ready: 'checkout.statusReady',
  completed: 'checkout.statusCompleted',
};
const STATUS_ICONS: Record<string, string> = {
  pending: '⏳',
  confirmed: '✅',
  preparing: '👨‍🍳',
  ready: '📦',
  completed: '🎉',
};

export default function OrderTrackingScreen({ navigation, route }: any) {
  const { t } = useI18n();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.get('/orders');
      const activeOrders = (res.data.data || []).filter(
        (o: any) => !['completed', 'cancelled'].includes(o.status)
      );
      setOrders(activeOrders);
    } catch (err) {
      console.log('Fetch tracking error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    const reason = cancelReason.trim();
    if (!reason) {
      Alert.alert(t('common.error'), t('auth.required'));
      return;
    }
    setCancelling(true);
    try {
      await api.put(`/orders/${cancelTarget.id}/cancel`, { reason });
      Alert.alert(t('common.ok'), t('orders.cancelSuccess'));
      setCancelTarget(null);
      setCancelReason('');
      fetchOrders();
    } catch (err: any) {
      Alert.alert(t('common.error'), err.response?.data?.message || t('orders.cancelFail'));
    } finally {
      setCancelling(false);
    }
  };

  const getActiveStepIndex = (status: string) => STATUS_FLOW.indexOf(status);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#0E7A4A" />
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-white p-6">
        <Text className="text-5xl mb-4">🎉</Text>
        <Text className="text-lg font-bold text-ink mb-2 text-center">{t('checkout.noActiveOrders')}</Text>
        <Text className="text-sm text-ink-secondary text-center mb-6">{t('checkout.noActiveOrdersDesc')}</Text>
        <TouchableOpacity className="bg-primary rounded-2xl py-3.5 px-8" onPress={() => navigation.navigate('Menu')}>
          <Text className="text-white text-base font-bold">{t('checkout.backToMenu')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0E7A4A" colors={['#0E7A4A']} />}
      >
        {orders.map(order => {
          const activeIdx = getActiveStepIndex(order.status);
          return (
            <View key={order.id} className="bg-white rounded-3xl p-5 mb-4 border border-line shadow-sm shadow-black/10">
              <View className="flex-row justify-between items-center mb-5">
                <Text className="text-lg font-extrabold text-ink">{t('checkout.order')} #{order.id}</Text>
                <Text className="text-sm font-bold text-primary">{t(STATUS_LABELS[order.status] || order.status)}</Text>
              </View>

              <View className="mb-5">
                {STATUS_FLOW.map((s, idx) => {
                  const isActive = idx <= activeIdx;
                  const isCurrent = idx === activeIdx;
                  return (
                    <View key={s} className="flex-row min-h-[48px]">
                      <View className="items-center w-9">
                        <View className={`w-8 h-8 rounded-full items-center justify-center ${isActive ? 'bg-primary' : 'bg-brand-muted'} ${isCurrent ? 'shadow-md shadow-primary/40' : ''}`}>
                          <Text className={`text-sm ${isActive ? 'text-white' : 'text-ink-muted'}`}>{isActive ? STATUS_ICONS[s] : '○'}</Text>
                        </View>
                        {idx < STATUS_FLOW.length - 1 && (
                          <View className={`w-0.5 flex-1 my-0.5 ${isActive ? 'bg-primary' : 'bg-brand-muted'}`} />
                        )}
                      </View>
                      <View className="flex-1 pl-3 pt-1.5">
                        <Text className={`text-sm font-semibold ${isActive ? 'text-ink' : 'text-ink-muted'}`}>{t(STATUS_LABELS[s])}</Text>
                        {isCurrent && order.updated_at && (
                          <Text className="text-xs text-ink-muted mt-0.5">{formatDate(order.updated_at)}</Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>

              <View className="border-t border-line pt-4">
                <Text className="text-xs font-bold text-ink-secondary uppercase tracking-wider mb-2">{t('checkout.items')}</Text>
                {order.items?.map((item: any, idx: number) => (
                  <View key={idx} className="flex-row justify-between py-1">
                    <Text className="text-sm text-ink">{item.quantity}x {item.item_name}</Text>
                    <Text className="text-sm text-primary font-semibold">₺{Number(item.subtotal).toFixed(2)}</Text>
                  </View>
                ))}
                <View className="flex-row justify-between py-2.5 mt-1 border-t border-line">
                  <Text className="text-base font-bold text-ink">{t('checkout.total')}</Text>
                  <Text className="text-lg font-extrabold text-primary">₺{Number(order.total_amount).toFixed(2)}</Text>
                </View>
              </View>

              {['pending', 'confirmed'].includes(order.status) && (
                <TouchableOpacity className="mt-4 items-center py-3 bg-danger-soft rounded-xl border border-danger-soft" onPress={() => { setCancelTarget(order); setCancelReason(''); }} activeOpacity={0.7}>
                  <Text className="text-sm font-bold text-[#DC2626]">{t('orders.cancel')}</Text>
                </TouchableOpacity>
              )}

              {order.status === 'completed' && (
                <TouchableOpacity className="mt-4 bg-brand-muted rounded-xl py-3 items-center" onPress={onRefresh}>
                  <Text className="text-sm font-bold text-primary">{t('checkout.done')}</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={!!cancelTarget} transparent animationType="fade" onRequestClose={() => { setCancelTarget(null); setCancelReason(''); }}>
        <View className="flex-1 justify-center items-center bg-black/50 px-8">
          <View className="bg-white rounded-3xl p-6 w-full max-w-[380px]">
            <Text className="text-xl font-extrabold text-ink mb-1.5">{t('orders.cancel')}</Text>
            <Text className="text-sm text-ink-secondary leading-5 mb-4">{t('orders.cancelConfirm')}</Text>
            <TextInput
              className="bg-brand-soft rounded-2xl p-4 text-sm text-ink min-h-[100px] textAlignVertical-top border border-line mb-5"
              value={cancelReason}
              onChangeText={setCancelReason}
              placeholder={t('orders.cancelReasonPlaceholder')}
              placeholderTextColor="#9CA3AF"
              multiline
              autoFocus
            />
            <View className="flex-row gap-3">
              <TouchableOpacity className="flex-1 py-3.5 rounded-2xl bg-brand-muted items-center" onPress={() => { setCancelTarget(null); setCancelReason(''); }}>
                <Text className="text-sm font-bold text-ink-secondary">{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity className={`flex-1 py-3.5 rounded-2xl bg-[#DC2626] items-center ${cancelling ? 'opacity-60' : ''}`} onPress={handleCancel} disabled={cancelling}>
                {cancelling ? <ActivityIndicator size="small" color="#fff" /> : <Text className="text-sm font-bold text-white">{t('orders.cancel')}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}