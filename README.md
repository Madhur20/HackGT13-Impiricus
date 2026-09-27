# Relay

**Relay connects underserved doctors to the specialists who can actually help them — matched on real prescribing, drug, and regional history, and getting smarter with every connection.**

**Live app:** <https://relay-hackgt13.vercel.app>. See [Sign-in and two-physician testing](#sign-in-and-two-physician-testing) for the physician accounts.

## The problem

Doctors at large academic hospitals already have a network. There is a cardiologist down the hall, an oncologist in the next department, a specialist they trained with, a colleague they can text when a case gets hard.

Community, rural, and independent physicians do not have that. When they hit a difficult case, there is often no one to turn to. Their problem is not a lack of medical information — it is not knowing *which doctor to talk to*.

Existing tools do not solve this. A directory or a LinkedIn-style profile matches on **headlines**: a title, a specialty label, a bio. That tells you someone is "a cardiologist." It does not tell you they actually treat what you are dealing with, prescribe what you prescribe, or have ever helped a physician in your situation.

## What Relay does

Relay is not a social network. There are no feeds, no followers, and no profiles to scroll. You tell Relay what you need, and it connects you to a peer who genuinely fits.

Relay matches doctors on real signals, not headlines:

- the **drugs and prescriptions** you and they actually use,
- your **region** and practice setting,
- **demonstrated expertise** — declared experience, specialty, and publications, and
- **validated outcomes** — other physicians who found that peer genuinely helpful.

So instead of returning "300 cardiologists," Relay finds the cardiologist who prescribes what you prescribe, treats what you treat, and has already helped physicians like you. Then, only when both doctors agree, it opens the connection.

Relay does all of this using **zero patient data**.

## It learns from every connection

Relay learns which peers actually help. Two separate models group and rank physicians:

1. **Prescribing-domain clustering (k-means)** groups doctors by how they actually prescribe. Practice Mirror uses it to show "who practices like you."
2. **Reinforcement-learning peer matching (contextual bandit)** ranks the eligible specialists for a specific Doctor Connect question. It learns from each connection's outcome which peers really help on which topics.

Both models use only physician-level professional data, never patient data. Both run behind the same consent and policy checks.

## Three things you can do in Relay

### 1. Find the right peer

Describe what you need — the topic, the medication or therapy, a general age group, and the condition context — and Relay routes you to eligible, opted-in specialists ranked by the reinforcement-learning matcher on expertise evidence, proven peer outcomes, specialty, and availability. You see clear reasons for every match ("relevant SGLT2 publication history," "strong prior peer outcomes (5 helpful connections)," "verified Endocrinology"), pick one, and send a privacy-checked question. Contact details are revealed only after both sides agree.

### 2. See who practices like you

Relay groups physicians by their real prescribing and drug history, so you can see the peers who practice the way you actually practice — not just those who share your job title. It also gives you a private, honest view of how your prescribing mix compares with a similar peer group, with no judgment and no quality scoring.

### 3. Understand and discuss medicine changes (Ledger / Updates)

When a drug you prescribe changes — a reformulation, a swapped component, a new excipient — Relay shows you **exactly what changed**, before and after, in plain language. Then it connects you with specialists who also prescribe that drug so you can ask the question that actually matters: **"How do we incorporate this change into our workflow?"** You send a governed message, the specialist responds, and you make the decision with real peer input instead of guesswork.

## How the intelligence works

All of Relay's models are deterministic and reproducible. Given the same data and seed, they produce the same result, and they run fully offline.

### Clustering doctors by prescribing domain (`features/peer-clustering`)

Each physician is represented as a **prescribing vector**: their share of prescriptions in each drug class (for example SGLT2 inhibitors, GLP-1 receptor agonists, DPP-4 inhibitors, basal insulin, metformin and other oral drugs).

