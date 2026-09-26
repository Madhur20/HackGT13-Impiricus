# Delta
### One consent-aware engine. Three products: a doctor's mirror, a peer network, and a compliance ledger.

*HackGT 13 — Impiricus Challenge + Social Good Track*

---

## The Unifying Insight

Three very different-looking problems turn out to share one primitive operation:

> **Take two structured, consent-tagged states → compute the delta or the similarity → explain it in plain language → flag anything that crosses a threshold.**

- **A doctor's own prescribing pattern**, diffed against a specialty peer benchmark → a guideline-adherence gap. *(Practice Mirror)*
- **A doctor's practice profile**, matched by similarity against other opted-in doctors → a real peer worth consulting. *(Doctor Connect)*
- **Two versions of a pharma data-sharing agreement**, diffed against each other → a compliance-relevant change. *(Ledger)*

Different data, different audience, same computational shape, and — critically — **the same consent-and-provenance rules underneath all three.** That shared foundation is what makes this one product, not three unrelated hackathon ideas competing for prize categories.

---

## Grounding: What We Confirmed Directly With Impiricus

These aren't assumptions — they're things their own team told us, and they shaped every decision below:

1. **Spark today** triggers messages about conferences, follow-ups, and rep visits — opt-out available, with daily/weekly/real-time delivery cadence options.
2. **No doctor-to-doctor connection exists** on their platform today — a confirmed, open gap.
3. **Data model:** public data (NPI) is always usable, no consent gate. Data from **Impiricus's own interaction history with a doctor** is subject to an **anonymization opt-out** — if a doctor opts out, Impiricus keeps the data but strips it to non-attributable, so it can still be used in aggregate but can't be traced back to that doctor.
4. **Adding any new data type to what a pharma client can see requires a manual, ad-hoc, back-and-forth agreement process, every time.** This is a confirmed, real operational bottleneck — not a guess.
5. **DocUpdate Network** (extra info, samples, events, news) has **no eligibility criteria** — enrollment is just small because it's never been actively marketed. A confirmed gap with no current owner.
6. **State-level data regulation varies**, and restrictions should be configurable rather than hardcoded — the legal landscape here has shifted before (Vermont's prescriber-data consent law was struck down by the Supreme Court in *Sorrell v. IMS Health*, 2011) and could shift again, so the product should treat "which states restrict what" as an input, not an assumption baked into the code.

---

## Architecture: One Shared Engine, Consent-Aware From the Ground Up

**Shared data model — every doctor profile is one object with two tagged layers:**

```
DoctorProfile {
  npi_public_data: { specialty, sub_specialty, region, ... }   // always usable, no gate
  interaction_data: { engagement_history, prescribing_pattern, ... }
      consent_state: "attributable" | "anonymized"              // doctor's own opt-out choice
  state_ruleset: <lookup by doctor's state>                     // configurable, not hardcoded
}
```

Every one of the three products reads from this same object and respects the same two flags (`consent_state`, `state_ruleset`) — nobody re-implements consent logic separately. This is the core technical claim of the whole pitch: **one consent-aware data layer, three products built on top of it.**

**Shared computation engine:**
- A structured **delta/similarity** step (diff for Ledger, similarity score for Practice Mirror and Doctor Connect)
- A **Gemini explanation** step — plain-language "here's what this means" for whatever the delta/match is
- A **threshold flag** step — severity-based for Ledger (compliance risk), relevance-based for Practice Mirror (guideline gap) and Doctor Connect (match quality)

---

## Face 1: Practice Mirror — *the full, polished demo*

**One line:** A doctor opts in and sees their own aggregate prescribing pattern compared, anonymously, to specialty peers — framed at the guideline/drug-class level, never a branded drug — with a plain-language flag on any meaningful divergence.

**Why it's not Spark:** No trigger, no external content, no delivery cadence, nothing sent to anyone. It's a mirror the doctor opts into, not a channel Impiricus pushes through.

**Data used:** NPI (public) + aggregate Part D prescribing pattern, respecting the same anonymization opt-out Impiricus already offers.

**Framing discipline (non-negotiable in the demo):** always drug-class/guideline level — "you're below peer average on GLP-1 class use for indicated diabetic patients" — never a branded drug. This is what keeps it educational rather than promotional.

**Build priority:** Full polish. This is the only face that scores directly on "impact on the HCP," so it should be the thing judges actually click through.

---

## Face 2: Doctor Connect — *consult-first, categorical by design, network as a byproduct*

**One line:** A doctor gets a peer-consult answer built entirely from structured selections — drug, question type, population bracket, comorbidity tags — never free-typed prose, so there is no text field for a patient's name, date, or story to go into in the first place.

### Why categorical input, not a pre-send filter

This was Impiricus's #1 stated concern after our last conversation: doctors discussing patient specifics is a compliance violation and lawsuit risk they cannot accept on their platform. We considered two approaches and picked the structurally stronger one:

- **A pre-send PHI filter** (scan free text before delivery) is a **detection** system — it has a false-negative rate by definition, because natural language is infinite and no filter catches every phrasing. Useful as a second layer, not sufficient alone.
- **Categorical/dropdown input** is a **prevention** system — if the only things a doctor can select are pre-set drug classes, age *ranges*, and comorbidity *tags*, the vocabulary of what can be said doesn't include patient-identifying content at all. This is a structural guarantee, not a probabilistic one — the only version of this honestly describable to a legal team as close to airtight.

**We are not claiming literal 100% risk elimination — no system with any doctor input can honestly claim that.** What we're claiming is a materially different risk profile than open chat: no free-text authorship of the question itself, no attachments/images, and a thin filter only on the one small optional free-text surface that remains.

### The workflow, step by step

1. **Drug / therapeutic area** — searchable dropdown (e.g. "GLP-1 receptor agonists," "SGLT2 inhibitors," "biologics — TNF inhibitors")
2. **Question type** — fixed list: *Dosing/titration · Side-effect management · Drug interaction · Switching therapy · Monitoring protocol · Administration/formulation*
3. **Population bracket** — age *range*, never an exact age: *Pediatric · Adult 18–40 · Adult 40–65 · Geriatric 65+*
4. **Comorbidity tags** — multi-select checklist, not free text: *Renal impairment · Hepatic impairment · Pregnancy · Cardiac disease · Diabetes · None/other*
5. **The system assembles the question from these selections** — the doctor reviews and confirms, they never author the sentence themselves. Example: selecting GLP-1 / dosing / adult 40–65 / renal impairment generates:

   > *"How do peers approach GLP-1 titration in adult patients (40–65) with stage 3–4 renal impairment?"*

6. **Matching** — same profile-similarity engine as Practice Mirror, now matching on structured tags instead of prose.
7. **Response** — the matched peer answers using pre-set response patterns ("Typical approach: start at [dose], titrate over [timeframe], monitor for [category]") plus a capped (~200 character) optional free-text field for a clarifying nuance — the *only* place in the product with any free text, and the only place a lightweight filter is worth running at all.

### Is this actually useful, or just safe?

Genuinely useful, not just a compliance workaround: this is close to how experienced physicians already frame informal curbside consults, since they're already trained not to share identifying details with colleagues casually. "How do you approach GLP-1 dosing in renal-impaired patients" is a completely normal question a doctor would ask a colleague at a conference — the categorical design doesn't distort the interaction, it makes its natural shape the only shape available.

**Bonus, not originally the goal:** because every question is structured, every answer becomes a **reusable, searchable knowledge artifact.** The next doctor with a similar drug/population/comorbidity combination can find a prior answer without needing a live match at all — free-text chat can't do this safely (you can't index and resurface raw PHI-adjacent conversation), but a categorical Q&A pair can become a real, growing knowledge base over time. That's a product moat, not just a workaround.

