import type {
  FormulaRow,
  IngredientRule,
  Market,
  PatchOperation,
  ProductType,
  RegulatoryCheckResult,
  RegulatoryHit,
  RegulatoryStatus,
} from '../types.ts'
import { COSING_URL, normalizeInci } from '../types.ts'

export interface CheckInput {
  rows: Pick<FormulaRow, 'inci' | 'percent' | 'phase'>[]
  markets: Market[]
  productType: ProductType
  rules: IngredientRule[]
}

function findMatchingRules(
  inci: string,
  market: Market,
  productType: ProductType,
  rules: IngredientRule[],
): IngredientRule[] {
  const normalized = normalizeInci(inci)
  return rules.filter((rule) => {
    if (rule.market !== market) return false
    if (rule.productTypes && !rule.productTypes.includes(productType)) return false
    return rule.inciNames.some((name) => normalizeInci(name) === normalized)
  })
}

function isWater(inci: string): boolean {
  const value = normalizeInci(inci)
  return value.includes('aqua') || value === 'water'
}

function statusFromRuleHits(hits: RegulatoryHit[], hasUnknown: boolean): RegulatoryStatus {
  if (hits.some((hit) => hit.effect === 'cannot_sell')) return 'banned'
  if (hasUnknown) return 'unknown'
  if (hits.length > 0) return 'restricted'
  return 'sellable'
}

export function evaluateIngredient(
  row: Pick<FormulaRow, 'inci' | 'percent' | 'phase'>,
  market: Market,
  productType: ProductType,
  rules: IngredientRule[],
): RegulatoryHit[] {
  const hits: RegulatoryHit[] = []
  const matched = findMatchingRules(row.inci, market, productType, rules)

  if (matched.length === 0) {
    return hits
  }

  for (const rule of matched) {
    if (rule.effect === 'cannot_sell') {
      hits.push({
        market,
        instrument: rule.instrument,
        substance: rule.substance,
        inci: row.inci,
        effect: rule.effect,
        citationUrl: rule.citationUrl,
        message: rule.message,
      })
      continue
    }

    if (rule.effect === 'reduce_percent' && rule.maxPercent != null && row.percent > rule.maxPercent) {
      hits.push({
        market,
        instrument: rule.instrument,
        substance: rule.substance,
        inci: row.inci,
        limit: `${rule.maxPercent}% w/w`,
        effect: rule.effect,
        citationUrl: rule.citationUrl,
        message: `${rule.message} Current: ${row.percent}%.`,
      })
      continue
    }

    if (rule.effect === 'relabel' && rule.labelThresholdPercent != null && row.percent >= rule.labelThresholdPercent) {
      hits.push({
        market,
        instrument: rule.instrument,
        substance: rule.substance,
        inci: row.inci,
        limit: `≥ ${rule.labelThresholdPercent}% w/w`,
        effect: rule.effect,
        citationUrl: rule.citationUrl,
        message: rule.message,
      })
      continue
    }

    if (rule.effect === 'inci_wording' && rule.preferredInci) {
      if (normalizeInci(row.inci) !== normalizeInci(rule.preferredInci)) {
        hits.push({
          market,
          instrument: rule.instrument,
          substance: rule.substance,
          inci: row.inci,
          limit: `Use "${rule.preferredInci}"`,
          effect: rule.effect,
          citationUrl: rule.citationUrl,
          message: rule.message,
        })
      }
    }
  }

  return hits
}

export function runRegulatoryChecks(input: CheckInput): RegulatoryCheckResult[] {
  const { rows, markets, productType, rules } = input

  return markets.map((market) => {
    const ruleHits: RegulatoryHit[] = []

    for (const row of rows) {
      ruleHits.push(...evaluateIngredient(row, market, productType, rules))
    }

    const unknownHits: RegulatoryHit[] = rows
      .filter((row) => {
        const hasRule = rules.some(
          (rule) =>
            rule.market === market &&
            rule.inciNames.some((name) => normalizeInci(name) === normalizeInci(row.inci)),
        )
        return !hasRule && !isWater(row.inci) && row.percent > 0
      })
      .map((row) => ({
        market,
        instrument: 'Seed rules (unknown)',
        substance: row.inci,
        inci: row.inci,
        effect: 'relabel' as const,
        citationUrl: COSING_URL,
        message: `No seeded rule for "${row.inci}". Status marked unknown — live feeds cover more markets and substances.`,
      }))

    return {
      market,
      status: statusFromRuleHits(ruleHits, unknownHits.length > 0),
      hits: [...ruleHits, ...unknownHits],
    }
  })
}

export function searchIngredientRules(
  query: string,
  rules: IngredientRule[],
  market?: Market,
): IngredientRule[] {
  const q = normalizeInci(query)
  return rules.filter((rule) => {
    if (market && rule.market !== market) return false
    return (
      normalizeInci(rule.substance).includes(q) ||
      rule.inciNames.some((name) => normalizeInci(name).includes(q))
    )
  })
}

export function applyPatchOperations(
  rows: FormulaRow[],
  operations: PatchOperation[],
): FormulaRow[] {
  let next = [...rows].sort((a, b) => a.sortOrder - b.sortOrder)

  for (const op of operations) {
    if (op.op === 'add') {
      const id = crypto.randomUUID()
      const sortOrder = op.row.sortOrder ?? next.length
      next.push({
        id,
        inci: op.row.inci,
        cas: op.row.cas,
        tradeName: op.row.tradeName,
        function: op.row.function,
        phase: op.row.phase,
        percent: op.row.percent,
        notes: op.row.notes,
        locked: op.row.locked ?? false,
        sortOrder,
      })
    }

    if (op.op === 'update') {
      next = next.map((row) => {
        if (row.id !== op.rowId || row.locked) return row
        return {
          ...row,
          ...op.changes,
          id: row.id,
          locked: row.locked,
        }
      })
    }

    if (op.op === 'remove') {
      next = next.filter((row) => !(row.id === op.rowId && !row.locked))
    }

    if (op.op === 'reorder') {
      const map = new Map(next.map((row) => [row.id, row]))
      const reordered: FormulaRow[] = []
      op.rowIds.forEach((id, index) => {
        const row = map.get(id)
        if (row) reordered.push({ ...row, sortOrder: index })
      })
      const remaining = next.filter((row) => !op.rowIds.includes(row.id))
      next = [...reordered, ...remaining.map((row, i) => ({ ...row, sortOrder: reordered.length + i }))]
    }
  }

  return next.sort((a, b) => a.sortOrder - b.sortOrder)
}
