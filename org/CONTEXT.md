# Relay application context

Last consolidated from the project plans: 2026-09-26.

## Product thesis

Relay is a consent-aware decision layer for Impiricus. It supports three experiences:

- **Practice Mirror** gives a physician a private, descriptive comparison of their public Medicare Part D prescribing mix with a clearly defined peer cohort.
- **Doctor Connect** lets a physician assemble a general clinical-practice question from governed categories and route it to an eligible, opted-in peer.
- **Ledger** provides two role-specific views over versioned, explainable change records: physicians see reviewed updates relevant to their specialty or explicitly explored topics, while authorized Impiricus staff review and audit changes to the data fields a pharma client may receive.

The products share a policy pipeline, not one mathematical algorithm:

```text
authenticated actor and declared purpose
  -> eligible data or candidates
  -> deterministic consent and policy checks
  -> product-specific computation
  -> grounded explanation and provenance labels
  -> append-only audit event
```

The hackathon prototype must prove direct HCP value, visible consent effects, evidence-grounded explanations, and reuse of the same governance foundation in an internal commercial workflow.

## Scope and priority

| Priority | Area | Required proof |
|---|---|---|
| P0 | Shared foundation | Persona/role switching, purpose and consent evaluation, provenance labels, data broker, and audit events |
| P0 | Doctor Connect | Structured question, hard eligibility filters, transparent ranking, request/response flow, and mutual contact consent |
| P1 | Practice Mirror | One defensible cohort comparison with visible limits and no quality claim |
| P1 | Ledger | HCP: one reviewed before/after update with relevance reasons and a Connect handoff. Compliance: one proposed field addition, semantic diff, deterministic rules, reviewer action, and version record |
| P2 | Extensions | Reusable answers, DocUpdate targeting, and scheduled policy re-evaluation |

If time collapses, preserve one polished Doctor Connect path plus one compact, working path for Mirror and Ledger. The demo uses prepared synthetic data and must work without a network connection.

## Shared domain model

### HCP profile

An HCP profile has four separate areas:

- Public profile: display name, NPI, taxonomy/specialty, and state.
- Declared profile: therapeutic areas, experience tags, languages, and availability.
- Derived profile: named engagement features and class-level prescribing statistics.
- Verification: NPI match and credential status. Credential status is synthetic in the prototype; NPI issuance does not prove licensure.

### Field provenance

Every usable field identifies its path, source, classification, granularity, collection time, permitted purposes, and optional retention date.

- Sources: `NPPES`, `CMS_PART_D`, `HCP_DECLARED`, `IMPIRICUS_INTERACTION`, `SYNTHETIC`.
- Classifications: `public`, `declared`, `derived`, `restricted`.
- Granularity: `individual`, `cohort`, `aggregate`.

Use accurate UI labels such as **Public registry**, **Physician provided**, **Permitted for matching**, **Aggregate benchmark**, and **Synthetic demo data**. Do not merge anonymity and opt-in into one badge.

### Consent grant

Consent records subject, purpose, data categories, audience, status, effective/expiry dates, and policy version. Purposes are separate:

- `SELF_INSIGHT`
- `PEER_MATCHING`
- `PEER_CONTACT`
- `AGGREGATE_ANALYTICS`

Self-view, aggregate contribution, peer discoverability, and contact disclosure must never be treated as one permission.

### Client data contract

Ledger stores immutable versions with allowed fields, state, effective time, creator, and previous-version link. Effective approved versions are not edited in place.

## Shared system design

