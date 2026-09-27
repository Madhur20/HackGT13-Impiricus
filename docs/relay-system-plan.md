# Relay: System and Hackathon Build Plan

## 1. Product thesis

Relay is a consent-aware physician decision layer designed to fit naturally within the Impiricus product family. It supports three experiences:

1. **Practice Mirror** gives an HCP a descriptive view of their public prescribing pattern compared with a carefully defined peer cohort.
2. **Doctor Connect** assembles a structured, general clinical-practice question and routes it to an eligible, opted-in peer.
3. **Ledger**, presented to physicians as **Updates**, shows reviewed before/after pharma and drug-product changes and offers four eligible specialists for a governed discussion.

The products share a policy pipeline, not one mathematical algorithm:

```text
authenticated actor + declared purpose
                    |
                    v
eligible data, updates, or candidates
                    |
                    v
deterministic consent and policy checks
                    |
                    v
product-specific computation
                    |
                    v
grounded explanation + provenance labels
                    |
                    v
append-only audit event
```

Mirror cohort comparison, Connect peer ranking, and Ledger reviewed-version comparison remain separate computations.

## 2. Hackathon objective

The build should prove that:

- Relay creates direct, understandable value for a physician.
- Consent changes what the system can compute, display, and disclose.
- Explanations are grounded in structured evidence rather than model invention.
- A reviewed medicine update can move cleanly into a governed peer discussion.
- The experience looks and feels compatible with the existing Impiricus/DocUpdate product environment.

The submission is a synthetic prototype, not a clinical decision-support system. If public CMS records are included, label them as historical public data and never portray them as a complete practice record or measure of care quality.

## 3. Scope and priority

| Priority | Product | Required proof |
|---|---|---|
| P0 | Shared foundation | Persona switching with distinct physician fixtures, consent/purpose evaluation, provenance labels, data broker, and audit events |
| P0 | Doctor Connect | Structured question, hard eligibility filters, transparent ranking, request/response, and mutual contact consent |
| P1 | Practice Mirror | One defensible cohort comparison with visible limitations and no quality claim |
| P1 | Ledger / Updates | Reviewed before/after product update, relevance reasons, four specialist options, and governed Connect handoff |
| P2 | Extensions | Reusable answers, real notification ingestion, editorial publishing workflow, and scheduled policy re-evaluation |

If time collapses, preserve one polished Doctor Connect path plus one compact, working Mirror and Updates path.

## 4. Product boundaries

### Relay may do

- Describe public prescribing data and peer-cohort differences.
- Match an opted-in HCP to another opted-in HCP using permitted profile attributes.
- Assemble a question from a governed taxonomy and record a structured peer response.
- Show reviewed facts about what changed between two versions of a synthetic medicine product.
- Explain why an update or peer appeared using only approved structured inputs.
- Hand a reviewed update into Doctor Connect using only an approved therapeutic area and discussion topic.

### Relay must not claim to do

- Determine guideline adherence, care quality, diagnosis, indication, or treatment appropriateness from Part D data.
- Recommend a prescription, dose, therapy switch, or patient-specific treatment change.
- Infer patient eligibility or clinical need from physician history.
- Verify licensure from an NPI alone.
- Guarantee that categorical inputs remove all privacy risk.
- Let an LLM authorize access, invent a product change, or select an ineligible peer.
- Claim that an off-platform handoff removes Impiricus responsibilities.

Ledger is not a client-contract editor, data-scope approval tool, or internal compliance console.

## 5. Shared domain model

### HCP profile

An HCP profile separates public identity, physician-declared interests, permitted derived features, and verification. Prototype credential status is synthetic; NPI matching does not establish licensure.

```ts
type HcpProfile = {
  id: string;
  displayName: string;
  specialty: string;
  state: string;
  therapeuticAreas: string[];
  topics: string[];
  availability: "available" | "limited" | "unavailable";
  verified: boolean;
  matchingConsent: boolean;
  contactConsent: boolean;
};
```

### Field provenance

Each usable field records its source, classification, granularity, collection time, and permitted purposes. Recommended interface labels are **Public registry**, **Physician provided**, **Permitted for matching**, **Aggregate benchmark**, and **Illustrative record**. Fictional medical/product facts keep this provenance label even when the surrounding interface is presented as the embedded Relay product.

### Consent grant

Keep these purposes distinct:

- `SELF_INSIGHT`
- `PEER_MATCHING`
- `PEER_CONTACT`
- `AGGREGATE_ANALYTICS`

Self-view, aggregate contribution, peer discovery, and contact disclosure are never one permission.

### Reviewed product change

