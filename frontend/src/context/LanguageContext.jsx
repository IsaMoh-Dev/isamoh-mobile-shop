import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import en from '../i18n/en';
import am from '../i18n/am';

const translations = { en, am };

const LanguageContext = createContext(null);

function applyLang(lang) {
  // Update <html lang="..."> for accessibility + CSS font targeting
  document.documentElement.lang = lang === 'am' ? 'am' : 'en';
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    return localStorage.getItem('lang') || 'en';
  });

  // Apply on mount (runs synchronously before paint via useState initializer above,
  // but we also call it here to handle hydration)
  applyLang(lang);

  const setLang = useCallback((l) => {
    localStorage.setItem('lang', l);
    applyLang(l);
    setLangState(l);
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === 'en' ? 'am' : 'en');
  }, [lang, setLang]);

  /**
   * t(key, vars?) — translate a key.
   * Supports simple variable interpolation: t('hello.name', { name: 'Isa' })
   * where the translation string contains {{name}}.
   * Falls back to English, then to the key itself.
   */
  const t = useCallback((key, vars) => {
    const dict = translations[lang] || translations.en;
    let str = dict[key] ?? translations.en[key] ?? key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(new RegExp(`{{${k}}}`, 'g'), v);
      });
    }
    return str;
  }, [lang]);

  const isAmharic = lang === 'am';

  const value = useMemo(() => ({
    lang, isAmharic, t, setLang, toggleLang,
  }), [lang, isAmharic, t, setLang, toggleLang]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used inside LanguageProvider');
  return ctx;
}
