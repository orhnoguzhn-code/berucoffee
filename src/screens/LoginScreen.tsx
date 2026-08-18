import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Image, ActivityIndicator,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import LanguageSelector from '../components/LanguageSelector';
import AlertModal from '../components/AlertModal';
import Icon from '../components/ui/Icon';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const { t } = useI18n();

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMsg(t('auth.required'));
      setShowError(true);
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      navigation.getParent()?.goBack();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || t('common.error'));
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-primary-soft">
      <KeyboardAwareScrollView
        bottomOffset={16}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        className="px-7 pb-10"
      >
        <View className="items-end pt-12 mb-6">
          <LanguageSelector />
        </View>

        <View className="items-center mb-10">
          <View className="w-24 h-24 rounded-3xl bg-white overflow-hidden items-center justify-center mb-5 shadow-sm shadow-black/10">
            <Image source={require('../../assets/beru-logo.png')} className="w-full h-full" resizeMode="cover" />
          </View>
          <Text className="text-3xl font-extrabold tracking-tight text-ink mb-1.5">{t('app.name')}</Text>
          <Text className="text-sm text-ink-secondary text-center leading-6">{t('app.tagline')}</Text>
        </View>

        <View className="bg-white rounded-3xl p-6 shadow-md shadow-black/10">
          <View className="mb-4">
            <Text className="text-xs font-semibold text-ink-secondary mb-2 tracking-wider uppercase">{t('auth.email')}</Text>
            <View className="flex-row items-center bg-brand-soft rounded-2xl border-[1.5px] border-line px-4">
              <Icon name="mail" size={18} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-3 py-3.5 text-base text-ink"
                placeholder="mail@example.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />
            </View>
          </View>

          <View className="mb-2">
            <Text className="text-xs font-semibold text-ink-secondary mb-2 tracking-wider uppercase">{t('auth.password')}</Text>
            <View className="flex-row items-center bg-brand-soft rounded-2xl border-[1.5px] border-line px-4">
              <Icon name="lock" size={18} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-3 py-3.5 text-base text-ink"
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(p => !p)}>
                <Icon name={showPassword ? 'eyeOff' : 'eye'} size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            className="mt-4 bg-primary rounded-2xl py-4 items-center shadow-md shadow-primary/40 disabled:opacity-70"
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-base font-bold tracking-wide">{t('auth.loginButton')}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('PhoneLogin')} className="mt-3 items-center py-3 rounded-2xl border border-line" activeOpacity={0.7}>
            <Text className="text-primary text-sm font-semibold">{t('phone.subtitle')}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Register')} className="items-center mt-6" activeOpacity={0.7}>
          <Text className="text-ink-secondary text-sm font-medium">{t('auth.noAccount')}</Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>

      <AlertModal
        visible={showError}
        title={t('auth.loginError')}
        message={errorMsg}
        type="error"
        buttons={[{ text: t('common.ok'), onPress: () => setShowError(false) }]}
      />
    </View>
  );
}