- **k-means with k-means++ seeding** (default `k = 3`, seed `42`, up to 50 iterations) groups the vectors into prescribing domains. Profiles are sorted by ID and a seeded Mulberry32 random number generator picks the starting centroids, so the clusters are the same on every run.
- Each cluster is labelled from its dominant drug classes, meaning classes with at least a 15% share of the centroid, for example *"GLP-1 receptor agonists & SGLT2 inhibitors domain"*.
- **Domain peers** are the other members of your cluster, ranked by cosine similarity to your vector.
- **Similar prescribers** answers "who prescribes *this* drug like I do?" It returns peers whose share of one drug class is within ±6 percentage points of yours.
- Before any peer's identity is shown, the policy engine must confirm that the peer is verified and has an active `PEER_MATCHING` consent. Clustering describes practice patterns only. It never claims expertise, quality, adherence, or treatment appropriateness.

### Ranking peers with reinforcement learning (`features/network-graph`)

Doctor Connect models peer matching as a **contextual multi-armed bandit**, the single-step form of reinforcement learning. It fits this problem because each connection is an independent decision with immediate feedback. A full sequential MDP would add complexity and hidden state without adding any benefit.

| RL concept | In Relay |
|---|---|
| **Context** | The physician's request, reduced to topic tags (drug class, condition, help mode), plus each candidate's expertise evidence |
| **Arms (actions)** | The eligible peers who could be recommended |
| **Reward** | Consented post-connection feedback: *useful* `yes = 1.0`, `somewhat = 0.5`, `no = 0.0` |
| **Belief** | A Beta posterior over usefulness for each (expert, topic) pair, built from success and interaction counts |

**The matching funnel.** Every stage is a hard filter, and the bandit runs only at the end:

```text
1. Specialty pool
2. Expertise evidence ≥ 0.30 on a requested topic   (so a job title alone never qualifies)
3. Opted into peer support for the requested help mode
4. Verified + active matching consent + available      (enforced by the policy engine)
5. Contextual-bandit ranking of the survivors
```

Because the bandit only reorders peers who already passed all four filters, exploration can never surface an ineligible peer.

**Scoring.** Each eligible peer receives a peer-fit score:

```text
score = 0.50 × expertise evidence
      + 0.30 × bandit trust estimate
      + 0.10 × specialty fit
      + 0.10 × availability fit
```

- **Expertise evidence** comes from independent sources that reinforce each other: `strength = 1 − Π(1 − wₛ)`. The source weights are publication 0.50, self-declared 0.40, Impiricus signal 0.35, specialty 0.30, and synthetic 0.30. Expertise backed by more than one source therefore outranks a single self-declaration.
- **Bandit trust estimate.** Two exploration policies share the same posterior:
  - **UCB (default, deterministic):** `trust = mean + c · √(ln(N + 1) / (nᵢ + 1))`, with `c = 0.15`. `mean` is the peer's observed success rate on the topic, `nᵢ` is their number of interactions on it, and `N` is the total interactions across eligible peers. Proven experts are exploited, while under-connected peers get a small exploration bonus that shrinks as evidence builds up. Without this bonus, isolated physicians would never become visible.
  - **Thompson sampling (seeded):** `θ ~ Beta(1 + successes, 1 + failures)`, sampled with a seeded random number generator and a Marsaglia–Tsang gamma sampler, so exploration is random yet reproducible.
- The trust term is clamped to `[0, 1]` and weighted at only 0.30. Exploration therefore breaks ties between comparable peers but never overrides real expertise. A peer surfaced by exploration is labelled honestly in the UI (*"Exploring"*, *"Newer peer — surfaced to grow the network"*).

**The learning step.** `recordConnectionOutcome` updates the posterior. Feedback of `yes` or `somewhat` counts as a success, and `no` counts as a failure. The function creates or strengthens the `(requester → expert, topic)` trust edge and keeps a running average of usefulness. It is a pure function that stores only counts, scores, topic IDs, and a timestamp, with no patient data and no message content. The next time someone asks about that topic, the updated posterior changes the ranking: each successful connection improves the next match.

> **Status:** Bandit ranking (UCB) is live in Doctor Connect. The learning update and the positive-feedback loop are implemented and covered by tests. Capturing the *"Was this useful?"* feedback in the live UI and writing it back into the trust graph is still planned. Thompson sampling is implemented and tested but is not yet exposed in the UI.

### Where generative AI fits

Generative AI (Gemini) is limited to an **explanation layer**. It may turn facts that were already approved into readable summaries. It never decides who is eligible, ranks peers, reviews messages for privacy, or invents information. Every AI surface has a deterministic fallback, so Relay also works with no network connection.

