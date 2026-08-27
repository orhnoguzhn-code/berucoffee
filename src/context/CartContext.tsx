import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'beru_cart_v2';
const MAX_ITEM_QUANTITY = 20;

export interface CustomizationChoice {
  group: string;
  label: string;
  priceDelta: number;
}

export interface CartItem {
  key: string;
  menu_item_id: number;
  item_name: string;
  unit_price: number;
  quantity: number;
  customization: string;
  choices?: CustomizationChoice[];
  note?: string;
}

interface AddItemInput {
  menu_item_id: number;
  item_name: string;
  base_price: number;
  quantity?: number;
  choices?: CustomizationChoice[];
  note?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: AddItemInput) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, delta: number) => void;
  updateNote: (key: string, note: string) => void;
  clearCart: () => void;
  totalAmount: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType>(null!);

function choiceSignature(choices: CustomizationChoice[] = []): string {
  return choices
    .map((choice) => `${choice.group}::${choice.label}::${Number(choice.priceDelta) || 0}`)
    .sort()
    .join('|');
}

function computeUnitPrice(base: number, choices: CustomizationChoice[] = []): number {
  const safeBase = Number.isFinite(base) ? Math.max(0, base) : 0;
  const additions = choices.reduce((sum, choice) => sum + (Number(choice.priceDelta) || 0), 0);
  return Math.max(0, safeBase + additions);
}

function sanitizeItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is CartItem => {
    if (!item || typeof item !== 'object') return false;
    const candidate = item as CartItem;
    return Number.isFinite(candidate.menu_item_id)
      && typeof candidate.item_name === 'string'
      && Number.isFinite(candidate.unit_price)
      && Number.isFinite(candidate.quantity)
      && candidate.quantity > 0;
  }).map((item) => ({
    ...item,
    unit_price: Math.max(0, Number(item.unit_price)),
    quantity: Math.min(MAX_ITEM_QUANTITY, Math.max(1, Math.floor(Number(item.quantity)))),
    note: typeof item.note === 'string' ? item.note.slice(0, 250) : '',
  }));
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setItems(sanitizeItems(JSON.parse(raw)));
      } catch (error) {
        console.warn('Sepet yüklenemedi:', error);
      } finally {
        setLoaded(true);
      }
    };
    void load();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch((error) => {
      console.warn('Sepet kaydedilemedi:', error);
    });
  }, [items, loaded]);

  const addItem = useCallback((input: AddItemInput) => {
    const menuItemId = Number(input.menu_item_id);
    const basePrice = Number(input.base_price);
    if (!Number.isFinite(menuItemId) || menuItemId <= 0 || !input.item_name.trim()) return;

    const qty = Math.min(MAX_ITEM_QUANTITY, Math.max(1, Math.floor(Number(input.quantity) || 1)));
    const choices = input.choices || [];
    const lineKey = `${menuItemId}::${choiceSignature(choices)}`;
    const unitPrice = computeUnitPrice(basePrice, choices);

    setItems((previous) => {
      const existing = previous.find((item) => item.key === lineKey);
      if (existing) {
        return previous.map((item) => item.key === lineKey
          ? {
              ...item,
              quantity: Math.min(MAX_ITEM_QUANTITY, item.quantity + qty),
              note: item.note || input.note?.slice(0, 250) || '',
            }
          : item);
      }

      return [...previous, {
        key: lineKey,
        menu_item_id: menuItemId,
        item_name: input.item_name.trim(),
        unit_price: unitPrice,
        quantity: qty,
        customization: choices.map((choice) => choice.label).join(', '),
        choices,
        note: input.note?.slice(0, 250) || '',
      }];
    });
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((previous) => previous.filter((item) => item.key !== key));
  }, []);

  const updateQuantity = useCallback((key: string, delta: number) => {
    if (!Number.isFinite(delta) || delta === 0) return;
    setItems((previous) => previous.flatMap((item) => {
      if (item.key !== key) return [item];
      const nextQuantity = Math.min(MAX_ITEM_QUANTITY, item.quantity + Math.trunc(delta));
      return nextQuantity <= 0 ? [] : [{ ...item, quantity: nextQuantity }];
    }));
  }, []);

  const updateNote = useCallback((key: string, note: string) => {
    setItems((previous) => previous.map((item) => item.key === key ? { ...item, note: note.slice(0, 250) } : item));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalAmount = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, updateNote, clearCart, totalAmount, itemCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
export default CartContext;
