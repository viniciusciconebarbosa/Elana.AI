import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import ptBR from './locales/pt-BR.json'
import en from './locales/en.json'

// Detecta o idioma salvo nas configurações gerais do Elana
function getElanaLanguage(): string | null {
  try {
    const saved = localStorage.getItem('elana-general-settings')
    if (saved) {
      const settings = JSON.parse(saved)
      if (settings.language) return settings.language
    }
  } catch {}
  return null
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'pt-BR': { translation: ptBR },
      'en': { translation: en },
    },
    lng: getElanaLanguage() || 'pt-BR',
    fallbackLng: 'pt-BR',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage'],
      lookupLocalStorage: 'elana-i18n-lang',
      caches: ['localStorage'],
    },
  })

export default i18n
