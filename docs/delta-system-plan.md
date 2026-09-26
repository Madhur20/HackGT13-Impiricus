# Delta: System and Hackathon Build Plan

## 1. Product thesis

Delta is a consent-aware decision layer for Impiricus. It supports three experiences:

1. **Practice Mirror** gives an HCP a descriptive view of their public prescribing pattern compared with a carefully defined peer cohort.
2. **Doctor Connect** assembles a structured clinical-practice question and routes it to an eligible, opted-in peer.
3. **Ledger** helps Impiricus staff review and approve changes to the data fields a pharma client may receive.

The products should not claim to run the same mathematical algorithm. Benchmarking, peer ranking, and schema comparison are different computations. Their legitimate shared foundation is the policy pipeline around those computations:

```text
authenticated actor + declared purpose
                    |
                    v
eligible data and candidates
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
immutable audit event
```

This framing preserves the original “one engine, three products” story without overstating technical reuse.

## 2. Hackathon objective

The hackathon build should prove four things:

- Delta produces direct value for an HCP.
- Consent changes what the system can compute and display.
- Explanations come from structured evidence rather than model invention.
- The same policy and provenance infrastructure supports an internal commercial workflow.

The submission is a prototype, not a clinical decision-support system or a production compliance system. Use synthetic profiles and agreements in the demo. If public CMS records are included, label them as public historical data and do not portray them as complete practice data or a measure of care quality.

## 3. Scope and priority

| Priority | Product | Required proof |
|---|---|---|
| P0 | Shared foundation | Login persona, consent/purpose evaluation, provenance labels, audit events |
| P0 | Doctor Connect | Structured question, eligible-peer ranking, explanation, request and acceptance flow |
| P1 | Practice Mirror | One cohort comparison with coverage caveat and no quality claim |
| P1 | Ledger | One proposed field addition, structured diff, deterministic flags, approval record |
| P2 | Extensions | Reusable answer library, DocUpdate targeting, scheduled policy reevaluation |

If time collapses, keep one polished Doctor Connect path and one compact screen each for Mirror and Ledger. Do not weaken the core path to implement secondary dashboards.

## 4. Product boundaries

### Delta may do

- Describe public prescribing data and peer-cohort differences.
- Match an opted-in HCP to another opted-in HCP using permitted profile attributes.
- Assemble a question from a governed taxonomy.
- Record a structured peer response.
- Compare versions of a data-sharing schema.
- Explain which structured facts and rules produced a result.

### Delta must not claim to do

- Determine guideline adherence from Part D prescribing counts alone.
- Infer patient diagnoses, outcomes, eligibility, or treatment appropriateness.
- Verify licensure from an NPI alone. CMS states that NPI issuance does not establish licensure or credentials.
- Guarantee that categorical inputs eliminate all privacy risk.
- Provide legal conclusions or let an LLM approve a data-sharing change.
- Claim that an off-platform handoff automatically removes Impiricus liability.

Those distinctions should appear in the engineering docs and be reflected in visible product copy where relevant.

## 5. Shared domain model

The original two-state consent flag is too coarse. Model data, permission, and purpose separately.

### HCP profile

```ts
type HcpProfile = {
  id: string;
  npi: string;
  publicProfile: {
    displayName: string;
    taxonomyCodes: string[];
    specialtyLabel: string;
    state: string;
  };
  declaredProfile: {
    therapeuticAreas: string[];
    experienceTags: string[];
    languages: string[];
    availability: "available" | "limited" | "unavailable";
  };
  derivedProfile: {
    engagementTags: string[];
    prescribingClassStats: PrescribingClassStat[];
  };
  verification: {
    npiMatched: boolean;
    credentialStatus: "unverified" | "verified" | "expired";
    checkedAt?: string;
  };
};
```

For the prototype, `credentialStatus` is synthetic. Production would require a trusted credentialing source beyond NPPES.

### Field-level provenance

```ts
type DataField = {
  path: string;
  source: "NPPES" | "CMS_PART_D" | "HCP_DECLARED" | "IMPIRICUS_INTERACTION" | "SYNTHETIC";
  classification: "public" | "declared" | "derived" | "restricted";
  granularity: "individual" | "cohort" | "aggregate";
  collectedAt: string;
  permittedPurposes: Purpose[];
  retentionUntil?: string;
};
```

### Consent grant

