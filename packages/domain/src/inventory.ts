import {
  findInventoryMatch,
  isWaterInci,
  type IngredientCategory,
  type IngredientStockStatus,
} from './types.ts'

export function roundMoney(value: number) {
  return Math.round(value * 100) / 100
}

export function isShelfStock(status: IngredientStockStatus) {
  return status === 'in_house' || status === 'low'
}

export function lineStockValue(
  onHandGrams?: number | null,
  pricePerKg?: number | null,
): number | null {
  if (onHandGrams == null || onHandGrams <= 0 || pricePerKg == null || pricePerKg < 0) return null
  return roundMoney((onHandGrams / 1000) * pricePerKg)
}

export type ShelfInventoryItem = {
  category: IngredientCategory
  stockStatus: IngredientStockStatus
  onHandGrams?: number | null
  pricePerKg?: number | null
}

export type ShelfSnapshot = {
  value: number
  valuedCount: number
  shelfCount: number
  pricedCount: number
  byCategory: Array<{ category: IngredientCategory; value: number }>
}

export function computeShelfSnapshot(items: ShelfInventoryItem[]): ShelfSnapshot {
  const shelf = items.filter((item) => isShelfStock(item.stockStatus))
  const byCategory = new Map<IngredientCategory, number>()
  let value = 0
  let valuedCount = 0
  let pricedCount = 0

  for (const item of shelf) {
    if (item.pricePerKg != null) pricedCount += 1
    const line = lineStockValue(item.onHandGrams, item.pricePerKg)
    if (line == null) continue
    valuedCount += 1
    value += line
    byCategory.set(item.category, roundMoney((byCategory.get(item.category) ?? 0) + line))
  }

  return {
    value: roundMoney(value),
    valuedCount,
    shelfCount: shelf.length,
    pricedCount,
    byCategory: [...byCategory.entries()]
      .map(([category, categoryValue]) => ({ category, value: categoryValue }))
      .sort((a, b) => b.value - a.value || a.category.localeCompare(b.category)),
  }
}

export type FormulaCostResult = {
  costPerKg: number | null
  pricedPercent: number
  hasGap: boolean
}

export function computeFormulaCostPerKg(
  rows: Array<{ inci: string; percent: number }>,
  inventory: Array<{ inci: string; pricePerKg?: number | null }>,
): FormulaCostResult {
  let cost = 0
  let accountedPercent = 0
  let gapPercent = 0

  for (const row of rows) {
    if (!row.inci.trim() || row.percent <= 0) continue
    if (isWaterInci(row.inci)) {
      accountedPercent += row.percent
      continue
    }
    const match = findInventoryMatch(row.inci, inventory)
    if (match?.pricePerKg != null) {
      cost += (row.percent / 100) * match.pricePerKg
      accountedPercent += row.percent
    } else {
      gapPercent += row.percent
    }
  }

  return {
    costPerKg: accountedPercent > 0 ? roundMoney(cost) : null,
    pricedPercent: roundMoney(accountedPercent),
    hasGap: gapPercent > 0.05,
  }
}
