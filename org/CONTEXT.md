# Relay application context

Last consolidated from the project plans: 2026-09-26.

## Product thesis

Relay is a consent-aware decision layer for Impiricus. It supports three experiences:

- **Practice Mirror** gives a physician a private, descriptive comparison of their public Medicare Part D prescribing mix with a clearly defined peer cohort.
- **Doctor Connect** lets a physician compose a general clinical-practice question in four guarded fields, review exactly what will be sent, and route it to an eligible, opted-in peer.
- **Ledger** gives physicians a reviewed, versioned view of recent pharma and drug-product changes: what changed between versions, why the update is relevant, and four eligible specialists they can ask about the practical implications. It does not provide prescribing instructions or patient-specific treatment advice.

The products share a policy pipeline, not one mathematical algorithm:

```text
authenticated actor and declared purpose
  -> eligible data or candidates
  -> deterministic consent and policy checks
  -> product-specific computation
  -> grounded explanation and provenance labels
  -> append-only audit event
```

The hackathon prototype must prove direct HCP value, visible consent effects, evidence-grounded explanations, and a governed handoff from a reviewed medicine update into peer discussion.

## Scope and priority

| Priority | Area | Required proof |
|---|---|---|
| P0 | Shared foundation | Authenticated HCP identity, purpose and consent evaluation, provenance labels, data broker, and audit events |
| P0 | Doctor Connect | Structured question, hard eligibility filters, transparent ranking, request/response flow, and mutual contact consent |
| P1 | Practice Mirror | One defensible cohort comparison with visible limits and no quality claim |
| P1 | Ledger | One reviewed before/after drug-product update with relevance reasons, four specialist options, and a governed Connect handoff |
| P2 | Extensions | Network Graph learning matcher (expertise + trust), reusable answers, DocUpdate targeting, and scheduled policy re-evaluation |

If time collapses, preserve one polished Doctor Connect path plus one compact, working path for Mirror and Ledger. The demo uses prepared synthetic data and must work without a network connection.

## Shared domain model

### HCP profile

An HCP profile has four separate areas:

- Public profile: display name, NPI, taxonomy/specialty, and state.
- Declared profile: therapeutic areas, experience tags, languages, and availability.
- Derived profile: named engagement features, class-level prescribing statistics, expertise-graph tags with evidence, and validated peer-trust signals.
- Verification: NPI match and credential status. Credential status is synthetic in the prototype; NPI issuance does not prove licensure.

### Field provenance

Every usable field identifies its path, source, classification, granularity, collection time, permitted purposes, and optional retention date.

- Sources: `NPPES`, `CMS_PART_D`, `HCP_DECLARED`, `IMPIRICUS_INTERACTION`, `SYNTHETIC`.
- Classifications: `public`, `declared`, `derived`, `restricted`.
- Granularity: `individual`, `cohort`, `aggregate`.

Use accurate UI labels such as **Public registry**, **Physician provided**, **Permitted for matching**, **Aggregate benchmark**, and **Illustrative record**. Do not merge anonymity and opt-in into one badge. Fictional clinical or product facts retain provenance without labeling the whole application as a demo.

### Consent grant

Consent records subject, purpose, data categories, audience, status, effective/expiry dates, and policy version. Purposes are separate:

- `SELF_INSIGHT`
- `PEER_MATCHING`
- `PEER_CONTACT`
- `AGGREGATE_ANALYTICS`

Self-view, aggregate contribution, peer discoverability, and contact disclosure must never be treated as one permission.

### Reviewed product change

Ledger stores an immutable reviewed change record with the company, product, prior and current versions, structured change summary, source/review provenance, relevance reasons, and specialist references for a governed discussion handoff.

## Shared system design

Use one responsive web application with physician navigation for Mirror, Connect, a recipient Inbox, Updates, and a shared Audit view. The hackathon build uses browser-local accounts with hashed passwords and an account session as the sole source of active physician identity. There is no profile selector or URL-based inbox impersonation. Different signed-in physicians receive distinct Mirror values, Connect requests, Inbox items, and Updates relevance. Production requires a server-side identity provider and protected sessions.

