'use client'

import { useState, useEffect, ReactNode, useCallback } from 'react'
import { TranslationContext, Locale, TranslationKeys } from './index'

// Import translation files
import enTranslations from './locales/en.json'
import frTranslations from './locales/fr.json'
import arTranslations from './locales/ar.json'
import esTranslations from './locales/es.json'

const translations: Record<Locale, TranslationKeys> = {
  en: enTranslations as TranslationKeys,
  fr: frTranslations as TranslationKeys,
  ar: arTranslations as TranslationKeys,
  es: esTranslations as TranslationKeys,
}

interface TranslationProviderProps {
  children: ReactNode
  defaultLocale?: Locale
}

export function TranslationProvider({ 
  children, 
  defaultLocale = 'en' 
}: TranslationProviderProps) {
  const [locale, setLocale] = useState<Locale>(defaultLocale)

  // Load locale from localStorage on mount
  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') as Locale
    if (savedLocale && Object.keys(translations).includes(savedLocale)) {
      setLocale(savedLocale)
    }
  }, [])

  // Save locale to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('locale', locale)
    
    // Set document direction for Arabic
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = locale
  }, [locale])

  // Translation function with nested key support
  const t = useCallback((key: string): string => {
    try {
      const keys = key.split('.')
      let value: any = translations[locale]
      
      for (const k of keys) {
        value = value?.[k]
      }
      
      return value || key // Return key if translation not found
    } catch (error) {
      console.warn(`Translation missing for key: ${key}`)
      return key
    }
  }, [locale])

  const handleSetLocale = useCallback((newLocale: Locale) => {
    setLocale(newLocale)
  }, [])

  const value = {
    locale,
    t,
    setLocale: handleSetLocale,
  }

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  )
} 