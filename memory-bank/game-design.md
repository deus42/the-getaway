The Getaway - Game Design Document

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
- MVP-first design (this file): `memory-bank/game-design.md`
- Deferred systems (Post-MVP folder index): `memory-bank/post-mvp/README.md`
</document_map>

<game_overview>
Game Overview

The Getaway is a single-player tactical stealth RPG built as a mini-RPG vertical slice: DAY leans on simplified Disco-style dialogue/quests and planning, while NIGHT leans on Commandos-inspired stealth under curfew pressure. The game is turn-based under the hood (movement, actions, and combat), but presented to feel near-real-time in exploration. Paranoia is the primary pressure resource that ties systems together (stealth exposure, world pressure, recovery loops). Combat exists mainly as escalation/fail-state of detection (and as an option when the player chooses violence), with AutoBattle keeping resolution low-friction. This document captures the MVP slice first, and explicitly marks Post-MVP expansion systems as deferred.
</game_overview>

<game_system id="setting_worldbuilding" status="partial">
Setting & Worldbuilding

<world_setting name="dystopian_city">
Dystopian City Setting

The game takes place in a sprawling dystopian metropolis in the near-future. The city is in decline, characterized by crumbling infrastructure and high-tech enclaves existing side by side. Society has fractured into rival factions controlling different districts, from lawless slums to fortified corporate zones. The atmosphere is gritty and oppressive, with neon-lit streets, polluted air, and constant tension in the environment.
</world_setting>

<world_structure name="zones_biomes">
Distinct Zones & Biomes

The city is divided into several zones, each acting as a distinct "biome" with its own environment, hazards, and gameplay impacts:
	•	Industrial Wasteland: Abandoned factories and toxic refineries dominate this area. Visibility is low due to smog, and lingering pollution can harm characters over time. Players might need gas masks or special gear to explore safely.
	•	Downtown Core: A corporate-controlled high-rise district filled with advanced technology and heavy security. Expect surveillance cameras, security drones, and automated turrets. Stealth or hacking skills are valuable here to bypass high-tech defenses.
	•	Slums and Undercity: Dense shantytowns and underground tunnels controlled by gangs. The cramped, maze-like environment provides plenty of cover for ambushes. Resources are scarce but scavenging can yield useful items. Danger is high, but so are opportunities for those who know the back alleys.
	•	Outskirts (Deadlands): The crumbling city edges that blend into a wasteland. Fewer people live here, but environmental dangers are greater (pockets of radiation, wild creatures, unstable ruins). The outskirts often serve as risky travel routes between city sectors and hide secret caches or wandering nomads.

Each zone offers unique resources, enemies, and quests. Transitioning between zones may require planning and equipment adjustments, reinforcing the feeling of entering a different world or biome within the city.
</world_structure>

<game_system id="art_direction" status="partial">
Painterly Noir Art Direction

The Getaway’s visual identity leans into a painterly noir aesthetic—thick atmospheric mood, imperfect brushwork, and deliberate grime that mirrors the city’s moral rot.

Color Language & Palette Guardrails
	•	Primary palette draws from desaturated crimsons, bruised umbers, muted teals, sodium ambers, and electric cyan accents reserved for interactables or faction tech.
	•	Value structure favors high-contrast silhouettes against hazy midtones; brightest highlights are scarce and purposeful (siren lights, HUD callouts, corporate signage).
	•	Weathering layers (soot streaks, rain wash, chipped enamel) should be hand-painted or overlaid with visible brush grain to avoid sterile gradients.

Material & Edge Treatment Rules
	•	Metals: cold base tones with warm edge catches; add micro-scratches and oil bloom to break up flat planes.
	•	Concrete & masonry: mottled texture passes with charcoal edging; drift grime vertically to imply runoff.
	•	Fabric & leather: softened edges, frayed seams, and occasional stitch highlights to keep silhouettes readable.
	•	Hard vs. soft edges: reserve razor-sharp cuts for weapons and corporate hardware; diffuse edges elsewhere to maintain painterly cohesion.

Signage, UI Diegesis & Lighting Motifs
	•	District signage should riff on period noir typography (condensed sans-serifs, deco ligatures) while integrating glitched neon or flicker passes for lived-in decay.
	•	Diegetic displays (billboards, kiosks, George’s overlays) glow with cool cyan/teal, contrasted by warmer street lighting to frame interactable spaces.
	•	Use motivated pools of light (overhead lamps, leaking neon, vehicle headlights) to sculpt scenes and reinforce cover silhouettes in gameplay spaces.

Reference Sheets & Production Workflow
	•	Produce a one-page style sheet per district outlining palette swatches, texture callouts, signage exemplars, and “do/don’t” mini-comparisons.
	•	Each sheet should cite relevant narrative beats from `memory-bank/plot.md` so faction tone and environmental storytelling stay aligned.
	•	Store sheets under `the-getaway/src/assets/style-guides/` (or equivalent) with versioned filenames (`districtName_style_v###.mdx/png`) and log updates in `memory-bank/progress.md` when districts evolve.
	•	All outsourced or generated art must reference the applicable sheet to ensure external collaborators hit the noir constraints without guesswork.
	•	Maintain a reusable SDXL prompt library in `/art/prompts/` (tiles, props, characters). Every brief must reiterate “painterly brush grain, clean albedo, no baked shadows” so runtime lights, not renders, supply depth.
	•	Export atlas-ready sprites at 2:1 ratios (64×32 base tiles, 128px hero props). Place diffuse PNGs in `public/atlases/` with matching JSON (`props.json`) and keep normal maps in `public/normals/` using the `_n` suffix (`lamp_slim_a` → `lamp_slim_a_n`).
	•	Verify normals in Level 0 by enabling the Game Menu lighting toggle (pipes into `visualSettings.lightsEnabled`) then stepping into Waterfront Commons: the indoor validation lamp + point light exposes inverted green channels immediately.
</game_system>

<narrative_alignment document="memory-bank/plot.md">
Narrative Alignment & Tone Reference

All quest text, dialogue, ambient barks, and narrative UI copy must align with the plot bible’s XML directives in `memory-bank/plot.md`.
	•	Consult `<tone_and_dialogue>` for faction voice, dialogue formatting, and the `<writing_guidelines>` list before drafting new lines or localizations.
	•	Use the narrative pillars and alternate outcomes described under `<narrative_structure>` to anchor quest stakes and branching logic.
	•	Document in change logs which plot bible sections guided the update (e.g., Guideline 4 for satire, Relationship web for character dynamics) so future passes can trace intent.
	•	When localizing, preserve surreal juxtapositions, dark humor, and moral nuance outlined in the plot bible; adjust idioms without losing the tone set by the English originals.

Designers should treat the plot bible as the authoritative “what” for story cadence, while this game design file captures the “how” those tonal requirements manifest in gameplay systems and quest structure.
</narrative_alignment>

<mechanic name="living_world_ai">
Living World Ai (Post-MVP)

<implementation_status>❌ DEFERRED FOR MVP - see memory-bank/post-mvp/world-simulation.md.</implementation_status>
</mechanic>

<mechanic name="trust_fear_ethics">
Trust Fear Ethics (Post-MVP)

<implementation_status>❌ DEFERRED FOR MVP - see memory-bank/post-mvp/reputation-systems.md.</implementation_status>
</mechanic>

<mechanic name="localized_reputation_network">
Localized Reputation Network (Post-MVP)

<implementation_status>❌ DEFERRED FOR MVP - see memory-bank/post-mvp/reputation-systems.md.</implementation_status>
</mechanic>

<mechanic name="witness_memory_heat">
Witness Memory Heat (Post-MVP)

<implementation_status>❌ DEFERRED FOR MVP - see memory-bank/post-mvp/reputation-systems.md.</implementation_status>
</mechanic>

<mechanic name="ai_assistant">
AI Assistant & Player Guidance

<character name="George">
AI Companion

