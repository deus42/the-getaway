---
status: MVP
type: index
---

# MVP Index

The canonical Level 0 specification is the set of current-design documents linked below. Historic progress, tests, code, screenshots, and Linear tickets are evidence or implementation records; they do not override this specification.

## Product contract

- [[Game Design]] — concise source-of-truth hub
- [[10 MVP Spine]] — product pillars and complete player loop
- [[11 Level 0 Vertical Slice Contract]] — Level 0 mission contract
- [[12 Game Design Decision Register]] — approved, removed, postponed, and superseded decisions
- [[13 Level 0 Content and State Matrix]] — beats, facts, checks, outcomes, pacing, and acceptance
- [[14 Specification Review Queue]] — unresolved decisions, provisional baselines, and ticket acceptance gates

## System specifications

- [[20 Setting & Worldbuilding]]
- [[30 Art Direction (MVP)]]
- [[35 Narrative Alignment]]
- [[40 George (AI Companion)]]
- [[41 Movement, Interaction & Observation]]
- [[42 Surveillance, Security & Civilian Behavior]]
- [[43 Health, Failure & Recovery]]
- [[44 Safehouse, Save & Retry]]
- [[45 HUD & Information Architecture]]
- [[46 Facts, Dossier, Minimap & Terminals]]
- [[47 Social Feed]]
- [[48 Actors & Portraits]]
- [[49 Audio]]
- [[50 Combat]]
- [[60 Paranoia]]
- [[70 Stealth]]
- [[80 Day-Night Cycle]]
- [[90 Dialogue]]
- [[91 Quests & Objectives]]
- [[92 Character & Progression]]
- [[93 Inventory (MVP)]]

Every canonical system specification uses this exact section contract:

1. Player fantasy and purpose.
2. Player-visible verbs.
3. Starting state and prerequisites.
4. Complete happy-path behavior.
5. State model and transitions.
6. Rules and tuning values.
7. Inputs from other systems.
8. Effects on other systems.
9. UI, world, audio, and George feedback.
10. Failure, recovery, and retry behavior.
11. Content-authoring requirements.
12. Edge cases and prohibited shortcuts.
13. Removed behavior.
14. Post-MVP extensions.
15. Human-play acceptance examples.
16. Owning Linear ticket.

Unresolved values use stable `OPEN-*` IDs from [[14 Specification Review Queue]]. They block acceptance of the affected surface, not all work on the ticket. A recorded recommended baseline may be implemented only as an explicit reversible provisional trial under `GDR-GOV-007`; it is never silently promoted to `Approved`.

## Delivery and evidence

- [[15 Linear Implementation Program]] — canonical self-contained copy source for GET-201 through GET-210
- [[95 MVP Readiness Checklist]] — current acceptance gate, not a design source
- [[03 Lore/Plot Bible]] — campaign premise, factions, characters, tone, and continuity
- [[04 Engineering/Architecture]] — implementation ownership and data flow
- [[04 Engineering/Roadmap]] — current delivery order and gates only
- `progress/GET-139.md` — directives, recovery evidence, implementation evidence, and open risks

## Precedence

1. Direct current requester decision.
2. [[12 Game Design Decision Register]] for status, rationale, and supersession.
3. Current canonical product, lore, and system specifications above.
4. Linear ticket for delivery ownership and the embedded implementation contract.
5. [[04 Engineering/Architecture]] for implementation ownership and data flow.
6. Progress records, tests, code, screenshots, and historical artifacts as evidence.

Normative sections 1–12 and 15–16 of each system specification contain current Approved rules. Required section 13 (`Removed behavior`) and section 14 (`Post-MVP extensions`) are explicitly non-current summaries; the Decision Register and clearly historical records retain the full rejected, postponed, and superseded detail. No behavior becomes current merely because code or a completed ticket still exists.
