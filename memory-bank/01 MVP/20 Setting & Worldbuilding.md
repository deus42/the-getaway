---
status: MVP
type: setting
canonical: true
---

# Setting & Worldbuilding

## 1. Player fantasy and purpose

The player is an American expatriate whose ordinary life in Tokyo becomes impossible after Hidzu correlates their identity with evidence connected to a missing father and Operation Cold Iron. The city should feel functional, attractive, inhabited, and quietly coercive—not ruined, lawless, supernatural, or designed as a combat arena.

The fantasy depends on a double reading. A public kiosk is useful transit infrastructure and an identity checkpoint. A clean logistics annex distributes goods and can quietly remove medicine from people whom the system no longer recognizes. A camera is not an enemy turret; it is part of a civic promise that has become a custody mechanism. The player learns to read this institutional second meaning without being told that every citizen, screen, or device is secretly hostile.

## 2. Player-visible verbs

Move through public and service space; observe institutional behavior; read public screens and signs; talk to contacts; use one-function terminals; hide; blend; inspect evidence; ask George about verified context; leave before identity control closes around them.

These verbs express one grounded relationship with the setting: the protagonist is allowed to be present until Hidzu's systems correlate enough evidence to make them removable. The player is not conquering territory. They are managing visibility, credibility, knowledge, obligation, and time inside somebody else's rules.

## 3. Starting state and prerequisites

- Year: 2036.
- Place: an outdoor Tokyo district controlled through Hidzu identity, surveillance, mobility, and logistics systems.
- Political background: Harrow and ESD control the United States and prepare Operation Cold Iron.
- Personal background: the protagonist is an expatriate with a father missing since the Battle of Miami.
- Current exposure: Hidzu has flagged the protagonist after an unresolved evidence event tracked by `OPEN-NAR-002`.
- The exact district identity, protagonist chronology, and local cast biographies remain in [[14 Specification Review Queue]].

## 4. Complete happy-path behavior

The opening communicates corporate order before threat: reliable transit language, public safety messaging, identity checkpoints, service routines, and curated civic sentiment. Lira's mission reveals who falls outside that order. Naila exposes the network's technical shape. Brant exposes its behavioral routines. The cache manifest then connects Hidzu's infrastructure to Eisenclave, ESD, and Cold Iron. The player leaves with passage toward Miami and a clearer understanding of the system pursuing them.

For example, the dusk route can pass an ordinary delivery queue whose markings, announcement, and verifier behavior all appear reasonable. Brant's fact explains how a legitimate courier acts there. Later, the cache's seizure language reveals that the same compliance grammar denied medicine to an undocumented clinic. If the manifest is recognized, identical logistics language links Hidzu hardware to Cold Iron. The setting therefore advances through repeated concrete institutions, not detached lore exposition.

## 5. State model and transitions

The district has three authored public states:

- `Dusk civic operation` — active delivery/service behavior and ordinary public presence.
- `Blue-hour transition` — visible reduction in public activity and escalating curfew messaging.
- `Curfew control` — service alleys, identity scrutiny, sparse civilians, and stronger verifier presence.

These are scheduled presentation/content states, not procedural world simulation. They follow [[80 Day-Night Cycle]] and never create supernatural events.

| Institution | Public promise | Actual Level 0 power | Player-facing evidence |
|---|---|---|---|
| Hidzu identity system | Continuity, safety, efficient access | Correlates people across transit, surveillance, and logistics | Verification frames, credential expiry, public notices, protagonist flagging |
| Hidzu surveillance network | Faster response and safer streets | Stores concern, last-known position, and identity confirmation | Cameras, network states, verifier drone, security behavior |
| Hidzu logistics compliance | Reliable distribution | Seizes goods from invalid identities and routes supplier hardware | Medkit hold, cache locker, shipping manifest |
| Eisenclave/ESD | American security operations | Integrates Hidzu capability for Cold Iron | Optional manifest and future-facing dossier consequence |
| Underground contacts | Mutual aid and practical survival | Supply facts, passage, and human alternatives | Lira, Naila, Brant, clinic need, outbound route |

## 6. Rules and tuning values

