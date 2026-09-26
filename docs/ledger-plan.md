# Ledger: Product and Engineering Plan

## 1. Product purpose

Ledger gives Impiricus staff a controlled workflow for proposing, reviewing, approving, and auditing changes to the data a pharma client may receive. It replaces an informal comparison of emails, spreadsheets, and contract language with a structured record of the operative data scope.

The product promise is:

> “See exactly what changed, which internal policies apply, who approved it, and when the new scope became effective.”

Ledger does not interpret contracts or issue legal approval. It organizes facts and routes decisions to authorized reviewers.

## 2. User and job

### Requester

An Impiricus client-services, analytics, or product employee who wants to add, remove, or modify a client-visible field.

Job: “Describe the change once and send a complete, consistent proposal to the right reviewers.”

### Reviewer

An authorized privacy, compliance, legal, or data-governance employee.

Job: “Understand the delta and relevant internal rules without reconstructing the agreement history.”

### Auditor/administrator

Job: “Reproduce what data scope applied on a given date and why it was approved.”

## 3. Hackathon scope

### Build

- Two synthetic pharma clients.
- One current approved schema per client.
- A proposal form for adding one field.
- A semantic, field-level diff.
- Deterministic checks for consent purpose, client scope, data classification, aggregation, and one synthetic jurisdiction rule.
- Reviewer decision with comment.
- Version timeline and common audit-event view.

### Exclude

- Contract ingestion or legal-text extraction.
- Electronic signatures.
- A pharma-client portal.
- Automatic legal approval.
- Real state-law logic.
- Production document retention or records-hold behavior.

## 4. Core concepts

### Data catalog entry

Ledger evaluates a governed catalog field, not an arbitrary string.

```ts
type DataCatalogField = {
  id: string;
  displayName: string;
  path: string;
  description: string;
  source: string;
  classification: "public" | "declared" | "derived" | "restricted";
  granularity: "individual" | "cohort" | "aggregate";
  supportedPurposes: string[];
  refreshCadence: string;
  retentionClass: string;
  ownerTeam: string;
};
```

### Allowed field

```ts
type AllowedField = {
  fieldId: string;
  alias?: string;
  allowedGranularity: "individual" | "cohort" | "aggregate";
  filters?: Record<string, string | string[]>;
  minimumGroupSize?: number;
  purpose: string;
  retentionDays: number;
};
```

### Contract version

```ts
type ClientDataContractVersion = {
  id: string;
  clientId: string;
  version: number;
  status: "draft" | "in_review" | "approved" | "rejected" | "superseded";
  allowedFields: AllowedField[];
  effectiveAt?: string;
  expiresAt?: string;
  previousVersionId?: string;
  createdBy: string;
  createdAt: string;
  decision?: ReviewDecision;
};
```

## 5. Workflow

```text
DRAFT
  -> SUBMITTED
  -> AUTOMATED_CHECKS_COMPLETE
  -> IN_REVIEW
  -> CHANGES_REQUESTED -> DRAFT
  -> APPROVED | REJECTED

APPROVED
  -> SCHEDULED
  -> EFFECTIVE
  -> SUPERSEDED
```

Only an authorized reviewer may approve. The requester cannot approve their own proposal. Every state change writes an audit event.

### Step 1: select a client and proposed action

Actions:

- Add field
- Remove field
- Change granularity
- Change retention
- Change purpose

For the demo, use “add field.”

### Step 2: configure the field

Select the catalog field and permitted granularity, purpose, retention, filters, and aggregation threshold. The form should prevent combinations that the catalog marks unsupported.

### Step 3: calculate the semantic diff

Compare normalized objects, not text lines. A line-level library may render text, but business logic should produce operations such as:

```json
{
  "operation": "ADD_FIELD",
  "fieldId": "engagement.last_resource_request_at",
  "newValue": {
    "granularity": "individual",
    "purpose": "campaign_measurement",
    "retentionDays": 365
  }
}
```

### Step 4: evaluate rules

The policy service returns:

- Pass
- Block
- Manual review
- Informational notice

Each result must cite an internal rule ID and version. Gemini may summarize the rule hits but cannot add or remove them.

### Step 5: reviewer decision

The reviewer sees:

- Current scope
- Proposed scope
- Structured changes
- Rule hits
- Impacted products and exports
- Requester justification
- Approval, rejection, or changes-requested controls

### Step 6: activate and audit

An approved version becomes effective at its scheduled time. Downstream export code should query the effective schema by client and timestamp rather than copying the allowed fields into application code.

## 6. Demo rule set

Use internal policy examples, clearly labeled as synthetic:

| Rule | Condition | Result |
|---|---|---|
| `CLIENT_SCOPE_001` | Field absent from current approved version | Review |
| `PURPOSE_002` | Proposed purpose not supported by catalog field | Block |
| `CONSENT_003` | Individual derived data lacks a compatible consent purpose | Block |
| `AGGREGATE_004` | Cohort export minimum group size below configured threshold | Block |
| `RETENTION_005` | Requested retention exceeds catalog maximum | Review |
| `STATE_DEMO_006` | Synthetic jurisdiction and restricted field combination | Review |

Avoid legal-sounding text such as “violates California law.” Say “Internal policy requires privacy review for this synthetic demo combination.”

Rules should live in a versioned configuration collection and pass through the same authorized repository used by the other products. A rule edit must create a new version and an audit event. Never edit an effective rule in place.

Resolve jurisdiction from the proposed use, data subjects, client agreement, recipients, and program context. The physician’s practice state alone is not a sufficient production ruleset key.

## 7. Diff algorithm

