import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  DEFAULT_GEMINI_MODEL_ID,
  DEFAULT_OPENAI_MODEL_ID,
  hasFormulatorLlmKey,
  resolveFormulatorModel,
  resolveGeminiApiKey,
  resolveGeminiModelId,
  resolveOpenAiApiKey,
  resolveOpenAiModelId,
} from './formulator-model.js'

const ENV_KEYS = [
  'GEMINI_API_KEY',
  'GEMINI_MODEL',
  'GOOGLE_API_KEY',
  'GOOGLE_GENERATIVE_AI_API_KEY',
  'OPENAI_API_KEY',
  'OPENAI_MODEL',
] as const

function withEnv(values: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>>, run: () => void) {
  const previous = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]))
  try {
    for (const key of ENV_KEYS) {
      const next = values[key]
      if (next === undefined) delete process.env[key]
      else process.env[key] = next
    }
    run()
  } finally {
    for (const key of ENV_KEYS) {
      const value = previous[key]
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
}

describe('resolveGeminiModelId', () => {
  it('defaults to Gemini Flash on the Google router', () => {
    assert.equal(resolveGeminiModelId(''), DEFAULT_GEMINI_MODEL_ID)
    assert.equal(resolveGeminiModelId(undefined), 'google/gemini-2.5-flash')
  })

  it('accepts a bare model name or a full router id', () => {
    assert.equal(resolveGeminiModelId('gemini-2.5-flash'), 'google/gemini-2.5-flash')
    assert.equal(resolveGeminiModelId('google/gemini-2.5-flash-lite'), 'google/gemini-2.5-flash-lite')
  })
})

describe('resolveOpenAiModelId', () => {
  it('defaults to gpt-4o-mini on the OpenAI router', () => {
    assert.equal(resolveOpenAiModelId(''), DEFAULT_OPENAI_MODEL_ID)
    assert.equal(resolveOpenAiModelId(undefined), 'openai/gpt-4o-mini')
  })

  it('accepts a bare model name or a full router id', () => {
    assert.equal(resolveOpenAiModelId('gpt-4o-mini'), 'openai/gpt-4o-mini')
    assert.equal(resolveOpenAiModelId('openai/gpt-4.1-mini'), 'openai/gpt-4.1-mini')
  })
})

describe('api keys', () => {
  it('treats blank values as missing', () => {
    assert.equal(resolveGeminiApiKey(''), undefined)
    assert.equal(resolveOpenAiApiKey('   '), undefined)
    assert.equal(resolveGeminiApiKey('AQ-test'), 'AQ-test')
    assert.equal(resolveOpenAiApiKey('sk-test'), 'sk-test')
  })

  it('accepts GEMINI_API_KEY and the Google names Mastra uses', () => {
    withEnv({ GEMINI_API_KEY: 'from-gemini', GOOGLE_API_KEY: undefined, GOOGLE_GENERATIVE_AI_API_KEY: undefined }, () => {
      assert.equal(resolveGeminiApiKey(), 'from-gemini')
    })
    withEnv({ GEMINI_API_KEY: undefined, GOOGLE_API_KEY: 'from-google', GOOGLE_GENERATIVE_AI_API_KEY: undefined }, () => {
      assert.equal(resolveGeminiApiKey(), 'from-google')
    })
  })
})

describe('resolveFormulatorModel', () => {
  it('uses Gemini alone when only that key is set', () => {
    withEnv(
      {
        GEMINI_API_KEY: 'AQ-test',
        GEMINI_MODEL: 'gemini-2.5-flash',
        GOOGLE_API_KEY: undefined,
        GOOGLE_GENERATIVE_AI_API_KEY: undefined,
        OPENAI_API_KEY: undefined,
        OPENAI_MODEL: undefined,
      },
      () => {
        assert.deepEqual(resolveFormulatorModel(), {
          id: 'google/gemini-2.5-flash',
          apiKey: 'AQ-test',
        })
        assert.equal(hasFormulatorLlmKey(), true)
      },
    )
  })

  it('uses OpenAI alone when Gemini is missing', () => {
    withEnv(
      {
        GEMINI_API_KEY: undefined,
        GOOGLE_API_KEY: undefined,
        GOOGLE_GENERATIVE_AI_API_KEY: undefined,
        OPENAI_API_KEY: 'sk-test',
        OPENAI_MODEL: 'gpt-4o-mini',
      },
      () => {
        assert.deepEqual(resolveFormulatorModel(), {
          id: 'openai/gpt-4o-mini',
          apiKey: 'sk-test',
        })
      },
    )
  })

  it('puts Gemini first and OpenAI second when both keys are set', () => {
    withEnv(
      {
        GEMINI_API_KEY: 'AQ-test',
        GEMINI_MODEL: undefined,
        GOOGLE_API_KEY: undefined,
        GOOGLE_GENERATIVE_AI_API_KEY: undefined,
        OPENAI_API_KEY: 'sk-test',
        OPENAI_MODEL: undefined,
      },
      () => {
        assert.deepEqual(resolveFormulatorModel(), [
          { model: { id: 'google/gemini-2.5-flash', apiKey: 'AQ-test' }, maxRetries: 2 },
          { model: { id: 'openai/gpt-4o-mini', apiKey: 'sk-test' }, maxRetries: 1 },
        ])
      },
    )
  })

  it('reports no key when both are blank', () => {
    withEnv(
      {
        GEMINI_API_KEY: '',
        GOOGLE_API_KEY: undefined,
        GOOGLE_GENERATIVE_AI_API_KEY: undefined,
        OPENAI_API_KEY: '  ',
      },
      () => {
        assert.equal(hasFormulatorLlmKey(), false)
      },
    )
  })
})
