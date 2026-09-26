# Relay decision record

This file records durable decisions. New entries should include a date, status, decision, reason, and affected areas. If a decision changes, add a new entry and mark the old one superseded rather than erasing history.

## Accepted baseline decisions

### 2026-09-26 — Relay is the product name

- **Status:** Accepted
- **Decision:** Use Relay as the product name throughout the repository. Preserve “delta” only when it describes a mathematical or schema difference.
- **Reason:** The team selected Relay as the product identity.
- **Affected:** Documentation, package naming, UI copy, repository structure, and future presentation work.

### 2026-09-26 — Repository boundaries mirror system boundaries

- **Status:** Accepted
- **Decision:** Use `apps/` for delivery, `features/` for the three product computations and use cases, `packages/` for shared governance infrastructure, and dedicated `config/` and `tests/` areas.
- **Reason:** Teammates can work in parallel while preserving the shared policy pipeline and preventing product logic from leaking into transport code.
- **Affected:** Repository layout, ownership, imports, tests, and implementation planning.

### 2026-09-26 — AI agents share canonical instructions

- **Status:** Accepted
- **Decision:** Keep `AGENTS.md` as the canonical repository instruction file and `.claude/skills/relay-project/` as the canonical project skill. Expose them to Claude, Gemini, `.agents`, and Codex through symbolic links.
- **Reason:** One physical source prevents agent-specific context copies from drifting as the application changes.
- **Affected:** AI onboarding, context maintenance, Claude, Gemini, and Codex discovery paths.

### 2026-09-26 — Shared foundation, separate computations

- **Status:** Accepted
- **Decision:** Share consent, policy, provenance, explanation, data-access, and audit infrastructure. Keep Mirror cohort statistics, Connect ranking, and Ledger schema diff as separate algorithms.
- **Reason:** A universal delta/similarity abstraction would be misleading and harder to verify.
- **Affected:** Architecture, implementation story, demo, pitch.

### 2026-09-26 — All product reads use the data broker

- **Status:** Accepted
- **Decision:** Public and restricted product reads use the same purpose-aware broker, which returns only policy-approved fields.
- **Reason:** Public availability does not remove the need to enforce purpose, recipient, aggregation, and provenance consistently.
- **Affected:** Data access, tests, all three products.

### 2026-09-26 — Consent is purpose-specific

- **Status:** Accepted
- **Decision:** Model `SELF_INSIGHT`, `PEER_MATCHING`, `PEER_CONTACT`, and `AGGREGATE_ANALYTICS` as distinct grants. Keep source/classification separate from consent and purpose.
- **Reason:** A two-state attributable/anonymized flag cannot represent product use or identity-disclosure rules.
- **Affected:** Domain model, UI badges, policy engine, Connect contact flow.

### 2026-09-26 — Mirror remains descriptive

- **Status:** Accepted
- **Decision:** Use named class share, median, quartiles, cohort size, year, and coverage caveats. Do not produce adherence gaps, quality scores, or clinical judgments.
- **Reason:** Part D records lack diagnoses, indications, outcomes, contraindications, and the physician's full practice denominator.
- **Affected:** Practice Mirror, copy, generated-output validation, demo.

### 2026-09-26 — Connect uses structured-only input for the prototype

- **Status:** Accepted
- **Decision:** Use governed categorical questions and structured responses. Exclude optional notes, category-suggestion text, open chat, attachments, patient narratives, and exact dose fields.
- **Reason:** Data minimization reduces risk and gives the demo a clear, testable boundary. Controlled vocabulary does not justify a claim of zero privacy risk.
- **Affected:** Doctor Connect, taxonomy, safety, reusable answers.

### 2026-09-26 — Mutual consent does not settle liability

- **Status:** Accepted
- **Decision:** Require both HCPs to consent before contact disclosure and re-check consent at retrieval. Describe off-platform communication boundaries without claiming that the handoff removes Impiricus responsibility.
- **Reason:** Legal responsibilities depend on role, program design, terms, and safeguards.
- **Affected:** Doctor Connect, disclosure copy, legal review backlog.

