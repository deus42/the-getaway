---
status: MVP
type: spine
---

# MVP Spine

<source_of_truth>
- This file is the single authoritative design for The Getaway.
- MVP = the playable vertical slice currently being built and playtested in code (Level 0).
- Anything marked ❌ DEFERRED is not required for MVP and must not block shipping.
- Chat/design alignment last synced: 2026-02-19.
</source_of_truth>

<mvp_slice_spine date="2026-02-19">
MVP Slice Spine (Day/Dialogue ↔ Night/Stealth, Paranoia as the core resource)

Core loop:
- DAY: simplified Disco-style dialogue + planning + low-risk errands. Primary goal is progress via quests and social navigation.
- NIGHT: Commandos-inspired stealth under curfew pressure. Primary goal is infiltration, retrieval, and escape.
- PARANOIA: the main pressure resource. It rises from surveillance/curfew exposure and falls via safety/daylight/rest.
- COMBAT: exists mainly as escalation/fail-state of detection (and as an option when the player chooses violence). AutoBattle keeps it low-friction.

Non-goals for MVP (explicitly Post-MVP / optional):
- Vehicles (combat + exploration)
- Survival micromanagement (hunger/thirst/fatigue)
- Deep inventory economy (ammo weight, contraband tiers, vendor simulation)
- Deep crafting / weapon mod meta
- Party companions (beyond George)
- Full witness/reputation gossip propagation (keep stubs/dev-only where needed)
</mvp_slice_spine>

<alignment_report date="2026-02-19">
Chat → Doc sync highlights (what changed in this document):
- Re-centered scope to a mini-RPG vertical slice.
- Clarified exploration as turn-based under the hood (not real-time free-roam).
- Normalized terminology to single protagonist (avoid “squad/party/crew” unless explicitly future scope).
- Marked Vehicles + Survival + Deep Inventory Economy + Crafting/Weapon-Mod depth as Post-MVP so they don’t leak into MVP requirements.
</alignment_report>

<document_map date="2026-02-19">
Document Map
- Vault home: [[00 Home]]
- MVP index: [[01 MVP/00 Index]]
- Deferred systems: [[02 Post-MVP/00 Index|Post-MVP Index]]
</document_map>

<game_overview>
Game Overview

The Getaway is a single-player tactical stealth RPG built as a mini-RPG vertical slice: DAY leans on simplified Disco-style dialogue/quests and planning, while NIGHT leans on Commandos-inspired stealth under curfew pressure. The game is turn-based under the hood (movement, actions, and combat), but presented to feel near-real-time in exploration. Paranoia is the primary pressure resource that ties systems together (stealth exposure, world pressure, recovery loops). Combat exists mainly as escalation/fail-state of detection (and as an option when the player chooses violence), with AutoBattle keeping resolution low-friction. This document captures the MVP slice first, and explicitly marks Post-MVP expansion systems as deferred.
</game_overview>
