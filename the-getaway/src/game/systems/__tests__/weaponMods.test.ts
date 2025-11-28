import { aggregateWeaponModEffects, validateWeaponModCompatibility } from '../weaponMods';
import { Weapon } from '../../interfaces/types';

const baseWeapon: Weapon = {
  id: 'weapon-1',
  name: 'Test Rifle',
  description: 'A modular rifle for testing.',
  weight: 5,
  value: 100,
  isQuestItem: false,
  slot: 'weapon',
  damage: 20,
  range: 8,
  apCost: 3,
  skillType: 'smallGuns',
  weaponType: 'rifle',
  modSlots: ['barrel', 'magazine', 'optics'],
};

describe('weaponMods system', () => {
  it('aggregates multiple mod effects with bonuses and penalties applied', () => {
    const effects = aggregateWeaponModEffects({
      ...baseWeapon,
      attachedMods: [
        { slot: 'barrel', modId: 'weapon_mod_long_barrel' },
        { slot: 'magazine', modId: 'weapon_mod_extended_magazine' },
        { slot: 'optics', modId: 'weapon_mod_laser_sight' },
      ],
    });

    expect(effects.damageMultiplier).toBeCloseTo(1.15);
    // Laser sight (+0.15) minus long barrel penalty (-0.05) = +0.10
    expect(effects.hitChanceBonus).toBeCloseTo(0.1);
    expect(effects.critChanceBonus).toBe(5);
    expect(effects.magazineSizeMultiplier).toBeCloseTo(1.5);
    expect(effects.silenced).toBe(false);
    expect(effects.armorPiercingFactor).toBeUndefined();
  });

  it('supports armor-piercing and silencer flags via attachments override', () => {
    const effects = aggregateWeaponModEffects(baseWeapon, [
      { slot: 'barrel', modId: 'weapon_mod_suppressor' },
      { slot: 'barrel', modId: 'weapon_mod_armor_piercing_barrel' },
    ]);

    expect(effects.silenced).toBe(true);
    expect(effects.damageMultiplier).toBeCloseTo(0.95);
    expect(effects.armorPiercingFactor).toBeCloseTo(0.5);
  });

  it('rejects missing weapons and missing slots during compatibility validation', () => {
    expect(
      validateWeaponModCompatibility(undefined, 'weapon_mod_reflex_sight', 'optics').compatible
    ).toBe(false);

    const weaponWithoutOptics: Weapon = { ...baseWeapon, modSlots: ['barrel'] };
    const result = validateWeaponModCompatibility(
      weaponWithoutOptics,
      'weapon_mod_reflex_sight',
      'optics'
    );
    expect(result.compatible).toBe(false);
    expect(result.reason).toMatch(/no matching slot/i);
  });

  it('rejects slot mismatches and incompatible weapon types', () => {
    const slotMismatch = validateWeaponModCompatibility(
      baseWeapon,
      'weapon_mod_extended_magazine',
      'optics'
    );
    expect(slotMismatch.compatible).toBe(false);
    expect(slotMismatch.reason).toMatch(/slot mismatch/i);

    const pistol: Weapon = { ...baseWeapon, weaponType: 'pistol' };
    const typeMismatch = validateWeaponModCompatibility(
      pistol,
      'weapon_mod_long_barrel',
      'barrel'
    );
    expect(typeMismatch.compatible).toBe(false);
    expect(typeMismatch.reason).toMatch(/not compatible/i);
  });

  it('accepts compatible mods for matching weapon types and slots', () => {
    const result = validateWeaponModCompatibility(
      baseWeapon,
      'weapon_mod_long_barrel',
      'barrel'
    );
    expect(result.compatible).toBe(true);
    expect(result.reason).toBeUndefined();
  });
});
