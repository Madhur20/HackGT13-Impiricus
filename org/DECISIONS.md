# Relay decision record

This file records durable decisions. New entries should include a date, status, decision, reason, and affected areas. If a decision changes, add a new entry and mark the old one superseded rather than erasing history.

## Accepted baseline decisions

### 2026-09-26 — Relay Network Graph is the learning matching substrate for Doctor Connect

- **Status:** Accepted
- **Decision:** Add an expertise graph and a trust graph as a distinct computation (`@relay/network-graph`) that backs Doctor Connect peer matching. Expertise edges carry evidence sources (`SELF_DECLARED`, `SPECIALTY`, `PUBLICATION`, `IMPIRICUS_SIGNAL`, `SYNTHETIC`) and a derived strength; trust edges are created and reinforced only from post-connection feedback. Matching is a deterministic funnel (specialty → expertise floor → peer-support opt-in/help mode → verified + matching consent + availability → expertise/trust ranking → best match or honest no-match), and the graph improves as connections are validated.
- **Reason:** Isolated community, rural, and independent physicians need routing to the right peer, not a flat directory. A learning expertise/trust graph is a durable, defensible matching advantage while reusing consent, policy, provenance, and audit.
- **Boundaries:** Expertise evidence and validated trust drive ranking — never prescribing volume or NPI alone; hard filters precede ranking; zero patient data and no off-platform content in trust or feedback; structured categorical intent only in the hackathon, with any future Gemini intent extraction requiring a deterministic fallback and holding no eligibility or final-peer authority; NPI is identity, not credentialing.
- **Affected:** `packages/domain`, new `features/network-graph`, `docs/network-graph-plan.md`, `org/` context/decisions/status, and future `demo-seed` data, data-broker reads, Doctor Connect UI, and audit events.

### 2026-09-26 — Network Graph ranking is a contextual bandit (reinforcement learning)

- **Status:** Accepted
- **Decision:** Rank eligible peers with a contextual multi-armed bandit instead of a fixed trust average. Context is the request plus each peer's expertise evidence; actions are the eligible peers; reward is consented post-connection feedback (`yes = 1.0`, `somewhat = 0.5`, `no = 0.0`) maintained as a Beta posterior per (expert, topic) via `recordConnectionOutcome`. The default policy is deterministic **UCB** (`mean + 0.15 * sqrt(ln(N+1)/(nᵢ+1))`, clamped to `[0,1]`, bonus `0` when there is no feedback yet); **Thompson sampling** (seeded Mulberry32 + Marsaglia–Tsang gamma to draw `Beta(1+successes, 1+failures)`) is an optional reproducible stochastic policy. The trust estimate keeps the 0.30 weight in the blended score.
- **Reason:** The real problem is exploit-vs-explore: reward proven experts while still giving promising, under-connected peers visibility so isolated physicians are not permanently starved. A single-step contextual bandit models this precisely; a deep sequential MDP would add brittle, unverifiable state for no benefit given independent one-shot connections with immediate feedback.
- **Boundaries:** All hard eligibility filters run strictly before the bandit, so exploration can never surface an ineligible peer; the trust estimate is clamped and bounded to its 0.30 weight so exploration is a tie-breaker, not an override of expertise; UCB is the deterministic fallback required by the AI boundary; the bandit reads only counts, posteriors, and topic IDs — never patient data.
- **Affected:** `features/network-graph` (matcher, tests), `docs/network-graph-plan.md`, `org/CONTEXT.md`, `org/STATUS.md`.

### 2026-09-26 — Peer domain clustering is a deterministic, descriptive computation

