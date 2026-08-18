import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useI18n } from '../i18n/I18nContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function SettingsScreen({ navigation }: any) {
  const { t } = useI18n();
  const { user, logout, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [savingName, setSavingName] = useState(false);
  const [showNameForm, setShowNameForm] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [changing, setChanging] = useState(false);
  const [showPwForm, setShowPwForm] = useState(false);

  const handleChangeName = async () => {
    if (!name.trim()) {
      Alert.alert(t('common.error'), t('auth.required'));
      return;
    }
    setSavingName(true);
    try {
      await updateProfile({ name: name.trim() });
      Alert.alert(t('common.ok'), t('settings.nameChanged'));
      setShowNameForm(false);
    } catch (err: any) {
      Alert.alert(t('common.error'), err.response?.data?.message || t('common.error'));
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) {
      Alert.alert(t('common.error'), t('auth.required'));
      return;
    }
    if (newPw !== confirmPw) {
      Alert.alert(t('common.error'), 'Passwords do not match');
      return;
    }
    if (newPw.length < 6) {
      Alert.alert(t('common.error'), t('auth.passwordMin'));
      return;
    }
    setChanging(true);
    try {
      await api.put('/auth/change-password', {
        current_password: currentPw,
        new_password: newPw,
        new_password_confirmation: confirmPw,
      });
      Alert.alert(t('common.ok'), t('settings.passwordChanged'));
      setShowPwForm(false);
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    } catch (err: any) {
      Alert.alert(t('common.error'), err.response?.data?.message || t('settings.passwordError'));
    } finally {
      setChanging(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('settings.logout'),
      t('settings.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.logout'),
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.navigate('MainTabs', { screen: 'Home' });
          },
        },
      ],
    );
  };

  return (
    <ScrollView className="flex-1 bg-primary-soft" contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      {/* Profile card */}
      <View className="items-center bg-white rounded-3xl p-8 mb-6 border border-line shadow-md shadow-black/5">
        <View className="w-20 h-20 rounded-full bg-primary items-center justify-center mb-4 shadow-md shadow-primary/30">
          <Text className="text-3xl font-extrabold text-white">{user?.name?.charAt(0)?.toUpperCase() || '?'}</Text>
        </View>
        <Text className="text-[22px] font-extrabold text-ink mb-1">{user?.name || '—'}</Text>
        <Text className="text-sm text-ink-secondary">{user?.email || '—'}</Text>
      </View>

      <SectionButton icon="✏️" label={t('settings.changeName')} open={showNameForm} onPress={() => setShowNameForm(!showNameForm)} />
      {showNameForm && (
        <View className="bg-white rounded-2xl p-5 mb-2 border border-line">
          <TextInput
            className="bg-brand-soft rounded-2xl px-4 py-3.5 text-sm text-ink mb-3 border border-line"
            value={name}
            onChangeText={setName}
            placeholder={t('settings.name')}
            placeholderTextColor="#9CA3AF"
            autoCapitalize="words"
          />
          <TouchableOpacity className={`bg-primary rounded-2xl py-3.5 items-center shadow-md shadow-primary/30 ${savingName ? 'opacity-60' : ''}`} onPress={handleChangeName} disabled={savingName} activeOpacity={0.9}>
            {savingName ? <ActivityIndicator size="small" color="#fff" /> : <Text className="text-white text-base font-bold">{t('common.save')}</Text>}
          </TouchableOpacity>
        </View>
      )}

      <SectionButton icon="🔒" label={t('settings.changePassword')} open={showPwForm} onPress={() => setShowPwForm(!showPwForm)} />
      {showPwForm && (
        <View className="bg-white rounded-2xl p-5 mb-2 border border-line">
          <PwInput value={currentPw} onChange={setCurrentPw} placeholder={t('settings.currentPassword')} />
          <PwInput value={newPw} onChange={setNewPw} placeholder={t('settings.newPassword')} />
          <PwInput value={confirmPw} onChange={setConfirmPw} placeholder={t('settings.confirmPassword')} />
          <TouchableOpacity className={`bg-primary rounded-2xl py-3.5 items-center shadow-md shadow-primary/30 ${changing ? 'opacity-60' : ''}`} onPress={handleChangePassword} disabled={changing} activeOpacity={0.9}>
            {changing ? <ActivityIndicator size="small" color="#fff" /> : <Text className="text-white text-base font-bold">{t('common.save')}</Text>}
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity className="flex-row items-center bg-white rounded-2xl p-4 mt-4 border border-danger-soft" onPress={handleLogout} activeOpacity={0.7}>
        <Text className="text-lg mr-3">🚪</Text>
        <Text className="text-base font-semibold text-[#CC3333]">{t('settings.logout')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function SectionButton({ icon, label, open, onPress }: any) {
  return (
    <TouchableOpacity className="flex-row items-center bg-white rounded-2xl p-4 mb-2 border border-line shadow-sm shadow-black/5" onPress={onPress} activeOpacity={0.7}>
      <Text className="text-lg mr-3.5">{icon}</Text>
      <Text className="flex-1 text-base font-semibold text-ink">{label}</Text>
      <Text className="text-xs text-ink-muted ml-2">{open ? '▲' : '▼'}</Text>
    </TouchableOpacity>
  );
}

function PwInput({ value, onChange, placeholder }: any) {
  return (
    <TextInput
      className="bg-brand-soft rounded-2xl px-4 py-3.5 text-sm text-ink mb-3 border border-line"
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor="#9CA3AF"
      secureTextEntry
    />
  );
}