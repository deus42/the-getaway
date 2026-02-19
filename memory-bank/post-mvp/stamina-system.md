# Post-MVP: Stamina System (Original Spec)

Moved out of memory-bank/game-design.md to keep the MVP doc focused.


<mechanic name="stamina_system">
<balance_values system="stamina">
<implementation_status>⚠️ PARTIAL - MVP in Step 24.5, Advanced features in Step 26.4</implementation_status>

Stamina - Sustained Effort Resource

Stamina is a third core resource (alongside Health and AP) that represents physical exertion outside of moment-to-moment combat. Where AP governs tactical turns, stamina measures how long the player can sprint, climb, and hustle through hostile zones before needing a break.

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
	•	Extended sprints or forced entries push the player toward exhaustion before firefights begin
	•	Rest stops become strategic choices—risks of ambush vs benefits of restored stamina
	•	High Endurance builds excel at long infiltration runs; low Endurance builds must plan shorter bursts and lean on equipment
	•	Consumables and perks that mitigate fatigue are valuable for marathon operations or curfew runs

**Advanced Stamina Features (POST-MVP - Step 26.4):**
These extend stamina into survival and environmental storytelling without reintroducing combat bookkeeping:

	•	Day/Night Modifiers:
		○	Day (6AM-10PM): Baseline costs and regen
		○	Night (10PM-6AM): +25% stamina costs, -1 passive regen (stress, low visibility)
		○	Curfew Patrols: Entering high-threat zones applies an additional -3 stamina per overworld tick from adrenaline dump

	•	Circadian Fatigue:
		○	Track hours awake; after 8 hours, max stamina drops 10% per additional hour
		○	Safehouse sleep resets fatigue; stimulants delay penalties but cause a heavier crash later
		○	Pulling an all-nighter (16+ hours) locks the player into Exhausted state until a full rest

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
