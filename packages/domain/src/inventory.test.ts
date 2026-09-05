import { describe, expect, it } from 'vitest'
import { computeFormulaCostPerKg, computeShelfSnapshot, lineStockValue } from './inventory.ts'

describe('lineStockValue', () => {
  it('multiplies kg on hand by price', () => {
    expect(lineStockValue(250, 72)).toBe(18)
  })

  it('returns null when amount or price is missing', () => {
    expect(lineStockValue(null, 72)).toBeNull()
    expect(lineStockValue(250, null)).toBeNull()
    expect(lineStockValue(0, 72)).toBeNull()
  })
})

describe('computeShelfSnapshot', () => {
  it('counts only in-house and low stock with both grams and a price', () => {
    const snapshot = computeShelfSnapshot([
      { category: 'emollient', stockStatus: 'in_house', onHandGrams: 250, pricePerKg: 72 },
      { category: 'carrier', stockStatus: 'low', onHandGrams: 80, pricePerKg: 16 },
      { category: 'fragrance', stockStatus: 'to_buy', onHandGrams: 0, pricePerKg: 980 },
      { category: 'solvent', stockStatus: 'in_house', onHandGrams: 2000 },
    ])

    expect(snapshot.value).toBe(19.28)
    expect(snapshot.valuedCount).toBe(2)
    expect(snapshot.shelfCount).toBe(3)
    expect(snapshot.pricedCount).toBe(2)
    expect(snapshot.byCategory).toEqual([
      { category: 'emollient', value: 18 },
      { category: 'carrier', value: 1.28 },
    ])
  })
})

describe('computeFormulaCostPerKg', () => {
  const inventory = [
    { inci: 'Squalane', pricePerKg: 72 },
    { inci: 'Caprylic/Capric Triglyceride', pricePerKg: 14 },
  ]

  it('treats water as free and flags missing prices as a gap', () => {
    const result = computeFormulaCostPerKg(
      [
        { inci: 'Aqua', percent: 70 },
        { inci: 'Squalane', percent: 25 },
        { inci: 'MadeUpine', percent: 5 },
      ],
      inventory,
    )
    expect(result.costPerKg).toBe(18)
    expect(result.pricedPercent).toBe(95)
    expect(result.hasGap).toBe(true)
  })

  it('returns a full cost when every non-water row has a price', () => {
    const result = computeFormulaCostPerKg(
      [
        { inci: 'Squalane', percent: 30 },
        { inci: 'Caprylic/Capric Triglyceride', percent: 70 },
      ],
      inventory,
    )
    expect(result.costPerKg).toBe(31.4)
    expect(result.pricedPercent).toBe(100)
    expect(result.hasGap).toBe(false)
  })
})