## Privacy and security layer: keeping patient information out of Doctor Connect

Doctor Connect lets physicians ask peers for help with real clinical situations. That is where patient information is most likely to slip in, so the whole flow is designed around one rule: **only general, non-identifying clinical-practice context may leave the author's browser form.** The approach follows HIPAA's *minimum necessary* principle and uses the HHS Safe Harbor list of identifiers as the checklist for what to block.

### 1. No open chat

Doctor Connect is **not a chat**. Removing free-form surfaces removes most of the places where patient information could appear:

- The requester fills in **four separate short fields**, each with its own length limit: topic (120 characters), medication or therapy (100), age or age group (40), and general condition context (120). Relay assembles them into one question: *"How do peers approach [topic] for [therapy] in [age group] patients with [condition]?"*
- The responder writes **one answer of up to 700 characters**. Optional labelled lines (Approach, Monitoring, Escalation, Additional context) help structure it.
- There is one answer per accepted request, with **no reply thread, no attachments or images, no patient-narrative box, and no exact-dose fields**.

### 2. Deterministic identifier scan (`features/doctor-connect`)

Nothing is checked or rewritten while the physician types. When the physician selects **Check privacy & safety**, each field is scanned separately by a versioned rule set (`connect-guardrails-v2`). The rules map to the HIPAA Safe Harbor identifiers:

| Safe Harbor identifier | What Relay detects |
|---|---|
| Names | Patient/person introductions (*"my patient Bob"*, *"patient named…"*), titles (*Mr./Mrs./Dr.*), initials (*"Patient J.D."*), family relations, possessives (*"Bob's renal impairment"*), names before clinical verbs (*"Maria has CKD"*), and trailing names (*"renal impairment for Bob"*) |
| Geographic units smaller than a state | Street addresses, P.O. boxes, ZIP/postal codes, *"lives at / works on…"* |
| Dates | Numeric, ISO, and written-month dates, date of birth, birth year |
| Ages over 89 | Generalized to *Adults 90+* (see below) |
| Phone and fax numbers | Formatted and unformatted US numbers, *"phone / cell / fax #"* |
| Email addresses | Standard and lightly disguised (*"name at domain dot com"*) |
| Social Security numbers | `###-##-####` and *"SSN …"* |
| Medical record, health plan, and account numbers | MRN, chart, account, member, claim, case, policy, encounter, insurance/subscriber/beneficiary/group IDs |
| Certificate and license numbers | Driver's license and passport numbers |
| URLs and IP addresses | Web links, social handles, IPv4 addresses |
| Photos and biometrics | Not possible to send: Doctor Connect has no attachment or image upload |

### 3. Age is generalized, not deleted

An exact age such as `72` is useful clinical context but can also help identify someone. When it is entered in the age field, the review step converts it to a coarse range: *under 18*, *18–39*, *40–64*, *65–89*, or *90+*. The confirmation screen shows the physician both values (*Entered: 72 → Adults 65–89*), and only the range is stored. An exact age written in any other field (*"a 72-year-old…"*) blocks the question instead.

### 4. Flagged text is blocked, never silently redacted

If the scan finds a likely identifier, Relay names the problem (for example *"patient or named-person reference"*) and shows a **redacted preview** (`[name removed]`, `[phone removed]`…). It then **blocks the message until the physician edits the field and runs the check again**. Relay never quietly sends a redacted version, because automatic rewriting could change the clinical meaning without the physician noticing. Any edit after a passing check invalidates it, so the check has to run again.

### 5. Safety-event stop path

Phrases such as *"adverse event"*, *"suspected safety event"*, *"product complaint"*, or *"patient died"* stop the workflow and are recorded in the audit trail. Those cases belong in pharmacovigilance reporting, not in peer matching.

### 6. Exact preview and explicit confirmation

Both sides see **exactly** what will be sent before sending. The requester reviews the assembled question and all four field values. The responder ticks: *"I reviewed this exact answer, confirm it contains no patient-identifying information, and want to send it as my professional experience."* Sending stays disabled until the physician confirms.

### 7. Validation repeated at the storage boundary

