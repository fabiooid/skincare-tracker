export const DEFAULT_OPENAI_MODEL = 'openai/gpt-4o-mini'

export const MISSING_OPENAI_KEY_ERROR = {
  error: 'OpenAI API key is missing',
  code: 'OPENAI_API_KEY_MISSING',
  message:
    'Set OPENAI_API_KEY before using the formulator agent. Get a key at https://platform.openai.com/api-keys. Never commit the real key.',
} as const

const EXAMPLE_KEY_PLACEHOLDER = 'sk-your-key'

export function resolveOpenAiModel(raw: string | undefined | null): string {
  const value = raw?.trim()
  if (!value) return DEFAULT_OPENAI_MODEL
  return value.includes('/') ? value : `openai/${value}`
}

export function isOpenAiApiKeyConfigured(raw: string | undefined | null): boolean {
  const value = raw?.trim() ?? ''
  return value.length > 0 && value !== EXAMPLE_KEY_PLACEHOLDER
}