Use one responsive web application with HCP navigation for Mirror, Connect, and a physician-safe Updates view; compliance navigation exposes the internal Ledger and Audit views. Use a seeded persona switcher instead of production authentication.

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
computeSchemaDiff(...)       // normalized semantic diff for Ledger
```

All feature reads pass through a data broker that accepts actor, subject, purpose, recipient, and requested fields. It calls the policy service and returns only allowed data. Feature code must not read restricted profiles or consent collections directly.

Suggested MongoDB collections are `hcp_profiles`, `field_provenance`, `consent_grants`, `question_taxonomy`, `consult_requests`, `structured_answers`, `client_contract_versions`, `policy_rules`, and `audit_events`.

## Deterministic policy service

The core decision accepts actor, subject, purpose, recipient, fields, jurisdiction, and time. It returns `allow`, `deny`, or `review`, plus allowed/denied fields, rule hits, and policy version.

Rules are versioned configuration with IDs, descriptions, purposes, audiences, classifications, effective dates, severity, and internal citations. Initial fictional rules include:

- `CONSENT_MATCH_001`: peer identity requires active matching consent.
- `CONSENT_CONTACT_002`: contact fields require active contact consent from both physicians.
- `CLIENT_SCOPE_001`: a client cannot receive a field outside its approved schema.
- `AGGREGATE_MIN_001`: cohorts must meet the configured minimum.
- `STATE_DEMO_001`: a synthetic jurisdiction combination requires manual review.

Ledger has more detailed synthetic fixtures for unsupported purpose, consent mismatch, group size, retention, and jurisdiction review. Rule edits create new versions and audit events.

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

The versioned question taxonomy includes therapeutic area/class, topic, coarse population band, condition tags, and allowed/prohibited combinations. Unsupported combinations stop safely. The hackathon has no free-text question, category suggestion, attachments, patient narrative, or optional response note.

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

Structured responses contain approach, monitoring, escalation, and reviewed evidence-reference tags plus reuse consent. They avoid exact dose-entry fields. Reusable answers are labeled as peer experience, dated, moderated, and removable.

One demo selection must trigger a fictional pharmacovigilance safety stop. Do not claim that it satisfies FDA obligations. Production needs defined adverse-event and product-quality intake, ownership, capture, and timing.

Core endpoints include taxonomy, preview, answer search, request creation, matches, peer selection/decision, structured answer, contact consent/retrieval, and report.

## Ledger

Ledger has two strictly separated role-specific lenses over versioned changes.

For an HCP, the navigation label is **Updates**. It shows reviewed synthetic practice, resource, or industry changes with a before/after version, provenance, and explicit relevance reasons. A Spark-style notification may deep-link here. Relevance may use specialty, explicit follows, or a topic the physician explored in Mirror or Connect; it must not infer patient treatment, expose client data, or claim the physician needs clinical improvement. An update may prefill a governed Doctor Connect question.

For compliance, Ledger manages the operative structured data scope for a pharma client. It does not ingest or interpret legal text in the prototype.

A proposal selects a governed catalog field and configures granularity, purpose, retention, filters, and aggregation threshold. The diff compares canonical objects, not lines, and emits additions, removals, and property changes. Rules run against the complete proposed version so interactions with existing fields are not missed.

Only authorized reviewers can approve, request changes, or reject. A requester cannot approve their own proposal. Blocks prevent approval; review results require disposition. An approved version is activated by its approved hash at the scheduled time. Downstream exports resolve the effective schema by client and timestamp.

The main fixture adds `last_resource_request_at` at individual level for campaign measurement. It triggers scope review and a consent-purpose block. Changing to aggregate with a minimum group size clears the block while retaining review. A policy-update simulation then creates a new rule version, re-evaluates affected effective schemas, and opens a review task without silently changing current access.

Core endpoints include catalog, current scope, versions, proposal CRUD/submit, diff, review, activate, and historical scope lookup.

## Explanations and AI boundary

Create the factual structured payload first. Gemini may rewrite comparisons, match reasons, or schema changes into concise prose. It cannot:

- authorize a field or identity disclosure;
- decide legality or approve Ledger changes;
- infer missing clinical facts;
- recommend dosage or treatment;
- bypass deterministic candidate eligibility or choose the final peer;
- invent a citation, source, rule hit, or explanation fact.

Validate generated output against a schema and prohibited-language rules. Every screen needs a reviewed deterministic template fallback. The UI displays structured evidence next to generated summaries.

## Audit, privacy, and security

Audit events record time, actor, action, internal subject IDs, purpose, policy version, rule hits, decision, input hash, and optional previous-event hash. A prototype hash chain demonstrates tamper evidence, not immutability or blockchain.

Do not record patient details, Mirror values, or off-platform conversation content. Mirror logs an authorized self-view. Connect prefers internal IDs over NPI. Ledger retains before/after version identifiers because the schema is the reviewed subject.

Baseline controls:

- synthetic HCPs, contracts, and jurisdictions only;
- server-side roles, validation, consent, and policy enforcement;
- no file uploads or unbounded clinical text;
- secrets outside the repository, transport encryption, redacted logs, and rate limits;
- report, block, moderation, suspension, and safety workflows on the production roadmap.

## Demo spine

The strongest proof of shared infrastructure is the common audit timeline with one policy version, not a raw profile object.

1. State that Relay applies one consent and provenance layer to three confirmed gaps.
2. Mirror: show a neutral class-level comparison and open cohort/coverage details.
3. Connect: assemble a categorical question, show only eligible peers, explain the match, and demonstrate that consent changes the result and gates contact.
4. Ledger: add a field, show the semantic diff and deterministic review/block rules.
5. Open the shared audit timeline for all three events.

## Cross-product acceptance criteria

- Revoked matching consent removes the HCP from results immediately.
- Contact details remain hidden until both physicians consent and still pass retrieval-time checks.
- No generated explanation includes a fact absent from its structured inputs.
- Mirror never claims adherence, quality, indication, or treatment appropriateness.
- Ledger never calls an automated result legal approval.
- Every displayed data point has a provenance label.
- Every policy decision creates an audit event.
- Restricted fields cannot leak into explanations.
- The seeded demo and explanation fallbacks work offline.

## Production questions requiring Impiricus review

- Platform role and obligations for treatment-related peer discussions.
- Whether Connect can mention brands, classes only, or both.
- Pharmacovigilance and product-complaint procedures.
- Credentialing authority and re-verification cadence.
- Compensation, fair-market-value, and transparency rules.
- Permitted uses of interaction-derived matching features.
- Contract retention, export, and audit requirements.
- Real jurisdictions and policies for the rule engine.
