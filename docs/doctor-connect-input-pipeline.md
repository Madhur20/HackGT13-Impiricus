# Doctor Connect — Input Pipeline Design
### Fill-in-the-blank capture, per-field scoped parsing, and AI guardrails for both the question and the response

*This document specifies exactly how a doctor's typed input becomes a safe, enum-validated structured object on both sides of a Doctor Connect exchange — the question (asker) and the response (responder). It supersedes any earlier open-paragraph free-text design. Read alongside the shared engine and consent model in the overall system design.*

---

## 1. Design Principle, Stated Once

> **No field in the schema can ever hold a value outside a fixed, pre-declared vocabulary. Every message shown to another doctor is reconstructed from canonical category labels via a fixed template — never from anything a doctor literally typed.**

Everything below is an implementation of this one rule, applied twice (question side, response side), with the same pipeline shape both times.

---

## 2. Why Fill-in-the-Blank, Not One Open Paragraph

| | One open paragraph | Fill-in-the-blank |
|---|---|---|
| Parsing problem | Hard — must segment an unstructured sentence and infer which words belong to which category | Easy — each blank pre-labels its own content; a per-field parser only ever considers one narrow vocabulary |
| Doctor behavior | Unconstrained — nothing signals what's expected, so narrative detail creeps in naturally | Primed — the interface itself communicates the expected shape of the answer at each point, reducing risky input *before* parsing even runs |
| Failure mode when something doesn't match | Ambiguous — unclear which part of the sentence caused the miss | Localized — exactly one blank failed to resolve, so fallback (dropdown) is scoped to just that field |

This is why the fill-in-the-blank shape is the foundation of the whole design, not just a UI preference.

---

## 3. The Question-Side Template

```
"How do peers approach ___(topic)___ for ___(therapeuticArea)___
 in ___(populationBand)___ age patients with ___(conditionTag)___?"
```

Worked example: a doctor fills the blanks with short phrases ("checking on kidneys," "jardiance," "72," "ckd") — the *filled sentence a doctor sees while typing* is a convenience; **what actually gets sent is never that raw filled sentence.** It's the four resolved fields, rendered back through the same template using canonical labels:

> *"How do peers approach monitoring for SGLT2 inhibitors in adults 65–89 age patients with renal impairment?"*

### 3.1 Field vocabularies (question side)

```json
{
  "topic": ["dosing_titration", "monitoring", "side_effect_management",
            "drug_interaction", "switching_therapy", "administration_formulation",
            "other_suggest"],
  "therapeuticArea": ["SGLT2_inhibitors", "GLP1_receptor_agonists", "DOACs",
                       "biologics_TNF_inhibitors", "biologics_IL_inhibitors",
                       "statins_high_intensity", "..." /* ~15-20 total */,
                       "other_suggest"],
  "populationBand": ["pediatric", "18-40", "40-65", "65-89", "other_suggest"],
  "conditionTag": ["renal_impairment", "hepatic_impairment", "pregnancy",
                    "cardiac_disease", "diabetes", "none", "other_suggest"]
}
```

---

## 4. The Response-Side Template

```
"Approach: ___(approachConsidered)___.
 Monitoring: ___(monitoringConsiderations, multi-select)___.
 Escalation: ___(escalationConsiderations)___."
```

Worked example:

> *"Approach: Confirm treatment goals and relevant comorbidities. Monitoring: Renal trend, Tolerance, Volume status. Escalation: Need for specialist or care-team review."*

### 4.1 Field vocabularies (response side)

```json
{
  "approachConsidered": ["review_baseline_and_monitoring_cadence",
                          "confirm_treatment_goals_and_comorbidities",
                          "coordinate_care_team_review",
                          "adjust_dosing_or_titration",
                          "initiate_additional_testing",
                          "no_change_indicated", "other_suggest"],
  "monitoringConsiderations": ["renal_trend", "tolerance", "volume_status",
                                "follow_up_cadence", "glycemic_control",
                                "blood_pressure", "weight_trend",
                                "lab_frequency", "other_suggest"],  // enum_array
  "escalationConsiderations": ["no_escalation_needed",
                                "specialist_or_care_team_review",
                                "urgent_referral",
                                "reassess_at_next_follow_up", "other_suggest"]
}
```

