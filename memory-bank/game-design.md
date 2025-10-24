The Getaway - Game Design Document

<game_overview>
Game Overview

The Getaway is a single-player, open-world tactical RPG set in a dystopian city. The game combines turn-based grid combat with exploration in a living, persistent world. Players navigate a city divided into distinct zones and biomes, each with unique challenges and factions. Through branching narrative and dynamic events, player choices shape the story and the game world. This design document outlines the core features, mechanics, and systems that define The Getaway.
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
Living World & AI

The game world is persistent and simulated, meaning changes endure and NPCs behave autonomously to create a living world:
	•	AI-Driven NPC Behavior: Civilians, traders, and faction members go about daily routines independently of the player. For example, a merchant might travel between markets each day, or a gang patrol might roam their territory looking for intruders.
	•	Dynamic Interactions: NPCs and factions interact with each other. Rival faction members might fight if they cross paths, or guards might chase criminals in the streets. These skirmishes can occur whether or not the player is there to witness them.
	•	Procedural Events: Random events happen throughout the city to keep the world unpredictable. The player might stumble upon a mugging in progress, a street protest, a building on fire, or an overturned supply truck. They can choose to get involved or ignore these events, and their actions (or inaction) can have ripple effects.
	•	Responsive World State: The world reacts to major events or player actions. If the player causes a power outage in a district, that area might fall into chaos with looting and more crime until power is restored. If a gang leader is taken out, that gang’s presence noticeably diminishes, and other factions may move into their turf.
	•	Day/Night Behavior: Tied to the day-night cycle, NPC behavior changes over time (e.g., at night, law-abiding citizens stay home while gangs and predators become more active). Shops open and close at certain hours. Some quests or events are only available at a particular time of day.

These systems ensure the city feels alive and immersive. The player is one part of a larger ecosystem, and the world can surprise them with new developments during their journey.
</mechanic>

<mechanic name="trust_fear_ethics">
Trust/Fear Ethics Layer (MVP - Step 29.2)

<implementation_status>⚠️ PARTIAL - Introduced in Step 29.2, expands into localized gossip network in Step 29.5</implementation_status>

Moral perception in The Getaway leans into survival pragmatism rather than binary good/evil. Each faction and neighborhood cell maintains a lightweight `EthicsProfile` with two axes:
	•	**Trust (-100..100)** — Measures whether locals believe the crew will protect their interests. Positive trust unlocks safer routes, better prices, and candid intel.
	•	**Fear (0..100)** — Captures how dangerous or volatile the crew appears. Elevated fear intimidates holdouts, deters harassment, and increases checkpoint scrutiny.

**Action Records & Context Tags**
	•	Player-facing systems (combat, quests, barter, exploration choices) emit `ActionRecord` payloads: `{ actor, verb, target, locationId, tags[], witnesses[], timestamp }`.
	•	Tags describe situational ethics rather than outcomes: `scarcity_high`, `aid_given`, `threat_displayed`, `resource_hoarding`, `lawless_zone`, `medical_need`, `witness_children`.
	•	Trust and fear deltas map from these tags. Example: `aid_given` during `scarcity_high` grants +15 trust, while `threat_displayed` in a `lawless_zone` drives +10 fear but only +2 resentment.

**SPECIAL & Background Modifiers**
	•	Charisma amplifies positive trust swings (+10% per point above 6); low Charisma dampens gains and accelerates decay.
	•	Strength above 7 boosts fear impact (+8% per point) and slows fear decay; fragile builds struggle to intimidate without escalating violence.
	•	Background perks supply signature biases (e.g., Ex-CorpSec gets a +5 baseline fear in CorpSec precincts; Street Urchin halves fear gain when actions target civilians).

**Systemic Hooks**
	•	**Economy**: Shop price multiplier = faction reputation modifier × trust discount × fear surcharge. High-trust vendors offer better rates; high fear forces bribes.
	•	**Encounters**: Ambient encounter tables adjust patrol density and ambush likelihood using fear as a weight. Trust unlocks escort offers or emergency aid events.
	•	**Dialogue Tone**: NPC bark variants pull from trust/fear bands (e.g., high trust & low fear = warm gratitude; high fear = clipped, cautious responses).
	•	**Soft Locks**: Low trust may gate official clinics, but high fear opens clandestine routes (night market with riskier odds instead of hard failure).

**Decay & Maintenance**
	•	Trust decays slowly toward neutral when the crew ignores a faction or cell (−2 per in-game day). Fear evaporates faster (−5 per day) unless reinforced.
	•	Specific events (festivals, ceasefires, curfews) can temporarily freeze decay or spike thresholds, tying ethics flow into world scheduling.

**Rumor Seed**
	•	Actions with deltas over configured thresholds enqueue a `Rumor` entry `{ contentKey, accuracy, sourceFaction, spreadTimer, audiences[] }`.
	•	Rumors remain scoped to the originating faction/location until Step 29.5 introduces full propagation. Accuracy defaults to 0.8 for firsthand witnesses, 0.5 otherwise.

**Developer Telemetry**
	•	A dev-only `EthicsDebugPanel` surfaces current trust/fear values per faction, the last three action records, and derived modifiers for quick balancing.
	•	Designers can tweak tag-to-delta tables via JSON without code changes, encouraging rapid iteration on ethical nuance.

This layer ensures the world reacts to scarcity-driven ethics immediately while leaving room for the deeper witness gossip network to evolve those reactions into long-term, subjective reputations.
</mechanic>

<mechanic name="localized_reputation_network">
Localized Reputation & Gossip System

The city remembers what it actually sees. Instead of a single global meter, reputation propagates through witnesses and their social webs so fame and infamy feel rooted in specific places and crews.

**Core Loop**
        •       **Sense**: Any notable deed (heroic rescue, brutal execution, slick theft, dazzling competence) emits a `ReputationEvent` tagged with traits, intensity, and context (district cell, time of day, factions involved).
        •       **Perceive**: Potential witnesses are sampled from the active map cell. Each calculates a visibility score factoring line-of-sight, distance, lighting, crowd density, disguise modifiers, and ambient noise. Sub-threshold observers become rumor fodder rather than eyewitnesses.
        •       **Interpret**: Witnesses filter events through faction values and personal biases to produce trait deltas (heroic, cruel, sneaky, intimidating, competent) with a confidence grade. Saving a raider hostage might read as “honorable” to fellow raiders but “traitorous” to settlers.
        •       **Write**: Scoped reputation buckets update for the individual witness, their faction, and the local neighborhood cell. High confidence yields stronger adjustments; low confidence generates tentative rumors that affect dialogue tone but not hard gating.
        •       **Propagate**: Gossip travels across pre-authored social links with latency, falloff, and daily "gossip energy" budgets so stories spread in pockets. Intense, spectacular events can jump cells; mundane actions usually stay local.
        •       **React**: NPC behaviors (prices, quest offers, guard alertness, bouncer access) read the highest-weighted reputation scope relevant to their relationship. A vendor who watched you defend their stall grants discounts immediately; their cousin down the block hears later.
        •       **Decay**: Trait scores degrade toward neutral unless refreshed, preventing permanent notoriety from a single incident and encouraging players to cultivate their image intentionally.

**Design Principles**
        •       **Local First**: Start with per-cell reputation to ensure District A can adore the player while District B shrugs.
        •       **Subjective Truth**: Factions interpret the same act differently; conflicting rumors can coexist until clarified by direct observation.
        •       **Uncertainty in Dialogue**: NPCs surface their confidence—"I heard you iced those CorpSec goons" (low confidence) vs. "I saw you drag Mara out of the fire" (high confidence).
        •       **Budgeted Gossip**: Each NPC has limited rumor tokens per day, preventing instant world coverage and letting designers tune information speed.
        •       **Heuristic Flavor**: Quick-feel formulas keep events punchy (e.g., Scary = weapon weight × finisher style × bloodiness × crowd density; Helpful = lives saved × aid value × risk × style bonus).

**Gameplay Hooks**
        •       **Economy**: Shopkeepers who witnessed heroics apply 10–20% discounts; rival witnesses impose surcharges until you repair your image.
        •       **Access Control**: Bouncers or gate guards rely on their clique’s perception to open back rooms or lock you out. Flashy intimidation builds unlock intimidation-only routes where locals watched you dismantle threats.
        •       **Law & Security**: Guard responses escalate only in cells where hostility has been observed or gossiped with high confidence; elsewhere they remain neutral.
        •       **Quest Variants**: Missions reframe based on localized reputation—districts that saw your collateral damage request clean-up gigs, while others pitch you as a covert hero.

**Authoring & Debugging Tools**
        •       **Heatmap Overlay**: Visualize trait perception per cell to tune propagation falloff.
        •       **NPC Inspector**: Inspectors list top-three traits, confidence, and rumor sources so writers can adjust dialogue lines.
        •       **Sandbox Controls**: Designers can scrub decay rates, propagation caps, and thresholds live to feel how fast stories travel.

This system reinforces stealth, intimidation, and altruism builds by rewarding intentional play in front of the right audience while keeping the city’s reaction plausibly fragmented.
</mechanic>

<mechanic name="witness_memory_heat">
Witness Memory & Regional Heat

Binary "wanted" flags flatten stealth play. Instead, eyewitnesses retain fuzzy memories that cool over time unless refreshed, and nearby security forces read the hottest memories to decide how aggressively they respond.

**Witness Memory Model**
	•	Every NPC who positively identifies the player (or their vehicle/disguise) records a `WitnessMemory` `{ targetId, certainty, recognitionChannel, lastSeenAt, halfLife, reinforcedAt?, reported }`.
	•	`certainty ∈ [0,1]` expresses how confident the witness is; direct, well-lit sightings trend toward 0.8–1.0 while peripheral glimpses land near 0.2–0.4.
	•	Decay follows a configurable half-life tuned per district density (crowded downtown = 72 in-game hours, rural outskirts = 168). Designers can adjust half-lives to pace stealth fantasy per zone.

```
certainty_w(t) = certainty_w(t0) * 0.5 ^ ((t - t0) / half_life)
```

**Reinforcement & Suppression**
	•	Repeat sightings, guard briefings, or seeing wanted posters refresh `lastSeenAt` and add certainty (clamped at 1). Recognition channels (`face`, `outfit`, `vehicle`, `gait/voice`) stack so swapping cars removes vehicle memories without invalidating facial recognition.
	•	Bribes, intimidation, or trusted alibis can mark a memory as `suppressed`, immediately lowering certainty or capping future reinforcement gains until the witness is convinced again.
	•	Lighting, distance, disguise quality, crouch state, and crowd density reduce incremental certainty gains to reward smart stealth play. Night operations combined with high-tier disguises may keep certainty below the reporting threshold.

**Regional Heat Calculation**
	•	Each map cell or district aggregates the top-K active memories (default 5) weighting certainty by proximity and whether the witness has reported to authorities.
	•	Heat tiers: `0–0.4 = calm`, `0.4–0.7 = tracking` (guards fan out, passive searches), `0.7+ = crackdown` (reinforcements, checkpoints). Designers can override thresholds per faction temperament.
	•	Heat naturally subsides as memories decay. No magical timer clears suspicion—the player must hide, relocate, or disrupt reinforcement loops to cool a district.

**Player Counterplay**
	•	Disguises, vehicle swaps, and night travel erode specific recognition channels, letting players strategically break links without wiping all notoriety.
	•	Destroying cameras or silencing witnesses prevents reinforcement. Conversely, letting witnesses gossip kicks certainty into the guard network faster.
	•	Debug-facing HUD overlays (or George’s dev feed) can surface leading witnesses and current heat bands for balancing without exposing meta numbers to players.
	•	The current implementation ships a developer-only Suspicion Inspector overlay that displays the active zone’s heat tier and top witnesses for quick tuning passes.

This mechanic grounds stealth tension in human memory—witnesses forget, rumors blur, and thoughtful downtime matters—while dovetailing with the localized reputation network for longer-term social consequences.
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
Combat Overview

