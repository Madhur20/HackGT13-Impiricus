# Contributing to Relay

## Before starting

- Read the required context listed in `AGENTS.md`.
- Confirm the workstream and public interface before changing a shared package.
- Keep product computation in `features/` and transport/UI concerns in `apps/`.
- Do not add real HCP, patient, client, credential, or contract data.

## Parallel workstreams

These areas are designed to be owned independently:

| Workstream | Primary location | Shared contract dependency |
|---|---|---|
| Web shell and persona switching | `apps/web/` | `packages/domain`, `packages/relay-core` |
| API composition and routing | `apps/api/` | All feature entry points |
| Shared domain | `packages/domain/` | None |
| Authorization and rules | `packages/policy-engine/` | `packages/domain` |
| Governed data access | `packages/data-broker/` | Domain and policy engine |
| Explanations and validation | `packages/explanations/` | Domain |
| Audit trail | `packages/audit/` | Domain |
| Practice Mirror | `features/practice-mirror/` | Domain and Relay core |
| Doctor Connect | `features/doctor-connect/` | Domain and Relay core |
| Ledger | `features/ledger/` | Domain and Relay core |
| Seed/demo fixtures | `packages/demo-seed/`, `config/` | Domain schemas |
| Cross-product verification | `tests/` | Stable public interfaces |

## Shared interface rule

Coordinate changes to shared domain types and `relay-core` exports before merging feature work. Prefer adding backward-compatible fields over silently changing meanings. Keep policy decisions deterministic and testable without model or network access.

## Definition of done

- Relevant unit, contract, integration, or end-to-end tests pass.
- Server-side authorization and validation remain enforced.
- Generated explanations contain only structured approved inputs and retain their deterministic fallback.
- No restricted field enters UI output, generated prompts, logs, or audit payloads unintentionally.
- `org/STATUS.md` and, when appropriate, `org/DECISIONS.md` and detailed plans reflect the new reality.
