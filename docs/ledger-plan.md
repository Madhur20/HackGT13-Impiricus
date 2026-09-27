# Ledger: Product and Engineering Plan

## 1. Product purpose

Ledger is Relay's physician-facing, reviewed medicine-change explorer. It helps a doctor understand what changed in a recent pharma or drug-product version and find specialists with whom to discuss the practical implications.

The promise is:

> "See what changed in a medicine, understand why it matters to your professional interests, and ask an opted-in specialist what they are considering."

Ledger describes reviewed facts. It does not recommend treatment, change prescriptions, infer patient eligibility, or provide patient-specific advice.

## 2. User job

> "Tell me what changed between the previous and current product versions, show me why this update is relevant, and help me discuss it with four eligible specialists."

## 3. Hackathon scope

Build:

- Three synthetic, reviewed pharma/product updates.
- A concrete before/after record, such as "component X" replaced by "component Y."
- Company, product, therapeutic area, review date, and provenance labels.
- Relevance reasons based on specialty and explicitly explored topics.
- Exactly four eligible, verified, opted-in specialists per update.
- A governed "Ask a peer about this" handoff into Doctor Connect.
- Offline deterministic copy and synthetic-data labeling.

Exclude:

- Patient-level targeting or inference.
- Automated prescribing or dosage advice.
- Clinical alerts, treatment-quality scores, or claims that a doctor must change practice.
- Unreviewed claims, invented sources, or pharma control over individual physician targeting.
- Open clinical chat, attachments, patient narratives, and exact dose-entry fields.

## 4. Reviewed product-change record

```ts
type ReviewedProductChange = {
  id: string;
  companyName: string;
  productName: string;
  therapeuticArea: string;
  previousVersion: string;
  currentVersion: string;
  changeSummary: string;
  detail: string;
  publishedAt: string;
  audienceSpecialties: string[];
  relevanceReasons: string[];
  suggestedTopics: string[];
  specialistIds: string[];
  provenance: Provenance[];
};
```

The before and current values must be structured facts supplied by the reviewed record. A summary may be generated from those facts, but the deterministic record remains visible beside it.

## 5. Relevance and specialist selection

The data broker returns only reviewed updates permitted for the physician's declared specialty and purpose. The screen explains each match with statements such as "Matches your specialty" or "You explored SGLT2 inhibitors in Practice Mirror." It must not infer a clinical need from prescribing behavior.

Specialists are selected from the same governed peer directory used by Doctor Connect. Hard filters run first: verified credential status in the synthetic demo, availability, active matching consent, permitted topic, and requester exclusion. The UI displays four eligible specialists with name, specialty, state, and "verified / opted in" status. Contact details remain hidden until Doctor Connect's mutual-consent checks pass.

## 6. Doctor Connect handoff

The handoff passes only:

- Therapeutic area or medication class.
- One approved discussion topic, such as switching, monitoring, initiation, or tolerability.

The physician must review and confirm that the question is general and does not describe a specific patient. Doctor Connect owns matching, request state, privacy-reviewed physician answers, contact consent, and safety stops.

## 7. Interface

Navigation label: **Updates**.

The desktop experience uses a compact update selector on the left and one focused detail panel on the right. Previous and next arrow controls move through reviewed updates without stacking every full change record down the page. The detail panel contains:

1. Company, product, therapeutic area, and reviewed synthetic-data label.
2. A "Before" and "Now" comparison.
3. A plain-language "What changed" summary.
4. "Why you are seeing this" relevance reasons.
5. Four specialist cards.
6. The governed Doctor Connect action.
7. Review date, version history, and limitations.

The specialist count is derived from the eligible profiles actually returned by the governed directory. The fixture and acceptance target remains exactly four.

The active product UI does not expose an internal client data-scope editor as Ledger. Policy and audit remain shared Relay foundation capabilities.

## 8. API and data access

```text
GET /api/updates?specialty=:specialty
GET /api/updates/:updateId
GET /api/updates/:updateId/specialists
```

All reads use the purpose-aware data broker. The broker returns provenance, policy version, and the deterministic access decision. Product code does not read restricted profiles or consent collections directly.

## 9. Safety and AI boundary

Ledger must show "professional discussion, not prescribing advice" near the handoff. It must not contain patient names, narratives, or treatment instructions. Gemini may phrase approved change facts and relevance reasons, but cannot invent components, sources, review status, clinical implications, or specialist eligibility. Every generated explanation has a deterministic offline fallback.

Production review is still required for source verification, editorial approval, pharmacovigilance and product-complaint intake, brand display, and any obligations around treatment-related peer discussions.

## 10. Audit and provenance

Record update reads, update-topic exploration, and Doctor Connect handoffs with actor ID, update ID, purpose, policy version, decision, and structured summary. Do not log patient details, private Mirror values, or off-platform conversation content.

Every displayed change has a provenance label. Synthetic companies, products, dates, and jurisdiction rules must remain clearly labeled as demo data.

## 11. Tests

- The broker returns only updates matching the physician's permitted specialty.
- Every update has previous and current versions, a concrete change summary, provenance, relevance reasons, and four specialist references.
- The UI displays four eligible specialists and no contact details.
- The handoff passes only the therapeutic area and approved topic.
- Generated copy cannot add facts outside the structured change record.
- Revoked matching consent removes a specialist through Doctor Connect.
- Every update read and handoff creates an audit event.