1. Resolve the current effective version.
2. Canonicalize field ordering and defaults.
3. Index `allowedFields` by `fieldId`.
4. Emit additions and removals.
5. For shared fields, compare granularity, purpose, filters, threshold, and retention.
6. Map every changed property to affected policy dimensions.
7. Run deterministic rules over the proposed full version, not only the delta.
8. Save the normalized proposal, diff, rule results, and hashes.

Running rules over the full version catches interactions between an apparently safe new field and existing fields.

## 8. Explanations

Deterministic facts:

```json
{
  "change": "Adds last resource-request timestamp at individual HCP level",
  "sourceClassification": "derived",
  "purpose": "campaign_measurement",
  "ruleHits": [
    {
      "id": "CONSENT_003",
      "severity": "block",
      "reason": "No compatible individual-level client disclosure purpose is configured"
    }
  ]
}
```

Gemini may produce:

> “The proposal adds an individual-level derived engagement timestamp. The current consent configuration does not permit this purpose for client disclosure, so the proposal cannot advance until the scope changes or an authorized reviewer resolves the issue.”

The UI must show the rule hit next to the generated summary so the summary is never the sole evidence.

## 9. Interface plan

### Client overview

- Current effective version
- Effective date
- Number of allowed fields
- Open proposals
- Recent decisions

### Proposal editor

- Action and field selector
- Purpose, granularity, retention, and threshold inputs
- Requester justification
- Live validation

### Review screen

- Left: current value
- Right: proposed value
- Center or below: structured change label
- Rule results ordered by block, review, notice
- Source and policy citations
- Decision controls

### Timeline

- Version number
- Status and effective range
- Requester and approver
- Summary of changes
- Audit event link

## 10. API plan

```text
GET  /api/ledger/catalog
GET  /api/ledger/clients/:clientId/current
GET  /api/ledger/clients/:clientId/versions
POST /api/ledger/clients/:clientId/proposals
PUT  /api/ledger/proposals/:proposalId
POST /api/ledger/proposals/:proposalId/submit
GET  /api/ledger/proposals/:proposalId/diff
POST /api/ledger/proposals/:proposalId/review
POST /api/ledger/proposals/:proposalId/activate
GET  /api/ledger/clients/:clientId/scope?at=timestamp
```

All mutation endpoints require actor identity and role. Use optimistic concurrency or a version field so two reviewers cannot silently overwrite each other.

## 11. Audit and integrity

Store:

- Actor and role
- Timestamp
- Before and after version IDs
- Normalized diff hash
- Policy version
- Rule results
- Decision and comment
- Effective date

Use append-only events in the prototype. A hash chain can demonstrate tamper evidence, but do not call it blockchain or claim it prevents all modification. Production would also require database access controls, backups, retention policies, and monitoring.

## 12. Re-evaluation

The proposed Vultr scheduled job is useful only if it demonstrates a real lifecycle:

1. A policy rule gains a new version or effective date.
2. The job identifies effective client schemas using affected field classifications.
3. It reruns the relevant rules.
4. It opens a review task when the decision changes.
5. It does not silently revoke or expand client access.

For the hackathon, a “Simulate policy update” button is more reliable and easier to demonstrate than waiting for a scheduler. The background job can remain an architectural note.

The simulator should create a new policy version, rerun affected schemas, and open a review task. It must not silently change client access. This gives Vultr a credible future hosting role without making the live demo depend on a scheduled job.

## 13. Tests

### Diff

- Addition, removal, and property change produce distinct operations.
- Field order changes produce no diff.
- Default normalization prevents false changes.
- Full-version evaluation catches field interactions.

### Authorization

- Requester cannot self-approve.
- Unauthorized HCP role cannot access Ledger.
- Approved version cannot be edited.
- Activation uses the approved hash.

### Rules

- Each seeded rule fires on its exact fixture.
- A block prevents approval.
- A review result requires a reviewer disposition.
- Gemini failure does not remove rule results.

### History

- Querying a past timestamp resolves the correct version.
- Superseding preserves the earlier version and audit events.

## 14. Success measures

Prototype:

- Time to identify the changed field and rule hit.
- Percentage of testers who understand that the system recommends review rather than giving legal approval.
- Complete audit record for every demo mutation.

Production candidates:

- Median proposal-to-decision time.
- Number of incomplete proposals returned for missing information.
- Policy exceptions found before activation.
- Time required to answer a historical access question.
- Number of downstream exports prevented from using out-of-scope fields.

## 15. Demo fixture

Current schema permits:

- Public NPI specialty at individual level.
- State-level aggregate engagement counts.
- Aggregate resource requests with a minimum group size.

Proposal:

- Add `last_resource_request_at` at individual level for campaign measurement.

Expected outcome:

- The field-level diff is obvious.
- `CLIENT_SCOPE_001` sends it to review.
- `CONSENT_003` blocks it because the configured disclosure purpose is absent.
- Changing granularity to aggregate and setting the group-size threshold clears the block but retains review.
- The reviewer approves the revised proposal.
- The timeline shows a new scheduled version and shared audit event.

Add one final demo action: simulate a policy-version change and show Ledger reopening the approved scope for review while leaving current access unchanged. This is a stronger lifecycle demonstration than merely showing a cron configuration.

## 16. Production roadmap

1. Inventory real data fields and owners.
2. Convert existing client scopes into reviewed structured versions.
3. Define the authoritative relationship between structured scope and contract text.
4. Integrate identity, roles, and separation of duties.
5. Add reviewer routing and service-level targets.
6. Connect enforcement to actual client exports and dashboards.
7. Add policy-change impact analysis.
8. Add retention and deletion controls.
9. Consider a limited client-facing review portal only after the internal workflow is stable.
