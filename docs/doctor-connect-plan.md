# Doctor Connect: Product and Engineering Plan

## 1. Product purpose

Doctor Connect helps an HCP frame a general clinical-practice question, find an eligible colleague with relevant experience, and request a structured peer response. The interface minimizes patient-specific input and makes matching consent visible.

The product promise is:

> “Ask a general practice question, see why a peer matches it, and connect only when both physicians agree.”

This fills the doctor-to-doctor gap described by the Impiricus team while using Impiricus’s existing strengths in HCP reach, engagement signals, and real-time routing.

## 2. Important correction to the current pitch

Categorical inputs materially reduce PHI risk, but they do not make the system airtight. A rare combination of attributes may still be identifying in context, and the optional response field can contain patient information. HHS also notes that even formally de-identified information retains some identification risk.

Likewise, moving a discussion to email or phone does not itself settle Impiricus’s legal responsibility. The prototype may implement a mutual-consent contact exchange, but production design requires legal review of Impiricus’s role, terms, safeguards, and relationship to the participating providers.

The correct claim is **risk reduction through scoped input, privacy/safety review, physician confirmation, and data minimization**, not risk elimination.

## 3. Users and jobs

### Requesting HCP

“Help me find an appropriate peer for a general question without broadcasting it to a large network.”

### Responding HCP

“Let me answer questions that fit my experience, availability, and preferences without exposing my contact details.”

### Impiricus operations/compliance

“Ensure that only verified, eligible, consenting HCPs participate and that safety events enter the correct workflow.”

## 4. Hackathon scope

### Build

- Four scoped free-text question fields that preserve the physician's wording, followed by an explicit privacy/safety check and physician review.
- Generated question preview.
- Eligibility filtering and ranked peer matches.
- “Why this match” explanation with provenance.
- Separate requester and recipient inbox surfaces.
- Real request delivery between same-browser tabs, accept/decline, and one capped privacy-reviewed responder answer with explicit preview and confirmation.
- Mutual-consent contact reveal.
- One safety stop state.
- Account-based sign-in and profile-matched sign-up.

### Exclude

- Open chat.
- Attachments, images, voice notes, and patient records.
- Exact dates, locations below a safe level, initials, or case narratives. The age field may accept an exact age while typing, but the explicit review step converts it to a disclosed coarse population range before confirmation and storage.
- Payments or honoraria.
- Unverified HCP participation.
- Pharma access to question or response content by default.

## 5. Question input and internal matching taxonomy

The requester is not required to choose taxonomy labels. Four capped free-text fields preserve the physician's wording and are reviewed under `docs/doctor-connect-input-pipeline.md`.

Relay may maintain a versioned internal taxonomy for deriving matching signals from recognizable drug classes, topics, and broad conditions. That taxonomy is matching metadata, not a replacement for the physician's visible question. Derived tags must never be presented as physician-entered text, and a classifier cannot bypass hard eligibility or choose the final peer.

The age field may contain an exact age or a general description. A valid exact age is mapped after review to `under 18`, `18–39`, `40–64`, `65–89`, or `90+`; the UI shows both the original and reviewed value, and only the range is sent. Exact ages elsewhere, exact dates, named people, contact details, addresses, record identifiers, and case narratives remain blocked. This reduces risk but does not justify a formal de-identification claim.

## 6. Request workflow

### State machine

```text
DRAFT
  -> PREVIEWED
  -> SAFETY_CHECKED
  -> MATCHED
  -> SENT
  -> ACCEPTED | DECLINED | EXPIRED
  -> ANSWERED
  -> CLOSED

ANSWERED
  -> CONTACT_REQUESTED
  -> PARTIAL_CONSENT
  -> CONTACT_SHARED | CONTACT_DECLINED | CONTACT_EXPIRED
```

Every transition writes an audit event. Contact information is returned only from the `CONTACT_SHARED` state.

### Step-by-step experience

