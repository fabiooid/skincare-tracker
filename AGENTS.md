# Atelier — agent notes

The formula table is the source of truth. Chat proposes changes; the person accepts or rejects them. Match existing screens. Do not invent a new look. Read `DESIGN.md` before changing the web app.

## Commands

- Install: `npm install`
- Env file: copy `.env.example` to `.env` if it is missing
- Database: `npm run db:setup` (migrate + seed demo data)
- Dev: `npm run dev` (web http://localhost:5173, API http://localhost:4111)
- Tests: `npm test`

Demo login: `demo@local.test` / `demo`. Toggle free/paid in Settings.

## Cursor Cloud specific instructions

Cloud setup lives in `.cursor/environment.json`. The install script already installs packages, migrates the database, and seeds demo data.

Secrets belong in Cursor Cloud settings, not in git:

- `GEMINI_API_KEY` — primary key for the paid formulator agent (https://aistudio.google.com/app/apikey)
- `GEMINI_MODEL` — optional; defaults to `google/gemini-2.5-flash`
- `OPENAI_API_KEY` — fallback if Gemini is missing or fails (https://platform.openai.com/api-keys)
- `OPENAI_MODEL` — optional; defaults to `openai/gpt-4o-mini`
- `MASTRA_JWT_SECRET` — optional; a local default exists

After install, `npm run dev` starts on its own (web 5173, API 4111). Use the demo login to click through the app. Check light and dark, and a narrow window, for UI changes. Never commit `.env`.
