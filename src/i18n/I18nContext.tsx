import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, languages, LanguageCode } from './translations';

interface I18nContextType {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
  languages: typeof languages;
}

const I18nContext = createContext<I18nContextType>(null!);

const STORAGE_KEY = '@app_language';

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<LanguageCode>('tr');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored && languages.some(l => l.code === stored)) {
        setLanguageState(stored as LanguageCode);
      }
    } catch {}
  };

  const setLanguage = async (code: LanguageCode) => {
    setLanguageState(code);
    await AsyncStorage.setItem(STORAGE_KEY, code);
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const lang = translations[language];
    let text = (lang as any)[key];
    if (!text) {
      const fallback = translations['en'];
      text = (fallback as any)[key];
    }
    if (!text) return key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, languages }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
export default I18nContext;