1. The requester enters their own wording into four separately scoped fields: topic, medication area, age or age-group description, and condition context. Text remains visible and unchanged while typing.
2. When the requester explicitly continues, Relay checks each field separately for direct-identifier patterns and safety-stop phrases. A flagged field keeps its original text visible, shows the detected risk and a redacted preview, and requires revision. Safe text is not replaced except that an exact age is visibly generalized into a coarse range for preview and storage.
3. The requester must confirm: “This question does not describe a specific patient.” Peer matching remains disabled until this required confirmation is checked.
4. Relay filters and ranks candidates for the primary hackathon path.
5. A later iteration may offer reviewed reusable answers without interrupting the main peer-request flow.
6. The requester sees up to three matches but only limited professional details.
7. The requester selects one peer and sends a request.
8. The peer accepts, declines, or lets the request expire.
9. The peer writes one capped general-practice answer, explicitly runs the same privacy/safety scan, revises any flagged content, reviews the exact answer, and confirms it before sending.
10. Either physician may request continued contact. The platform reveals selected contact information only after both consent.

For the hackathon, step 9 is a single guarded answer rather than open chat: no reply thread, attachments, patient narrative field, exact dose field, or unreviewed passthrough. The current offline build applies deterministic local privacy rules to both requester and responder text and honestly labels the future approved AI-classifier boundary rather than simulating an external model.

### Implemented browser transport and authentication boundary

The requester creates the consult in Doctor Connect from peers ranked by the existing hard-filter-first Network Graph and deterministic UCB contextual-bandit matcher. The selected responder receives it in `/inbox`, where they can accept or decline, compose and review a guarded answer, send it, and independently approve email disclosure. The requester's screen updates as these actions occur.

The hackathon build uses a browser-local account and session store. Sign-in binds the active physician to the account's stable HCP ID. Sign-up uses NPI only to match an existing eligible Relay profile; it does not treat NPI issuance as credential verification. The UI has no profile selector and `/inbox` always shows only requests addressed to the signed-in physician. Production must replace this local mechanism with server-side authentication, protected sessions, credential recovery, abuse controls, and appropriate credential-verification sources.

Every request stores structured identity snapshots for the requester and recipient: stable HCP ID, display name, specialty, location or state, and verified credential status. The inbox shows this professional identity separately from the governed question fields so the responder can clearly see who sent the request without exposing hidden contact information. Email addresses are resolved from the account directory only for the approved contact view; they are not copied into the request payload.

The requester retains an account-specific pointer to the active consult. When the responder accepts, the requester sees the accepted status. When the responder submits an answer, Doctor Connect displays an answered notification and restores the requester directly to the final response step after their next authenticated session. Inbox and Doctor Connect navigation badges represent unread events for the signed-in physician: opening a received request marks it read for the recipient, and opening its completed answer marks it read for the requester.

After an answer is sent, each physician independently approves email sharing. One approval leaves the contact value hidden on both sides. Once both approvals are active, the requester sees the responder's account email and the responder sees the requester's account email. Approval is one-way: once a physician approves email sharing for a consult, the control locks and the approval cannot be withdrawn.

For the current browser build, `BroadcastChannel` plus `localStorage` provides deterministic same-origin, cross-tab updates. Production replaces this client-side transport with authenticated request APIs, durable storage, server-side transition and policy validation, and a realtime delivery service. Authentication alone does not provide request transport or authorization enforcement.

## 7. Reusable answer library

Reusable answers are a secondary extension rather than a required step in the physician's primary hackathon flow. When implemented, search prior answers before creating new work and store only answers whose author explicitly permits reuse.

```ts
type StructuredAnswer = {
  id: string;
  taxonomySignature: string;
  approachTags: string[];
  monitoringTags: string[];
  escalationTags: string[];
  optionalNote?: string;
  authorId: string;
  reuseConsent: boolean;
  reviewStatus: "pending" | "approved" | "hidden";
  createdAt: string;
};
```

Do not turn peer anecdotes into “recommended answers.” Label them as peer experience, show date and specialty, and allow authors or moderators to withdraw them.

## 8. Eligibility and matching

### Hard filters first

A candidate must:

- Have verified production credentials.
- Hold active `PEER_MATCHING` consent.
- Be available.
- Permit the relevant therapeutic area and question topic.
- Have no block or conflict relationship with the requester.
- Pass applicable jurisdiction and program rules.
- Not be the requester.

### Rank second

Use a transparent weighted score rather than raw cosine similarity:

```text
score =
  0.35 therapeutic-area experience
  + 0.25 topic experience
  + 0.15 population/condition-tag overlap
  + 0.10 specialty fit
  + 0.10 response reliability
  + 0.05 timezone/availability fit
```

