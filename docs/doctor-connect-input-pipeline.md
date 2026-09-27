# Doctor Connect — Guarded Input Pipeline

## 1. Current design principle

Doctors may use their own wording in four separately scoped question fields. Relay does not replace text while they type and does not require the wording to match a fixed category.

> Keep the pre-review draft in the active browser form, run privacy and safety checks only after the physician explicitly requests review, block identified risks for revision, and retain only the physician-approved question needed for the selected peer.

This supersedes the earlier fixed-vocabulary design. The responder now follows the same explicit guarded-text lifecycle in one capped answer field; older structured answers remain display-compatible.

## 2. Question fields

The requester completes:

- What they want to discuss.
- The medication or therapy area.
- An age or general age-group description.
- General condition context.

Each field independently preserves the physician's exact entry while typing and has a field-specific length cap. The UI may show a live sentence assembled from the four entries, but it must not silently categorize or replace them during entry. After the explicit review action, an exact age entered in the age field is converted to a coarse population range and disclosed alongside the original value before confirmation.

Typing `72` must leave `72` in the age field. Checks must never run on the first digit or close the field while the physician is still typing. After review, the preview and stored consult use `Adults 65–89`, while the confirmation screen also shows `Entered: 72`.

## 3. Current prototype pipeline

```text
physician types in four visible fields
  -> draft remains in React form state
  -> physician selects “Check privacy & safety”
  -> each field is scanned independently
  -> safe fields remain exactly as entered, except an exact age becomes a disclosed coarse range
  -> flagged fields show the issue and a redacted preview
  -> physician revises flagged text and runs the check again
  -> physician reviews the assembled question and confirms it is general
  -> approved question is sent to the selected peer
  -> temporary pre-review form buffer is cleared
```

The deterministic scan currently checks for:

- conventional and lightly obfuscated email addresses;
- formatted and unformatted US phone numbers;
- numeric, ISO, written-month, and date-of-birth date patterns;
- medical-record, chart, account, member, claim, case, policy, and encounter identifiers;
- Social Security, driver's-license, and passport patterns;
- street addresses, ZIP/postal codes, and contextual residence/work locations;
- web URLs and social handles;
- named-person patterns including introduced names, family relationships, initials, possessives, names before clinical statements, and trailing-name phrasing such as `Bob has renal impairment`, `Bob's renal impairment`, and `renal impairment for Bob`;
- exact-age phrases outside the age field, and mixed patient detail inside the age field;
- text exceeding the cap for that field.

Safety-event and product-complaint phrases follow the existing stop path instead of entering peer matching.

Examples that must be rejected for revision include:

- `Bob's renal impairment`
- `Renal impairment for Bob`
- `Patient J.D. has CKD`
- `Call 404-555-0199`
- `MRN 1234-ABCD`
- `Seen January 3, 2024`

The physician should remove the identifying detail and retain only the general clinical-practice context. An exact age entered by itself in the age field is handled differently: it is visibly generalized to a coarse range before confirmation.

## 4. Redaction behavior

Redaction is explanatory, not silent mutation. When a likely identifier is found, Relay leaves the original entry visible, identifies the risk type, shows a redacted preview, and blocks continuation until the physician edits the field and reruns the check. Age generalization is the one allowed transformation: it occurs only after review, is shown explicitly, and requires confirmation before sending.

Relay must not quietly send the redacted version because that could change meaning without the physician noticing.

## 5. AI guardrail boundary

The current offline prototype does not call an external AI service and must not pretend that it does. Its UI calls the implemented stage an automated safety guardrail and explains that reviewed local rules are active.

A production AI classifier may be added after privacy, security, and clinical review. If added:

- it receives one locally redacted field at a time, never the full draft question;
- it returns structured risk codes and confidence, not rewritten clinical prose;
- it cannot authorize, send, rank peers, or override a deterministic block;
- low confidence blocks for physician revision or human review;
- raw fields and model payloads are not logged;
- retention and vendor data-use terms must be approved;
- the deterministic scanner remains available when AI is unavailable.

## 6. What is discarded and what is retained

- **Discarded:** temporary pre-review form state and locally generated redacted previews after send or cancellation.
- **Retained:** the physician-reviewed question and its four approved field values, including only the coarse age range when an exact age was entered, because the recipient needs them to answer.
- **Never retained:** a flagged version that failed the privacy/safety gate.

The current prototype stores approved consults in browser `localStorage`. A shared backend must apply the same validation before cross-device storage and delivery.

Do not claim that all input is “dumped” after send; that would be false because the approved question is the product message. Say that the temporary draft is cleared and only the reviewed question is retained.

## 7. Matching from free text

Question capture no longer requires categories. Matching may derive narrow internal topic signals from recognizable terms, such as a medicine/class alias or broad condition term, without changing displayed text.

Derived signals must not be shown as physician-entered text, widen eligibility, or bypass consent. They remain subordinate to verification, availability, evidence, and matching-consent filters. Insufficient evidence must produce an honest no-strong-match state.

## 8. Response side

After accepting a request, the responder writes one capped general-practice answer. Relay does not check or rewrite it while the physician types. The responder explicitly selects **Check privacy & safety**, receives the same direct-identifier and safety-event scan, revises any flagged text, reviews the exact approved answer, confirms that it is non-identifying professional experience, and sends it. The consult boundary repeats validation and stores only the reviewed answer with guardrail/taxonomy version and timestamp. Temporary responder draft and redaction-preview state are cleared after send.

This is not open chat: there is one answer per accepted request, no reply thread, attachments, patient narrative field, exact dose field, or unreviewed passthrough. Previous enum-built answers remain readable for existing browser data.

## 9. Visible trust explanation

The requester UI shows four stages:

1. Draft stays visible in the browser form.
2. Field-by-field privacy scan.
3. Automated safety guardrail, with honest prototype/production wording.
4. Temporary draft disposal after send.

The requester confirmation repeats all four physician-entered values. The responder confirmation repeats the exact reviewed answer. Both physicians can verify what will be sent.

## 10. Residual risk

The scanner reduces risk; it does not prove de-identification or guarantee that all personal information will always be detected. A combination of otherwise ordinary facts may still identify someone in a small practice or rare context. Production requires server-side validation, approved AI/vendor handling if used, monitoring, incident response, and clinical/privacy review.

## 11. Required tests

- A two-digit age remains visible and unchanged while typing.
- Exact ages in the age field map to documented coarse ranges after review and only the range enters consult storage.
- Exact-age phrases outside the age field block progression.
- Safe free text is reconstructed exactly into the review question.
- Common variants of email, phone, exact date/DOB, record and government ID, address/location, online identifier, initials, family/person name, and clinical-name phrasing block progression.
- A flagged field displays a redacted preview without mutating its original input.
- Changing any field invalidates the prior review and requires a new check.
- A failed question cannot enter consult storage.
- A safety-event phrase triggers the stop path.
- Temporary draft state clears after send while the approved question remains available to the recipient.
- Responder free text cannot be sent before explicit privacy/safety review and confirmation.
- Identifier and safety-event examples that block requester text also block responder text.
- A failed responder answer cannot enter consult storage, and editing invalidates the prior review.
- Legacy structured answers still render without invoking the guarded-text storage path.
