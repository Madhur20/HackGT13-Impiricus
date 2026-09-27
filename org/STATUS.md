# Relay project status

Last updated: 2026-09-27.

## Current state

- **Stage:** Functional browser-first hackathon prototype.
- **Repository contents:** Product/system plans, maintained context, contribution guidance, module boundaries, and a TypeScript workspace.
- **Application code:** React/Vite web shell with a DocUpdate-compatible local sign-in/sign-up screen, Home, Practice Mirror, RL-backed Doctor Connect, a recipient Inbox, physician-facing Ledger Updates, and a shared Audit view.
<<<<<<< Updated upstream
- **Tests:** 46 deterministic tests across local credential validation, consult unread state, guarded free-text question/answer handling and age generalization, the structured answer scaffold, legacy structured-answer compatibility, cohort comparison, matching, policy, account-aware data-broker reads, update filtering/personalization and specialist eligibility, semantic-diff, peer domain clustering/discovery, and Network Graph expertise/trust matching, contextual-bandit ranking, account-to-account routing, and learning behavior.
=======
- **Tests:** 45 deterministic tests across local credential validation, consult unread state, guarded free-text question/answer handling and age generalization, legacy structured-answer compatibility, cohort comparison, matching, policy, account-aware data-broker reads, update filtering/personalization and specialist eligibility, semantic-diff, peer domain clustering/discovery, and Network Graph expertise/trust matching, contextual-bandit ranking, account-to-account routing, and learning behavior.
>>>>>>> Stashed changes
- **Demo readiness:** Core click paths work from synthetic seed data and the production bundle builds. Headless Chrome checks confirm the new sign-in screen, authenticated Doctor Connect, Inbox, and the five-stage UCB match funnel render without a Vite error overlay at 1440 × 1000; hands-on mobile and full two-account interaction QA remain open.
- **Data:** Forty-four synthetic HCP directory profiles (36 baseline, six featured experts, and two additional account profiles), prescribing fixtures, per-physician prescribing vectors and account-specific Mirror data, Network Graph fixtures (expertise tags/edges, peer-help profiles, seeded trust edges), three reviewed medicine-update fixtures, consent failure cases, and a fictional versioned policy.
- **Deployment:** Production is hosted at `https://relay-hackgt13.vercel.app` through the `madhur20s-projects/relay-hackgt13` Vercel project. There is no custom backend. Consult requests sync across devices through the Supabase project `relay-hackgt13` (table `consult_requests`, anonymous read/write, synthetic data only). Demo reset: `delete from consult_requests;` then clear site data in each browser.

Plans remain broader than the prototype. Do not infer production integrations, legal approval, real credentialing, or durable storage from the working UI.

## Active priority

Harden the working prototype for the hackathon demo:

1. Perform hands-on responsive QA in Chrome and on a phone-sized device.
2. Add browser-level tests for sign-in, the two-account Connect → Inbox → Connect lifecycle, one-way email approval, double-consent contact reveal, Mirror → Connect, and Updates → Connect.
3. Add a deterministic reset for browser-local account, consult, page, and audit state.
4. Cross-device consult delivery now uses a public-anon Supabase demo table. Supabase Auth, account-scoped row-level security, and server-side validation remain deferred production work.
5. Prepare deployment and a concise scripted demo run.

## Required early fixtures

- 30–50 synthetic HCP profiles.
- Three reviewed, fictional product updates with concrete previous/current versions and four specialist references each.
- Versioned policy fixtures, including an undersized Mirror cohort, a revoked Connect candidate, an unverified candidate, and an update-review rule.
- Offline deterministic explanation templates.

## Known blockers and external decisions

No code-level blocker is recorded. Production behavior remains blocked on Impiricus review of credentialing, editorial source verification, pharmacovigilance, brands versus classes, paid participation, permitted interaction-derived features, real jurisdiction rules, and reviewed-update retention/export requirements. These questions do not block the synthetic hackathon prototype when it labels assumptions clearly.

## Definition of the next milestone

The next demo-hardening milestone is complete when:

- Chrome desktop and mobile-width paths pass visual review;
- the four critical browser paths have repeatable end-to-end coverage;
- a clean-clone setup and demo script have been exercised;
- the team has made and recorded the local-only versus hosted-demo decision.

## Iteration log

<<<<<<< Updated upstream
### 2026-09-27 — One-way email approval and scroll reset on navigation

- **Changed:** Email-sharing approval is now final: the consult context exposes `approveContact` instead of a boolean toggle, and the Inbox and Doctor Connect buttons lock as "Email approved"/"Approved" with copy stating approval cannot be withdrawn. Separately, the app shell scrolls the window to the top whenever the route changes, so each page opens at its top.
- **Verified:** TypeScript validation passes. Headless Chrome: navigating from a scrolled page to Practice Mirror, Inbox, Doctor Connect, and Updates lands at `scrollY` 0 each time; after approving email in the Inbox the button is disabled and a forced second click leaves the stored approval `true`.
- **Open:** Browser automation for these checks is not yet in the test suite.