An omnipresent AI assistant ("George") accompanies the player from the start. George exists as an overlay in the Level-0 Objectives area of the HUD and serves several key functions:
	•	**Mission Guidance & Tutorials:** George calls attention to the player’s current objectives, suggests next steps, and explains new mechanics when they first appear. It proactively surfaces optional side quests or dynamic events if they align with the player’s goals. Players can ask George “What should I do?” to receive contextual hints without spoiling surprises.
	•	**Personality & Humor:** George has a distinct personality that evolves to mirror the player’s choices. If the player often uses sarcastic dialogue options, George develops a dry wit; if the player is earnest and compassionate, George’s tone becomes encouraging. The assistant cracks jokes and makes sardonic observations about the dystopian world, adding levity to exploration.
	•	**Adaptive Relationship:** George comments on the player’s karma, faction alignment, and recent actions. Positive or negative karma shifts George’s respect level and the tenor of its banter. It may admonish ruthless play or cheer moral decisions. Faction reputations can affect George’s advice (e.g., warning when entering hostile territory).
	•	**Conversation Interface:** Players can initiate short conversations with George using dialogue options similar to NPC interactions (e.g., ask for a hint, vent frustration, or debate philosophy). While George cannot act physically in the world, its responses enrich narrative immersion.
	•	**Diegetic Implementation:** George is diegetic: an AI chip implanted in the protagonist’s device. This lets it integrate into the world’s tech-noir aesthetic while justifying its narrative commentary. Upgrades or bugs to George can form the basis of quests.

George’s dialogue adheres to the tonal guidelines in the plot bible: darkly funny, surreal, and morally nuanced. Designers should log references to relevant plot bible directives (e.g., Tone Guideline 4 for satire) when writing George’s lines to ensure consistency.
</character>
</mechanic>
</game_system>

<game_system id="combat_system" status="partial">
Turn-Based Combat System

<mechanic name="combat_overview">
Combat Overview (MVP-minimal)

<implementation_status>⚠️ MVP-minimal. Combat exists in MVP, but the design focus is stealth + quests; the full combat spec is in `memory-bank/post-mvp/combat-advanced.md`.</implementation_status>

MVP intent:
	•	Combat is turn-based on a grid and typically triggers as escalation from detection (or a scripted quest beat).
	•	Required: enter/exit combat, AP-driven turns, basic attack, basic damage/HP, and clear combat logging.
	•	Nice-to-have: AutoBattle as a convenience toggle (see full spec in the Post-MVP doc).
</mechanic>

<mechanic name="grid_movement">
Grid and Movement

Encounters are resolved on a grid map that corresponds to the environment (streets, building interiors, etc.), enabling spatial tactics:
	•	Characters can move a certain number of tiles per turn based on their movement allowance or Action Points (covered below).
	•	The grid can be hexagonal or square; this will be determined in development (hex grids allow movement in six directions, whereas square grids align with orthogonal map layouts).
	•	Terrain affects movement: moving through difficult terrain like rubble, shallow water, or climbing through a window costs more movement points/AP. Open ground is easy to traverse, while obstacles block movement completely.
	•	Movement is important not just for closing distance or escaping, but for tactical positioning (flanking enemies, reaching cover, etc.). Players will often need to balance using a turn to move versus using it to attack or use an ability.
	•	(Post-MVP) Vehicle-on-grid rules are deferred (see `memory-bank/post-mvp/vehicles.md`).
</mechanic>

<mechanic name="action_points">
<balance_values system="action_points">
Action Points & Turn Actions

Each character in combat has a pool of Action Points (AP) to spend on actions during their turn. This AP system is inspired by games like Fallout:
	•	Movement: Moving to an adjacent tile typically costs 1 AP (this might vary if using hexes or if the character has perks altering movement cost). Longer distances cost more AP, so a character can choose to use all AP to sprint far, or move a bit and save AP for other actions.
	•	Attacks: Every weapon or attack type has an AP cost. For example, firing a pistol might cost 2 AP, while a shotgun blast costs 3 AP, and swinging a machete costs 2 AP. Heavy or unwieldy weapons use more AP; a sniper rifle shot might cost 4 or more AP due to the time needed to aim.
	•	Reloading and Item Use: Reloading a weapon, switching weapons, or using an item (like a medkit or grenade) consumes AP. These costs introduce decisions—e.g., if you’re low on AP, do you fire one more shot or take cover and reload for the next turn?
	•	Special Abilities: Using a character’s special ability or a skill (for instance, a burst fire that hits multiple targets, or a hacking attempt on an enemy robot) will have an AP cost, often higher than a standard attack. Some powerful abilities might even end the turn immediately once used.
	•	Action Economy: If a character doesn't use all their AP in a turn, they may have options for those leftover points. In The Getaway, a character can go into an Overwatch mode or defensive stance with unused AP. Overwatch means any remaining AP will be used to take reaction shots during the enemy's turn if a target appears (see Cover & LoS below). Alternatively, we could allow a small carry-over of unused AP to the next turn (subject to a limit) to encourage strategic passing of actions.

The AP system means characters with higher agility or certain perks get more done each turn, allowing for build variety. Players must budget AP each turn, creating a constant tactical puzzle of movement versus attacking versus using abilities.
</balance_values>
</mechanic>

<mechanic name="stamina_system">
<balance_values system="stamina">
Pressure & Recovery (MVP)

<implementation_status>⚠️ PARTIAL - MVP uses Paranoia as the primary pressure resource; full stamina spec moved to memory-bank/post-mvp/stamina-system.md.</implementation_status>

Paranoia - Player Stress Resource (MVP - Step 24.6)
Paranoia replaces stamina on the HUD for MVP and tracks the player’s psychological load from corporate policing, surveillance, and night movement. The system is tiered (Calm → Uneasy → On Edge → Panicked → Breakdown) and feeds both stealth/detection pressure and (when combat happens) lightweight combat modifiers.
	•	Scale: 0–100 with tier thresholds at 25/50/75/90
	•	Tiers apply lightweight penalties: Uneasy (-5% ranged accuracy), On Edge (-10% accuracy, +10% enemy detection weight), Panicked (-15% accuracy, +20% detection, camera hacking disabled), Breakdown (-25% accuracy, +30% detection, periodic recovery stall)
	•	Stimuli (positive pressure): active camera proximity/cone exposure, guard line of sight or pursuit, regional heat multiplier (Step 19.6), curfew entry spike, nighttime drift, low health spike/sustain, hazard overlays (smog/blackout), exhaustion events, and future Street-Tension Director cues
	•	Cooling (negative pressure): safehouse volumes (instant drop + sustained decay), daylight when unobserved, George’s Reassure action, CalmTabs consumable, Nicotine packs (small relief + decay boost), and natural passive decay tuned at 0.18/s
	•	SPECIAL influence:
		•	Perception raises sensitivity (+2% gain per point)
		•	Endurance and Intelligence dampen gains (-3% per point) and accelerate passive decay (+2% per point)
		•	Charisma softens crowd-induced spikes (-2% gain baseline, -10% spike severity at 7+)
		•	Luck cushions spikes (reduces large hits by up to 50%)
	•	Respite window: external systems (Street-Tension Director, George, calm consumables) can cap gains for a short duration to give breathing room
	•	HUD: Paranoia bar replaces the stamina meter visually; stamina persists mechanically but is deprioritized until post-MVP. Fatigue status still surfaces when exhaustion triggers.
	•	Iconography: Tactical HUD overlays and the action log reuse the shared SVG set (`src/components/ui/icons`) so combat, loot, mission, and system events read consistently without emoji fallbacks.
	•	Interplay:
		•	Street-Tension Director (Step 19.7) reads normalized paranoia to bias crackdown/respite patterns
		•	George assistant is now the diegetic vent for fear management (Reassure button + ambient narration)
		•	Consumables diversify stress relief loops (CalmTabs, Nicotine packs) and hook into loot economies
		•	Safehouses provide tangible psychological relief in addition to logistical reset
	•	Debugging: dev inspectors expose current value, tier, stimuli breakdowns, and allow future balancing without guessing hidden math

</balance_values>
</mechanic>

<mechanic name="stealth_mode">
Stealth Mode (MVP Toggle)

