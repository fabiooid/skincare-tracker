export const DEFAULT_OPENAI_MODEL = 'openai/gpt-4o-mini'

export const MISSING_OPENAI_KEY_ERROR = {
  error: 'OpenAI API key is missing',
  code: 'OPENAI_API_KEY_MISSING',
  message:
    'Set OPENAI_API_KEY before using the formulator agent. Get a key at https://platform.openai.com/api-keys. Never commit the real key.',
} as const

export function resolveOpenAiModel(raw = process.env.OPENAI_MODEL): string {
  const value = raw?.trim()
  if (!value) return DEFAULT_OPENAI_MODEL
  return value.includes('/') ? value : `openai/${value}`
}

export function isOpenAiApiKeyConfigured(raw = process.env.OPENAI_API_KEY): boolean {
  return Boolean(raw?.trim())
}