- Hidzu is the upstream international provider of identity, surveillance-AI, and logistics capability.
- Eisenclave integrates and operates related systems for ESD in the United States.
- Harrow/ESD do not physically occupy Tokyo in Level 0.
- Takahiro Kobayashi appears through Hidzu's public image; exact title and Cold Iron knowledge are `OPEN-NAR-003`.
- Tokyo-to-Miami passage is a covert multi-leg route, never an unexplained direct commute.
- Technology has a visible owner, location, range, input, and consequence.

## 7. Inputs from other systems

World clock and schedules; layout zones; surveillance state; discovered facts; dialogue outcomes; social-feed content; art/lighting states; audio announcements; localization.

The setting chapter does not own those state machines, but it constrains their fiction. A schedule change must look like a civic/operational change rather than a game-mode swap. A terminal must have a plausible public function and owner. A fact must be something the protagonist could learn from the named source. A localization choice must preserve Japanese diegetic context while giving English/Ukrainian players equivalent meaning.

## 8. Effects on other systems

Setting defines faction language, device ownership, public behavior, contact knowledge, objective wording, propaganda, visual motifs, audio cues, evidence interpretation, and the future Miami handoff.

It also limits solution design. Hidzu infrastructure may correlate identity and dispatch verification, but it cannot act like magic omniscience. Civilians may follow public routines or become blending contexts, but they are not generic cover tokens. The optional manifest may reveal an international supply chain, but it cannot erase the immediate medkit obligation or turn Level 0 into an American battlefield.

## 9. UI, world, audio, and George feedback

- UI uses Hidzu naming consistently and distinguishes fact from inference.
- World art shows checkpoints, cameras, terminals, laptops, public screens, service access, queues, identity scanning, and civic messaging without clutter.
- Audio uses restrained public announcements, device confirmation, drone hum, city ambience, and curfew transition.
- George explains only what the protagonist knows about these systems.

## 10. Failure, recovery, and retry behavior

Worldbuilding never introduces an untelegraphed fail state. Capture, deadline, Health, and Paranoia failures use the authored systems. Retry restores known facts and preparation exactly as of departure; it does not randomize schedules or public behavior.

Failure fiction remains proportional to implemented scope. Capture may end in administrative custody only after `OPEN-NAR-012` is resolved or used as an explicit provisional line; the game does not depict an unimplemented prison sequence. Midnight failure explains the lost credential/route only through the accepted or explicitly provisional `OPEN-NAR-007` fiction. A Retry is the same authored city and schedule, allowing the player to learn rather than hope for a different simulation roll.

## 11. Content-authoring requirements

- Name and culturally review the district.
- Define Lira, Naila, Brant, Takahiro, and the medkit beneficiaries.
- Author distinct Hidzu, Eisenclave, and ESD terminology.
- Define the flagging evidence, manifest contents, midnight deadline fiction, and multi-leg passage.
- Author Japanese diegetic language separately from English/Ukrainian localization.
- Cite [[03 Lore/Plot Bible]] and stable decision IDs.

Every environmental text or public message needs speaker/owner, intended audience, public purpose, subtext, current schedule state, localization treatment, and whether it is fact, propaganda, instruction, or atmosphere. World art and audio may imply institutional function, but required mission knowledge must also exist as explicit readable content.

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

Tokyo may later gain additional districts, interiors, and consequences, but Level 0 does not promise a full Tokyo campaign. Post-MVP additions must preserve the distinction between Hidzu as upstream international infrastructure and Eisenclave/ESD as American integration/operation rather than collapsing them into one generic enemy faction.

## 15. Human-play acceptance examples

- A first-time player can state who controls Tokyo, why the protagonist is exposed, what Lira needs, and why Miami matters within three minutes.
- Hidzu and ESD read as connected but distinct institutions.
- Dusk and curfew change public behavior without implying two unrelated maps.
- No player describes the setting as fantasy, supernatural, generic wasteland, or cyber-commando fiction.
- A player can point to one useful Hidzu service, one coercive use of the same infrastructure, and one human consequence without consulting the Bible.
- Recognizing the manifest changes what the player understands about Cold Iron while leaving Lira's local humanitarian objective emotionally primary.

## 16. Owning Linear ticket

`T1` (`GET-201`) owns canonical lore alignment; `T3` (`GET-203`) owns the district contract; `T5` (`GET-205`) owns Hidzu environmental identity; `T10` (`GET-210`) owns authored Level 0 setting delivery.
