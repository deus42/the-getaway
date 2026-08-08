---
status: MVP
type: hub
canonical: true
---

# The Getaway — Game Design Bible

This is the entry point to the canonical Game Design Bible. It explains what the game is, what the player experiences, how the systems reinforce one another, and where the exact implementation-ready rules live. A new designer or engineer should be able to begin here, follow the linked chapters, and understand the intended game without reading historical chats, code, tests, screenshots, or Linear. Players receive the same finalized game-design truth through a curated bilingual **Game Design Bible** inside the running game.

The canonical authoring Bible is a package rather than one enormous file. This hub owns the readable whole-game explanation. [[10 MVP Spine]] owns the concise product contract. [[11 Level 0 Vertical Slice Contract]] owns the chronological player journey. [[12 Game Design Decision Register]] owns the status and supersession of atomic decisions. The 21 system chapters own detailed behavior. [[14 Specification Review Queue]] owns every genuinely unresolved value. [[15 Linear Implementation Program]] mirrors the resulting implementation scope. The in-game Bible is a curated projection of finalized rules from this package; it never renders the raw Markdown or exposes governance, uncertainty, historical alternatives, repository paths, or delivery state.

## Game fantasy and identity

The Getaway is a grounded dystopian surveillance RPG about becoming legible to systems that were not looking for you until your choices gave them a reason. The protagonist is an American expatriate living under Hidzu Corporation's ordinary civic systems in Tokyo in 2036. At Level 0's start, Hidzu Corporation does not consider them a problem. They are not a cyberpunk commando, chosen hero, or blank tactical unit. They are a civilian-scale person with an uneven RPG build, a missing father connected to Operation Cold Iron, a small network of people who may help, a need to reach Miami and investigate, and a private AI companion named George.

The central fantasy is competence under observation. The player studies a city that appears orderly and useful, learns where its institutional systems are strong or fallible, chooses what risks to take, helps somebody who has been excluded by those systems, and leaves before the city converts concern into custody. Success comes from preparation, perception, social reading, operational security, composure, movement, hiding, blending, and knowing when to disengage.

The game is not a power fantasy disguised as stealth. Cameras cannot be destroyed by magic technology. Guards do not become combat targets. George does not solve the route. The minimap does not reveal the safest path. Every advantage is grounded in something the protagonist learned, noticed, practiced, or deliberately chose.

## Intended player experience

Level 0 should make the player feel five things in sequence:

1. **Personally motivated.** Cover-select gives ownership, then the safehouse opening establishes the father's Cold Iron trail and the need to secure passage toward Miami without pretending the network already considers the protagonist suspicious.
2. **Oriented, not lectured.** Lira, the city, George, and contextual onboarding explain the immediate problem through play. The player understands the human stakes before the wider conspiracy.
3. **Prepared through knowledge.** Naila and Brant can improve the player's understanding, but neither is mandatory. Facts clarify a route or open a specific gate path; they are not generic buffs.
4. **Watched but not pre-condemned.** Ordinary public camera visibility is harmless. Concern begins only when valid visibility is paired with an observed restricted-area breach, protected interaction, medkit removal, failed verification, or detected feed change. Cameras, security, civilians, and Needle communicate only what they can actually perceive.
5. **Changed by the escape.** Returning the medkits, validating passage, reviewing the factual debrief, and receiving a real progression event turn the prologue into the first persistent campaign chapter.

The tone is tense, intimate, contemporary, and humane. Hidzu Corporation control is frightening because it resembles credible public infrastructure: identity continuity, logistics compliance, transit validation, safety messaging, queues, cameras, and automated verification. Humor is dry survival behavior. Surrealism may exist as metaphor or social absurdity, never as supernatural truth.

## Design pillars

### Surveillance is the antagonist

Cameras, identity systems, human verification, Needle, checkpoints, public screens, and behavioral scrutiny form a connected but fallible network. The network can become concerned only after observed rule-breaking, record a last-known position, search, verify, and lose the protagonist. Returning to `Clear` removes recognition, so later ordinary public visibility is harmless again. Rendered coverage and actual detection share the same geometry; solid buildings create ordinary blind spots, and no special off-grid zone exists.