Combat in The Getaway is turn-based and takes place on a grid, offering tactical depth in each encounter. When combat is triggered (for example, an enemy spots the player or a hostile encounter is initiated via a quest), the game transitions from real-time exploration to a turn-based combat mode. The battlefield is divided into tiles (squares or hexes), much like classic games such as Fallout 2 or Heroes of Might & Magic 3. Each participant – player characters, allies, enemies, and even vehicles – takes turns according to an initiative order determined by their stats or situational factors.

This turn-based approach allows players to carefully plan moves, use cover, and coordinate attacks. It slows the pace during combat so that positioning and strategy matter more than reflexes. Outside of combat, the game returns to real-time exploration seamlessly.
</mechanic>

<mechanic name="grid_movement">
Grid and Movement

Encounters are resolved on a grid map that corresponds to the environment (streets, building interiors, etc.), enabling spatial tactics:
	•	Characters can move a certain number of tiles per turn based on their movement allowance or Action Points (covered below).
	•	The grid can be hexagonal or square; this will be determined in development (hex grids allow movement in six directions, whereas square grids align with orthogonal map layouts).
	•	Terrain affects movement: moving through difficult terrain like rubble, shallow water, or climbing through a window costs more movement points/AP. Open ground is easy to traverse, while obstacles block movement completely.
	•	Movement is important not just for closing distance or escaping, but for tactical positioning (flanking enemies, reaching cover, etc.). Players will often need to balance using a turn to move versus using it to attack or use an ability.
	•	If combat starts while the player is in a vehicle, the vehicle will appear on the grid and can move as a unit with its own movement rules (e.g., a car might move several tiles in a straight line but have a wide turning radius on the grid).
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
<implementation_status>⚠️ PARTIAL - MVP in Step 24.5, Advanced features in Step 26.1</implementation_status>

Stamina - Sustained Effort Resource

Stamina is a third core resource (alongside Health and AP) that represents physical exertion outside of moment-to-moment combat. Where AP governs tactical turns, stamina measures how long the crew can sprint, climb, and hustle through hostile zones before needing a break.

**Core Stamina Pool (MVP - Step 24.5):**
	•	Base Stamina: 50 + (Endurance × 5)
		○	Low Endurance (3): 65 stamina
		○	Medium Endurance (5): 75 stamina
		○	High Endurance (8): 90 stamina
		○	Maximum Endurance (10): 100 stamina
	•	Passive Regeneration: +3 stamina each overworld tick while walking or idle
	•	Rest Actions: Safehouse sleep, campsite rest, or stamina consumables restore larger chunks instantly (rest = full restore)
	•	Full Restore: Level-ups refill stamina to max alongside the health bonus
	•	Combat Freeze: Stamina does not change while combat is active; AP handles all turn-by-turn costs

**Stamina Costs (MVP):**
	•	Sprint/Dash: 2 stamina per tile on the overworld grid
	•	Climb/Vault/Force Door: 6 stamina per attempt
	•	Encumbrance Drift: Moving while above 80% carry weight drains 1 extra stamina per tile until the load lightens
	•	Sustained Tasks: Lockpicking, hacking, or crafting attempts beyond the first cost 1 stamina apiece (representing prolonged focus)
	•	Stealth Burst: Optional silent takedown or quick reposition maneuver (future Step 26.x) can consume stamina for tactical variety without touching core combat loops

**Exhaustion Penalties (MVP):**
When stamina drops below 30%, the character becomes exhausted:
	•	Overworld Movement: -25% travel speed; sprinting/climbing disabled until stamina > 40%
	•	Skill Pressure: Dialogue, stealth, and interaction checks take a -10% success penalty
	•	Strenuous Actions: Additional 1 stamina surcharge; actions abort if stamina would fall below 0
	•	Visual Feedback: Stamina bar shifts from green to amber, "Fatigued" icon pulses on the HUD

**Tactical Implications:**
	•	AP defines tactical turns; stamina shapes mission pacing and route planning
	•	Extended sprints or forced entries push the squad toward exhaustion before firefights begin
	•	Rest stops become strategic choices—risks of ambush vs benefits of restored stamina
	•	High Endurance builds excel at long infiltration runs; low Endurance teams must plan shorter bursts and lean on equipment
	•	Consumables and perks that mitigate fatigue are valuable for marathon operations or curfew runs

**Advanced Stamina Features (POST-MVP - Step 26.1):**
These extend stamina into survival and environmental storytelling without reintroducing combat bookkeeping:

	•	Day/Night Modifiers:
		○	Day (6AM-10PM): Baseline costs and regen
		○	Night (10PM-6AM): +25% stamina costs, -1 passive regen (stress, low visibility)
		○	Curfew Patrols: Entering high-threat zones applies an additional -3 stamina per overworld tick from adrenaline dump

	•	Circadian Fatigue:
		○	Track hours awake; after 8 hours, max stamina drops 10% per additional hour
		○	Safehouse sleep resets fatigue; stimulants delay penalties but cause a heavier crash later
		○	Pulling an all-nighter (16+ hours) locks the squad into Exhausted state until a full rest

	•	Environmental Effects:
		○	Industrial smog: -2 stamina per tick while exposed
		○	Rough terrain: Double sprint costs (4 stamina per tile)
		○	Heat waves: +20% stamina costs, reduced regen
		○	Toxic zones: Regen suppressed until protective gear is equipped

	•	Advanced Perks & Skills:
		○	Conditioning (Survival skill): Reduce stamina costs by 0.5% per point (max 50% at 100)
		○	Second Wind (Perk): Once per mission, restore 40 stamina when the bar drops below 10
		○	Steady Hands (Perk synergy): Negate stamina penalties on interaction checks while Fatigued
		○	Iron Lungs (Perk): +25% passive regen and resistance to environmental drains

	•	Rest & Recovery:
		○	Safehouse options: Quick Rest (restore 50%), Full Sleep (restore 100% and clear fatigue debuffs)
		○	Sleeping Bag: Rest anywhere with encounter risk and partial restore
		○	Food/Water: Being well-fed grants +1 regen; hunger/thirst impose additional stamina penalties

**Design Philosophy:**
Stamina reinforces the campaign’s push-and-pull between daring infiltration and safehouse reprieves. By keeping combat purely AP-driven, we avoid double bookkeeping during firefights while still rewarding players who plan routes, manage encumbrance, and schedule rest. Advanced hooks let designers layer time pressure, environmental hazards, and survival challenges without overwhelming the core tactical experience.

Paranoia - Player Stress Resource (MVP - Step 24.6)
Paranoia replaces stamina on the HUD for MVP and tracks the crew’s psychological load from corporate policing, surveillance, and night movement. The system is tiered (Calm → Uneasy → On Edge → Panicked → Breakdown) and feeds both combat modifiers and world directors.
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
	•	Interplay:
		•	Street-Tension Director (Step 19.7) reads normalized paranoia to bias crackdown/respite patterns
		•	George assistant is now the diegetic vent for fear management (Reassure button + ambient narration)
		•	Consumables diversify stress relief loops (CalmTabs, Nicotine packs) and hook into loot economies
		•	Safehouses provide tangible psychological relief in addition to logistical reset
	•	Debugging: dev inspectors expose current value, tier, stimuli breakdowns, and allow future balancing without guessing hidden math

</balance_values>
</mechanic>

<mechanic name="cover_line_of_sight">
Cover & Line-of-Sight

The combat system emphasizes using cover and line-of-sight for tactical advantage, similar to modern tactical RPGs:
	•	Cover Objects: The environment in combat is filled with objects that can serve as cover — walls, barricades, vehicles, furniture, etc. Standing behind cover makes a character harder to hit. We categorize cover as partial (e.g., crouching behind a low wall or car hood) which provides some defense, or full (e.g., completely behind a solid wall) which can block attacks entirely until the enemy flanks or destroys the cover.
	•	Taking Cover: Characters can use a portion of their movement/AP to take cover against an object. The interface will indicate when a position offers cover (for example, a shield icon might appear if moving to that tile will put the character behind cover relative to an enemy). Proper use of cover greatly improves survival, as firefights in the open are deadly.
	•	Line-of-Sight (LoS): An attack can only hit a target if there is line-of-sight. If an obstacle is between attacker and target, the target might be completely safe or have an evasion bonus. The game will calculate LoS for each attack; if an enemy isn’t visible due to walls or darkness, the player may need to move or use tools like sensors.
	•	Flanking: Because cover is directional, enemies will try to flank the player, and the player can do the same. Flanking an enemy (attacking from a side where their cover doesn’t protect) negates their cover bonus. This encourages moving characters around the battlefield rather than staying in one spot.
	•	Destructible Cover: Some cover objects can be destroyed by sustained fire or explosives. For instance, wooden crates or glass windows offer cover initially but can shatter after a few hits. This means cover doesn’t guarantee safety forever — if you hunker down behind a flimsy barrier and the enemy focuses fire, you’ll have to relocate or risk exposure.
	•	Overwatch & Reactions: A character can choose to spend their turn going into Overwatch mode (using any remaining AP). In overwatch, if an enemy moves within a character’s line-of-sight during the enemy’s turn, the character will automatically use reserved AP to take a shot at that enemy. This mechanic allows defensive play and area denial, and it interacts with cover (e.g., running between two covered spots could trigger enemy overwatch fire if you cross an open gap). Enemies can use overwatch too, so the player must be cautious when advancing.

Using cover effectively and managing sight-lines is crucial. Rushing in without cover will usually result in quick defeat, whereas clever use of the environment allows a smaller force to take on larger groups successfully.
</mechanic>

<mechanic name="special_abilities">
Special Abilities & Tactical Options

Characters and enemies have more than just basic attacks, adding depth and variety to combat:
	•	Targeted Shots: Skilled characters can perform aimed shots targeting specific enemy body parts. For example, shooting an enemy’s legs can slow their movement, or aiming for the arms can disarm them or reduce their accuracy. This mirrors Fallout’s targeted shot system. Targeted shots typically cost extra AP and require a higher skill, but inflict strategic debuffs.
	•	Melee Takedowns: Stealthy or melee-focused characters can execute powerful close-quarters moves. If a player manages to start combat with an enemy unaware (an ambush), they might get a free melee takedown attempt that can silently eliminate or heavily damage an enemy at the outset. This encourages stealthy approaches and skillful positioning before a fight begins.
	•	Area-of-Effect Attacks: Explosives like grenades, Molotov cocktails, or planted mines can hit multiple targets in a radius. These are useful against clustered enemies or those behind cover (since splash damage can bypass cover). The player must use them carefully to avoid injuring their own team or destroying valuable loot. Some heavy weapons also have blast radii (rocket launchers, etc.).
	•	Support Abilities: Characters may have support abilities such as throwing a smoke grenade (to create temporary cover and block enemy vision), using a flashbang (to stun enemies and reduce their AP on their next turn), or deploying a small drone or turret. For example, a deployable turret could act as an extra ally for a few turns, drawing fire and shooting at enemies.
	•	Buffs and Debuffs: Certain actions can temporarily enhance allies or weaken enemies. For instance, a “Battle Cry” ability might boost allies’ damage or AP for the next turn, while a “Marked Target” ability could make a chosen enemy easier for everyone to hit. Some of these effects might come from gadgets or leadership skills rather than inherent character abilities.
	•	Consumables: During combat, the player can use consumable items for tactical gains. Examples include medkits or syringes to heal or grant temporary stat boosts (like an adrenaline shot to increase AP), combat drugs that enhance speed or strength at a cost, or gadgets like an EMP device that can disable robotic enemies and electronic defenses for a short time.

These varied options ensure combat doesn't feel repetitive. The player can approach encounters in different ways: one fight might involve sniping and traps, another could be resolved by hacking a security robot to turn on its masters, and another might see the player use brute force with heavy weapons. Tactical creativity is rewarded.
</mechanic>

