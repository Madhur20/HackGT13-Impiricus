# Relay project context

The `org/` directory is the maintained context layer for contributors and AI tools. It condenses the detailed plans without replacing them.

## Reading map

| File | Purpose | Update when |
|---|---|---|
| `CONTEXT.md` | Durable application model: product, architecture, data, policy, safety, APIs, demo, and acceptance criteria | A durable product or system assumption changes |
| `DECISIONS.md` | Decision record and corrections to older pitch claims | A consequential choice is accepted, rejected, or reversed |
| `STATUS.md` | Current repository reality, active priorities, blockers, and iteration log | Material work changes the state of the project |
| `../AGENTS.md` | Mandatory read order and working rules for the whole repository | Contributor workflow or non-negotiable invariants change |

## Detailed sources

- `docs/relay-system-plan.md`: primary integrated plan and highest-authority project document.
- `docs/practice-mirror-plan.md`: detailed Practice Mirror behavior, cohort logic, language restrictions, and tests.
- `docs/doctor-connect-plan.md`: detailed taxonomy, matching, consent state machine, safety controls, and tests.
- `docs/ledger-plan.md`: reviewed medicine-change records, physician relevance, version comparison, specialist handoff, safety, and tests.
- `docs/relay-pitch.md` and `docs/relay-pitch.pptx`: older narrative and deck, now using the Relay name. They are useful for the origin and judging story, but later plans supersede several technical and safety claims.
- `docs/Claude interactions/`: excluded historical transcripts. They are not required reading and are not authoritative.

## Source hierarchy

Current user direction and accepted decisions come first. The integrated system plan comes next, followed by the relevant product plan. Pitch materials come last. When a consolidated `org/` statement conflicts with a detailed authoritative plan, fix `org/` and follow the plan until the inconsistency is resolved.

## Maintenance principle

Keep this directory small enough that a new contributor can read it before starting work. Durable context belongs in `CONTEXT.md`, choices and reversals belong in `DECISIONS.md`, and changing implementation facts belong in `STATUS.md`.
