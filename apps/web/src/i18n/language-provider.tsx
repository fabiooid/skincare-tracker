/* eslint-disable react-refresh/only-export-components */
import * as React from 'react'
import { catalogs, translate, type MessageKey, type TranslateVars } from './catalogs'
import {
  defaultLanguage,
  isLanguage,
  type Language,
} from './languages'

const STORAGE_KEY = 'language'

type LanguageContextValue = {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: MessageKey, vars?: TranslateVars) => string
}

const LanguageContext = React.createContext<LanguageContextValue | undefined>(undefined)

function readStoredLanguage(): Language {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (isLanguage(stored)) return stored

  const browser = navigator.language.slice(0, 2)
  if (isLanguage(browser)) return browser

  return defaultLanguage
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = React.useState<Language>(readStoredLanguage)

  const setLanguage = React.useCallback((next: Language) => {
    localStorage.setItem(STORAGE_KEY, next)
    setLanguageState(next)
  }, [])

  React.useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const t = React.useCallback(
    (key: MessageKey, vars?: TranslateVars) => translate(language, key, vars),
    [language],
  )

  const value = React.useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = React.useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export function useMessages() {
  const { language } = useLanguage()
  return catalogs[language]
}
