# Relay application context

Last consolidated from the project plans: 2026-09-26.

## Product thesis

Relay is a consent-aware decision layer for Impiricus. It supports three experiences:

- **Practice Mirror** gives a physician a private, descriptive comparison of their public Medicare Part D prescribing mix with a clearly defined peer cohort.
- **Doctor Connect** lets a physician assemble a general clinical-practice question from governed categories and route it to an eligible, opted-in peer.
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
| P0 | Shared foundation | Persona/role switching, purpose and consent evaluation, provenance labels, data broker, and audit events |
| P0 | Doctor Connect | Structured question, hard eligibility filters, transparent ranking, request/response flow, and mutual contact consent |
| P1 | Practice Mirror | One defensible cohort comparison with visible limits and no quality claim |
| P1 | Ledger | One reviewed before/after drug-product update with relevance reasons, four specialist options, and a governed Connect handoff |
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

### Reviewed product change

Ledger stores an immutable reviewed change record with the company, product, prior and current versions, structured change summary, source/review provenance, relevance reasons, and specialist references for a governed discussion handoff.

## Shared system design

Use one responsive web application with physician navigation for Mirror, Connect, and Updates, plus a shared Audit view. Use a seeded persona switcher instead of production authentication. Switching physicians must change the synthetic Mirror values, default Connect context, and Updates ordering/relevance so the demo never presents one shared dataset as two people.

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
compareReviewedVersions(...) // normalized before/after product-version comparison for Ledger
```

All feature reads pass through a data broker that accepts actor, subject, purpose, recipient, and requested fields. It calls the policy service and returns only allowed data. Feature code must not read restricted profiles or consent collections directly.

Suggested MongoDB collections are `hcp_profiles`, `field_provenance`, `consent_grants`, `question_taxonomy`, `consult_requests`, `structured_answers`, `reviewed_product_changes`, `policy_rules`, and `audit_events`.

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
3. Connect: assemble a categorical question, show only eligible peers, explain the match, and demonstrate that consent changes the result and gates contact.
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
