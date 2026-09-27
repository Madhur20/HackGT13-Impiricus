# Relay project status

Last updated: 2026-09-26.

## Current state

- **Stage:** Functional browser-first hackathon prototype.
- **Repository contents:** Product/system plans, maintained context, contribution guidance, module boundaries, and a TypeScript workspace.
- **Application code:** React/Vite web shell with Home, Practice Mirror, Doctor Connect, physician-facing Ledger Updates, and a shared Audit view.
- **Tests:** Deterministic tests across cohort comparison, matching, policy, data-broker (including update filtering/personalization and specialist eligibility), semantic-diff, peer domain clustering/discovery, and Network Graph expertise/trust matching, contextual-bandit ranking (UCB determinism/exploration, seeded Thompson reproducibility, eligibility), and learning behavior (validated on synthetic graph fixtures).
- **Demo readiness:** Core click paths work from synthetic seed data and the production bundle builds. The redesigned physician screens (shared shell, Practice Mirror with peer discovery, Doctor Connect, Updates) pass headless Chrome desktop review; hands-on mobile interaction QA remains open.
- **Data:** Thirty-six synthetic HCP profiles, prescribing fixtures, per-physician prescribing vectors and persona-specific Mirror data, Network Graph fixtures (expertise tags/edges, peer-help profiles, seeded trust edges), three reviewed medicine-update fixtures, consent failure cases, and a fictional versioned policy.
- **Deployment:** Local Vite build only; no hosted deployment or backend is configured.

Plans remain broader than the prototype. Do not infer production integrations, legal approval, real credentialing, or durable storage from the working UI.

## Active priority

Harden the working prototype for the hackathon demo:

1. Perform hands-on responsive QA in Chrome and on a phone-sized device.
2. Add browser-level tests for the Mirror → Connect handoff, consent revocation, double-consent contact reveal, and Updates → Connect handoff.
3. Add a deterministic demo reset for page-local state, not only persona and audit state.
4. Decide whether the hackathon needs a minimal API/persistence layer or should remain an intentionally local prototype.
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

### 2026-09-26 — Merged redesigned UI with the model; wired the bandit into Doctor Connect

- **Changed:** Merged the `logic` model branch (peer clustering, Network Graph, contextual-bandit matcher, synthetic graph fixtures) into `GPT-POC` (redesigned UI). Resolved conflicts in `README.md`, `MirrorPage.tsx` (kept the persona-specific Mirror data and the peer-discovery panel), and `org/` context. Wired `@relay/network-graph` `matchPeers` (deterministic UCB) into the redesigned `ConnectPage`: the governed question maps to expertise tags (drug class + condition), the eligible pool is ranked by the bandit, and step 2 now shows the live matching funnel and an "Exploring" badge for exploration-surfaced peers. Added `@relay/network-graph` as an `apps/web` dependency.
- **Verified:** `npm run check` passes TypeScript validation, 29 tests, and the production build. Verified live in the in-IDE browser at `/connect`: funnel narrows 33 → 21 → 19 → 19 → 6, validated experts rank first with prior-outcome reasons, and unproven eligible peers surface with the exploration reason. The `Demo consent change` toggle still drops a candidate via the policy engine.
- **Open:** Feedback capture in the UI does not yet write back into `trustEdges` (the flywheel is exercised in tests, not from the live UI); no policy toggle (UCB/Thompson) surfaced to users; matching is not filtered by a target specialty (ranks purely on expertise + trust across eligible peers).
- **Next:** Persist post-connection feedback from the UI into the trust graph and reflect it in the audit timeline; optionally expose the funnel/exploration in the demo script.

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