Stealth is now a primary player-driven mode that complements Combat and Dialogue:
	•	Activation: Tap `X` outside of combat or conversations to enter stealth. The player automatically shifts into a silent movement profile; manual disengage is instant and carries no penalty.
	•	Lockouts: Combat or active dialogue immediately drop the player out of stealth. Being exposed or triggering an alarm forces a short 4.5s cooldown before stealth can be re-enabled.
	•	Visibility: Guard vision and camera cones shrink based on stealth skill, lighting, paranoia tier, and the active movement profile—sprinting multiplies detection gain while silent footwork cushions it. Hidden → Exposed → Compromised states surface through the dedicated HUD wafer.
	•	Noise Model: Movement emits radial noise (silent ≈ 0 gain, walk ≈ +4 progress within 4 tiles, sprint ≈ +8 within 6 tiles). Noise nudges nearby guards toward Investigating even without direct LoS, letting players feel the pressure of hurried movement.
	•	Cameras: Surveillance no longer consumes crouch flags; motion sensors ignore stealth walk but always trip on sprinting. Hacking dampens detection progress but does not restore crouch-era toggles.
	•	Payoffs & Fail States: Entering combat from stealth no longer grants an ambush bonus. Once compromised, stealth disables, logs the breach, and respects the cooldown/reset requirement before re-entry.
	•	HUD Feedback: A new Stealth indicator sits beside the camera wafer—Hidden (cool tone), Exposed (amber), Compromised (red), Standby (neutral). The badge reports detection %, cooldown status, or availability notes (combat/dialogue blockers).
	•	Controls & Persistence: Player data now stores `stealthModeEnabled`, `stealthCooldownExpiresAt`, and a `movementProfile` union (`silent | normal | sprint`) so saves and subsystems receive consistent engagement context.

<implementation_status>✅ IMPLEMENTED</implementation_status>
</mechanic>

<mechanic name="cover_line_of_sight">
Cover Line Of Sight (Post-MVP)

<implementation_status>❌ DEFERRED FOR MVP - see memory-bank/post-mvp/combat-advanced.md.</implementation_status>
</mechanic>

<mechanic name="special_abilities">
Special Abilities (Post-MVP)

<implementation_status>❌ DEFERRED FOR MVP - see memory-bank/post-mvp/combat-advanced.md.</implementation_status>
</mechanic>

<mechanic name="autobattle_mode">
AutoBattle (MVP optional)

<implementation_status>⚠️ MVP optional convenience. Full behaviour profiles + planner spec live in `memory-bank/post-mvp/combat-advanced.md`.</implementation_status>

MVP intent:
	•	Expose a simple toggle to let players auto-resolve easy fights.
	•	Never let automation burn story beats (pause on dialogue prompts / end-of-combat / etc.).
</mechanic>

<mechanic name="vehicles_in_combat">
Vehicles In Combat (Post-MVP)

<implementation_status>❌ DEFERRED FOR MVP - see memory-bank/post-mvp/vehicles.md.</implementation_status>
</mechanic>
</game_system>

<game_system id="exploration_open_world" status="partial">
Exploration & Open-World Elements

<mechanic name="persistent_world">
Persistent World (Post-MVP)

<implementation_status>❌ DEFERRED FOR MVP - see memory-bank/post-mvp/world-simulation.md.</implementation_status>
</mechanic>

<mechanic name="exploration_travel">
Exploration Travel (Post-MVP)

<implementation_status>❌ DEFERRED FOR MVP - see memory-bank/post-mvp/world-simulation.md.</implementation_status>
</mechanic>

<mechanic name="dynamic_npc_factions">
Dynamic Npc Factions (Post-MVP)

<implementation_status>❌ DEFERRED FOR MVP - see memory-bank/post-mvp/world-simulation.md.</implementation_status>
</mechanic>

<mechanic name="random_encounters">
Random Encounters (Post-MVP)

<implementation_status>❌ DEFERRED FOR MVP - see memory-bank/post-mvp/world-simulation.md.</implementation_status>
</mechanic>

<mechanic name="day_night_cycle">
Day-Night Cycle Effects

The 24-hour day-night cycle is not just cosmetic; it has significant gameplay implications:
	•	Lighting and Visibility: During the day, visibility is better for both the player and NPCs. At night, darkness can be an ally for stealth but a hazard for awareness. Players can use light sources (flashlights, headlights on vehicles, flares) to see, but these can give away their position. Conversely, darkness can allow a stealthy player to bypass enemies or perform silent takedowns more easily. We might implement a visibility meter that is affected by light level – in a pitch-black alley at midnight, enemies might not detect the player until they are very close (unless the enemy has night-vision gear).
	•	NPC Schedules & Availability: As mentioned, many NPC behaviors depend on time of day. Some quests explicitly require a certain time (e.g., “Meet the informant at 2 AM behind the bar” or “Patrol the perimeter at dawn”). If the player misses the time window, they may have to wait another day or find an alternate solution. Shops typically operate during daylight hours; at night you might have to rely on vending machines or black market dealers. Certain characters (like a vigilante who prowls at night, or a radio DJ who broadcasts only after midnight) are only accessible at specific times.
	•	Difficulty and Encounters: Generally, nights are more dangerous in the city’s rough areas. More predators and criminals come out after dark, and some supernatural or unusual events might only happen at night if the setting permits. However, night can also reduce the number of patrolling guards in heavily controlled areas (guards need sleep too), making infiltration easier. In contrast, daytime might be safer for travel in some places but could expose the player to snipers or long-range threats in open areas since visibility is high. The player should plan missions taking time into account – for example, maybe they want to attack a gang hideout at noon when many members are asleep after their night activities.
	•	Curfew and Law Enforcement: Some zones might have a curfew or martial law at night, especially if the story involves oppressive authorities. If caught out after curfew, the player could be confronted or attacked by security forces on sight, adding another layer of strategy (do you risk traveling through a curfew zone at night or camp until morning?).
	•	Rest and Recovery: Night is a logical time for the player to rest their character (recovering fatigue as per survival mechanics). If the player has a safe place to sleep, they might choose to spend the night there and venture out in daytime. However, there could be incentives to stay awake – certain missions or crimes are best done under cover of darkness.
	•	Atmosphere and Visuals: The city’s look and feel changes with time. At night, neon signs flicker to life, streets are quieter in some districts and louder in others (club districts, gang territories). During early morning, fog or smog might hang over lower areas, and you might see people commuting or cleaning up after the previous night’s chaos. These touches make the world more immersive.
	•	HUD Readout: The top-right wafer communicates only `DAY` or `NIGHT`, pairing the tag with a muted progress bar for the active half of the cycle. Curfew shifts the wafer accent toward deep crimson without introducing extra copy; travel advisories and hazard cues remain exclusive to George’s rolling feed and history log.

The day-night cycle encourages players to think about when they do things, not just how. It adds a rhythm to gameplay – perhaps a cycle of planning in safe areas by day and executing risky moves at night, or vice versa depending on the player's approach.
</mechanic>

<mechanic name="vehicles_exploration">
Vehicles Exploration (Post-MVP)

<implementation_status>❌ DEFERRED FOR MVP - see memory-bank/post-mvp/vehicles.md.</implementation_status>
</mechanic>
</game_system>

<game_system id="storytelling_dialogue" status="partial">
Storytelling & Dialogue

<narrative_structure>
Narrative Structure

