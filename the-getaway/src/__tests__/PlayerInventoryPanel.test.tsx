import { render, screen, fireEvent, within, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import PlayerInventoryPanel from '../components/ui/PlayerInventoryPanel';
import { store, resetGame } from '../store';
import { addItem } from '../store/playerSlice';
import { Armor, Consumable, Weapon } from '../game/interfaces/types';

describe('PlayerInventoryPanel', () => {
  const weapon: Weapon = {
    id: 'weapon-test',
    name: 'Rusty Pistol',
    description: 'A sidearm with a failing slide.',
    weight: 2.5,
    value: 80,
    isQuestItem: false,
    damage: 8,
    range: 6,
    apCost: 3,
    slot: 'weapon',
    skillType: 'smallGuns',
    durability: { current: 40, max: 100 },
  };

  const armor: Armor = {
    id: 'armor-test',
    name: 'Frayed Vest',
    description: 'Offers minimal protection.',
    weight: 5,
    value: 60,
    isQuestItem: false,
    protection: 6,
    slot: 'armor',
    durability: { current: 45, max: 90 },
    equipSlot: 'bodyArmor',
  };

  const medkit: Consumable = {
    id: 'consumable-test',
    name: 'Medkit',
    description: 'Restores 30 HP.',
    weight: 0.5,
    value: 60,
    isQuestItem: false,
    stackable: true,
    quantity: 2,
    effect: {
      type: 'health',
      value: 30,
    },
  };

  const setup = () =>
    render(
      <Provider store={store}>
        <PlayerInventoryPanel />
      </Provider>
    );

  beforeEach(() => {
    act(() => {
      store.dispatch(resetGame());
      store.dispatch(addItem(weapon));
      store.dispatch(addItem(armor));
      store.dispatch(addItem(medkit));
    });
  });

  it('filters items by category', () => {
    setup();

    expect(screen.getByText('Rusty Pistol')).toBeInTheDocument();
    expect(screen.getByText('Medkit')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Weapons/i }));

    expect(screen.getByText('Rusty Pistol')).toBeInTheDocument();
    expect(screen.queryByText('Medkit')).not.toBeInTheDocument();
  });

  it('equips a weapon via quick action', () => {
    setup();

    const weaponCard = screen.getByRole('listitem', { name: 'Rusty Pistol' });
    fireEvent.click(within(weaponCard).getByRole('button', { name: 'Equip' }));

    const primaryWeaponCard = screen.getByText('Primary Weapon').closest('div');
    expect(primaryWeaponCard).not.toBeNull();
    if (primaryWeaponCard) {
      expect(within(primaryWeaponCard).getByText('Rusty Pistol')).toBeInTheDocument();
    }
  });

  it('assigns a consumable to a hotbar slot', () => {
    setup();

    const medkitSelect = screen.getByLabelText('Assign Medkit to hotbar slot') as HTMLSelectElement;
    fireEvent.change(medkitSelect, { target: { value: '0' } });

    const hotbarRegion = screen.getByRole('region', { name: 'Hotbar assignments' });
    const slotCard = within(hotbarRegion).getByText('Slot 1').closest('div');
    expect(slotCard).not.toBeNull();
    if (slotCard) {
      expect(within(slotCard).getByText('Medkit')).toBeInTheDocument();
    }
  });

  it('repairs an item and updates durability', async () => {
    setup();

    const weaponCard = screen.getByRole('listitem', { name: 'Rusty Pistol' });
    fireEvent.click(within(weaponCard).getByRole('button', { name: /Repair/ }));

    expect(await within(weaponCard).findByText('Durability 100/100')).toBeInTheDocument();
  });

  it('uses a consumable and reduces stack quantity', async () => {
    setup();

    const medkitCard = screen.getByRole('listitem', { name: 'Medkit' });
    expect(within(medkitCard).getByText(/×2/)).toBeInTheDocument();

    fireEvent.click(within(medkitCard).getByRole('button', { name: 'Use' }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(within(medkitCard).queryByText(/×2/)).not.toBeInTheDocument();
    const inventoryEntry = store
      .getState()
      .player.data.inventory.items.find((entry) => entry.id === medkit.id);
    expect(inventoryEntry?.quantity ?? 1).toBe(1);
  });
});
