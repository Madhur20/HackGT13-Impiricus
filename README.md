# Relay

Relay is a consent-aware decision layer for Impiricus. One governance foundation supports three products with separate computations:

- **Practice Mirror:** a private, descriptive comparison of public prescribing data with a defined peer cohort.
- **Doctor Connect:** governed practice questions routed to eligible, opted-in peers.
- **Ledger:** controlled review and versioning of pharma client data scopes.

The repository currently contains the product plans and a team-ready application structure. Runtime tooling has not been selected or initialized yet.

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
  api/                       HTTP composition root and product endpoints
features/
  practice-mirror/           cohort comparison computation and use cases
  doctor-connect/            taxonomy, eligibility, ranking, and request states
  ledger/                    semantic diff, review, and activation use cases
packages/
  domain/                    shared types, schemas, IDs, and value objects
  policy-engine/             deterministic, versioned access decisions
  data-broker/               mandatory purpose-aware data-access boundary
  explanations/              grounded payloads, validators, and fallbacks
  audit/                     append-only audit events and hash chaining
  relay-core/                small public facade over shared governance behavior
  demo-seed/                 deterministic synthetic demo fixtures
config/
  policies/                  fictional versioned policy configuration
  taxonomy/                  governed Doctor Connect taxonomy
  explanation-templates/     offline deterministic copy templates
tests/
  contract/                  shared interface and boundary tests
  integration/               cross-module server tests
  e2e/                       critical user and demo paths
  fixtures/                  test-only immutable fixtures
scripts/                     repeatable developer, seed, and demo commands
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