```ts
type ReviewedProductChange = {
  id: string;
  companyName: string;
  productName: string;
  therapeuticArea: string;
  previousVersion: string;
  currentVersion: string;
  changeSummary: string;
  publishedAt: string;
  audienceSpecialties: string[];
  relevanceReasons: string[];
  suggestedTopics: string[];
  specialistIds: string[];
  provenance: Provenance[];
};
```

The prototype uses fictional companies, products, components, and dates.

## 6. Shared policy service

Every product calls one deterministic policy function before using a field, revealing identity, or returning a reviewed update:

```ts
evaluateAccess({ actor, subject, purpose, recipient, fields, jurisdiction, timestamp })
  -> {
       decision: "allow" | "deny" | "review";
       allowedFields: string[];
       deniedFields: string[];
       ruleHits: RuleHit[];
       policyVersion: string;
     }
```

Rules are versioned configuration rather than scattered conditionals. Initial fictional rules include:

- `CONSENT_MATCH_001`: peer identity requires active matching consent.
- `CONSENT_CONTACT_002`: contact fields require active contact consent from both physicians.
- `AGGREGATE_MIN_001`: a Mirror cohort must meet the configured minimum.
- `STATE_DEMO_001`: one synthetic jurisdiction combination requires review.
- `UPDATE_REVIEW_001`: Updates returns only reviewed, specialty-permitted product records.

Jurisdiction examples are synthetic and are not legal advice.

## 7. System components

### Front end

One responsive physician web application exposes Overview, Practice Mirror, Doctor Connect, the recipient Inbox, and Updates. A browser-local account session supplies the HCP identity used throughout the hackathon build. The interface has no physician switcher or URL-based inbox impersonation. Production must replace local accounts with server-side authentication and protected sessions.

The current request lifecycle synchronizes across devices through a shared Supabase demo table (`consult_requests`) that the browser reads and writes directly, with Supabase Realtime push and a 4-second polling fallback; `BroadcastChannel` and `localStorage` remain the same-browser path and local cache. The table accepts anonymous reads and writes of synthetic records only. This is not the production transport. Multi-device deployment requires an authenticated API, durable request storage, server-side policy enforcement, and a realtime channel.

The presentation follows the supplied DocUpdate references:

- floating white navigation on a pale blue canvas;
- editorial serif display headings with a neutral sans-serif UI font;
- restrained navy, violet, teal, white, and blue-gray palette;
- generous spacing and few nested cards;
- article-style update previews and a four-person specialist gallery;
- purple pill actions and clear responsive layouts.

Relay remains the product name. The design is implementation-compatible and reference-informed; it does not copy official source assets or make an official-brand claim.

### Application modules

- `profile-service`: reads HCP profile and field provenance.
- `policy-service`: evaluates consent, purpose, and disclosure conditions.
- `mirror-service`: builds cohorts and descriptive comparisons.
- `connect-service`: constructs questions, ranks peers, and manages request state.
- `ledger-service`: returns reviewed product versions, relevance reasons, and governed specialist references.
- `explanation-service`: phrases approved structured facts.
- `audit-service`: records append-only product and policy events.

These boundaries may live in one hackathon server.

### Verifiable shared contract

```ts
authorizeUse(input): AccessDecision
explainStructuredResult(input): ExplanationResult
recordAuditEvent(input): AuditEvent
renderProvenance(input): ProvenanceBadge[]
```

Product computations remain separate:

```ts
computeCohortComparison(...) // Practice Mirror
rankEligiblePeers(...)       // Doctor Connect
compareReviewedVersions(...) // Ledger / Updates
```

### Data-access chokepoint

Feature code must not query restricted profile or consent collections directly. A data broker accepts actor, purpose, subject, recipient, and requested fields, calls the policy service, and returns only allowed data.

### Data store

Suggested production collections:

- `hcp_profiles`
- `field_provenance`
- `consent_grants`
- `question_taxonomy`
- `consult_requests`
- `peer_answers`
- `reviewed_product_changes`
- `policy_rules`
- `audit_events`

## 8. AI boundary

Gemini may phrase approved structured comparisons, match reasons, and reviewed product changes. It may not authorize access, create dosage advice, infer missing clinical facts, invent a component or citation, bypass peer eligibility, or choose the final peer. Every generated explanation must have a deterministic offline fallback.

## 9. API surface

```text
GET  /api/me/profile
GET  /api/me/consents
PUT  /api/me/consents/:purpose
POST /api/policy/evaluate

GET  /api/mirror/summary
GET  /api/mirror/comparisons/:drugClassId

GET  /api/connect/taxonomy
POST /api/connect/questions/preview
POST /api/connect/requests
GET  /api/connect/requests/:id/matches
POST /api/connect/requests/:id/select
POST /api/connect/requests/:id/respond
POST /api/connect/requests/:id/contact-consent

GET  /api/updates
GET  /api/updates/:updateId
GET  /api/updates/:updateId/specialists
```

