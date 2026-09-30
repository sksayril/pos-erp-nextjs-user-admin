'use client';

import { useUIStore } from './store';
import { translations, SupportedLanguage, SUPPORTED_LANGUAGES, LanguageOption } from './translations';

export const useTranslation = () => {
  const language = (useUIStore((state) => state.language) || 'en') as SupportedLanguage;
  const setLanguage = useUIStore((state) => state.setLanguage);

  const t = (key: string, fallback?: string): string => {
    if (!key) return '';
    const langDict = translations[language] || translations.en;
    if (langDict && key in langDict) {
      return langDict[key];
    }
    // Fallback to English if translation key is missing in selected language
    if (translations.en && key in translations.en) {
      return translations.en[key];
    }
    return fallback !== undefined ? fallback : key;
  };

  const currentLanguageOption: LanguageOption = 
    SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  return {
    t,
    language,
    setLanguage: (langCode: SupportedLanguage | string) => setLanguage(langCode),
    supportedLanguages: SUPPORTED_LANGUAGES,
    currentLanguageOption,
  };
};

export { SUPPORTED_LANGUAGES };
export type { SupportedLanguage, LanguageOption };
