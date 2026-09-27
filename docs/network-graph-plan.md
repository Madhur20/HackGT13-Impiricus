# Relay Network Graph: Product and Engineering Plan

## 1. Product purpose

The Network Graph is the learning substrate under Doctor Connect matching. Instead of storing physicians as a flat directory, Relay models them as a graph of expertise and validated peer help, so an isolated physician can be routed to the right peer for a specific problem.

The product thesis:

> Physicians at large academic hospitals inherit an informal expertise network from their institution. Community, rural, and independent physicians often do not. Relay uses Impiricus's reach to create that network for them.

For an isolated physician the problem is usually not "I need medical information." It is "I need the right doctor to talk to, and I don't know who that is." The Network Graph answers two questions:

- **Who knows what?** (the Expertise Graph)
- **Who has successfully helped whom?** (the Trust Graph)

This is a routing engine, not a social network. There are no feeds, followers, posts, or public audiences. A physician describes a need, Relay finds the right peer, and both sides opt in before any connection.

## 2. Relationship to Doctor Connect and corrected claims

The Network Graph is not a separate product. It is the matching engine that Doctor Connect uses to find peers, plus a feedback loop that improves matching over time. It reuses the shared consent, policy, provenance, explanation, and audit foundation. It does not introduce a second consent model or bypass any Doctor Connect rule.

The essay this plan is based on describes an ambitious system. The following are constrained for the hackathon build so they stay consistent with accepted Relay decisions:

| Essay framing | Relay build |
|---|---|
| Free-text "I need a cardiologist familiar with amyloidosis" with LLM intent extraction | Structured, categorical need selection in the hackathon. Any future Gemini intent extraction needs a deterministic categorical fallback and cannot decide eligibility or ranking. |
| Matching is "graph traversal + semantic matching" | Deterministic funnel: hard filters precede ranking; expertise evidence and validated trust drive the score. Semantic/LLM assistance is explanation-only with a fallback. |
| "Best peer match" as an automated final decision | Relay returns a transparent, ranked shortlist with reasons. The requesting physician chooses; contact still requires mutual consent. |
| Publications and signals establish expertise | They are evidence with a derived strength. NPI is identity, not credentialing. Prescribing volume never stands in for expertise. |
| "The graph learns" | It learns only from post-connection structured feedback with internal IDs, topics, and outcomes. It stores no patient data and no off-platform content. |

## 3. The two graphs

### 3.1 Expertise Graph — "who knows what"

Physicians are connected to expertise **tags** by `EXPERTISE_IN` edges. Tags are typed: `specialty`, `condition`, `drug_class`, `topic`, `skill`, `affiliation`. A cardiologist is not just "Cardiology"; they may connect to `Cardiac amyloidosis`, `HFpEF`, `PYP imaging`, `SGLT2 inhibitors`, and an institutional `affiliation` tag.

Each expertise edge carries **evidence sources** and a derived **strength** in `[0, 1]`:

- Sources: `SELF_DECLARED`, `SPECIALTY`, `PUBLICATION`, `IMPIRICUS_SIGNAL`, `SYNTHETIC`.
- Strength combines evidence so multiple independent sources raise confidence, capped at 1. A single self-declared tag is weaker than a self-declared tag corroborated by publication history and a permitted Impiricus signal.

This lets matching narrow "300 cardiologists" to "the physicians with real amyloidosis evidence" before ranking.

### 3.2 Trust Graph — "who has successfully helped whom"

A `SUCCESSFUL_PEER_CONNECTION` edge points from the requesting physician to the expert who helped, scoped to a topic tag. It is created or reinforced **only** from post-connection feedback. It stores:

- `interactions`: total feedback events on that (requester, expert, topic) edge.
- `successfulConnections`: interactions the requester marked useful (`yes` or `somewhat`).
- `usefulnessScore`: running average usefulness in `[0, 1]`.
- `lastConnectedAt`: timestamp.

Trust for an expert on a topic aggregates the incoming edges to that expert. It is strong when many different physicians found the expert useful on that topic — a much stronger signal than a self-declared interest.

