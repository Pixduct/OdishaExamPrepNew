import React from 'react';
import { useLanguage, toOdiaDigits } from '../lib/LanguageContext';
import { translatePhrase } from '../lib/i18n/phraseDictionary';

interface TProps {
  children?: React.ReactNode;
  text?: string;
  fallback?: string;
  params?: Record<string, string | number>;
  className?: string;
  as?: React.ElementType;
  noTranslate?: boolean;
}

/**
 * Universal auto-translation component for static UI text.
 * Automatically translates children or text prop to Odia when language is 'or'.
 * Respects noTranslate guard to preserve admin/database dynamic strings.
 */
export const T: React.FC<TProps> = ({
  children,
  text,
  fallback,
  params,
  className,
  as: Component = 'span',
  noTranslate = false
}) => {
  const { t, isOdia } = useLanguage();

  if (noTranslate) {
    return <Component className={className}>{text || children}</Component>;
  }

  const rawText = text || (typeof children === 'string' ? children : '');

  if (!rawText) {
    return <Component className={className}>{children}</Component>;
  }

  const translated = t(rawText, fallback || rawText, params);

  return <Component className={className}>{translated}</Component>;
};

export const useAutoTranslate = () => {
  const { t, isOdia, language, setLanguage, toggleLanguage } = useLanguage();

  const autoTranslate = React.useCallback(
    (text: string, fallback?: string, params?: Record<string, string | number>): string => {
      return t(text, fallback, params);
    },
    [t]
  );

  return {
    t,
    autoTranslate,
    isOdia,
    language,
    setLanguage,
    toggleLanguage,
    toOdiaDigits: isOdia ? toOdiaDigits : (val: any) => String(val)
  };
};

export default T;
