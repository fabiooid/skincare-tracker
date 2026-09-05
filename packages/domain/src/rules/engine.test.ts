import { describe, expect, it } from 'vitest'
import { runRegulatoryChecks, searchIngredientRules } from './engine'
import { SEED_RULES } from './seed-rules'

describe('regulatory engine', () => {
  it('flags EU ban for Lilial', () => {
    const results = runRegulatoryChecks({
      rows: [{ inci: 'Butylphenyl Methylpropional', percent: 0.01, phase: 'Fragrance' }],
      markets: ['EU'],
      productType: 'perfume',
      rules: SEED_RULES,
    })

    expect(results[0]?.status).toBe('banned')
    expect(results[0]?.hits[0]?.effect).toBe('cannot_sell')
  })

  it('flags phenoxyethanol above 1%', () => {
    const results = runRegulatoryChecks({
      rows: [{ inci: 'Phenoxyethanol', percent: 1.5, phase: 'Water' }],
      markets: ['EU'],
      productType: 'skincare',
      rules: SEED_RULES,
    })

    expect(results[0]?.status).toBe('restricted')
    expect(results[0]?.hits.some((h) => h.effect === 'reduce_percent')).toBe(true)
  })

  it('flags linalool allergen relabel threshold', () => {
    const results = runRegulatoryChecks({
      rows: [{ inci: 'Linalool', percent: 0.05, phase: 'Fragrance' }],
      markets: ['EU'],
      productType: 'perfume',
      rules: SEED_RULES,
    })

    expect(results[0]?.hits.some((h) => h.effect === 'relabel')).toBe(true)
  })

  it('marks unknown INCI not in seed', () => {
    const results = runRegulatoryChecks({
      rows: [{ inci: 'MadeUpine', percent: 5, phase: 'Oil' }],
      markets: ['EU'],
      productType: 'skincare',
      rules: SEED_RULES,
    })

    expect(results[0]?.status).toBe('unknown')
  })

  it('shows ASEAN vs EU difference for Lilial', () => {
    const eu = runRegulatoryChecks({
      rows: [{ inci: 'Lilial', percent: 0.05, phase: 'Fragrance' }],
      markets: ['EU'],
      productType: 'perfume',
      rules: SEED_RULES,
    })
    const asean = runRegulatoryChecks({
      rows: [{ inci: 'Lilial', percent: 0.15, phase: 'Fragrance' }],
      markets: ['ASEAN'],
      productType: 'perfume',
      rules: SEED_RULES,
    })

    expect(eu[0]?.status).toBe('banned')
    expect(asean[0]?.status).toBe('restricted')
  })

  it('checks limits against the total of an ingredient split across rows', () => {
    const results = runRegulatoryChecks({
      rows: [
        { inci: 'Phenoxyethanol', percent: 0.6, phase: 'Water' },
        { inci: 'phenoxyethanol', percent: 0.6, phase: 'Cool down' },
      ],
      markets: ['EU'],
      productType: 'skincare',
      rules: SEED_RULES,
    })

    expect(results[0]?.status).toBe('restricted')
    expect(results[0]?.hits.filter((h) => h.effect === 'reduce_percent')).toHaveLength(1)
  })

  it('does not let an unknown ingredient hide a real restriction', () => {
    const results = runRegulatoryChecks({
      rows: [
        { inci: 'Phenoxyethanol', percent: 1.5, phase: 'Water' },
        { inci: 'MadeUpine', percent: 5, phase: 'Oil' },
      ],
      markets: ['EU'],
      productType: 'skincare',
      rules: SEED_RULES,
    })

    expect(results[0]?.status).toBe('restricted')
  })

  it('does not treat ingredients that merely contain "aqua" as water', () => {
    const results = runRegulatoryChecks({
      rows: [
        { inci: 'Aqua', percent: 90, phase: 'Water' },
        { inci: 'Aquaxyl', percent: 3, phase: 'Water' },
      ],
      markets: ['EU'],
      productType: 'skincare',
      rules: SEED_RULES,
    })

    expect(results[0]?.status).toBe('unknown')
    expect(results[0]?.hits.map((h) => h.inci)).toEqual(['Aquaxyl'])
  })

  it('searches ingredient rules by INCI', () => {
    const hits = searchIngredientRules('phenoxy', SEED_RULES, 'EU')
    expect(hits.length).toBeGreaterThan(0)
    expect(hits[0]?.substance).toBe('Phenoxyethanol')
  })
})