Trust edges never contain patient data, message content, or off-platform conversation detail. Only internal IDs, a topic tag, counts, a usefulness average, and a timestamp.

## 4. Data sources

The graph combines several sources rather than requiring one perfect database:

- **Public professional data**: NPPES for identity, specialty, location; potentially CMS public provider data for affiliations and practice groups.
- **Research data**: PubMed / OpenAlex for publications and research topics as expertise evidence.
- **Physician self-declared expertise**: on joining, "What are three things another physician could comfortably ask you about?" and "How are you willing to help?" (async questions, short calls, referral guidance). This provides explicit consent plus better tags.
- **Permitted Impiricus signals**: specialty, practice type, clinical interests, engagement preferences, availability, communication preference — used only with appropriate consent.

No patient-level data is used or needed.

## 5. Learning loop (the flywheel)

The initial graph is public data + self-declared expertise + permitted Impiricus signals. After real connections it also includes peer validation and successful-connection edges.

```text
better graph -> better matches -> more useful connections -> more feedback -> better graph
```

Each completed, consented connection asks two structured questions:

- Was this useful? `yes | somewhat | no`
- What is the outcome? `resolved | referral_needed | need_another_expert`

That feedback updates the Trust Graph deterministically (see `recordConnectionOutcome`), so subsequent matches for the same topic improve.

## 6. Matching funnel and scoring

Matching preserves Doctor Connect's rule that **hard filters precede ranking**. The funnel, which is also the demo visualization:

```text
specialty pool
  -> required-expertise match above an evidence floor
  -> peer-support opt-in and requested help mode
  -> verified + active matching consent + availability (policy engine)
  -> rank by expertise and trust
  -> strongest matches  (or an honest no-match)
```

Ranking score (weights are configuration assumptions, not settled science):

```text
score =
    0.50 expertise evidence for the requested tags
  + 0.30 validated trust on the requested topic
  + 0.10 specialty fit
  + 0.10 availability fit
```

- Expertise score rewards covering more of the requested tags with stronger evidence.
- Trust score is `usefulnessAverage * saturation`, where saturation grows with the number of successful connections and caps at 1, so one lucky interaction cannot dominate.
- If nobody clears the expertise evidence floor and eligibility, Relay returns an honest "no strong match" state instead of weakening the filters.

Explanations expose at most three reasons and only fields that contributed, for example: "Relevant cardiac amyloidosis publication history", "Strong prior peer outcomes (5 helpful connections)", "Verified Cardiology", "Available for peer support".

## 7. Data model

```ts
type ExpertiseSource = "SELF_DECLARED" | "SPECIALTY" | "PUBLICATION" | "IMPIRICUS_SIGNAL" | "SYNTHETIC";

type ExpertiseTag = {
  id: string;
  label: string;
  kind: "specialty" | "condition" | "drug_class" | "topic" | "skill" | "affiliation";
};

type ExpertiseEdge = {
  hcpId: string;
  tagId: string;
  sources: ExpertiseSource[];
  strength?: number; // derived from sources when omitted
};

type HelpMode = "async_question" | "short_call" | "referral_guidance";

type PeerHelpProfile = {
  hcpId: string;
  offeredTagIds: string[];
  helpModes: HelpMode[];
  peerSupportOptIn: boolean;
};

type TrustEdge = {
  fromHcpId: string;
  toHcpId: string;
  tagId: string;
  interactions: number;
  successfulConnections: number;
  usefulnessScore: number; // 0-1 running average
  lastConnectedAt: string;
};

type ConnectionOutcome = {
  useful: "yes" | "somewhat" | "no";
  resolution: "resolved" | "referral_needed" | "need_another_expert";
};

type PeerNeed = {
  specialty?: string;
  expertiseTagIds: string[];
  helpMode?: HelpMode;
};

type NetworkMatch = {
  profile: HcpProfile;
  score: number;
  expertiseScore: number;
  trustScore: number;
  trustConnections: number;
  matchedTags: { tagId: string; label: string }[];
  reasons: string[];
};

type MatchFunnelStep = { label: string; count: number };

type NetworkMatchResult = {
  need: PeerNeed;
  matches: NetworkMatch[];
  funnel: MatchFunnelStep[];
  noMatch: boolean;
};
```

