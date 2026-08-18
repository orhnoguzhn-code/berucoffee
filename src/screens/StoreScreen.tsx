import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useI18n } from '../i18n/I18nContext';
import api from '../services/api';
import Icon from '../components/ui/Icon';

export default function StoreScreen({ navigation }: any) {
  const { t, language } = useI18n();
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const localize = (item: any, field: string) => {
    const suffix = language === 'en' ? '_en' : language === 'de' ? '_de' : language === 'ru' ? '_ru' : '';
    return item[field + suffix] || item[field];
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/stores');
      setStores(res.data.data || []);
    } catch (err) {
      console.log('Store load error:', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#0E7A4A" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="px-4 pt-2 pb-1">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm shadow-black/5"
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Icon name="back" size={18} color="#1A1A1A" />
          </TouchableOpacity>
          <View className="w-10" />
        </View>
        <View className="px-1 pt-2">
          <Text className="text-2xl font-extrabold text-ink">{t('store.title')}</Text>
          <Text className="text-xs text-ink-muted mt-0.5">{t('store.nearby')}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {stores.length === 0 ? (
          <View className="items-center py-20">
            <Icon name="store" size={40} color="#9CA3AF" />
            <Text className="text-sm text-ink-muted mt-3">{t('store.noStores')}</Text>
          </View>
        ) : (
          stores.map((store) => (
            <View key={store.id} className="bg-white rounded-2xl p-4 mb-3 border border-line shadow-sm shadow-black/5">
              <View className="flex-row items-center gap-3">
                <View className="w-12 h-12 rounded-xl bg-primary-soft items-center justify-center">
                  <Icon name="store" size={22} color="#0E7A4A" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-ink">{localize(store, 'name')}</Text>
                  <Text className="text-xs text-ink-secondary mt-0.5" numberOfLines={2}>{store.address}</Text>
                </View>
                <TouchableOpacity className="bg-primary rounded-full px-4 py-2" onPress={() => navigation.navigate('Order')} activeOpacity={0.8}>
                  <Text className="text-white text-[13px] font-bold">{t('store.select')}</Text>
                </TouchableOpacity>
              </View>

              {store.hours && store.hours.length > 0 && (
                <View className="flex-row items-center gap-2 mt-3">
                  <Icon name="clock" size={15} color="#9CA3AF" />
                  <Text className="text-xs text-ink-muted">{t('store.hours')}: {store.hours[0]?.open}–{store.hours[0]?.close}</Text>
                </View>
              )}

              {(store.drive_thru || store.wifi || store.mobile_order) && (
                <View className="flex-row flex-wrap gap-2 mt-3">
                  {store.drive_thru ? <Amenity icon="car" label={t('store.driveThru')} /> : null}
                  {store.wifi ? <Amenity icon="wifi" label={t('store.wifi')} /> : null}
                  {store.mobile_order ? <Amenity icon="order" label={t('store.mobileOrder')} /> : null}
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function Amenity({ icon, label }: { icon: string; label: string }) {
  return (
    <View className="flex-row items-center gap-1 bg-primary-tint rounded-full px-3 py-1.5">
      <Icon name={icon} size={15} color="#0E7A4A" />
      <Text className="text-xs text-primary font-medium">{label}</Text>
    </View>
  );
}