The UI is not the only protection. `prepareQuestionSelection` and `prepareAnswerText` run the full scan again when a consult is stored, and throw an error if anything fails. As a result, text that failed the check can never reach consult storage, even if the UI is bypassed. Stored consults record the taxonomy and guardrail versions that approved them.

### 8. Temporary drafts are cleared

After sending, the temporary draft, the scan results, and the redacted previews are cleared from the form. Only the approved question or answer is kept, because the other physician needs it. A version that failed the check is never kept.

### 9. Consent, policy, and audit around the conversation

- **Identity:** A peer appears in matches or clusters only if the deterministic policy engine (`packages/policy-engine`) confirms they are verified, have an active `PEER_MATCHING` consent, and are available.
- **Contact details:** A peer's email is shown only when **both** physicians have approved contact (`PEER_CONTACT`). The policy engine checks this again every time the contact details are requested.
- **Data minimization:** Every read passes through the purpose-aware data broker (`packages/data-broker`). No store holds patient-level data. The bandit sees only counts, posteriors, and topic IDs. Topic tags are derived internally for matching and are never shown as physician-entered text.
- **Audit:** Every policy decision creates an append-only audit event stamped with the policy version. Audit summaries refer to requests by ID only and **never include question or answer text**.
- **Physician identity:** The acting physician is always taken from the signed-in session. There is no profile switcher and no way to impersonate another physician through URL parameters.

### What this does and does not guarantee

This layer **greatly reduces** the risk of physicians sharing protected health information. It is not, on its own, a HIPAA compliance certification. Pattern rules can miss unusual phrasings, and a combination of ordinary facts can still identify a patient in a small practice or with a rare condition. The live build at <https://relay-hackgt13.vercel.app> is a static front end with no backend: these checks run in the browser, and consults are kept in browser-local storage. Using Relay for real patient conversations would also require:

- the same validation enforced on an authenticated server;
- a reviewed contextual classifier or a human-review path for uncertain cases (this would receive one locally redacted field at a time and could never override a deterministic block);
- Business Associate Agreements, retention, and vendor data-use terms;
- monitoring and incident response;
- a formal privacy, security, and clinical review.

## Where doctor data is stored

Relay stores a doctor's **professional** information only — identity, specialty, expertise, prescribing history, region, affiliations, availability, help preferences, and successful-connection outcomes. It never stores patient names, records, diagnoses, or any patient-level data.

- **In this prototype**, all physician and product data is deterministic **synthetic** data. Seed data lives in memory behind Relay's purpose-aware data broker. The local account session uses browser `localStorage`. The consult lifecycle syncs across devices through a shared Supabase demo table (Realtime plus polling) that the browser calls directly, so two seeded physician accounts can complete the flow on two laptops; there is no hosted identity service or custom backend. Everything except cross-device consult delivery runs offline after dependencies are installed.
- **In production**, doctor data lives in two stores behind the same governance layer: a **document database** (MongoDB) for profiles, consent, provenance, requests, responses, policy, and audit records; and a **graph database** (Neo4j) for the Network Graph itself, because matching constantly follows relationships from a doctor to their expertise, evidence, availability, and prior successful connections.

Every read and write passes through the data broker and a deterministic policy engine. Consent is purpose-specific, provenance is attached to every field, every decision is recorded in an append-only audit trail, and no patient-level data is ever stored.

## Run the prototype

Use Node 20 or newer:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite and sign in with one of the physician accounts below. Use `npm run check` to run TypeScript validation, product-logic tests, and the production build.

The primary physician paths are `/mirror`, `/connect`, `/inbox`, `/ledger`, and `/audit`. The signed-in account determines the physician everywhere; Relay has no physician-switching control.

## Deploy to Vercel

The production deployment is available at <https://relay-hackgt13.vercel.app>. The repository includes a root `vercel.json` for the npm workspace. It installs from the repository root, builds `@relay/web`, publishes `apps/web/dist`, and rewrites client-side routes to `index.html`.

Using the Vercel CLI from the repository root:

```bash
vercel login
vercel
vercel --prod
```

No environment variables are required for the current hackathon build. Browser-local accounts, requests, and responses remain local to one browser profile after deployment; cross-device physician workflows require the planned authenticated API and durable realtime datastore.