### 2026-09-26 — Credentialing is separate from NPI

- **Status:** Accepted
- **Decision:** Treat NPI matching and credential verification as distinct. Seed synthetic verification in the prototype and require a trusted production source later.
- **Reason:** NPI issuance does not validate licensure or credentials.
- **Affected:** HCP profile, Connect eligibility, UI copy.

### 2026-09-26 — Ledger is a governed workflow, not legal automation

- **Status:** Accepted
- **Decision:** Compare normalized structured scopes, run deterministic internal policies, require authorized human review, and preserve version history. Do not ingest contracts or issue legal approval in the prototype.
- **Reason:** The product should organize evidence and enforce internal workflow without overstating legal capability.
- **Affected:** Ledger, AI boundary, review roles, audit.

### 2026-09-26 — Policy changes trigger review, not silent access changes

- **Status:** Accepted
- **Decision:** A new policy version re-evaluates affected schemas and opens tasks when outcomes change. It does not silently expand or revoke client access.
- **Reason:** Access changes require a controlled, reviewable lifecycle.
- **Affected:** Ledger policy simulator, scheduler roadmap, audit.

### 2026-09-26 — AI is an explanation layer only

- **Status:** Accepted
- **Decision:** Gemini receives approved structured facts, returns schema-validated prose, and always has a deterministic fallback. It never authorizes, ranks without deterministic controls, gives clinical advice, or invents facts/citations.
- **Reason:** Explanations must remain grounded, safe, reproducible, and demoable offline.
- **Affected:** All products, tests, demo resilience.

### 2026-09-26 — Modular monolith for the hackathon

- **Status:** Accepted
- **Decision:** Keep logical service boundaries in one application/server unless implementation needs dictate otherwise.
- **Reason:** The shared interfaces matter; premature distributed deployment would consume build time without improving the proof.
- **Affected:** Repository structure, deployment, task planning.

## Superseded pitch claims

The following claims appear in `relay-pitch.md` or `relay-pitch.pptx` and must not be treated as current requirements:

| Older claim | Current decision |
|---|---|
| All three products share one delta/similarity computation | They share governance infrastructure; each has a different named computation |
| Mirror identifies a guideline-adherence gap | Mirror shows a descriptive public-data difference and cannot establish adherence or quality |
| Cosine similarity supports Mirror | Mirror uses transparent cohort rules, median, and interquartile range |
| Public NPI data is simply “always usable, no gate” | All reads use a purpose-aware broker; public source is one policy input |
| The profile has one attributable/anonymized consent state | Permission is purpose-specific and separate from source, classification, and aggregation |
| Categorical input provides a structural guarantee against identifying data | It materially reduces risk but does not eliminate contextual re-identification or all safety concerns |
| Connect includes an optional free-text response and governed suggestion path in the demo | The hackathon build is fully structured; those remain future experiments requiring review |
| Off-platform handoff creates a strong liability boundary | Mutual consent and disclosure are product controls; legal responsibility still needs review |
| NPI/public profile can establish an eligible physician | Production matching requires verified credentials from an appropriate source |
| Ledger uses line-level diff as business logic | Ledger computes a normalized semantic field diff; line diff may only be presentation detail |
| A scheduled job is the Ledger demo centerpiece | A deterministic “simulate policy update” action is the reliable demo; scheduling is architectural follow-up |
| “Zero patient data” is an absolute guarantee | The demo neither requests nor needs patient-level data; avoid absolute privacy guarantees |
| The raw shared `DoctorProfile` best proves reuse | The common policy-version audit timeline is the strongest visible proof |

## New decision template

```md
### YYYY-MM-DD — Short title

- **Status:** Proposed | Accepted | Superseded
- **Decision:** What changed.
- **Reason:** Why this option was chosen.
- **Affected:** Products, modules, docs, tests, or demo paths.
```
