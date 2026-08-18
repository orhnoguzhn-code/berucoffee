import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useI18n } from '../i18n/I18nContext';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/ui/Icon';
import Button from '../components/ui/Button';

const Field = ({ children }: { children: React.ReactNode }) => (
  <View className="mb-3">
    <Text className="text-xs font-semibold text-ink-secondary mb-2 uppercase">{children}</Text>
  </View>
);

export default function EditProfileScreen({ navigation }: any) {
  const { t } = useI18n();
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState((user as any)?.phone || '');
  const [birthday, setBirthday] = useState((user as any)?.birthday || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(t('common.error'), t('auth.required'));
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        birthday: birthday || null,
      });
      Alert.alert(t('common.ok'), t('settings.nameChanged'));
      navigation.goBack();
    } catch (err: any) {
      Alert.alert(t('common.error'), err.response?.data?.message || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-white">      <View className="flex-row items-center justify-between px-4 py-2.5">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-9 h-9 rounded-full bg-brand-muted items-center justify-center" activeOpacity={0.7}>
          <Icon name="back" size={18} color="#1A1A1A" />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-ink">{t('account.editProfile')}</Text>
        <View className="w-9" />
      </View>

      <KeyboardAwareScrollView bottomOffset={16} contentContainerStyle={{ padding: 20, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        <View className="w-[84px] h-[84px] rounded-full bg-primary items-center justify-center self-center mb-6">
          <Text className="text-3xl font-extrabold text-white">{(name || 'B').charAt(0).toUpperCase()}</Text>
        </View>

        <Text className="text-xs font-semibold text-ink-secondary mb-2 text-ink-secondary uppercase">{t('settings.name')}</Text>
        <TextInput
          className="bg-brand-soft rounded-xl px-4 h-[52px] text-sm text-ink border border-line mb-3"
          value={name}
          onChangeText={setName}
          placeholder={t('settings.name')}
          placeholderTextColor="#9CA3AF"
          autoCapitalize="words"
        />

        <Text className="text-xs font-semibold text-ink-secondary mb-2 uppercase">{t('checkout.phone')}</Text>
        <TextInput
          className="bg-brand-soft rounded-xl px-4 h-[52px] text-sm text-ink border border-line mb-3"
          value={phone}
          onChangeText={setPhone}
          placeholder={t('checkout.phonePlaceholder')}
          placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad"
        />

        <Text className="text-xs font-semibold text-ink-secondary mb-2 uppercase">🎂 {t('account.editProfile')}</Text>
        <TextInput
          className="bg-brand-soft rounded-xl px-4 h-[52px] text-sm text-ink border border-line mb-3"
          value={birthday}
          onChangeText={setBirthday}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#9CA3AF"
        />

        <Button title={t('common.save')} loading={saving} onPress={handleSave} style={{ marginTop: 24 }} />
      </KeyboardAwareScrollView>
    </View>
  );
}