### 2026-09-27 — Structured scaffold for the physician answer

- **Changed:** The Inbox answer field now opens pre-filled with labelled lines (`Approach`, `Monitoring`, `Escalation`, optional `Additional context`). A response-structure panel offers suggestion chips from the existing approach, monitoring (multi-select), and escalation (choose one) vocabularies that write into the matching line without discarding typed text; section status pills and a reset action sit with the field. Before the privacy check, blank optional headings are removed in the visible draft so the reviewed text is exactly what is sent. The reviewed preview, the responder's sent view, and the requester's response card render labelled sections, and legacy enum answers use the same layout. Also fixed a closed-`BroadcastChannel` crash that blanked Doctor Connect when an answered request was opened under React StrictMode.
- **Verified:** `npm run check` passes TypeScript validation, 46 tests, and the production build. New tests cover template parsing, chip toggling, preservation of typed text, canonical-order restoration, tidy-before-review, and that every suggestion phrase passes the answer guardrail. Headless Chrome drove Maya's Inbox → compose → check → confirm → send at 1440 px and 420 px, and rendered Elena's structured response card at both widths.
- **Open:** It remains one capped free-text answer; the scaffold is not separately stored or validated. Browser automation for the flow is not yet part of the test suite.

### 2026-09-27 — Notification badges decrement only when an item is opened

- **Changed:** Inbox no longer auto-opens the first request, so a request is marked read only when the physician clicks it; unread requests show a dot and heavier name. Doctor Connect gained a **Your questions** list of every request the physician sent, newest first, with a dot on unread answers; opening one restores it and marks the answer read. Previously visiting Inbox silently read one request, and answers to any request other than the single active one could never be opened, leaving the Doctor Connect badge stuck.
- **Verified:** Browser run with two unread requests and two unread answers: Inbox 2 → visit 2 → open first 1 → reopen first 1 → open second 0; Doctor Connect 2 → visit 2 → open first 1 → open second 0; counts persist across reload. `npm run check` passes.
- **Open:** Browser automation for this flow is not yet in the test suite.
=======
### 2026-09-27 — Context-aware Doctor Connect privacy scan

- **Changed:** Replaced the fixed named-person regexes with a context-aware person-reference detector (`features/doctor-connect/src/person-reference.ts` and `person-lexicon.ts`). Role words such as `my patient` no longer trigger a block; listed names flag on their own (`Bob`, `Bob's`), and unlisted names flag in a person position (`patient Priya`, `Priya's CKD`, `for Priya.`). Capitalized drug names and clinical words before `has`/`is`/`was` no longer flag. Identifier values now need a digit, exact-age phrases need age wording (durations and ranges pass), and location phrases need a named place. Redaction previews now replace only the identifying words. Guardrail version is now `connect-guardrails-v3`.
- **Verified:** `npm run typecheck`, 45 tests, and `npm run build` pass. New tests cover the previously wrong cases in both directions.
- **Open:** The detector remains a deterministic word-list and context scan; an unlisted name with no surrounding person context can pass. Physician confirmation and production review are still required.

### 2026-09-27 — Cross-device Doctor Connect through a shared demo table

- **Changed:** Created Supabase project `relay-hackgt13` with a `consult_requests` table (JSON request, anonymous read/insert/update row-level security, Realtime publication). `ConsultProvider` now loads remote requests on mount, subscribes to Realtime, polls every 4 seconds, merges by newest `updatedAt`, and upserts only changed rows on each commit. `markRead` now bumps `updatedAt` so read receipts survive the merge. The Supabase URL and publishable key live in the committed `apps/web/src/sync-config.ts`.
- **Verified:** `npm run check` passes TypeScript validation, 43 tests, and the production build. With two isolated Playwright browser contexts against the dev server, Elena sent a request to Maya, and the row appeared in Supabase. Maya's separate context, which had no shared `localStorage`, showed the request in Inbox. When Maya accepted, Elena's already-open Connect page showed "Dr. Maya Chen accepted your request" without a reload. The test row was deleted afterward.
- **Open:** The answer and contact-approval steps were not exercised cross-device; they use the same commit path. Vercel must be redeployed to ship this. The table is publicly writable, and a small clock skew between laptops could let an older edit win the merge.
- **Next:** Redeploy to Vercel and rehearse the full Elena → Maya → Elena flow on two physical laptops.
>>>>>>> Stashed changes

### 2026-09-27 — Guarded free-text physician answer flow

- **Changed:** Replaced the recipient's category-only response builder with one capped physician-authored answer using the same explicit write → privacy/safety check → exact preview → confirmation → send lifecycle as the requester. Added storage-boundary validation, guardrail/taxonomy versioning, temporary-draft clearing, a prose response view for the requester, and compatibility rendering for older enum-built answers. Updated the durable product boundary and plans.
- **Verified:** `npm run check` passes TypeScript validation, 43 tests, and the production build. Tests cover safe answer retention, direct-identifier rejection, exact-age rejection, safety-event stopping, and legacy structured-answer validation.
- **Open:** Browser-level two-account coverage and hands-on responsive QA for the new recipient flow remain open. Deterministic patterns still do not prove de-identification; production needs server enforcement and reviewed classifier/human-review and pharmacovigilance procedures.
- **Next:** Add an end-to-end Elena → Maya test that accepts a request, rejects a flagged answer, sends a reviewed safe answer, and verifies requester notification/display.