### Dialogue changes practical options

Conversations are RPG play. Lira establishes the bargain, Naila explains technical relationships, and Brant explains delivery behavior and social routine. Exact spoken choices, visible deterministic gates, facts, time, Paranoia, objectives, and later debrief consequences make dialogue operational. There is no generic trust, reputation, persuasion currency, or reward for exhausting exposition.

### Paranoia is consequential and honest

Paranoia is an internal 0–100 resource presented as the named tiers Calm, Uneasy, Shaken, and Breaking, caused by communicated rule-break-linked surveillance exposure, pursuit, authored physical consequences, dangerous escape, capture outcomes, and authored story shocks. Each newly crossed tier may lock only the fragile abilities named by authored ability data; hardened abilities remain available. Reaching 100 stages a contextual breakdown and surrender rather than a medical death. The player may spend ten world minutes for ten relief once at the Transit Road vending machine and once at the Market Ring/Outer Space shrine; the first qualifying difficult surveillance escape may remove five once. It never fabricates clues, changes objective truth, lies through the HUD, or creates hallucinated evidence.

### Escape matters more than combat

Movement, observation, timing, line-of-sight breaks, hiding, blending, camera looping, dialogue, composure, and evasion resolve danger. A final interception may present one short deterministic confrontation with visible requirements and costs. Level 0 never enters an AP, weapon, enemy-HP, takedown, or AutoBattle loop.

### George is operational but bounded

George is a private near-character AI presence, not an omniscient assistant. He summarizes verified state, explains blockers and why information is unavailable, compares known risks, distinguishes fact from inference, and offers authored contextual questions. Silence is never hidden information. He cannot move, interact, hack, choose, reveal unknown information, or mutate the world, and Level 0 gives him no deletion/freedom desire arc.

### RPG identity persists

The player chooses one of four authored covers of the same protagonist and plays with binary abilities — held or not, lit or locked by stress, with no number anywhere. Deterministic gates, explicit facts, safehouse research that trades world minutes for new abilities, Paranoia tiers, and long-term consequence summaries create a compact but real identity foundation. The resulting identity and build continue toward Miami.

### The city is continuous and human-scale

Level 0 is exactly four dense, continuous mission blocks carrying three functional identities and three interlocking traversal loops. It is neither the rejected sparse/fenced four-block compound nor the rejected oversized nine-block board. Streets, sidewalks, alleys, entrances, ordinary public activity, hiding/blending contexts, and surveillance relationships make it read as a lived-in Tokyo district before it reads as a level.

## Setting and campaign premise

In 2036, Hidzu Corporation presents itself as the infrastructure of safe, efficient civic life. It controls identity correlation, movement validation, surveillance, and logistics in the Level 0 district. Across the Pacific, Harrow and ESD prepare Operation Cold Iron. Eisenclave integrates Hidzu Corporation-supplied identity, surveillance-AI, and logistics capabilities into the American system.

The protagonist left Miami after the Battle and is now an American expatriate in Tokyo. Their father disappeared in connection with Cold Iron. The protagonist seeks passage back toward Miami to investigate, but Hidzu Corporation does not begin Level 0 with them flagged or recognized as a problem. Their broader chronology remains `OPEN-NAR-001`; that is a legitimate gap, not an invitation to invent biography.

Lira offers passage toward Miami in exchange for recovering medical supplies confiscated by Hidzu Corporation. The local mission is deliberately humane and complete in itself: help people denied access to medicine, survive the response, and honor the return. The optional shipping manifest connects that act to the larger Cold Iron supply chain. Miami is the future Level 1 handoff, not a placeholder scene loaded by this slice.

See [[20 Setting & Worldbuilding]], [[35 Narrative Alignment]], and [[03 Lore/Plot Bible]] for the full fiction contract and unresolved narrative boundaries.

## Level 0 promise

Level 0 is a 15–20 minute outdoor prologue. In one ordinary-control run it must prove:

