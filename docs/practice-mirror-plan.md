# Practice Mirror: Product and Engineering Plan

## 1. Product purpose

Practice Mirror gives an HCP a private, descriptive comparison between their publicly reported Medicare Part D prescribing mix and a clearly defined peer cohort. It should prompt reflection and help the HCP identify topics worth investigating. It must not label a physician compliant, noncompliant, high quality, or low quality.

The narrow promise is:

> “See how your publicly reported prescribing mix compares with similar prescribers, understand the limits of the comparison, and save a topic for follow-up.”

This is safer and more credible than the current “guideline-adherence gap” language. CMS data contains fills and costs by prescriber and drug for Medicare Part D beneficiaries. It does not contain the diagnosis, indication, contraindications, clinical outcomes, or full practice denominator required to judge guideline adherence.

## 2. User and job

**Primary user:** an authenticated physician reviewing their own data.

**Job:** “Help me understand whether a visible pattern in my public prescribing data differs from a fair comparison group, without implying that the difference is automatically good or bad.”

**Secondary Impiricus value:** create a physician-initiated signal about topics where the physician may want approved medical information, an MSL discussion, or a peer consult. That downstream action must remain optional and visibly separate from the comparison.

## 3. Hackathon scope

### Build

- One HCP profile with 3–5 drug-class aggregates.
- One specialty-and-region cohort with at least 10 synthetic peers.
- One comparison screen with physician share, peer median, interquartile range, sample size, year, and coverage caveat.
- One detail drawer showing cohort definition, provenance, and excluded data.
- One action: “Explore this topic,” leading to Doctor Connect or an approved-resource placeholder.
- A separate opt-in screen for `SELF_INSIGHT`; this permission is distinct from whether the HCP contributes data to aggregate analytics or peer matching.

### Do not build

- Patient-level drill-down.
- Guideline recommendations or clinical treatment advice.
- A ranking or score of physician quality.
- Pharma-sponsored branded recommendations.
- Real-time CMS ingestion.
- A full cohort-builder interface.

## 4. User experience

Use the three-screen flow proposed in the transcript, with safer clinical framing:

1. **Opt-in and explanation:** what is compared, which public dataset is used, and what the comparison cannot establish.
2. **Dashboard:** neutral rows by drug class, with no red warning styling.
3. **Comparison detail:** distribution, cohort definition, provenance, limitations, and optional educational links.

### Screen 1: private mirror

Header:

- “Your Medicare Part D prescribing snapshot”
- Data year
- “Visible only to you”

Main visual:

- Drug class: SGLT2 inhibitors
- Your class share: 18%
- Peer median: 24%
- Peer middle 50%: 19%–29%
- Cohort: Endocrinology, Georgia, sufficient Part D activity, synthetic demo

Copy:

> “Your reported Part D prescribing mix contains a smaller share of this class than the median in the selected cohort. This comparison does not account for diagnosis, contraindications, insurance coverage, or patients outside Medicare Part D.”

Never display “below guideline,” “underprescribing,” or a red danger state. A neutral visual treatment prevents a descriptive difference from looking like a clinical error.

### Screen 2: why this comparison

Show:

- Cohort filters
- Cohort size
- Metric formula
- Coverage year
- Suppression rule
- Source labels
- Known limitations

An HCP may view their own supported data even if they do not permit identifiable discovery in Doctor Connect. Self-view, contribution to an aggregate, peer discovery, and contact exchange are separate permissions.

### Screen 3: optional next step

Actions:

- “Ask an opted-in peer”
- “View approved information”
- “Dismiss”

The first action pre-fills Doctor Connect with the drug class only. It must not generate a conclusion about why the pattern differs.

## 5. Data design

### Input record

```ts
type PrescribingClassStat = {
  hcpId: string;
  year: number;
  drugClassId: string;
  claimCount: number;
  standardizedFillCount?: number;
  totalClassClaims: number;
  classShare: number;
  source: "CMS_PART_D" | "SYNTHETIC";
  suppressed: boolean;
};
```

### Cohort definition

```ts
type CohortDefinition = {
  id: string;
  specialty: string;
  regionType: "state" | "national";
  regionValue: string;
  year: number;
  minimumClassClaims: number;
  minimumCohortSize: number;
  exclusions: string[];
};
```

### Computed comparison

```ts
type MirrorComparison = {
  metric: "class_share";
  subjectValue: number;
  cohortMedian: number;
  cohortQ1: number;
  cohortQ3: number;
  percentile?: number;
  cohortSize: number;
  deltaFromMedian: number;
  coverageWarning: string;
  provenance: DataField[];
};
```

## 6. Cohort logic

For the prototype:

1. Match the HCP’s normalized specialty.
2. Prefer the same state if the resulting cohort meets the minimum size.
3. Fall back to a national specialty cohort if it does not.
4. Require the same data year.
5. Exclude suppressed or incomplete synthetic records.
6. Require a minimum total class-eligible claim count.
7. Compute the median and quartiles. Avoid a simple mean because outliers can dominate claims data.