<mechanic name="autobattle_mode">
AutoBattle Mode & Behaviour Profiles

AutoBattle lets players temporarily hand tactical control to the squad’s AI so fights can flow like a modern autochess round while still respecting The Getaway’s AP economy and cover rules.
	•	Automation Toggle: A dedicated AutoBattle toggle lives in the settings menu, pause/options shell, and combat HUD (button plus `Shift+A`). When enabled, the preference persists per save, so grinders can clear easier encounters hands-off yet still opt for manual play in tough missions.
	•	Behaviour Profiles: Players select Aggressive, Balanced, or Defensive profiles that weight priorities differently—Aggressive spends consumables and closes distance, Balanced values positive expected damage vs. incoming risk, Defensive hoards AP for overwatch, healing, and fortified cover. Profiles can be swapped mid-encounter to react to changing board states.
	•	HUD Quick Toggle: The combat overlay keeps AutoBattle to a single enable/disable button; behaviour presets stay in the Game Menu so the slim widget never overwhelms the battlefield.
	•	Autochess-style Planner: Each AutoBattle step now scores candidate attacks and reposition moves via expected damage, cover gain, distance deltas, and AP reserve penalties tuned per profile. The top-scoring option triggers whenever the squad still has AP, mirroring the “plan → resolve” cadence of autochess rather than scripted rotations.
	•	Player Agency & Fail-Safes: Manual input (movement keys, attack hotkeys, HUD clicks) instantly pauses automation and flips the toggle off. The controller also halts when dialogue prompts appear, combat ends, or AP drops below the configured reserve so the AI never overruns a story beat or burns the last action point unintentionally.
	•	Transparency & Debugging: Combat logs annotate automation decisions (“AutoBattle (Balanced) → Move to cover (Gain cover)”), and the HUD badge tracks Engaged/Paused/Standby states with the last decision summary. Designers can inspect the persisted decision payload in `autoBattleSlice` for deeper tuning without stepping through code.

This optional layer gives newcomers and grinders a low-friction way to enjoy turn phases while retaining deep tactical control the moment they toggle back to manual play.
</mechanic>

<mechanic name="vehicles_in_combat">
Integration of Vehicles

Vehicles add an extra dimension to both exploration and combat in The Getaway:
	•	Combat Entry with Vehicles: If a combat encounter triggers while the player is using a vehicle (e.g., driving through hostile territory and getting ambushed), the vehicle is present on the combat grid. The player can choose to fight from the vehicle or disembark. Allies can also be in the vehicle, providing a mobile fighting platform at the start of combat.
	•	Vehicle as Unit: A vehicle in combat is treated like a large unit. It has its own stats: health (durability), possibly armor, and maybe separate components (tires that can be shot out, an engine that can be damaged, etc.). Enemies can target the vehicle, and some may prioritize disabling it to remove the player’s mobility.
	•	Movement & Ramming: The player can spend AP to move the vehicle on their turn. Vehicles can cover more ground per AP than characters, but are limited by terrain (they can’t go indoors or through very rough terrain on the grid). A vehicle can also be used as a weapon: ramming an enemy with a car can deal massive damage or outright kill weaker foes. Ramming might have a chance to knock the vehicle off course or cause some self-damage, balancing its power.
	•	Mounted Weapons: Certain vehicles might be equipped with mounted weapons like a turret or plow. For example, an armored car could have a roof-mounted machine gun that a companion can operate. Using a mounted weapon costs AP from whoever is controlling it (possibly a companion or the player if they switch to that role). These weapons often have a wide firing arc and high damage output, turning the vehicle into a formidable combat asset.
	•	Mobile Cover & Transport: A vehicle provides mobile cover. Characters can hide behind a vehicle to shield themselves from gunfire. They can also use the vehicle to reposition quickly on the battlefield – driving to a safer spot or evacuating allies. Getting in or out of a vehicle during combat costs some AP, so players need to time entry/exit carefully (for instance, diving into the car when under heavy fire, or jumping out before the vehicle becomes a death trap).
	•	Damage and Repairs: Vehicles can be damaged or even destroyed in combat. If a vehicle’s health drops to zero, it might become wrecked and non-functional, or potentially explode if it’s that type of vehicle (causing area damage). The player will then need to survive on foot and later repair or replace the vehicle. Repairing a vehicle can be a post-combat task or even an action by a mechanically-inclined character during combat (using AP to jury-rig fix a few HP).
	•	Balancing Vehicles: While vehicles provide advantages (speed, protection, firepower), the game will balance encounters so they’re not unbeatable tanks. Enemies may have anti-vehicle weapons (like EMP grenades to stall an engine, or heavy arms like rocket launchers). Some combat scenarios (tight indoor spaces, rooftops) simply won’t allow vehicles, forcing the player to proceed on foot. Also, fuel considerations (see Survival mechanics) might mean the player saves vehicle use for when it’s really needed.

By integrating vehicles, combat scenarios become more diverse. One fight might be a tense on-foot shootout in a claustrophobic warehouse, and the next could be a running battle where the player drives their truck through barricades while exchanging fire with a gang. It gives the player more tactical choices and a sense of continuity between exploration and combat.
</mechanic>
</game_system>

<game_system id="exploration_open_world" status="partial">
Exploration & Open-World Elements

<mechanic name="persistent_world">
Persistent Open World

Outside of combat, The Getaway is an open-world experience where the city can be freely explored in real-time. The world is persistent, meaning it remembers the state of things as you leave them:
	•	If the player clears an enemy hideout, that location remains cleared. New occupants might move in much later (or not at all), but it won’t simply respawn identical enemies when you return. The results of your actions are lasting.
	•	Changes caused by quests or player actions (blowing up a bridge, making peace between two gangs, etc.) have lasting effects on the game world. These are not reset, underscoring that the player’s decisions have impact. For example, if you negotiate a truce between factions, you’ll see those factions peacefully coexisting in areas where they used to fight.
	•	Time is continuously tracked. A day-night cycle progresses as the player explores (for example, one in-game hour might pass every few minutes of real time, adjustable for gameplay pacing). If you start a journey in the morning, it might be evening by the time you arrive at your destination, with corresponding changes in NPC behavior and visibility.
	•	The open world is populated by many locations: city streets, markets, faction bases, secret hideouts, abandoned buildings, underground sewers, etc. Players can enter many structures or at least interact with them (hacking a door lock to enter a warehouse, climbing through a window of a skyscraper, etc.), making exploration rewarding and full of discovery.
	•	The design supports backtracking and free travel. There is no fixed linear progression through areas; you can roam almost anywhere you dare. Some areas may be extremely dangerous for a low-level character, serving as soft barriers (you can go there, but expect a tough fight or environmental hazard). But if you’re clever or sneaky, you might still explore these areas early and get high-tier loot or information.

Persistence means the world state evolves over the entire playthrough. Enemies don't magically reset, and earlier actions can remove or alter content later. This makes the player feel genuine impact and also requires them to live with their decisions (no easy re-dos of quests unless they reload a save).
</mechanic>

<mechanic name="exploration_travel">
Exploration and Travel

Traversing the city is a core part of gameplay, with an emphasis on player freedom and risk-reward during travel:
	•	On Foot Exploration: When walking through the city, players can move at their own pace, sneaking or running as needed. On foot, the player can discover hidden paths (like climbing a fire escape to a rooftop for a shortcut or sniper position) or slip through narrow alleyways that vehicles can’t access. Foot travel is slower and potentially more dangerous (you might get cornered or ambushed easily), but allows thorough exploration to find loot and secrets.
		•	Vehicle Travel: Players can use vehicles they’ve acquired to move faster through the world. Driving a car or riding a motorcycle lets you cover ground quickly and can help outrun threats. However, vehicles make noise and are conspicuous, possibly increasing the chance of drawing attention or triggering certain encounters (roadblocks, ambushes). The game might implement a limited fast-travel system using vehicles for long distances – for example, once you have driven to a safehouse in another district, you can fast-travel there later via an in-game explanation (like your character drives there off-screen).
		•	Navigation & Map: The game provides a map of the city that updates as you discover new locations. Key places (faction HQs, safehouses, major landmarks) get marked. The player can set waypoints to guide travel. However, the map starts mostly blank or with minimal info, encouraging exploration to fill it in. There may be in-game maps or informants that can add markers for you (e.g., buying a city guide or obtaining a faction’s intel might reveal the locations of all their safehouses).
		•	Points of Interest: The world is designed with points of interest scattered throughout to make exploration engaging. This includes things like: stashes of supplies tucked away in ruined buildings, unique NPCs who might appear in certain areas (like a mysterious trader in an alley), environmental storytelling elements (e.g., graffiti that hints at a nearby hideout, or a trail of blood leading to a hidden scene).
		•	Hazard Integration Matrix: District hazards (smog density, radiation pockets, surveillance saturation) combine with live environment flags (curfew tier, blackout status, gang heat) through a shared matrix. The resulting weights modulate NPC routines, corp reinforcement cadence, merchant availability, and feed the travel-advisory HUD banner so route planning reflects systemic risk instead of static danger labels.
		•	Safe Zones and Resting: Scattered around the world are safer areas (like neutral zones or player-established safehouses) where combat is unlikely. Here the player can rest to heal and pass time, manage inventory, or converse with NPCs without immediate threats. These spots serve as hubs in the open world and checkpoints for the player’s progress. For example, a friendly bar might be a place to get rumors and hire help, and it remains off-limits for fighting by mutual agreement of factions.

Exploration is about balancing curiosity with caution. Venturing into unknown territory can yield great rewards (resources, new quests, allies) but also risks dangerous encounters or overextending your supplies. The player must gauge when to travel, what to bring, and how to get there – on foot quietly or loudly in a vehicle.
</mechanic>

<mechanic name="dynamic_npc_factions">
Dynamic NPC Behavior & Factions

The world is inhabited by various NPCs with their own agendas, making the city feel alive beyond the player's direct interactions:
	•	Factions and Territories: Key factions control specific neighborhoods or resources. For example, a paramilitary police force might enforce order in the Downtown Core, while a gang controls the slums’ black market, and an underground resistance operates in the industrial ruins. These territories are visibly marked by faction graffiti, flags, or patrolling NPCs. If the player trespasses in a hostile faction’s area, they might be confronted or attacked unless they have a disguise or a good reputation with that faction.
	•	AI Schedules and Activities: NPCs have daily cycles and tasks. Shopkeepers open their stalls in the morning and go home at night. Gang members might collect “taxes” or harass locals in the afternoon, then retreat to hideouts later. Security forces could enforce a curfew after dark in wealthier districts. These patterns create predictable windows for the player (e.g., it might be easier to infiltrate a compound at night when some guards are off-duty, but harder to move through the streets due to curfew patrols).
	•	Faction Conflicts: Factions will sometimes engage in conflicts with each other without player involvement. The player might come across a battle already in progress between two rival groups. These fights are driven by the simulation (for instance, if a gang tries to push into police territory). The outcome might be determined by the game’s AI if the player doesn’t intervene, potentially shifting control of that area. The player can choose to join a side or avoid the conflict; whatever they do (or don’t do) can influence which faction gains the upper hand.
	•	Reaction to Player: NPCs react dynamically to the player’s status and behavior. If the player has a high reputation with a faction, members of that faction will greet them warmly, allow them into secure areas, or even assist in fights. If the player is infamous for violence (very low karma), civilians might flee at the sight of them or refuse to talk, and some may attempt to attack or report the player to authorities. On the other hand, being known as a hero (high karma) might cause desperate NPCs to approach the player for help or thank them for past deeds. Also, carrying weapons openly or driving a loud vehicle through a quiet zone can change NPC behavior (guards might go on alert, civilians hide).
	•	Economy and Ecology: The city’s “ecosystem” responds to events. For example, if the player disrupts the supply of drugs in the slums (by completing a quest), drug prices might skyrocket on the black market and gang violence could spike as they fight over remaining stock. If a major gang is eliminated, the crime rate in their former territory might drop, making it safer for merchants and travelers. Wildlife or rogue robots in the outskirts might multiply if left unchecked, making journeys there more dangerous until the player or a faction deals with them.