- a customizable protagonist with four grounded appearances and a focused RPG build;
- a readable safehouse opening and contextual onboarding;
- Lira's medkit recovery mission and promised outbound passage;
- optional preparation through Naila and Brant, including a viable neither-contact route;
- a dusk/public approach and a curfew/service approach through the same four-block district;
- readable cameras, explicit interactions, discrete hiding, social blending, one patrol drone, and last-known-position pursuit;
- a meaningful optional Hidzu Corporation–Harrow shipping clue that never blocks the humanitarian objective;
- Paranoia consequences with explicit safehouse recovery;
- George in the HUD and as a private near-character AR presence;
- a factual operation dossier, knowledge-based minimap, deterministic debrief, and cause-specific failure reporting;
- one real progression event that carries into the future campaign;
- completion, all four run failures, and deterministic Restart Attempt through normal player controls.

The complete journey is:

`Create → Orient → Accept → Prepare → Depart → Observe → Infiltrate → Recover → Investigate → Escape → Return → Validate → Debrief → Progress → Continue Exploring | End Demo`

[[11 Level 0 Vertical Slice Contract]] explains this journey chronologically. [[13 Level 0 Content and State Matrix]] gives every stable mission state, fact, gate, failure, outcome, and acceptance case.

## The Game Design Bible inside the game

The fullest practical explanation of The Getaway is available from the start menu before a run, from the paused menu during a run, and directly with `F1` during eligible gameplay. This optional reference does not replace contextual onboarding: the world, Lira, George, HUD, dossier, and readable failures still teach immediate actions through play. The Bible exists so a player can understand the complete designed game—its fantasy, Level 0 journey, systems, cause-and-effect relationships, feedback, failure and recovery, content boundaries, and continuation—without leaving the running application.

The player-visible Bible contains sixteen chapters: product identity; setting and campaign; the complete Level 0 journey; character/covers/abilities/research; Paranoia/failure/recovery; movement/interaction/camera/observation; time/schedules/safehouse/save/Restart Attempt; surveillance/cameras/security/civilians/Needle; stealth/hiding/blending/interception/escape; narrative/dialogue/George/contacts; facts/dossier/objectives/minimap/terminals/social feed; HUD; world/district/routes/geometry; art/Blender/actors/portraits/lighting; audio/localization/accessibility/performance; and content boundaries/continuation.

English and Ukrainian use identical chapter and section identity, order, gameplay meaning, examples, state relationships, and approved numeric rules. Search covers localized titles, summaries, section headings, body text, and keywords. The reading surface uses a reference-manual layout: chapter rail, readable central article, and on-page outline on wide screens; a two-pane layout at medium widths; and a focus-contained chapter drawer plus single reading column at `840px` and below.

Opening the Bible from active play acquires its own pause owner. If the paused menu already owns pause, both owners coexist; closing the Bible releases only its own owner. Time, schedules, surveillance, Needle behavior, movement, world input, and deadlines cannot advance while the Bible is open. The surface never changes mission state, facts, outcomes, autosave, or `OperationAttemptBaseline`, and it remembers reading position only for the browser session.

The rendered copy describes only the finalized end-state design. It never displays `OPEN-*` or decision/ticket identifiers, tracker state, provisional or recommended language, rejected or superseded behavior, implementation ownership, repository paths, test/build/coverage/commit state, or raw wiki links. When a canonical behavior is approved but an exact constant is not, the in-game explanation states the approved behavior without inventing the unresolved number.

## How the systems work together

No major Level 0 system is an island. The following relationships are design contracts:

