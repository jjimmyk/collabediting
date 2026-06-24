# Testing in The Hub (PRATUS)

This project uses four layers of automated checks plus optional manual smoke testing.

| Layer | Command | When to run |
|-------|---------|-------------|
| **Lint + build** | `npm run lint` / `npm run build` | Every change, before commit |
| **Regression scripts** | `npm run verify:all` | Every change touching business logic, exports, roster, ICS forms |
| **API smoke** | `npm run test:api` | Every change under `api/` |
| **Unit tests (Vitest)** | `npm run test:unit` | Every change; watch mode while developing |
| **Integration (Supabase)** | `npm run test:integration` | Before deploy; after migrations or API/DB changes |
| **E2E smoke (Playwright)** | `npm run test:e2e:smoke` | Before deploy; after UI/routing changes |
| **E2E authenticated** | `npm run test:e2e:auth` | Before major releases; needs test user |
| **Full CI locally** | `npm run test:ci` | Before opening a PR or pushing to `main` |

GitHub Actions (`.github/workflows/ci.yml`) runs **lint, build, API checks, verify:all, unit tests, Playwright smoke**, and **production API health** on every push to `main`. Integration tests run when repository secrets are configured.

---

## Quick start

```bash
npm ci
npm run test:ci          # fast gate: lint + build + api + verify + unit
```

Before production deploy:

```bash
npm run test:ci
npm run test:integration   # requires env (see below)
npm run test:e2e:smoke
```

Optional full sweep:

```bash
npm run test:all
```

---

## Phase 0 — Regression scripts (`verify:*`)

**What:** 32 TypeScript scripts in `scripts/verify-*.ts` that assert pure logic (PDF exports, roster math, ICS sync, org chart geometry, etc.).

**Run all:**

```bash
npm run verify:all
```

**Run one:**

```bash
npm run verify:ics215-template-export
npm run verify:operations-work-assignment-defaults
# … see package.json for the full list
```

**When:** Any change to `src/features/**`, `src/lib/**`, or related API helpers. These run in CI on every PR.

**Scripts not wired before (now available):**

- `npm run verify:apply-workspace-roster-plan`
- `npm run verify:roster-templates`
- `npm run verify:roster-competency-functions`
- `npm run verify:organizations-migration`
- `npm run verify:default-roster-org-members` (prints SQL for manual DB check)

---

## Phase 0 — API safety checks

Prevents serverless handlers from crashing on Vercel (e.g. importing `../src/` from `api/`).

```bash
npm run test:api
```

This runs:

1. **`verify:api-import-boundary`** — fails if any `api/**/*.ts` imports `../src/` or `@/`
2. **`verify:api-handlers`** — esbuild-bundles every API route and smoke-calls critical handlers; expects JSON `401`/`400`/`405`, never a platform crash

**When:** Every change under `api/`. **Rule:** keep API-only shared code in `api/*`; never import frontend `src/`.

---

## Phase 1 — Unit tests (Vitest)

**Location:** `tests/unit/**/*.test.ts`

```bash
npm run test:unit           # single run
npm run test:unit:watch     # watch mode
npm run test:unit:coverage  # coverage report in coverage/
```

**When:** Add or extend unit tests when you change:

- `src/lib/workspace-format.ts` (Planning-P / Initial Response)
- `api/roster-operations-work-assignment.ts`
- Operational period utilities
- Any pure function with branching business rules

**Convention:** Prefer Vitest for new tests; keep existing `verify:*` scripts until migrated.

---

## Phase 2 — Integration tests (Supabase)

**Location:** `tests/integration/**/*.test.ts`

**Scenario covered:** Create USCG Initial Response incident → upgrade to Planning-P → start Operational Period 1 (uses real Supabase + test user).

### Setup (one time)

1. Use a **dedicated test Supabase project** or a non-production schema — not your live incident data.
2. Apply migrations: `npm run db:apply`
3. Create a test user (org admin or IC-capable) in Supabase Auth.
4. Copy env vars (from `vercel env pull` or Supabase dashboard):