The combination of these behaviors means the city feels like a living system. The player can influence it heavily, but even if they try to lay low, things will still happen around them. This creates opportunities for the player to react to the world's changes, not just the world reacting to the player.
</mechanic>

<mechanic name="random_encounters">
Random Encounters & Events

As players roam the city or travel between areas, random encounters and dynamic events keep the experience engaging and unpredictable:
	•	Random Encounters: These are unscripted scenarios the player can run into, especially in less secure or unoccupied areas. Examples include: a bandit ambush in a deserted street, a mutated creature emerging in the wasteland outskirts, a panicked stranger asking for help with pursuers, or stumbling upon a cache of supplies guarded by traps. Encounters can be combat-oriented or narrative. Some encounters might offer ways to avoid combat or resolve them creatively (e.g., negotiate with the bandits, or use a high stealth skill to sneak around the creature).
	•	Dynamic Events: These are larger-scale or time-based occurrences that can happen based on triggers or world state. For instance, a sudden sandstorm or acid rain might sweep through the city, forcing the player to find shelter and temporarily changing visibility and NPC behavior. A city-wide alert could be triggered by a storyline event (like a prison break or an assassin on the loose), causing more checkpoints and police presence until it’s resolved. These events often present temporary challenges or opportunities (higher danger but maybe particular quests or loot available only during the event).
	•	Encounter Frequency & Variation: The likelihood of certain events depends on location, time, and player status. At night in the slums, the chance of encountering a mugger or gang lookout is high, whereas in the daytime you might more likely run into pickpockets or protesters. In faction-controlled zones, “random” encounters might actually be patrols or checkpoints relevant to that faction. If the player is driving, encounters might take the form of vehicular ambushes or roadblocks, whereas on foot they might be more small-scale. The system will have a variety of encounters so they don’t repeat too often, and some may only happen once per game (unique events) to keep things interesting.
	•	Mini-Quests and Choices: Many encounters present a quick one-off decision or mini-quest. For example, finding an injured person on the road could lead to a choice: help them (use medicine or carry them to safety), rob them, or ignore them. Each choice might have consequences (helping could improve karma and maybe that person rewards you later; robbing could give immediate loot but hurt karma; ignoring could mean they die and you feel the narrative weight of that). Another example: coming across two factions in a standoff – you could help one side, try to mediate, or just slip away, and whichever side you help will remember that.
	•	World State Changes: Certain random events, once they occur, can permanently affect something in the world. If a building burns down due to an event, it might remain a ruin for the rest of the game (perhaps accessible as a new area with its own loot or dangers). If a group of refugees appears looking for a home (as an event), they might settle in an area and create a new minor faction or trading post if the player helps them. Random events thus contribute to the evolving narrative of the city.

Random encounters ensure no two playthroughs are exactly alike and encourage players to stay alert and adaptive. They make traveling more than just moving from point A to B – the journey itself can become its own story.
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
Vehicles in Exploration

Vehicles are not just for combat; they are essential tools for open-world traversal and tie into multiple gameplay systems:
	•	Acquisition: The player may acquire vehicles through quests, purchase, or theft. Early in the game, they might start on foot, then get a basic vehicle (like a beat-up car or bike) by helping a mechanic or stealing one from enemies. As the game progresses, better vehicles become available (e.g., an armored truck or a high-speed bike). Each vehicle type has its own advantages (speed, durability, storage space).
	•	Travel & Overworld Map: Driving reduces travel time significantly. If the game features any sort of world map or distance simulation, vehicles lower the chance of encounters because you spend less time exposed. However, they might have specific encounter types (like roadblocks or car chases) that you wouldn’t get on foot. The player can typically drive on roads or open areas; attempting to go off-road in a city environment might mean crashing or getting stuck (we can keep some realistic limitations to avoid trivializing navigation puzzles).
	•	Fuel Management: Most vehicles require fuel (gasoline, diesel, or maybe battery charge for electric ones). Fuel is a resource found in the world or bought from certain traders (or stolen from fuel depots). This acts as a limiting factor on vehicle use; the player must consider how far they can go and carry spare fuel if going on a long trip across the city or outskirts. Running out of fuel in a hostile area could leave the player stranded until they find more, which adds an element of survival strategy.
	•	Storage & Inventory: Vehicles have trunks or storage compartments. The player can stash extra weapons, ammo, or loot in the vehicle rather than carrying it all on their person. This encourages using the vehicle as a mobile base when exploring far from a safehouse. However, accessing the trunk might be unsafe during combat (you’d need to be at the vehicle and spend time), so it’s more for before/after combat planning. If a vehicle is lost or stolen, any items in it would be temporarily lost too (the player might have to retrieve the vehicle or catch the thieves to get their stuff back).
	•	Upgrades & Customization: Players can upgrade vehicles at garages or by using their Mechanics skill. Upgrades include better engines (faster travel and acceleration), reinforced bumpers (more damage when ramming and less damage to the vehicle), armor plating (higher durability and resistance to gunfire), spikes or blades on wheels (to discourage melee attackers from approaching), improved storage capacity, better headlights (for night travel), and mounted weapons. Cosmetic customization (paint jobs, decals) might also be available for personalization, though primarily aesthetic.
	•	Vehicle Damage & Theft: In the open world, vehicles can be damaged by rough driving or attacks. If you drive through a firefight, stray bullets might hit your car. Repairing a vehicle requires tools and parts, which the player can carry or find at a workshop. If you leave your vehicle unattended in a dangerous area, NPC thieves might attempt to steal it or strip it for parts. The player could invest in anti-theft upgrades (like an alarm or steering lock) to mitigate this. There could even be a dynamic where if your car is stolen, you get a quest or map marker to get it back from a chop-shop.
	•	Alternate Transportation: Besides personal vehicles, the city might have remnants of public transit or other travel means. For example, maybe an old subway system can be reactivated or used for fast travel between certain points (if the player clears it of monsters or repairs the generators). Or perhaps there’s a train that runs occasionally between districts that the player can hitch a ride on (safe but on a schedule and fixed route). These alternatives can add flavor and options but are not as flexible as having your own ride.

By incorporating vehicles into exploration, the game offers players flexibility in how they experience the open world. You can cruise through danger zones quickly or go on foot to stealthily scavenge, and each choice has its own set of consequences and gameplay implications. Vehicles also serve as a form of player progression – acquiring a better vehicle feels like a significant milestone and opens up new possibilities (much like getting a ship in a space game or a horse in a medieval RPG).
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
Procedural Storylets (“Library of Plays”)

To keep emergent runs feeling authored, the campaign adopts a three-layer storylet framework inspired by Wildermyth’s “Library of Plays” approach:
	•	Villain Plot Spine: Each campaign arc defines explicit Act I / II / III beats (setup, escalation, finale). These beats act as the narrative spine that anchors randomization to a destination. The spine tracks active antagonist goals, required locations, and milestone quests that must land to keep the story coherent.
	•	Modular Event Plays: Storylets are self-contained vignettes written as tiny stage plays. Each play declares roles (e.g., `protagonist`, `foil`, `witness`), entry triggers (mission completion, exploration discovery, relationship threshold, ambush, downtime rest), and outcomes that update quests, reputation, injuries, or boons. Plays live in a shared library and can run in any eligible scene provided their inputs are satisfied.
	•	Embedded Variation: Character traits, injuries, factions, and relationship states swap specific lines, reactions, or follow-up branches inside each play. The same vignette reads differently when a bonded ally fills the `witness` role versus a rival, and mechanical consequences (temporary buffs, mood shifts, scars) reference those personal states.

Design requirements:
	•	Write storylets with explicit preconditions, cooldowns, and completion tags so they can’t repeat too frequently or clash with the campaign spine.
	•	Cast roles dynamically using the current party roster and companion bench; fall back to archetype NPCs if mandatory roles are missing.
	•	Surface required traits/tags directly in content definitions (e.g., `needsTrait: ["stealth_specialist"]`) to keep authoring declarative and data-driven.
	•	Ensure outcomes cleanly route back into gameplay systems: redux reducers update quest state, relationship meters, or apply status effects; UI panels render the resulting comic/dialogue with placeholders swapped for the assigned characters.
	•	Allow designer-authored weighting so certain plays prefer early/late arc placement or specific zones, keeping tone aligned with the villain plot.

Testing expectations:
	•	Simulate multiple party compositions and campaign states to confirm the engine casts roles without leaving gaps or repeating recently played vignettes.
	•	Verify localization stubs exist for every branch/variant line and that placeholders insert correct pronouns/names.
	•	Confirm mechanical consequences (injury flags, reputation shifts, temporary buffs) propagate to the corresponding systems and decay/resolve as scripted.
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
Tone-Preserving Procedural Dialogue

The tone mixer keeps emergent dialogue aligned with the agreed voice pillars while giving designers replayable variation:
	•	Trait Axes: Author, persona, and scene fingerprints score seven axes (warmth, melancholy, sarcasm, surrealism, urgency, steadiness, wit) in the `[0,1]` range so the runtime can blend them deterministically.
	•	Rhetorical Controls: Blended traits feed sentence length mean/std dev, metaphor rate, and fragment preference. Urgency shortens lines, surrealism and melancholy raise imagery density, steadiness reins in fragments.
	•	Weighted Blending: Default weighting is `0.4 author / 0.4 persona / 0.2 scene`. When no scene hint is supplied the weights re-normalise to author/persona. Designers can override the weighting per request if a scene mood should dominate.
	•	Templates & Palettes: Micro-templates (deadpan reassurance, urgent push, surreal resilience) declare slots that draw from trait-weighted synonym palettes. Entries may tag motifs such as `motif.streetlight`, `motif.compass`, `motif.rain_hum`, `motif.glowsticks` to maintain recurring imagery.
	•	Motif Hygiene: Each persona owns a lightweight motif counter. Selecting a motif-tagged line bumps the counter, reducing its weight on the next pull while the manager decays counters every time the persona speaks so imagery can return after a breather.
	•	Deterministic Seeds: Dialogue nodes provide a `seedKey` that, combined with `(dialogueId, nodeId)`, guarantees the same prose in UI, tests, and localisation tooling while preserving `node.text` as the fallback.
	•	Content Authoring: Author fingerprints live in `content/dialogueTone/authors.ts`, personas in `personas.ts`, scene hints in `scenes.ts`, and template/palette definitions in `templates.ts` / `palettes.ts`. Locale bundles opt in via `toneDefaults` / `tone` metadata so translators see both the generated output and the underlying fallback line.
</mechanic>

<mechanic name="role_based_dialogue_templates">
Role-Based Procedural Dialogue Templates

Systemic NPC roles now draw from reusable dialogue families so ambient encounters stay coherent with the city’s fiction while reflecting moment-to-moment context:
	•	Content Registry: Role templates live in `the-getaway/src/content/dialogueTemplates/roles/` (merchant, checkpoint_guard, street_doc, gang_scout, safehouse_handler). Each entry defines a `templateKey`, summary, optional tone overrides, and whether it serves as the fallback line for that role.
	•	Gating Parameters: Templates can require specific faction standings, reputation thresholds, time-of-day windows, curfew states, blackout tiers, supply scarcity levels, hazard keywords, or owned perks. The resolver evaluates these constraints before sampling and automatically falls back to any `isFallback` variant when nothing matches.
	•	Token Replacement: Template text supports tokens like `{{highlightItem}}` or `{{intel}}`. Token resolvers are seeded helpers that select hazard-aware stock (battery bricks during blackouts, respirators during smog alerts), perk callouts, or patrol intel so lines stay fresh but on-theme.
	•	Deterministic Output: `resolveRoleDialogueTemplate` seeds selection with `(dialogueId, nodeId)` plus optional overrides, ensuring the same NPC delivers the same line for a given conversation while still allowing variability across runs.
	•	Tone Integration: Template authors may supply `toneOverrides` (preferred persona/template/scene) so the tone mixer keeps the cadence consistent with the intended speaker while still leveraging palette/motif blending.
	•	Authoring Flow: Narrative data opts into a systemic line by storing `[roleTemplate:merchant.default_greeting]` (or similar) in the dialogue node. The DialogueOverlay resolves the template, merges tone overrides, and forwards the enriched node to the mixer so handcrafted and systemic content share the same UI path.
