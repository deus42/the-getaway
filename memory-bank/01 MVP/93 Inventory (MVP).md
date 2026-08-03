---
status: MVP
type: system-specification
tags: [inventory, mission-objects, disposition]
canonical: true
---

# Inventory Disposition

## 1. Player fantasy and purpose

Level 0 treats possessions as concrete mission state, not as a loot-management game. The protagonist recovers the medkits, can recognize evidence, and receives a transit credential; the interface communicates ownership and consequences without exposing a broad inventory system that has no meaningful decisions.

## 2. Player-visible verbs

The player can:

- explicitly recover the confiscated medkits;
- explicitly inspect the optional shipping manifest;
- receive and use the outbound transit credential;
- review mission-object status and evidence in the operation dossier;
- understand whether an object has been recovered, recognized, handed over, consumed by its purpose, or remains unavailable.

The player cannot equip, stack, split, drop, sell, craft, repair, modify, or sort Level 0 objects.

## 3. Starting state and prerequisites

- The protagonist starts with no player-managed item grid.
- The medkits exist as a unique mission object at the authored cache.
- The manifest exists as an optional evidence interaction near the cache.
- The transit credential does not exist until Lira receives the medkits.
- Object interactions depend on authoritative world placement, range, visibility, occlusion, mission state, and ownership.

## 4. Complete happy-path behavior

1. Lira’s briefing establishes that the medkits were confiscated and must be returned.
2. At the logistics site, the player explicitly interacts with the medkit cache.
3. Mission state records the medkits as recovered; the object changes world presentation and the dossier updates.
4. The player may inspect the manifest. Recognition follows the designated fact or deterministic Awareness check; the manifest is evidence, not a carry-weight item.
5. Returning to Lira explicitly transfers the medkits and records the handoff.
6. Lira provides an outbound transit credential.
7. The safehouse outbound terminal consumes or validates that credential for its one declared function.
8. Debrief reports the actual medkit, evidence, and transit outcomes.

## 5. State model and transitions

Mission objects use stable authored states rather than stack counts:

### Medkits

`AT_CACHE → RECOVERED → RETURNED_TO_LIRA`

### Manifest

`UNINSPECTED → INSPECTED_UNRECOGNIZED | RECOGNIZED`

### Transit credential

`NOT_ISSUED → ISSUED → VALIDATED`

Transitions are atomic, idempotent, and owned by explicit interaction or dialogue outcomes. The Fact Ledger and Level 0 outcome ledger record recognition and provenance separately from object state.

## 6. Rules and tuning values

- Medkits are one mission object even if fiction describes multiple medical units.
- There is no quantity, weight, slot, durability, condition, vendor value, or equipment state.
- Walking over an object never changes ownership.
- A world object’s visual disappearance or replacement cannot be the sole authority for mission state.
- The manifest recognition result cannot block medkit recovery or Level 0 completion.
- The transit credential has one purpose: outbound-transit validation.
- A terminal cannot manipulate an object it does not own or perform an unrelated function.
- Mission-object state persists in autosave and the operation-departure Retry snapshot only according to the snapshot’s timing.

## 7. Inputs from other systems

- [[41 Movement, Interaction & Observation]] validates explicit interaction.
- [[46 Facts, Dossier, Minimap & Terminals]] owns objective/fact/outcome updates.
- [[90 Dialogue]] owns medkit handoff and credential issuance through Lira.
- [[44 Safehouse, Save & Retry]] owns outbound validation and persistence.
- [[92 Character & Progression]] supplies the manifest Awareness check.
- [[46 Facts, Dossier, Minimap & Terminals]] defines the one-function terminal contract.

## 8. Effects on other systems

- Medkit recovery advances the mission to escape.
- Medkit return advances the mission to outbound validation and changes Lira’s dialogue.
- Manifest recognition adds the Hidzu–Harrow logistics fact, changes George’s interpretation, dossier evidence, debrief, and Miami-facing continuation state.
- Transit validation satisfies the final required operation condition.
- Object states contribute to mission failure explanations and Retry restoration.

## 9. UI, world, audio, and George feedback

- Mission objects must read as objects at gameplay scale and use forgiving interaction targets.
- Prompts distinguish usable, too far, blocked, unavailable, already recovered, and already resolved.
- The HUD reports the objective transition; the dossier stores durable mission-object and evidence status.
- There is no persistent inventory panel or equipment grid.
- Pickup, evidence recognition, handoff, credential issue, and validation use distinct restrained audio cues.
- George may confirm verified status or explain a blocked prerequisite, but cannot collect, transfer, recognize, or use an object for the player.

## 10. Failure, recovery, and retry behavior

- Interrupted or repeated interactions cannot duplicate recovery, handoff, evidence, credential, XP, or objective transitions.
- If the medkit interaction is blocked, the prompt states the precise interaction issue.
- If the player misses or fails to recognize the manifest, the mission continues and the dossier remains honest.
- Retry restores object and fact states exactly as of departure; normally this means medkits at cache, manifest uninspected, and transit credential not issued.
- New Game clears all object state.
- A corrupted or retired inventory save is rejected with the rest of the incompatible rewrite schema rather than partially translated.

## 11. Content-authoring requirements

- Author world art, interaction anchor, prompt copy, and resolved presentation for the medkit cache and manifest.
- Author Lira’s medkit handoff and transit-credential issue states.
- Author outbound-terminal copy for missing, issued, already validated, and deadline failure states.
- Author dossier entries and debrief variants for manifest recognized, inspected but unrecognized, and not inspected.
- Add validation for unique object keys, legal transitions, placement/interaction alignment, idempotency, and localization parity.

## 12. Edge cases and prohibited shortcuts

- No generic item pickup event may complete mission objects by proximity.
- No inventory UI may appear simply because legacy state or components exist.
- No medkit stack, carry capacity, inventory full state, loot table, crafting ingredient, economy value, or equipment benefit.
- No manifest-as-consumable or evidence-as-currency behavior.
- No credential may open the camera terminal, cache locker, or unrelated doors.
- No object may be placed where required building art permanently hides its interaction.

## 13. Removed behavior

Removed from Level 0: inventory grid, loadout, equipment slots, consumables, credits economy, encumbrance, durability, crafting, weapon mods, loot drops, medkit-as-healing-item, keycard collection chain, generic datapads/tokens, and inventory-derived character statistics.

## 14. Post-MVP extensions

A small player-managed inventory and consumables are Post-MVP research, not a committed system. Any future proposal must prove that item choice creates meaningful escape/dialogue tradeoffs without rebuilding loot, crafting, or equipment complexity by default.

## 15. Human-play acceptance examples

1. Walking over medkits does nothing; explicit interaction visibly records recovery once.
2. The medkits appear in the dossier as mission state without opening an inventory panel.
3. Inspecting the manifest with Naila’s fact recognizes it; a qualifying Awareness build can recognize it independently; failure does not block medkits.
4. Lira accepts the medkits only after recovery and issues the credential once.
5. The outbound terminal validates only the credential and cannot loop cameras or unlock the cache.
6. Retry restores the cache and credential to their departure states with no duplicate facts or rewards.

## 16. Owning Linear ticket

- Mission-object state: `T10` (`GET-210`) — Tokyo escape content, audio, onboarding, and end-to-end acceptance.
- Dossier/fact presentation: `T9` (`GET-209`) — Dialogue, George, facts, dossier, social feed, and four-lane HUD.
- Canonical decisions: `GDR-MIS-002`, `GDR-REM-007`, and `GDR-POST-001` in [[12 Game Design Decision Register]].
