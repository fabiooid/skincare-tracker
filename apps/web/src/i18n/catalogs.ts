import { en, type Messages } from './en'
import { fr } from './fr'
import { it } from './it'
import { type Language } from './languages'

export const catalogs: Record<Language, Messages> = {
  en,
  fr,
  it,
}

type NestedKey<T, Prefix extends string = ''> = T extends string
  ? Prefix
  : {
      [K in keyof T & string]: NestedKey<T[K], Prefix extends '' ? K : `${Prefix}.${K}`>
    }[keyof T & string]

export type MessageKey = NestedKey<Messages>
export type TranslateVars = Record<string, string | number>

function lookup(messages: Messages, key: MessageKey): string {
  const parts = key.split('.')
  let current: unknown = messages
  for (const part of parts) {
    if (typeof current !== 'object' || current === null || !(part in current)) {
      return key
    }
    current = (current as Record<string, unknown>)[part]
  }
  return typeof current === 'string' ? current : key
}

export function translate(language: Language, key: MessageKey, vars?: TranslateVars): string {
  let text = lookup(catalogs[language], key)
  if (!vars) return text
  for (const [name, value] of Object.entries(vars)) {
    text = text.replaceAll(`{${name}}`, String(value))
  }
  return text
}