### 2026-09-27 — Inbox compatibility guard and broader name phrasing

- **Changed:** Prevented the Inbox from calling the strict response assembler with incomplete or legacy stored answer values; malformed/older answers now fail validation and the response builder resets to current defaults instead of crashing. Expanded person-name detection to cover common possessives, curly apostrophes, trailing names, clinical separators, and variants such as `bob's Renal impairment` and `Renal impairment for bob`. Added a collapsed invalid-example guide to the question screen.
- **Verified:** `npm run check` passes TypeScript validation, 42 tests, and the production build. Regression coverage includes legacy/malformed structured answers and the new name phrasings.
- **Open:** Browser storage can still contain other obsolete consult shapes from earlier prototypes; a future versioned migration/reset path remains advisable.
- **Next:** Add a browser test that opens Inbox with a legacy stored answer and confirms the page remains usable, plus interaction coverage for each displayed invalid example.

### 2026-09-27 — Expanded personal-data scan and age generalization

- **Changed:** Expanded Doctor Connect's deterministic privacy scan across common email, phone, exact date/DOB, medical/government ID, address/location, online-identifier, initials, family-name, and clinical-name phrasings. Exact ages remain untouched while typing; after the explicit check, the age field maps them to a disclosed coarse range, the confirmation view shows both values, and consult storage receives only the range. Exact-age phrases elsewhere block progression.
- **Verified:** `npm run check` passes TypeScript validation, 42 tests, and the production build. Regression coverage exercises common format combinations, five age bands, disclosed age transformation, and storage-safe reviewed selection.
- **Open:** Pattern coverage cannot prove de-identification and may produce false positives; browser-level interaction coverage and a production reviewed classifier/human-review path remain open.
- **Next:** Exercise the review screen at desktop/mobile widths and add an end-to-end test proving `72` stays editable, becomes `Adults 65–89` after checking, and is stored only as that range.

### 2026-09-27 — Contextual patient-name guardrail