```ts
type ConsentGrant = {
  hcpId: string;
  purpose: "SELF_INSIGHT" | "PEER_MATCHING" | "PEER_CONTACT" | "AGGREGATE_ANALYTICS";
  dataCategories: string[];
  audience: "SELF" | "OPTED_IN_HCPS" | "IMPIRICUS_STAFF" | "CLIENT_AGGREGATE";
  status: "active" | "revoked" | "expired";
  effectiveAt: string;
  expiresAt?: string;
  policyVersion: string;
};
```

Do not use “anonymized and opted-in” as one badge. Those concepts answer different questions. Recommended UI labels are **Public registry**, **Physician provided**, **Permitted for matching**, **Aggregate benchmark**, and **Synthetic demo data**.

### Client data contract

```ts
type ClientDataContractVersion = {
  clientId: string;
  version: number;
  status: "draft" | "in_review" | "approved" | "rejected" | "superseded";
  allowedFields: AllowedField[];
  effectiveAt?: string;
  createdBy: string;
  previousVersionId?: string;
};
```

## 6. Shared policy service

Every product calls one deterministic policy function before using a field or revealing an identity:

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

Rules are versioned data, not scattered `if` statements. A rule includes an identifier, description, affected field classifications, applicable purpose and audience, effective dates, severity, and citation or internal policy reference.

For the hackathon, implement a small, clearly fictional rule set:

- `CONSENT_MATCH_001`: peer identity requires active peer-matching consent.
- `CONSENT_CONTACT_002`: contact data requires both parties' active peer-contact consent.
- `CLIENT_SCOPE_001`: a client cannot receive a field absent from its approved schema.
- `AGGREGATE_MIN_001`: a displayed cohort must meet a configured minimum size.
- `STATE_DEMO_001`: a synthetic demo jurisdiction sends one restricted field for manual review.

Label jurisdiction examples as synthetic. Do not present them as legal advice.

## 7. System components

### Front end

One responsive web app with role-based navigation:

- HCP role: Mirror and Connect.
- Impiricus compliance role: Ledger.
- Demo role switcher: switches seeded personas without real authentication.

### Application API

- `profile-service`: reads HCP profile and field provenance.
- `policy-service`: evaluates consent, field use, and reveal conditions.
- `mirror-service`: builds cohorts and descriptive comparisons.
- `connect-service`: constructs questions, ranks peers, manages request state.
- `ledger-service`: versions schemas, computes semantic diffs, manages review.
- `explanation-service`: converts approved structured facts into plain language.
- `audit-service`: records append-only product and policy events.

These may live in one hackathon server with separate modules. The service boundaries are conceptual, not a reason to create microservices overnight.

### Verifiable shared code contract

The transcripts correctly emphasize that judges should be able to verify the shared foundation in the repository. Implement an importable `delta-core` package with these interfaces:

```ts
authorizeUse(input: AccessRequest): AccessDecision
explainStructuredResult(input: ExplanationInput): ExplanationResult
recordAuditEvent(input: AuditEventInput): AuditEvent
renderProvenance(input: DataField[]): ProvenanceBadge[]
```

All three products must call these functions. Keep the mathematical functions separate:

```ts
computeCohortComparison(...) // Practice Mirror
rankEligiblePeers(...)       // Doctor Connect
computeSchemaDiff(...)       // Ledger
```

This makes “one consent-aware engine” literally visible in code without pretending that a z-score, a cosine score, and a schema diff are the same algorithm.

### Data-access chokepoint

Feature code must not query restricted profile or consent collections directly. A repository/data-broker layer accepts actor, purpose, subject, and requested fields, calls `authorizeUse`, and returns only allowed fields. Add a test that scans imports or mocks the repositories to prove each product uses the broker.

For demo responsiveness, precompute cohort summaries and materialized peer-matching features when seed data loads. Cache derived features with a source timestamp and policy version; recompute them when source data or permission changes.

### Data store

MongoDB collections:

- `hcp_profiles`
- `field_provenance`
- `consent_grants`
- `question_taxonomy`
- `consult_requests`
- `structured_answers`
- `client_contract_versions`
- `policy_rules`
- `audit_events`

Create indexes for NPI, specialty/state cohort lookup, active consent by HCP and purpose, consult status, and client/version.

### AI boundary

Gemini may:

- Turn structured differences into readable prose.
- Summarize the structured reasons for a match.
- Produce a concise description of a schema change.

