# Post-MVP: Procedural Storylets (Library of Plays)

Moved out of memory-bank/01 MVP/Game Design.md to keep the MVP doc focused.

Procedural Storylets (“Library of Plays”)

**Status:** ❌ DEFERRED FOR MVP - Storylets removed from MVP scope; revisit Post-MVP.

To keep emergent runs feeling authored, the campaign adopts a three-layer storylet framework inspired by Wildermyth’s “Library of Plays” approach:
	•	Villain Plot Spine: Each campaign arc defines explicit Act I / II / III beats (setup, escalation, finale). These beats act as the narrative spine that anchors randomization to a destination. The spine tracks active antagonist goals, required locations, and milestone quests that must land to keep the story coherent.
	•	Modular Event Plays: Storylets are self-contained vignettes written as tiny stage plays. Each play declares roles (e.g., `protagonist`, `foil`, `witness`), entry triggers (mission completion, exploration discovery, relationship threshold, ambush, downtime rest), and outcomes that update quests, reputation, injuries, or boons. Plays live in a shared library and can run in any eligible scene provided their inputs are satisfied.
	•	Embedded Variation: Character traits, injuries, factions, and relationship states swap specific lines, reactions, or follow-up branches inside each play. The same vignette reads differently when a bonded ally fills the `witness` role versus a rival, and mechanical consequences (temporary buffs, mood shifts, scars) reference those personal states.

Design requirements:
	•	Write storylets with explicit preconditions, cooldowns, and completion tags so they can’t repeat too frequently or clash with the campaign spine.
	•	Cast roles dynamically using an available cast list (player + key NPCs); fall back to archetype NPCs if mandatory roles are missing. (Post-MVP may add companions; MVP assumes solo.)
	•	Surface required traits/tags directly in content definitions (e.g., `needsTrait: ["stealth_specialist"]`) to keep authoring declarative and data-driven.
	•	Ensure outcomes cleanly route back into gameplay systems: redux reducers update quest state, relationship meters, or apply status effects; UI panels render the resulting comic/dialogue with placeholders swapped for the assigned characters.
	•	Allow designer-authored weighting so certain plays prefer early/late arc placement or specific zones, keeping tone aligned with the villain plot.

Testing expectations:
	•	Simulate multiple campaign states to confirm the engine casts roles without leaving gaps or repeating recently played vignettes.
	•	Verify localization stubs exist for every branch/variant line and that placeholders insert correct pronouns/names.
	•	Confirm mechanical consequences (injury flags, reputation shifts, temporary buffs) propagate to the corresponding systems and decay/resolve as scripted.
