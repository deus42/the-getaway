# Post-MVP: Equipment & Inventory (full system)

Moved out of memory-bank/01 MVP/Game Design.md to keep the MVP doc focused.

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
