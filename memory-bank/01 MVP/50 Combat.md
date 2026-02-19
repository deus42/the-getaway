---
status: MVP
type: combat
---

# Combat

<mechanic name="combat_overview">
Combat Overview (MVP scope)

<implementation_status>✅ MVP scope. Combat exists in the MVP, but it should primarily appear as escalation from detection or as a scripted quest beat. The full combat expansion spec is in `memory-bank/02 Post-MVP/combat-advanced.md`.</implementation_status>

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
	•	(Post-MVP) Vehicle-on-grid rules are deferred (see `memory-bank/02 Post-MVP/vehicles.md`).
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

<mechanic name="autobattle_mode">
AutoBattle (MVP optional)

<implementation_status>⚠️ MVP optional convenience. Full behaviour profiles + planner spec live in `memory-bank/02 Post-MVP/combat-advanced.md`.</implementation_status>

MVP intent:
	•	Expose a simple toggle to let players auto-resolve easy fights.
	•	Never let automation burn story beats (pause on dialogue prompts / end-of-combat / etc.).
</mechanic>

## Deferred combat expansions

<mechanic name="cover_line_of_sight">
Cover Line Of Sight (Post-MVP)

<implementation_status>❌ DEFERRED FOR MVP - see memory-bank/02 Post-MVP/combat-advanced.md.</implementation_status>
</mechanic>

<mechanic name="special_abilities">
Special Abilities (Post-MVP)

<implementation_status>❌ DEFERRED FOR MVP - see memory-bank/02 Post-MVP/combat-advanced.md.</implementation_status>
</mechanic>

<mechanic name="vehicles_in_combat">
Vehicles In Combat (Post-MVP)

<implementation_status>❌ DEFERRED FOR MVP - see memory-bank/02 Post-MVP/vehicles.md.</implementation_status>
</mechanic>
