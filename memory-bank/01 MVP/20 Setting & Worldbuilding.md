---
status: MVP
type: setting
canonical: true
---

# Setting & Worldbuilding

## 1. Player fantasy and purpose

The player is an American expatriate whose ordinary life in Tokyo becomes impossible after Hidzu correlates their identity with evidence connected to a missing father and Operation Cold Iron. The city should feel functional, attractive, inhabited, and quietly coercive—not ruined, lawless, supernatural, or designed as a combat arena.

## 2. Player-visible verbs

Move through public and service space; observe institutional behavior; read public screens and signs; talk to contacts; use one-function terminals; hide; blend; inspect evidence; ask George about verified context; leave before identity control closes around them.

## 3. Starting state and prerequisites

- Year: 2036.
- Place: an outdoor Tokyo district controlled through Hidzu identity, surveillance, mobility, and logistics systems.
- Political background: Harrow and ESD control the United States and prepare Operation Cold Iron.
- Personal background: the protagonist is an expatriate with a father missing since the Battle of Miami.
- Current exposure: Hidzu has flagged the protagonist after an unresolved evidence event tracked by `OPEN-NAR-002`.
- The exact district identity, protagonist chronology, and local cast biographies remain in [[14 Specification Review Queue]].

## 4. Complete happy-path behavior

The opening communicates corporate order before threat: reliable transit language, public safety messaging, identity checkpoints, service routines, and curated civic sentiment. Lira's mission reveals who falls outside that order. Naila exposes the network's technical shape. Brant exposes its behavioral routines. The cache manifest then connects Hidzu's infrastructure to Eisenclave, ESD, and Cold Iron. The player leaves with passage toward Miami and a clearer understanding of the system pursuing them.

## 5. State model and transitions

The district has three authored public states:

- `Dusk civic operation` — active delivery/service behavior and ordinary public presence.
- `Blue-hour transition` — visible reduction in public activity and escalating curfew messaging.
- `Curfew control` — service alleys, identity scrutiny, sparse civilians, and stronger verifier presence.

These are scheduled presentation/content states, not procedural world simulation. They follow [[80 Day-Night Cycle]] and never create supernatural events.

## 6. Rules and tuning values

- Hidzu is the upstream international provider of identity, surveillance-AI, and logistics capability.
- Eisenclave integrates and operates related systems for ESD in the United States.
- Harrow/ESD do not physically occupy Tokyo in Level 0.
- Takahiro Kobayashi appears through Hidzu's public image; exact title and Cold Iron knowledge are `OPEN-NAR-003`.
- Tokyo-to-Miami passage is a covert multi-leg route, never an unexplained direct commute.
- Technology has a visible owner, location, range, input, and consequence.

## 7. Inputs from other systems

World clock and schedules; layout zones; surveillance state; discovered facts; dialogue outcomes; social-feed content; art/lighting states; audio announcements; localization.

## 8. Effects on other systems

Setting defines faction language, device ownership, public behavior, contact knowledge, objective wording, propaganda, visual motifs, audio cues, evidence interpretation, and the future Miami handoff.

## 9. UI, world, audio, and George feedback

- UI uses Hidzu naming consistently and distinguishes fact from inference.
- World art shows checkpoints, cameras, terminals, laptops, public screens, service access, queues, identity scanning, and civic messaging without clutter.
- Audio uses restrained public announcements, device confirmation, drone hum, city ambience, and curfew transition.
- George explains only what the protagonist knows about these systems.

## 10. Failure, recovery, and retry behavior

Worldbuilding never introduces an untelegraphed fail state. Capture, deadline, Health, and Paranoia failures use the authored systems. Retry restores known facts and preparation exactly as of departure; it does not randomize schedules or public behavior.

## 11. Content-authoring requirements

- Name and culturally review the district.
- Define Lira, Naila, Brant, Takahiro, and the medkit beneficiaries.
- Author distinct Hidzu, Eisenclave, and ESD terminology.
- Define the flagging evidence, manifest contents, midnight deadline fiction, and multi-leg passage.
- Author Japanese diegetic language separately from English/Ukrainian localization.
- Cite [[03 Lore/Plot Bible]] and stable decision IDs.

## 12. Edge cases and prohibited shortcuts

- Do not reskin American ESD forces as Tokyo security.
- Do not use generic cyberpunk slums, radiation, monsters, gangs, or wasteland hazards in Level 0.
- Do not imply supernatural truth.
- Do not make every screen or citizen a hostile surveillance device.
- Do not use vague “corporation bad” text where a concrete policy, identity rule, logistics fact, or human consequence can be shown.

## 13. Removed behavior

Generic biome city; lawless slums/wasteland opening; mandatory Trace/background lore; Miami-first prologue; supernatural night events; fantasy-Neo styling; generic reputation as world simulation.

## 14. Post-MVP extensions

Miami and the occupied-America campaign; NARC, Shelterline, ESD, Eisenclave, and later factions; more districts/interiors; broader reputation only after authored consequences prove the need.

## 15. Human-play acceptance examples

- A first-time player can state who controls Tokyo, why the protagonist is exposed, what Lira needs, and why Miami matters within three minutes.
- Hidzu and ESD read as connected but distinct institutions.
- Dusk and curfew change public behavior without implying two unrelated maps.
- No player describes the setting as fantasy, supernatural, generic wasteland, or cyber-commando fiction.

## 16. Owning Linear ticket

`T1` (`GET-201`) owns canonical lore alignment; `T3` (`GET-203`) owns the district contract; `T5` (`GET-205`) owns Hidzu environmental identity; `T10` (`GET-210`) owns authored Level 0 setting delivery.
