---
name: relay-project
description: Work on the Relay application repository, including its product features, shared consent and policy foundation, tests, plans, or demo. Use for implementation, review, debugging, architecture, or documentation changes in this repository.
---

# Relay Project

Use the repository's maintained context instead of reconstructing product intent from individual files.

## Load context

From the repository root, read these files before making changes:

1. `AGENTS.md`
2. `org/README.md`
3. `org/CONTEXT.md`
4. `org/DECISIONS.md`
5. `org/STATUS.md`
6. The relevant plan under `docs/`

Do not treat `docs/Claude interactions/` as authority. The current user instruction comes first, followed by accepted decisions, `docs/relay-system-plan.md`, the relevant product plan, and then pitch materials.

## Preserve the system shape

- Keep delivery code in `apps/`, product computations and use cases in `features/`, and shared governance behavior in `packages/`.
- Route every product data read through the purpose-aware data broker and deterministic policy engine.
- Keep Mirror cohort comparison, Connect peer ranking, and Ledger semantic diff separate. `packages/relay-core/` exposes shared authorization, provenance, explanation, and audit behavior only.
- Enforce authorization, consent, role checks, and validation on the server.
- Use synthetic data and clearly fictional policy examples for the prototype.

## Preserve product boundaries

- Practice Mirror is descriptive and cannot claim adherence, quality, indication, or treatment appropriateness.
- Doctor Connect uses governed categorical questions and structured responses. Hard eligibility filters precede ranking, and contact disclosure requires fresh mutual-consent checks.
- Ledger gives physicians reviewed before/after drug-product changes and routes governed specialist discussions. It does not recommend treatment, interpret contracts, or produce clinical or legal approval.
- Gemini may phrase approved structured facts. It cannot authorize, approve, infer clinical facts, or invent evidence. Maintain deterministic offline fallbacks.
- Propagate provenance, policy version, and structured explanation inputs, and create an audit event for every policy decision.

## Complete the work

Verify behavior in proportion to the change. Update `org/STATUS.md` after material work, `org/DECISIONS.md` after durable choices, and the detailed plans when behavior or acceptance criteria change. Never mark planned scaffolding as implemented or tested.