Gemini may not:

- Decide whether access is lawful.
- Create dosage recommendations.
- Infer missing clinical facts.
- Choose the final peer without deterministic eligibility checks.
- invent a citation.

Pass only approved structured facts into the prompt. Validate output against a JSON schema. Provide a deterministic template fallback so the demo still works if the model fails.

## 8. Shared API surface

```text
GET  /api/me/profile
GET  /api/me/consents
PUT  /api/me/consents/:purpose
POST /api/policy/evaluate

GET  /api/mirror/summary
GET  /api/mirror/cohorts/:id

GET  /api/connect/taxonomy
POST /api/connect/questions/preview
POST /api/connect/requests
GET  /api/connect/requests/:id/matches
POST /api/connect/requests/:id/select
POST /api/connect/requests/:id/respond
POST /api/connect/requests/:id/contact-consent

GET  /api/ledger/clients/:clientId/current
POST /api/ledger/clients/:clientId/proposals
GET  /api/ledger/proposals/:id/diff
POST /api/ledger/proposals/:id/review
```

Every response that shows derived information should include `provenance`, `policyVersion`, and `explanationInputs` fields.

## 9. Audit model

An audit event records:

```ts
type AuditEvent = {
  id: string;
  occurredAt: string;
  actorId: string;
  action: string;
  subjectIds: string[];
  purpose: string;
  policyVersion: string;
  ruleHits: string[];
  decision: "allow" | "deny" | "review";
  inputHash: string;
  previousEventHash?: string;
};
```

Do not record patient details or the content of off-platform conversations. The prototype may use a hash chain to demonstrate tamper evidence, but should describe it as tamper-evident rather than immutable.

Practice Mirror audit events should record that an authorized self-view occurred, not the values shown. Doctor Connect should log internal HCP IDs rather than NPIs wherever possible. Ledger may retain the structured before/after identifiers because those fields are the subject of the review.

## 10. Safety and security baseline

- Seed only synthetic HCPs and synthetic contracts.
- Do not accept file uploads or unbounded clinical text.
- Enforce role checks on the server, not only in the interface.
- Encrypt transport and store secrets outside the repository.
- Redact logs and use IDs rather than contact information.
- Apply rate limits to contact requests.
- Require verified HCP status before production peer discovery.
- Add abuse reporting, blocking, and account suspension to the production backlog.
- Route potential adverse-event or product-quality content to a defined pharmacovigilance workflow before any pharma-sponsored launch. FDA reporting obligations depend on role and program design, so legal and safety teams must define this process.

## 11. Suggested repository structure

```text
apps/
  web/
  api/
packages/
  domain/
  policy-engine/
  explanations/
  demo-seed/
features/
  practice-mirror/
  doctor-connect/
  ledger/
```

Keep policy evaluation and provenance rendering in shared packages. Keep the three computations in their own feature modules.

## 12. Build sequence for the remaining hackathon time

### Phase A: vertical skeleton

- Seed 30–50 synthetic HCP profiles, two client contracts, and five policy rules. Include one undersized Mirror cohort, one revoked Connect candidate, and one blocked Ledger proposal.
- Implement role switching, navigation, provenance badge, and audit-event writer.
- Create deterministic mock responses for all three products.

### Phase B: Doctor Connect end to end

- Build taxonomy selections and question preview.
- Filter candidates by verification, consent, availability, and conflicts.
- Rank candidates and show the score explanation.
- Implement request, acceptance, structured answer, and double-consent contact reveal.

### Phase C: Practice Mirror

- Load a small precomputed drug-class dataset.
- Define one defensible cohort.
- Show share, peer median, interquartile range, coverage caveat, and provenance.

### Phase D: Ledger

- Create current and proposed contract versions.
- Generate a field-level diff.
- Evaluate two rules and save a reviewer decision.

### Phase E: hardening

- Add failure states and deterministic fallbacks.
- Verify that revoking consent changes Connect results immediately.
- Verify that a restricted field never appears in an explanation.
- Rehearse from a clean database seed.

### Four-person split for a ten-hour build window

