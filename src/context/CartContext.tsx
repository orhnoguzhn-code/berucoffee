import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'beru_cart_v1';

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
    .map((c) => `${c.group}::${c.label}::${c.priceDelta}`)
    .sort()
    .join('|');
}

function computeUnitPrice(base: number, choices: CustomizationChoice[] = []): number {
  return base + choices.reduce((sum, c) => sum + (c.priceDelta || 0), 0);
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setItems(JSON.parse(raw));
      } catch (err) {
        console.log('Cart load error:', (err as Error).message);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch((err) =>
      console.log('Cart save error:', (err as Error).message)
    );
  }, [items, loaded]);

  const addItem = (input: AddItemInput) => {
    const qty = input.quantity || 1;
    const lineKey = `${input.menu_item_id}::${choiceSignature(input.choices)}`;
    const unitPrice = computeUnitPrice(input.base_price, input.choices);
    setItems((prev) => {
      const existing = prev.find((i) => i.key === lineKey);
      if (existing) {
        return prev.map((i) =>
          i.key === lineKey ? { ...i, quantity: i.quantity + qty, note: i.note || input.note } : i
        );
      }
      const newItem: CartItem = {
        key: lineKey,
        menu_item_id: input.menu_item_id,
        item_name: input.item_name,
        unit_price: unitPrice,
        quantity: qty,
        customization: input.choices?.map((c) => c.label).join(', ') || '',
        choices: input.choices,
        note: input.note || '',
      };
      return [...prev, newItem];
    });
  };

  const removeItem = (key: string) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  };

  const updateQuantity = (key: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) => {
          if (i.key !== key) return i;
          const newQty = i.quantity + delta;
          return newQty <= 0 ? null : { ...i, quantity: newQty };
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const updateNote = (key: string, note: string) => {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, note } : i)));
  };

  const clearCart = () => setItems([]);

  const totalAmount = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, updateNote, clearCart, totalAmount, itemCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
export default CartContext;