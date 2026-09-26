# Relay repository guide

This file applies to the entire repository. It is the first-read entry point for AI coding tools and human contributors.

## Read before changing anything

Read these files in order:

1. `org/README.md` for the context map and source-of-truth rules.
2. `org/CONTEXT.md` for the consolidated product, architecture, data, safety, and demo context.
3. `org/DECISIONS.md` for adopted decisions and superseded pitch claims.
4. `org/STATUS.md` for the current implementation state, priorities, and recent work.
5. The relevant detailed plan in `docs/` for the feature being changed.

Do not use `docs/Claude interactions/` as product authority. Those files are historical working transcripts and are intentionally excluded from the required context.

## Source-of-truth order

When documents disagree, use this order:

1. The user's current instruction.
2. Accepted decisions in `org/DECISIONS.md`.
3. `docs/relay-system-plan.md`.
4. The relevant product plan: `practice-mirror-plan.md`, `doctor-connect-plan.md`, or `ledger-plan.md`.
5. `docs/relay-pitch.md` and `docs/relay-pitch.pptx` for presentation history only.

The pitch predates a safety and architecture review. Never restore a pitch claim that a later plan explicitly corrected.

## Product invariants

- Relay is one consent, policy, provenance, explanation, and audit foundation supporting three different product computations. Do not implement one fake universal delta/similarity algorithm.
- Practice Mirror is descriptive. It must not infer guideline adherence, care quality, diagnosis, indication, treatment appropriateness, or patient eligibility from Part D data.
- Doctor Connect uses governed categorical questions and structured responses in the hackathon build. It has no open chat, attachments, patient narratives, or exact dose-entry fields.
- Peer identity requires active matching consent. Contact information requires active consent from both physicians and a fresh authorization check when retrieved.
- Ledger organizes schema changes and routes decisions. It does not interpret contracts, give legal conclusions, or let an LLM approve a change.
- NPI matching is not credential verification. Prototype credential status is synthetic.
- Public data, declared data, derived data, consent, permitted purpose, aggregation, and identity disclosure are separate concepts.
- Every product data read goes through the shared data broker and deterministic policy service.
- Every derived result exposes provenance, policy version, and structured explanation inputs. Every policy decision produces an append-only audit event.
- Gemini may phrase approved structured facts. It may not make access, compliance, clinical, or final ranking decisions, and every use needs a deterministic fallback.
- Demo data and jurisdiction rules are synthetic and must be labeled as such.

## Working conventions

- Favor a modular monolith for the hackathon. Service names describe boundaries, not required deployments.
- Keep shared contracts in a visible `relay-core`-style package and keep product-specific computations separate.
- Enforce roles, validation, policy, and consent on the server. UI hiding is not authorization.
- Prefer stable IDs over NPI or contact data in internal events. Do not log patient details or off-platform conversation content.
- Preserve the acceptance criteria in `org/CONTEXT.md` when changing flows or schemas.
- Treat all legal, privacy, clinical, and policy examples as product constraints or review requirements, not legal advice.

## Keep this context current

Context maintenance is part of every material implementation change:

- Update `org/STATUS.md` when work changes what exists, what works, the active priority, a blocker, or the next recommended task.
- Add an entry to `org/DECISIONS.md` when a durable product, safety, data, or architecture choice is made or reversed. Record the date, decision, reason, and affected areas.
- Update `org/CONTEXT.md` only when the durable application model changes. Keep it consolidated and remove stale statements rather than appending contradictions.
- Update the detailed file in `docs/` when behavior or acceptance criteria change. Do not let `org/` silently override a detailed plan.
- Add a short entry to the iteration log in `org/STATUS.md` for material changes. Do not log formatting-only or read-only work.
- Before handing off, verify that links, claimed implementation status, tests, open risks, and next steps are accurate.

Do not mark planned work as implemented. Distinguish `planned`, `in progress`, `implemented`, `tested`, and `demo-ready` explicitly.

## Synchronized AI-agent instructions

- `AGENTS.md` is the canonical repository instruction file. `CLAUDE.md` and `GEMINI.md` are symbolic links to it; edit only `AGENTS.md`.
- `.claude/skills/relay-project/` is the canonical repository-local Relay skill.
- `.agents/skills/relay-project` and `.codex/skills/relay-project` are symbolic links to the canonical Claude skill. Edit only the canonical skill so every agent sees the same instructions.
- After changing the skill or context files, verify the links still resolve and update `org/STATUS.md` if the change is material.