## Sign-in and two-physician testing

The browser build includes local account-based sign-in and sign-up. No environment variables or external identity service are required.

| Physician | Email | Password |
|---|---|---|
| Dr. Elena Ruiz | `elena.ruiz@relay.health` | `Relay2026!` |
| Dr. Maya Chen | `maya.chen@relay.health` | `Relay2026!` |
| Dr. Jordan Brooks | `jordan.brooks@relay.health` | `Relay2026!` |

The sign-up form activates an existing eligible physician profile by matching its NPI. The seeded profile NPIs are:

- Maya: `1234567890`
- Elena: `1098765432`
- Jordan: `1357924680`

To exercise the flow (same browser, or Elena and Maya on two different laptops):

1. Sign in as Elena, send a Doctor Connect request to Maya, and sign out.
2. Sign in as Maya, open Inbox, accept the request, submit the structured answer, and sign out.
3. Sign back in as Elena. Doctor Connect shows an answer notification and opens directly to the final response step.

Requests reach the other laptop within about a second through the shared `consult_requests` table (Supabase Realtime, with a 4-second polling fallback). Within one browser, `BroadcastChannel` and `localStorage` keep tabs in sync. The table accepts anonymous reads and writes and must hold synthetic data only.

To reset between demo runs, run `delete from consult_requests;` in the Supabase SQL editor for project `relay-hackgt13`, then clear site data (or `localStorage`) in each browser.

This local account store is intentionally scoped to the hackathon browser build. A deployed environment must replace it with server-side authentication, protected sessions, credential verification, an authenticated API, and a realtime datastore.

## Start here

1. Read `AGENTS.md`.
2. Read `org/README.md`, `org/CONTEXT.md`, `org/DECISIONS.md`, and `org/STATUS.md`.
3. Read the plan for your workstream in `docs/` (start with `network-graph-plan.md` and `doctor-connect-plan.md`).
4. Follow `CONTRIBUTING.md` before adding a framework or dependency.

Claude reads `CLAUDE.md`, Gemini reads `GEMINI.md`, and Codex-compatible agents read `AGENTS.md`. These entry points resolve to the same canonical instructions. The shared Relay project skill is canonical under `.claude/skills/relay-project/` and linked into `.agents/skills/` and `.codex/skills/`.

## Repository structure

```text
apps/
  web/                       browser application and feature UI
  api/                       reserved for the future HTTP composition root
features/
  network-graph/             contextual-bandit (RL) peer ranking over the expertise + trust graph
  peer-clustering/           k-means prescribing-domain clustering and peer suggestions
  practice-mirror/           cohort comparison computation and use cases
  doctor-connect/            taxonomy, eligibility, ranking, and request states
  ledger/                    reviewed product-version comparison and update use cases
packages/
  domain/                    shared types, schemas, IDs, and value objects
  policy-engine/             deterministic, versioned access decisions
  data-broker/               mandatory purpose-aware data-access boundary
  explanations/              grounded payloads, validators, and fallbacks
  audit/                     append-only audit events and hash chaining
  relay-core/                small public facade over shared governance behavior
  demo-seed/                 deterministic local development fixtures
config/
  policies/                  fictional versioned policy configuration
  taxonomy/                  governed Doctor Connect taxonomy
  explanation-templates/     offline deterministic copy templates
tests/
  contract/                  shared interface and boundary tests
  integration/               cross-module server tests
  e2e/                       critical user and product paths
  fixtures/                  test-only immutable fixtures
scripts/                     repeatable developer, seed, and validation commands
infra/                       local and deployment configuration
docs/                        detailed product and system plans
org/                         maintained contributor and AI context
```

## Dependency direction

```text
apps -> features -> relay-core -> shared packages -> domain
   \-------- permitted direct imports from domain --------/
```

`domain` must not depend on another internal package. Shared packages must not import from `apps` or `features`. Feature packages must not import from one another; cross-product handoffs use shared contracts and application-level orchestration.

## Naming

Relay is the product name in maintained documentation, agent context, package naming, and pitch artifacts. The lowercase word "delta" may still appear when it describes an ordinary mathematical or schema difference.
