import React from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useI18n } from '../i18n/I18nContext';
import { useCart } from '../context/CartContext';
import Icon from '../components/ui/Icon';
import Button from '../components/ui/Button';

export default function CartScreen({ navigation }: any) {
  const { t } = useI18n();
  const { items, itemCount, totalAmount, updateQuantity, removeItem, updateNote, clearCart } = useCart();

  const goShop = () => navigation.navigate('MainTabs', { screen: 'Order' });

  return (
    <View className="flex-1 bg-primary-tint">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-row items-center justify-between px-4 pt-2 pb-1">
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm shadow-black/5"
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Icon name="back" size={18} color="#1A1A1A" />
          </TouchableOpacity>
          <Text className="text-base font-bold text-ink">{t('cart.title')}</Text>
          <View className="w-10" />
        </View>

        {items.length === 0 ? (
          <View className="flex-1 items-center justify-center px-10 -mt-8">
            <View className="w-28 h-28 rounded-[32px] bg-white items-center justify-center shadow-md shadow-black/5 mb-6 overflow-hidden">
              <View className="absolute -top-6 -right-6 w-16 h-16 rounded-full bg-primary-tint" />
              <View className="absolute -bottom-7 -left-7 w-20 h-20 rounded-full bg-gold-soft" />
              <Icon name="cart" size={46} color="#0E7A4A" />
            </View>
            <Text className="text-xl font-bold text-ink text-center">{t('cart.empty')}</Text>
            <Text className="text-sm text-ink-secondary text-center mt-2 leading-6">{t('cart.emptyDesc')}</Text>
            <Button
              title={t('cart.browse')}
              variant="outline"
              size="md"
              style={{ marginTop: 28, minWidth: 224 }}
              icon={<Icon name="coffee" size={18} color="#0E7A4A" />}
              onPress={goShop}
            />
          </View>
        ) : (
          <>
            <FlatList
              data={items}
              keyExtractor={(item) => item.key}
              contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <View className="flex-row items-center justify-between mb-3 px-0.5">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-lg font-bold text-ink tracking-tight">{t('checkout.items')}</Text>
                    <View className="rounded-full bg-white px-2.5 py-0.5 shadow-sm shadow-black/5">
                      <Text className="text-xs font-bold text-primary">{itemCount}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    className="flex-row items-center gap-1.5 py-2"
                    onPress={clearCart}
                    activeOpacity={0.6}
                  >
                    <Icon name="trash" size={15} color="#DC2626" />
                    <Text className="text-sm font-semibold text-danger">{t('cart.clear')}</Text>
                  </TouchableOpacity>
                </View>
              }
              ListFooterComponent={
                <>
                  <View className="rounded-3xl p-4 mb-4 overflow-hidden relative" style={{ backgroundColor: '#0B5E39' }}>
                    <View className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/10" />
                    <View className="absolute -bottom-10 -left-6 w-24 h-24 rounded-full bg-white/5" />
                    <View className="flex-row items-center gap-3">
                      <View className="w-11 h-11 rounded-2xl bg-white/15 items-center justify-center">
                        <Icon name="starFill" size={20} color="#C89B3C" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-white text-sm font-bold leading-5">{t('cart.reward')}</Text>
                        <Text className="text-white/70 text-xs mt-0.5 leading-4">{t('cart.rewardDesc')}</Text>
                      </View>
                    </View>
                  </View>

                  <View className="bg-white rounded-3xl p-5 shadow-md shadow-black/5">
                    <Text className="text-sm font-bold text-ink mb-2">{t('cart.summary')}</Text>
                    <View className="flex-row justify-between items-center py-2">
                      <Text className="text-sm text-ink-secondary">{t('cart.subtotal')}</Text>
                      <Text className="text-sm font-semibold text-ink">₺{totalAmount.toFixed(2)}</Text>
                    </View>
                    <View className="flex-row justify-between items-center py-2">
                      <Text className="text-sm text-ink-secondary">{t('cart.deliveryNote')}</Text>
                      <Text className="text-xs text-ink-muted">{t('cart.atCheckout')}</Text>
                    </View>
                    <View className="flex-row justify-between items-center pt-3 mt-1 border-t-2 border-line">
                      <Text className="text-base font-bold text-ink">{t('checkout.total')}</Text>
                      <Text className="text-xl font-extrabold text-primary tracking-tight">₺{totalAmount.toFixed(2)}</Text>
                    </View>
                  </View>

                  <Button
                    title={t('cart.checkout')}
                    size="xl"
                    style={{ marginTop: 16 }}
                    onPress={() => navigation.navigate('Checkout')}
                  />
                </>
              }
              renderItem={({ item }) => {
                const lineTotal = item.unit_price * item.quantity;
                return (
                  <View className="bg-white rounded-3xl p-4 mb-3 shadow-md shadow-black/5">
                    <View className="flex-row items-center">
                      <View className="w-12 h-12 rounded-2xl bg-primary-soft items-center justify-center mr-3">
                        <Icon name="coffee" size={24} color="#0E7A4A" />
                      </View>
                      <View className="flex-1 mr-2">
                        <Text className="text-[15px] font-semibold text-ink leading-5" numberOfLines={2}>
                          {item.item_name}
                        </Text>
                        {item.customization ? (
                          <Text className="text-xs text-ink-muted mt-0.5 leading-4" numberOfLines={2}>
                            {item.customization}
                          </Text>
                        ) : null}
                      </View>
                      <TouchableOpacity
                        className="w-8 h-8 rounded-full bg-brand-soft items-center justify-center"
                        onPress={() => removeItem(item.key)}
                        activeOpacity={0.7}
                      >
                        <Icon name="x" size={14} color="#9CA3AF" />
                      </TouchableOpacity>
                    </View>

                    <View className="flex-row items-center justify-between mt-4 pt-4 border-t border-line">
                      <View className="flex-row items-center rounded-full bg-brand-soft p-1">
                        <TouchableOpacity
                          className="w-9 h-9 rounded-full bg-white items-center justify-center shadow-sm shadow-black/10"
                          onPress={() => updateQuantity(item.key, -1)}
                          activeOpacity={0.6}
                        >
                          <Icon name="minus" size={16} color="#0E7A4A" />
                        </TouchableOpacity>
                        <Text className="text-sm font-bold text-ink min-w-9 text-center">{item.quantity}</Text>
                        <TouchableOpacity
                          className="w-9 h-9 rounded-full bg-white items-center justify-center shadow-sm shadow-black/10"
                          onPress={() => updateQuantity(item.key, 1)}
                          activeOpacity={0.6}
                        >
                          <Icon name="plus" size={16} color="#0E7A4A" />
                        </TouchableOpacity>
                      </View>
                      <View className="items-end">
                        <Text className="text-[11px] text-ink-muted">₺{item.unit_price.toFixed(2)} × {item.quantity}</Text>
                        <Text className="text-lg font-extrabold text-primary tracking-tight mt-0.5">₺{lineTotal.toFixed(2)}</Text>
                      </View>
                    </View>

                    <View className="flex-row items-center bg-brand-soft rounded-2xl px-3.5 mt-3">
                      <Icon name="edit" size={14} color="#9CA3AF" />
                      <TextInput
                        className="flex-1 text-sm text-ink h-11 ml-2"
                        placeholder={t('cart.notePlaceholder')}
                        placeholderTextColor="#9CA3AF"
                        defaultValue={item.note}
                        onChangeText={(note) => updateNote(item.key, note)}
                      />
                    </View>
                  </View>
                );
              }}
            />
          </>
        )}
      </SafeAreaView>
    </View>
  );
}