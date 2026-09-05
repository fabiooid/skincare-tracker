export const DEFAULT_GEMINI_MODEL_ID = 'google/gemini-2.5-flash'
export const DEFAULT_OPENAI_MODEL_ID = 'openai/gpt-4o-mini'

function trimEnv(raw: string | undefined): string | undefined {
  const value = raw?.trim()
  return value || undefined
}

function withProviderPrefix(raw: string | undefined, provider: string, fallback: `${string}/${string}`): `${string}/${string}` {
  const configured = trimEnv(raw)
  if (!configured) return fallback
  return configured.includes('/') ? (configured as `${string}/${string}`) : `${provider}/${configured}`
}

export function resolveGeminiModelId(raw = process.env.GEMINI_MODEL): `${string}/${string}` {
  return withProviderPrefix(raw, 'google', DEFAULT_GEMINI_MODEL_ID)
}

export function resolveOpenAiModelId(raw = process.env.OPENAI_MODEL): `${string}/${string}` {
  return withProviderPrefix(raw, 'openai', DEFAULT_OPENAI_MODEL_ID)
}

/** AI Studio keys (`GEMINI_API_KEY`) plus the names Mastra looks up for Google. */
export function resolveGeminiApiKey(
  raw = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY,
): string | undefined {
  return trimEnv(raw)
}

export function resolveOpenAiApiKey(raw = process.env.OPENAI_API_KEY): string | undefined {
  return trimEnv(raw)
}

export function hasFormulatorLlmKey(): boolean {
  return Boolean(resolveGeminiApiKey() || resolveOpenAiApiKey())
}

function geminiConfig() {
  const apiKey = resolveGeminiApiKey()
  if (!apiKey) return undefined
  return { id: resolveGeminiModelId(), apiKey }
}

function openAiConfig() {
  const apiKey = resolveOpenAiApiKey()
  if (!apiKey) return undefined
  return { id: resolveOpenAiModelId(), apiKey }
}

/**
 * Gemini first, OpenAI if Gemini is missing or fails.
 * A single configured provider is used on its own.
 */
export function resolveFormulatorModel() {
  const gemini = geminiConfig()
  const openai = openAiConfig()
  if (gemini && openai) {
    return [
      { model: gemini, maxRetries: 2 },
      { model: openai, maxRetries: 1 },
    ]
  }
  return gemini ?? openai ?? { id: resolveGeminiModelId() }
}