The Getaway features an open-ended, branching narrative in which the player’s choices and allegiances drive the story. Rather than a single linear plot, the game narrative is built from intertwined faction storylines and the player’s personal journey:
	•	The central premise might revolve around surviving and ultimately escaping from the oppressive city (hence “The Getaway”). However, escaping is not the only possible outcome; the player could also choose to change the city’s fate or seize power within it. The story is about what the player decides to strive for in this dystopian environment.
	•	Several factions (each with their own goals and worldview) act as the primary drivers of the narrative. For example, there might be a rebel faction trying to overthrow the corporate-controlled government, a gang lord aiming to expand their criminal empire, and a secretive guild that promises the player a safe passage out of the city for a price. The player can engage with any of these groups, and their involvement (or lack thereof) will shape how the story unfolds.
	•	The narrative is non-linear and branching. A player could start working with one faction, then switch sides when they learn new information or if a better opportunity arises. They could betray allies, form uneasy truces between enemies, or refuse to pick sides at all. The game will adapt to these shifts by altering dialogues, available missions, and the overall balance of power in the city. There might be key decision points where the player’s actions irrevocably set a branch of the narrative (for example, choosing which faction leads an assault on the city’s power plant determines the storyline for that area).
	•	Key story “beats” or major events will occur as a result of player action or at certain global milestones. For instance, if the player has significantly weakened the reigning authorities, a city-wide uprising might be triggered as a narrative event. Alternatively, if the player has been playing factions against each other, a catastrophic gang war could break out. These events propel the overall storyline toward a conclusion but can happen at different times or in different ways depending on player choices.
	•	Player Agency: Importantly, the game does not force the player into being a traditional hero. You can shape your role – be the savior of the downtrodden, a mercenary just looking out for yourself, a power-hungry opportunist, or even try to remain an outsider who avoids big conflicts. The narrative supports multiple roles by providing choices that align with different motivations. For example, when given the chance to help a faction, you might do it out of altruism, personal gain, or coercion, and the narrative will reflect those reasons in how NPCs treat you.

Overall, the story structure is designed for branching and convergence: there are multiple branches (faction paths, moral choices) that can lead to a variety of mid-game scenarios and eventually converge into several distinct endgames. This structure offers replayability and a personalized story experience.
</narrative_structure>

<mechanic name="procedural_storylets">
Procedural Storylets (Post-MVP)

<implementation_status>❌ DEFERRED FOR MVP - see memory-bank/post-mvp/storylets.md.</implementation_status>
</mechanic>

<mechanic name="dialogue_system">
Dialogue System

Dialogue is a crucial tool for storytelling, delivered in a text-driven format reminiscent of classic RPGs:
	•	Interactive Conversations: When speaking to NPCs, the player is presented with dialogue options to choose from. These options can advance the conversation, allow asking questions, or make decisions that affect outcomes. The dialogue is typically presented with the NPC’s lines and a list of the player’s possible responses.
	•	Player Choice & Tone: Dialogue options often represent different approaches or tones. For example, you might see choices like “[Friendly] We mean no harm, we just want information,” “[Bribe] Slide some credits across the table How about you help me out?”, “[Threaten] Tell me what I need to know, or else.” The player can shape their character’s personality through these choices, whether they are diplomatic, aggressive, sarcastic, altruistic, etc.
	•	Skill and Stat Checks: Many dialogue choices are gated by the player’s skills, attributes, or prior actions. A high Charisma or a specific perk might unlock a unique persuasion option that lets you avoid a fight. A character with a strong technical background might get extra dialogue about technology or to solve a problem by hacking. If you’ve aligned with a faction, you might get a special option to leverage that (“Invoke your status as a friend of the Rebellion”). When a choice is locked due to insufficient skill, the game might show it greyed out (to indicate that such an approach was possible, adding replay curiosity). Passing or failing a dialogue skill check can significantly change the result of the conversation.
	•	Branching Outcomes: Conversations can have multiple outcomes and even end states. You could negotiate a peaceful solution to a conflict via dialogue (preventing a battle), or you might fail and anger the NPC, leading to combat. You might convince someone to give you a key piece of info, or if you skip the right dialogue options, you miss it and have to find another way. Dialogue can also determine alliances – say the wrong thing to a faction leader and they might turn you away or demand a favor to regain trust.
	•	Information Gathering: Dialogue is a primary way to gather intel about the world. NPCs will share lore, rumors, and hints. A player paying attention to dialogue might discover hidden side quests (“I hear noises from the old subway at night…”), learn passwords or codes, or glean background that helps solve puzzles. We encourage exploration through talking – not every answer is on the map, sometimes you have to chat with locals.
	•	Dialogue Interface & Logs: The dialogue interface will likely show the name or portrait of the character speaking and the text of their dialogue. The player’s selected response is usually shown as well. We will include a dialogue history log that players can scroll if they need to review what was said (useful for remembering clues or instructions given mid-conversation). Dialogue sequences can be exited or returned to if appropriate (some NPCs allow you to come back and ask more questions later). Important decisions in dialogue will usually prompt the player with a confirmation if they lead to a big irreversible change (“Are you sure you want to insult the warlord? This will make his faction hostile.”).

The dialogue system is essentially the narrative engine of the game, driving story progression, quest initiation/completion, and delivering the rich story we plan. It's designed to handle complex branching while giving the player clarity and meaningful choices.
</mechanic>

<mechanic name="tone_preserving_dialogue">
Tone Preserving Dialogue (Post-MVP)

<implementation_status>❌ DEFERRED FOR MVP - see memory-bank/post-mvp/narrative-advanced.md.</implementation_status>
</mechanic>

<mechanic name="role_based_dialogue_templates">
Role Based Dialogue Templates (Post-MVP)

<implementation_status>❌ DEFERRED FOR MVP - see memory-bank/post-mvp/narrative-advanced.md.</implementation_status>
</mechanic>

<mechanic name="choices_consequences">
Choices & Consequences (MVP-minimal)

<implementation_status>⚠️ MVP-minimal. Full branching/long-tail consequence framework lives in `memory-bank/post-mvp/narrative-advanced.md`.</implementation_status>

MVP policy:
	•	Consequences are primarily quest-state changes + immediate scene outcomes.
	•	Avoid global karma/reputation propagation for MVP (those systems are Post-MVP).
</mechanic>

<mechanic name="quest_drivers">
Quest Drivers (MVP-minimal)

<implementation_status>⚠️ MVP-minimal. Advanced/procedural quest-driving rules live in `memory-bank/post-mvp/narrative-advanced.md`.</implementation_status>

MVP intent:
	•	Hand-authored quests, triggered by simple conditions (dialogue choice, stepping on tile, pickup collected, flag set).
	•	Keep logic transparent and debuggable in the quest log / action log.
</mechanic>

<mechanic name="multiple_endings">
Multiple Endings (Post-MVP)

<implementation_status>❌ DEFERRED FOR MVP - see memory-bank/post-mvp/narrative-advanced.md.</implementation_status>
</mechanic>
</game_system>

<game_system id="quest_design" status="partial">
Quest Design

<mechanic name="quest_variety">
Quest Variety (Post-MVP)

<implementation_status>❌ DEFERRED FOR MVP - see memory-bank/post-mvp/narrative-advanced.md.</implementation_status>
</mechanic>

<mechanic name="faction_quests">
Faction Quests (Post-MVP)

<implementation_status>❌ DEFERRED FOR MVP - see memory-bank/post-mvp/narrative-advanced.md.</implementation_status>
</mechanic>

<mechanic name="level_objective_structure">
<rule type="structure">
Level Progression & Objective Hierarchy

- The campaign advances through discrete levels (Level 0: Slums, Level 1: Downtown, Level 2: Industrial Wasteland, and future tiers). Each level ships with a curated list of primary objectives that embody the main mission beats for that space.
- Every primary objective is composed of one or more quests. Quests define the atomic interactions (dialogue, combat encounters, searches) that flip the underlying state flags. Objectives are therefore collections that resolve to complete when all child quests reach a terminal state (complete or failed when permitted).
- Objectives include structured metadata: display label, summary copy, gating requirements, and an ordered quest ID list. This enables the HUD panel and quest log to render consistent sequencing and partial progress regardless of how the player reached the current level.
</rule>

<rule type="completion_feedback">
Objective Completion & Level Advancement

- The HUD Level & Objectives panel mirrors the quest log: active objectives render with an inline checkbox and will be crossed out visually once the associated quest set reports completion. Partial progress lines remain normal weight so players can scan outstanding tasks quickly.
- When all primary objectives for the current level are complete, the UI announces "Mission Accomplished" and hands control to the level advancement funnel. Progression offers a continue prompt, then loads post-mission dialogue, rewards, or the world transition for the next level. Side content remains available until the player confirms the transition.
- Objective state changes emit Redux events so auxiliary systems (assistant hints, minimap focus, George overlay) can react immediately without polling bespoke quest state.
- George assistant consumes the same selectors that drive the panel, promoting the top-priority active objective as its default guidance line and celebrating once the level transition modal confirms the mission wrap.
</rule>

