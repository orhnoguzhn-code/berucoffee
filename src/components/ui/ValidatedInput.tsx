import React, { LegacyRef } from 'react';
import {
  View, Text, TextInput, KeyboardTypeOptions, StyleProp, ViewStyle,
} from 'react-native';
import Icon from './Icon';

interface Props {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  wrapperRef?: LegacyRef<View>;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  error?: string | null;
  showSuccess?: boolean;
  prefix?: string;
  icon?: string;
  maxLength?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  rightElement?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

export default function ValidatedInput({
  label,
  value,
  onChangeText,
  onBlur,
  onFocus,
  wrapperRef,
  placeholder,
  keyboardType,
  secureTextEntry,
  error,
  showSuccess,
  prefix,
  icon,
  maxLength,
  autoCapitalize = 'sentences',
  autoCorrect = true,
  rightElement,
  containerStyle,
}: Props) {
  const hasError = !!error;
  const ok = showSuccess && !hasError;

  return (
    <View ref={wrapperRef} style={containerStyle} className="mb-4">
      {label ? (
        <Text className="text-xs font-semibold text-ink-secondary mb-2 tracking-wider uppercase">{label}</Text>
      ) : null}
      <View
        className={`flex-row items-center rounded-2xl border-[1.5px] px-4 ${hasError ? 'border-danger bg-danger-soft/50' : ok ? 'border-success bg-success-soft/40' : 'border-line bg-brand-soft'}`}
      >
        {icon ? <Icon name={icon} size={18} color={hasError ? '#DC2626' : ok ? '#16A34A' : '#9CA3AF'} /> : null}
        {prefix ? (
          <Text className={`text-base font-bold ml-3 ${hasError ? 'text-danger' : ok ? 'text-success' : 'text-ink'}`}>{prefix}</Text>
        ) : null}
        <TextInput
          className={`flex-1 py-3.5 text-base ${icon || prefix ? 'ml-3' : ''} text-ink`}
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          onFocus={onFocus}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
        />
        {hasError ? (
          <Icon name="info" size={18} color="#DC2626" />
        ) : ok ? (
          <Icon name="check" size={18} color="#16A34A" />
        ) : rightElement}
      </View>
      {hasError ? (
        <View className="flex-row items-center mt-1.5">
          <Icon name="info" size={13} color="#DC2626" />
          <Text className="ml-1.5 text-xs text-danger font-medium">{error}</Text>
        </View>
      ) : null}
    </View>
  );
}