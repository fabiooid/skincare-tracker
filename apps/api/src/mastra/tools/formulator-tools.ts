import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import {
  IngredientInputSchema,
  PatchOperationSchema,
  searchIngredientRules,
} from '@atelier/domain'
import {
  computeChecks,
  createPatch,
  getCurrentVersionForVariant,
  getFormulaRows,
  getProductForUser,
  getVariant,
  getWorkspace,
  listProducts,
  loadRules,
} from '../../services/products.js'
import {
  findIngredientByInci,
  getIngredient,
  listIngredients,
} from '../../services/ingredients.js'
import { getHomeDashboard } from '../../services/home.js'
import { createProposal, toIngredientInput } from '../../services/proposals.js'

function getToolContext(context: unknown) {
  const requestContext = (context as { requestContext?: { get: (key: string) => unknown } })
    ?.requestContext
  const userId = requestContext?.get('userId')
  if (typeof userId !== 'string') {
    throw new Error('Missing user context')
  }
  const productId = requestContext?.get('productId')
  const variantId = requestContext?.get('variantId')
  return {
    userId,
    productId: typeof productId === 'string' && productId ? productId : undefined,
    variantId: typeof variantId === 'string' && variantId ? variantId : undefined,
  }
}

async function resolveProductId(
  userId: string,
  options: { productId?: string; name?: string; contextProductId?: string },
) {
  if (options.productId) {
    const product = await getProductForUser(options.productId, userId)
    return product ? product.id : null
  }
  if (options.name?.trim()) {
    const products = await listProducts(userId)
    const needle = options.name.trim().toLowerCase()
    const exact = products.filter((item) => item.name.toLowerCase() === needle)
    if (exact.length === 1) return exact[0].id
    const partial = products.filter((item) => item.name.toLowerCase().includes(needle))
    if (partial.length === 1) return partial[0].id
    if (partial.length > 1) {
      return { matches: partial.map((item) => ({ id: item.id, name: item.name, type: item.type })) }
    }
    return null
  }
  if (options.contextProductId) {
    const product = await getProductForUser(options.contextProductId, userId)
    return product ? product.id : null
  }
  return null
}

async function resolveVariantId(productId: string, userId: string, variantId?: string) {
  // A variant id can arrive from the model or the page context, so confirm it
  // belongs to this product before it reaches a read or a patch.
  if (variantId) {
    const variant = await getVariant(variantId, productId)
    if (variant) return variant.id
  }
  const workspace = await getWorkspace(productId, userId)
  return workspace?.activeVariantId ?? workspace?.variants[0]?.variant.id
}

function summarizeProduct(product: Awaited<ReturnType<typeof listProducts>>[number]) {
  return {
    id: product.id,
    name: product.name,
    type: product.type,
    stage: product.stage,
    markets: product.markets,
    claims: product.claims,
    brief: product.brief,
    updatedAt: product.updatedAt,
  }
}

export const listProductsTool = createTool({
  id: 'list_products',
  description:
    'List all products in the current organisation: name, type, stage, markets, claims, and brief.',
  inputSchema: z.object({}),
  execute: async (_input, context) => {
    const { userId } = getToolContext(context)
    const products = await listProducts(userId)
    return { products: products.map(summarizeProduct) }
  },
})

export const getProductTool = createTool({
  id: 'get_product',
  description:
    'Get one product brief, type, markets, and claims. Pass productId or name. If omitted, uses the product the user is currently viewing.',
  inputSchema: z.object({
    productId: z.string().optional(),
    name: z.string().optional(),
  }),
  execute: async (input, context) => {
    const { userId, productId: contextProductId } = getToolContext(context)
    const resolved = await resolveProductId(userId, {
      productId: input.productId,
      name: input.name,
      contextProductId,
    })
    if (resolved && typeof resolved === 'object' && 'matches' in resolved) {
      return { error: 'Several products match that name. Ask which one.', matches: resolved.matches }
    }
    if (!resolved) {
      return {
        error:
          'No product selected. Ask which product, or call list_products. You can still answer stock questions with get_inventory.',
      }
    }
    const product = await getProductForUser(resolved, userId)
    if (!product) return { error: 'Product not found' }
    return product
  },
})

export const getFormulaTool = createTool({
  id: 'get_formula',
  description:
    'Get committed formula rows for a product variant. Pass productId or name if not currently viewing a product.',
  inputSchema: z.object({
    productId: z.string().optional(),
    name: z.string().optional(),
    variantId: z.string().optional(),
  }),
  execute: async (input, context) => {
    const { userId, productId: contextProductId, variantId: contextVariantId } = getToolContext(context)
    const resolved = await resolveProductId(userId, {
      productId: input.productId,
      name: input.name,
      contextProductId,
    })
    if (resolved && typeof resolved === 'object' && 'matches' in resolved) {
      return { error: 'Several products match that name. Ask which one.', matches: resolved.matches }
    }
    if (!resolved) return { error: 'Name the product whose formula you want to inspect.' }
    const variantId = await resolveVariantId(
      resolved,
      userId,
      input.variantId ?? contextVariantId,
    )
    if (!variantId) return { rows: [] }
    const version = await getCurrentVersionForVariant(variantId)
    if (!version) return { rows: [] }
    const rows = await getFormulaRows(version.id)
    return { productId: resolved, version: version.label, variantId, rows }
  },
})