Doctor Connect requests have two explicit surfaces. On the requester side, four character-capped free-text fields preserve the physician's wording and do not run checks or change values while the physician types. An explicit review action scans each field independently for common name/person phrasing, exact ages and dates, contact details, record/government identifiers, addresses/precise locations, online identifiers, and safety-stop phrases. Flagged text stays visible, receives an explanatory redacted preview, and must be revised; it is never silently rewritten or stored. A valid exact age in the age field is the one disclosed transformation: review maps it to a coarse population band, shows both original and reviewed values, and stores only the band. Safe reviewed text is assembled into a question and requires the physician to confirm that it is general and non-identifying. The approved question is retained for the recipient, while temporary pre-review form state is cleared after send. Recognizable terms may derive internal matching signals without changing displayed text or bypassing the Network Graph's hard filters. The selected physician receives the request only after signing into their own account and accepts or declines it. After acceptance, the responder writes one capped general-practice answer, explicitly runs the same deterministic identifier and safety-event checks, reviews the exact output, confirms it is non-identifying professional experience, and sends it. Failed drafts never enter consult storage; only the reviewed answer is retained. Older enum-built answers remain readable for compatibility. Each physician independently controls contact sharing. Request snapshots preserve both physicians' professional identity and the reviewed question, but do not copy hidden email addresses. After both physicians approve email disclosure, each side sees the other physician's actual account email; either revocation hides it again. Inbox and Doctor Connect badges count unread recipient requests and unread requester answers respectively. The current browser build synchronizes this lifecycle in one browser with `BroadcastChannel` and `localStorage`; deployed multi-device use requires an authenticated API, durable database, server-side authorization, and realtime delivery.

The hackathon should be a modular monolith with conceptual modules for profiles, policy, Mirror, Connect, Ledger, explanations, and audit. The shared, importable core exposes behavior equivalent to:

```ts
authorizeUse(input): AccessDecision
explainStructuredResult(input): ExplanationResult
recordAuditEvent(input): AuditEvent
renderProvenance(input): ProvenanceBadge[]
```

The product computations stay separate:

```ts
computeCohortComparison(...) // median and quartiles for Mirror
rankEligiblePeers(...)       // filtered weighted scoring for Connect
matchNetworkPeers(...)       // expertise + trust graph contextual-bandit ranking for Connect
compareReviewedVersions(...) // normalized before/after product-version comparison for Ledger
```

All feature reads pass through a data broker that accepts actor, subject, purpose, recipient, and requested fields. It calls the policy service and returns only allowed data. Feature code must not read restricted profiles or consent collections directly.

Suggested MongoDB collections are `hcp_profiles`, `field_provenance`, `consent_grants`, `question_taxonomy`, `consult_requests`, `peer_answers`, `reviewed_product_changes`, `policy_rules`, `audit_events`, and the Network Graph collections `expertise_tags`, `expertise_edges`, `peer_help_profiles`, `trust_edges`, and `connection_feedback`.

## Deterministic policy service

The core decision accepts actor, subject, purpose, recipient, fields, jurisdiction, and time. It returns `allow`, `deny`, or `review`, plus allowed/denied fields, rule hits, and policy version.

Rules are versioned configuration with IDs, descriptions, purposes, audiences, classifications, effective dates, severity, and internal citations. Initial fictional rules include:

- `CONSENT_MATCH_001`: peer identity requires active matching consent.
- `CONSENT_CONTACT_002`: contact fields require active contact consent from both physicians.
- `UPDATE_REVIEW_001`: Updates returns only reviewed records permitted for the physician's specialty.
- `AGGREGATE_MIN_001`: cohorts must meet the configured minimum.
- `STATE_DEMO_001`: a synthetic jurisdiction combination requires manual review.

Ledger updates use the same policy version, provenance, and audit foundation as the other products. Rule edits create new versions and audit events.

## Practice Mirror

Practice Mirror is a private reflection tool, not a clinical recommendation or quality score.

The prototype shows 3–5 class aggregates for one synthetic HCP. A comparison displays the physician's class share, cohort median, middle 50%, cohort size, year, named denominator, provenance, and a coverage warning. It uses a same-specialty, same-year state cohort when large enough and falls back to a national specialty cohort. The current demo rule uses at least 11 HCPs, clearly labeled as a Relay rule rather than a CMS standard. Suppressed or incomplete records never enter the distribution.

Required visible limits include Medicare Part D coverage only and the absence of diagnosis, indication, contraindication, outcome, and full-practice data. Never use “adherence,” “quality,” “underprescribing,” “indicated patients,” or red clinical-alert styling.

The optional next step can open Doctor Connect with only the drug-class context, open approved educational information, or dismiss the topic. It must not infer why the physician differs from peers.

Core endpoints:

- `GET /api/mirror/summary`
- `GET /api/mirror/comparisons/:drugClassId`
- `POST /api/mirror/topics`

