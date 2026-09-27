# Relay

**Relay connects underserved doctors to the specialists who can actually help them — matched on real prescribing, drug, and regional history, and getting smarter with every connection.**

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

Relay is a continuously learning platform. At its center is the **Relay Network Graph** — a living map of *who knows what* and *who has successfully helped whom*.

- **Who knows what.** Every physician is linked to the conditions, drug classes, topics, and skills they actually work in, backed by evidence (their prescribing history, declared experience, specialty, and publications). This is how Relay narrows a broad specialty down to the handful of doctors with real, relevant experience.
- **Who has successfully helped whom.** After each connection, Relay asks two quick questions — *Was this useful? Did you get what you needed?* A useful answer strengthens a trusted link to that specialist on that topic. Relay comes to know not just who *claims* expertise, but who other doctors genuinely found helpful.
- **The flywheel.** Every successful connection makes the graph richer, which makes the next match better, which produces more successful connections. The network gets smarter the more it is used.

## Three things you can do in Relay

### 1. Find the right peer

Describe what you need — a drug class, a condition, the kind of help you want — and Relay routes you to eligible, opted-in specialists who fit on prescribing history, expertise, region, and proven peer outcomes. You see clear reasons for every match ("prescribes the same therapies you do," "relevant publication history," "highly rated by peers on this topic"), pick one, and connect only after both sides agree.

### 2. See who practices like you

Relay groups physicians by their real prescribing and drug history, so you can see the peers who practice the way you actually practice — not just those who share your job title. It also gives you a private, honest view of how your prescribing mix compares with a similar peer group, with no judgment and no quality scoring.

### 3. Understand and discuss medicine changes (Ledger / Updates)

When a drug you prescribe changes — a reformulation, a swapped component, a new excipient — Relay shows you **exactly what changed**, before and after, in plain language. Then it connects you with specialists who also prescribe that drug so you can ask the question that actually matters: **"How do we incorporate this change into our workflow?"** You send a governed message, the specialist responds, and you make the decision with real peer input instead of guesswork.

## How the intelligence works

Relay's matching runs on data, and its intelligence is graph plus machine learning that is deterministic and reproducible:

- **Prescribing-domain clustering** groups doctors by their drug and prescribing vectors, so peers are matched on how they actually practice.
- **Expertise-graph matching** traverses the network with evidence-weighted scoring, applying hard eligibility rules (verification, consent, availability) *before* ranking anyone.
- **Trust learning** updates the graph from each consented, useful connection, so recommendations improve over time.

Generative AI (Gemini) sits on top as an **explanation layer only** — it turns already-approved facts into clear, readable summaries. It never decides who is eligible, ranks peers, or invents information, and every AI surface has a deterministic fallback, so Relay works even with no network connection.

## Where doctor data is stored

Relay stores a doctor's **professional** information only — identity, specialty, expertise, prescribing history, region, affiliations, availability, help preferences, and successful-connection outcomes. It never stores patient names, records, diagnoses, or any patient-level data.

- **In this prototype**, all physician data is deterministic **synthetic** data. It lives in memory, is served only through Relay's purpose-aware data broker, is never persisted, and never leaves the machine. The demo runs fully offline.
- **In production**, doctor data lives in two stores behind the same governance layer: a **document database** (MongoDB) for profiles, consent, provenance, requests, responses, policy, and audit records; and a **graph database** (Neo4j) for the Network Graph itself, because matching constantly follows relationships from a doctor to their expertise, evidence, availability, and prior successful connections.

Every read and write passes through the data broker and a deterministic policy engine. Consent is purpose-specific, provenance is attached to every field, every decision is recorded in an append-only audit trail, and no patient-level data is ever stored.

## Run the prototype

Use Node 20 or newer:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Use `npm run check` to run TypeScript validation, product-logic tests, and the production build.

The primary demo paths are `/mirror`, `/connect`, `/ledger`, and `/audit`. The persona switcher in the floating header switches between synthetic physician profiles.

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
  network-graph/             expertise + trust graph matching and learning loop
  peer-clustering/           prescribing-domain clustering and peer suggestions
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
  demo-seed/                 deterministic synthetic demo fixtures
config/
  policies/                  fictional versioned policy configuration
  taxonomy/                  governed Doctor Connect taxonomy
  explanation-templates/     offline deterministic copy templates
tests/
  contract/                  shared interface and boundary tests
  integration/               cross-module server tests
  e2e/                       critical user and demo paths
  fixtures/                  test-only immutable fixtures
scripts/                     repeatable developer, seed, and demo commands
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
