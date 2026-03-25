#!/usr/bin/env bash
# Run the full local test gate: Vitest, Playwright E2E, then backend RSpec.
# Usage (from catalog-it repo root):
#   ./scripts/test-all.sh
# Prerequisites: npm install in frontend/, bundle install in backend/, test DB for RSpec (see backend/TESTING.md).

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> Frontend: Vitest"
(cd frontend && npm run test)

echo "==> Frontend: Playwright Chromium (skip if already installed)"
(cd frontend && npx playwright install chromium)

echo "==> Frontend: Playwright E2E"
(cd frontend && npm run test:e2e)

echo "==> Backend: RSpec"
(cd backend && ./script/test)

echo "==> All tests passed."
