import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useI18n } from '../i18n/I18nContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import Icon from '../components/ui/Icon';
import Button from '../components/ui/Button';
import AlertModal from '../components/AlertModal';

type Step = 'fulfillment' | 'payment' | 'review';
type Fulfillment = 'pickup' | 'delivery';
type Payment = 'pos' | 'cash' | 'wallet';

interface Store { id: number; name: string; address: string; wifi: boolean; drive_thru: boolean; }
interface Address { id: number; label: string; full_address: string; is_default: boolean; }

const FULFILLMENTS: { key: Fulfillment; icon: string }[] = [
  { key: 'pickup', icon: 'pickup' },
  { key: 'delivery', icon: 'delivery' },
];

export default function CheckoutScreen({ navigation }: any) {
  const { t, language } = useI18n();
  const { token } = useAuth();
  const { items, itemCount, totalAmount, clearCart } = useCart();

  const [step, setStep] = useState<Step>('fulfillment');
  const [fulfillment, setFulfillment] = useState<Fulfillment>('pickup');
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [payment, setPayment] = useState<Payment>('pos');
  const [wallet, setWallet] = useState(0);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [loginModal, setLoginModal] = useState(false);

  const localize = (item: any, field: string) => {
    const suffix = language === 'en' ? '_en' : language === 'de' ? '_de' : language === 'ru' ? '_ru' : '';
    return item[field + suffix] || item[field];
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const storeRes = await api.get('/stores');
      setStores(storeRes.data.data || []);
      setSelectedStore((prev) => prev ?? storeRes.data.data?.[0] ?? null);
      if (token) {
        const [addrRes, profRes] = await Promise.all([
          api.get('/users/addresses'),
          api.get('/users/profile'),
        ]);
        const addrs = addrRes.data.data || [];
        setAddresses(addrs);
        setSelectedAddress((prev) => prev ?? addrs.find((a: Address) => a.is_default) ?? null);
        setWallet(parseFloat(profRes.data.data.wallet_balance) || 0);
      } else {
        setAddresses([]);
        setSelectedAddress(null);
        setWallet(0);
      }
    } catch (err) {
      console.log('Checkout load error:', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => {
    if (fulfillment === 'delivery' && selectedAddress) setStep('payment');
  }, [fulfillment]);

  const canContinue =
    fulfillment === 'pickup' ? !!selectedStore : !!selectedAddress;

  const handlePlaceOrder = async () => {
    if (!canContinue) return;
    if (!token) {
      setLoginModal(true);
      return;
    }
    setPlacing(true);
    try {
      const payload: any = {
        items: items.map((i) => ({
          menu_item_id: i.menu_item_id,
          item_name: i.item_name,
          unit_price: i.unit_price,
          quantity: i.quantity,
          customization: [i.customization, i.note].filter(Boolean).join(' · '),
        })),
        payment_method: payment,
        fulfillment_type: fulfillment,
        store_id: fulfillment === 'pickup' ? selectedStore?.id : null,
        address_id: fulfillment === 'delivery' ? selectedAddress?.id : null,
      };
      await api.post('/orders', payload);
      clearCart();
      navigation.replace('OrderTracking', { fromCheckout: true });
    } catch (err: any) {
      Alert.alert(t('menu.orderErrorTitle'), err.response?.data?.message || t('common.error'));
    } finally {
      setPlacing(false);
    }
  };

  return (
    <View className="flex-1 bg-primary-tint">
      <View className="flex-row items-center justify-between px-4 py-2.5">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm shadow-black/5" activeOpacity={0.7}>
          <Icon name="back" size={18} color="#1A1A1A" />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-ink">{t('checkout.order')}</Text>
        <View className="w-9" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {step === 'fulfillment' && (
          <View>
            <Text className="text-2xl font-extrabold text-ink mb-4">{t('product.chooseStore')}</Text>

            <View className="flex-row bg-brand-soft rounded-full p-1">
              {FULFILLMENTS.map((f) => {
                const active = fulfillment === f.key;
                return (
                  <TouchableOpacity key={f.key} className={`flex-1 flex-row items-center justify-center gap-2 h-12 rounded-full ${active ? 'bg-primary' : ''}`} onPress={() => setFulfillment(f.key)} activeOpacity={0.8}>
                    <Icon name={f.icon} size={20} color={active ? '#fff' : '#4B5563'} />
                    <Text className={`text-sm font-semibold capitalize ${active ? 'text-white' : 'text-ink-secondary'}`}>{f.key}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {fulfillment === 'pickup' ? (
              loading ? (
                <ActivityIndicator color="#0E7A4A" className="mt-6" />
              ) : (
                <>
                  <Text className="text-base font-semibold text-ink mt-5 mb-3">{t('store.title')}</Text>
                  {stores.map((s) => {
                    const active = selectedStore?.id === s.id;
                    return (
                      <TouchableOpacity key={s.id} className={`flex-row items-center bg-white rounded-2xl p-4 mb-3 border-[1.5px] gap-3 ${active ? 'border-primary bg-primary-tint' : 'border-line'}`} onPress={() => setSelectedStore(s)} activeOpacity={0.85}>
                        <View className={`w-10 h-10 rounded-xl items-center justify-center ${active ? 'bg-primary' : 'bg-primary-soft'}`}>
                          <Icon name="store" size={20} color={active ? '#fff' : '#0E7A4A'} />
                        </View>
                        <View className="flex-1">
                          <Text className="text-sm font-semibold text-ink">{localize(s, 'name')}</Text>
                          <Text className="text-xs text-ink-secondary mt-0.5" numberOfLines={1}>{s.address}</Text>
                        </View>
                        {active && <Icon name="check" size={18} color="#0E7A4A" />}
                      </TouchableOpacity>
                    );
                  })}
                </>
              )
            ) : (
              loading ? (
                <ActivityIndicator color="#0E7A4A" className="mt-6" />
              ) : (
                <>
                  <Text className="text-base font-semibold text-ink mt-5 mb-3">{t('checkout.selectAddress')}</Text>
                  {addresses.map((a) => {
                    const active = selectedAddress?.id === a.id;
                    return (
                      <TouchableOpacity key={a.id} className={`flex-row items-center bg-white rounded-2xl p-4 mb-3 border-[1.5px] gap-3 ${active ? 'border-primary bg-primary-tint' : 'border-line'}`} onPress={() => setSelectedAddress(a)} activeOpacity={0.85}>
                        <View className={`w-10 h-10 rounded-xl items-center justify-center ${active ? 'bg-primary' : 'bg-primary-soft'}`}>
                          <Icon name="location" size={20} color={active ? '#fff' : '#0E7A4A'} />
                        </View>
                        <View className="flex-1">
                          <Text className="text-sm font-semibold text-ink">{a.full_address}</Text>
                          <Text className="text-xs text-ink-secondary mt-0.5">{a.label}</Text>
                        </View>
                        {active && <Icon name="check" size={18} color="#0E7A4A" />}
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity className="flex-row items-center justify-center gap-2 py-3 rounded-2xl border-[1.5px] border-dashed border-primary" onPress={() => (token ? navigation.navigate('AddressForm') : setLoginModal(true))} activeOpacity={0.8}>
                    <Icon name="plus" size={18} color="#0E7A4A" />
                    <Text className="text-sm font-semibold text-primary">{t('checkout.addAddress')}</Text>
                  </TouchableOpacity>
                </>
              )
            )}

            <Button title={t('checkout.continue')} style={{ marginTop: 24 }} disabled={!canContinue || loading} onPress={() => setStep('payment')} />
          </View>
        )}

        {step === 'payment' && (
          <View>
            <Text className="text-2xl font-extrabold text-ink mb-4">{t('checkout.payment')}</Text>
            <PaymentOption active={payment === 'pos'} icon="card" title={t('checkout.pos')} desc={t('checkout.posDesc')} onPress={() => setPayment('pos')} />
            <PaymentOption active={payment === 'cash'} icon="cash" title={t('checkout.cash')} desc={t('checkout.cashDesc')} onPress={() => setPayment('cash')} />
            <PaymentOption active={payment === 'wallet'} icon="pay" title={t('pay.wallet')} desc={`${t('pay.balance')}: ₺${wallet.toFixed(2)}`} onPress={() => setPayment('wallet')} />

            <View className="flex-row items-center gap-3 mt-6">
              <TouchableOpacity className="px-4 py-3" onPress={() => setStep('fulfillment')} activeOpacity={0.7}>
                <Text className="text-sm font-semibold text-ink-secondary">{t('common.back')}</Text>
              </TouchableOpacity>
              <Button title={t('checkout.review')} style={{ flex: 1 }} onPress={() => setStep('review')} />
            </View>
          </View>
        )}

        {step === 'review' && (
          <View>
            <Text className="text-2xl font-extrabold text-ink mb-4">{t('checkout.reviewOrder')}</Text>

            <ReviewCard icon={fulfillment === 'pickup' ? 'pickup' : 'delivery'} label={fulfillment} value={fulfillment === 'pickup' ? (selectedStore ? localize(selectedStore, 'name') : '-') : (selectedAddress?.full_address || '-')} />
            <ReviewCard icon="card" label={t('checkout.payment')} value={payment === 'pos' ? t('checkout.pos') : payment === 'cash' ? t('checkout.cash') : t('pay.wallet')} />

            <View className="bg-white rounded-2xl p-4 mb-3 border border-line">
              <View className="flex-row items-center gap-2 mb-1">
                <Icon name="cart" size={16} color="#0E7A4A" />
                <Text className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">{t('checkout.items')}</Text>
              </View>
              {items.map((item, idx) => (
                <View key={idx} className="flex-row justify-between items-center py-1.5">
                  <Text className="text-sm text-ink flex-1 mr-2" numberOfLines={1}>{item.quantity}x {item.item_name}</Text>
                  <Text className="text-sm font-semibold text-primary">₺{(item.unit_price * item.quantity).toFixed(2)}</Text>
                </View>
              ))}
              {items.some((i) => i.customization || i.note) && (
                <Text className="text-xs text-ink-muted mt-2">{t('checkout.itemNotes')}</Text>
              )}
              <View className="flex-row justify-between items-center pt-3 mt-2 border-t-2 border-line">
                <Text className="text-lg font-bold text-ink">{t('checkout.total')}</Text>
                <Text className="text-xl font-extrabold text-primary">₺{totalAmount.toFixed(2)}</Text>
              </View>
            </View>

            <View className="flex-row items-center gap-3 mt-6">
              <TouchableOpacity className="px-4 py-3" onPress={() => setStep('payment')} activeOpacity={0.7}>
                <Text className="text-sm font-semibold text-ink-secondary">{t('common.back')}</Text>
              </TouchableOpacity>
              <Button title={t('checkout.placeOrder')} style={{ flex: 1 }} loading={placing} onPress={handlePlaceOrder} />
            </View>
          </View>
        )}
      </ScrollView>

      <AlertModal
        visible={loginModal}
        title={t('checkout.loginRequired')}
        message={`${t('checkout.loginMsg')}\n\n${itemCount} ${t('cart.items')} · ₺${totalAmount.toFixed(2)}`}
        type="question"
        buttons={[
          { text: t('common.cancel'), style: 'cancel', onPress: () => setLoginModal(false) },
          {
            text: t('auth.loginButton'),
            onPress: () => {
              setLoginModal(false);
              navigation.navigate('Auth', { screen: 'PhoneLogin' });
            },
          },
        ]}
      />
    </View>
  );
}

function PaymentOption({ active, icon, title, desc, onPress }: any) {
  return (
    <TouchableOpacity className={`flex-row items-center bg-white rounded-2xl p-4 mb-3 border-[1.5px] gap-3 ${active ? 'border-primary bg-primary-tint' : 'border-line'}`} onPress={onPress} activeOpacity={0.85}>
      <View className={`w-11 h-11 rounded-full items-center justify-center ${active ? 'bg-primary' : 'bg-primary-soft'}`}>
        <Icon name={icon} size={20} color={active ? '#fff' : '#0E7A4A'} />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-ink">{title}</Text>
        <Text className="text-xs text-ink-secondary mt-0.5">{desc}</Text>
      </View>
      <View className={`w-[22px] h-[22px] rounded-full border-2 items-center justify-center ${active ? 'border-primary' : 'border-line'}`}>
        {active && <View className="w-3 h-3 rounded-full bg-primary" />}
      </View>
    </TouchableOpacity>
  );
}

function ReviewCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View className="bg-white rounded-2xl p-4 mb-3 border border-line">
      <View className="flex-row items-center gap-2 mb-1">
        <Icon name={icon} size={16} color="#0E7A4A" />
        <Text className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">{label}</Text>
      </View>
      <Text className="text-sm text-ink">{value}</Text>
    </View>
  );
}