<rule type="side_content">
Side Quests & Optional Tasks

- Side quests coexist alongside primary objectives but are tagged as optional. They inherit the same quest atom structure yet render in a dedicated subsection of the HUD panel so they never block level completion.
- Completing or abandoning side quests has no effect on the Mission Accomplished gate; however, they can grant bonuses, reputation shifts, or alternate dialogue in the next level's intro sequences to reward thorough players.
- Optional quest metadata includes recommended level and originating faction so the assistant and logbook can surface the most relevant detours without overwhelming the player during critical objectives.
</rule>

<implementation_status>⚠️ PARTIAL - HUD scaffold exists; objective gating and mission celebration flow targeted for Step 35.2.</implementation_status>
</mechanic>

<mechanic name="karma_system">
Karma System (Post-MVP)

<implementation_status>❌ DEFERRED FOR MVP - see memory-bank/post-mvp/progression-advanced.md.</implementation_status>
</mechanic>

<mechanic name="reputation_system">
Reputation System (Post-MVP)

<implementation_status>❌ DEFERRED FOR MVP - see memory-bank/post-mvp/progression-advanced.md.</implementation_status>
</mechanic>

<mechanic name="quest_structure">
Quest Structure & Journal

Managing the variety of quests requires clear structure and player tools to keep track of objectives and progression:
	•	Quest Journal: The game provides a journal (or Pip-Boy-like device, or smartphone in a cyberpunk context) where all active and completed quests are logged. Each quest entry includes:
	•	Quest Name – often hinting at the task or story beat (e.g., “Escape from Downtown” or “A Friend in Need”).
	•	Description/Context – a brief summary of the situation and goal, often written in a narrative tone. After major decisions, this description can update. (For example, if you chose to help Faction A instead of B in a quest, the description notes that path.)
	•	Current Objectives – a list of tasks or steps needed to complete the quest, with indicators of which ones are done. e.g., “1. Meet the contact at the old church (Completed). 2. Retrieve the hidden cache. 3. Return to the contact.”
	•	Quest Giver/Related NPC – notes who initiated the quest or who is important for it, helpful if you need to find them again.
	•	Rewards (if known) – sometimes listed if the NPC promised something (e.g., payment or an item) or if it’s obvious (completing certain quests might list “+Reputation” or a skill unlock).
	•	Main vs Side vs Procedural: The journal categorizes quests by type. Main story or faction-critical quests might be under “Main Quests”, optional side quests under “Side Quests”, and repeatable or procedural ones under “Contracts” or “Jobs”. This helps players prioritize and know which quests advance the main narrative versus which are extra content.
	•	Sorting and Filtering: As the game can have many quests, the player can sort the journal by active/inactive or by location (maybe tag a quest to see it on the map). Completed quests go into a separate history section for review if needed. Failed quests might have their own tab or marking.
	•	Map Integration: The map will show markers for active quest objectives if appropriate. There could be different colored markers for different quests, or the ability to set one quest as “tracked” so only its markers show to avoid clutter. Some quests might not give a precise marker (for instance, a clue-based quest might just mark a broad area to search or none at all to encourage puzzle-solving).
	•	Dynamic Updates: The journal updates in real-time as conditions change. If a quest becomes unavailable due to your actions (say you killed an NPC who would give or continue a quest), the quest entry might move to failed and note what happened (“You killed X, so you can no longer help them with Y.”). If a quest’s objectives change mid-way (like an ambush happens, adding a new objective “Survive the ambush”), the journal reflects that.
	•	Quest Dependencies: Sometimes one quest can affect another. The journal can hint at this. For example, if you have two quests from different factions that are at odds (“Steal the data for Faction A” and “Protect the data for Faction B”), the journal might note the conflict or even merge them into one entry with a branching choice. We aim to avoid having the player confused by two opposite quests active simultaneously without clarification. The game should prompt the player at such junctures to make a decision.
	•	Quest Completion & Rewards: When a quest is completed, a summary might pop up (“Quest Completed: [Name]. Rewards: XP, items, rep changes.”) and the journal entry moves to completed with a brief epilogue line if needed (“You chose to give the medicine to the clinic, saving many lives.”). This helps reinforce the consequence and gives closure in the log.
	•	Dialogue Integration: The quest log often echoes information from dialogues (like if an NPC said “Meet me in two days at location X,” the log will have that note). This reduces the chance of players forgetting verbal instructions.

The quest structure and journal are about player guidance and memory. With so much freedom and branching, it's vital that players have a reliable way to recall what they're supposed to do and what's happening in the world. A well-maintained quest log ensures players can take a break from the game and come back without being lost, and it lets them juggle multiple quests at once in a manageable way.
</mechanic>
</game_system>

<game_system id="progression_systems" status="partial">
Game Systems & Progression

<mechanic name="character_creation">
Character Creation & Progression (MVP-minimal)

<implementation_status>⚠️ MVP-minimal. Full progression, perks, and deep skill-tree design lives in `memory-bank/post-mvp/progression-advanced.md`.</implementation_status>

MVP intent:
	•	Character creation sets: portrait/appearance (lightweight), background, and starting SPECIAL/attributes.
	•	Progression can be shallow in Level 0: enough to support checks (dialogue/stealth/hacking) without a huge perk economy.
</mechanic>

<mechanic name="equipment_inventory">
<balance_values system="equipment">
Equipment & Inventory (MVP-minimal)

<implementation_status>⚠️ MVP-minimal. Full equipment/inventory economy moved to memory-bank/post-mvp/equipment-inventory.md.</implementation_status>

MVP intent:
	•	Keep inventory friction low in Level 0.
	•	Support quest pickups + a small set of consumables (HP heal, paranoia relief).
	•	Avoid ammo micromanagement, contraband tiers, vendor refresh simulation, and deep encumbrance penalties in MVP.
	•	If any carry limit exists, make it generous and non-punishing.
</balance_values>
</mechanic>

<mechanic name="crafting_upgrades">
Crafting Upgrades (Post-MVP)

<implementation_status>❌ DEFERRED FOR MVP - see memory-bank/post-mvp/crafting-upgrades.md.</implementation_status>
</mechanic>

<mechanic name="weapon_mods">
Weapon Mods (Post-MVP)

<implementation_status>❌ DEFERRED FOR MVP - see memory-bank/post-mvp/weapon-mods.md.</implementation_status>
</mechanic>

<mechanic name="survival_mechanics">
<balance_values system="survival">
Survival Mechanics (Post-MVP)

<implementation_status>❌ DEFERRED FOR MVP. Full hunger/thirst/fatigue survival loop moved to memory-bank/post-mvp/survival-mechanics.md.</implementation_status>

MVP policy:
	•	No hunger/thirst meters.
	•	Rest is a narrative/time-skip tool in safe contexts only.
	•	Pressure is represented by Paranoia (see Paranoia mechanic).
</balance_values>
</mechanic>
</game_system>

<game_system id="technology_development" status="partial">
Technology & Development Focus

<development_approach name="single_player">
Single-Player Focus