| Source system | Produces | Primary consumers | Player-visible result |
|---|---|---|---|
| Dialogue and physical discovery | Stable facts with provenance | Checks, George, objectives, dossier, minimap, debrief | Knowledge clarifies one specific action without becoming currency. |
| Time and schedules | Dusk/curfew context and deadline | Routes, civilians, security, lighting, audio, objectives | The same district supports two legible timings with different social/technical emphasis. |
| Movement and layout | Position, facing, line of sight, interaction eligibility | Surveillance, discovery, hiding/blending, objectives | The player physically earns safety and knowledge; the game does not route for them. |
| Surveillance network | Clear/Suspicious/Pursuit, source, last-known evidence | Paranoia, George, HUD, safehouse availability, outcome ledger | Escalation is attributable and recoverable rather than omniscient. |
| Paranoia tiers and abilities | Continuous read-only slider, named tier, and ability locks | Gates, safehouse, failure, dialogue, debrief | The player sees pressure accumulate continuously while named thresholds explain its consequences. |
| Safehouse and persistence | Wait, Rest, autosave, immutable `OperationAttemptBaseline` | Time, recovery, progression, mission continuation | Recovery costs time; Restart Attempt restores one honest departure boundary. |
| Facts and objectives | Knowledge precision and current required beat | HUD, terminals, dialogue, George, dossier, debrief | The player knows what to do without omniscient markers. |
| Outcome ledger | What actually happened | Lira return, debrief, Miami continuation | The game never credits, condemns, or describes an action the player did not take. |
| Art, actors, audio, localization, accessibility | Equivalent semantic presentation | Every system above | Geometry, state, warning, and meaning remain readable across viewports, languages, and sensory needs. |