</mechanic>

<mechanic name="choices_consequences">
Choices & Consequences

Throughout the game, players will face decisions that have meaningful consequences on the story and world. We ensure that choices are not just cosmetic – they lead to different outcomes, some immediately visible and others that unfold later:
	•	Branching Missions: Many missions have multiple ways to complete them, and the player’s choices in those missions can set off different chains of events. For example, a mission might be to deal with a corrupt official. The player could choose to bribe the official (gaining favor with them but reinforcing corruption), expose their crimes to the public (earning karma and public support but maybe causing chaos in that district), or assassinate them (pleasing their enemies and instilling fear). Each approach would result in a different follow-up scenario or quest.
	•	Moral Dilemmas: The game frequently presents moral dilemmas. These aren’t just “good vs evil” but often difficult trade-offs. For instance, you might have to choose between saving a group of civilians or capturing a high-value target who’s responsible for their plight. You can’t do both because of time constraints. Such a decision will affect your karma and faction relations (maybe the authorities praise you for capturing the criminal but the local populace despises you for the collateral damage). The story will adapt: if you save the civilians, one of them might become an ally or quest-giver later; if not, perhaps their community rises up in anger or despair.
	•	Long-Term Consequences: The outcome of early choices can cascade into later parts of the game. If in the early game you help a small faction grow strong, in the mid-game that faction might dominate a district and change the questlines available there. If you betray someone early on, don’t be surprised if they (or their friends) come seeking revenge when you least expect it. We track these key decisions in the background and use them to branch dialogues, quests, and even battles (for example, an enemy you spared might show up in a final battle to aid you, or to fight you because they changed their mind about you).
	•	Dynamic Story Adaptation: Because the narrative is open, the game logic will adapt to what the player has done. There will rarely be a fail-state for the overall story due to a choice; instead, the story pivots. If you refuse to help a faction with an important task, maybe they fail without you and you experience the fallout (the city is worse off or another faction steps in). If you kill an important NPC, the game will route around that – perhaps their lieutenant takes over and the questline continues with a vengeful spin. The idea is to let the player truly shape the narrative but still ensure there’s a coherent story path forward.
	•	Feedback on Choices: To make consequences clear, the game will often provide feedback. NPC dialogue or in-game news broadcasts might talk about what you did (“After the water supply was poisoned, citizens are falling ill…”). Faction reputation changes are shown immediately. Major branches will usually be telegraphed (“If you do this, there’s no going back”). And the quest log will update to reflect the outcomes (“You chose to arm the rebels; the Corporate faction will remember this.”). We want players to feel the weight of decisions without being blind-sided by outcomes that seem random.

In essence, The Getaway treats player choices as a core mechanic, just as important as combat or exploration. The world's story is the sum of what the player decides to do (or not do), providing a personalized narrative experience.
</mechanic>

<mechanic name="quest_drivers">
Faction, Character, and Event-Driven Quests

The storytelling is delivered via quests, which can be categorized by their narrative drivers:
	•	Faction-Driven Quests: Each major faction provides a series of quests reflecting their goals and perspective on the city’s problems. For example, working with a militant Resistance faction might involve missions to sabotage corporate installations, rescue political prisoners, and rally support among citizens. These quests advance that faction’s storyline and typically culminate in a high-stakes operation that can significantly change the city’s status quo (like a revolution or the ousting of a rival faction). Faction quests often force the player to confront where their loyalties lie, sometimes presenting critical choices (e.g., whether to follow a faction leader’s order that goes against the player’s morals).
	•	Character-Driven Quests: Significant NPCs (including possible companions or notable figures in the world) have their own quest lines. These quests delve into personal stories and relationships. For example, a companion who is a former gang member might ask for help dealing with their old crew, leading to a story of revenge or redemption. A neutral character like a local doctor might have a quest to secure medical supplies for the sick, revealing backstory about a plague or experiment in the city. These quests personalize the experience and often reward the player with unique items or allies, as well as karma changes depending on how they resolve personal dilemmas.
	•	Event-Driven Quests: Some quests are triggered by the game’s dynamic events or world state changes rather than a fixed NPC quest-giver. If a famine breaks out in a district due to a supply line being cut (perhaps as a result of a previous quest), an event-driven quest might activate to secure food for that district, either by negotiation or force. If a major character is assassinated by someone other than the player (say, a power struggle within a faction), the player might get swept up in the aftermath via quests to restore order or exploit the chaos. These quests ensure the world’s dynamic changes include the player in resolving them, making the player feel like a part of the living world narrative.
	•	Quest Webs: Often, quests interlink across these categories. A faction quest might introduce a character who later has their own personal quest. Or a personal quest might require choosing which faction’s help to enlist, thereby tying into faction reputation. Event-driven quests can segue into faction quests (e.g., a riot event might prompt the faction in charge of security to offer a quest to help quell the violence). The narrative design tries to web these together so that the overall plotlines weave into a cohesive experience rather than isolated tracks.
	•	Optional vs Main Quests: Faction quests could be considered “main” quests in the sense that pursuing at least one faction’s storyline is necessary to reach an ending. Character-driven quests are mostly optional but enrich the story and can influence the final outcome (for example, having a certain ally on your side might change an ending scene). Event-driven quests are often missable if you’re not in the right place at the right time, but they ensure the world never feels static. The quest journal will mark which ones are critical and which are optional, but we expect players to naturally gravitate towards the faction stories they care about as their main narrative.

By mixing these quest types, the game achieves a narrative that feels both expansive (many things happening in the city) and centered on the player's journey (since you decide which quests to follow and which causes to support). It's a balance of faction politics, personal stories, and emergent events that together tell the full story of The Getaway.
</mechanic>

<mechanic name="multiple_endings">
Multiple Endings & Open-Ended Play

The culmination of the narrative is represented by multiple possible endings, and the game acknowledges the player's journey through a variety of outcomes:
	•	Ending States: Based on key decisions, which factions you supported or destroyed, your karma, and certain quest outcomes, the game can conclude in different ways. Examples of distinct ending states:
	•	Escape: The player manages to get out of the city (the original “getaway”). This could happen with different contexts – escaping alone leaving the city to its fate, escaping with a group of survivors, or escaping as part of a deal with a faction (maybe you hand control of the city to one group in exchange for your freedom).
	•	City Liberation: The player leads or significantly aids in overthrowing the oppressive powers and making the city a better place. This ending might involve establishing a new government or alliance of factions that promises hope for the average citizen.
	•	Domination: The player ends up in a position of power. For example, they become the new gang overlord or install themselves as the head of a major faction, effectively ruling the city through might or influence.
	•	Destruction/Collapse: Through action or inaction, the city falls into chaos or is destroyed. Perhaps the factions’ war goes nuclear (figuratively or literally) and the final scenes are of the city burning. The player might escape the destruction or perish with it depending on their choices.
	•	Status Quo (Bittersweet): The player fails to make large-scale change. Maybe they stop their personal nemesis or complete their personal goal, but the city remains dystopian and harsh, just with some different faces in charge. The player leaves or retires within the city, having survived but not really changed the world.
	•	Epilogue & Slides: After the final mission, the game will present an epilogue reflecting the consequences of the player’s actions. This can be done via narrated slides or in-game cutscenes. Each major faction, companion, or district might get a segment describing its fate. For example, “With the CorpSec forces defeated, the slums experienced a brief freedom, but without strong leadership, chaos soon took over until a new council of citizens was formed…” or “Having taken control of the gangs, you enforced a ruthless order in the city. Crime decreased, but only because you became the ultimate crime lord, ruling through fear.” These epilogues give closure to various plot threads and show the long-term outcome.
	•	Karma/Personality Reflections: The endings will also reflect the player’s moral standing and key choices. A high-karma player’s city liberation ending might describe how justice and compassion lead to a brighter future, while a low-karma player could liberate the city only to impose a new tyranny. If the player frequently used a particular approach (like always negotiating peace or always resorting to violence), the ending narrative might note that pattern. Essentially, the ending tries to acknowledge how you went about things, not just what you did.
	•	Multiple Endings, One Playthrough: It’s intended that a single playthrough will only show one set of ending slides (one ending scenario), so players won’t see other possibilities unless they replay. The game should make it clear through the narrative what the major branching points are, so players have hints about what could have been different. For example, an NPC might say “If someone were to unite these factions instead of pitting them against each other, maybe this city would stand a chance,” hinting at an ending path the player didn’t take.
	•	Open-Ended Play (Post-Game): We have to decide whether the player can continue playing after reaching an ending (a “free roam” mode after the final battle/decision). If the ending involves the player leaving the city or major irreversible change, continuing might not make narrative sense. One approach is to create a save point before the final sequence, so players can finish the game and then reload to do remaining side content. Another approach is if the ending was positive and the city persists, let the player wander the changed city (e.g., if they became a ruler, they can walk around and see the citizens reacting to the new order). This is something we’ll clarify in development.
	•	Replayability: The game is designed for high replay value due to the branching content. Players are encouraged to replay making different major choices: support a different faction, make opposite moral choices, play with a different character build which might open new dialogue options (like high tech vs high charisma). To facilitate this, we might allow skipping already seen dialogues or a New Game+ with some carried-over benefits (maybe retain character stats or a special item to make a second run faster). The multiple endings are a reward for replay, showing drastically different outcomes for the city.

In summary, The Getaway doesn't have one "true" ending – it has many, reflecting the complex interplay of the player's decisions throughout the game. The ending serves as the ultimate feedback on the player's impact on the world, and ideally, each ending feels like a natural result of the player's journey, providing closure (or intentional lack thereof) to the story they crafted.
</mechanic>
</game_system>

<game_system id="quest_design" status="partial">
Quest Design

<mechanic name="quest_variety">
Quest Variety

To keep gameplay engaging, The Getaway uses a mix of handcrafted quests and procedural (dynamically generated) tasks:
	•	Handcrafted Quests: These are carefully written and scripted missions with unique scenarios. They often have multiple stages, bespoke level design elements, and important story choices. Handcrafted quests drive the main narrative and key side stories (faction missions, companion quests, critical world events). They include detailed objectives, custom dialogue, and sometimes unique gameplay mechanics or one-off puzzles designed by the developers. For example, a handcrafted quest might involve staging an ambush on an armored convoy: it could have a setup phase (scouting and placing explosives), a combat phase, and a moral choice at the end (what to do with the survivors or the cargo).
	•	Procedural Quests: To supplement the core storyline and give the world a sense of ongoing activity, the game generates simpler quests dynamically. These quests use templates with variable parameters (location, enemy type, reward) and can occur repeatedly with variations. Examples include:
	•	Bounty Hunts: The player is tasked with hunting down a particular person or creature causing trouble. A template might be “Eliminate [Target Name], who was last seen at [Location].” The target could be a bandit leader, a rogue robot, or a mutant creature. Depending on world state, the target and location adjust (if the wasteland creatures are growing, a mutant hunt appears; if gangs are rampant, a gang boss bounty appears).
	•	Resource Runs: A faction or settlement might need supplies: “Collect X units of medicine/food/fuel and deliver them to [NPC/Location].” These encourage exploration and possibly conflict if the resources must be taken from somewhere (maybe raid a stash or trade).
	•	Rescue Missions: A random NPC (or minor character related to an area) gets in trouble: “So-and-so was kidnapped by raiders and is being held at [Location]” or “A lost child wandered into the sewer system.” The game can generate a suitable location and enemies for the hostage scenario.
	•	Escort/Delivery: “Escort this caravan/trader to another district” or “Carry this important item to an NPC in a different zone.” Along the way, there may be ambushes or obstacles.
	•	Territory Defense or Invasion: If the simulation detects one faction attacking another, it can create a quest for the player: “Help defend [Location] from an attack by [Faction]” or vice versa “Join [Faction] in an attack on [Location].” These are more dynamic since they depend on the current faction relations.
	•	Procedural quests are delivered through in-world means to maintain immersion. You might find a “Wanted” poster, get a radio call or distress signal, or an NPC runner might approach you with a request. They are often optional and can be ignored or picked up at leisure, but they provide opportunities to earn extra rewards, gain reputation, and encounter combat scenarios outside the main storyline.
	•	Quality and Limitations: We will ensure procedural quests remain simple enough that their generated nature isn’t immersion-breaking. They won’t have complex dialogue trees or huge plot twists; they are straightforward tasks. However, we will write enough flavor variations so they don’t all feel identical. For instance, even if “bounty hunt” repeats, the targets will have different little backstories or reasons (given in a mission briefing or by examining a crime scene).
	•	Balancing with Story: Handcrafted quests will generally yield bigger story developments and significant rewards (rare items, big rep changes). Procedural quests give modest rewards and help with grinding or world immersion. Players who just follow the main quests will get a complete story, but those who engage with procedural quests will find the world feels more alive and will be better prepared (via extra XP and gear) for tough challenges. The game design will avoid requiring grinding procedural quests; they are there for fun and depth, not as filler that must be done.

