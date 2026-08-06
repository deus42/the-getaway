---
status: MVP
type: system-specification
tags: [social-feed, atmosphere, propaganda]
canonical: true
---

# Social Feed

## 1. Player fantasy and purpose

The social feed lets the player see how Hidzu Corporation-curated public reality surrounds the operation: safety propaganda, civic notices, managed sentiment, suppression, and transit information coexist with what the protagonist actually experiences. For Level 0 it is a small read-only atmosphere and context surface, not a social-media game or a source of procedural truth. This implements `GDR-SOC-001` and preserves the honesty constraints of `GDR-PAR-003` and `GDR-FACT-001`.

## 2. Player-visible verbs

- Open the social-feed overlay.
- Read authored Hidzu Corporation propaganda, notices, curated sentiment, suppression examples, and transit information.
- Compare public messaging with already-known mission and world context.
- Close the overlay and return to the prior world or overlay state.

The player cannot post, reply, message, follow, search, like, share, manipulate sentiment, or enter free text in Level 0.

## 3. Starting state and prerequisites

- The social feed is a read-only authored overlay within the Level 0 information architecture.
- Opening it pauses time and autonomous simulation under the shared overlay contract.
- Feed content may use only authored public information and verified canonical world/mission state. It cannot expose unknown surveillance, hidden objectives, private facts, or manifest significance.
- Exact entry inventory, sequencing, and availability are authored under T10; no unrecorded gameplay effect may be inferred from feed copy.
- English/Ukrainian semantic ownership remains an acceptance decision under `OPEN-LOC-001`, and the treatment of in-fiction Japanese text remains an acceptance decision under `OPEN-NAR-014`; their recorded recommendations may be implemented provisionally in replaceable localized content.

## 4. Complete happy-path behavior

1. The player opens the feed from its authored information surface; the world and autonomous simulation pause.
2. The feed displays a bounded authored set of public posts/notices appropriate to the current approved content state.
3. Each entry communicates atmosphere or public context without pretending to be neutral evidence or changing a hidden social score.
4. Transit and civic information may clarify already-authored public context, but cannot replace Lira, Naila, Brant, the dossier, a deterministic check, or explicit terminal use.
5. The player closes the feed and returns to the prior focus state without time advancement, world input leakage, or mission mutation.

## 5. State model and transitions

- The feed is closed during normal world control and open as an owning paused overlay when selected.
- Entries are authored content records, not simulated users or agents. Any entry variation must be tied to an explicit approved mission/world prerequisite and remain semantically deterministic.
- Reading an entry does not acquire a fact, complete an objective, change trust/reputation, advance time, or alter surveillance unless a future approved decision explicitly defines that single effect.
- Closing the feed releases only its own focus/pause ownership and restores the prior running or otherwise-paused state.
- New Game and Restart Attempt restore the authored feed availability appropriate to their canonical state; presentation-owned read state cannot leak mission knowledge.

## 6. Rules and tuning values

- Level 0 social media is read-only atmosphere and public context.
- Required content families are Hidzu Corporation propaganda, civic or compliance notices, curated public sentiment, visible suppression, and transit information.
- The feed is authored and deterministic. It contains no procedural posts, runtime LLM output, storylets, or emergent social graph.
- The feed has no generic sentiment, trust, reputation, karma, follower, reach, or engagement value.
- The overlay pauses time and autonomous simulation while open.
- Paranoia cannot change feed truth, fabricate posts, hide real objectives, or create false public information.
- Exact content, localization, audio priority, and accessibility treatment must follow `OPEN-NAR-014`, `OPEN-LOC-001`, `OPEN-AUD-001`, and `OPEN-ACC-001`; no unresolved values are guessed here.

## 7. Inputs from other systems

- [[20 Setting & Worldbuilding]] supplies Hidzu Corporation's public safety/efficiency identity and institutional control of identity, mobility, surveillance, and logistics.
- [[35 Narrative Alignment]] supplies grounded tone and the rule that social absurdity or juxtaposition is never supernatural.
- [[91 Quests & Objectives]] and [[80 Day-Night Cycle]] may supply explicit approved content prerequisites such as mission phase, curfew, or transit state.
- [[46 Facts, Dossier, Minimap & Terminals]] supplies the boundary between public atmosphere and acquired private/operational facts.
- [[45 HUD & Information Architecture]] supplies overlay focus, pause ownership, target-viewport layout, and localization infrastructure.
- [[49 Audio]] supplies semantic feed/UI cue events; provisional cleared/original placeholders may implement them before the production source and mix are accepted.

## 8. Effects on other systems

- The Level 0 feed deepens setting and may communicate authored public context, but it has no implicit mission, fact, surveillance, check, relationship, progression, or inventory effect.
- Opening it pauses world time, movement, patrols, cameras, drone behavior, and deadline progression through shared pause ownership.
- Closing it restores focus without issuing movement or consuming an input.
- Feed content may be referenced factually in debrief or dialogue only if that relationship is explicitly authored in the canonical content state; prose alone cannot create the relationship.

