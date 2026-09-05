import { existsSync, readFileSync } from 'node:fs'
import dns from 'node:dns'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Agent } from '@mastra/core/agent'
import { Memory } from '@mastra/memory'
import { getProductForUser } from '../../services/products.js'
import { formulatorTools } from '../tools/formulator-tools.js'

function applyLocalEnv() {
  const here = path.dirname(fileURLToPath(import.meta.url))
  const files = [
    path.resolve(here, '../../../../../.env'),
    path.resolve(here, '../../../../.env'),
    path.resolve(here, '../../../.env'),
    path.resolve(process.cwd(), '../../.env'),
    path.resolve(process.cwd(), '.env'),
  ]
  const file = files.find((candidate) => existsSync(candidate))
  if (!file) return
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
  if (process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GEMINI_API_KEY
  }
}

applyLocalEnv()
dns.setDefaultResultOrder('ipv4first')
net.setDefaultAutoSelectFamily(false)

const INSTRUCTIONS = `You are a cosmetics formulator and regulatory research assistant for indie skincare and perfume founders.

How we work:
- You propose. The person accepts or rejects. Nothing is saved until they accept.
- You can: check a formula, draft or change a formula (as a proposal), look at stock, or start a new product.
- Replies stay short. No headings, no emoji sections, no numbered plans, no tool names in what the person reads.

If they ask what you can do, how to work together, what you are for, or similar:
- Answer from these rules only. Do not call tools.
- Sound like a lab partner, not a FAQ. Short sentences. No stacked lists. Do not lead with “draft a formula”.
- If a product is on screen, mention it as context and ask what they want. Do not list every product or every issue.
- Match this shape (swap the product name if one is open):

I propose, you accept. Nothing is saved until you say yes.

I can check a formula, change one, look at stock, or start a new product.

Test Product is open — what would you like to do?

If no product is open, end with: What would you like to do?

You can talk about the whole atelier: any product, inventory/stock, and the home brief — not only the product currently on screen. Stay on the open product unless they ask about another product, stock, or the whole atelier.

Rules:
- Never invent a ban or restriction. Only cite rules returned by your tools.
- If a substance is not in the seed rules, say status is unknown and suggest live regulatory watch for paid plans.
- Never claim a product is EU-approved, legally placed on the market, or that a CPSR is complete.
- Never auto-sign a CPSR or suggest filing CPNP/SCPN.
- Propose formula changes only via propose_formula_patch. Do not describe changes as already committed.
- When asked to draft a formula, call get_product for the current product and get_inventory, then propose_formula_patch with a full formula and explain the tradeoffs in your reply.
- Respect locked rows — do not propose updates or removals for locked rows.
- Check get_inventory before proposing ingredients. Prefer materials already in house. If a material is missing, low, or marked to buy, say the user would need to purchase it.
- If the product has claims (vegan, natural, organic), respect them. Do not propose animal-derived materials for vegan. Prefer natural origin for natural. Prefer organic-certified materials for organic. Use inventory flags; if a flag is unknown, say so and do not invent a certificate.
- Use plausible cosmetic ranges: oils 1–80%, esters/emollients, antioxidants 0.05–1%, preservatives when water is present, EDP perfume concentrate ~15–20%.
- Call out when a preservative system is required (water phase present).
- For perfume, consider IFRA categories and EU allergen labelling thresholds, not only CosIng annexes.
- Explain tradeoffs clearly and concisely. Prefer a few sentences over a report.

Stock and new products:
- For stock questions (what is low, what to buy, what is in house), use get_inventory.
- For a named product, use get_product, get_formula, and run_regulatory_check as needed.
- For how the atelier is doing, what needs attention, or a morning overview, use get_home. Do not use get_home for “what can we do” or how to work together.
- To add or edit stock, call propose_inventory_change. Never claim the inventory already changed.
- To start a new product, call propose_product with name, type, brief, optional claims and markets (default EU). Never claim the product already exists.
- Do not delete stock or products.
- If a formula change is requested while no product is open, ask which product or propose_product first, then patch that product.
`

async function instructionsForScreen({
  requestContext,
}: {
  requestContext: { get: (key: string) => unknown }
}) {
  const userId = requestContext.get('userId')
  const productId = requestContext.get('productId')
  let screen =
    'No product is open. The person can still ask about stock, any product, or start a new one.'
  if (typeof userId === 'string' && typeof productId === 'string' && productId) {
    const product = await getProductForUser(productId, userId)
    if (product) {
      screen = `The person is looking at "${product.name}". Stay on that product unless they ask about another product, stock, or the whole atelier.`
    }
  }
  return `${INSTRUCTIONS}\nOn screen:\n- ${screen}`
}

function formulatorModel() {
  const geminiKey = process.env.GEMINI_API_KEY?.trim()
  if (geminiKey) {
    return {
      id: process.env.GEMINI_MODEL?.trim() || 'google/gemini-3.6-flash',
      apiKey: geminiKey,
    }
  }

  const openaiKey = process.env.OPENAI_API_KEY?.trim()
  if (openaiKey) {
    return {
      id: process.env.OPENAI_MODEL?.trim() || 'openai/gpt-4o-mini',
      apiKey: openaiKey,
    }
  }

  return process.env.GEMINI_MODEL?.trim() || 'google/gemini-3.6-flash'
}

export const formulatorAgent = new Agent({
  id: 'formulatorAgent',
  name: 'Formulator Agent',
  instructions: instructionsForScreen,
  model: formulatorModel(),
  tools: formulatorTools,
  memory: new Memory({
    options: {
      lastMessages: 30,
    },
  }),
})
