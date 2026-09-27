# Relay decision record

This file records durable decisions. New entries should include a date, status, decision, reason, and affected areas. If a decision changes, add a new entry and mark the old one superseded rather than erasing history.

## Accepted baseline decisions

### 2026-09-27 — Email-sharing approval is one-way

- **Status:** Accepted; supersedes per-consult email approval revocation
- **Decision:** After a physician approves email sharing on a consult, the approval cannot be withdrawn. The approve button locks in the approved state on both the Inbox and Doctor Connect surfaces, and the consult store only accepts approval (`approveContact`), never a change back to unapproved. The reciprocal email is still revealed only when both physicians have approved and the contact policy allows it.
- **Reason:** Once an email address has been shown to a colleague it cannot be meaningfully un-shared, so a toggle that hid it again implied a control that did not exist.
- **Boundary:** Production contact retrieval must still re-check account eligibility and broader consent at request time. This does not change matching consent or identity rules.
- **Affected:** Consult context API, Inbox and Doctor Connect contact controls, Doctor Connect plan, maintained context.

### 2026-09-27 — Responder answer opens with an editable structured scaffold

- **Status:** Accepted; refines the guarded-text responder lifecycle
- **Decision:** The single capped responder answer is pre-filled with labelled `Approach`, `Monitoring`, `Escalation`, and optional `Additional context` lines. Suggestion chips drawn from the existing governed vocabularies write into those lines, and the physician can edit, delete, or replace any of it. Required headings that are still present must be filled or removed before review; blank optional headings are removed visibly before the scan. Answers that use the labels are displayed as sections to both physicians.
- **Reason:** Peer answers are easier to write consistently and faster to scan when they follow a common clinical shape, without losing the expressiveness of free text.
- **Boundary:** The scaffold is presentation only. Storage is still one reviewed free-text value with the same guardrail, preview, confirmation, and disposal lifecycle; no separate dose, patient-narrative, or attachment field is introduced.
- **Affected:** Inbox response builder, requester response view, Doctor Connect answer helpers and tests.

### 2026-09-27 — Responder uses the same explicit guarded-text lifecycle

- **Status:** Accepted; supersedes structured-only responder input
- **Decision:** After accepting a request, the responder writes one capped free-text answer. Relay preserves the draft while typing, runs deterministic identifier and safety-event checks only after an explicit action, blocks flagged content for revision, shows the exact reviewed answer, requires physician confirmation, revalidates at storage, retains only the approved answer, and clears temporary draft/review state. This is one answer, not open chat. Existing enum-built answers remain readable for browser-data compatibility.
- **Reason:** The answering physician needs enough expressiveness to provide useful professional context, and using the same visible review lifecycle on both sides is easier to understand and demonstrate than a separate category-only response builder.
- **Boundary:** The pattern scanner reduces risk but does not prove de-identification. Production still requires authenticated server-side validation, approved contextual classification/human review, pharmacovigilance procedures, abuse controls, and retention rules. No attachments, reply thread, patient narrative field, or exact dose-entry field is introduced.
- **Affected:** Inbox response builder, answer domain/storage, requester final-answer view, guardrail tests, plans, maintained context, and agent guidance.

### 2026-09-27 — Reviewed age generalization and expanded deterministic identifier coverage

- **Status:** Accepted
- **Decision:** Preserve every field exactly while the physician types. On the explicit privacy/safety action, convert a valid exact age entered in the age field to one of five coarse bands (`under 18`, `18–39`, `40–64`, `65–89`, `90+`), display both the entered and reviewed values, and retain only the band in the consult. Block exact-age phrases outside that field. Expand the local scanner across common variants of names/person references, dates/DOB, contact details, medical/government identifiers, addresses/precise locations, and online identifiers.
- **Reason:** The demo should visibly reduce common personal-data leakage without interrupting entry or pretending deterministic patterns prove de-identification. Age generalization preserves useful peer-matching context while removing an unnecessary exact value.
- **Boundary:** Heuristics can produce false positives and miss novel/contextual identifiers. They are a front-end and storage-boundary defense for the prototype, not a HIPAA de-identification determination or a substitute for production server validation, privacy review, monitoring, and a reviewed contextual classifier/human-review path.
- **Affected:** Doctor Connect field review, question preview, consult storage, tests, detailed plan, maintained context, and agent guidance.

