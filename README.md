# Relay

Relay is a consent-aware decision layer for Impiricus. One governance foundation supports three products with separate computations:

- **Practice Mirror:** a private, descriptive comparison of public prescribing data with a defined peer cohort.
- **Doctor Connect:** governed practice questions routed to eligible, opted-in peers.
- **Ledger / Updates:** reviewed before/after medicine-product changes with four governed specialist options.

The repository includes a working browser-first Relay product built with React, TypeScript, and Vite. The current local environment uses deterministic illustrative records and can run offline after dependencies are installed. Production source integrations and durable server persistence remain separate deployment work.

## Run the prototype

Use Node 20 or newer:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite and sign in with one of the physician accounts below. Use `npm run check` to run TypeScript validation, product-logic tests, and the production build.

The primary physician paths are `/mirror`, `/connect`, `/inbox`, `/ledger`, and `/audit`. The signed-in account determines the physician everywhere; Relay has no physician-switching control.

## Sign-in and two-physician testing

The browser build includes local account-based sign-in and sign-up. No environment variables or external identity service are required.

| Physician | Email | Password |
|---|---|---|
| Dr. Elena Ruiz | `elena.ruiz@relay.health` | `Relay2026!` |
| Dr. Maya Chen | `maya.chen@relay.health` | `Relay2026!` |
| Dr. Jordan Brooks | `jordan.brooks@relay.health` | `Relay2026!` |

The sign-up form activates an existing eligible physician profile by matching its NPI. The seeded profile NPIs are:

- Maya: `1234567890`
- Elena: `1098765432`
- Jordan: `1357924680`

To exercise the current same-browser flow:

1. Sign in as Elena, send a Doctor Connect request to Maya, and sign out.
2. Sign in as Maya, open Inbox, accept the request, submit the structured answer, and sign out.
3. Sign back in as Elena. Doctor Connect shows an answer notification and opens directly to the final response step.

The request, accounts, and active workflow survive account changes in the same browser through `BroadcastChannel` and `localStorage`.

This local account store is intentionally scoped to the hackathon browser build. A deployed environment must replace it with server-side authentication, protected sessions, credential verification, an authenticated API, and a realtime datastore.

## Start here

1. Read `AGENTS.md`.
2. Read `org/README.md`, `org/CONTEXT.md`, `org/DECISIONS.md`, and `org/STATUS.md`.
3. Read the plan for your workstream in `docs/`.
4. Follow `CONTRIBUTING.md` before adding a framework or dependency.

Claude reads `CLAUDE.md`, Gemini reads `GEMINI.md`, and Codex-compatible agents read `AGENTS.md`. These entry points resolve to the same canonical instructions. The shared Relay project skill is canonical under `.claude/skills/relay-project/` and linked into `.agents/skills/` and `.codex/skills/`.

## Repository structure

```text
apps/
  web/                       browser application and feature UI
  api/                       reserved for the future HTTP composition root
features/
  practice-mirror/           cohort comparison computation and use cases
  doctor-connect/            taxonomy, eligibility, ranking, and request states
  ledger/                    reviewed product-version comparison and update use cases
packages/
  domain/                    shared types, schemas, IDs, and value objects
  policy-engine/             deterministic, versioned access decisions
  data-broker/               mandatory purpose-aware data-access boundary
  explanations/              grounded payloads, validators, and fallbacks
  audit/                     append-only audit events and hash chaining
  relay-core/                small public facade over shared governance behavior
  demo-seed/                 deterministic local development fixtures
config/
  policies/                  fictional versioned policy configuration
  taxonomy/                  governed Doctor Connect taxonomy
  explanation-templates/     offline deterministic copy templates
tests/
  contract/                  shared interface and boundary tests
  integration/               cross-module server tests
  e2e/                       critical user and product paths
  fixtures/                  test-only immutable fixtures
scripts/                     repeatable developer, seed, and validation commands
infra/                       local and deployment configuration
docs/                        detailed product and system plans
org/                         maintained contributor and AI context
```

## Dependency direction

```text
apps -> features -> relay-core -> shared packages -> domain
   \-------- permitted direct imports from domain --------/
```

`domain` must not depend on another internal package. Shared packages must not import from `apps` or `features`. Feature packages must not import from one another; cross-product handoffs use shared contracts and application-level orchestration.

## Naming

Relay is the product name in maintained documentation, agent context, package naming, and pitch artifacts. The lowercase word “delta” may still appear when it describes an ordinary mathematical or schema difference.
