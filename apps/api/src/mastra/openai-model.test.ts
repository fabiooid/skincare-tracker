import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  DEFAULT_OPENAI_MODEL_ID,
  resolveFormulatorModel,
  resolveOpenAiApiKey,
  resolveOpenAiModelId,
} from './openai-model.js'

describe('resolveOpenAiModelId', () => {
  it('defaults to gpt-4o-mini on the OpenAI router', () => {
    assert.equal(resolveOpenAiModelId(''), DEFAULT_OPENAI_MODEL_ID)
    assert.equal(resolveOpenAiModelId('   '), DEFAULT_OPENAI_MODEL_ID)
    assert.equal(resolveOpenAiModelId(undefined), 'openai/gpt-4o-mini')
  })

  it('accepts a bare model name or a full router id', () => {
    assert.equal(resolveOpenAiModelId('gpt-4o-mini'), 'openai/gpt-4o-mini')
    assert.equal(resolveOpenAiModelId('openai/gpt-4.1-mini'), 'openai/gpt-4.1-mini')
  })
})

describe('resolveOpenAiApiKey', () => {
  it('treats blank values as missing', () => {
    assert.equal(resolveOpenAiApiKey(''), undefined)
    assert.equal(resolveOpenAiApiKey('   '), undefined)
    assert.equal(resolveOpenAiApiKey('sk-test'), 'sk-test')
  })
})

describe('resolveFormulatorModel', () => {
  it('returns a Mastra config object', () => {
    const previousModel = process.env.OPENAI_MODEL
    const previousKey = process.env.OPENAI_API_KEY
    try {
      process.env.OPENAI_MODEL = 'gpt-4o-mini'
      process.env.OPENAI_API_KEY = 'sk-test'
      assert.deepEqual(resolveFormulatorModel(), {
        id: 'openai/gpt-4o-mini',
        apiKey: 'sk-test',
      })
    } finally {
      if (previousModel === undefined) delete process.env.OPENAI_MODEL
      else process.env.OPENAI_MODEL = previousModel
      if (previousKey === undefined) delete process.env.OPENAI_API_KEY
      else process.env.OPENAI_API_KEY = previousKey
    }
  })
})