**Honest limitation:** some genuinely unusual, multi-comorbidity edge cases won't fit cleanly into fixed categories. Mitigations: allow multiple comorbidity tags per question (already in the design), and add a governed "suggest a new category" path — if enough doctors hit "other" for the same underlying thing, Impiricus's own team reviews and adds it as a real category later. Controlled expansion, not an open door.

### Moving off-platform: the double opt-in handoff

Some matches will want an ongoing collegial relationship beyond one structured question — that's healthy, and it's also the moment of highest risk if handled carelessly. Design:

1. After a structured Q&A exchange, either doctor can tap **"Continue this conversation."**
2. **Mutual, explicit opt-in required** — both doctors must independently confirm before either party's contact info is revealed. Neither side sees anything unless both say yes (same double-opt-in pattern as LinkedIn or professional referral networks).
3. Before the exchange completes, both doctors see an unambiguous disclosure: *"Conversations outside Impiricus are not monitored, logged, or moderated by Impiricus. As licensed clinicians, your professional and regulatory obligations continue to apply to any discussion you have independently."*
4. Impiricus **logs that an exchange happened** (timestamp, which two NPIs) for audit purposes — but never touches the content of whatever happens afterward, because it isn't happening on Impiricus's platform anymore.

**Why this is a strong liability position, not a loophole:** Impiricus's exposure is tied to what happens *on their platform*. Once two independently-licensed physicians choose to text or call each other on their own devices, that's their own professional conduct — the same as swapping business cards at a medical conference. The highest-risk, least-structured part of the interaction is deliberately kept off Impiricus's infrastructure entirely, by design.