The Getaway is designed as a deep single-player experience with no multiplayer or online components in the initial scope. This focus has several implications:
	•	Narrative and Systems Oriented for Solo Play: All story elements are tailored to a single protagonist making decisions. There’s no need to accommodate multiple players’ choices or dialogue in conversations. The branching narrative can fully revolve around the player’s actions without syncing states with others.
	•	No Networking Required: The development does not need to implement client-server architecture or peer-to-peer connections. This simplifies testing and debugging significantly, as we avoid issues like lag, desync, or server load. It also removes concerns about cheating or moderation that come with multiplayer.
	•	Turn-Based Suited for Single-Player: Turn-based combat is naturally slower-paced and could be problematic to synchronize in multiplayer. By being single-player, we ensure the player can take their time on each turn, even walk away mid-combat if needed, since no one else is waiting. We can also allow liberal use of pause, save, or even rewinds (if we wanted a feature to undo a turn for accessibility) without concern.
	•	Resource Allocation: All development resources (programming, design, content creation) go into fleshing out the world and mechanics rather than building matchmaking, multiplayer level design, or balancing PvP. This means a richer world and AI since those are our “opponents” and allies rather than other players.
	•	Possible Future Multiplayer: We keep in mind that if the game is successful, a co-op or small-scale multiplayer mode could be a future addition (for example, two players exploring the city together). However, that would require reworking turn-based combat to allow simultaneous turns or an asynchronous system, plus ensuring the world simulation works with multiple inputs. For now, these complexities are set aside to deliver the best single-player game we can.
	•	Player Community & Modding: Single-player games often thrive on modding and community-driven content post-release. While not a core focus now, using a browser platform means modding might be as simple as editing some data files or writing JavaScript plugins, which we can consider documenting if there’s interest. But there’s no official user-generated content system at launch.
	•	Save System: Single-player focus allows robust save/load functionality. The player can have multiple save files, manual saves, quicksaves, etc., which in a multiplayer context would be restricted. We should implement an easy save system (maybe even an auto-save at key points) so players can experiment with different choices and have fallback points. This supports the branching narrative aspect, letting curious players explore alternate outcomes by reloading if they desire.

In summary, committing to single-player lets us maximize depth and immersion without multiplayer compromises. The player will feel like the sole central force in the city's story, which aligns perfectly with the narrative design.
</development_approach>

<technical_stack name="browser_platform">
<implementation_status>⚠️ PARTIAL</implementation_status>
Platform & Engine (Browser-Based Deployment)

The game will be delivered via web browsers, leveraging modern web technology to reach players instantly without installation. Here's our plan for the tech stack and engine considerations:
	•	Language: We will develop primarily in TypeScript, which compiles to JavaScript. TypeScript offers static typing, which will help catch errors early and make the code more maintainable as it grows. This is especially useful with AI-assisted generation, as the types can guide the AI to use functions and data structures correctly. Since TypeScript is a superset of JavaScript, we can seamlessly integrate any libraries or frameworks needed.
	•	Rendering Technology: The game will use HTML5 Canvas/WebGL for rendering. Given the likely 2D isometric perspective, a 2D engine with WebGL acceleration is ideal for performance. We are considering using an established game framework like:
	•	Phaser 3: A popular 2D game framework that supports tilemaps, sprites, animations, input handling, and has an easy learning curve. It would let us get a head start on map rendering and physics (though a turn-based game won’t need heavy physics).
	•	Pixi.js: A rendering library that is very efficient at drawing a large number of sprites. It doesn’t have as many built-in game mechanics as Phaser (like no integrated physics or camera logic out-of-the-box), but it’s great for custom engine development if we want full control.
	•	Babylon.js or Three.js: These are more 3D engines but can do 2D/orthographic. Overkill if we stick to 2D, but if we wanted to incorporate any 3D elements or effects, they are options. Probably not necessary here.
	•	Engine Choice: Leaning towards Phaser 3 for its all-in-one features. It has WebGL support with canvas fallback, and good community support. We can use its tilemap system for the grid-based levels and combat maps, which will save us time (we can design levels in Tiled map editor and load them easily). Phaser also handles audio, animated sprites, and scene management which covers a lot of basics.
	•	Custom Systems on Top: Regardless of engine, we will be building custom systems for:
	•	Turn-based combat logic (turn scheduler, AP system, pathfinding on grid).
	•	World simulation (NPC AI behaviors, day-night cycle).
	•	Dialogue and quest management (likely not provided by any engine, so we code this).
	•	UI elements like inventory screens, character sheets, etc. (Phaser can be used for basic UI or we might overlay HTML for complex UI like inventory grids to leverage CSS styling).
	•	Browser Compatibility: Target modern browsers: Chrome, Firefox, Edge, Safari (latest versions). We’ll test on each. We plan to use features like WebGL2 and possibly Web Workers (for offloading AI calculations) which are well-supported now. We also consider memory limits: browsers can usually handle hundreds of MBs of data, but we must be mindful on low-end machines. We may provide graphics settings (like disabling certain effects) if performance varies widely.
	•	Deployment Model: The game will be hosted on a web server, and players can play by visiting the URL. We might package it as a Progressive Web App (PWA) so it can be “installed” and run offline after initial load. Saves could be stored in browser local storage or a cloud sync if we implement that. Using web also eases updates – we can patch the game and all players get the new version on next load, though we’ll need to ensure save data compatibility.
	•	Asset Loading: We will use engine support or custom loading routines to load images (sprite sheets, tilesets), audio files, and data (JSON for quests, dialogues, item definitions). These will be likely stored in a compressed format on the server and uncompressed in memory. Given it’s a browser, we’ll implement a loading screen and possibly stream in assets in the background to reduce initial load time. We should aim to keep initial download small (maybe under 10 MB) so players get into the game quickly, then load additional content (like different district graphics or music) as needed.
	•	Resolution and Graphics: We should support different screen sizes since browser windows vary. Likely we design for a 16:9 aspect ratio at 1280x720 or 1920x1080 and ensure UI scales or anchors to be usable at other aspect ratios (like 4:3 or ultrawide, or on a tablet). Using CSS or engine scaling, we can handle resizing. Art direction preference is painterly-noir 2.5D/isometric (not pixel art, not full 3D); assets should remain readable under dynamic lighting and postFX while staying feasible for a solo-dev pipeline.
	•	Audio: We will use the Web Audio API (accessible via frameworks or vanilla) for sounds and music. We plan formats for broad support (ogg for Firefox, mp3 for others, or use engine to handle multiple). We’ll need a sound manager to play effects (like gunshots, engine noises, ambient city sounds) and music tracks that can change per zone or situation (calm exploration music vs combat music). This is part of polish, but noting it now in tech design.
	•	External Libraries: Besides the main engine, we might use libraries for:
	•	Pathfinding (e.g., implement A* ourselves or use something like easystar.js for tilemaps).
	•	AI behavior trees or planners for NPC decisions, unless we code our own simple state machines.
	•	Physics if any (unlikely since mostly grid-based movement).
	•	UI frameworks (could embed an HTML UI overlay using React/Vue for complex menus if desired, though that adds complexity).
	•	Save data serialization (we can likely just use JSON and localStorage/IndexedDB APIs).
	•	WebAssembly (WASM) Option: If performance becomes an issue in pure JS for certain parts (like a very heavy combat simulation or pathfinding with hundreds of NPCs), we have the option to write that part in a lower-level language (C++ or Rust) and compile to WASM for integration. For now, we anticipate being fine in JS/TS, but it’s good to know we can optimize later with WASM if needed (for example, a complex AI routine that can be offloaded).
	•	Testing in Browsers: We’ll set up a local dev environment (using something like webpack or parcel to bundle our TS code and serve it) to test the game in a browser as we build. We’ll use debug tools (like showing collision grids, AI state debug overlays) that we can toggle during development. Browser dev tools will be crucial for profiling memory and CPU usage.

By using a browser-based stack, we tap into a wide accessibility (anyone with a browser can play, across OS platforms, possibly even tablets). We just have to carefully manage performance and asset size to fit the constraints of web games. The chosen technology (TypeScript + Phaser or similar) is conducive to iterative development and AI-assisted coding, because many patterns and boilerplate can be generated or filled in by AI given clear descriptions (like classes for inventory items, functions for turn calculations, etc., all of which are fairly standard to code once outlined in design).
</technical_stack>

<technical_approach name="performance">
Performance Considerations

