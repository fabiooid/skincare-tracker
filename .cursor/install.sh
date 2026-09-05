#!/usr/bin/env bash
set -euo pipefail

npm install

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