**Framing note for the pitch:** don't market the off-platform step as "a way to have the real conversation" — that undercuts the categorical design by implying it's a lesser, fallback experience. Frame it as "for doctors who want an ongoing collegial relationship beyond a single question" — a natural next step for a good match, not an escape hatch.

**DocUpdate Network scoring, as a secondary output of the same engine:** since there's no eligibility criteria to encode, "who's a good candidate for DocUpdate we haven't invited yet" is just the same similarity engine pointed at an "ideal DocUpdate member" archetype instead of a peer physician — nearly free, given Face 2's core is already built.

**Build priority:** Real, working categorical consult-matching flow (all 7 steps above) — this is co-lead with Practice Mirror. The off-platform double opt-in handoff is worth building as a real, working toggle (it's simple: two booleans and a reveal condition). Network/DocUpdate-scoring stay as one-line "here's what this also unlocks" additions, not built UI.

---

## Face 3: Ledger — *internal-only, lighter build*

**One line:** A version-controlled, diff-based workflow for proposing new data types into a pharma client's agreed data-sharing scope — replacing ad hoc back-and-forth with a structured, auditable review process.

**Scoped down per plan:** internal-only for the demo (Impiricus's own compliance team reviewing a proposed schema change) — no pharma-facing counterparty portal tonight. State plainly that a bilateral approval portal is the natural v2, so you get credit for having thought it through without a second UI surface to build.

**How it works:**
1. Each pharma client has a **current agreed data schema** (which fields/sources they're allowed to receive).
2. A proposed addition generates a **structured diff** against that schema, in plain language.
3. **Compliance flags attach automatically**, citing the *specific* rule that triggered them — e.g., "this field draws on anonymized interaction data — confirm this client's agreement covers that," or "this doctor's state restricts this field under the current ruleset." Same citation discipline as everywhere else in this pitch — never an unexplained "flagged for review."
4. Every version is kept — a full audit trail of what a pharma client had access to and when.

**Build priority:** Lighter but real. A handful of pre-loaded schema versions, a working diff view, and one or two flags firing correctly on the two known real triggers (anonymization-boundary crossing, state-ruleset conflict).

---

## The Consent-Boundary Badge (small feature, high trust payoff)

Every data point shown anywhere in Practice Mirror or Doctor Connect carries a small visible tag: **"Public (NPI)"** or **"Anonymized (opted-in)."** Cheap to build, and it proves the consent model is real rather than asserted — a judge can see it working in under five seconds instead of needing it explained.

---

## Judging-Criteria Check (Impiricus rubric: HCP impact, originality, technical execution, commercial fit)

| Criterion | Practice Mirror | Doctor Connect | Ledger |
|---|---|---|---|
| **Impact on the HCP** | Direct | Direct | None, directly — but doesn't need to; the other two cover it |
| **Originality** | Solid | Strong — confirmed gap, no current owner | Strong — confirmed gap, no current owner |
| **Technical execution** | Consent-aware matching, clean UI | Similarity-matching engine, "why this match" reasoning | Diff view, citation-grounded flags |
| **Commercial fit** | Plausible medical-affairs interest | Strong — fills a stated gap directly | Very strong — a named, confirmed operational bottleneck |

Building all three, proportionally, leaves no judging axis uncovered.

---

## Demo Plan (90 seconds)

1. **Open on the unifying insight, stated explicitly**, before showing anything: "one consent-aware engine, three products" — say this first so it reads as vision, not three ideas stapled together.
2. **Show the shared DoctorProfile object** with its two tagged layers (public / anonymized-interaction) and the consent-boundary badges — this makes the "one engine" claim visibly real.
3. **Practice Mirror:** a doctor's prescribing pattern vs. peer benchmark, guideline-level framing, one clear divergence flagged.
4. **Doctor Connect:** the same engine, pointed at doctor-to-doctor similarity — a consult question, a matched peer, a "why this match" explanation.
5. **Ledger:** the same engine again, pointed at schema diffing — a proposed data addition, a diff view, one flag citing the specific rule it tripped.
6. **Close** on the point that all three read from the same consent-tagged data object — nothing built twice, nothing that reinvents consent logic per-feature.

---

## Build Plan / Tech Stack

- **MongoDB Atlas** — the shared `DoctorProfile` schema (public + anonymized-interaction layers, state ruleset) and the pharma `DataSchema` versions for Ledger; one shared collection design, multiple products reading from it
- **Gemini** — one shared explanation/flagging pipeline, reused as-is across all three: delta/similarity → plain-language explanation → threshold flag with citation
- **Diff rendering** (Ledger) — a straightforward line-level diff library (e.g. `diff-match-patch`) for the schema-diff view
- **Similarity scoring** (Practice Mirror + Doctor Connect) — cosine similarity over tagged profile vectors; same function, two different target-profile types (peer benchmark vs. peer physician vs. DocUpdate archetype)
- **Vultr** — scheduled re-check job for Ledger, so a compliance flag is re-validated if a state ruleset or agreement changes later, not just computed once at diff-time

**Scope discipline for tonight:**
- Practice Mirror: full polish, primary demo surface
- Doctor Connect: full working consult-match flow; network/DocUpdate-scoring stay as spoken "this also unlocks" lines, not built UI
- Ledger: internal-only, a few pre-loaded schema versions, skip the bilateral counterparty portal
- State-ruleset table: configurable/editable list, not hardcoded assumptions about which states apply — this is itself a small feature worth showing, not just an internal detail

---

## Open Risks to Keep an Eye On

- **Doctor Connect must stay opt-in on both sides, visibly**, for both the initial match and the off-platform handoff. If the demo doesn't make mutual opt-in obvious, it will read as covert matching/surveillance rather than a peer tool doctors chose to join.
- **Categorical input trades some expressiveness for safety, on purpose.** Be ready to say this plainly if asked: doctors can't phrase a fully custom question, only assemble one from structured fields. The "suggest a new category" governance path is the answer to "what if my case doesn't fit," not an open free-text escape hatch.
- **Practice Mirror framing must stay at guideline/drug-class level in every screen**, not just in the pitch narration — a single branded-drug comparison slide undercuts the whole "not promotional" argument.
- **Ledger's legal citations should stay accurate and configurable.** Don't hardcode "California" as a restricted state in the demo data given the actual legal history (Vermont's law was struck down; CA's relevant law is the broader CCPA/CPRA, not a prescriber-specific statute) — use a generic or clearly-labeled example state instead, and let the audience see the ruleset is a config table they could edit.

---

## Sources
Medicare Part D aggregate prescribing data, NPPES specialty registry — used only in aggregate, non-patient-linked form. *Sorrell v. IMS Health*, 564 U.S. 552 (2011), for the legal history of prescriber-data consent laws (Vermont, Maine, New Hampshire). "Audit and feedback" as a guideline-adherence intervention is a well-established finding in the clinical quality-improvement literature.