By combining handcrafted and procedural content, The Getaway provides both a curated narrative experience and an endless stream of small-scale activities. This keeps the game world feeling busy and gives players flexibility to pursue their own priorities (be it story, character improvement, or just exploration for its own sake).
</mechanic>

<mechanic name="faction_quests">
Faction-Based Quests & World Impact

Faction quests are a major component of the game and directly influence the balance of power in the world:
	•	Dedicated Quest Lines: Each major faction has its own quest line that advances their agenda. For example, a faction quest line for the Resistance might include missions to: infiltrate a communications tower to broadcast a message, protect a gathering of sympathizers, assassinate a key official, and finally lead an assault on the government headquarters. These quests are interwoven with narrative scenes that develop faction characters and ethos (you learn why they fight and what they’ll do if they win).
	•	Shifting Power Dynamics: Completing faction quests will usually strengthen that faction and weaken their enemies. The game keeps track of territory control and influence. If you do a series of quests for the Warlords gang to eliminate a rival gang and intimidate the populace, you’ll see the Warlords’ graffiti and patrols extend into new areas, and the rival gang’s presence will diminish or vanish. NPCs in those areas will comment on the change (e.g., “Ever since the Black Snakes were wiped out, the Warlords run these streets. It’s a bit safer for us civilians now, if you don’t cross them.”).
	•	Exclusive Alignments: Often, progressing to the later stages of a faction’s quest line will lock you out of others. If you become the champion of Faction A and help them conquer significant objectives, Faction B (their main competitor) will likely turn hostile or at least refuse to give you quests. This is communicated through the storyline – perhaps Faction B labels you a traitor or your actions directly pit you against them in battle. The game might allow some degree of playing both sides early on, but eventually, you’ll face a choice whom to side with in a critical conflict.
	•	Multiple Approaches: Some faction quests may offer branching within themselves. For instance, a faction leader might give you a goal but you can choose how to achieve it: bribe an enemy official versus publicly expose them. Your method could tilt that faction’s approach later (a violent solution vs a diplomatic one). In some cases, the player might even get the chance to influence leadership – for example, supporting a more moderate member of the faction to take over instead of the current radical leader, thereby changing the faction’s character (this could occur if the faction leader’s trust in you is high and you complete a special quest to sway their council).
	•	World Reactions: The rest of the world doesn’t sit idle while one faction rises. Other factions will react. If you help the cult-like faction gain power, the staunch realists or secular groups might start opposing you or prepare counter-moves (which could become quests on their side if you defect or if you later change course). The news (if there’s radio or rumor system) will spread word of faction victories or defeats. Neutral NPCs might change their behavior (merchants might raise prices if the faction controlling their area is unfriendly to you now, or vice versa).
	•	Faction Quest Rewards: Aside from story outcomes, completing faction quests yields tangible rewards. This could be unique equipment (a special weapon or armor emblazoned with the faction’s insignia), access to services (like being able to call for backup from that faction in combat, or use their safehouses), and of course, high reputation with that faction. Eventually, if you go deep enough, the faction might essentially treat you as one of their own or even offer you leadership. In some endings, the player can effectively lead a faction to rule the city, which is an ultimate “reward” in narrative terms.

Faction quests ensure that the game's political landscape is an integral part of the gameplay. By choosing which faction quests to pursue, the player is actively choosing winners and losers in the city, and they get to see the results of those choices play out in real time. This gives a strategic layer to questing: it's not just about experience points, but about sculpting the world's power structure.
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
<rule type="morality">
Karma System (Morality)

Parallel to faction reputation, the game tracks the player's overall karma or morality based on their actions. This Karma system influences the narrative tone and some game mechanics:
	•	What Affects Karma: Virtually any significant action that has moral weight will adjust karma. Examples: saving innocents, showing mercy, and helping without reward will increase karma (good). Acts like murder of non-hostiles, betrayal, extortion, and unnecessarily cruel decisions will decrease karma (evil). Minor actions typically won’t budge it (stealing a loaf of bread might be too minor, unless we have a lot of petty theft adding up). We ensure the player knows when an action is major enough to affect karma, usually through context or explicit feedback (“You feel a pang of guilt for what you’ve done…” or a UI icon).
	•	Karma Scale: Karma can be represented on a scale from very bad to very good. We may give ranks or titles at certain thresholds (for flavor). For example, below -100 karma = “Wicked”, -50 to -99 = “Ruthless”, 0 = “Neutral”, +50 = “Kindhearted”, +100 and above = “Saintly”. These titles could appear on the character sheet and NPCs might refer to the player with nicknames or rumors based on this (“People say there’s a devil roaming these streets…” vs “Some say an angel of mercy is out there helping those in need.”).
	•	Gameplay Effects of Karma:
	•	NPC Interactions: Some NPCs only deal with the player if they have a certain karma. A settlement of peaceful monks might refuse entry to a known killer (low karma), or a black-market arms dealer might not trust someone with too high of karma (thinking them a goody-two-shoes who might turn them in).
	•	Quest Availability: A few quests might only trigger at certain karma levels. For instance, a vigilante might approach a high-karma player with a request to help bring justice, whereas a crime boss might only offer a dirty job to someone with demonstrated ruthlessness.
	•	Companion Relationships: If companions are included, their approval might tie to karma. A morally upright companion could argue with or even leave a low-karma player over time. A pragmatic or evil companion might chafe if the player is too soft.
	•	World Reactions: Guards might be more suspicious of a notorious player (extra searches or harassing dialogue), whereas a beloved hero might get small perks like free lodging from grateful citizens.
	•	Self-Contained Perks: We might include a few perks or abilities tied to karma: e.g., high karma gives a small boost to influence friendly NPCs (“Inspiring Presence”), low karma might give intimidation bonuses (“Fearsome Reputation”). These would be subtle so as not to force a particular playstyle just for a mechanical benefit.
	•	Karma and Endings: As mentioned earlier, the karma level can influence the tone or even nature of the ending. High karma might lead to endings where even if the player fails to save the city, they are remembered fondly or someone continues their good work. Low karma might result in betrayal or an ending where the player’s empire collapses because it was built on fear. The exact interplay will be written to suit each ending scenario, but karma ensures the ending feels congruent with the player’s approach (like an epilogue line “Citizens rejoiced at the fall of the tyrants, and hailed the stranger who had helped them” vs “Citizens traded one tyrant for another, as the stranger ruled with the same cruelty they had fought against”).
	•	Player Agency with Karma: The game doesn’t label any path as the “wrong” way – karma is not a score to maximize unless the player chooses to role-play that way. We want both high and low (and neutral) karma playthroughs to be viable and interesting. The system’s goal is to provide feedback and consequences, not to punish the player for being “bad” or “good.” There will be pros and cons at both ends, encouraging the player to consider morality as part of their strategy and storytelling rather than just min-maxing for advantage.

In short, Karma adds a layer of personal morality to the game's feedback loop. While faction reputation deals with external alliances, karma reflects the kind of person the player character is in this world, and the game world responds in kind.
</rule>
</mechanic>

<mechanic name="reputation_system">
<rule type="faction_relations">
Reputation System

Reputation tracks the player's standing with specific factions (and possibly notable sub-groups or communities) and is distinct from karma:
	•	Faction Reputation Meters: Each major faction (and minor ones like guilds or towns) has a reputation value for the player. These can range from hostile to neutral to friendly to allied. The game UI will display these, often with a numeric value or a descriptive tier. For example: City Police: Hostile (25/100 toward Neutral), Warlords Gang: Allied (90/100 toward Maximum). This transparency helps players gauge their relations.
	•	Gaining & Losing Reputation:
	•	Completing quests for a faction increases rep with them (and often lowers with their enemies).
	•	Helping faction members in random events (saving a patrol, healing a wounded member) can give small boosts.
	•	Conversely, killing faction members, betraying them in quests, or aiding their rivals will lower reputation.
	•	Some actions have immediate rep effects even outside quests (if you attack a faction’s base unprovoked, you become hostile with them at once).
	•	There may be opportunities to restore rep after a fallout, like performing an appeasement task or paying tribute, if narratively appropriate.
	•	Reputation Benefits/Penalties:
	•	At Friendly/Allied rep: The faction’s NPCs won’t attack you (and will in fact greet or guard you). Prices at their shops drop, and they might give you gifts or access to better gear. You may gain permission to enter restricted areas like their armory or VIP sections. They could send backup if you are attacked in their territory. Ultimately, you might even be offered formal membership or leadership roles in the faction’s storyline if your rep is maxed.
	•	At Neutral rep: The faction treats you like any other wastelander. You can trade or talk in their territory, but you get no special treatment. You might have to pay bribes or show passes to get into certain areas. Quests are available if you ask, but they might not seek you out.
	•	At Unfriendly/Hostile rep: Unfriendly might mean they warn you to leave or dislike you (higher shop prices, rude dialogues). Hostile means they attack on sight and you cannot peacefully enter their turf. Hostile factions might also send out hit squads or assassins to target you during exploration as revenge for past deeds. Some factions (like creatures or raiders) start hostile by default to everyone.
	•	Inter-faction Diplomacy: If the player somehow balances between factions (e.g., stays neutral or mildly positive with multiple groups), they can act as a go-between or peacemaker in some cases. There could be quests where having decent rep with two groups lets you broker a deal instead of them fighting. This is a rewarding outcome for players who try to maintain neutrality and play all sides.
	•	On the flip side, being hated by everyone (low rep across the board due to very selfish play) makes the final parts of the game different – you might have no allies to call on, making some sequences harder but perhaps allowing a “lone wolf” notorious ending.
	•	Individual Reputation: Aside from factions, certain unique NPCs or merchants could track a personal reputation or relationship with the player. A lone weapons dealer might give better deals only after you complete a personal quest for him. A companion character might have loyalty which improves as you do their quests and make decisions they agree with. These are more like relationship values but work similarly to rep. We will include them on a limited basis for key characters.
	•	Feedback: As with karma, the game will give feedback on rep changes. Finishing a quest might show “+15 reputation with The Resistance” and perhaps “-10 with Corporate Security”. If you cross a threshold (like going from Neutral to Friendly), an NPC might reach out (an emissary says “Our leader wishes to thank you for your help…”) or you get a new dialogue (“You’ve proven yourself a friend to us. We welcome you in our camp.”). Similarly, hitting Hostile triggers a warning or immediate change in world behavior. The quest journal or a faction menu can remind players what their current standing allows (“Allied: You can request equipment drops from this faction” or “Hostile: Do not enter their main base unless prepared for a fight”).

