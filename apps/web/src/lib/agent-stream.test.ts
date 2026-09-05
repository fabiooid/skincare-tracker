import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { errorFromAgentFrame, splitAgentStream, textFromAgentFrame } from './agent-stream.ts'

describe('splitAgentStream', () => {
  it('splits SSE events and keeps a partial tail', () => {
    const { frames, rest } = splitAgentStream('data: {"type":"start"}\n\ndata: {"type":"text-delta"')
    assert.deepEqual(frames, ['data: {"type":"start"}'])
    assert.equal(rest, 'data: {"type":"text-delta"')
  })

  it('still splits older record-separator frames', () => {
    const { frames, rest } = splitAgentStream('{"type":"text"}\x1E{"type":"text-delta"')
    assert.deepEqual(frames, ['{"type":"text"}'])
    assert.equal(rest, '{"type":"text-delta"')
  })
})

describe('textFromAgentFrame', () => {
  it('reads SSE text-delta payloads', () => {
    assert.equal(
      textFromAgentFrame('data: {"type":"text-delta","payload":{"text":"Hello"}}'),
      'Hello',
    )
  })

  it('reads older plain JSON text frames', () => {
    assert.equal(textFromAgentFrame('{"type":"text","text":"Hi"}'), 'Hi')
  })

  it('ignores done and non-text frames', () => {
    assert.equal(textFromAgentFrame('data: [DONE]'), null)
    assert.equal(textFromAgentFrame('data: {"type":"start"}'), null)
  })
})

describe('errorFromAgentFrame', () => {
  it('reads an SSE error message', () => {
    assert.equal(
      errorFromAgentFrame('data: {"type":"error","payload":{"message":"Set OPENAI_API_KEY"}}'),
      'Set OPENAI_API_KEY',
    )
  })

  it('ignores non-error frames', () => {
    assert.equal(errorFromAgentFrame('data: {"type":"text-delta","payload":{"text":"Hi"}}'), null)
  })
})
