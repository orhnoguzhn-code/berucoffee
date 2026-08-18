import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { Camera } from 'react-native-camera-kit';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import AlertModal, { AlertButton } from '../components/AlertModal';
import api from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FRAME_SIZE = SCREEN_WIDTH * 0.65;

type ModalType = 'free' | 'success' | 'error' | null;

export default function QRScanScreen() {
  const { loadUser } = useAuth();
  const { t } = useI18n();
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const [modal, setModal] = useState<ModalType>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalButtons, setModalButtons] = useState<AlertButton[]>([]);
  const [modalIcon, setModalIcon] = useState('');

  const pendingQr = React.useRef<string | null>(null);

  const showModal = (type: ModalType, title: string, message: string, buttons: AlertButton[], icon = '') => {
    setModal(type);
    setModalTitle(title);
    setModalMessage(message);
    setModalButtons(buttons);
    setModalIcon(icon);
  };

  const closeModal = () => setModal(null);

  const resetScan = () => {
    setScanned(false);
    setProcessing(false);
    pendingQr.current = null;
  };

  const doTransaction = async (type: string) => {
    setProcessing(true);
    try {
      const res = await api.post('/transactions/scan-qr', { qrToken: pendingQr.current, type });
      const updated = res.data.data.user;
      await loadUser();
      setProcessing(false);

      showModal(
        'success',
        t('scan.success'),
        `${type === 'purchase' ? t('scan.successPurchase') : t('scan.successFree')}\n\n☕ ${updated.total_purchases} kahve\n🎁 ${updated.free_balance} bedava hakkı`,
        [{ text: t('common.ok'), onPress: () => { closeModal(); resetScan(); } }],
        type === 'free' ? '☕' : '✓'
      );
    } catch (err: any) {
      setProcessing(false);
      showModal(
        'error',
        t('scan.error'),
        err.response?.data?.message || t('common.error'),
        [{ text: t('scan.retry'), onPress: () => { closeModal(); resetScan(); } }],
        '!'
      );
    }
  };

  const handleReadCode = async (event: any) => {
    const qrToken = event.nativeEvent.codeStringValue;
    if (!qrToken || scanned || processing) return;
    setScanned(true);
    setProcessing(true);
    pendingQr.current = qrToken;

    try {
      const profileRes = await api.get('/users/profile');
      const freeBalance = profileRes.data.data.free_balance || 0;

      if (freeBalance > 0) {
        setProcessing(false);
        showModal(
          'free',
          t('scan.freeTitle'),
          t('scan.freeMessage', { count: freeBalance }),
          [
            {
              text: t('scan.freeNo'),
              style: 'cancel',
              onPress: () => { closeModal(); doTransaction('purchase'); }
            },
            {
              text: t('scan.freeYes'),
              onPress: () => { closeModal(); doTransaction('free'); }
            },
          ],
          '☕'
        );
      } else {
        await doTransaction('purchase');
      }
    } catch (err: any) {
      setProcessing(false);
      showModal(
        'error',
        t('scan.error'),
        err.response?.data?.message || t('common.error'),
        [{ text: t('scan.retry'), onPress: () => { closeModal(); resetScan(); } }],
        '!'
      );
    }
  };

  if (processing) {
    return (
      <View className="flex-1 justify-center items-center p-6 bg-primary-soft">
        <View className="bg-white rounded-3xl p-12 items-center shadow-lg shadow-black/10">
          <ActivityIndicator size="large" color="#0E7A4A" />
          <Text className="mt-5 text-lg text-primary font-bold tracking-tight">{t('scan.processing')}</Text>
          <Text className="mt-1.5 text-sm text-ink-secondary">{t('common.loading')}</Text>
        </View>
      </View>
    );
  }

  if (permissionDenied) {
    return (
      <View className="flex-1 justify-center items-center p-6 bg-primary-soft">
        <View className="w-20 h-20 rounded-full bg-white items-center justify-center mb-5 shadow-md shadow-black/10">
          <Text className="text-4xl">📷</Text>
        </View>
        <Text className="text-[22px] font-bold text-ink mb-2 tracking-tight">{t('scan.permission')}</Text>
        <Text className="text-[15px] text-ink-secondary text-center mb-7 leading-6 px-5">{t('scan.permissionDesc')}</Text>
        <TouchableOpacity className="bg-primary px-8 py-4 rounded-2xl shadow-md shadow-primary/30" onPress={() => {}} activeOpacity={0.85}>
          <Text className="text-white text-base font-bold">{t('scan.allow')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <Camera
        style={{ flex: 1 }}
        scanBarcode={true}
        onReadCode={handleReadCode}
        showFrame={false}
        laserColor="transparent"
        barcodeFrameSize={{ width: FRAME_SIZE, height: FRAME_SIZE }}
        allowedBarcodeTypes={['qr']}
      />

      {/* Overlay */}
      <View className="absolute inset-0 justify-between">
        <View className="items-center pt-14 px-6">
          <Text className="text-[22px] font-bold text-white tracking-tight">{t('scan.title')}</Text>
          <Text className="text-sm text-white/70 mt-1">{t('scan.instruction')}</Text>
        </View>

        <View
          style={{
            position: 'absolute',
            top: SCREEN_WIDTH * 0.18 + 100,
            left: (SCREEN_WIDTH - FRAME_SIZE) / 2,
            width: FRAME_SIZE,
            height: FRAME_SIZE,
          }}
        >
          <Corner className="top-0 left-0 border-t-[4px] border-l-[4px] rounded-tl-[12px]" />
          <Corner className="top-0 right-0 border-t-[4px] border-r-[4px] rounded-tr-[12px]" />
          <Corner className="bottom-0 left-0 border-b-[4px] border-l-[4px] rounded-bl-[12px]" />
          <Corner className="bottom-0 right-0 border-b-[4px] border-r-[4px] rounded-br-[12px]" />
        </View>

        <View className="items-center pb-20">
          <View className="bg-white/15 rounded-[20px] px-6 py-3.5 border border-white/20">
            <Text className="text-white text-[15px] font-medium text-center">{t('scan.instruction')}</Text>
          </View>
        </View>
      </View>

      <AlertModal visible={modal === 'free'} title={modalTitle} message={modalMessage} buttons={modalButtons} icon={modalIcon} type="question" />
      <AlertModal visible={modal === 'success'} title={modalTitle} message={modalMessage} buttons={modalButtons} icon={modalIcon} type="success" />
      <AlertModal visible={modal === 'error'} title={modalTitle} message={modalMessage} buttons={modalButtons} icon={modalIcon} type="error" />
    </View>
  );
}

function Corner({ className }: { className: string }) {
  return <View className={`absolute w-8 h-8 border-[#F5D6A8] ${className}`} />;
}