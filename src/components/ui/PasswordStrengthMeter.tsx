import React from 'react';
import { View, Text } from 'react-native';
import Icon from './Icon';
import { PASSWORD_RULES, passwordScore } from '../../utils/validators';

interface Props {
  password: string;
  t: (key: string) => string;
}

const SEGMENT_COLORS = ['#DC2626', '#DC2626', '#F59E0B', '#16A34A', '#16A34A'];

function strengthLabel(score: number, t: (key: string) => string): { text: string; color: string } {
  if (score <= 1) return { text: t('form.pwWeak'), color: '#DC2626' };
  if (score <= 3) return { text: t('form.pwFair'), color: '#F59E0B' };
  if (score === 4) return { text: t('form.pwGood'), color: '#16A34A' };
  return { text: t('form.pwStrong'), color: '#0E7A4A' };
}

export default function PasswordStrengthMeter({ password, t }: Props) {
  const score = passwordScore(password);
  const label = strengthLabel(score, t);

  return (
    <View className="bg-brand-soft border-[1.5px] border-line rounded-2xl p-4 mb-4">
      <View className="flex-row items-center justify-between mb-2.5">
        <View className="flex-row items-center">
          <Icon name="lock" size={14} color="#4B5563" />
          <Text className="ml-1.5 text-xs font-semibold text-ink-secondary tracking-wider uppercase">{t('form.pwStrength')}</Text>
        </View>
        <Text style={{ color: label.color }} className="text-xs font-bold">{label.text}</Text>
      </View>

      <View className="flex-row gap-1.5 mb-4">
        {PASSWORD_RULES.map((_, i) => (
          <View
            key={i}
            className="flex-1 h-1.5 rounded-full"
            style={{ backgroundColor: i < score ? SEGMENT_COLORS[Math.min(i, 4)] : '#E5E7EB' }}
          />
        ))}
      </View>

      <View className="flex-row flex-wrap gap-2">
        {PASSWORD_RULES.map((rule) => {
          const met = rule.test(password);
          return (
            <View key={rule.id} className="flex-row items-center">
              <Icon name={met ? 'check' : 'close'} size={14} color={met ? '#16A34A' : '#9CA3AF'} />
              <Text className={`ml-1.5 text-xs ${met ? 'text-success font-semibold' : 'text-ink-muted'}`}>
                {t(`form.pw${rule.id === 'length' ? 'Length' : rule.id === 'upper' ? 'Upper' : rule.id === 'lower' ? 'Lower' : rule.id === 'number' ? 'Number' : 'Special'}`)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}