## 9. UI, world, audio, and George feedback

- The feed uses the same graphic surveillance-noir overlay language as dialogue, dossier, debrief, failure, and completion, without becoming another persistent HUD lane.
- Entries must distinguish institutional messaging, notices, curated sentiment, suppression, and transit information through authored semantic treatment; exact accessibility behavior may use only the recorded provisional `OPEN-ACC-001` baseline until accepted.
- Feed opening, navigation, and closing emit the UI audio family from [[49 Audio]] using approved or explicitly provisional cleared/original sources and priority data under `OPEN-AUD-001`.
- George may explain the difference between verified operational facts and authored public messaging when an approved prompt exists. He cannot infer suppressed truth, invent a post, or scrape unknown information.
- Critical mission state remains visible through its owning HUD/dossier/world surface and is never available only in the feed.

## 10. Failure, recovery, and Restart Attempt behavior

- The feed cannot directly fail the operation, trigger capture, change Health/Paranoia, or satisfy an objective.
- If no entry is available for a state, the surface communicates that bounded absence and leaves all game state unchanged; it does not generate filler.
- Closing the feed always restores the prior pause/focus state cleanly.
- Restart Attempt removes any post-departure presentation state and restores only the authored availability for the departure snapshot; it cannot preserve knowledge that the snapshot did not contain.
- An unavailable or malformed feed is a presentation/content acceptance failure, not permission to bypass a mission fact, terminal, or dialogue requirement.

## 11. Content-authoring requirements

- Author a bounded Level 0 set covering all five approved families: Hidzu Corporation propaganda, notices, curated sentiment, suppression, and transit information.
- Every entry needs a stable content ID, content family, explicit availability prerequisites if any, canonical semantic text, English/Ukrainian localization mapping, graphic treatment, and any approved relationship to mission/debrief state.
- Entries must remain credible public communications within Hidzu Corporation-controlled Tokyo and must not resolve the OPEN narrative facts about the protagonist, Lira, the manifest, Hidzu Corporation leadership, or the district by implication.
- Hidzu Corporation leadership copy and district identity remain acceptance decisions under `OPEN-NAR-003` and `OPEN-NAR-013`; entries may use only approved language or the explicitly recorded reversible recommendation.
- Resolve `OPEN-NAR-014` and `OPEN-LOC-001` before shipping bilingual/in-fiction language treatment.
- Keep feed content factual about its publisher's claim while making curation or suppression legible through authored context; do not use Paranoia or randomness to alter truth.

## 12. Edge cases and prohibited shortcuts

- No posting, replying, direct messaging, following, liking, sharing, searching, engagement loop, follower count, sentiment score, or social-risk simulation.
- No procedural entry generation, runtime LLM, storylet, generic user simulation, or imported live social data.
- No hidden fact, objective, surveillance device, route, check answer, manifest recognition, or transit validation revealed by merely opening or reading the feed.
- No relationship, karma, trust, reputation, XP, or generic intel effect from reading.
- No feed content changes caused by Paranoia hallucination or false UI.
- No critical state communicated only through color, sound, or feed copy; exact accessibility implementation remains gated by `OPEN-ACC-001`.

## 13. Removed behavior

- `GDR-REM-009`: procedural narrative, storylets, runtime LLM orchestration, and witness/gossip simulation.
- `GDR-REM-010`: generic karma, contact trust, and faction-reputation meters.
- Any Level 0 posting, messaging, follower, search-risk, engagement, or public-opinion management loop.
- Any use of the feed as a generic quest log, fact currency, unrestricted news scraper, or false-information effect of Paranoia.

## 14. Post-MVP extensions

- `GDR-POST-006` postpones meaningful posting, messaging, follower, search-risk, and broader social simulation until after the vertical slice.
- Postponement is not an active promise or a Level 0 schema dependency. Any future social system requires a new decision defining privacy, knowledge, consequence, localization, moderation, and persistence boundaries.

## 15. Human-play acceptance examples

- Open the feed during an active unpaused operation, read each available authored category, and close it; time, patrols, cameras, drone, movement, and mission state must not advance.
- Compare a Hidzu Corporation public claim with already-known dossier facts; confirm the feed adds atmosphere/context but no hidden fact or generic score.
- Trigger high Paranoia, reopen the feed, and confirm the content remains truthful and no fake entry or UI corruption appears.
- Restart Attempt after viewing post-departure feed content and confirm no mission knowledge leaks beyond the departure snapshot.
- `AC-L0-017` and `AC-L0-018`: verify equivalent English/Ukrainian state and readable overlay behavior at all target viewports after the OPEN language, UI, and accessibility decisions are accepted.

## 16. Owning Linear ticket

`T9` (`GET-209`) owns the read-only feed infrastructure, overlay, state boundary, and localization infrastructure. `T5` (`GET-205`) owns its graphic surveillance-noir treatment; `T10` (`GET-210`) owns authored entries, localization completion, audio, integration, and human acceptance.
