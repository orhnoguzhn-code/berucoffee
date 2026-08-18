import React, { useRef } from 'react';
import { View, TextInput as RNTextInput, NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';

interface Props {
  value: string;
  onChange: (v: string) => void;
  length?: number;
}

export default function OtpInput({ value, onChange, length = 6 }: Props) {
  const refs = useRef<Array<RNTextInput | null>>([]);

  const focusAt = (i: number) => {
    if (i >= 0 && i < length) refs.current[i]?.focus();
  };

  const handleChange = (i: number, text: string) => {
    const digits = text.replace(/\D/g, '');
    if (digits.length > 1) {
      const chunk = digits.slice(0, length - i);
      onChange(value.slice(0, i) + chunk + value.slice(i + chunk.length));
      focusAt(Math.min(i + chunk.length, length - 1));
      return;
    }
    if (digits.length > 0) {
      onChange(value.slice(0, i) + digits + value.slice(i + 1));
      focusAt(i + 1);
    } else {
      onChange(value.slice(0, i) + value.slice(i + 1));
      focusAt(i - 1);
    }
  };

  const handleKey = (i: number, e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (e.nativeEvent.key === 'Backspace' && !value[i]) {
      focusAt(i - 1);
    }
  };

  return (
    <View className="flex-row justify-between gap-2 mb-4">
      {Array.from({ length }).map((_, i) => (
        <RNTextInput
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className={`flex-1 h-14 rounded-xl border-[1.5px] text-center text-2xl font-extrabold text-ink ${value[i] ? 'border-primary bg-primary-tint' : 'border-line bg-brand-soft'}`}
          value={value[i] || ''}
          onChangeText={(text) => handleChange(i, text)}
          onKeyPress={(e) => handleKey(i, e)}
          keyboardType="number-pad"
          maxLength={6}
          autoFocus={i === 0}
          caretHidden
        />
      ))}
    </View>
  );
}