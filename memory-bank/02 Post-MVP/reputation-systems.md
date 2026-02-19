# Post-MVP: Reputation / Witness / Trust-Fear Systems

Moved out of memory-bank/01 MVP/Game Design.md to keep the MVP doc focused.

<mechanic name="trust_fear_ethics">
Trust/Fear Ethics Layer (MVP - Step 29.2)

<implementation_status>❌ DEFERRED FOR MVP - Trust/Fear ethics are disabled alongside reputation/witness systems; resume Post-MVP.</implementation_status>

Moral perception in The Getaway leans into survival pragmatism rather than binary good/evil. Each faction and neighborhood cell maintains a lightweight `EthicsProfile` with two axes:
	•	**Trust (-100..100)** — Measures whether locals believe the player will protect their interests. Positive trust unlocks safer routes, better prices, and candid intel.
	•	**Fear (0..100)** — Captures how dangerous or volatile the player appears. Elevated fear intimidates holdouts, deters harassment, and increases checkpoint scrutiny.

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
	•	Trust decays slowly toward neutral when the player ignores a faction or cell (−2 per in-game day). Fear evaporates faster (−5 per day) unless reinforced.
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

<implementation_status>❌ DEFERRED FOR MVP - Localized reputation/gossip propagation is disabled; resume Post-MVP.</implementation_status>

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

<implementation_status>❌ DEFERRED FOR MVP - Witness memory & regional heat are disabled; resume Post-MVP.</implementation_status>

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