**Open item:** confirm the exact `escalationConsiderations` options against clinical review — the five above are a reasonable placeholder set, not yet validated.

**Design note:** the response side, as currently mocked (dropdown + checkbox, no visible free text), is already at the strongest point on the safety spectrum — zero free text, nothing to parse, nothing to redact. Adding free-text input here (§5–7 below) is an optional, deliberate trade of some safety margin for expressiveness. Default recommendation: **ship the response side as pure dropdown/checkbox with no free text**, and only add the pipeline below if dropdown options prove too restrictive in practice.

---

## 5. The Per-Field Pipeline (Applies Identically to Every Blank, Either Side)

```
┌─────────────────────────────────────────────────────────────────┐
│  For EACH blank/field independently:                             │
└─────────────────────────────────────────────────────────────────┘

 1. RAW INPUT (browser only)
    Doctor types a short phrase into ONE blank (char-capped, ~30-40 chars)
            │
            ▼
 2. LOCAL DICTIONARY / PATTERN MATCH — scoped to THIS field's vocabulary only
    - Exact-match dictionary for short abbreviations (CKD, ARB, ACEi)
    - Fuzzy match (BK-tree / edit-distance ≤2) for words of 5+ letters only
    - Numeric pattern rules for anything age-shaped (\d{1,3}\s*(yo|y/o))
    - Synonym/brand-name tables per category
            │
      matched? ──yes──► resolved_fields[field] = canonical_enum_value
            │
            no
            ▼
 3. RESIDUAL TEXT — only the unmatched phrase for THIS field, already short,
    already scoped, sent to AI ONLY IF step 2 failed
            │
            ▼
 4. AI PASS — Gemini, constrained decoding
    - Output type is a strict enum of THIS field's specific vocabulary only
    - Model is structurally incapable of emitting a value outside that enum
    - Never asked to parse the whole sentence — only this one field's residual
            │
      confident match? ──yes──► resolved_fields[field] = canonical_enum_value
            │
            no (low confidence)
            ▼
 5. MANDATORY DROPDOWN FALLBACK — for this field only
    Doctor must pick from the same fixed vocabulary manually.
    No guess, no passthrough, no partial text ever stored.
            │
            ▼
 6. resolved_fields[field] is now guaranteed ∈ fixed vocabulary,
    end of pipeline for this field
```

Repeat for all fields on whichever side is active, then:

```
 7. MERGE all resolved_fields
            │
            ▼
 8. TEMPLATE RECONSTRUCTION
    Final message = fixed template string + canonical labels ONLY.
    NEVER the doctor's literal typed text — even a correctly-matched
    phrase is displayed as its canonical label, not as-typed.
            │
            ▼
 9. HUMAN REVIEW
    Doctor sees the reconstructed sentence, can re-edit any single
    field (returns to step 1 for that field only), must confirm
    before send.
```

---

## 6. Non-Negotiable Implementation Rules

1. **Raw input never crosses the network as a full sentence** — only the already-locally-processed, per-field residual (short, pre-scoped) text is eligible to reach an AI call, and only for the one field that failed local matching.
2. **Server-side re-validation on receipt, always.** Never trust client-side parsing alone — reject any field value not drawn from that field's exact known enum list. This is the actual backstop against a parsing bug, not just a nicety.
3. **Every field's AI call is constrained to that field's enum only** — never a general-purpose classification call that could return anything. This is what makes the guarantee structural rather than a matter of prompting discipline.
4. **The reconstructed message is template-generated, never AI-generated.** The AI's only job anywhere in this pipeline is picking an enum value for one field — it never authors the sentence a doctor reads.
5. **Raw text and unmatched residuals are never logged or persisted** — cleared from memory immediately after each field resolves. Application logs, error traces, and analytics must not capture them either.
6. **Multi-select fields (`monitoringConsiderations`) are validated per-element** — every item in the array must independently be a member of the fixed set.
7. **`other_suggest` never reaches the other doctor.** Selecting it opens a short, capped box that logs a *suggestion* for Impiricus's own review queue — it is not part of the sent message under any circumstance.

---