Suggested collections: `expertise_tags`, `expertise_edges`, `peer_help_profiles`, `trust_edges`, `connection_feedback`. A graph database such as Neo4j is a natural production fit; the hackathon uses in-memory synthetic structures behind the data broker.

## 8. Safety, privacy, and invariants

- **Zero patient data.** The graph stores professional information only: identity, specialty, expertise tags, evidence, location, affiliations, availability, help preferences, successful-connection edges, and feedback outcomes. It never stores patient name, DOB, MRN, records, labs, notes, or patient-specific diagnosis.
- **Consent is purpose-specific.** Peer identity requires active `PEER_MATCHING` consent; contact requires mutual `PEER_CONTACT` consent re-checked at retrieval. Peer-support opt-in is separate again.
- **Hard filters precede ranking**, enforced server-side by the policy engine.
- **Evidence, not titles or volume.** Expertise strength and validated trust drive ranking. Prescribing volume never substitutes for expertise. NPI is identity, not credentialing; prototype credential status is synthetic.
- **AI boundary.** Structured categorical need selection in the hackathon. Any future Gemini intent extraction or reason phrasing is explanation-only, schema-validated, has a deterministic fallback, and cannot authorize access, decide eligibility, or choose the final peer.
- **Audit.** Every match query, feedback event, and trust update writes an append-only audit event with policy version. Feedback logs topic and outcome with internal IDs only.

## 9. API plan

```text
POST /api/network/need              // build/validate a structured PeerNeed
POST /api/network/matches           // run the funnel, return ranked matches + funnel
POST /api/network/connections/:id/feedback  // record outcome, update Trust Graph
GET  /api/network/graph/summary     // counts for the demo visualization (no PHI)
```

Matching and feedback reuse Doctor Connect's request/consent/contact endpoints for the actual connection and contact reveal.

## 10. Tests

- Expertise strength rises with corroborating sources and is capped at 1.
- The funnel filters in the correct order and never ranks an ineligible peer.
- A candidate below the expertise evidence floor is excluded; an honest no-match is returned rather than a weakened filter.
- Trust aggregation rewards many distinct successful requesters and saturates.
- `recordConnectionOutcome` creates an edge on first useful feedback, increments interactions and successful connections correctly, and updates the usefulness average.
- Learning changes ranking: after positive feedback for an expert on a topic, that expert ranks higher for the same need, deterministically.
- No match result or feedback record contains patient data.
- Revoked matching consent removes a peer from results immediately.

## 11. Hackathon demo

1. Start as Dr. Maya Singh, Family Medicine, independent practice, "Network access: low."
2. Select a need: Cardiology -> Cardiac amyloidosis -> diagnostic guidance.
3. Show the funnel narrowing (e.g., cardiologists -> with amyloidosis evidence -> opted in -> eligible/available -> strongest match).
4. Show the top match with transparent reasons and a "Request connection" action gated by mutual consent.
5. After the connection, answer "Was this useful? Yes" and visibly add a trust edge from Singh to the expert.
6. Re-run a similar need and show the expert now ranks higher — the audience sees the network learn. Reflect all of it in the shared audit timeline.

The demo runs offline on synthetic data with deterministic explanation fallbacks.

## 12. Production roadmap

1. Publication and affiliation ingestion (PubMed/OpenAlex, CMS) with provenance and review.
2. Credentialing integration and sanctions monitoring; NPI remains identity only.
3. Feedback abuse, gaming, and fairness controls so low-data or underserved physicians are not systematically excluded, and reciprocity or popularity cannot be farmed.
4. Governed intent extraction with privacy review before any free-text need input.
5. Graph database (e.g., Neo4j) and scalable traversal.
6. Human moderation, reporting, and safety-event routing for peer interactions.
7. Legal and privacy analysis of Impiricus's role in facilitated peer connections.