All values are normalized to 0–1. The exact weights are prototype assumptions and should appear in an admin configuration.

Before ranking, require a minimum evidence floor for the selected therapeutic area. Evidence can come from reviewed self-declaration, verified specialty experience, or permitted Impiricus signals. If nobody clears the floor, return “No strong match available” instead of lowering the threshold. A visibly honest no-match state is better for trust than a forced weak match.

Do not use prescribing volume alone as proof of expertise. Public claims are incomplete, may be suppressed, and may reflect factors unrelated to competence. Prefer HCP-declared experience, verified specialty, and consented Impiricus signals. If a public statistic contributes, disclose it and cap its weight.

### Network Graph matching substrate

The categorical weighted score above is the baseline matcher. Relay is also building a learning matching substrate — the Relay Network Graph — that models physicians as an expertise graph ("who knows what") and a trust graph ("who has successfully helped whom") and improves as connections are validated. It uses the same hard-filters-before-ranking rule, consent model, and audit foundation described here, and ranks on expertise evidence and validated peer trust rather than prescribing volume or NPI alone. See `network-graph-plan.md` for the model, funnel, learning loop, and boundaries.

### Explanation

Expose no more than three reasons:

- “Opted in to questions about GLP-1 therapies.”
- “Self-reported experience with renal impairment.”
- “Available this week and has a strong response record.”

Do not reveal an exact individual prescribing count to another HCP unless the data use and consent explicitly allow it.

## 9. Safety controls

### Preventive controls

- Four separately capped requester fields rather than one narrative paragraph.
- Explicit field-by-field identifier scanning and physician review before send.
- No attachments.
- No patient narrative paragraph.
- Server-side revalidation of field limits, identifier rules, safety stops, and physician confirmation in production.

### Detective controls

The hackathon build has no optional note. If a future pilot introduces one:

- Set a strict character limit.
- Block common direct identifiers and date formats.
- Warn against patient-specific details.
- Queue uncertain text for review or require deletion.
- Store only after the safety check passes.

A filter supplements data minimization; it does not certify de-identification.

Do not send potentially sensitive text to Gemini unless the deployment terms, data handling, retention, and business-associate requirements have been reviewed. A contextual classifier can be a second defense, never the basis for calling the text safe.

### Clinical and operational controls

- Display “peer experience, not medical advice from Impiricus.”
- Provide report/block controls.
- Expire unanswered requests.
- Limit concurrent requests to prevent spam.
- Prevent pharma clients from selecting or targeting a specific responder through this flow.
- Create a human-review path for complaints, suspected misinformation, and safety events.

### Adverse-event and product-quality routing

Responder answers can mention side effects, product problems, lack of effectiveness, or death. Before production use, Impiricus and its pharma clients must define who receives such information, what counts as awareness, required data capture, and reporting timelines.

For the hackathon, demonstrate one safe stop:

> “This selection may describe a safety event. Relay cannot continue this peer workflow. Use the designated safety reporting route.”

Use a fictional destination. Do not claim the prototype fulfills FDA reporting requirements.

## 10. Data model

```ts
type ConsultRequest = {
  id: string;
  requesterId: string;
  taxonomyVersion: string;
  questionFields: {
    therapeuticArea: string;
    topic: string;
    populationBand: string;
    conditionTag: string;
  };
  reviewedQuestion: string;
  derivedMatchingTagIds: string[];
  guardrailVersion: string;
  confirmedGeneralQuestion: boolean;
  status: ConsultStatus;
  selectedPeerId?: string;
  expiresAt: string;
  policyVersion: string;
};

type ContactConsent = {
  consultId: string;
  hcpId: string;
  approved: boolean;
  shareFields: ("email" | "phone")[];
  consentedAt: string;
  expiresAt: string;
};
```

Keep contact fields in a separate protected collection. A match result should contain a stable HCP ID and display profile, never the hidden contact record.

### Guarded response

```ts
type GuardedConsultResponse = {
  consultId: string;
  responderId: string;
  responseText: string;
  taxonomyVersion: string;
  guardrailVersion: string;
  submittedAt: string;
};
```

The answer is capped, checked only after an explicit action, previewed exactly, confirmed by the responder, and validated again at storage. Avoid exact dose-entry fields in the hackathon version because they create a stronger impression of treatment advice and require much more clinical review.

## 11. API plan

