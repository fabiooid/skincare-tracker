import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  DEFAULT_OPENAI_MODEL,
  isOpenAiApiKeyConfigured,
  resolveOpenAiModel,
} from './openai.ts'

describe('resolveOpenAiModel', () => {
  it('defaults to openai/gpt-4o-mini', () => {
    assert.equal(resolveOpenAiModel(undefined), DEFAULT_OPENAI_MODEL)
    assert.equal(resolveOpenAiModel(null), DEFAULT_OPENAI_MODEL)
    assert.equal(resolveOpenAiModel(''), DEFAULT_OPENAI_MODEL)
    assert.equal(resolveOpenAiModel('   '), DEFAULT_OPENAI_MODEL)
  })

  it('keeps a value that already has a provider prefix', () => {
    assert.equal(resolveOpenAiModel('openai/gpt-4o'), 'openai/gpt-4o')
    assert.equal(resolveOpenAiModel(' openai/gpt-4.1-mini '), 'openai/gpt-4.1-mini')
  })

  it('adds openai/ when the value has no slash', () => {
    assert.equal(resolveOpenAiModel('gpt-4o-mini'), 'openai/gpt-4o-mini')
    assert.equal(resolveOpenAiModel('  gpt-4o  '), 'openai/gpt-4o')
  })
})

describe('isOpenAiApiKeyConfigured', () => {
  it('is false when the key is missing, blank, or the example placeholder', () => {
    assert.equal(isOpenAiApiKeyConfigured(undefined), false)
    assert.equal(isOpenAiApiKeyConfigured(null), false)
    assert.equal(isOpenAiApiKeyConfigured(''), false)
    assert.equal(isOpenAiApiKeyConfigured('   '), false)
    assert.equal(isOpenAiApiKeyConfigured('sk-your-key'), false)
  })

  it('is true when a key is present', () => {
    assert.equal(isOpenAiApiKeyConfigured('sk-test'), true)
  })
})
