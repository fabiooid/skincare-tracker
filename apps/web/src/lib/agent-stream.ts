/** Split Mastra SSE (`data: ...\\n\\n`) or older RS-delimited frames. */
export function splitAgentStream(buffer: string): { frames: string[]; rest: string } {
  const parts = buffer.split(/\x1E|\n\n/)
  const rest = parts.pop() ?? ''
  return { frames: parts, rest }
}

function payloadFromFrame(frame: string): unknown | null {
  const trimmed = frame.trim()
  if (!trimmed || trimmed === '[DONE]') return null
  const raw = trimmed.startsWith('data:') ? trimmed.slice(5).trim() : trimmed
  if (!raw || raw === '[DONE]') return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function textFromAgentFrame(frame: string): string | null {
  const json = payloadFromFrame(frame)
  if (!json || typeof json !== 'object') return null
  const record = json as { type?: string; payload?: { text?: unknown }; text?: unknown }
  if (record.type === 'text-delta' && typeof record.payload?.text === 'string') {
    return record.payload.text
  }
  if (record.type === 'text' && typeof record.text === 'string') {
    return record.text
  }
  return null
}

export function errorFromAgentFrame(frame: string): string | null {
  const json = payloadFromFrame(frame)
  if (!json || typeof json !== 'object') return null
  const record = json as { type?: string; payload?: { error?: unknown; message?: unknown }; error?: unknown; message?: unknown }
  if (record.type !== 'error') return null
  if (typeof record.payload?.message === 'string' && record.payload.message.trim()) {
    return record.payload.message
  }
  if (typeof record.payload?.error === 'string' && record.payload.error.trim()) {
    return record.payload.error
  }
  if (typeof record.message === 'string' && record.message.trim()) return record.message
  if (typeof record.error === 'string' && record.error.trim()) return record.error
  return 'Agent failed'
}