Use 11 HCPs as the minimum demo cohort unless Impiricus chooses a more conservative threshold. This is a Delta product rule, not “the CMS rule.” CMS suppresses low claim counts; that does not automatically establish that 11 physicians is a sufficient privacy or statistical threshold for every cohort product. In production, select the threshold through privacy and statistical review.

Do not use cosine similarity for this screen. A transparent cohort definition is easier to explain and defend.

Do not disguise a z-score as a specialization of cosine similarity. If the team wants a standardized distance, implement and name it separately. The recommended demo stays with a median and interquartile range because judges can interpret it immediately.

### Metric

```text
class share = claims in selected drug class / claims in configured comparison basket
```

The denominator must be named. “Share of all prescriptions” can be meaningless when unrelated therapies dominate the denominator. For the demo, define a narrow comparison basket and disclose it.

## 7. Explanation generation

Generate the factual payload first:

```json
{
  "drugClass": "SGLT2 inhibitors",
  "subjectShare": 0.18,
  "peerMedian": 0.24,
  "peerRange": [0.19, 0.29],
  "cohortSize": 14,
  "year": 2024,
  "limitations": [
    "Medicare Part D only",
    "No diagnosis or indication data",
    "Not a quality-of-care measure"
  ]
}
```

Gemini may rewrite this payload into concise prose. The UI should retain a deterministic template fallback. Reject output containing prohibited claims such as “should prescribe,” “adherent,” “appropriate,” or “indicated patients.”

### Optional guideline context

A small human-reviewed lookup may link the drug class to an authoritative guideline relevant to the HCP’s specialty. Keep it visually separate from the peer comparison:

> “Educational context: this class appears in the cited guideline. Delta has not determined whether the recommendation applies to your patients.”

The guideline lookup must never convert the claims comparison into an adherence flag. Cite an exact edition and review date rather than “current guideline.”

## 8. Consent and privacy behavior

- The HCP may view their own public record after identity/NPI matching.
- Public data still requires careful product use even when no HCP consent is legally required for access.
- Do not expose an identifiable peer’s prescribing pattern.
- Compute peer statistics only after the minimum cohort threshold is met.
- If interaction-derived data is added later, require an explicit `SELF_INSIGHT` purpose grant.
- Log that the comparison was generated, but do not send the insight to a pharma client.

## 9. API plan

```text
GET /api/mirror/summary?year=2024
  -> available classes, source coverage, cohort candidates

GET /api/mirror/comparisons/:drugClassId?cohortId=...
  -> comparison, cohort definition, provenance, limitations

POST /api/mirror/topics
  body: { drugClassId, action: "peer_consult" | "approved_resource" | "dismiss" }
```

## 10. Edge and failure states

- **No Part D record:** explain that no supported public comparison is available. Offer declared-profile setup instead.
- **Cohort too small:** broaden geography automatically and disclose the fallback.
- **Suppressed class:** do not infer zero usage.
- **Old data:** display the year prominently.
- **Specialty mismatch:** let the HCP report incorrect registry data, but do not silently edit the source record.
- **Extreme value:** show it without a clinical judgment and encourage review of coverage limitations.

## 11. Tests

### Unit tests

- Cohort fallback activates below the minimum size.
- Suppressed records never enter the distribution.
- Median and quartiles match fixture values.
- Class share uses the configured comparison basket.
- Prohibited clinical language fails output validation.

### Product tests

- A judge can identify the data year and cohort in under five seconds.
- A difference never appears as a red clinical alert.
- The coverage caveat remains visible without opening a tooltip.
- “Ask a peer” transfers only the drug-class context to Doctor Connect.

## 12. Success measures

Prototype:

- Time to understand the comparison.
- Percentage of testers who correctly describe it as descriptive rather than prescriptive.
- Successful provenance-drawer opens.

Production candidates:

- HCP repeat visits.
- Topic explorations initiated by the HCP.
- Requests for approved information or peer discussion.
- Dismissal rate and “not useful” feedback.

Do not optimize for moving physicians toward a particular drug or class.

## 13. Demo fixture

Use a fictional endocrinologist and 30–50 synthetic physician records distributed across several cohorts. Include one cohort below the minimum so the demo can show “not enough peer data” rather than forcing a result. If the UI says “CMS Part D,” label the values as a modeled demonstration based on the CMS schema unless the exact records were actually downloaded and transformed.

Demo sequence:

1. Open the SGLT2 class card.
2. Show 18% versus a 24% peer median.
3. Open “How this was calculated.”
4. Point to Medicare Part D coverage limits and cohort size.
5. Select “Ask an opted-in peer,” which opens a structured Doctor Connect question.

## 14. Post-hackathon roadmap

1. Validate the concept with Impiricus physicians.
2. Obtain data-governance approval for each source and purpose.
3. Develop specialty-specific comparison baskets with clinical and statistical reviewers.
4. Add cohort stability and uncertainty measures.
5. Add physician feedback on misleading comparisons.
6. Consider guideline links only when a human-reviewed evidence system and adequate clinical data support them.

## 15. Reference

CMS explains that its provider-and-drug dataset covers Medicare Part D prescriptions, does not represent a physician’s entire practice, and is not intended to establish quality of care: <https://data.cms.gov/tools/medicare-part-d-prescriber-look-up-tool>