## Doctor Connect

Doctor Connect frames general practice questions and returns limited professional information for up to three eligible peers.

The versioned requester contract uses four capped free-text fields with an explicit privacy/safety review, disclosed age generalization, and internal matching signals. The responder uses one capped answer field with the same explicit privacy/safety review, preview, and confirmation. Neither side has open chat, attachments, patient narrative capture, or exact dose-entry fields.

Hard filters run before ranking. A candidate must be verified, available, actively consented for matching, permitted for the selected subject, conflict-free, jurisdiction/program eligible, and different from the requester. Require a minimum evidence floor and return an honest no-match state instead of weakening it.

The prototype weighted score is:

```text
0.35 therapeutic-area experience
+ 0.25 topic experience
+ 0.15 population/condition overlap
+ 0.10 specialty fit
+ 0.10 response reliability
+ 0.05 timezone/availability fit
```

Weights are assumptions and belong in configuration. Public prescribing volume cannot dominate or stand in for expertise. Explanations expose at most three reasons and only fields that actually contributed.

The request state machine covers draft, preview, safety check, match, send, accept/decline/expire, answer, close, contact request, partial consent, and shared/declined/expired contact. Every transition is audited. Contact data lives in a protected collection and is returned only after both physicians opt in; retrieval must re-check active consent and account eligibility.

New responses retain only the responder's privacy-reviewed general-practice answer plus guardrail/taxonomy version and timestamp. They avoid exact dose-entry fields. Older structured answers remain readable. Any future reusable answers are labeled as peer experience, dated, moderated, consented for reuse, and removable.

One demo selection must trigger a fictional pharmacovigilance safety stop. Do not claim that it satisfies FDA obligations. Production needs defined adverse-event and product-quality intake, ownership, capture, and timing.

Core endpoints include taxonomy, question/answer privacy preview, answer search, request creation, matches, peer selection/decision, reviewed answer submission, contact consent/retrieval, and report.

## Relay Network Graph (expertise and trust)

The Network Graph is the learning substrate under Doctor Connect matching. It models physicians as a graph of expertise and validated peer help rather than a flat directory, so Relay can route an isolated physician to the right peer for a specific problem. It reuses the shared consent, policy, provenance, explanation, and audit foundation; it does not add a second consent model. See `docs/network-graph-plan.md` for the detailed plan.

Two graphs answer two questions:

- **Expertise Graph — "who knows what."** `EXPERTISE_IN` edges connect a physician to typed tags (`specialty`, `condition`, `drug_class`, `topic`, `skill`, `affiliation`). Each edge carries evidence sources (`SELF_DECLARED`, `SPECIALTY`, `PUBLICATION`, `IMPIRICUS_SIGNAL`, `SYNTHETIC`) and a derived strength in [0, 1] that rises as independent sources corroborate it.
- **Trust Graph — "who has successfully helped whom."** A `SUCCESSFUL_PEER_CONNECTION` edge from requester to expert, scoped to a topic, is created or reinforced only from post-connection feedback. It stores interaction and success counts, a usefulness average, and a timestamp — never patient data or off-platform content.

Matching is a deterministic funnel that keeps Doctor Connect's rule that hard filters precede ranking: specialty pool → required-expertise match above an evidence floor → peer-support opt-in and requested help mode → verified + active matching consent + availability (policy engine) → contextual-bandit ranking → strongest matches, or an honest no-match. Ranking weights expertise evidence and validated trust; prescribing volume and NPI alone never substitute for expertise.

Ranking over the eligible set is a **contextual bandit (reinforcement learning)**: the request plus each peer's expertise evidence is the context, the eligible peers are the actions, and consented feedback (`yes`/`somewhat`/`no` → `1.0`/`0.5`/`0.0`) is the reward, kept as a Beta posterior per (expert, topic). The default policy is deterministic **UCB** (exploit proven experts, add a shrinking exploration bonus so promising under-connected peers still surface; bonus is `0` with no feedback yet, keeping the demo reproducible); optional seeded **Thompson sampling** is the stochastic variant. All hard filters run before the bandit, and the trust estimate stays clamped to its bounded weight so exploration never surfaces an ineligible peer or overrides real expertise.

The graph learns: every completed, consented connection produces structured feedback (useful? outcome?) that updates the Trust Graph posterior, so later matches improve (better graph → better matches → more useful connections → more feedback). The hackathon derives limited internal matching signals from reviewed requester text without changing it; any future Gemini intent extraction needs a deterministic fallback and cannot decide eligibility or the final peer. The graph stores zero patient data.

