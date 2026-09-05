import { describe, expect, it } from 'vitest'
import { evaluateClaimHits } from './engine.ts'

const inventory = [
  { inci: 'Beeswax', animalDerived: 'yes' as const, originType: 'natural' as const, organicCertified: 'yes' as const },
  { inci: 'Squalane', animalDerived: 'no' as const, originType: 'natural' as const, organicCertified: 'unknown' as const },
  { inci: 'Phenoxyethanol', animalDerived: 'no' as const, originType: 'synthetic' as const, organicCertified: 'no' as const },
  { inci: 'Aqua', animalDerived: 'no' as const, originType: 'natural' as const, organicCertified: 'unknown' as const },
]

describe('evaluateClaimHits', () => {
  it('returns nothing when no claims are selected', () => {
    expect(
      evaluateClaimHits({
        claims: [],
        rows: [{ inci: 'Beeswax' }],
        inventory,
      }),
    ).toEqual([])
  })

  it('blocks animal-derived ingredients on vegan products', () => {
    const hits = evaluateClaimHits({
      claims: ['vegan'],
      rows: [{ inci: 'Beeswax' }, { inci: 'Squalane' }],
      inventory,
    })
    expect(hits).toEqual([
      { claim: 'vegan', inci: 'Beeswax', severity: 'block', reason: 'animal_derived' },
    ])
  })

  it('warns on synthetics for natural products', () => {
    const hits = evaluateClaimHits({
      claims: ['natural'],
      rows: [{ inci: 'Phenoxyethanol' }, { inci: 'Squalane' }],
      inventory,
    })
    expect(hits).toEqual([
      { claim: 'natural', inci: 'Phenoxyethanol', severity: 'warn', reason: 'synthetic' },
    ])
  })

  it('warns when an ingredient is not organic', () => {
    const hits = evaluateClaimHits({
      claims: ['organic'],
      rows: [{ inci: 'Phenoxyethanol' }],
      inventory,
    })
    expect(hits[0]).toMatchObject({ reason: 'not_organic', severity: 'warn' })
  })

  it('marks unknown flags instead of guessing', () => {
    const hits = evaluateClaimHits({
      claims: ['vegan', 'natural', 'organic'],
      rows: [{ inci: 'Squalane' }, { inci: 'MadeUpine' }],
      inventory,
    })
    expect(hits.some((hit) => hit.inci === 'Squalane' && hit.reason === 'unknown_organic')).toBe(true)
    expect(hits.some((hit) => hit.inci === 'MadeUpine' && hit.reason === 'unknown_animal')).toBe(true)
    expect(hits.some((hit) => hit.inci === 'MadeUpine' && hit.reason === 'unknown_origin')).toBe(true)
  })

  it('ignores water for all claims', () => {
    const hits = evaluateClaimHits({
      claims: ['vegan', 'natural', 'organic'],
      rows: [{ inci: 'Aqua' }],
      inventory,
    })
    expect(hits).toEqual([])
  })
})