```bash
# .env.test.local (gitignored) or export in shell
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_ANON_KEY=...
TEST_USER_EMAIL=test-user@example.com
TEST_USER_PASSWORD=...
```

### Run

```bash
npm run test:integration
```

Tests **auto-skip** when `SUPABASE_URL` or `TEST_USER_*` are missing (safe for CI without secrets).

**When:**

- Before production deploy
- After migrations (`supabase/migrations/*`)
- After changes to `start-operational-period`, `create-workspace`, `update-workspace`, roster lifecycle

**GitHub Actions:** Add repository secrets `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `TEST_USER_EMAIL`, `TEST_USER_PASSWORD` to enable integration job on `main`.

---

## Phase 3 — E2E tests (Playwright)

**Location:** `e2e/*.spec.ts`

### Smoke (no login required)

```bash
npm run test:e2e:smoke
```

Starts `vite preview` locally (unless `PLAYWRIGHT_BASE_URL` is set), checks app shell loads.

### API health (against deployed URL)

```bash
PLAYWRIGHT_API_BASE_URL=https://thehub-6426.vercel.app npm run test:e2e:api-health
```

Confirms critical API routes return JSON errors, not `FUNCTION_INVOCATION_FAILED`.

### Authenticated journey (optional)

```bash
export TEST_USER_EMAIL=...
export TEST_USER_PASSWORD=...
npm run test:e2e:auth
```

Covers Planning-P settings / Start OP button visibility (best-effort UI flow).

### Run against preview or production UI

```bash
PLAYWRIGHT_BASE_URL=https://your-preview.vercel.app npm run test:e2e:smoke
```

### View report

```bash
npx playwright show-report
```

**When:**

| Test | Run when |
|------|----------|
| `test:e2e:smoke` | UI shell, routing, build config changes |
| `test:e2e:api-health` | After every production deploy |
| `test:e2e:auth` | Major workspace / Planning-P workflow changes |

---

## Recommended workflows

### During development

```bash
npm run test:unit:watch     # while editing pure logic
npm run verify:<area>       # targeted regression for your feature
```

### Before commit

```bash
npm run test:ci
```

### Before production deploy

```bash
npm run test:ci
npm run test:integration
npm run test:e2e:smoke
PLAYWRIGHT_API_BASE_URL=https://thehub-6426.vercel.app npm run test:e2e:api-health
```

### After deploy

1. Run API health against production (above).
2. Manual smoke: create Initial Response incident → change to Planning-P → Start OP 1.

---

## CI summary (GitHub Actions)

| Job | Trigger | What it runs |
|-----|---------|--------------|
| `verify` | Every PR + push | lint, build, API boundary, API handlers, verify:all, unit tests |
| `integration` | Push to `main` | Supabase integration (if secrets set) |
| `e2e-smoke` | Every PR + push | Playwright smoke (local preview) |
| `e2e-api-health` | Push to `main` | API health vs production |

---

## Adding tests for new features

1. **Pure logic** → `tests/unit/my-feature.test.ts` + optional `scripts/verify-my-feature.ts`
2. **API route** → ensure it bundles in `verify:api-handlers`; add integration case if it touches DB
3. **UI journey** → extend `e2e/*.spec.ts`
4. **Bug fix** → add the test that would have caught the bug (required for regressions like OP start / API import boundary)

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `verify:all` slow | Run individual `npm run verify:<name>` |
| Integration skipped | Set `SUPABASE_*` and `TEST_USER_*` env vars |
| Playwright timeout | Increase timeout in `playwright.config.ts` or run with `PLAYWRIGHT_BASE_URL` pointing at a fast preview |
| API handler bundle fails | Remove `../src/` imports from `api/`; use `api/*-shared.ts` helpers |
| E2E auth fails | Confirm test user exists and password auth is enabled in Supabase |
