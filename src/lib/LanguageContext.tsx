import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Language, LanguageContextType } from './i18n/types';
import { translations } from './i18n/translations';
import { translatePhrase } from './i18n/phraseDictionary';

const LANGUAGE_STORAGE_KEY = 'oep-language-preference';

export const getStoredLanguage = (): Language => {
  if (typeof window === 'undefined') return 'en';
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === 'en' || saved === 'or') return saved;
  } catch {
    // fallback
  }
  // Default to English for all first-time visitors
  return 'en';
};

export const setStoredLanguage = (lang: Language): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    applyLanguageToDocument(lang);
    window.dispatchEvent(new CustomEvent('oep-language-changed', { detail: lang }));
  } catch {
    // ignore
  }
};

export const applyLanguageToDocument = (lang: Language): void => {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lang === 'en' ? 'en' : 'or';
  if (lang === 'en') {
    document.documentElement.setAttribute('data-language', 'en');
  } else {
    document.documentElement.setAttribute('data-language', 'or');
  }
};

// Apply stored language on script load
if (typeof window !== 'undefined') {
  applyLanguageToDocument(getStoredLanguage());
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => getStoredLanguage());

  const setLanguage = useCallback((newLang: Language) => {
    setLanguageState(newLang);
    setStoredLanguage(newLang);
  }, []);

  const toggleLanguage = useCallback(() => {
    const nextLang: Language = language === 'en' ? 'or' : 'en';
    setLanguage(nextLang);
  }, [language, setLanguage]);

  useEffect(() => {
    applyLanguageToDocument(language);

    const handleLanguageChange = (e: Event) => {
      const customEvt = e as CustomEvent<Language>;
      if (customEvt.detail && (customEvt.detail === 'en' || customEvt.detail === 'or')) {
        setLanguageState(customEvt.detail);
      }
    };

    window.addEventListener('oep-language-changed', handleLanguageChange);
    return () => {
      window.removeEventListener('oep-language-changed', handleLanguageChange);
    };
  }, [language]);

  /**
   * Helper function to translate keys or static phrases.
   * Features:
   *  1. Direct dot-notation lookup (e.g. 'common.nav.home')
   *  2. Automatic section search ('nav.home')
   *  3. Universal phrase dictionary lookup for raw English text ('Submit Test', 'Continue Practice')
   *  4. Dynamic token replacement ({count}, {time}) with Odia numeral formatting
   *  5. Safe fallback to original text (guarantees zero UI breakage)
   */
  const t = useCallback((key: string, fallback?: string, params?: Record<string, string | number>): string => {
    if (!key) return fallback || '';

    const currentDict = translations[language] || translations.en;
    const englishDict = translations.en;

    const resolveKey = (dict: any, path: string): any => {
      if (!dict || !path) return undefined;
      const parts = path.split('.');
      let current = dict;
      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          return undefined;
        }
      }
      return current;
    };

    let result: any = undefined;

    // 1. If in Odia mode, check universal phrase dictionary first for direct raw strings
    if (language === 'or') {
      const directPhrase = translatePhrase(key);
      if (directPhrase !== undefined) {
        result = directPhrase;
      }
    }

    // 2. Try direct dot path (e.g. 'common.nav.home')
    if (result === undefined) {
      result = resolveKey(currentDict, key);
    }

    // 3. If not found and doesn't have a section prefix, try common.*, home.*, exams.*, test.*, ai.*, analytics.*, ca.*
    if (result === undefined) {
      const prefixes = ['common', 'home', 'exams', 'test', 'ai', 'analytics', 'ca'];
      for (const prefix of prefixes) {
        const testResult = resolveKey(currentDict, `${prefix}.${key}`);
        if (testResult !== undefined) {
          result = testResult;
          break;
        }
      }
    }

    // 4. Fallback to English dictionary if not found in current language
    if (result === undefined) {
      result = resolveKey(englishDict, key);
      if (result === undefined) {
        const prefixes = ['common', 'home', 'exams', 'test', 'ai', 'analytics', 'ca'];
        for (const prefix of prefixes) {
          const testResult = resolveKey(englishDict, `${prefix}.${key}`);
          if (testResult !== undefined) {
            result = testResult;
            break;
          }
        }
      }
    }

    // 5. Final fallback to phrase dictionary in Odia mode if fallback prop was passed as English
    if (result === undefined && language === 'or' && fallback) {
      const fallbackPhrase = translatePhrase(fallback);
      if (fallbackPhrase !== undefined) {
        result = fallbackPhrase;
      }
    }

    // 6. Final fallback
    if (result === undefined || typeof result !== 'string') {
      result = fallback !== undefined ? fallback : key;
    }

    // 7. Parameter interpolation (e.g. {count}, {exam}, {time})
    if (params && typeof result === 'string') {
      Object.entries(params).forEach(([paramKey, paramVal]) => {
        const valToInsert = language === 'or' && typeof paramVal === 'number'
          ? toOdiaDigits(paramVal)
          : String(paramVal);
        result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), valToInsert);
      });
    }

    return result;
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    toggleLanguage,
    isOdia: language === 'or',
    t
  }), [language, setLanguage, toggleLanguage, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    const storedLang = getStoredLanguage();
    return {
      language: storedLang,
      setLanguage: () => {},
      toggleLanguage: () => {},
      isOdia: storedLang === 'or',
      t: (key: string, fallback?: string) => {
        if (storedLang === 'or') {
          return translatePhrase(fallback || key);
        }
        return fallback || key;
      }
    };
  }
  return context;
};

export const toOdiaDigits = (num: number | string): string => {
  const odiaDigits = ['୦', '୧', '୨', '୩', '୪', '୫', '୬', '୭', '୮', '୯'];
  return String(num).replace(/[0-9]/g, (d) => odiaDigits[parseInt(d, 10)]);
};