export const proposeFormulaPatchTool = createTool({
  id: 'propose_formula_patch',
  description:
    'Propose a structured formula patch. Does NOT mutate the formula until the user accepts in the UI. Name the product if the user is not currently viewing one.',
  inputSchema: z.object({
    productId: z.string().optional(),
    name: z.string().optional(),
    variantId: z.string().optional(),
    summary: z.string(),
    operations: z.array(PatchOperationSchema),
  }),
  execute: async (input, context) => {
    const { userId, productId: contextProductId, variantId: contextVariantId } = getToolContext(context)
    const resolved = await resolveProductId(userId, {
      productId: input.productId,
      name: input.name,
      contextProductId,
    })
    if (resolved && typeof resolved === 'object' && 'matches' in resolved) {
      return { error: 'Several products match that name. Ask which one.', matches: resolved.matches }
    }
    if (!resolved) return { error: 'Name the product to patch, or open a product first.' }
    const variantId = await resolveVariantId(
      resolved,
      userId,
      input.variantId ?? contextVariantId,
    )
    const patchId = await createPatch({
      productId: resolved,
      variantId,
      summary: input.summary,
      operations: input.operations,
    })
    return { patchId, status: 'pending', summary: input.summary, productId: resolved, variantId }
  },
})

export const runRegulatoryCheckTool = createTool({
  id: 'run_regulatory_check',
  description: 'Run seeded regulatory checks against a committed formula.',
  inputSchema: z.object({
    productId: z.string().optional(),
    name: z.string().optional(),
    variantId: z.string().optional(),
  }),
  execute: async (input, context) => {
    const { userId, productId: contextProductId, variantId: contextVariantId } = getToolContext(context)
    const resolved = await resolveProductId(userId, {
      productId: input.productId,
      name: input.name,
      contextProductId,
    })
    if (resolved && typeof resolved === 'object' && 'matches' in resolved) {
      return { error: 'Several products match that name. Ask which one.', matches: resolved.matches }
    }
    if (!resolved) return { error: 'Name the product to check.' }
    const variantId = await resolveVariantId(
      resolved,
      userId,
      input.variantId ?? contextVariantId,
    )
    return computeChecks(resolved, userId, variantId)
  },
})

export const searchIngredientRulesTool = createTool({
  id: 'search_ingredient_rules',
  description: 'Search the versioned seed rules table by INCI or substance name.',
  inputSchema: z.object({
    query: z.string(),
    market: z.enum(['EU', 'UK', 'US', 'HK', 'ASEAN']).optional(),
  }),
  execute: async (input) => {
    const rules = await loadRules()
    return searchIngredientRules(input.query, rules, input.market)
  },
})

export const getInventoryTool = createTool({
  id: 'get_inventory',
  description:
    'List the atelier inventory: in-house ingredients, stock status, grams on hand, price, and claim flags. Use this for stock questions even when no product is open.',
  inputSchema: z.object({
    query: z.string().optional(),
  }),
  execute: async (input, context) => {
    const { userId } = getToolContext(context)
    const ingredients = await listIngredients(userId)
    const filtered = input.query
      ? ingredients.filter((item) => {
          const haystack = `${item.inci} ${item.tradeName ?? ''} ${item.notes ?? ''}`.toLowerCase()
          return haystack.includes(input.query!.trim().toLowerCase())
        })
      : ingredients
    return {
      ingredients: filtered,
      inHouse: filtered.filter((item) => item.stockStatus === 'in_house').map((item) => item.inci),
      toPurchase: filtered
        .filter((item) => item.stockStatus === 'low' || item.stockStatus === 'to_buy')
        .map((item) => ({
          inci: item.inci,
          stockStatus: item.stockStatus,
          onHandGrams: item.onHandGrams,
        })),
    }
  },
})

export const getHomeTool = createTool({
  id: 'get_home',
  description:
    'Get the atelier morning brief: shelf value, items to purchase, formulas that need attention, and formula cost coverage.',
  inputSchema: z.object({}),
  execute: async (_input, context) => {
    const { userId } = getToolContext(context)
    return getHomeDashboard(userId)
  },
})

const inventoryFields = {
  tradeName: z.string().optional().nullable(),
  cas: z.string().optional().nullable(),
  category: IngredientInputSchema.shape.category.optional(),
  stockStatus: IngredientInputSchema.shape.stockStatus.optional(),
  animalDerived: IngredientInputSchema.shape.animalDerived.optional(),
  originType: IngredientInputSchema.shape.originType.optional(),
  organicCertified: IngredientInputSchema.shape.organicCertified.optional(),
  pricePerKg: z.number().nonnegative().nullable().optional(),
  onHandGrams: z.number().nonnegative().nullable().optional(),
  notes: z.string().optional().nullable(),
}