### 2026-09-27 — Physician-authored scoped question with explicit guardrails

- **Status:** Accepted for requester input; its structured-only responder clause is superseded by the guarded responder decision above
- **Decision:** Let requesters keep their own wording in four capped fields and run privacy/safety review only after an explicit action. Never replace text during typing. Flag identifier patterns with an explanatory redacted preview and require physician revision; retain only the reviewed question after confirmation and clear temporary pre-review form state after send. Keep the response structured-only. The prototype uses honest deterministic local checks; an external AI classifier remains a reviewed future integration.
- **Reason:** Physicians need expressive input and must be able to see exactly what they entered, while the product still needs a visible, enforceable boundary against direct identifiers and safety-event content.
- **Boundary:** The scanner reduces risk but does not prove de-identification. The approved question must be retained for the recipient, so only temporary draft state—not the reviewed message—is described as discarded. Production requires server-side validation and approved AI/vendor handling if an AI classifier is added.
- **Affected:** Doctor Connect requester, privacy/safety pipeline, matching-signal derivation, consult validation, UI trust explanation, tests, agent guidance, and product documentation.

### 2026-09-27 — Field-scoped Doctor Connect input pipeline

- **Status:** Superseded by the physician-authored scoped question decision above
- **Decision:** Capture the requester question through four independent short blanks, resolve each against its own versioned fixed vocabulary, clear raw phrases after local resolution, require a reviewed dropdown on a miss, and reconstruct the sent question from canonical labels only. Keep the responder on enum-only controls, add a canonical response preview and explicit confirmation, and validate both payloads again at the consult boundary. Do not simulate an AI classifier while no constrained production integration exists.
- **Reason:** Field scoping and template reconstruction improve usability without allowing narrative text to enter consult storage, and the offline dropdown fallback preserves the safety boundary when local matching cannot resolve a phrase.
- **Affected:** Doctor Connect requester, Inbox response builder, domain vocabulary, consult storage boundary, tests, UI, and product documentation.

### 2026-09-26 — Account-bound local identity and two-sided consult preview

- **Status:** Accepted
- **Decision:** Bind the active synthetic physician to a browser-local account session and require sign-out/sign-in to change physicians. Add a recipient Inbox for accept/decline, structured answering, unread state, and independent contact approval. Persist and synchronize the hackathon consult lifecycle with `localStorage` and `BroadcastChannel`; resolve account email only after both physicians approve and the deterministic contact policy allows disclosure.
- **Reason:** The prototype needs to demonstrate a real requester-to-recipient workflow without weakening the existing Network Graph eligibility and contextual-bandit ranking. Account separation makes identity, unread state, and mutual contact consent visible while keeping the offline hackathon build self-contained.
- **Boundary:** Browser-local password hashing, sessions, consult state, and cross-tab delivery are not production security or persistence. Deployment requires server-side authentication, credential verification, protected sessions, authenticated APIs, durable storage, server-enforced transitions and consent checks, and realtime delivery. NPI matching remains identity matching, not credential verification.
- **Affected:** Web account entry and shell, Doctor Connect, Inbox, consult state, account-aware broker reads, synthetic account profiles, tests, and product documentation.

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

### 2026-09-26 — Mutual email reveal and per-account unread state

- **Status:** Accepted
- **Decision:** Resolve each physician's actual email from the account directory only after the contact policy confirms both approvals. Show the reciprocal email on both requester and responder surfaces, and hide it again if either approval is revoked. *(Per-consult email approval revocation superseded 2026-09-27: approval is one-way.)* Track recipient-request and requester-answer reads separately so Inbox and Doctor Connect badges count only unread events for the active account.
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

- **Status:** Superseded by the account-bound local identity decision above
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

- **Status:** Superseded for requester input by the physician-authored scoped question decision and for responder input by the guarded responder decision
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
