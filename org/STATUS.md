# Relay project status

Last updated: 2026-09-26.

## Current state

- **Stage:** Team-ready repository scaffolding and implementation planning.
- **Repository contents:** Product/system plans, maintained context, contribution guidance, and module ownership scaffolding.
- **Application code:** Not present.
- **Tests:** Not present.
- **Demo readiness:** Not started.
- **Data:** No seed fixtures are present in the repository.
- **Deployment:** No application or infrastructure configuration is present.

Do not infer implementation from the detailed plans. They describe intended behavior.

## Active priority

Start the vertical skeleton defined in `docs/relay-system-plan.md`:

1. Choose the web, server, workspace, test, and validation tooling, then initialize it inside the existing boundaries.
2. Define the shared domain contracts and importable core interfaces.
3. Seed synthetic HCPs, contracts, policy rules, consent cases, and failure states.
4. Implement the purpose-aware data broker, deterministic policy service, provenance rendering, and audit writer.
5. Add persona switching and a shared shell.
6. Complete Doctor Connect end to end before expanding Mirror and Ledger.

## Required early fixtures

- 30–50 synthetic HCP profiles.
- Two synthetic client contracts.
- Versioned policy fixtures, including an undersized Mirror cohort, a revoked Connect candidate, an unverified candidate, and a blocked Ledger proposal.
- Offline deterministic explanation templates.

## Known blockers and external decisions

No code-level blocker is recorded yet. Production behavior remains blocked on Impiricus review of credentialing, pharmacovigilance, brands versus classes, paid participation, permitted interaction-derived features, real jurisdiction rules, and contract retention/export requirements. These questions do not block the synthetic hackathon prototype when it labels assumptions clearly.

## Definition of the next milestone

The vertical skeleton is complete when:

- a user can switch among seeded HCP and compliance personas;
- all three feature modules call the same authorization/data-broker path;
- at least one allow, deny, and review policy result is visible;
- provenance badges render from field metadata;
- each product can write an audit event using the same policy version;
- the demo runs from a clean local seed without external model access.

## Iteration log

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
