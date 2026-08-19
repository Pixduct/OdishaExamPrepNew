import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Language, LanguageContextType } from './i18n/types';
import { translations } from './i18n/translations';

const LANGUAGE_STORAGE_KEY = 'oep-language-preference';

export const getStoredLanguage = (): Language => {
  if (typeof window === 'undefined') return 'en';
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === 'en' || saved === 'or') return saved;
  } catch {
    // fallback
  }
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
  document.documentElement.lang = lang === 'or' ? 'or' : 'en';
  if (lang === 'or') {
    document.documentElement.setAttribute('data-language', 'or');
  } else {
    document.documentElement.setAttribute('data-language', 'en');
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
   * Helper function to translate keys using dot notation.
   * Examples:
   *  t('common.nav.home') -> "Home" (en) / "ମୂଳପୃଷ୍ଠା" (or)
   *  t('nav.home') -> automatically searches common.nav.home, home.nav.home, etc.
   *  t('common.nav.daysStreak', undefined, { count: 5 }) -> "5 Days Streak" / "5 ଦିନ ଷ୍ଟ୍ରିକ୍"
   */
  const t = useCallback((key: string, fallback?: string, params?: Record<string, string | number>): string => {
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

    // Try direct path first (e.g. 'common.nav.home')
    let result = resolveKey(currentDict, key);

    // If not found and doesn't have a section prefix, try common.*, home.*, exams.*, test.*, ai.*, analytics.*, ca.*
    if (result === undefined && !key.includes('.')) {
      const prefixes = ['common', 'home', 'exams', 'test', 'ai', 'analytics', 'ca'];
      for (const prefix of prefixes) {
        const testResult = resolveKey(currentDict, `${prefix}.${key}`);
        if (testResult !== undefined) {
          result = testResult;
          break;
        }
      }
    } else if (result === undefined) {
      // Try searching inside sections if top-level section wasn't specified (e.g. 'nav.home' -> 'common.nav.home')
      const prefixes = ['common', 'home', 'exams', 'test', 'ai', 'analytics', 'ca'];
      for (const prefix of prefixes) {
        const testResult = resolveKey(currentDict, `${prefix}.${key}`);
        if (testResult !== undefined) {
          result = testResult;
          break;
        }
      }
    }

    // Fallback to English dictionary if not found in current language
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

    // Final fallback
    if (result === undefined || typeof result !== 'string') {
      result = fallback || key;
    }

    // Parameter interpolation (e.g. {count}, {exam}, {price})
    if (params && typeof result === 'string') {
      Object.entries(params).forEach(([paramKey, paramVal]) => {
        result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
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
    // Return a safe fallback if used outside Provider
    return {
      language: 'en',
      setLanguage: () => {},
      toggleLanguage: () => {},
      isOdia: false,
      t: (key: string, fallback?: string) => fallback || key
    };
  }
  return context;
};
