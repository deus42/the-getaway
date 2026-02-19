# Post-MVP: Weapon Modifications

Moved out of memory-bank/01 MVP/Game Design.md to keep the MVP doc focused.

<mechanic name="weapon_mods">
Weapon Modifications (Post-MVP)

<implementation_status>❌ DEFERRED FOR MVP - Weapon mod meta is out of the vertical-slice scope.</implementation_status>

- WHAT: Attach modular upgrades to firearms (slots: Barrel, Magazine, Optics) to tune accuracy, damage, magazine size, and stealth/armor-pierce behaviours. Mods are inventory items that can be attached/detached freely.
- Allowed slots/types: Pistols/SMGs/Rifles share barrel/magazine/optics slots; shotguns/rifles accept long/armor-piercing barrels; melee has no slots. Weapon definitions declare `weaponType` and slot availability.
- Recipes (Workbench-only, Engineering-gated):
  - Reflex Sight (Optics, Eng 15): +10% accuracy. Cost: 2 Electronic Parts, 1 Metal Scrap.
  - Extended Magazine (Magazine, Eng 20): +50% magazine capacity. Cost: 3 Metal Scrap, 1 Electronic Parts.
  - Suppressor (Barrel, Eng 25): Silenced shots, -5% damage. Cost: 4 Metal Scrap, 1 Textile Fiber.
  - Long Barrel (Barrel, Eng 15, rifles/shotguns only): +15% damage, -5% accuracy. Cost: 3 Metal Scrap.
  - Laser Sight (Optics, Eng 30): +15% accuracy, +5% crit. Cost: 3 Electronic Parts.
  - Armor-Piercing Barrel (Barrel, Eng 35, rifles/shotguns only): Ignore 50% armor. Cost: 5 Metal Scrap, 2 Chemical Compound.
- Where: Craftable only when near a workbench; Workbench availability gates the weapon-mod crafting tab. Locations: Resistance safehouse workbench (free), scavenger market bench (fee applies when Scavenger standing < Friendly), industrial workshop (free, in dangerous zone). Craft time tracked in content; UI blocks craft when requirements fail.
- Behaviour: Mods update combat stats immediately (hit chance, damage multipliers, crit bonus, armor-pierce factor, silenced noise). Detaching returns the mod to inventory; compatibility warnings prevent slot/type mismatches.
- UX: Inventory “Modify” flow supports right-click entry + drag-and-drop into slots, shows per-slot choices with stat previews and compatibility warnings; crafting overlay lists recipes/resources/skill gates and only enables Craft when both Engineering and materials meet requirements and a workbench is present (fee surfaced when applicable).
</mechanic>