- **Status:** Accepted
- **Decision:** Add peer domain clustering as a separate named computation in `@relay/peer-clustering`. It groups physicians by their synthetic prescribing mix using a deterministic, seeded k-means (implemented in TypeScript, offline, reproducible) and suggests co-clustered peers. Prescribing vectors are read through the data broker under `AGGREGATE_ANALYTICS`, and every peer suggestion is gated by an active `PEER_MATCHING` grant. Any future Gemini use only phrases the deterministic result and must keep the deterministic output as its fallback.
- **Reason:** The team needs an "AI/ML" grouping that suggests which doctors fall in a physician's domain, while preserving offline determinism, the shared broker/policy pipeline, and the invariant that each product keeps a distinct named computation.
- **Boundary:** Clustering is descriptive prescribing-domain overlap only. It does not claim expertise, quality, adherence, indication, or treatment appropriateness, and it does not replace Doctor Connect's hard eligibility filters or transparent weighted ranking. Prescribing signals may describe a domain but cannot stand in for expertise in Connect ranking.
- **Affected:** `packages/domain`, `packages/demo-seed`, `packages/data-broker`, `packages/relay-core`, the new `features/peer-clustering`, tests, and the future Doctor Connect / discovery UI.

### 2026-09-26 — Browser-first TypeScript prototype stack

- **Status:** Accepted
- **Decision:** Use an npm workspace with React 19, TypeScript, Vite, React Router, Vitest, and repository-owned CSS for the hackathon prototype. Keep the current demo local and synthetic until the team explicitly chooses a backend or hosted deployment.
- **Reason:** This provides the fastest reliable path to a polished, interactive concept while preserving package boundaries and deterministic offline behavior.
- **Affected:** Root tooling, `apps/web`, local setup, testing, and near-term demo work.

### 2026-09-26 — Impiricus-adjacent visual direction without copied brand claims

- **Status:** Superseded by the physician-first Impiricus palette decision below
- **Decision:** Use a navy, lime, teal, card-based visual system inspired by the tone of Impiricus's public product experience, while keeping Relay's UI and design tokens repository-owned and avoiding claims that they are official brand assets.
- **Reason:** The demo should feel credible in the Impiricus context without misrepresenting an official design system or depending on externally hosted assets.
- **Affected:** Web shell, component styling, demo presentation, and future design QA.

### 2026-09-26 — Physician-first interface with the supplied Impiricus palette

- **Status:** Superseded in navigation scope by the role-specific Ledger views decision below; palette and progressive disclosure remain accepted
- **Decision:** Use charcoal, cyan, magenta, and white as the Relay interface palette, based on the Impiricus reference supplied by the user. Show physicians only Overview, Practice Mirror, and Doctor Connect; reserve Ledger and Audit navigation for the compliance persona. Keep secondary clinical context and evidence details progressively disclosed.
- **Reason:** A physician should be able to choose a task immediately without first interpreting the internal governance architecture. The revised palette also places Relay more naturally beside Impiricus's existing public product presentation.
- **Affected:** Navigation, Home, Practice Mirror, Doctor Connect, responsive styling, and demo presentation.

### 2026-09-26 — Ledger has separate HCP and compliance views

- **Status:** Superseded by the physician-facing Ledger decision below
- **Decision:** Use the `/ledger` route as a shared versioned-change surface with role-specific data and controls. HCPs see reviewed practice and industry updates under the navigation label “Updates”; compliance users retain the client data-scope Ledger. HCP relevance may use specialty, explicit follows, and topics explored in Relay, but must expose why an update was shown and must not infer patient treatment or recommend clinical improvement.
- **Reason:** The same provenance, before/after, version-history, and audit foundation can make Spark-style notifications more transparent to physicians without exposing contract-governance workflows or conflating educational updates with legal/data-scope review.
- **Affected:** HCP navigation, Ledger routing, data broker, synthetic fixtures, Spark handoff concept, Doctor Connect handoff, audit, and product documentation.

### 2026-09-26 — Ledger is a physician-facing medicine-change explorer

- **Status:** Accepted
- **Decision:** Ledger is presented as Updates for physicians. It shows reviewed synthetic pharma and drug-product changes with concrete before/after versions, relevance reasons, and four eligible specialists for a governed Doctor Connect discussion. The active UI no longer presents Ledger as an internal client data-scope workflow.
- **Reason:** The product value is helping physicians understand what changed in a medicine and decide what general questions to discuss with specialists. Policy and audit remain shared foundations, not Ledger’s user-facing purpose.
- **Affected:** Ledger plan, maintained context, navigation, home screen, update fixtures, specialist handoff, and demo narrative.

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