The reputation system ensures that the player's actions have clear and varied impacts on their relationships in the world. It adds a strategic component: you might decide not to do a tempting quest for Faction A because you don't want to anger Faction B you've been working with. Or you might deliberately betray a faction at the end of their quest line for a big reward, knowing full well it'll make them enemies. It's all about choices and consequences, quantified in a way players can monitor and react to.
</rule>
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
Character Creation & Progression

Character Creation: At the start of the game, the player creates their protagonist. They may be able to customize:
	•	Appearance: (If visually represented) Choose gender, look, possibly a portrait or 3D model customization for face, hair, etc. Since it’s a top-down game, we might keep visuals simpler (like picking a sprite/portrait and outfit).
	•	Background: Select a background or origin story. Each background provides a slight perk and influences starting reputation or dialogue. For example: Ex-Cop might start with a slight reputation boost with security forces and a small firearms skill bonus; Street Urchin could start with higher stealth and contacts in the slums; Corporate Tech might have better hacking and an in with corporate factions. Backgrounds give flavor and a starting point but do not lock the player into a specific class or path.
	•	Attributes: Allocate points to primary attributes. A likely set could be Strength (melee damage & carry weight), Agility (AP and stealth), Endurance (health and resistances), Intelligence (skill points gain and hacking/tech ability), Perception (aim and critical chance, detecting traps), Charisma (influence and barter). The player has a limited pool to distribute, shaping their initial strengths and weaknesses. Attributes might influence derived stats (like Agility -> AP, Endurance -> fatigue threshold, etc.).
	•	Skills: The player might also allocate some skill points or choose a few “tag skills” that they are especially good at from the start. Skills correspond to the skill trees (like Small Guns, Energy Weapons, First Aid, Lockpicking, etc.). Tagging a skill could give an immediate boost and faster progression in that skill. Alternatively, instead of point allocation, we might have the player answer a few backstory questions or pick a template that sets starting skills to align with their background (similar to some Fallout games).

Progression System:
	•	Experience and Leveling: The player gains Experience Points (XP) from various activities: defeating enemies, completing quests (major XP), successful use of skills (maybe minor XP for picking a lock or hacking a computer), and discovering new locations. After accumulating enough XP, the player levels up. We’ll likely have a level cap or diminishing gains after a certain point to balance the game length. Level-ups are moments to improve the character.
	•	Skills and Perks: On leveling up, the player either gets skill points to distribute among their skills (raising their percentages or ranks), or they might directly get to pick a perk from a skill tree. We can combine both: e.g., each level gives a few skill points and every few levels you pick a special perk. Skills might be ranked from 0 to 100 or 0 to 10; each point invested increases effectiveness. High skill levels unlock new actions (e.g., at Hacking 50 you can hack advanced locks, at 80 you can hack security robots). Perks are more unique bonuses or abilities you choose, such as “Thief: +20% success chance on stealing and lockpicking” or “Medic: using a medkit heals 15% more”.
	•	Skill Trees: If we take a tree approach, skills are grouped by category, and advanced skills or perks have prerequisites. For instance:
	•	Combat Tree: Might have branches for Guns, Melee, Explosives. Early skills might be basic proficiency (+damage or accuracy), mid-tier might unlock abilities (like a double-tap shot or a power attack), high-tier might be very powerful passives or moves (like an aimed shot that costs no AP once per fight).
	•	Tech Tree: Branches for Hacking, Engineering, Science. Could unlock crafting recipes, the ability to hack turrets to your side, building your own robotic companion at high level, etc.
	•	Survival Tree: Branches for Medicine, Stealth, Scavenging. Improves healing, adds stealth kills or silent movement, increases loot quantity/quality, ability to find rare resources or navigate hazardous zones safely.
	•	Social Tree: Branches for Persuasion, Intimidation, Barter. Unlocks better prices, more dialogue options, maybe the ability to recruit followers or call for truce in combat through dialogue.
	•	Capstones: Each tree might have a capstone perk that is a defining ability. For example, a combat capstone might be “Gun Fu: AP cost for the first shot each turn is 0,” tech capstone “Master Engineer: you can craft advanced energy weapons,” survival capstone “Iron Stomach: no negative effects from bad food and resistance to toxins,” social capstone “Kingpin: you can have one faction become loyal to you no matter previous reputation once per game.” Capstones encourage specializing, but a player can only get one or two in a single playthrough realistically.
	•	Balance of Builds: We want multiple viable builds. A player who invests in combat will find fights easier and can go head-on. A stealthy/tech player might avoid many fights but have other ways around obstacles (hacking a door instead of fighting guards). A charismatic player could navigate factions diplomatically, accessing content a warlike character might miss. We ensure key challenges have multiple solutions (for instance, a final mission can be done with brute force or by rallying allies or by stealth infiltration, depending on character strengths).
	•	Companions’ Progression: If the game allows companion characters, they will also improve over time, either automatically or through a simpler leveling system. The player might not micromanage their every skill, but could choose a focus (tell a companion to get better at sniping vs melee, for example). Some companions might have their own mini skill trees or perk choices when they level up, often reflecting their personality or story (a companion who is an ex-medic could gain an upgraded healing ability after completing their personal quest, etc.).
	•	Late Game Progression: As players approach the endgame, they should feel significantly more powerful than at start, but not invincible. Enemies scale in difficulty to some extent (later areas have tougher foes), though not necessarily level-scaling every foe – rather, the world has high-level dangers you learn to handle. The progression should allow players to specialize deeply or diversify, but there’s a trade-off: a specialist is superb in their field (like unbeatable in small arms combat) but weak in others (poor at hacking or speech), whereas a generalist can handle many situations but isn’t the absolute best at any, which is also viable.

The goal is that character progression feels rewarding and lets the player define their approach to the game. Every level is a chance to refine your character concept, unlock new abilities that change how you play, and react to the challenges you've been facing (e.g., "I need more hacking to get past those security doors, better level that up next time").
</mechanic>

<mechanic name="equipment_inventory">
<balance_values system="equipment">
Equipment & Inventory Management

Loot and gear are central to progression and survival, so managing equipment is a key gameplay element:
	•	Inventory System: The player’s inventory has a capacity limit, likely governed by weight (or a simplified slot system). We will show an encumbrance meter or total weight vs. carry capacity. Items are categorized (weapons, armor, ammo, consumables, materials, quest items) for easy sorting. The interface might be a grid or list; for a PC/browser game, a list with icons and weight values is clear. The player can typically carry a few weapons, a set of armor, some outfit pieces, and a moderate amount of supplies before getting encumbered. Backpacks or gear can increase capacity, or the player can invest in the Strength attribute or a “Pack Rat” perk to carry more.
	•	Weapons: There is a variety of weapons reflecting the dystopian setting. Categories include:
	•	Melee: knives, bats, crowbars, swords, electrified prods – quiet and no ammo needed, but puts you in harm’s way.
	•	Pistols & SMGs: sidearms with quick draw times, short range, use light ammo.
	•	Shotguns: high close-range damage, spread can hit multiple targets, slower to reload.
	•	Rifles: includes assault rifles and sniper rifles – good range and damage, but often higher AP cost to shoot.
	•	Heavy Weapons: like machine guns, rocket launchers, flamethrowers – high damage and area effect, often rare and heavy, with scarce ammo.
	•	Energy Weapons: if setting permits (laser rifles, plasma guns) – require technical skill to use effectively, can have special effects (like melting armor).
	•	Thrown/Explosives: grenades, Molotovs, knives, mines – one-time use items that cause AoE or status effects.
	•	Each weapon has stats: damage, accuracy, critical chance, range, ammo type, magazine size, AP cost, and any special properties (armor penetration, chance to stun, noise level if stealth matters). The player will find or buy better weapons as they progress, or modify existing ones (see Crafting & Upgrades). Weapon choice can complement a build (snipers for stealth builds, big guns for strength builds, etc.).
	•	Armor & Clothing: Protects the player and possibly gives bonuses:
	•	Armor might cover body parts or be a single suit. A simple system might have just an outfit slot and maybe a helmet slot. A complex one might allow mixing (helmet, torso, legs, etc.).
	•	Light armor (leather jacket, vest) offers modest protection but allows high mobility (no penalty to stealth or AP).
	•	Heavy armor (riot gear, combat armor) greatly reduces incoming damage but might reduce agility, increase noise, and be rarer.
	•	Special gear (hazmat suit for radiation, stealth suit that gives camo bonus, faction uniforms for disguise) exist for specific purposes.
	•	Armor has durability that can degrade under fire, requiring repair. It might also have a stat for how much it slows the character if heavy.
	•	Gadgets & Tools: Inventory also includes usable devices like:
	•	Lockpicks/keycards for doors.
	•	Hacking modules for electronic locks or computer terminals.
	•	Binoculars or scopes for scouting.
	•	First aid kits, bandages for healing injuries.
	•	Stimulants or drugs that boost stats temporarily (with potential side effects).
	•	These often don’t take space like big items but are consumed on use or have limited uses.
	•	Consumables:
	•	Health items: medkits (heals a chunk of HP), painkillers (reduce pain/injury penalties), adrenaline (boost AP briefly).
	•	Food & water: needed for survival, also can heal small amounts or provide buffs (e.g., a full meal might slowly regen health for a while).
	•	Batteries/Fuel: to power certain gear or vehicles.
	•	Ammo: various calibers for guns, arrows/bolts if we have crossbows, etc. Ammo has weight, so hoarding too much can encumber you. Part of strategy is managing ammo supply.
	•	Crafting Materials: Scrap metal, electronic parts, chemicals, fabric, etc. used in crafting. We might mark these as non-weight or separate if too burdensome, or give them small weights so players consider whether to collect junk. Alternatively, allow infinite weight for crafting materials but require visiting crafting stations to use them, to simplify inventory tetris.
	•	Trading and Economy:
	•	The game uses a currency (perhaps old world money or a barter system, depending on lore). Vendors are located in safe zones or wandering traders.
	•	Each vendor has limited inventory that refreshes periodically. They have buying prices (usually lower than selling) and selling prices.
	•	Barter skill or charisma can improve prices. With high skill, the player might get 20% more for items sold and pay 20% less for purchases, for example.
	•	Some items are contraband and only available on black markets (e.g., energy weapons or military gear might only be sold by secretive traders, requiring certain quests or rep to access).
	•	The player can sell almost anything, but broken items sell for less or not at all until repaired.
	•	Shops might have more money in wealthy districts and almost none in poor areas, affecting how much loot you can liquidate easily.
	•	Inventory Management Gameplay: We want players to make choices about what to carry. For example, if you plan a stealth mission, maybe bring silenced weapons and leave the rocket launcher at home. On a long trip, dedicate space to extra ammo, food, and medical supplies, which means you might leave some alternate weapons behind. The vehicle trunk or stash storage in a safehouse can hold overflow, so inventory management is about prepping for the next outing and then dealing with what you pick up.
	•	User-Friendly Features: Quick-swap for weapons (hotkeys to switch between primary, secondary, melee maybe). A “use item” menu for healing or buff items during combat (costing AP). The ability to sort by weight/value to drop junk quickly if overloaded. Possibly a junk flag to mark items you only intend to sell, so you can sell all junk in one click at vendors.
	•	Loot Generation: Enemies drop items appropriate to them (their weapons, a bit of ammo, maybe some random loot like dog tags or faction insignia). Stashes and containers have loot seeded by location (a med cabinet has meds, an armory has ammo, etc.). Rare unique items are placed in key locations or given as quest rewards rather than random chance, so completionists can aim for them.

All these systems make inventory and equipment a game within the game – optimizing your loadout, seeking out better gear, and ensuring you have what you need when far from safety is crucial. It adds realism (scarcity of resources in a dystopia) and gives a constant sense of progression as you amass better tools to survive.
</balance_values>
</mechanic>

