import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useI18n } from '../i18n/I18nContext';
import api from '../services/api';

export default function QRScreen() {
  const { t } = useI18n();
  const [qrToken, setQrToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchQrToken = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/users/qr');
      setQrToken(res.data.data.qr_token);
    } catch (err) {
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchQrToken();
  }, [fetchQrToken]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center p-6 bg-primary-soft">
        <View className="bg-white rounded-3xl p-12 items-center w-full max-w-[340px] shadow-lg shadow-black/10">
          <ActivityIndicator size="large" color="#0E7A4A" />
          <Text className="mt-4 text-ink-secondary text-[15px] font-medium">{t('qr.loading')}</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-6 bg-primary-soft">
        <View className="bg-white rounded-3xl p-12 items-center w-full max-w-[340px] shadow-lg shadow-black/10">
          <View className="w-14 h-14 rounded-full bg-danger-soft items-center justify-center mb-4">
            <Text className="text-2xl font-extrabold text-[#C0392B]">!</Text>
          </View>
          <Text className="text-base text-[#C0392B] mb-6 text-center leading-6">{error}</Text>
          <TouchableOpacity className="bg-primary px-8 py-3.5 rounded-2xl" onPress={fetchQrToken} activeOpacity={0.85}>
            <Text className="text-white text-[15px] font-semibold">{t('scan.retry')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center p-6 bg-primary-soft">
      <View className="bg-white rounded-[28px] p-8 items-center w-full max-w-[360px] border border-line shadow-lg shadow-black/10">
        <View className="items-center mb-7">
          <Text className="text-[22px] font-extrabold text-ink tracking-tight">{t('qr.title')}</Text>
          <Text className="text-sm text-ink-secondary mt-1 text-center">{t('qr.subtitle')}</Text>
        </View>

        <View className="bg-white rounded-3xl p-4 border-2 border-line shadow-sm shadow-black/5">
          {qrToken ? (
            <QRCode value={qrToken} size={200} backgroundColor="#fff" color="#1A1A1A" />
          ) : null}
        </View>

        <Text className="mt-6 text-xs text-ink-muted text-center leading-5">{t('qr.hint')}</Text>
      </View>

      <TouchableOpacity className="mt-6 py-3.5 px-8 rounded-2xl bg-primary-soft" onPress={fetchQrToken} activeOpacity={0.7}>
        <Text className="text-primary text-sm font-bold tracking-wide">⟳ {t('qr.refresh')}</Text>
      </TouchableOpacity>
    </View>
  );
}