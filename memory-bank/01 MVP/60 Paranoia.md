---
status: MVP
type: mechanic
tags: [paranoia]
---

# Paranoia

<mechanic name="stamina_system">
<balance_values system="stamina">
Pressure & Recovery (MVP)

<implementation_status>⚠️ PARTIAL - MVP uses Paranoia as the primary pressure resource; full stamina spec moved to memory-bank/02 Post-MVP/stamina-system.md.</implementation_status>

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
