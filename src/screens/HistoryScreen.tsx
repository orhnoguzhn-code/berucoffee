import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, ActivityIndicator, TouchableOpacity,
  RefreshControl, Modal, TextInput, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useI18n } from '../i18n/I18nContext';
import api from '../services/api';
import Icon from '../components/ui/Icon';
import TransactionDetailSheet from '../components/TransactionDetailSheet';

type Segment = 'transactions' | 'orders';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-warning-soft text-[#92400E]',
  confirmed: 'bg-info-soft text-[#1E40AF]',
  preparing: 'bg-warning-soft text-[#92400E]',
  ready: 'bg-success-soft text-[#065F46]',
  completed: 'bg-brand-muted text-[#374151]',
  cancelled: 'bg-danger-soft text-[#991B1B]',
};

export default function HistoryScreen({ navigation }: any) {
  const { t, language } = useI18n();
  const [segment, setSegment] = useState<Segment>('transactions');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [cancelTarget, setCancelTarget] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any>(null);

  useEffect(() => {
    navigation.setOptions({ title: t('history.title') });
  }, [navigation, t]);

  const fetchData = useCallback(async () => {
    try {
      if (segment === 'transactions') {
        const res = await api.get('/users/transactions');
        setTransactions(res.data.data || []);
      } else {
        const res = await api.get('/orders');
        setOrders(res.data.data || []);
      }
    } catch (err) {
      console.log('Fetch error:', (err as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [segment]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
      const h = date.getHours().toString().padStart(2, '0');
      const m = date.getMinutes().toString().padStart(2, '0');
      return `Bugün ${h}:${m}`;
    }
    if (diffDays === 1) return 'Dün';
    return date.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const handleOrderCancel = async () => {
    if (!cancelTarget) return;
    const reason = cancelReason.trim();
    if (!reason) return;
    setCancelling(true);
    try {
      await api.put(`/orders/${cancelTarget.id}/cancel`, { reason });
      setCancelTarget(null);
      setCancelReason('');
      fetchData();
    } catch (err: any) {
      Alert.alert(t('common.error'), err.response?.data?.message || t('orders.cancelFail'));
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#0E7A4A" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row mx-4 mt-2 mb-1 bg-white rounded-2xl p-1 border border-line">
        <SegmentTab label={t('history.segmentTx')} active={segment === 'transactions'} onPress={() => setSegment('transactions')} />
        <SegmentTab label={t('history.segmentOrders')} active={segment === 'orders'} onPress={() => setSegment('orders')} />
      </View>

      {segment === 'transactions' ? (
        <TransactionsView data={transactions} formatDate={formatDate} onRefresh={onRefresh} refreshing={refreshing} t={t} onSelect={setSelectedTx} />
      ) : (
        <OrdersView data={orders} formatDate={formatDate} onRefresh={fetchData} refreshing={refreshing} t={t} language={language} onCancelOrder={setCancelTarget} />
      )}

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
              <TouchableOpacity className={`flex-1 py-3.5 rounded-2xl bg-[#DC2626] items-center ${cancelling ? 'opacity-60' : ''}`} onPress={handleOrderCancel} disabled={cancelling}>
                {cancelling ? <ActivityIndicator size="small" color="#fff" /> : <Text className="text-sm font-bold text-white">{t('orders.cancel')}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <TransactionDetailSheet tx={selectedTx} onClose={() => setSelectedTx(null)} />
    </View>
  );
}

function SegmentTab({ label, active, onPress }: any) {
  return (
    <TouchableOpacity className={`flex-1 py-2.5 rounded-xl items-center ${active ? 'bg-primary' : ''}`} onPress={onPress} activeOpacity={0.7}>
      <Text className={`text-sm font-semibold ${active ? 'text-white' : 'text-ink-secondary'}`}>{label}</Text>
    </TouchableOpacity>
  );
}

function TransactionsView({ data, formatDate, onRefresh, refreshing, t, onSelect }: any) {
  if (data.length === 0) {
    return <EmptyView icon="📭" title={t('history.empty')} desc={t('history.emptyDesc')} />;
  }

  return (
    <FlatList
      data={data}
      keyExtractor={item => item.id.toString()}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0E7A4A" colors={['#0E7A4A']} />}
      renderItem={({ item }) => {
        const isFree = item.type === 'free';
        const isTopup = item.type === 'topup';
        const isGift = item.type === 'gift';
        return (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onSelect(item)}
            className={`flex-row items-center bg-white my-1 p-4 rounded-2xl border ${isTopup ? 'border-[#F1E5C3]' : 'border-line'} shadow-sm shadow-black/5`}
          >
            <View className={`w-11 h-11 rounded-2xl items-center justify-center mr-3.5 ${isTopup ? 'bg-gold-soft' : isFree ? 'bg-primary-tint' : isGift ? 'bg-primary-tint' : 'bg-brand-soft'}`}>
              <Text className="text-lg">{isTopup ? '💳' : isFree ? '☕' : isGift ? '🎁' : '◆'}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-ink">{isTopup ? t('history.topup') : isFree ? t('history.free') : isGift ? t('history.gift') : t('history.purchase')}</Text>
              {isGift && item.gift_person_name ? (
                <Text className="text-xs font-semibold text-ink-secondary mt-0.5" numberOfLines={1}>
                  {item.gift_direction === 'sent' ? `→ ${t('history.detailTo')}: ` : `← ${t('history.detailFrom')}: `}
                  {item.gift_person_name}
                </Text>
              ) : null}
              {isGift && item.gift_message ? (
                <Text className="text-xs text-ink-muted mt-0.5 italic" numberOfLines={1}>
                  “{item.gift_message}”
                </Text>
              ) : null}
              <Text className="text-xs text-ink-muted mt-0.5">{formatDate(item.created_at)}</Text>
            </View>
            <View className={`rounded-xl px-3 py-1.5 ${isTopup ? 'bg-gold' : isFree ? 'bg-primary' : isGift ? 'bg-primary' : 'bg-primary-dark'}`}>
              <Text className="text-xs font-bold text-white">{isTopup ? `+₺${Number(item.amount || 0).toFixed(0)}` : isFree ? '☕' : isGift ? `₺${Number(item.amount || 0).toFixed(0)}` : '+'}</Text>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}

function OrdersView({ data, formatDate, onRefresh, refreshing, t, language, onCancelOrder }: any) {
  if (data.length === 0) {
    return <EmptyView icon="📋" title={t('menu.noOrders')} desc={t('menu.noOrdersDesc')} />;
  }

  return (
    <FlatList
      data={data}
      keyExtractor={item => item.id.toString()}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0E7A4A" colors={['#0E7A4A']} />}
      renderItem={({ item }) => {
        const st = STATUS_STYLES[item.status] || STATUS_STYLES.pending;
        return (
          <View className="bg-white rounded-2xl p-4 my-1.5 border border-line shadow-sm shadow-black/5">
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
            <Text className="text-[13px] text-ink-secondary mb-2">{item.items?.length || 0} {t('menu.itemsLower')}</Text>
            {item.note ? (
              <View className="mt-2 p-2.5 bg-primary-tint rounded-xl mb-1">
                <Text className="text-[11px] font-bold text-ink-secondary uppercase mb-0.5">{t('menu.note')}:</Text>
                <Text className="text-[13px] text-ink">{item.note}</Text>
              </View>
            ) : null}
            {item.items?.map((oi: any, idx: number) => (
              <View key={idx} className="flex-row justify-between py-1">
                <Text className="text-sm text-ink">{oi.quantity}x {oi.item_name}</Text>
                <Text className="text-sm text-primary font-bold">₺{Number(oi.subtotal).toFixed(2)}</Text>
              </View>
            ))}
            {['pending', 'confirmed'].includes(item.status) && (
              <TouchableOpacity className="mt-3 items-center py-2.5 bg-danger-soft rounded-xl border border-danger-soft" onPress={() => onCancelOrder(item)} activeOpacity={0.7}>
                <Text className="text-sm font-bold text-[#DC2626]">{t('orders.cancel')}</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      }}
    />
  );
}

function EmptyView({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <View className="flex-1 justify-center items-center p-6 bg-white">
      <View className="w-20 h-20 rounded-full bg-white items-center justify-center mb-5 shadow-md shadow-black/10">
        <Text className="text-4xl">{icon}</Text>
      </View>
      <Text className="text-lg font-bold text-ink mb-1.5">{title}</Text>
      <Text className="text-sm text-ink-secondary text-center leading-5 px-5">{desc}</Text>
    </View>
  );
}