Street tension follows one law (`GDR-PROD-005`): the city never treats mere presence as guilt — time, crowds, and procedures continue without the player, and once the player commits, the system remembers exactly what it observed. Tension is anticipation → commitment → persistence, staged across three street phases: before the breach (perishable crowds, changing schedules, Needle's patrol, clocks on walls), during the breach (committed procedures and resolution intervals the network can watch), and after the breach (active recognition, reactive advisories, and familiar streets that now mean something different). Each area carries at most two dominant pressure sources, relief has geography, and the target feeling is temporarily anonymous, never permanently secure.

The critical reconciliation seams are specified explicitly: facts → gates → George → objectives → dossier → debrief; surveillance rule breaks → concern → Paranoia → safehouse → Restart Attempt; time → schedules → routes → deadline; Blender geometry → collision → entrances → interaction/device anchors; and Paranoia tiers → ability locks → cause-specific failure → Restart Attempt.

## Failure, recovery, persistence, and continuation

Level 0 has three normal run failures:

- Paranoia reaches `100` and the protagonist breaks down, staging a surrender, freeze, or bolt;
- a final authored interception option fails and the protagonist is captured;
- midnight arrives before both medkit return and outbound transit validation are complete.

Failure names the exact cause. Capture alone shows a short Hidzu Corporation incident report and sparse evidence map built only from real sightings, detected feed tampering, Needle verification, and capture evidence; unseen movement remains disconnected. Deadline instead lists unfinished requirements, while breakdown remains a simple, factual, evidence-limited explanation. **Restart Attempt** restores the immutable `OperationAttemptBaseline` created after briefing and optional preparation, when the player explicitly leaves for the operation. Before confirmation, George reads the real departure time, consulted contacts, the Paranoia tier, held abilities, and what will be discarded. Restoration returns identity, abilities, research state, time, facts, known world state, objectives, Paranoia, and deterministic content versions exactly as captured and discards every post-departure movement, fact, device state, mission object, research, Paranoia event, clock advance, and outcome.

Safehouse Rest advances 30 world minutes and removes 40 Paranoia. Wait advances time in confirmed 30-minute steps. Exact action availability while observed, Suspicious, or in Pursuit remains `OPEN-SAFE-001`; crossing the boundary is never an undocumented reset.

After explicit medkit return and transit validation, the deadline can no longer fail the completed run. Debrief and progression occur while simulation is paused. `Continue Exploring` returns to the completed district state; `End Demo` closes the slice. Neither invents another Level 0 operation or loads an absent Miami scene.

## Visual and audio direction

The locked visual language is graphic surveillance noir: readable midtones, strong ink-like silhouettes, cold institutional materials, sodium practical light, restrained device-bound cyan, and crimson only for real restriction or danger. It is grounded and contemporary, not fantasy-Neo, broad-glow cyberpunk, or a dark tactical board.

The city uses the requester-owned Neo Tokyo 2 kit in one named-source Blender 5.0.1 master. The approved AI-assisted four-block concept is a composition, camera, and value north star only. Every production building retains named source provenance; project-authored gap fills are limited to streets, public realm, navigation, and gameplay readability. The accepted master owns detailed visible geometry after its Blender gate; collision, occlusion, entrances, and anchors must then agree with it before live acceptance.

Normal play is close and street-first, with the protagonist readable in the lower-center lead area. Manual overview shows the complete four-block mission space without expanding scope. Actors are separate runtime entities: four protagonist appearances, Lira, Naila, Brant, two security roles, and three civilian archetypes, all with grounded idle/move/interact presentation and matching portraits. People are never baked into city plates. Their foot anchors may sample authored amber/cyan light regions with subtle eased presentation-only tint; lighting never changes detection or movement.

Audio is mandatory semantic feedback. City ambience, footsteps, interactions, cameras, network transitions, Needle approach/verification, the 21:00/21:30/22:00/23:30 street changes, objectives, safehouse, failure, and completion have distinct authored cue families. A Transit Road restaurant, Market Ring workshop, and safehouse-side apartment provide three spatial threshold sound leaks. There is no Level 0 voice acting, and no critical meaning may be audio-only.

English and Ukrainian render one language-neutral semantic content graph: the same node, fact, gate, objective, outcome, and state transition must occur in both languages. Japanese diegetic signage and announcements remain part of Tokyo's fiction and receive contextual translation rather than being rewritten as Ukrainian in-world text. Exact content ownership remains `OPEN-LOC-001`, and the diegetic-language policy remains `OPEN-NAR-014` until accepted.

Accessibility is equivalent gameplay meaning, not an optional polish pass. The current provisional baseline covers scalable text, reduced motion and flash, volume controls, captions/subtitles, keyboard parity, and risk cues that do not depend on color or sound alone. `OPEN-ACC-001` keeps the exact shipping baseline visible until human review. Likewise, `OPEN-PERF-001` keeps target hardware, first-load time, texture/memory ceiling, and stable frame target unresolved; production records measurements and optimizes the accepted composition without quietly shrinking or degrading it to manufacture a pass.

See [[30 Art Direction (MVP)]], [[31 GET-204 Visual Rebuild Quality Contract]], [[48 Actors & Portraits]], and [[49 Audio]].

## Content boundaries

### Current Level 0 content

- one four-block outdoor Tokyo district;
- one Lira medkit operation;
- two optional preparation contacts;
- two primary timings through one continuous space;
- three one-function terminals, with the single connected camera group usable once per attempt;
- one optional manifest clue;
- exactly one named verifier drone, Needle;
- three player-facing route names: Transit Road, Market Ring, and Outer Space;
- two one-use grounding actions and three localized street-threshold ambience sources;
- a small authored civilian/security cast and schedule set;
- four protagonist appearances, twelve actor sets, matching portraits, and George AR art;
- English and Ukrainian semantic content;
- one factual debrief and one progression event.

### Explicit exclusions

Level 0 does not use a fixed Operative, mandatory Trace name, character backgrounds, Ghost/Wire/Force packages, A* movement, threat-aware route planning, tactical/AP combat, AutoBattle, combat cover, EMPs, magic hacking, noise-lure abilities, breaching packages, procedural dialogue, storylets, runtime LLM orchestration, witness gossip, reputation/trust/karma meters, deep inventory, equipment, economy, crafting, weapon modification, controllable vehicles, survival meters, or mandatory Naila/Brant errands.

There is no shallow F1 tutorial page that substitutes for onboarding. Cover-select, contextual prompts, dialogue, George, HUD, dossier, world feedback, and readable failure teach the immediate game. The full in-game Game Design Bible is a separate optional reference and is explicitly part of Level 0's player-facing information architecture.

### Post-MVP possibilities

Miami and the occupied-America campaign, additional districts and interiors, more authored relationships, broader security behavior, richer safehouses, and deeper confrontation may be considered later only where the Decision Register marks them Postponed or a new decision approves them. Removed systems do not quietly return as “future ideas.”

## Detailed chapter navigation

### Product, story, and journey

- [[10 MVP Spine]] — compact product contract, quality bar, loop, and permanent boundaries.
- [[11 Level 0 Vertical Slice Contract]] — complete chronological walkthrough.
- [[20 Setting & Worldbuilding]] — 2036, Tokyo, Hidzu Corporation, Cold Iron, and campaign relationship.
- [[35 Narrative Alignment]] — tone, character knowledge, authored consequence, and debrief truth.
- [[03 Lore/Plot Bible]] — wider campaign premise, factions, characters, and continuity.

### Character, condition, and persistence

- [[92 Character, Covers, Abilities & Research]] — covers, binary abilities, gates, and research.
- [[43 Failure, Surrender & Recovery]] — failure, surrender, and recovery.
- [[60 Paranoia]] — stress sources, thresholds, penalties, honesty, and recovery.
- [[44 Safehouse, Save & Restart Attempt]] — planning hub, Wait, Rest, autosave, `OperationAttemptBaseline`, and restoration.
- [[93 Inventory (MVP)]] — why mission objects are explicit state rather than managed inventory.

### World action and pressure

- [[41 Movement, Interaction & Observation]] — direct controls, collision, explicit actions, and full-pause inspection.
- [[70 Stealth]] — hiding, blending, line-of-sight breaks, and pursuit recovery.
- [[42 Surveillance, Security & Civilian Behavior]] — rule-break evidence, shared network, cameras, Needle, security, civilians, and interception.
- [[80 Day-Night Cycle]] — clock, curfew, schedules, safe waiting, and deadline.
- [[50 Combat]] — noncombat disposition and short authored confrontation boundary.

### Knowledge, narrative, and interface

- [[90 Dialogue]] — exact spoken choices and deterministic gates.
- [[40 George (AI Companion)]] — verified assistance and bounded prompts.
- [[46 Facts, Dossier, Minimap & Terminals]] — knowledge provenance and one-function devices.
- [[91 Quests & Objectives]] — mission state, current beat, outcome ledger, and completion.
- [[45 HUD & Information Architecture]] — four-lane world-first dock, paused overlays, and the in-game Game Design Bible.
- [[47 Social Feed]] — read-only Hidzu Corporation atmosphere.

### Production and equivalence

- [[30 Art Direction (MVP)]] — city, actors, lighting, Blender, source provenance, and viewport acceptance.
- [[48 Actors & Portraits]] — roster, identity continuity, animation, scale, and fallback rules.
- [[49 Audio]] — semantic cue inventory, priority, cleanup, and no-voice boundary.
- [[95 MVP Readiness Checklist]] — evidence state and remaining acceptance gates, not design authority.

## Decision and uncertainty governance

- [[12 Game Design Decision Register]] records every durable Approved, Removed, Postponed, and Superseded rule with provenance and ownership.
- [[14 Specification Review Queue]] is the only home for unresolved values and reversible provisional trials. A stable `OPEN-*` is not a documentation gap.
- Normative sections 1–12 and 15–16 of each system chapter describe current behavior. Section 13 is explicitly removed behavior; section 14 is explicitly Post-MVP.
- Runtime code, tests, screenshots, progress notes, and Linear are evidence. They never become design authority merely because they exist or pass.
- If implementation exposes an unowned behavior, the review queue is updated before the behavior is encoded or accepted.
- [[15 Linear Implementation Program]] is the canonical copy source for the ten self-contained implementation tickets.

## Bible acceptance standard

This Bible is complete enough for implementation when a new engineer can trace every Level 0 transition to one state owner, triggering player action, prerequisites, abilities/facts/costed gate paths, world/HUD/dialogue/audio/George feedback, persistence/Restart Attempt behavior, failure/recovery outcome, outcome-ledger write, system chapter, and Linear owner. A missing exact value is acceptable only when it has a stable `OPEN-*`, an explicit affected gate, and no silently promoted implementation constant.

The in-game projection is complete enough for players when every current Approved player-facing decision and required topic maps to a rendered section or to an explicit non-player-facing governance classification; all sixteen English and Ukrainian chapters have equivalent structure and meaning; every source/decision reference resolves in non-rendered metadata; forbidden uncertainty, history, tracker, and implementation language is absent; search and navigation reach every section; and start-menu, paused-menu, `F1`, responsive, focus, pause, Restart Attempt, and no-state-mutation behavior pass live human-control acceptance.
