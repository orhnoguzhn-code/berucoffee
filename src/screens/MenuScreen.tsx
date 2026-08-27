import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, Image, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useI18n } from '../i18n/I18nContext';
import { useCart } from '../context/CartContext';
import api, { resolveImageUrl } from '../services/api';
import Icon from '../components/ui/Icon';
import { colors } from '../theme';

export default function MenuScreen({ navigation }: any) {
  const { t, language } = useI18n();
  const { items, itemCount, totalAmount, addItem, updateQuantity } = useCart();
  const [categories, setCategories] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const localize = useCallback((item: any, field: string) => {
    const suffix = language === 'en' ? '_en' : language === 'de' ? '_de' : language === 'ru' ? '_ru' : '';
    return item[field + suffix] || item[field] || '';
  }, [language]);

  const fetchMenu = useCallback(async () => {
    setLoading(true);
    try {
      const [categoryResponse, itemResponse] = await Promise.all([
        api.get('/menu/categories'),
        api.get('/menu/items'),
      ]);
      const nextCategories = categoryResponse.data.data || [];
      setCategories(nextCategories);
      setMenuItems(itemResponse.data.data || []);
      setActiveCat((previous) => previous ?? (nextCategories[0]?.id ?? null));
    } catch (error: any) {
      console.warn('Menü yüklenemedi:', error?.message || error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void fetchMenu();
  }, [fetchMenu]));

  const activeCategory = useMemo(() => categories.find((category) => category.id === activeCat), [categories, activeCat]);
  const countFor = useCallback((categoryId: number) => menuItems.filter((item) => item.category_id === categoryId).length, [menuItems]);
  const isDrinkCategory = useCallback((category: any) => {
    const name = localize(category, 'name').toUpperCase();
    return name.includes('İÇECEK') || name.includes('DRINK') || name.includes('GETRÄNK') || name.includes('НАПИТК');
  }, [localize]);

  const filtered = useMemo(() => {
    const byCategory = menuItems.filter((item) => item.category_id === activeCat);
    const query = search.trim().toLocaleLowerCase(language === 'tr' ? 'tr-TR' : language);
    return query ? byCategory.filter((item) => localize(item, 'name').toLocaleLowerCase(language === 'tr' ? 'tr-TR' : language).includes(query)) : byCategory;
  }, [menuItems, activeCat, search, language, localize]);

  const quickAdd = useCallback((item: any) => {
    addItem({
      menu_item_id: item.id,
      item_name: localize(item, 'name'),
      base_price: Number(item.price) || 0,
    });
  }, [addItem, localize]);

  const inCartQty = useCallback((id: number) => {
    const entry = items.find((item) => item.menu_item_id === id && !item.customization);
    return entry ? { key: entry.key, qty: entry.quantity } : null;
  }, [items]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-3 text-ink-muted text-sm">{t('common.loading')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="px-5 pt-4 flex-row items-center">
        <View className="flex-1">
          <Text className="text-2xl font-extrabold text-ink">{t('menu.title')}</Text>
          <Text className="text-xs text-ink-muted mt-0.5">{t('menu.subtitle')}</Text>
        </View>
        <TouchableOpacity
          className="w-11 h-11 rounded-full bg-primary-soft items-center justify-center"
          onPress={() => navigation.navigate('Cart')}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`${t('menu.viewCart')}${itemCount > 0 ? `, ${itemCount} ürün` : ''}`}
        >
          <Icon name="cart" size={20} color={colors.primary} />
          {itemCount > 0 && (
            <View className="absolute -top-1 -right-1 min-w-5 h-5 rounded-full bg-primary items-center justify-center px-1 border-2 border-white">
              <Text className="text-white text-[10px] font-extrabold">{itemCount > 99 ? '99+' : itemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center bg-white rounded-2xl h-12 mt-4 mx-4 px-4 shadow-sm shadow-black/5 border border-line">
        <Icon name="search" size={17} color={colors.textMuted} />
        <TextInput
          className="flex-1 text-sm text-ink ml-2 py-0"
          value={search}
          onChangeText={setSearch}
          placeholder={t('menu.search')}
          placeholderTextColor={colors.textMuted}
          returnKeyType="search"
          accessibilityLabel={t('menu.search')}
        />
        {search ? (
          <TouchableOpacity
            className="w-7 h-7 rounded-full bg-primary-soft items-center justify-center"
            onPress={() => setSearch('')}
            accessibilityRole="button"
            accessibilityLabel="Aramayı temizle"
          >
            <Icon name="close" size={12} color={colors.primary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {categories.length > 0 && (
        <View className="flex-row flex-wrap gap-3 px-4 mt-4">
          {categories.map((category: any) => {
            const isActive = category.id === activeCat;
            const categoryName = localize(category, 'name');
            return (
              <TouchableOpacity
                key={category.id}
                onPress={() => setActiveCat(category.id)}
                style={{ width: '48%' }}
                className={`flex-row items-center gap-3 rounded-3xl p-3.5 border-[1.5px] ${isActive ? 'bg-primary border-primary-dark shadow-lg shadow-primary/30' : 'bg-white border-line shadow-sm shadow-black/5'}`}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={`${categoryName}, ${countFor(category.id)} ${t('menu.itemsLower')}`}
                accessibilityState={{ selected: isActive }}
              >
                <View className={`w-12 h-12 rounded-2xl items-center justify-center ${isActive ? 'bg-white/20' : 'bg-primary-soft'}`}>
                  <Icon name={isDrinkCategory(category) ? 'cup' : 'utensils'} size={24} color={isActive ? colors.white : colors.primary} />
                </View>
                <View className="flex-1">
                  <Text className={`text-[15px] font-bold leading-5 ${isActive ? 'text-white' : 'text-ink'}`} numberOfLines={1}>
                    {categoryName}
                  </Text>
                  <Text className={`text-xs font-medium mt-0.5 ${isActive ? 'text-white/70' : 'text-ink-muted'}`}>
                    {countFor(category.id)} {t('menu.itemsLower')}
                  </Text>
                </View>
                {isActive && (
                  <View className="w-5 h-5 rounded-full bg-white items-center justify-center">
                    <Icon name="check" size={12} color={colors.primary} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 110 }}
        columnWrapperStyle={{ gap: 12 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews
        ListHeaderComponent={
          <View className="mb-3">
            <Text className="text-lg font-extrabold text-ink tracking-tight">
              {localize(activeCategory || {}, 'name')}
              <Text className="text-sm font-semibold text-ink-muted"> · {filtered.length} {t('menu.itemsLower')}</Text>
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const entry = inCartQty(item.id);
          const price = Number(item.price) || 0;
          const itemName = localize(item, 'name');
          return (
            <TouchableOpacity
              className="flex-1 bg-white rounded-3xl p-3.5 mb-3 border border-line shadow-sm shadow-black/5"
              onPress={() => navigation.navigate('ProductDetail', { item })}
              activeOpacity={0.9}
              accessibilityRole="button"
              accessibilityLabel={`${itemName}, ${price.toFixed(2)} Türk lirası`}
              accessibilityHint="Ürün detayını açar"
            >
              <View className="relative h-24 rounded-2xl overflow-hidden bg-primary-soft items-center justify-center mb-3">
                {item.image_url ? (
                  <Image
                    source={{ uri: resolveImageUrl(item.image_url) }}
                    className="absolute inset-0 w-full h-full"
                    resizeMode="cover"
                    accessibilityIgnoresInvertColors
                    accessible
                    accessibilityLabel={itemName}
                  />
                ) : (
                  <>
                    <View className="absolute -top-6 -right-6 w-16 h-16 rounded-full bg-white/60" />
                    <View className="absolute -bottom-7 -left-7 w-20 h-20 rounded-full bg-white/30" />
                    <Icon name="coffee" size={34} color={colors.primary} />
                  </>
                )}
              </View>
              <Text className="text-sm font-bold text-ink leading-5" numberOfLines={2}>{itemName}</Text>
              {item.description ? (
                <Text className="text-[11px] text-ink-muted leading-4 mt-1" numberOfLines={2}>{localize(item, 'description')}</Text>
              ) : null}

              <View className="flex-row items-center justify-between mt-3">
                <Text className="text-base font-extrabold text-primary tracking-tight">₺{price.toFixed(2)}</Text>
                {entry && entry.qty > 0 ? (
                  <View className="flex-row items-center rounded-full bg-primary p-1 shadow-sm shadow-primary/30">
                    <TouchableOpacity
                      className="w-7 h-7 rounded-full bg-white items-center justify-center"
                      onPress={() => updateQuantity(entry.key, -1)}
                      activeOpacity={0.6}
                      accessibilityRole="button"
                      accessibilityLabel={`${itemName} miktarını azalt`}
                    >
                      <Icon name="minus" size={14} color={colors.primary} />
                    </TouchableOpacity>
                    <Text className="text-white text-sm font-extrabold min-w-[26px] text-center" accessibilityLabel={`Miktar ${entry.qty}`}>{entry.qty}</Text>
                    <TouchableOpacity
                      className="w-7 h-7 rounded-full bg-white items-center justify-center"
                      onPress={() => quickAdd(item)}
                      activeOpacity={0.6}
                      accessibilityRole="button"
                      accessibilityLabel={`${itemName} miktarını artır`}
                    >
                      <Icon name="plus" size={14} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    className="w-9 h-9 rounded-full bg-primary items-center justify-center shadow-md shadow-primary/40"
                    onPress={() => quickAdd(item)}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={`${itemName} sepete ekle`}
                  >
                    <Icon name="plus" size={18} color={colors.white} />
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View className="py-16 items-center">
            <View className="w-20 h-20 rounded-[28px] bg-primary-tint items-center justify-center mb-4">
              <Icon name="empty" size={34} color={colors.textMuted} />
            </View>
            <Text className="text-sm font-semibold text-ink">{t('menu.empty')}</Text>
            <Text className="text-xs text-ink-muted mt-1">{search ? `"${search}"` : ''}</Text>
          </View>
        }
      />

      {itemCount > 0 && (
        <View className="absolute bottom-4 left-5 right-5">
          <TouchableOpacity
            className="h-16 rounded-[28px] bg-primary flex-row items-center justify-between px-5 shadow-xl shadow-black/30"
            onPress={() => navigation.navigate('Cart')}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel={`${t('menu.viewCart')}, ${itemCount} ürün, toplam ${totalAmount.toFixed(2)} Türk lirası`}
          >
            <View className="flex-row items-center">
              <View className="w-9 h-9 rounded-full bg-white/20 items-center justify-center mr-3">
                <Text className="text-white text-base font-extrabold">{itemCount > 99 ? '99+' : itemCount}</Text>
              </View>
              <View>
                <Text className="text-white text-sm font-bold">{t('menu.viewCart')}</Text>
                <Text className="text-white/60 text-[10px] font-medium">{t('menu.total')}</Text>
              </View>
            </View>
            <View className="flex-row items-center gap-1">
              <Text className="text-white text-lg font-extrabold tracking-tight">₺{totalAmount.toFixed(2)}</Text>
              <Icon name="arrow" size={16} color={colors.white} />
            </View>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
