import playerReducer, {
  initialPlayerState,
  attachWeaponMod,
  detachWeaponMod,
  craftWeaponMod,
} from '../playerSlice';
import { createWeapon } from '../../game/inventory/inventorySystem';
import { instantiateItem } from '../../content/items';
import { Weapon } from '../../game/interfaces/types';

const cloneState = () => JSON.parse(JSON.stringify(initialPlayerState));

describe('playerSlice weapon mod actions', () => {
  it('attaches and detaches weapon mods across inventory items', () => {
    const state = cloneState();
    const weapon = createWeapon('Test Rifle', 12, 6, 3, 3, undefined, 'smallGuns', {
      weaponType: 'rifle',
      modSlots: ['barrel', 'magazine', 'optics'],
    });
    const modItem = instantiateItem('weapon_mod_reflex_sight');
    state.data.inventory.items.push(weapon, modItem);

    const attached = playerReducer(
      state,
      attachWeaponMod({ weaponId: weapon.id, modItemId: modItem.id })
    );
    const updatedWeapon = attached.data.inventory.items.find(
      (item) => item.id === weapon.id
    ) as Weapon;

    expect(updatedWeapon.attachedMods).toEqual([
      { slot: 'optics', modId: 'weapon_mod_reflex_sight' },
    ]);
    expect(attached.data.inventory.items.some((item) => item.id === modItem.id)).toBe(false);

    const detached = playerReducer(
      attached,
      detachWeaponMod({ weaponId: weapon.id, slot: 'optics' })
    );
    const weaponAfterDetach = detached.data.inventory.items.find(
      (item) => item.id === weapon.id
    ) as Weapon;

    expect(weaponAfterDetach.attachedMods ?? []).toHaveLength(0);
    expect(
      detached.data.inventory.items.find(
        (item) => (item as Weapon).weaponModId === 'weapon_mod_reflex_sight'
      )
    ).toBeTruthy();
  });

  it('blocks incompatible weapon types from attaching mods', () => {
    const state = cloneState();
    const pistol = createWeapon('Sidearm', 8, 4, 2, 2, undefined, 'smallGuns', {
      weaponType: 'pistol',
      modSlots: ['barrel', 'magazine', 'optics'],
    });
    const longBarrel = instantiateItem('weapon_mod_long_barrel');
    state.data.inventory.items.push(pistol, longBarrel);

    const result = playerReducer(
      state,
      attachWeaponMod({ weaponId: pistol.id, modItemId: longBarrel.id })
    );
    const pistolAfter = result.data.inventory.items.find((item) => item.id === pistol.id) as Weapon;

    expect(pistolAfter.attachedMods).toBeUndefined();
    expect(result.data.inventory.items.some((item) => item.id === longBarrel.id)).toBe(true);
  });

  it('crafts weapon mods when requirements and workbench are satisfied', () => {
    const state = cloneState();
    state.data.skillTraining.engineering = 40;
    state.data.credits = 200;
    state.data.inventory.items.push(
      instantiateItem('resource_metal_scrap', { quantity: 5 }),
      instantiateItem('resource_chemical_compound', { quantity: 2 })
    );

    const crafted = playerReducer(
      state,
      craftWeaponMod({
        modId: 'weapon_mod_armor_piercing_barrel',
        atWorkbench: true,
        feePaid: 50,
      })
    );

    expect(
      crafted.data.inventory.items.some(
        (item) => (item as Weapon).weaponModId === 'weapon_mod_armor_piercing_barrel'
      )
    ).toBe(true);
    expect(crafted.data.credits).toBe(150);
    expect(
      crafted.data.inventory.items.some((item) => item.definitionId === 'resource_metal_scrap')
    ).toBe(false);
    expect(
      crafted.data.inventory.items.some((item) => item.definitionId === 'resource_chemical_compound')
    ).toBe(false);
  });

  it('refuses to craft when away from a workbench', () => {
    const state = cloneState();
    state.data.skillTraining.engineering = 25;
    state.data.inventory.items.push(
      instantiateItem('resource_metal_scrap', { quantity: 3 }),
      instantiateItem('resource_textile_fiber', { quantity: 1 })
    );

    const result = playerReducer(
      state,
      craftWeaponMod({
        modId: 'weapon_mod_suppressor',
        atWorkbench: false,
      })
    );

    expect(
      result.data.inventory.items.some(
        (item) => (item as Weapon).weaponModId === 'weapon_mod_suppressor'
      )
    ).toBe(false);
    expect(
      result.data.inventory.items.find((item) => item.definitionId === 'resource_metal_scrap')
    ).toBeTruthy();
    expect(
      result.data.inventory.items.find((item) => item.definitionId === 'resource_textile_fiber')
    ).toBeTruthy();
  });
});
