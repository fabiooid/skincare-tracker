export const languages = {
  en: { code: 'en', nativeLabel: 'English' },
  fr: { code: 'fr', nativeLabel: 'Français' },
  it: { code: 'it', nativeLabel: 'Italiano' },
} as const

export type Language = keyof typeof languages
export const languageCodes = Object.keys(languages) as Language[]
export const defaultLanguage: Language = 'en'

export function isLanguage(value: string | null): value is Language {
  return value !== null && value in languages
}