Running an open-world, turn-based simulation in a browser means we must optimize for performance from the start:
	•	World Streaming & Level of Detail: We will stream the world in chunks. The city can be divided into sectors (perhaps by district). Only the current sector and immediately adjacent ones are fully active with NPC AI and detail. Farther areas are either unloaded or running in a low-detail simulation. For example, if the player is in the Slums sector, we load the NPCs and events there. The Downtown and Industrial sectors next door update in a lightweight way (maybe just faction presence changes or major events) and more distant ones freeze or update hourly rather than per frame. As the player moves, we load new sectors ahead of time (when the player nears a boundary, begin loading the next sector’s data). This prevents memory overload and keeps processing focused.
	•	Background Simulation Throttling: For NPC actions that are not in the player’s vicinity, we don’t need per-second accuracy. We can simulate at a much slower rate or abstractly. For instance, rather than simulating every patrol route off-screen, we could determine that “per hour, faction A and B have X chance to clash in district Y” and only if the player goes there do we resolve the details. Web Workers could be used for some of this background calculation, utilizing multi-core without freezing the main game. A web worker could handle things like advancing the world state each in-game hour (processing needs, spawns, etc.), then the main thread picks that up.
	•	Pathfinding Optimization: Pathfinding (like NPCs moving on the grid or navigating city streets) can be CPU-heavy if many NPCs do it simultaneously. We’ll leverage algorithms like A* with heuristics tuned for grid movement. We can precompute navigation meshes or grids for static parts of the world. Perhaps each sector has a navgraph for major routes. In combat, the area is limited, so pathfinding is manageable (even there, if multiple NPCs need paths, we can stagger their calculations across frames or use a single path search that many NPCs can use if they’re following similar routes). Using Web Workers for pathfinding is an option if we find the main thread bogged down when lots of movement happens.
	•	AI Efficiency: NPC AI in the open world uses simple state machines (patrol, chase, flee, etc.) with infrequent decision ticks. Combat AI is more complex (needs to evaluate cover, targets, etc.), but combat usually involves a limited number of actors at once (say up to 10v10 units). We can afford more CPU per AI in combat since it’s turn-based (player will not notice a half-second think time for AI if it means smarter moves, though we aim for much less). In contrast, dozens of AI wandering the city in real-time need to be very lightweight. We’ll budget how many active NPCs can be around the player – perhaps in a busy market there are 20 NPCs with routines, which is fine for modern JS engines. For larger crowds, we might use tricks like grouping them or simulating only a few and duplicating behavior (crowd simulation techniques).
	•	Graphics and Rendering: We need to maintain 60 FPS for smoothness (or at least a stable 30 if on low-end). Using WebGL means we can render many sprites efficiently, but we should:
	•	Use sprite atlases to minimize draw calls (combine many small textures into one so the GPU can draw them in one go).
	•	Limit layer overlap. In isometric view, layering is needed for depth sorting (drawing things in the correct order). We might implement our own simple painter’s algorithm for sorting sprites by their y-coordinate each frame (commonly done in 2D). This is fine up to a point – if there are hundreds of entities, sorting becomes a bit heavy but still okay in JS if optimized.
	•	Use particle effects sparingly. Explosions, smoke, etc. should be capped. We might pre-render some effects as sprite animations instead of real-time particle simulations.
	•	Provide options to disable or reduce effects, or lower texture resolution, for slower devices.
	•	Memory Management: JavaScript has garbage collection which can cause hitches if a lot of garbage accumulates. We’ll aim to reuse objects and arrays where possible. For instance, instead of deleting an entity object when an NPC dies, maybe pool it for reuse for the next NPC that spawns. Large data structures like the world grid can be created once and updated rather than recreated. Also, be mindful of not leaking memory - remove event listeners, references when sectors unload so GC can clean them. We’ll test via browser dev tools for leaks (watching memory usage as you travel back and forth between areas).
	•	Audio Performance: We’ll pre-load audio and stream longer music to avoid big memory usage. Web audio can handle many sounds, but we should throttle how many play at once (don’t have 10 gunshot sounds overlapping excessively; maybe limit polyphony or use a pooling system for sound channels).
	•	Saving/Loading: Saving the entire world state can be intensive if we try to do it all at once. But since it’s single-player, it’s fine to pause the game during save. We might compress the save data (maybe using JSON stringify and compress algorithm, or an IndexedDB structure). Saves not too large (maybe a few MB at most) so that should be okay. We’ll autosave at key points but not too frequently (maybe once every in-game hour or after big events) to avoid stutter.
	•	Profiling and Testing: During development, we will profile the game on different hardware: a high-end PC, a mid-range laptop, maybe a tablet. We’ll identify bottlenecks (e.g., if pathfinding is slow with current approach, or if rendering certain tiles is expensive). Optimizations will follow: sometimes in algorithm (reducing complexity), sometimes in toggling engine features (maybe turning off expensive physics if we accidentally enabled it for something trivial), or in content (if a certain effect or asset is too heavy).
	•	Fallbacks: If some browsers or devices struggle, we have fallback plans:
	•	Allow a “low detail mode” that reduces draw distance (if applicable in city view), lowers NPC counts, disables shadows, etc.
	•	If WebGL isn’t available (rare these days), allow Canvas rendering with simplified visuals (no shaders, etc.).
	•	Ensure the game can still run at 30 FPS without logic breaking (tie logic updates to real time, not frames, for consistency).
	•	Continuous Optimization: As we add features, we will regularly test performance to catch issues early. For example, when adding dynamic NPC schedules, test with dozens of NPCs active. When adding deferred large systems (e.g., vehicles Post-MVP), test fast traversal across sectors to see if loading keeps up.

In summary, our strategy is to optimize smartly: update what needs updating, render what needs rendering, and no more. By controlling scope (single-player, 2D view) and using the power of WebGL and multi-threading (web workers), we anticipate being able to create a rich open world that runs smoothly in a browser environment.
</technical_approach>

<technical_approach name="development_tools">
Technical Stack & Tools

To manage development efficiently and integrate AI-assisted coding, we outline our tools and practices:
	•	Version Control with Git: We will use Git for source code management. The repository will contain code, configuration files, and possibly even content like dialogue JSON (though large binary assets like images might be handled through a separate pipeline or Git LFS). Git allows multiple team members (and AI suggestions) to contribute with trackable changes. We’ll commit frequently with clear messages, which also serves as documentation of progress. If an AI tool suggests changes, those will go through review (we won’t auto-commit AI code without testing).
	•	Development Environment: We will set up a comfortable IDE (like Visual Studio Code) with TypeScript support. VSCode integrates well with Git and has extensions for TypeScript/Phaser development. It also can integrate AI coding assistants like GitHub Copilot. We’ll configure linting and formatting (ESLint, Prettier) to keep code style consistent, which also helps AI outputs be consistent.
	•	AI-Assisted Workflow: Using tools like Copilot or GPT-based code generation, we can do things like:
	•	Generate boilerplate classes (e.g., an Item class with properties for name, weight, value, etc., and maybe some default methods).
	•	Get suggestions for algorithms (like “function to calculate line-of-sight on grid” – the AI can draft it, and we refine and verify).
	•	Quickly produce repetitive content structures (maybe writing JSON schema for items or copying patterns for multiple skills).
	•	However, we’ll remain cautious: AI can introduce subtle bugs or inefficiencies, so all AI-generated code is reviewed and tested.
	•	Modular Architecture: We’ll structure the code into modules: e.g., WorldSimulation, CombatSystem, DialogSystem, QuestManager, InventorySystem, etc. Each module has defined interfaces. This encapsulation helps assign tasks (perhaps AI works on one module at a time via prompts like “Implement function X in module Y according to spec”). It also makes debugging easier since subsystems are somewhat independent.
	•	Data-Driven Design: Wherever possible, use data files (JSON or TS objects) for content: item definitions, enemy stats, dialogue lines, quest scripts. This means less hard-coding and easier tweaking. AI can even assist in generating large data sets – for instance, if we need a hundred item descriptions or a variety of NPC names, an AI can help generate those following a pattern. Data-driven also aids modding and future expansions.
	•	Testing & QA: We will write unit tests for critical systems using a JS testing framework (like Jest or Mocha). For example, test that the combat damage calculation works as expected, or that saving and loading restores the same world state. AI could help write some tests by explaining the scenario (“Write a test for the Inventory system ensuring adding an item increases weight and removing decreases it accordingly”). Continuous Integration (CI) can run these tests on each commit to catch regressions. In a browser context, we might also do automated playtests using headless browser scripts (or simply rely on human QA for playthroughs).
	•	Logging and Debugging: During development, we’ll have debug logs (which can be toggled off for release) to trace AI behavior decisions, quest state changes, etc. If something goes wrong in the simulation, these logs will be invaluable. We can also build a debug menu in-game (accessible with a key) to toggle states (make it noon, spawn a certain NPC, win a combat, etc.) to test various scenarios quickly.
	•	Asset Pipeline: Use tools for asset optimization:
	•	Texture Packer to combine sprites into atlases.
	•	Audacity or similar to compress audio.
	•	Possibly procedural generation tools for some graphics (or AI image generation for portraits concept that then get touched up by artists, though that’s a content pipeline consideration).
	•	We’ll script the build process (maybe npm scripts or a tool like Gulp/Webpack) to take raw assets and produce web-optimized versions and manifest files. This process can be automated in CI as well.
	•	Documentation: Maintain documentation of code architecture and data formats (could be markdown files in repo). AI tools can help generate documentation by summarizing code or ensuring our doc strings are comprehensive. This design document itself can evolve into a living document or spawn more technical design docs for each subsystem.
	•	Performance Monitoring: We might include a debug overlay that shows FPS, number of active entities, memory usage, etc., to spot performance issues during test sessions. If using an engine like Phaser, some of this can be gleaned from its internal stats or Chrome’s performance profiles.
	•	Security: Being a browser game, code is essentially open to users. We won’t have sensitive secrets in the code (any critical logic is client-side anyway due to single-player). But we should ensure no obvious exploits like giving players an easy way to execute arbitrary JS through console (though since it’s not competitive, cheating is only self-spoiling). If we do any cloud sync or online features, we’ll secure those endpoints appropriately.
	•	Deployment & Updates: For hosting, a simple static file server or itch.io upload might suffice. We just need to ensure versioning doesn’t break saves. We could embed a version number in save data and write upgrade logic if needed (e.g., if we add a new stat in a patch, handle older saves missing it). AI can assist by analyzing differences between versions and suggesting migration code.

