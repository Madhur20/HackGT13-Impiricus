# Relay decision record

This file records durable decisions. New entries should include a date, status, decision, reason, and affected areas. If a decision changes, add a new entry and mark the old one superseded rather than erasing history.

## Accepted baseline decisions

### 2026-09-26 — Mutual email reveal and per-account unread state

- **Status:** Accepted
- **Decision:** Resolve each physician's actual email from the account directory only after the contact policy confirms both approvals. Show the reciprocal email on both requester and responder surfaces, and hide it again if either approval is revoked. Track recipient-request and requester-answer reads separately so Inbox and Doctor Connect badges count only unread events for the active account.
- **Reason:** Contact disclosure must be reciprocal, consent-gated, and tied to real account identity, while notification badges must represent outstanding attention rather than permanent workflow history.
- **Affected:** Doctor Connect, Inbox, account directory, consult state, navigation badges, policy enforcement, tests, and product documentation.

### 2026-09-26 — Authenticated two-sided Doctor Connect with local realtime preview

- **Status:** Superseded by the required account-bound identity decision below
- **Decision:** Provide separate requester and recipient Inbox surfaces. Use the official Auth0 React SDK for identity when configured, with a namespaced Relay HCP-ID claim. Use `BroadcastChannel` and `localStorage` only for same-browser product preview; require an authenticated API, durable persistence, server-side authorization, and realtime datastore for multi-device deployment.
- **Reason:** The product needs to show real send, accept, answer, and dual-consent behavior now without falsely treating Auth0 as a messaging backend or client-side storage as production security.
- **Affected:** Doctor Connect, Inbox, authentication, request state, deployment, documentation, and security backlog.

### 2026-09-26 — Product presentation with explicit illustrative provenance

- **Status:** Accepted
- **Decision:** Remove “Demo” and “Synthetic data only” from product chrome. Present Relay as an embedded physician product while labeling fictional medical and product records as **Illustrative record** at the relevant data surface.
- **Reason:** Product framing should feel native to the current Impiricus experience, while clinical/product facts must not be mistaken for verified real-world records.
- **Affected:** Home, Mirror, Updates, audit copy, repository guidance, and presentation QA.

### 2026-09-26 — Required account-bound physician identity

- **Status:** Superseded by the local account entry decision below
- **Decision:** Require Auth0 before exposing Relay. Bind the active physician exclusively to the namespaced HCP claim, remove the local persona selector and inbox query impersonation, and preserve each requester's active consult across authenticated account changes. Maya and Elena are first-class directory profiles that can send requests to one another.
- **Reason:** A request must be received, accepted, and answered by the intended physician account rather than by anyone who can change a client-side profile control.
- **Affected:** Authentication gate, header, HCP fixtures, Connect matching, Inbox filtering, request snapshots, notification recovery, tests, and setup documentation.

### 2026-09-26 — Local account entry for the hackathon build

- **Status:** Accepted
- **Decision:** Remove Auth0 and provide a DocUpdate-inspired sign-in/sign-up experience backed by browser-local accounts. Passwords are stored as SHA-256 hashes, sessions remain account-bound, and changing physicians requires sign-out/sign-in. Sign-up may activate only an existing eligible profile matched by NPI; it does not establish credential verification. Production must replace this mechanism with server-side authentication and protected sessions.
- **Reason:** The hackathon presentation needs a complete, immediately usable account flow without external tenant configuration while preserving separate physician identities.
- **Affected:** Authentication, account entry UI, HCP profile fixtures, dependencies, local persistence, setup documentation, security boundary, and Doctor Connect account switching.

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

### 2026-09-26 — DocUpdate-compatible editorial interface

- **Status:** Accepted
- **Decision:** Present Relay with the visual structure supplied in the DocUpdate references: a floating white header, pale blue canvas, editorial serif display type, restrained navy/violet/teal palette, generous whitespace, article-style update previews, purple pill actions, and a four-person specialist gallery. Preserve Relay naming and repository-owned UI assets.
- **Reason:** The prototype should feel like an extension that could live naturally beside the current physician product rather than a separate dense SaaS dashboard.
- **Affected:** Shared web shell, Overview, Updates, responsive design, design QA, and the integrated system plan.

### 2026-09-26 — Persona switching changes physician data

- **Status:** Superseded by the required account-bound physician identity decision
- **Decision:** Each synthetic HCP persona receives distinct Practice Mirror values, default Doctor Connect context, and Updates ordering/relevance copy. Updates keeps one compact selector and a focused right-side detail panel with previous/next navigation, and specialist counts are derived from eligible returned profiles.
- **Reason:** A persona switch must demonstrate a real change in physician context, and the focused Updates layout reduces repetition while keeping the reviewed comparison visible.
- **Affected:** Demo seed, data broker, Practice Mirror, Doctor Connect, Updates, tests, and presentation guidance.

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
- **Decision:** Share consent, policy, provenance, explanation, data-access, and audit infrastructure. Keep Mirror cohort statistics, Connect ranking, and Ledger reviewed product-version comparison as separate algorithms.
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

- **Status:** Superseded by the physician-facing Ledger decision
- **Decision:** Compare normalized structured scopes, run deterministic internal policies, require authorized human review, and preserve version history. Do not ingest contracts or issue legal approval in the prototype.
- **Reason:** The product should organize evidence and enforce internal workflow without overstating legal capability.
- **Affected:** Ledger, AI boundary, review roles, audit.

### 2026-09-26 — Policy changes trigger review, not silent access changes

- **Status:** Superseded for the active product by the physician-facing Ledger decision; retained as historical internal-workflow context
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
