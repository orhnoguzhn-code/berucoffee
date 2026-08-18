import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { useI18n } from '../i18n/I18nContext';
import Icon from './ui/Icon';

const TYPE_META: Record<string, { icon: string; chipBg: string; accent: string; softBg: string; amountColor: string }> = {
  topup: { icon: 'card', chipBg: 'bg-gold', accent: '#C89B3C', softBg: 'bg-gold-soft', amountColor: '#B8860B' },
  gift: { icon: 'gift', chipBg: 'bg-primary', accent: '#0E7A4A', softBg: 'bg-primary-tint', amountColor: '#0E7A4A' },
  free: { icon: 'coffee', chipBg: 'bg-primary', accent: '#0E7A4A', softBg: 'bg-primary-tint', amountColor: '#0E7A4A' },
  purchase: { icon: 'order', chipBg: 'bg-primary-dark', accent: '#0B5E39', softBg: 'bg-brand-soft', amountColor: '#0B5E39' },
};

const DEFAULT_META = TYPE_META.purchase;

export default function TransactionDetailSheet({ tx, onClose }: { tx: any; onClose: () => void }) {
  const { t, language } = useI18n();
  if (!tx) return null;

  const meta = TYPE_META[tx.type] || DEFAULT_META;
  const isFree = tx.type === 'free';
  const isTopup = tx.type === 'topup';
  const isGift = tx.type === 'gift';
  const label = isTopup ? t('history.topup') : isFree ? t('history.free') : isGift ? t('history.gift') : t('history.purchase');
  const direction = tx.gift_direction;
  const isOutgoing = isGift && direction === 'sent';
  const isIncomingGift = isGift && direction === 'received';
  const hasAmount = tx.amount != null && Number(tx.amount) > 0;
  const amount = hasAmount
    ? (isTopup ? `+₺${Number(tx.amount).toFixed(2)}` : isOutgoing ? `−₺${Number(tx.amount).toFixed(2)}` : isIncomingGift ? `+₺${Number(tx.amount).toFixed(2)}` : `₺${Number(tx.amount).toFixed(2)}`)
    : '—';
  const note = isFree
    ? { label: '', body: t('history.detailFreeNote') }
    : !isTopup && !isGift
      ? { label: '', body: t('history.detailPurchaseNote') }
      : isGift && tx.gift_message && String(tx.gift_message).trim()
        ? { label: t('history.detailNote'), body: String(tx.gift_message).trim() }
        : null;
  const personName = isGift && tx.gift_person_name ? String(tx.gift_person_name) : '';
  const personLabel = isGift ? (isOutgoing ? t('history.detailTo') : t('history.detailFrom')) : '';
  const amountColor = isOutgoing ? '#8A6A1D' : isIncomingGift ? '#0E7A4A' : meta.amountColor;

  const date = new Date(tx.created_at).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <TouchableOpacity className="flex-1" activeOpacity={1} onPress={onClose} />
        <View className="bg-white rounded-t-[28px] overflow-hidden">
          <View className="w-10 h-1 rounded bg-brand-muted self-center mt-3 mb-1" />

          <View className="px-5 pt-2 pb-6">
            <View className={`${meta.softBg} rounded-3xl p-5 items-center relative overflow-hidden`}>
              <View className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/40" />
              <View className="w-14 h-14 rounded-2xl bg-white items-center justify-center shadow-sm shadow-black/10">
                <Icon name={meta.icon} size={26} color={meta.accent} />
              </View>
              <Text className="text-sm font-bold text-ink-secondary mt-2.5">{label}</Text>
              {isGift && direction ? (
                <View className="mt-1 px-2.5 py-0.5 rounded-full bg-white/70">
                  <Text className="text-[11px] font-bold" style={{ color: meta.amountColor }}>
                    {isOutgoing ? `→ ${t('history.sent')}` : `← ${t('history.received')}`}
                  </Text>
                </View>
              ) : null}
              <Text className="text-[26px] font-extrabold tabular-nums mt-1.5" style={{ color: amountColor }}>
                {hasAmount ? amount : isFree ? '☕' : '✓'}
              </Text>
            </View>

            <View className="mt-4 bg-brand-soft/50 rounded-2xl overflow-hidden">
              <InfoRow label={t('history.detailType')} value={label} />
              <InfoRow label={t('history.detailAmount')} value={amount} valueColor={amountColor} divider={!personName && !note} />
              {personName ? (
                <View className={`flex-row items-center justify-between px-4 py-3 ${note ? '' : 'border-b border-line'}`}>
                  <Text className="text-[13px] text-ink-muted">{personLabel}</Text>
                  <View className="items-end max-w-[60%]">
                    <Text className="text-[13px] font-bold text-ink" numberOfLines={1}>{personName}</Text>
                    {tx.gift_person_phone ? <Text className="text-xs text-ink-muted mt-0.5">{tx.gift_person_phone}</Text> : null}
                  </View>
                </View>
              ) : null}
              {note ? (
                <View className="bg-white rounded-xl mx-4 mb-3 px-3.5 py-2.5">
                  {note.label ? (
                    <Text className="text-[11px] font-bold text-ink-secondary uppercase mb-0.5">{note.label}:</Text>
                  ) : null}
                  <Text className="text-xs leading-5 text-ink-secondary">{note.body}</Text>
                </View>
              ) : null}
              <InfoRow label={t('history.detailDate')} value={date} />
              <InfoRow label={t('history.detailId')} value={`#${tx.id}`} last />
            </View>

            <TouchableOpacity
              className="mt-4 py-3.5 rounded-2xl bg-primary items-center"
              onPress={onClose}
              activeOpacity={0.85}
            >
              <Text className="text-sm font-bold text-white">{t('common.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function InfoRow({ label, value, valueColor, divider, last }: { label: string; value: string; valueColor?: string; divider?: boolean; last?: boolean }) {
  return (
    <View className={`flex-row items-center justify-between px-4 py-3 ${divider || !last ? 'border-b border-line' : ''}`}>
      <Text className="text-[13px] text-ink-muted">{label}</Text>
      <Text className="text-[13px] font-bold text-ink" style={valueColor ? { color: valueColor } : undefined} selectable>
        {value}
      </Text>
    </View>
  );
}