import type { Language } from '@/i18n/languages'

function localeFor(language: Language) {
  if (language === 'fr') return 'fr-FR'
  if (language === 'it') return 'it-IT'
  return 'en-GB'
}

export function formatEur(amount: number, language: Language) {
  return new Intl.NumberFormat(localeFor(language), {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatGrams(grams: number, language: Language) {
  return `${new Intl.NumberFormat(localeFor(language), {
    maximumFractionDigits: 1,
  }).format(grams)} g`
}