export const proposeInventoryChangeTool = createTool({
  id: 'propose_inventory_change',
  description:
    'Propose adding a new stock item or editing an existing one. Does NOT write stock until the user accepts in the chat. For edits, pass ingredientId or the current INCI.',
  inputSchema: z.object({
    action: z.enum(['create', 'update']),
    summary: z.string(),
    ingredientId: z.string().optional(),
    inci: z.string().optional(),
    ...inventoryFields,
  }),
  execute: async (input, context) => {
    const { userId } = getToolContext(context)

    if (input.action === 'create') {
      if (!input.inci?.trim()) return { error: 'INCI is required to add stock.' }
      const existing = await findIngredientByInci(userId, input.inci)
      if (existing) {
        return {
          error: 'That INCI is already in stock. Use action update instead.',
          ingredientId: existing.id,
        }
      }
      const ingredient = IngredientInputSchema.parse({
        inci: input.inci,
        tradeName: input.tradeName,
        cas: input.cas,
        category: input.category ?? 'other',
        stockStatus: input.stockStatus ?? 'to_buy',
        animalDerived: input.animalDerived ?? 'unknown',
        originType: input.originType ?? 'unknown',
        organicCertified: input.organicCertified ?? 'unknown',
        pricePerKg: input.pricePerKg,
        onHandGrams: input.onHandGrams,
        notes: input.notes,
      })
      const proposal = await createProposal({
        userId,
        kind: 'inventory_create',
        summary: input.summary,
        payload: { ingredient },
      })
      return { proposalId: proposal.id, status: 'pending', kind: proposal.kind, summary: proposal.summary }
    }

    const existing = input.ingredientId
      ? await getIngredient(userId, input.ingredientId)
      : input.inci
        ? await findIngredientByInci(userId, input.inci)
        : null
    if (!existing) return { error: 'Stock item not found. Call get_inventory first.' }

    const ingredient = toIngredientInput({
      inci: input.inci?.trim() || existing.inci,
      tradeName: input.tradeName === undefined ? existing.tradeName : input.tradeName ?? undefined,
      cas: input.cas === undefined ? existing.cas : input.cas ?? undefined,
      category: input.category ?? existing.category,
      stockStatus: input.stockStatus ?? existing.stockStatus,
      animalDerived: input.animalDerived ?? existing.animalDerived,
      originType: input.originType ?? existing.originType,
      organicCertified: input.organicCertified ?? existing.organicCertified,
      pricePerKg: input.pricePerKg === undefined ? existing.pricePerKg : input.pricePerKg ?? undefined,
      onHandGrams: input.onHandGrams === undefined ? existing.onHandGrams : input.onHandGrams ?? undefined,
      notes: input.notes === undefined ? existing.notes : input.notes ?? undefined,
    })
    const proposal = await createProposal({
      userId,
      kind: 'inventory_update',
      summary: input.summary,
      payload: { ingredientId: existing.id, ingredient },
    })
    return {
      proposalId: proposal.id,
      status: 'pending',
      kind: proposal.kind,
      summary: proposal.summary,
      ingredientId: existing.id,
    }
  },
})

export const proposeProductTool = createTool({
  id: 'propose_product',
  description:
    'Propose creating a new product from a brief. Does NOT create it until the user accepts in the chat. Same fields as New from brief: name, type, markets, brief, claims.',
  inputSchema: z.object({
    summary: z.string(),
    name: z.string().min(1).max(120),
    type: z.enum(['skincare', 'perfume', 'hybrid']),
    brief: z.string().min(1),
    markets: z.array(z.enum(['EU', 'UK', 'US', 'HK', 'ASEAN'])).optional(),
    claims: z.array(z.enum(['vegan', 'natural', 'organic'])).optional(),
  }),
  execute: async (input, context) => {
    const { userId } = getToolContext(context)
    const proposal = await createProposal({
      userId,
      kind: 'product_create',
      summary: input.summary,
      payload: {
        name: input.name.trim(),
        type: input.type,
        markets: input.markets?.length ? input.markets : ['EU'],
        brief: input.brief,
        claims: input.claims,
      },
    })
    return { proposalId: proposal.id, status: 'pending', kind: proposal.kind, summary: proposal.summary }
  },
})

export const formulatorTools = {
  list_products: listProductsTool,
  get_product: getProductTool,
  get_formula: getFormulaTool,
  propose_formula_patch: proposeFormulaPatchTool,
  run_regulatory_check: runRegulatoryCheckTool,
  search_ingredient_rules: searchIngredientRulesTool,
  get_inventory: getInventoryTool,
  get_home: getHomeTool,
  propose_inventory_change: proposeInventoryChangeTool,
  propose_product: proposeProductTool,
}