## 7. What We Guarantee vs. What We Don't

**We guarantee, structurally:**
- No field in the schema can hold a name, exact date, location finer than state, or narrative text.
- No raw sentence is ever transmitted, logged, or persisted — only short, pre-scoped residuals for fields the dictionary couldn't resolve, and only until they're classified.
- Every value in every sent message is drawn from a fixed, versioned vocabulary, enforced both at the AI decoding layer and again at the server on receipt.
- The message shown to another doctor is always template-reconstructed from canonical labels — never a copy of anything a doctor typed.

**We do not guarantee, and should never claim:**
- Zero risk in absolute terms — no system accepting any doctor input can honestly claim that.
- Protection against a rare *combination* of correctly-categorized fields being identifying in a small practice (e.g., an unusual drug + age band + comorbidity, in a small specialty/region). This is a statistical re-identification risk, not a parsing failure, and no text-handling rigor prevents it alone.
- Perfect code correctness forever — a regex edge case, tokenization change, or library update could in principle introduce a gap; server-side re-validation (§6.2) is the mitigation, not a claim that no bug can ever exist.

State both halves together, always — the guarantee is genuinely strong, and naming its edges is what makes it credible rather than a claim someone can pick apart later.

---

## 8. Governed Vocabulary Expansion

Every field includes `other_suggest`. Selecting it:
1. Opens a short, capped free-text box (visually distinct from the main flow)
2. That text is logged to a review queue only — never included in the sent message, never shown to the matched peer
3. Impiricus's own team reviews suggestions in batch; a term that recurs gets promoted to a real vocabulary entry in the next config update

This is the single governed path for handling "my situation doesn't fit any option" — deliberately not an open door, and consistent across every field on both sides.

---

## 9. Live Feedback (UX Layer, Not a Safety Mechanism)

As a doctor types into a blank, show the matched category updating in real time (e.g., the blank highlights when a confident local match is found, shows "still parsing..." during an AI call, or shows "needs your selection" on fallback). This reinforces the priming effect from §2 and surfaces problems before submission — but it is a trust/UX feature, not itself a guarantee; the actual guarantee is entirely in the pipeline (§5) and the validation rules (§6).

---

## 10. Edge Cases

| Case | Handling |
|---|---|
| Doctor types a name into an age/drug/condition blank | Fails local match (not in that field's vocabulary) → fails AI match (outside the constrained enum) → falls to mandatory dropdown, name never stored anywhere |
| Doctor types a correct term with unusual phrasing the dictionary hasn't seen | Local match fails → AI pass resolves it within the field's constrained enum → stored as canonical label, not the phrasing used |
| AI pass is unavailable (offline / API failure) | Falls straight to mandatory dropdown for that field — pipeline degrades gracefully, never blocks or guesses |
| Multi-select response field has one invalid element mixed with valid ones | Server rejects the entire array on validation failure, does not silently drop just the bad element (avoids ambiguity about what was actually sent) |
| A rare, fully-valid field combination could still be identifying (small practice, unusual drug + age + comorbidity) | Acknowledged as a residual risk (§7), not solved by this pipeline — a v2 concern, same category as Practice Mirror's small-cohort suppression |

---

## 11. Build Checklist

1. Build the per-field local dictionary/pattern matcher first, for question-side fields — test it in isolation before wiring any AI fallback
2. Build the enum-constrained Gemini call for a single field, confirm it structurally cannot return an out-of-enum value (test this explicitly, don't assume)
3. Wire the fallback-to-dropdown path — this should be the easiest part, since it's just the original pure-categorical UI as a safety net
4. Build template reconstruction (§5, step 8) — verify by direct test that it never renders raw input, only canonical labels
5. Add server-side re-validation on the API boundary — reject anything not in the known enum, log the rejection
6. Repeat steps 1–5 for the response-side fields, or skip entirely if shipping response-side as pure dropdown/checkbox (recommended default, §4)
7. Add the `other_suggest` capture-to-review-queue path, confirmed to never enter the sent-message code path
8. Add live per-field feedback UI
9. Rehearse the demo: one field resolved locally, one field resolved via AI fallback, one field forced to manual dropdown — show all three paths working live