<mechanic name="crafting_upgrades">
Crafting & Upgrades

Crafting allows players to create or improve items using resources gathered, adding a layer of strategy and self-sufficiency:
	•	Resource Gathering: As the player explores, they find raw materials. This could be explicit scavenging (clicking a scrap pile to get scrap metal) or as loot from containers/enemies (electronics from a destroyed robot, herbs from a garden, chemicals in an abandoned lab). We might categorize resources in broad types to keep it simple (e.g., “Metal Parts”, “Electronic Components”, “Chemicals”, “Textiles”, etc.). Higher crafting skills might allow extracting more components from the same source (a perk could be “Scrapper: get 50% more materials from looting machinery”).
	•	Crafting Stations vs Field Crafting: Some basic crafting (like making a bandage from cloth) could be done anytime from the inventory menu. More advanced recipes might require being at a workbench, chemistry station, or garage. Safehouses and certain friendly locations would have these stations. We might allow a portable toolkit item that lets you craft certain things in the field with a penalty or slower speed.
	•	Crafting Recipes: Players start with a set of simple recipes (like how to cook raw meat to not get sick, or crafting a lockpick from scrap metal). Additional recipes are learned through: leveling up crafting-related skills, reading in-game manuals (loot or buy a “Mechanics Monthly” magazine to learn a couple of new weapon mods), or being taught by NPCs (“I can show you how to mix a potent explosive”). We could also allow experimentation: if a player tries a reasonable combination of items, the game might allow discovery of a recipe (“You’ve combined chemical A and B… you discovered how to make a basic grenade”). However, to keep it user-friendly, most recipes will be explicitly given rather than pure trial-and-error.
	•	Categories of Craftable Items:
	•	Ammunition: e.g., craft arrows, bullets (using casings + powder + scrap metal for bullets, energy cells from batteries, etc.). This will be important if shops are few or to make special ammo types (incendiary rounds, EMP grenades).
	•	Medical Supplies: craft bandages from cloth, herbal remedies from plants, stimulants or antidotes by combining chemicals. Possibly craft a drug to temporarily boost combat ability at cost of later fatigue.
	•	Food & Drink: cook raw meat (prevent disease), purify water via filters or boiling, brew coffee for fatigue reduction, etc. Survival skills improve yield (like getting more portions out of ingredients).
	•	Weapon Upgrades/Mods: build a scope for a rifle (needs glass and metal), a suppressor (needs engineering skill and metal), extended magazine, or even jerry-rig a basic firearm. Maybe convert one weapon type to another (sawn-off shotgun from a shotgun, etc.).
	•	Explosives & Tools: make grenades, molotovs (bottle + alcohol + cloth), mines (using some electronics + explosive), EMP devices (electronics + rare components), lockpicks, hacking spikes (disposable tools to hack easier).
	•	Armor & Gear: reinforce armor (sew kevlar into a jacket if you have kevlar plates), craft makeshift armor from scrap (not very effective but better than nothing), upgrade a backpack for more capacity, or craft utility items like a climbing rope/grappling hook.
	•	Vehicle Mods: at a garage, use scrap and parts to upgrade vehicles (armor plating, better engine parts, spiked bumpers as mentioned). Also craft repair kits or refuel using combined chemicals if gasoline is scarce (like making biofuel).
	•	Upgrade Mechanics: Upgrading typically means taking an existing weapon/armor and improving it. We might have a quality level system (e.g., Pistol I, II, III or Common/Uncommon/Rare quality). The player can bring materials to improve a pistol’s damage or reduce its AP cost via tuning. Each upgrade requires increasingly advanced parts or skills. This system gives a way to keep a favorite weapon viable longer rather than discarding it when new ones drop. However, there will be limits (a basic revolver won’t ever outdo a top-tier plasma gun, but you can make that revolver pretty decent if you sink resources into it).
	•	Crafting Skill Influence: The character’s crafting-related skills (like Engineering, Chemistry, etc.) could impose limits or affect success:
	•	Some recipes require a certain skill level to even appear or be used.
	•	Perhaps a chance of failure for complex crafts if skill is just at the threshold (fail could waste some materials).
	•	Higher skill might let you craft faster or yield more output (e.g., make 10 bullets instead of 5 per batch).
	•	Economy and Crafting: Crafting gives an alternate economy. If merchants don’t sell what you need, you can craft it. It also provides a money-making avenue: craft items from cheap components and sell the product at profit (we have to watch that for balance). Possibly some high-tier gear can only be crafted, not bought, giving crafters a unique edge.
	•	User Interface: A crafting menu lists known recipes, highlighting which ones you have materials for. Selecting a recipe shows required ingredients and outputs. The player confirms to craft, time passes (maybe a few in-game minutes to hours depending on complexity). Some items might be crafted near-instantly (bandage a wound), others could take in-game time (manufacturing ammo might take an hour). We decide if the time factor is needed or if it’s simplified.
	•	Encouraging Crafting: To encourage engagement, we’ll integrate crafting into some quests (like NPC asks for a crafted item, or you need to craft a makeshift bomb to open a sealed door if you didn’t bring one). Additionally, crafted gear could have slight advantages (a crafted medkit might heal a bit more than a found one, because you tailored it to your needs, etc.). This makes the system rewarding rather than optional fluff.

Crafting and upgrades serve players who enjoy planning and optimization. It fits the survival theme (make do with what you find) and adds another layer of progression (improving equipment, not just stats). It's entirely possible to play with minimal crafting (buying what you need or using found items), but those who invest in it will find themselves better equipped and possibly saving resources by recycling and creating what they need.
</mechanic>

<mechanic name="survival_mechanics">
<balance_values system="survival">
Survival Mechanics

Survival elements ensure the player must manage more than just enemies – the environment and basic needs are challenges too, enhancing immersion and difficulty:
	•	Hunger (Food): The player character needs to eat periodically to maintain peak performance. We’ll have a hunger meter or a simple counter that increases over time. For example, a character might need to eat two meals per day. If the player goes too long without food, they incur penalties: lowered strength (representing weakness), slower health regeneration if any, and eventually health loss if starving. Eating food reduces hunger and can even give small buffs (a well-fed bonus like slightly faster healing or a boost to morale that could tie into stamina). Different foods fill different amounts and have trade-offs: canned food is heavy but non-perishable; fresh food is lighter and more nutritious but can spoil after a day or two if not used (spoilage could be simulated simply by a timer or left out for realism). The player can hunt animals in the outskirts or scavenge for food in houses (old world packaged foods, etc.), and purchase in settlements. High survival skill might help identify edible wild plants or get more meat from animals.
	•	Thirst (Water): If included, thirst would work similarly: need water at least once a day, more often if doing strenuous activities or in hot zones. Water sources in the city might be contaminated, requiring purification (boiling, tablets). If thirst is too micromanage-y, we might fold it into hunger (like assume meals include water) or make it a less frequent concern.
	•	Fatigue (Sleep): The character needs rest. We track fatigue or exhaustion as a meter that fills as the player remains active (especially after combat, long travel, carrying heavy loads). If fatigue goes high, the character’s effectiveness drops: aim gets shaky, maximum AP might reduce (hard to concentrate when very tired), and maybe dialogues reflect the character’s exhaustion. To reduce fatigue, the player must sleep. They can sleep in safe beds (at safehouses, camps) for full recovery, or do shorter rests (like 1-hour naps) for partial recovery if a safe spot is available. Sleeping advances time, which could mean missing some timed events or encountering night/day as a result. If the player tries to push without sleep, at extreme fatigue levels we could induce hallucinations or random fainting (though that might frustrate, so a gentler cap is better: e.g., after 24 hours no sleep, you’re at maximum fatigue penalty but still playable).
	•	Injuries & Medical Treatment: Beyond the HP bar, specific injuries can occur. For instance, taking a lot of damage from a fall could break a leg (movement penalty until treated), or certain enemies might inflict bleeding (lose HP over time until bandaged) or poison (requires antidote). These conditions require medical supplies or a doctor NPC to cure. We might implement a simple system: normal healing items cure HP but not severe injuries, which need a “doctor’s bag” or hospital visit. Survival/medical skill helps self-treat injuries in the field (like craft a splint).
	•	Radiation & Toxins: In a dystopian city, there could be irradiated zones or chemical spills. Exposure might raise a radiation meter which, if high, reduces max health or causes sickness until cured with anti-rad medicine. Similarly, toxic gas in some areas might require a gas mask; without it, you take damage or stat debuffs. This encourages carrying the right gear when exploring unknown areas.
	•	Weather/Environmental Hazards: Dynamic weather like acid rain could harm the player if caught outside (slowly reducing health or armor condition) unless they find cover or wear protective clothing. Extremely hot conditions (maybe in industrial fires) or cold (if any climate variation) could accelerate hunger/thirst or fatigue. While the city is mostly temperate, if there’s an outskirts desert or a flooded zone, each might have unique survival considerations (dehydration risk in desert, need a boat or risk drowning in flooded zones).
	•	Disease: Possibly, the player can catch illnesses from contaminated food, water, or enemy attacks (mutant rats might give disease). These could impose stat penalties that persist until cured. Antibiotics or rest could cure diseases. This adds another reason to keep your supplies and base clean, and maybe to do quests that improve living conditions (a quest could be to fix a water purifier for a settlement – helping them and giving you a safe water source).
	•	Stress/Mental State: We might not simulate mental health deeply, but one could imagine a morale system (especially if managing a crew). For now, likely out of scope, or represented by karma (guilt vs pride) indirectly.
	•	User Interface & Feedback: Survival meters (if used) will be visible but not overly intrusive. Perhaps small icons: a fork/knife for hunger, a water drop for thirst, a zzz for fatigue, changing color as they get dire. Tooltips or status screen show exact values and effects. When hungry or tired, the game might occasionally prompt in text (“Your stomach rumbles” or “You feel very tired.”).
	•	Difficulty Tuning: We might allow players to adjust how demanding the survival elements are. On an easier setting, hunger/thirst could be very slow to matter, and fatigue less punishing. On hardcore mode, you might need to eat every few hours, and starvation can kill you quickly. This customization ensures players who want the full survival experience get it, and those who want to focus on story can tone it down.
	•	Integration with Other Systems: The survival needs tie into the economy (need to buy or find food/water), exploration (seek safe places to rest, find water sources), and faction interactions (maybe only certain factions have access to clean water or safe camps, giving incentive to befriend them). It also adds weight to vehicle travel; in a car, you can carry more supplies and potentially have a place to rest (sleeping in the car might be possible, albeit less effective than a bed).

Survival mechanics add realism and tension. They ensure that even without enemies around, the player is planning and managing resources. It turns the game partially into a survival RPG without overwhelming the core tactical/quest gameplay, as long as we balance it to be engaging rather than tedious. The constant need to eat, drink, and rest in a dangerous city can create memorable emergent moments (e.g., desperately searching for food while injured and only encountering threats). It makes the dystopian world more than a backdrop – it's something to endure and overcome.
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
	•	Resolution and Graphics: We should support different screen sizes since browser windows vary. Likely we design for a 16:9 aspect ratio at 1280x720 or 1920x1080 and ensure UI scales or anchors to be usable at other aspect ratios (like 4:3 or ultrawide, or on a tablet). Using CSS or engine scaling, we can handle resizing. Pixel art assets might be scaled 2x or 3x to look good at various resolutions (assuming we go with a pixel art style for the retro/dystopian vibe, which also is performance-friendly). Alternatively, vector or high-res painted style could be used, but pixel art aligns well with the Fallout/HoMM inspiration.
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
	•	Continuous Optimization: As we add features, we will regularly test performance to catch issues early. For example, when adding the dynamic NPC schedules, test with dozens of NPCs active. When adding vehicles, test driving fast across sectors to see if loading keeps up.

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