- **Changed:** Expanded Doctor Connect's local privacy scan beyond explicit `patient named` wording. Clinical sentence patterns such as `Bob has renal impairment`, `Maya Chen takes Jardiance`, `my patient Elena`, and `Bob's renal function` now flag a named-person risk, show a redacted preview, and block storage until revised.
- **Verified:** `npm run check` passes TypeScript validation, 41 tests, and the production build. The new coverage exercises both field-level warnings and storage-boundary rejection for natural-language patient-name references.
- **Open:** This deterministic pattern detector reduces risk but does not certify de-identification; uncommon phrasing and ordinary facts that identify someone contextually still require production classifier/human-review safeguards.
- **Next:** Add browser-level coverage for the visible warning and revision flow.

### 2026-09-27 — Physician-authored question and visible privacy pipeline

- **Changed:** Stopped per-keystroke category replacement, preserved all four requester entries visibly, allowed exact age text such as `72`, moved review behind an explicit privacy/safety action, added identifier detection with non-mutating redacted previews, added a four-stage trust explanation, repeated entered values on confirmation, derived matching signals without rewriting text, and clarified temporary-draft disposal versus approved-question retention.
- **Verified:** `npm run check` passes TypeScript validation, 40 tests, and the production build. Tests verify exact free-text reconstruction, two-digit age preservation, internal tag derivation, all implemented identifier classes, non-mutating redaction previews, safety-stop enforcement, and structured response validation.
- **Open:** The deterministic scanner is not proof of de-identification, and the external AI guardrail is not implemented. Browser automation for review invalidation and draft disposal remains open.
- **Next:** Add browser coverage for typing `72`, flagged identifier revision, review confirmation, and recipient display; then apply the same contract server-side when the deferred cross-device backend is introduced.

### 2026-09-27 — Governed Doctor Connect question and answer pipeline

- **Changed:** Replaced the requester dropdown form with four short fill-in-the-blank fields backed by field-scoped alias, age-pattern, and limited fuzzy matching; added a mandatory per-field dropdown fallback, canonical live sentence, raw-input clearing, taxonomy versions, consult-boundary validation/reconstruction, expanded enum-only responder choices, a canonical answer preview, and required responder confirmation.
- **Verified:** `npm run check` passes TypeScript validation, 37 tests, and the production build. New tests cover brand/class, age, abbreviation, spelling-variation, unresolved-name, canonical response, and invalid multi-select behavior.
- **Open:** The constrained Gemini classification fallback and governed missing-vocabulary review queue remain unimplemented; unresolved fields intentionally fall directly to reviewed dropdowns. Browser-level interaction and mobile visual QA remain open.
- **Next:** Add browser automation for one locally resolved field, one mandatory fallback field, canonical question storage, and responder confirmation, then connect the same validated contracts to the planned shared backend.

### 2026-09-27 — Vercel deployment configuration

- **Changed:** Added root Vercel configuration for the npm workspace, publishing `apps/web/dist` with a single-page application route fallback, documented the CLI deployment workflow, and excluded Vercel's local project metadata from version control.
- **Verified:** Vercel completed deployment `dpl_72NnjH5DkhEBi6N9QpKFFyoBubU3`; HTTPS requests to `/` and the direct `/connect` route both return `200`, confirming the SPA fallback.
- **Open:** Automatic GitHub deployment could not be connected because Vercel did not have access to `Madhur20/HackGT13-Impiricus`. The hosted prototype still uses browser-local identity and consult storage, so different devices cannot exchange Doctor Connect requests without the planned backend.
- **Next:** Grant the Vercel GitHub integration access to the repository if push-based preview/production deployments are desired, then complete hands-on hosted mobile and two-account QA.

### 2026-09-27 — Reconciled `logic` with `origin/GPT-POC` so the branches merge cleanly

- **Changed:** Merged `origin/GPT-POC` (`3b5c171`, signup and re-design) onto the `logic` code (`543ada9`) in `cleaned_branch`. UI-only files (App, AppShell, ui, AuthPage, InboxPage, auth test, styles, Home/Updates copy) take GPT-POC. Doctor Connect keeps the Network Graph UCB matcher, funnel, and exploration chip, and adopts GPT-POC's presentation changes: no "Demo consent change" toggle and no "fictional" wording. Practice Mirror keeps peer-domain discovery with GPT-POC's copy, and its peer cards use the **Illustrative record** label. `data-broker`, `demo-seed`, `domain`, `relay-core`, and `consult-context` keep the `logic` versions, which already contain every GPT-POC change except the illustrative update wording now applied in `demo-seed`. Docs combine both sides.
- **Verified:** `npm run check` passes TypeScript validation, 35 tests, and the production build.
- **Open:** `main` still contains merge `ab47cfc`, which dropped `readClusteringDataset`/`readNetworkGraph` and breaks the app at runtime. Merge this branch into `main` and resolve its conflicts in favor of this branch.
- **Next:** Fix `main` by merging this branch into it.

### 2026-09-26 — Ported the newer GPT-POC account and Inbox UI while preserving RL matching

- **Changed:** Brought the newer `origin/GPT-POC` DocUpdate-style sign-in/sign-up, account-bound shell, Inbox, unread badges, consult delivery, structured answer, and mutual email-approval UI onto `logic`. Integrated that lifecycle into the existing Network Graph matcher rather than restoring the older fixed scorer: candidate eligibility, the five-stage funnel, deterministic UCB ranking, peer-fit scores, exploration metadata, and the live consent recomputation remain intact. Added account-aware candidate reads and synthetic graph evidence for the Maya/Jordan account profiles. Kept required synthetic-data labels that the divergent POC commit had removed.
- **Verified:** `npm run check` passes TypeScript validation, 35 tests, and the production build. Headless Chrome renders of sign-in, authenticated Connect, and Inbox were reviewed at 1440 × 1000. Exercising Connect produced six RL-ranked match cards, five funnel stages, peer-fit labels, meaningful content, and no Vite error overlay. A seed-data test confirms Elena's default UCB query keeps Maya in the six displayed matches for the two-account flow.
- **Open:** Full two-account browser automation, hands-on mobile QA, and production authentication/persistence/realtime transport remain open. The default query's six displayed peers all have prior trust evidence, so its exploration badge is not visible even though the UCB exploration logic and tests remain unchanged.
- **Next:** Add one browser test that signs in as a requester, sends to a seeded account, signs in as the recipient to answer, and returns to verify unread state plus mutual contact disclosure.

### 2026-09-26 — Expanded seed data with featured experts for strong per-category matches

- **Changed:** Added six synthetic "featured expert" physicians (`hcp-37`..`hcp-42`, across Internal Medicine and Family Medicine) to `demo-seed` with strongly corroborated expertise edges (drug class + every condition, derived strength 0.93) and seeded successful trust edges on their drug class and diabetes. Refactored the generators to build over `baseHcpProfiles` and concatenate the featured fixtures, so clustering/prescribing datasets are unchanged. Result: every medication category (SGLT2, GLP-1, Diabetes management) now yields at least two ~90%+ ("peer fit") matches driven by validated peer outcomes, demonstrating the bandit exploiting proven peers. Featured experts are deliberately non-Endocrinology to reinforce "match on expertise, not titles."
- **Verified:** `npm run check` passes TypeScript validation, 30 tests (1 new category-coverage test asserting ≥2 matches ≥0.9 across all 12 area×condition needs), and the production build. Confirmed live in the in-IDE browser: GLP-1 + Renal surfaces three featured GLP-1 experts at 95% peer fit; the funnel now runs 39 → 28 → 25 → 25 → 6.
- **Open:** Featured experts have no prescribing-clustering vectors, so they do not appear in Practice Mirror's "prescribe like you" panel (intentional, keeps clustering fixtures stable). Scores cluster tightly at ~95% for featured peers by design.
- **Next:** Optionally vary featured strengths/trust for more score spread, and persist live UI feedback into the trust graph.

### 2026-09-26 — Merged redesigned UI with the model; wired the bandit into Doctor Connect

- **Changed:** Merged the `logic` model branch (peer clustering, Network Graph, contextual-bandit matcher, synthetic graph fixtures) into `GPT-POC` (redesigned UI). Resolved conflicts in `README.md`, `MirrorPage.tsx` (kept the persona-specific Mirror data and the peer-discovery panel), and `org/` context. Wired `@relay/network-graph` `matchPeers` (deterministic UCB) into the redesigned `ConnectPage`: the governed question maps to expertise tags (drug class + condition), the eligible pool is ranked by the bandit, and step 2 now shows the live matching funnel and an "Exploring" badge for exploration-surfaced peers. Added `@relay/network-graph` as an `apps/web` dependency.
- **Verified:** `npm run check` passes TypeScript validation, 29 tests, and the production build. Verified live in the in-IDE browser at `/connect`: funnel narrows 33 → 21 → 19 → 19 → 6, validated experts rank first with prior-outcome reasons, and unproven eligible peers surface with the exploration reason. The `Demo consent change` toggle still drops a candidate via the policy engine.
- **Open:** Feedback capture in the UI does not yet write back into `trustEdges` (the flywheel is exercised in tests, not from the live UI); no policy toggle (UCB/Thompson) surfaced to users; matching is not filtered by a target specialty (ranks purely on expertise + trust across eligible peers).
- **Next:** Persist post-connection feedback from the UI into the trust graph and reflect it in the audit timeline; optionally expose the funnel/exploration in the demo script.

### 2026-09-26 — Reciprocal contact reveal and read-aware badges

- **Changed:** Connected mutual contact approval to the physicians' actual account emails on both requester and recipient screens, kept email addresses out of consult request snapshots, added separate recipient/requester read timestamps, and changed Inbox and Doctor Connect badges to count only unread requests and unread answers for the active account.
- **Verified:** `npm run check` passes TypeScript validation, fifteen tests, and the production build.
- **Open:** Browser-level coverage for double-consent reveal, consent revocation, and multi-tab badge transitions remains open.
- **Next:** Add an authenticated browser test covering Elena → Maya → Elena, reciprocal email reveal, and badge clearing.

### 2026-09-26 — DocUpdate-style local sign-in and sign-up

- **Changed:** Removed Auth0 and its environment configuration, added a responsive DocUpdate-inspired account entry screen, seeded separate Elena, Maya, and Jordan credentials, added NPI-matched sign-up, stored local passwords as SHA-256 hashes, and kept all product/inbox data bound to the signed-in account.
- **Verified:** `npm run check` passes TypeScript validation, fourteen tests, and the production build. Credential tests accept Maya's correct password, reject an incorrect password, and confirm Maya and Elena map to different HCP IDs. The sign-in screen was reviewed in headless Chrome at 1440 × 1000 and matches the supplied pale-cyan, dotted, split-layout reference direction.
- **Open:** Browser automation for form submission and the full Elena → Maya → Elena lifecycle remains open. The local credential store is not production authentication and must be replaced before deployment.
- **Next:** Add browser-level coverage for sign-in, sign-up validation, account isolation, and the two-physician Doctor Connect flow.

### 2026-09-26 — Account-bound HCP workflow and answer notification

- **Changed:** Removed unauthenticated physician switching and URL inbox impersonation, required a valid Auth0 HCP claim for all product access, made Maya and Elena eligible directory accounts, added structured requester/recipient identity snapshots, filtered Inbox strictly by the signed-in account, persisted each requester's active consult, and added Inbox/answered navigation badges plus automatic restoration to the final answer step.
- **Verified:** `npm run check` passes TypeScript validation, twelve tests, and the production build. The broker test confirms Elena can see Maya but not herself and Maya can see Elena but not herself.
- **Open:** The team must configure the Auth0 tenant and two user accounts before hands-on authentication QA. Cross-browser or cross-device delivery still requires a protected shared backend rather than browser-local state.
- **Next:** Configure Elena (`hcp-1`) and Maya (`hcp-maya`) in Auth0, run the full account-switch flow, then add browser automation for it.

### 2026-09-26 — Two-sided Doctor Connect and Auth0 boundary

- **Changed:** Removed demo framing from the physician UI, added a recipient Inbox with accept/decline, structured answering, and independent contact approval, synchronized consult state between same-browser tabs, and integrated the official Auth0 React provider behind environment configuration. Fictional medical/product facts now use the quieter **Illustrative record** provenance label.
- **Verified:** `npm run check` passes TypeScript validation, eleven tests, and the production build.
- **Open:** Auth0 tenant credentials and HCP claims must be configured by the team. Multi-device delivery still requires a protected API, durable database, server-side policy enforcement, and realtime infrastructure; browser interaction automation and hands-on responsive QA remain open.
- **Next:** Configure the Auth0 SPA and two physician accounts, then implement or select the hosted request/realtime backend if the presentation must span separate devices.

### 2026-09-26 — Readability, focused Updates, and persona data

- **Changed:** Repaired the Doctor Connect step connector, increased Connect and Mirror typography, strengthened Mirror class-control and homepage eyebrow contrast, replaced the stacked Updates feed with a left selector and focused right-side panel with previous/next controls, restored four eligible specialist cards with a derived count, and made both HCP personas use distinct Mirror, Connect, and Updates fixtures.
- **Verified:** `npm run check` passes TypeScript validation, eleven tests, and the production build. Headless Chrome renders of Connect, Mirror, and the full Updates page were reviewed at 1440px; the step line clears its labels and the specialist row shows four cards.
- **Open:** Hands-on touch QA and browser interaction automation remain open.
- **Next:** Add browser tests for persona switching and previous/next update navigation.

### 2026-09-26 — DocUpdate-compatible editorial redesign

- **Changed:** Rebuilt the shared shell as a floating white physician-product header and redesigned Updates around the supplied DocUpdate references: pale blue canvas, editorial serif hierarchy, violet pill actions, an article-style update feed, focused before/after story, and a four-person specialist gallery. Corrected the primary system plan and maintained context so the old internal Ledger concept is no longer described as current.
- **Verified:** `npm run check` passes TypeScript validation, ten tests, and the production build. Headless Chrome desktop and narrow-width captures were reviewed; mobile heading wrapping and overflow defenses were corrected.
- **Open:** Hands-on touch QA, browser interaction automation, real editorial assets, and replacement of unused legacy schema-diff scaffolding remain open.
- **Next:** Add an end-to-end Updates selection and Doctor Connect handoff test, then exercise the complete demo on a physical phone.

### 2026-09-26 — Contextual bandit ranking (RL step 2)

- **Changed:** Replaced the trust-average in `@relay/network-graph` with a contextual multi-armed bandit. Context is the request plus each peer's expertise evidence; reward is consented feedback (`yes`/`somewhat`/`no` → `1.0`/`0.5`/`0.0`) kept as a Beta posterior per (expert, topic). Added a deterministic **UCB** policy (default, exploration bonus shrinks with evidence and is `0` with no feedback yet) and a seeded **Thompson sampling** policy (Mulberry32 PRNG + Marsaglia–Tsang gamma to draw `Beta(1+successes, 1+failures)`), both clamped to the 0.30 trust weight. Hard eligibility filters still run strictly before the bandit. `matchPeers` now accepts `policy`, `seed`, and `explorationC`. Documented in `docs/network-graph-plan.md` (new §6.5), `org/DECISIONS.md`, and `org/CONTEXT.md`.
- **Verified:** `npm run check` passes TypeScript validation, 28 tests (3 new bandit tests), and the production build. New tests cover UCB determinism plus exploration of an unproven eligible peer (validated expert still outranks it), Thompson reproducibility for a fixed seed within `[0,1]`, and hard-filter enforcement under both policies. All prior Network Graph tests still pass unchanged.
- **Open:** Not yet wired to the UI or audit; UI does not yet let a user toggle policy or visualize exploration. Weights and exploration constant (`c = 0.15`) are configuration assumptions, not tuned.
- **Next:** Wire matching + feedback into the Doctor Connect UI and audit timeline, and optionally surface the funnel and an "exploration" badge in the demo.

### 2026-09-26 — Synthetic Network Graph data + validation (RL step 1: data first)

- **Changed:** Added synthetic Network Graph fixtures to `demo-seed` derived from the existing physicians and their prescribing history: 16 expertise tags (drug classes, conditions, topics, affiliations), evidence-bearing `expertiseEdges` (prescribing → `IMPIRICUS_SIGNAL`, declared corroboration, periodic `PUBLICATION` standouts), `peerHelpProfiles` (offered tags, help modes, opt-in), and seeded `trustEdges` for a few validated experts. Added a governed `readNetworkGraph` broker read (`PEER_MATCHING`, returns fresh copies) re-exported from `relay-core`.
- **Verified:** `npm run check` passes TypeScript validation, 25 tests (2 new), and the production build. New tests run `matchPeers` on the synthetic data (validated expert ranks first for an SGLT2 + renal need; all matches eligible; funnel narrows) and confirm the learning flywheel raises a peer's score after positive feedback. The new `demo-seed`/broker code is now covered by `tsc -b`.
- **Open:** Trust is still a feedback-weighted average, not yet the chosen contextual bandit. Not wired to the UI or audit yet.
- **Next (RL step 2):** Replace the trust-average with a contextual bandit — Thompson sampling with a deterministic UCB fallback — update `docs/network-graph-plan.md` and `org/DECISIONS.md`, and test the RL policy (exploration/exploitation, reproducibility) on this synthetic data.

### 2026-09-26 — User-facing README rewrite

- **Changed:** Rewrote `README.md` as a firm, user-facing product overview: leads with the underserved-doctor problem, contrasts with headline/LinkedIn matching, positions Relay as a continuously learning matcher on prescribing/drug/region history and validated peer outcomes, describes the three physician actions (find a peer, see who practices like you, discuss medicine changes via Ledger with a "how do we incorporate this change into our workflow" message to specialists), and states the data-storage model (synthetic in-memory today; MongoDB + Neo4j behind the broker in production). Removed the self-questioning "Is this AI orchestration?" section per request.
- **Verified:** Documentation-only; no code changed. Links and section references checked against the repo.
- **Open:** None specific to the README.
- **Next:** Generate synthetic Network Graph data and validate the matching + learning logic on it.

### 2026-09-26 — Relay Network Graph documented and backend logic added

- **Changed:** Added the Network Graph as the learning matching substrate for Doctor Connect. Wrote `docs/network-graph-plan.md`; updated `org/CONTEXT.md` (new section, derived profile, computations, collections, scope, acceptance criteria), `org/DECISIONS.md` (accepted decision), `org/README.md` (source list), and `docs/doctor-connect-plan.md` (forward reference). Added domain types (expertise tags/edges, help profiles, trust edges, need, match/funnel/result) and a new `@relay/network-graph` feature implementing evidence-combined expertise strength, a deterministic hard-filter-then-rank matching funnel, trust aggregation with saturation, and `recordConnectionOutcome` for the learning loop.
- **Verified:** `npm run check` passes TypeScript validation, 23 tests (5 new), and the production build. Tests cover evidence combination, funnel filter order, honest no-match, trust-edge creation/reinforcement/averaging, and the flywheel (positive feedback raises a peer's match score).
- **Open:** Not yet wired to synthetic seed data, the data broker, the UI, or audit events; no Gemini intent extraction (structured categorical need only). The feature is exercised by its own tests but is not yet typechecked by `tsc -b` because no app imports it.
- **Next:** Generate synthetic Network Graph data (expertise tags/edges, help profiles, seed trust edges), add governed broker reads, and validate the matching + learning logic on that data; then wire the Doctor Connect UI and audit events.

### 2026-09-26 — Peer domain discovery wired into Practice Mirror (step 2)

- **Changed:** Added `suggestSimilarPrescribers` (peers with a similar share for one selected drug class) alongside the existing domain clustering, and wired a "Physicians who prescribe like you" panel into Practice Mirror. It offers two views — "Similar on {selected drug}" and "Your overall domain" (the physician's cluster) — behind an explicit reveal that logs a `PEER_MATCHING` audit event. Peer identity is surfaced only for opted-in physicians and each card hands off to Doctor Connect for contact under mutual consent. Reconciled the personas' clustering vectors with their Practice Mirror class shares so displayed values agree (Maya = GLP-1-led, SGLT2 18%).
- **Verified:** `npm run check` passes TypeScript validation, 18 tests (2 new for `suggestSimilarPrescribers`), and the production build. Verified live in the in-IDE browser: reveal action, both tabs, consent-gated cards, consistent shares, and correct domain labels.
- **Open:** No Gemini phrasing yet (deterministic labels only). Jordan's Mirror comparison still reuses Maya's hardcoded `mirrorClasses` chart values (pre-existing simplification); only the peer "your share" is persona-accurate.
- **Next:** Optionally mirror the same discovery affordance inside Doctor Connect, and add a browser test for the Mirror peer-discovery reveal and tab switch.

### 2026-09-26 — Peer domain clustering (AI/ML backend, step 1)

- **Changed:** Added `@relay/peer-clustering`, a deterministic seeded k-means over synthetic per-physician prescribing vectors, plus `suggestDomainPeers` for "doctors in your domain" suggestions. Added clustering domain types, 38 synthetic prescribing profiles (36 HCPs + 2 personas across three latent domains) in `demo-seed`, and a governed `readClusteringDataset` broker read (`AGGREGATE_ANALYTICS`) re-exported from `relay-core`. Peer suggestions are gated by `PEER_MATCHING` consent.
- **Verified:** `npm run check` passes TypeScript validation, 16 tests (6 new), and the production build. Tests cover determinism, full k-partition, latent-domain recovery, consent gating, similarity ordering, and consent-revocation exclusion.
- **Open:** No UI is wired to the clustering output yet, and Gemini phrasing of domain labels is not implemented (deterministic labels only). Clustering is descriptive and must not be presented as expertise, quality, or a Connect ranking substitute.
- **Next:** Wire a "peers in your domain" view onto the clustering output (reusing the data broker), then optionally add Gemini phrasing with the deterministic label as fallback.

### 2026-09-26 — HCP Ledger Updates view

- **Changed:** Added a role-specific HCP Updates view on the Ledger route, exposed it in physician navigation, seeded three synthetic reviewed changes, added purpose-aware specialty filtering, displayed before/after versions and relevance reasons, and connected each update to a governed Doctor Connect topic. The compliance persona retains the existing client data-scope Ledger.
- **Verified:** `npm run check` passes TypeScript validation, ten tests, and the production build. The HCP Updates screen was visually checked in headless Chrome at 1440 × 1000.
- **Open:** Production Spark event ingestion, editorial review workflow, explicit topic-follow controls, and real notification delivery are not implemented.
- **Next:** Add an end-to-end test for Spark notification → Updates → Doctor Connect and define the reviewed update publishing workflow.

### 2026-09-26 — Ledger medicine-change direction

- **Changed:** Reframed Ledger as a physician-facing medicine-change explorer, replaced generic resource fixtures with three synthetic pharma/product component changes, displayed four eligible specialists per update, and removed the internal client data-scope editor from active navigation and routing.
- **Verified:** `npm run check` passes TypeScript validation, ten tests, and the production build.
- **Open:** Source verification, editorial publishing, pharmacovigilance handling, and hands-on mobile interaction QA remain open.
- **Next:** Add browser coverage for update selection, four-specialist display, and the governed Doctor Connect handoff.

### 2026-09-26 — Required general-question confirmation

- **Changed:** Doctor Connect now requires the physician to affirm that the question is general and does not describe a specific patient before peer matching can begin.
- **Verified:** The confirmation is controlled, starts unchecked, and gates both the visible action and its event handler.
- **Open:** Browser-level automation for this gate remains part of the planned end-to-end coverage.
- **Next:** Add the confirmation gate to the Doctor Connect browser test when the end-to-end harness is introduced.

### 2026-09-26 — Physician-first UI simplification

- **Changed:** Replaced the prior navy/lime styling with the supplied Impiricus charcoal, cyan, magenta, and white direction. Reduced the physician home screen to two actions, limited physician navigation to three destinations, progressively disclosed optional Doctor Connect context, removed the reusable-answer detour from the main path, and simplified Mirror language and actions.
- **Verified:** `npm run check` passes TypeScript validation, nine tests, and the production build. Headless Chrome desktop renders of Home, Mirror, and Connect were visually checked at 1440 × 1000; mobile overflow defenses and breakpoints were updated.
- **Open:** Hands-on mobile interaction QA and end-to-end browser automation remain outstanding.
- **Next:** Exercise the full flows on a phone-sized browser and add browser tests for the core demo paths.

### 2026-09-26 — Functional browser prototype

- **Changed:** Initialized the npm workspace and implemented an Impiricus-adjacent React/Vite interface for Practice Mirror, Doctor Connect, Ledger, and the shared audit timeline. Added shared domain, policy, broker, audit, seed, and feature-computation packages with synthetic data and deterministic failure paths.
- **Verified:** `npm run check` passes TypeScript validation, nine tests across five suites, and the production build. The Vite server returns the application shell; headless Chrome renders of Home, Mirror, Connect, and the Ledger role gate were visually checked at 1440 × 1000.
- **Open:** Mobile and hands-on interaction QA, browser-level interaction tests, deployment, backend persistence, and production integrations remain outstanding. `npm install` reports two moderate dependency advisories that should be reviewed before any production use.
- **Next:** Run responsive Chrome QA and add end-to-end coverage for the four critical demo paths.

### 2026-09-26 — Relay-wide branding and synchronized agent skill

- **Changed:** Updated the PowerPoint and all active app-facing files to Relay, added a repository-local Relay project skill, and linked Claude, Gemini, `.agents`, and Codex entry points to canonical instructions.
- **Verified:** The 11-slide deck passes package-integrity and layout-geometry checks and opens in Keynote with Relay branding. Skill frontmatter parses, no scaffold TODO remains, and every instruction/skill link resolves to the canonical file.
- **Open:** Runtime frameworks and application code remain unselected.
- **Next:** Select the TypeScript workspace and frameworks, then implement shared domain contracts and deterministic policy fixtures.

### 2026-09-26 — Relay naming and team structure

- **Changed:** Renamed the active product to Relay, renamed the maintained system and Markdown pitch files, added the application/package/feature/config/test directory structure, and documented ownership and dependency direction.
- **Verified:** Confirmed maintained Markdown and the PowerPoint use Relay as the product name, checked the deck package and slide geometry, and checked repository documentation links.
- **Open:** Runtime frameworks and workspace tooling remain unselected.
- **Next:** Agree on the TypeScript workspace and web/API frameworks, then implement shared domain contracts and policy fixtures first.

### 2026-09-26 — Context foundation

- Reviewed every project plan and pitch artifact in `docs/`, excluding `docs/Claude interactions/` as requested.
- Added repository-wide AI/contributor instructions in `AGENTS.md`.
- Added the maintained `org/` context map, consolidated application context, decision record, current status, and update protocol.
- Recorded where later plans supersede older pitch claims.

## Update template

Add a short entry only for material work:

```md
### YYYY-MM-DD — Outcome

- **Changed:** Implemented or decided facts.
- **Verified:** Tests, manual paths, or evidence checked.
- **Open:** Remaining risk or blocker.
- **Next:** Best next task.
```
