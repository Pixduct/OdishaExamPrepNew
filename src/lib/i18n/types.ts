export type Language = 'en' | 'or';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  isOdia: boolean;
  t: (key: string, fallback?: string, params?: Record<string, string | number>) => string;
}
