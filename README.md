# Atelier — cosmetics formula tracker

A local proof of concept for indie skincare and perfume founders. **The formula table is the source of truth.** Chat can propose changes; you accept or reject them. INCI, market checks, and PIF drafts always come from the committed formula.

This is **not** a compliance product. It does not replace a qualified safety assessor or confirm legal market placement.

## Stack

- **Web:** Vite + React + shadcn/ui + Tailwind
- **Agent + API:** Mastra (Hono server)
- **App data:** SQLite via Drizzle (`apps/api/data/app.db`)
- **Agent memory:** LibSQL (`apps/api/data/mastra.db`)

## What this POC includes

- **Home** — shelf value, what to buy, formula cost, and what needs you today
- **Products** — card or list view, pin favorites, vegan / natural / organic claims
- **Product workspace** — brief prompt on top, formula below, regulatory / PIF on its own tab
- **Ingredients** — a shared library for the current organisation
- **Organisations** — a personal workspace plus named orgs you can switch between
- **Settings** — org name, theme, language, and a free / paid plan toggle

The agent is a side pane you can open from any signed-in page (sparkle in the breadcrumb, or ⌘J). Expand it to fill the window. Paid-only pieces stay in the same layout with an empty state — they are not hidden.

## Prerequisites

- Node.js **≥ 22.13**
- `GEMINI_API_KEY` (only needed for the paid agent feature). Get a key from https://aistudio.google.com/app/apikey. `OPENAI_API_KEY` is an optional fallback.

## Quick start

```bash
# 1. Install
npm install

# 2. Configure env (copy and edit)
cp .env.example .env

# 3. Migrate + seed demo data
npm run db:setup

# 4. Run API + web together
npm run dev
```

- **Web:** http://localhost:5173
- **API / Mastra Studio:** http://localhost:4111
- **Swagger:** http://localhost:4111/swagger-ui

## Demo login

- Email: `demo@local.test`
- Password: `demo`
- Plan: **free** by default — toggle to **paid** in Settings to try the agent

## Seeded products

| Product | What to look for |
|---|---|
| Dry Unscented Face Oil | Unknown INCI (`MadeUpine`) |
| Daily Barrier Cream | Phenoxyethanol 1.5% → restricted / reduce % |
| No. 3 Oil Perfume | Linalool relabel, Lilial EU ban, Fragrance→Parfum wording |

## Env vars

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Primary key for the formulator agent. Get one at https://aistudio.google.com/app/apikey |
| `GEMINI_MODEL` | Optional. Default `google/gemini-2.5-flash`. A bare name like `gemini-2.5-flash` also works. |
| `OPENAI_API_KEY` | Fallback key if Gemini is missing or fails. Get one at https://platform.openai.com/api-keys |
| `OPENAI_MODEL` | Optional. Default `openai/gpt-4o-mini`. A bare name like `gpt-4o-mini` also works. |
| `MASTRA_JWT_SECRET` | JWT signing secret (app auth + API) |
| `DATABASE_URL` | SQLite path, default `file:./data/app.db` |
| `PORT` | Mastra API port, default `4111` |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start API + web |
| `npm run dev:api` | Mastra server only |
| `npm run dev:web` | Vite UI only |
| `npm run db:migrate` | Run Drizzle migrations |
| `npm run db:seed` | Seed rules + demo products |
| `npm run db:setup` | Migrate + seed |
| `npm run test` | Domain tests and formulator model helper tests |

## Project layout

```
apps/web/          Vite + React UI
apps/api/          Mastra agent, REST routes, Drizzle
packages/domain/   Shared types, rules engine, PIF generator
DESIGN.md          Visual and UX rules for the web app
```

## Free vs paid (stub billing)

- **Free:** notebook, formula editor, INCI list, seeded EU check, PIF draft with gaps
- **Paid:** formulator agent (metered stub), extra markets label, export/version history (UI stubs)

Toggle plan in **Settings** — no real billing in this POC.

## Official references (linked in UI, not scraped)

- [EU CosIng](https://ec.europa.eu/growth/sectors/cosmetics/cosing_en)
- [EUR-Lex 1223/2009](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32009R1223)
- [IFRA Standards](https://ifrafragrance.org/standards)
- [ASEAN Cosmetic Directive](https://asean.org/our-communities/economic-community/integration-with-global-economy/asean-cosmetic-directive/)