By planning our development tooling and workflow, we set ourselves up to efficiently build the game and maintain high code quality. The use of AI is a force-multiplier but not a replacement for thoughtful design and testing. This design document itself will guide the AI in generating code aligned with the intended features, essentially translating the high-level descriptions into actual game mechanics.
</technical_approach>

<technical_approach name="future_proofing">
Future-Proofing & Scalability

We aim to write code and design systems that are robust and extensible, so the project can grow or be adapted beyond the initial release:
	•	Modular & Extensible Code: As mentioned, an entity-component-system (ECS) architecture or similarly modular approach ensures new content or entity types can be added without rewriting core logic. For example, if we later introduce flying drones as a new entity, we can just add a “flying” component or an AI behavior for flying, without overhauling the combat system. The quest system is data-driven so new quests (even community-made) could be plugged in if they follow the data format. Item definitions can be added to JSON without touching the code, unless a new effect requires a new code handler (which we could plan for via an effect scripting system or generic effect handler in combat).
	•	Scalability of World Size: If we decide to expand the city or add a new region in an update or sequel, the streaming system and sector-based approach will handle it as long as memory allows. We should avoid hard-coding limits like “only 10 sectors” or “max 100 NPCs” – use dynamic structures (maps, lists) that can grow. Memory is a constraint, but as devices improve, the same code could handle more content.
	•	Engine Flexibility: If down the line we wanted to port the game to a native platform (like release on Steam as a desktop app), we could wrap it with Electron or use something like NW.js. The web code would run with minor adjustments (file system for saves perhaps). Similarly, porting to mobile could be done via Cordova or just relying on mobile browsers if the UI is made responsive to touch. Therefore, we won’t design anything that fundamentally requires keyboard-only or assumes a very large screen – keeping UI somewhat flexible will help potential mobile or tablet play.
	•	Multiplayer Considerations: While not in scope now, some design choices can ease future multiplayer. For instance, if we keep game logic separated from rendering, we could one day run the logic on a server or sync states. Turn-based combat could theoretically be adapted to hot-seat or asynchronous multiplayer if each turn’s actions can be serialized and sent. We won’t implement this now, but by not entangling input handling with game state too tightly, we leave a door open.
	•	Continuous Improvement via AI: As AI tools improve, we can use them not just in initial development but for patches and expansions. Having a clear design (this doc) and clean codebase means when we describe a new feature to an AI assistant, it can provide help consistent with existing code. We’ll maintain updated documentation reflecting any changes (for example, if we tweak the combat formula during balancing, update the design doc or a balancing doc accordingly). This synergy ensures our design and implementation stay aligned, which is crucial for long-term maintenance.
	•	Community Feedback Loop: Post-release, we expect feedback on balance or feature requests. Our architecture should allow tweaking numbers easily (e.g., change an enemy’s HP in a data file rather than code). If players want a new feature (say, a new faction or a new vehicle type), we check if our current systems support it or need extension. Because we’ve tried to generalize systems (like faction reputation is already dynamic, adding a new faction is mostly adding data and a few references in world generation), we can respond to feedback without massive refactors.
	•	Performance Headroom: We will optimize for current typical hardware, but also ensure the game can run on weaker machines by providing options. If technology leaps (browsers get much faster, or WebAssembly becomes more accessible), we could update the game to push view distance further or increase NPC counts for those who can handle it. The design should have configurable constants for such things (max active NPCs, etc.), making it easier to scale up or down.
	•	Codebase Management: We might eventually open source parts of the project (or at least share code with modders). Clean separation of proprietary assets (art, story) from code will be considered for that scenario. In any case, our internal code needs to be understandable by new team members or our future selves, which means writing clear code, with comments and docs. AI can help document code, but we must also manually ensure key algorithms are explained.
	•	Testing for Edge Cases: As content grows, edge cases multiply (e.g., what if the player becomes hated by all factions before a certain main quest? Does the game still have a path forward?). We should use a combination of automated tests and scenario testing to cover unusual but possible states. This also ties into save system – ensure saves from any point can be loaded and the game can progress to an ending without getting stuck, even if some content was skipped or some NPCs died. Designing quests with multiple fail-safes or fallbacks (like if an NPC is dead, allow quest completion via a note or alternate NPC) is part of this robustness.

By focusing on future-proofing, we hope The Getaway can be a platform for storytelling and gameplay that lasts beyond the initial content. Whether through official expansions or community mods or just the flexibility to patch and improve, the game's design and code should accommodate growth and change without breaking down. In essence, we treat this not just as a one-off game but as a living project that can evolve.
</technical_approach>
</game_system>

<conclusion>
Conclusion

This comprehensive game design document for The Getaway outlines a vision of a dystopian open-world tactical RPG with deep systems and a player-driven narrative. We have detailed the setting of a living, breathing city divided by factions and plagued by scarcity, the intricate turn-based combat mechanics that emphasize tactics and resource management, and the open-world exploration filled with dynamic events and survival challenges. Storytelling is central, with branching dialogues and quests ensuring that the player's choices truly shape the fate of the city and its inhabitants.

On the development side, we've committed to a robust single-player experience delivered via browser technology, leveraging TypeScript and WebGL for broad accessibility without compromising on depth. We have considered performance from the ground up to enable a fluid gameplay experience even in a complex simulated world, and we've planned our technical architecture to be modular and maintainable, easing the integration of AI-assisted code generation. Our approach balances the creative freedom of design with the practicality of implementation, using modern tools and methodologies to bring this ambitious game to life.

With this document as a foundation, the next steps are to iteratively build and test each system, frequently referring back to these design specifications. AI-assisted development will help accelerate coding, but careful human oversight will ensure the game meets the design goals and provides a compelling experience. The Getaway aims to immerse players in a challenging yet rewarding journey through a post-apocalyptic city where every decision matters, every ally or enemy is remembered, and survival is earned through strategy, wit, and sometimes sheer audacity. This design document will guide the team (and our AI helpers) in delivering a game that is both technically sound and richly imaginative, serving as a strong blueprint for development moving forward.
</conclusion>