Derived responses include provenance, policy version, and explanation inputs.

## 10. Audit, safety, and security

Audit events record time, actor, action, internal subject IDs, purpose, policy version, rule hits, decision, and input hash. Do not record patient details, private Mirror values, or off-platform conversation content.

Baseline controls:

- synthetic profiles, companies, products, components, and jurisdictions only;
- server-side role, validation, consent, and policy enforcement;
- no file uploads, unbounded clinical text, patient narratives, or exact dose fields;
- transport encryption, redacted logs, protected secrets, and rate limits in production;
- report, block, moderation, suspension, pharmacovigilance, and product-complaint workflows on the production roadmap.

## 11. Repository structure

```text
apps/       delivery surfaces
features/   Mirror, Connect, and Ledger computations/use cases
packages/   shared domain, policy, broker, explanations, audit, and demo seed
config/     governed taxonomies and rules
tests/      cross-product and browser coverage
```

## 12. Build sequence

### Phase A: shared skeleton

- Seed synthetic HCP profiles, three reviewed product changes, and fictional policy rules.
- Implement persona switching, floating navigation, provenance labels, data broker, and audit writer.
- Create deterministic offline responses.

### Phase B: Doctor Connect

- Build governed selections and required general-question confirmation.
- Apply hard filters before ranking.
- Implement request, response, and mutual-consent contact reveal.

### Phase C: Practice Mirror

- Load a small precomputed class-level dataset.
- Show share, median, interquartile range, cohort definition, coverage caveat, and provenance.

### Phase D: Ledger / Updates

- Show three reviewed, fictional product changes in a left-side selector with one focused right-side detail panel and previous/next controls.
- Display the selected before/after version, relevance reasons, and limitations.
- Display exactly four eligible specialists without contact details.
- Pass only approved topic context into Doctor Connect.

### Phase E: hardening

- Add deterministic failure states and browser coverage.
- Verify consent changes recompute Connect results.
- Verify restricted facts never appear in explanations.
- Rehearse a clean-clone, offline demo on desktop and phone-sized screens.

## 13. Demo script

1. **Overview:** introduce one physician workspace inside the Impiricus visual environment.
2. **Mirror:** show a descriptive class-level difference and its limitations.
3. **Updates:** select a reviewed product change, show before/after facts, and introduce four specialists.
4. **Connect:** continue with the approved topic, confirm the question is general, and show only eligible peers.
5. **Consent proof:** demonstrate that contact information remains hidden until mutual consent.

## 14. Acceptance criteria

- A revoked matching consent removes that HCP from candidate results.
- Contact details remain hidden until both HCPs approve.
- No generated explanation contains a fact absent from its structured input.
- Mirror never makes an adherence, quality, indication, or treatment claim.
- Updates shows concrete before/after facts, provenance, relevance reasons, and exactly four specialists.
- The Updates handoff passes only an approved therapeutic area and discussion topic.
- Updates never recommends changing a prescription or presents a patient-specific conclusion.
- Every policy decision creates an audit event.
- The demo works offline with seeded data and deterministic explanations.
- Desktop and phone-sized core paths pass visual review.

## 15. Decisions requiring Impiricus review

- Impiricus's actual role and obligations when peer discussions relate to treatment.
- Whether production Updates may name brands or should use classes only.
- Editorial source verification and publishing ownership for medicine changes.
- Required adverse-event and product-complaint intake procedures.
- The credentialing source and re-verification cadence.
- Compensation, fair-market-value, and transparency rules if experts are paid.
- Which interaction-derived fields may support update relevance or peer matching.
- The jurisdictions and policies the production rules engine must encode.

## 16. Reference notes

- CMS describes Part D provider-and-drug data as prescription fills and costs for Medicare Part D beneficiaries and warns that the data does not represent a physician's full practice or establish care quality: <https://data.cms.gov/tools/medicare-part-d-prescriber-look-up-tool>
- CMS states that NPI issuance does not validate licensure or credentials: <https://download.cms.gov/nppes/NPI_Files.html>
- HHS explains that HIPAA de-identification uses Safe Harbor or Expert Determination and does not reduce identification risk to zero: <https://www.hhs.gov/hipaa/for-professionals/special-topics/de-identification/index.html>
- FDA safety-data guidance is one reason a pharma-linked peer workflow needs defined safety escalation and product-complaint handling: <https://www.fda.gov/regulatory-information/search-fda-guidance-documents/e2dr1-post-approval-safety-data-definitions-and-standards-management-and-reporting-individual-case>
