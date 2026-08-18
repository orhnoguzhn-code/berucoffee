import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, StyleSheet,
} from 'react-native';
import { useI18n } from '../i18n/I18nContext';

interface Props {
  buttonStyle?: any;
}

export default function LanguageSelector({ buttonStyle }: Props) {
  const { language, setLanguage, languages, t } = useI18n();
  const [visible, setVisible] = useState(false);

  const currentLang = languages.find(l => l.code === language);

  return (
    <>
      <TouchableOpacity onPress={() => setVisible(true)} style={[styles.trigger, buttonStyle]} activeOpacity={0.7}>
        <Text style={styles.triggerText}>{language.toUpperCase()}</Text>
        <Text style={styles.triggerArrow}>▼</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setVisible(false)}>
          <View style={styles.sheet}>
            <View style={styles.handleWrap}>
              <View style={styles.handle} />
            </View>
            <Text style={styles.sheetTitle}>{t('language.select')}</Text>
            {languages.map(lang => {
              const isActive = lang.code === language;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.option, isActive && styles.optionActive]}
                  onPress={() => { setLanguage(lang.code); setVisible(false); }}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionLeft}>
                    <Text style={[styles.optionText, isActive && styles.optionTextActive]}>
                      {lang.nativeName}
                    </Text>
                    <Text style={styles.optionSub}>{lang.name}</Text>
                  </View>
                  {isActive && (
                    <View style={styles.checkWrap}>
                      <Text style={styles.check}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#EDE4D9',
    gap: 4,
  },
  triggerText: { fontSize: 13, fontWeight: '700', color: '#4A2C2A', letterSpacing: 0.5 },
  triggerArrow: { fontSize: 8, color: '#8B7355', marginTop: 1 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(30,20,15,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 16,
  },
  handleWrap: { width: '100%', alignItems: 'center', paddingVertical: 12 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E0D5C8' },
  sheetTitle: { fontSize: 19, fontWeight: '700', color: '#2D1B16', marginBottom: 20, textAlign: 'center', letterSpacing: -0.3 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 4,
    backgroundColor: '#FAF8F5',
  },
  optionActive: { backgroundColor: '#F0EBE5' },
  optionLeft: {},
  optionText: { fontSize: 16, color: '#2D1B16', fontWeight: '600' },
  optionSub: { fontSize: 13, color: '#8B7355', marginTop: 2 },
  optionTextActive: { color: '#4A2C2A' },
  checkWrap: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#4A2C2A',
    justifyContent: 'center', alignItems: 'center',
  },
  check: { fontSize: 14, color: '#fff', fontWeight: '700' },
});
