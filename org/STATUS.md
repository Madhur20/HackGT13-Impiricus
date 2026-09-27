# Relay project status

Last updated: 2026-09-26.

## Current state

- **Stage:** Functional browser-first hackathon prototype.
- **Repository contents:** Product/system plans, maintained context, contribution guidance, module boundaries, and a TypeScript workspace.
- **Application code:** React/Vite web shell with a DocUpdate-inspired local sign-in/sign-up experience, Home, Practice Mirror, requester and recipient sides of Doctor Connect, physician-facing Ledger Updates, and a shared Audit view.
- **Tests:** Fifteen deterministic tests across local credential validation, account-aware matching, consult unread counts, cohort comparison, policy, data-broker, update filtering/personalization, specialist eligibility, and legacy schema-diff behavior.
- **Product readiness:** Core click paths work from illustrative local records and the production bundle builds. Physician identity is account-bound through local sign-in, and same-browser account changes preserve Doctor Connect send, accept, answer, contact-approval, and final-response state. Hands-on full-flow and mobile interaction QA remains open.
- **Data:** Thirty-eight synthetic HCP directory profiles, including first-class Maya and Elena accounts, prescribing fixtures, three reviewed medicine-update fixtures, consent failure cases, and a fictional versioned policy. Unused legacy client-scope fixtures remain technical cleanup.
- **Deployment:** Local Vite build only. No external identity configuration is required. Production authentication, durable request storage, and multi-device realtime transport are not configured.

Plans remain broader than the prototype. Do not infer production integrations, legal approval, real credentialing, or durable storage from the working UI.

## Active priority

Harden the working prototype for the hackathon demo:

1. Perform hands-on responsive QA in Chrome and on a phone-sized device.
2. Add browser-level tests for the Mirror → Connect handoff, consent revocation, double-consent contact reveal, and Updates → Connect handoff.
3. Add an authenticated browser test for Elena → Maya → Elena request completion.
4. Add the authenticated API/persistence and realtime service required for multi-device Doctor Connect, or keep the current same-browser preview boundary explicit.
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