| Time | Engineer 1 | Engineer 2 | Engineer 3 | Engineer 4 |
|---|---|---|---|---|
| 0–2 h | Shared domain and access broker | Demo seed data | Shared shell and badges | Audit/policy fixtures |
| 2–7 h | Practice Mirror | Doctor Connect | Ledger | Integrations and deterministic explanation fallback |
| 7–8 h | Integration tests | Integration tests | Integration tests | Consent and audit timeline |
| 8–9 h | Demo fixtures and failure states | Demo fixtures and failure states | Demo fixtures and failure states | Clean-seed rehearsal |
| 9–10 h | Mirror polish | Connect polish | Ledger polish | End-to-end demo and backup recording |

If the available time is shorter, finish Connect first, then one complete Mirror comparison, then one Ledger proposal. Shared infrastructure is useful only if it supports a working user path.

## 13. Demo script for all three products

The deck currently allocates 90 seconds. Use prepared data and no typing except the categorical selections.

1. **0–10 seconds:** “Delta applies one consent and provenance layer to three confirmed Impiricus gaps.”
2. **10–30 seconds, Mirror:** show a descriptive class-level difference and open its cohort/coverage disclosure.
3. **30–60 seconds, Connect:** assemble a question, show only eligible peers, and reveal the match explanation. Trigger the mutual-contact request.
4. **60–78 seconds, Ledger:** add a proposed field, show its diff and the rule that sends it to review.
5. **78–90 seconds:** open the common audit timeline and show all three events with the same policy version.

The audit timeline is the strongest proof that the products share infrastructure. Showing a raw `DoctorProfile` object is less persuasive to a product judge.

## 14. Acceptance criteria

- A revoked matching consent removes that HCP from candidate results.
- Contact details remain hidden until both HCPs approve.
- No LLM output contains a fact absent from `explanationInputs`.
- Mirror never uses “adherence,” “quality,” or “indicated patients.”
- Ledger never labels an automated result “legally approved.”
- Every displayed data point has a provenance label.
- Every policy decision creates an audit event.
- The demo works without network access through seeded explanations.

## 15. Decisions requiring Impiricus review after the hackathon

- Impiricus’s actual role and obligations if peer discussions relate to treatment.
- Whether Doctor Connect may mention brands, classes only, or both.
- Required adverse-event and product-complaint intake procedures.
- The verified credentialing source and re-verification cadence.
- Compensation, fair-market-value, and transparency rules if experts are paid.
- Which interaction-derived fields may support individual matching.
- Contract-specific retention, audit, and export requirements.
- The jurisdictions and policies that the production rules engine must encode.

## 16. Decisions from the expanded transcript review

| Transcript proposal | Decision | Reason |
|---|---|---|
| One importable shared module | Adopt | Makes shared consent, explanation, provenance, and audit behavior verifiable |
| One universal diff/similarity function | Reject | The products perform different computations; forcing one abstraction creates misleading code |
| Direct reads of public fields and one accessor for restricted fields | Refine | All product reads should use a data broker so purpose and recipient checks apply consistently |
| Cached profile vector | Adopt with limits | Useful for demo speed, but cache only permitted, named features and invalidate on consent changes |
| “No patient data ever” | Replace | Use “Delta does not request or need patient-level data in the demo”; absolute guarantees are not supportable |
| Editable rules in Mongo | Adopt with controls | Rules should be versioned configuration, but edits require authorization and produce audit events |
| Shared audit collection | Adopt | Provides the strongest visible evidence that all three products share governance infrastructure |
| Synthetic data shaped like production schemas | Adopt | Delivers reliable demo behavior without implying production readiness or exposing real HCP data |

## 17. Reference notes

- CMS describes Part D provider-and-drug data as prescription fills and costs for Medicare Part D beneficiaries and warns that the data does not represent a physician’s full practice or establish care quality: <https://data.cms.gov/tools/medicare-part-d-prescriber-look-up-tool>
- CMS states that NPI issuance does not validate licensure or credentials: <https://download.cms.gov/nppes/NPI_Files.html>
- HHS explains that HIPAA de-identification uses Safe Harbor or Expert Determination and still does not reduce identification risk to zero: <https://www.hhs.gov/hipaa/for-professionals/special-topics/de-identification/index.html>
- FDA’s 2026 safety-data guidance addresses newer sources such as social media and patient-support programs, which is why a pharma-linked consult product needs a defined safety escalation process: <https://www.fda.gov/regulatory-information/search-fda-guidance-documents/e2dr1-post-approval-safety-data-definitions-and-standards-management-and-reporting-individual-case>
