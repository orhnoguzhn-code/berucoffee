import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';
import { useI18n } from '../i18n/I18nContext';
import api from '../services/api';
import Icon from '../components/ui/Icon';

function timeAgo(iso: string, t: (k: string, p?: any) => string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return t('notification.timeJustNow');
  if (min < 60) return t('notification.timeMin', { n: min });
  const hr = Math.floor(min / 60);
  if (hr < 24) return t('notification.timeHour', { n: hr });
  return t('notification.timeDay', { n: Math.floor(hr / 24) });
}

const TYPE_META: Record<string, { icon: string; tint: string; color: string }> = {
  gift: { icon: 'gift', tint: 'bg-primary-soft', color: '#0E7A4A' },
  admin: { icon: 'megaphone', tint: 'bg-gold-soft', color: '#C89B3C' },
  system: { icon: 'info', tint: 'bg-info-soft', color: '#2563EB' },
};

interface NotificationItem {
  id: number;
  type: string;
  title: string;
  body: string;
  data: { sender_name?: string; note?: string; [k: string]: any };
  is_read: boolean;
  created_at: string;
}

export default function NotificationsScreen({ navigation }: any) {
  const { t } = useI18n();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent?: boolean) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/notifications');
      const list: NotificationItem[] = res.data.data || [];
      setItems(list);
      if (list.some((n) => !n.is_read)) {
        api.put('/notifications/read-all').catch(() => {});
        setItems(list.map((n) => ({ ...n, is_read: true })));
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(false); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  }, [load]);

  const removeItem = useCallback((id: number) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
    api.delete(`/notifications/${id}`).catch(() => {});
  }, []);

  const confirmDelete = useCallback((item: NotificationItem) => {
    Alert.alert(t('notification.title'), t('notification.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => removeItem(item.id) },
    ]);
  }, [t, removeItem]);

  const deleteAll = useCallback(() => {
    Alert.alert(t('notification.title'), t('notification.deleteAllConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => {
        setItems([]);
        api.delete('/notifications').catch(() => {});
      } },
    ]);
  }, [t]);

  const renderRightActions = useCallback((item: NotificationItem) => {
    return (
      <TouchableOpacity
        className="w-20 ml-2 rounded-2xl bg-[#DC2626] items-center justify-center"
        onPress={() => removeItem(item.id)}
        activeOpacity={0.85}>
        <Icon name="trash" size={20} color="#fff" />
        <Text className="text-white text-[11px] font-bold mt-1">{t('common.delete')}</Text>
      </TouchableOpacity>
    );
  }, [t, removeItem]);

  const renderItem = useCallback(({ item }: { item: NotificationItem }) => {
    const meta = TYPE_META[item.type] || TYPE_META.system;
    let title = item.title;
    if (item.type === 'gift' && item.data?.sender_name && !title.includes(item.data.sender_name)) {
      title = t('notification.giftTitle', { name: item.data.sender_name });
    }
    const body = item.type === 'gift' && item.data?.note ? `“${item.data.note}”` : item.body;
    const unread = !item.is_read;

    return (
      <Swipeable renderRightActions={() => renderRightActions(item)} overshootRight={false}>
        <TouchableOpacity
          className={`bg-white rounded-3xl p-4 mb-2.5 shadow-md ${unread ? 'shadow-black/10' : 'shadow-black/5'} border ${unread ? 'border-primary/25' : 'border-transparent'}`}
          activeOpacity={0.8}>
          <View className="flex-row gap-3">
            <View className={`w-11 h-11 rounded-2xl ${meta.tint} items-center justify-center`}>
              <Icon name={meta.icon} size={20} color={meta.color} />
            </View>
            <View className="flex-1">
              <View className="flex-row items-start justify-between gap-2">
                <Text className={`flex-1 text-sm ${unread ? 'font-extrabold text-ink' : 'font-semibold text-ink'}`} numberOfLines={2}>
                  {title}
                </Text>
                <View className="flex-row items-center gap-1.5 mt-0.5">
                  {unread && <View className="w-2 h-2 rounded-full bg-[#E5484D]" />}
                  <Text className="text-[11px] text-ink-muted">{timeAgo(item.created_at, t)}</Text>
                </View>
              </View>
              {!!body && (
                <Text className={`text-xs mt-1.5 leading-5 ${unread ? 'text-ink-secondary' : 'text-ink-muted'}`} numberOfLines={3}>
                  {body}
                </Text>
              )}
            </View>
            <TouchableOpacity className="w-8 h-8 rounded-full bg-brand-muted items-center justify-center mt-0.5" onPress={() => confirmDelete(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} activeOpacity={0.7}>
              <Icon name="trash" size={15} color="#1A1A1A" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  }, [t, confirmDelete, renderRightActions]);

  return (
    <SafeAreaView className="flex-1 bg-primary-tint" edges={['top']}>
      <View className="flex-row items-center justify-between px-4 py-2.5">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-9 h-9 rounded-full bg-brand-muted items-center justify-center" activeOpacity={0.7}>
          <Icon name="back" size={18} color="#1A1A1A" />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-base font-semibold text-ink">{t('notification.title')}</Text>
        </View>
        <TouchableOpacity
          className={`w-9 h-9 rounded-full items-center justify-center ${items.length > 0 ? 'bg-danger-soft' : 'bg-brand-muted opacity-50'}`}
          onPress={deleteAll}
          disabled={items.length === 0}
          activeOpacity={0.7}>
          <Icon name="trash" size={16} color="#DC2626" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0E7A4A" />
          <Text className="mt-3 text-ink-muted text-sm">{t('common.loading')}</Text>
        </View>
      ) : items.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <View className="w-20 h-20 rounded-full bg-primary-soft items-center justify-center mb-4">
            <Icon name="bell" size={34} color="#0E7A4A" />
          </View>
          <Text className="text-base font-bold text-ink mb-1">{t('notification.empty')}</Text>
          <Text className="text-sm text-ink-muted text-center leading-5">{t('notification.emptyDesc')}</Text>
        </View>
      ) : (
        <FlatList
          className="flex-1 px-4 pt-1"
          contentContainerStyle={{ paddingBottom: 32 }}
          data={items}
          keyExtractor={(n) => String(n.id)}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0E7A4A" colors={['#0E7A4A']} />}
        />
      )}
    </SafeAreaView>
  );
}