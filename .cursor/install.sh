#!/usr/bin/env bash
set -euo pipefail

npm install

# OPENAI_API_KEY is not required for install. Set it in Cursor Cloud
# settings or .env to try the paid formulator agent.
if [ ! -f .env ]; then
  cp .env.example .env
fi

mkdir -p apps/api/data

npm run db:migrate

if [ ! -f apps/api/data/.seeded ]; then
  npm run db:seed
  touch apps/api/data/.seeded
fi

npm test
