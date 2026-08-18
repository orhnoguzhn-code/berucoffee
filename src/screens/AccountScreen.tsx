import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import api from '../services/api';
import Icon from '../components/ui/Icon';
import LanguageSelector from '../components/LanguageSelector';
import AlertModal from '../components/AlertModal';

function getInitials(name: string): string {
  return name?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

export default function AccountScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const [profile, setProfile] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/users/profile');
      setProfile(res.data.data);
    } catch (err) {
      console.log('Account load error:', (err as Error).message);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const data = profile || user;
  const userName = data?.name || 'Beru';
  const email = data?.email || '';
  const wallet = data?.wallet_balance ?? 0;
  const stars = data?.star_balance ?? 0;
  const lifetime = data?.lifetime_stars ?? 0;
  const tier = lifetime >= 300 ? 'Platinum' : lifetime >= 150 ? 'Gold' : 'Green';

  const rows = [
    { key: 'EditProfile', icon: 'person', label: t('account.editProfile') },
    { key: 'History', icon: 'order', label: t('account.myOrders') },
    { key: 'AddressForm', icon: 'location', label: t('account.addresses') },
    { key: 'Store', icon: 'store', label: t('account.stores') },
    { key: 'Settings', icon: 'settings', label: t('account.settings') },
  ];

  const handleLogout = () => setLogoutOpen(true);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor="#0E7A4A" colors={['#0E7A4A']} />}
      >
        {/* Profile header */}
        <View className="bg-primary-dark rounded-[28px] p-5 mb-4 shadow-lg shadow-black/20">
          <View className="flex-row items-center gap-3">
            <View className="w-[58px] h-[58px] rounded-full bg-white/20 items-center justify-center">
              <Text className="text-[22px] font-extrabold text-white">{getInitials(userName)}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-white">{userName}</Text>
              <Text className="text-xs text-white/80 mt-0.5">{email}</Text>
              <View className={`self-start ${tier === 'Platinum' ? 'bg-[#9AA0A6]' : 'bg-gold'} rounded-full px-3 py-0.5 mt-1.5`}>
                <Text className="text-white text-[11px] font-extrabold uppercase tracking-widest">{tier}</Text>
              </View>
            </View>
            <LanguageSelector />
          </View>
          <View className="flex-row justify-between bg-white/10 rounded-2xl py-3 mt-4">
            <View className="flex-1 items-center">
              <Text className="text-base font-extrabold text-white">₺{Number(wallet).toFixed(2)}</Text>
              <Text className="text-[10px] text-white/80 mt-1 uppercase">{t('pay.wallet')}</Text>
            </View>
            <View className="w-px bg-white/20 self-stretch my-1" />
            <View className="flex-1 items-center">
              <Text className="text-base font-extrabold text-white">{stars} ⭐</Text>
              <Text className="text-[10px] text-white/80 mt-1 uppercase">{t('rewards.stars')}</Text>
            </View>
            <View className="w-px bg-white/20 self-stretch my-1" />
            <View className="flex-1 items-center">
              <Text className="text-base font-extrabold text-white">{tier}</Text>
              <Text className="text-[10px] text-white/80 mt-1 uppercase">{t('rewards.tier')}</Text>
            </View>
          </View>
        </View>

        {/* Menu rows */}
        <View className="bg-white rounded-2xl px-4 border border-line shadow-sm shadow-black/5">
          {rows.map((row, idx) => (
            <React.Fragment key={row.key}>
              <TouchableOpacity className="flex-row items-center py-4 gap-3" onPress={() => navigation.navigate(row.key)} activeOpacity={0.7}>
                <View className="w-10 h-10 rounded-xl bg-primary-soft items-center justify-center">
                  <Icon name={row.icon} size={20} color="#0E7A4A" />
                </View>
                <Text className="flex-1 text-sm font-semibold text-ink">{row.label}</Text>
                <Icon name="arrow" size={18} color="#9CA3AF" />
              </TouchableOpacity>
              {idx < rows.length - 1 && <View className="h-px bg-line" />}
            </React.Fragment>
          ))}
        </View>

        <TouchableOpacity className="flex-row items-center gap-3 p-4 bg-white rounded-2xl mt-3 border border-line shadow-sm shadow-black/5" onPress={() => navigation.navigate('Pay')} activeOpacity={0.8}>
          <View className="w-10 h-10 rounded-xl bg-primary-soft items-center justify-center">
            <Icon name="card" size={20} color="#0E7A4A" />
          </View>
          <Text className="flex-1 text-sm font-semibold text-ink">{t('account.payment')}</Text>
          <Icon name="arrow" size={18} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity className="flex-row items-center justify-center gap-2 py-4 mt-4" onPress={handleLogout} activeOpacity={0.8}>
          <Icon name="logout" size={20} color="#DC2626" />
          <Text className="text-sm font-semibold text-[#DC2626]">{t('account.logout')}</Text>
        </TouchableOpacity>
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
            onPress: async () => {
              setLogoutOpen(false);
              await logout();
              navigation.navigate('Home');
            },
          },
        ]}
      />
    </SafeAreaView>
  );
}