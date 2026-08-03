---
status: MVP
type: hub
---

# The Getaway — Game Design

## Game identity

The Getaway is a grounded dystopian surveillance RPG about escape, paranoia, dialogue, hiding, compromised technology, and the social cost of institutional observation.

The protagonist is not a cyberpunk commando. They are an exposed American expatriate with a personal history, a constrained RPG build, limited leverage, and a private AI companion. They must understand people, schedules, public behavior, and surveillance systems well enough to leave Hidzu-controlled Tokyo alive.

Level 0 is a 15–20 minute outdoor prologue. It begins with character creation and ends only after the protagonist returns Lira's medical supplies, validates outbound passage before midnight, and completes a factual safehouse debrief. Miami is the narrative handoff to a future Level 1, not a placeholder destination loaded by this slice.

## Core pillars

1. **Surveillance is the antagonist.** Cameras, identity systems, patrols, a verifier drone, checkpoints, public screens, and behavioral scrutiny create pressure without omniscience.
2. **Dialogue changes practical options.** Contacts provide facts, route understanding, deterministic checks, and consequences—not exposition currency or generic trust points.
3. **Paranoia is consequential and honest.** It records physiological and cognitive stress from visible causes. It never lies to the player or fabricates clues.
4. **Escape is more important than combat.** Hiding, blending, timing, observation, social reading, systems knowledge, and physical evasion are the verbs that resolve danger.
5. **George is operational but bounded.** He explains verified state and authored choices, never invents knowledge or performs the player's actions.
6. **RPG identity persists.** Callsign, appearance, attributes, skills, deterministic checks, facts, XP, levels, and long-term consequences survive beyond the prologue.
7. **The city is continuous and human-scale.** Streets, sidewalks, alleys, crossings, entrances, public activity, and surveillance form an inhabited district rather than a tactical board of isolated buildings.

## Level 0 promise

Level 0 must prove all of the following in one normal-control run:

- a customizable protagonist with four appearances and a focused build;
- Lira's medkit recovery mission and promised outbound passage;
- optional preparation through Naila and Brant;
- a public dusk approach and a curfew service approach;
- readable cameras, discrete hiding, social blending, one patrol drone, and last-known-position pursuit;
- a meaningful optional Hidzu–Harrow shipping clue;
- Health and Paranoia consequences with explicit recovery;
- George in the HUD and as a private near-character AR presence;
- a factual operation dossier, knowledge-based minimap, and deterministic debrief;
- one real progression event that carries into the future campaign;
- completion, failure, and Retry through ordinary player controls.

## Core loop

`Create → Understand → Prepare → Observe → Infiltrate → Recover → Escape → Return → Validate → Debrief → Progress`

The detailed beat, state, fact, check, and acceptance definitions live in [[11 Level 0 Vertical Slice Contract]] and [[13 Level 0 Content and State Matrix]].

## Current MVP systems

- [[20 Setting & Worldbuilding]]
- [[35 Narrative Alignment]]
- [[92 Character & Progression]]
- [[43 Health, Failure & Recovery]]
- [[60 Paranoia]]
- [[41 Movement, Interaction & Observation]]
- [[70 Stealth]]
- [[42 Surveillance, Security & Civilian Behavior]]
- [[80 Day-Night Cycle]]
- [[44 Safehouse, Save & Retry]]
- [[90 Dialogue]]
- [[40 George (AI Companion)]]
- [[46 Facts, Dossier, Minimap & Terminals]]
- [[91 Quests & Objectives]]
- [[45 HUD & Information Architecture]]
- [[47 Social Feed]]
- [[50 Combat]]
- [[93 Inventory (MVP)]]
- [[30 Art Direction (MVP)]]
- [[48 Actors & Portraits]]
- [[49 Audio]]

## Explicit MVP exclusions

Level 0 does not use a fixed Operative, mandatory Trace name, character backgrounds, Ghost/Wire/Force packages, A* player routing, threat-aware automatic route choice, tactical/AP combat, AutoBattle, combat cover, EMPs, magic-like hacking, noise-lure abilities, breaching packages, procedural dialogue, storylets, runtime LLM orchestration, reputation meters, deep inventory, crafting, weapon modifications, vehicles, survival meters, or mandatory Naila/Brant errands.

Level 0 contains no player-facing F1 help or codex. The opening, HUD, dialogue, George, dossier, world feedback, and contextual prompts teach the game.

## Governance

- [[12 Game Design Decision Register]] records the status and provenance of every durable decision.
- [[14 Specification Review Queue]] contains the remaining acceptance decisions and their reversible provisional baselines. They do not globally block runtime work after the separate documentation commit.
- Canonical documents contain only current rules. Rejected rules remain visible only as historical or superseded records.
- Linear tickets implement this specification and must remain self-contained; they cannot replace or contradict it.
- Implementation progress and test results never appear in this hub.