## Ledger

Ledger is a physician-facing medicine-change explorer, shown in navigation as **Updates**. A reviewed update names the synthetic company and product, shows the previous and current versions, states the concrete change (for example, component X was replaced by component Y), and explains why the physician is seeing it.

Each update offers exactly four eligible, verified, opted-in specialists from the governed peer directory. “Ask a peer about this” passes only the therapeutic area and approved topic into Doctor Connect. It never passes patient data, inferred treatment decisions, or a prescription recommendation. Specialist contact remains subject to Doctor Connect’s mutual-consent flow.

The Ledger computation is a semantic before/after comparison over reviewed product records. Policy, provenance, relevance filtering, and audit remain shared Relay capabilities. Ledger does not expose client data contracts, approve data scope, interpret legal text, or make clinical decisions.

Core prototype data includes three synthetic industry changes, specialty relevance reasons, provenance labels, and four eligible specialist references per update. The desktop interface uses a compact selector beside one focused change panel with previous/next controls. Production still needs editorial review, source verification, pharmacovigilance and product-complaint handling, and a decision on whether brands can be shown.

## Explanations and AI boundary

Create the factual structured payload first. Gemini may rewrite comparisons, match reasons, or reviewed product changes into concise prose. It cannot:

- authorize a field or identity disclosure;
- decide legality or approve Ledger changes;
- infer missing clinical facts;
- recommend dosage or treatment;
- bypass deterministic candidate eligibility or choose the final peer;
- invent a citation, source, rule hit, or explanation fact.

Validate generated output against a schema and prohibited-language rules. Every screen needs a reviewed deterministic template fallback. The UI displays structured evidence next to generated summaries.

## Audit, privacy, and security

Audit events record time, actor, action, internal subject IDs, purpose, policy version, rule hits, decision, input hash, and optional previous-event hash. A prototype hash chain demonstrates tamper evidence, not immutability or blockchain.

Do not record patient details, Mirror values, or off-platform conversation content. Mirror logs an authorized self-view. Connect prefers internal IDs over NPI. Ledger retains reviewed before/after product-version identifiers.

Baseline controls:

- synthetic HCPs, companies, products, components, and jurisdictions only;
- server-side roles, validation, consent, and policy enforcement;
- no file uploads or unbounded clinical text;
- secrets outside the repository, transport encryption, redacted logs, and rate limits;
- report, block, moderation, suspension, and safety workflows on the production roadmap.

## Demo spine

The strongest proof of shared infrastructure is the common audit timeline with one policy version, not a raw profile object.

1. State that Relay applies one consent and provenance layer to three confirmed gaps.
2. Mirror: show a neutral class-level comparison and open cohort/coverage details.
3. Connect: enter and review a scoped free-text question, show the privacy/safety process, show only eligible peers, explain the match, and demonstrate that consent gates contact.
4. Updates: select a reviewed product change, show the before/after record and four eligible specialists, then continue into Doctor Connect with approved topic context only.
5. Open the shared audit timeline for all three products.

## Cross-product acceptance criteria

- Revoked matching consent removes the HCP from results immediately.
- Contact details remain hidden until both physicians consent and still pass retrieval-time checks.
- No generated explanation includes a fact absent from its structured inputs.
- Mirror never claims adherence, quality, indication, or treatment appropriateness.
- Updates never recommends changing a prescription or presents a patient-specific conclusion.
- Every reviewed update shows provenance, relevance reasons, and four specialist options.
- Every displayed data point has a provenance label.
- Every policy decision creates an audit event.
- Restricted fields cannot leak into explanations.
- Network Graph matching applies hard filters before the contextual-bandit ranking, ranks on expertise and validated trust (bandit reward) rather than prescribing volume or NPI alone, keeps a deterministic UCB fallback so exploration never surfaces an ineligible peer, updates the trust posterior only from consented post-connection feedback, and stores no patient data.
- The seeded demo and explanation fallbacks work offline.

## Production questions requiring Impiricus review

- Platform role and obligations for treatment-related peer discussions.
- Whether Connect can mention brands, classes only, or both.
- Pharmacovigilance and product-complaint procedures.
- Credentialing authority and re-verification cadence.
- Compensation, fair-market-value, and transparency rules.
- Permitted uses of interaction-derived matching features.
- Reviewed-update retention, source verification, export, and audit requirements.
- Real jurisdictions and policies for the rule engine.
