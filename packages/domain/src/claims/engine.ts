import {
  findInventoryMatch,
  isWaterInci,
  type IngredientOriginType,
  type ProductClaim,
  type TriStateFlag,
} from '../types.ts'

export type ClaimHitSeverity = 'block' | 'warn' | 'unknown'

export type ClaimHitReason =
  | 'animal_derived'
  | 'synthetic'
  | 'not_organic'
  | 'unknown_animal'
  | 'unknown_origin'
  | 'unknown_organic'

export type ClaimHit = {
  claim: ProductClaim
  inci: string
  severity: ClaimHitSeverity
  reason: ClaimHitReason
}

export type ClaimInventoryItem = {
  inci: string
  animalDerived: TriStateFlag
  originType: IngredientOriginType
  organicCertified: TriStateFlag
}

function pushHit(hits: ClaimHit[], hit: ClaimHit) {
  const exists = hits.some(
    (item) => item.inci === hit.inci && item.claim === hit.claim && item.reason === hit.reason,
  )
  if (!exists) hits.push(hit)
}

export function evaluateClaimHits(input: {
  claims: ProductClaim[]
  rows: Array<{ inci: string }>
  inventory: ClaimInventoryItem[]
}): ClaimHit[] {
  const claims = input.claims
  if (claims.length === 0) return []

  const hits: ClaimHit[] = []

  for (const row of input.rows) {
    const inci = row.inci.trim()
    if (!inci || isWaterInci(inci)) continue

    const match = findInventoryMatch(inci, input.inventory)
    const animalDerived = match?.animalDerived ?? 'unknown'
    const originType = match?.originType ?? 'unknown'
    const organicCertified = match?.organicCertified ?? 'unknown'

    if (claims.includes('vegan')) {
      if (animalDerived === 'unknown') {
        pushHit(hits, { claim: 'vegan', inci, severity: 'unknown', reason: 'unknown_animal' })
      } else if (animalDerived === 'yes') {
        pushHit(hits, { claim: 'vegan', inci, severity: 'block', reason: 'animal_derived' })
      }
    }

    if (claims.includes('natural')) {
      if (originType === 'unknown') {
        pushHit(hits, { claim: 'natural', inci, severity: 'unknown', reason: 'unknown_origin' })
      } else if (originType === 'synthetic') {
        pushHit(hits, { claim: 'natural', inci, severity: 'warn', reason: 'synthetic' })
      }
    }

    if (claims.includes('organic')) {
      if (organicCertified === 'unknown') {
        pushHit(hits, { claim: 'organic', inci, severity: 'unknown', reason: 'unknown_organic' })
      } else if (organicCertified === 'no') {
        pushHit(hits, { claim: 'organic', inci, severity: 'warn', reason: 'not_organic' })
      }
    }
  }

  const order: Record<ClaimHitSeverity, number> = { block: 0, warn: 1, unknown: 2 }
  return hits.sort(
    (a, b) => order[a.severity] - order[b.severity] || a.inci.localeCompare(b.inci) || a.claim.localeCompare(b.claim),
  )
}
