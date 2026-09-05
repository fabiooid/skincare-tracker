export const DEFAULT_OPENAI_MODEL_ID = 'openai/gpt-4o-mini'

/**
 * Mastra model router id for OpenAI.
 * `OPENAI_MODEL` may be `gpt-4o-mini` or `openai/gpt-4o-mini`.
 */
export function resolveOpenAiModelId(raw = process.env.OPENAI_MODEL): `${string}/${string}` {
  const configured = raw?.trim()
  if (!configured) return DEFAULT_OPENAI_MODEL_ID
  return configured.includes('/') ? (configured as `${string}/${string}`) : `openai/${configured}`
}

export function resolveOpenAiApiKey(raw = process.env.OPENAI_API_KEY): string | undefined {
  const key = raw?.trim()
  return key || undefined
}

/** Config object Mastra uses to call OpenAI. */
export function resolveFormulatorModel() {
  return {
    id: resolveOpenAiModelId(),
    apiKey: resolveOpenAiApiKey(),
  }
}
