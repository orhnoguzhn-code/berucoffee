import React, { useState, useMemo } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useI18n } from '../i18n/I18nContext';
import { useCart, CustomizationChoice } from '../context/CartContext';
import { resolveImageUrl } from '../services/api';
import Icon from '../components/ui/Icon';
import Button from '../components/ui/Button';

interface Option {
  id: number;
  group: string;
  label: string;
  price_delta: number;
  is_default: boolean;
}

interface Item {
  id: number;
  name: string;
  price: number | string;
  description?: string;
  category_id?: number;
  image_url?: string;
  customization_options?: any[];
}

export default function ProductDetailScreen({ route, navigation }: any) {
  const { item } = route.params as { item: Item };
  const { t, language } = useI18n();
  const { addItem } = useCart();
  const basePrice = parseFloat(item.price as string);

  const localize = (record: any, field: string, suffix: string) => {
    const key = `${field}${suffix}`;
    return record[key] || record[field];
  };
  const suffix = language === 'en' ? '_en' : language === 'de' ? '_de' : language === 'ru' ? '_ru' : '';

  const groups = useMemo(() => {
    const raw = item.customization_options || [];
    const map = new Map<string, Option[]>();
    for (const o of raw) {
      const group = localize(o, 'group_name', suffix) || 'Seçenekler';
      const entry: Option = {
        id: o.id,
        group,
        label: localize(o, 'option_label', suffix) || o.option_label,
        price_delta: parseFloat(o.price_delta) || 0,
        is_default: !!o.is_default,
      };
      if (!map.has(entry.group)) map.set(entry.group, []);
      map.get(entry.group)!.push(entry);
    }
    return Array.from(map.values());
  }, [item.customization_options]);

  const [selections, setSelections] = useState<Option[]>(() =>
    groups.map((g) => g.find((o) => o.is_default) || g[0]).filter(Boolean)
  );
  const [quantity, setQuantity] = useState(1);

  const selectOption = (group: string, opt: Option) => {
    setSelections((prev) => {
      const next = prev.filter((o) => o.group !== group);
      return [...next, opt];
    });
  };

  const choices: CustomizationChoice[] = selections.map((o) => ({
    group: o.group,
    label: o.label,
    priceDelta: o.price_delta,
  }));
  const unitPrice = basePrice + selections.reduce((s, o) => s + o.price_delta, 0);
  const subtotal = unitPrice * quantity;

  const itemName = item.name;
  const description = item.description || '';

  const handleAdd = () => {
    addItem({
      menu_item_id: item.id,
      item_name: itemName,
      base_price: basePrice,
      quantity,
      choices,
    });
    Alert.alert(t('product.addToCart'), `${quantity} × ${itemName}`);
    navigation.goBack();
  };

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-4 py-2.5">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-9 h-9 rounded-full bg-brand-muted items-center justify-center" activeOpacity={0.7}>
          <Icon name="close" size={18} color="#1A1A1A" />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-ink">{t('product.title')}</Text>
        <View className="w-9" />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <View className="rounded-2xl items-center justify-center py-14 mb-5 bg-primary-tint overflow-hidden">
          {item.image_url ? (
            <Image source={{ uri: resolveImageUrl(item.image_url as string) }} className="w-full h-56" resizeMode="cover" />
          ) : (
            <View className="w-[84px] h-[84px] rounded-full bg-primary-soft items-center justify-center">
              <Icon name="coffee" size={40} color="#0E7A4A" />
            </View>
          )}
        </View>

        <Text className="text-2xl font-extrabold text-ink">{itemName}</Text>
        {description ? <Text className="text-sm text-ink-secondary mt-2 leading-6">{description}</Text> : null}
        <Text className="text-base text-primary font-extrabold mt-2">₺{basePrice.toFixed(2)}</Text>

        {groups.map((group) => (
          <View key={group[0].group} className="mt-5">
            <Text className="text-base font-semibold text-ink mb-3 capitalize">{group[0].group}</Text>
            <View className="flex-row flex-wrap gap-2">
              {group.map((opt) => {
                const selected = selections.some((s) => s.id === opt.id);
                return (
                  <TouchableOpacity
                    key={opt.id}
                    onPress={() => selectOption(group[0].group, opt)}
                    className={`flex-row items-center px-4 h-11 rounded-full border-[1.5px] ${selected ? 'bg-primary-soft border-primary' : 'bg-brand-soft border-line'}`}
                    activeOpacity={0.8}
                  >
                    <Text className={`text-sm ${selected ? 'text-primary font-bold' : 'text-ink-secondary'}`}>{opt.label}</Text>
                    {opt.price_delta !== 0 && (
                      <Text className={`text-xs ml-2 ${selected ? 'text-primary' : 'text-ink-muted'}`}>
                        {opt.price_delta > 0 ? `+₺${opt.price_delta.toFixed(2)}` : `−₺${Math.abs(opt.price_delta).toFixed(2)}`}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        <View className="flex-row items-center justify-between mt-6">
          <Text className="text-base font-semibold text-ink">{t('product.quantity')}</Text>
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => setQuantity((q) => Math.max(1, q - 1))} className="w-10 h-10 rounded-full bg-brand-soft items-center justify-center" activeOpacity={0.6}>
              <Text className="text-xl font-bold text-primary">−</Text>
            </TouchableOpacity>
            <Text className="text-base font-extrabold text-ink min-w-8 text-center">{quantity}</Text>
            <TouchableOpacity onPress={() => setQuantity((q) => q + 1)} className="w-10 h-10 rounded-full bg-brand-soft items-center justify-center" activeOpacity={0.6}>
              <Text className="text-xl font-bold text-primary">+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View className="p-4 bg-white border-t border-line shadow-md shadow-black/10">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-sm font-semibold text-ink">{t('product.subtotal')}</Text>
          <Text className="text-lg font-extrabold text-primary">₺{subtotal.toFixed(2)}</Text>
        </View>
        <Button title={`${t('product.addToCart')} · ₺${subtotal.toFixed(2)}`} onPress={handleAdd} />
      </View>
    </View>
  );
}