```text
GET  /api/connect/taxonomy
POST /api/connect/questions/preview
POST /api/connect/answers/search
POST /api/connect/requests
GET  /api/connect/requests/:id/matches
POST /api/connect/requests/:id/select
POST /api/connect/requests/:id/decision
POST /api/connect/requests/:id/answer
POST /api/connect/requests/:id/contact-consent
GET  /api/connect/requests/:id/contact
POST /api/connect/requests/:id/report
```

`GET .../contact` must re-evaluate both consent grants at request time. Do not rely only on the stored state, because account eligibility or broader matching consent can change after approval.

## 12. Tests

### Matching

- A nonconsenting candidate never appears.
- An unavailable or unverified candidate never appears.
- The explanation includes only fields used in the score.
- A public prescribing feature cannot dominate the result.

### Contact consent

- One approval does not reveal information.
- Two approvals reveal only the selected fields.
- Revocation before retrieval prevents reveal.
- Expired consent prevents reveal.

The server must also verify that both accounts remain active and eligible at retrieval time. Record that the disclosure was acknowledged, but do not describe the disclosure as transferring or eliminating legal responsibility.

### Input safety

- Direct-identifier patterns block requester fields before consult storage.
- Flagged input remains visible with a redacted preview and requires physician revision; it is not silently rewritten.
- Safety-event phrases trigger a stop or review.
- Production repeats the guardrail at the authenticated server boundary.
- No attachment endpoint exists.

### Resilience

- If a future AI guardrail fails, deterministic identifier checks remain active and low-confidence input blocks for revision.
- Requests are idempotent and cannot send twice on refresh.

## 13. Success measures

Prototype:

- Question completion time.
- Percentage of testers who understand why the match was selected.
- Zero hidden-contact leaks in state-transition tests.

Production candidates:

- Match acceptance rate.
- Median time to first response.
- Helpful-answer rating.
- Repeat use by requesters and responders.
- Percentage answered from the reusable library.
- Safety escalations, blocked requests, reports, and false-positive rates.

## 14. Demo fixture

Seed three eligible peers and two filtered-out peers:

- Peer A: highest relevance and active consent.
- Peer B: relevant but lower availability.
- Peer C: related specialty.
- Peer D: strong experience but revoked consent, proving consent changes the result.
- Peer E: matching NPI but unverified credentials, proving NPI alone is insufficient.

Demo sequence:

1. Choose class, topic, population band, and one condition tag.
2. Review the assembled question.
3. Show a prior answer result, then request a live peer anyway.
4. Open “Why this match.”
5. Point out that the revoked-consent expert is absent.
6. Sign out, sign in as the selected physician, open that account's Inbox, accept the delivered request, run the answer privacy review, confirm, and send the guarded answer.
7. Sign back in as the requester and open the answered notification, which restores the final response step.
8. Show that one contact approval keeps details hidden, while the second reveals the selected channel.

Recommended disclosure for the prototype:

> “If both physicians agree, Relay can share the contact details each selected. Communication then occurs outside Impiricus and is not monitored here. Continue to follow applicable privacy, professional, and organizational requirements, and do not share patient information unless permitted through an appropriate channel.”

This describes the product boundary without making a legal conclusion.

## 15. Production roadmap

1. Physician research on which general questions fit structured templates.
2. Legal and privacy analysis of platform role and treatment-related information.
3. Credentialing integration and sanctions monitoring.
4. Pharmacovigilance and product-complaint operating procedures.
5. Human moderation, appeals, blocking, and incident response.
6. Specialty-specific taxonomy governance.
7. Fairness evaluation so underserved or low-data physicians are not systematically excluded.
8. Controlled pilot with one specialty and no compensation.
9. Later consideration of async panels, MSL routing, or paid advisory work under separate rules.

## 16. References

- HHS de-identification guidance: <https://www.hhs.gov/hipaa/for-professionals/special-topics/de-identification/index.html>
- HHS notes that treatment can include consultation between providers, but production responsibilities depend on the parties and workflow: <https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/disclosures-treatment-payment-health-care-operations/index.html>
- CMS states that an NPI does not validate licensure or credentials: <https://download.cms.gov/nppes/NPI_Files.html>
- FDA postmarketing safety-reporting overview: <https://www.fda.gov/drugs/surveillance-post-drug-approval-activities/postmarketing-adverse-event-reporting-compliance-program>
