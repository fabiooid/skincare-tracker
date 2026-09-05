# Atelier — agent notes

The formula table is the source of truth. Chat proposes changes; the person accepts or rejects them. Match existing screens. Do not invent a new look. Read `DESIGN.md` before changing the web app.

## Commands

- Install: `npm install`
- Env file: copy `.env.example` to `.env` if it is missing. Add `OPENAI_API_KEY` from https://platform.openai.com/api-keys. Optional `OPENAI_MODEL` (default `openai/gpt-4o-mini`). Never commit a real key.
- Database: `npm run db:setup` (migrate + seed demo data)
- Dev: `npm run dev` (web http://localhost:5173, API http://localhost:4111)
- Tests: `npm test`

Demo login: `demo@local.test` / `demo`. Toggle free/paid in Settings. Paid is required for the formulator agent.

## Cursor Cloud specific instructions

Cloud setup lives in `.cursor/environment.json`. The install script already installs packages, migrates the database, and seeds demo data.

Secrets belong in Cursor Cloud settings, not in git:

- `OPENAI_API_KEY` — needed to try the paid formulator agent. Get a key at https://platform.openai.com/api-keys
- `OPENAI_MODEL` — optional; defaults to `openai/gpt-4o-mini`. If you omit the slash, `openai/` is added
- `MASTRA_JWT_SECRET` — optional; a local default exists

After install, `npm run dev` starts on its own (web 5173, API 4111). Use the demo login to click through the app. Check light and dark, and a narrow window, for UI changes. Never commit `.env`.
