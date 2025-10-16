import { SignageVariantDefinition } from './types';

const signageVariants: SignageVariantDefinition[] = [
  {
    id: 'sign.blackout.none.cola',
    signId: 'downtown.vending.primary',
    flag: 'blackoutTier',
    value: 'none',
    storyFunction: 'world-building',
    description: 'Default advertising bluster.',
    text: 'COLA: Now with 12 essential sugars.',
  },
  {
    id: 'sign.blackout.brownout.colaw',
    signId: 'downtown.vending.primary',
    flag: 'blackoutTier',
    value: 'brownout',
    storyFunction: 'misdirect',
    description: 'First hint the grid is lying.',
    text: 'CO-LAW: Report loiterers, earn fizz miles.',
  },
  {
    id: 'sign.blackout.rolling.alert',
    signId: 'downtown.vending.primary',
    flag: 'blackoutTier',
    value: 'rolling',
    storyFunction: 'payoff',
    description: 'Full propaganda mode during outages.',
    text: 'CO-LAW: Lights out? Snitch brighter.',
  },
  {
    id: 'sign.supply.tight.milk',
    signId: 'corner.bodega.priceboard',
    flag: 'supplyScarcity',
    value: 'tight',
    storyFunction: 'foreshadow',
    description: 'Price jumps signal scarcity.',
    text: 'Milk: 45 credits. Bottles scowl included.',
  },
  {
    id: 'sign.supply.rationed.ammo',
    signId: 'corner.bodega.priceboard',
    flag: 'supplyScarcity',
    value: 'rationed',
    storyFunction: 'payoff',
    description: 'Ammo “sale” becomes a comedic beat.',
    text: 'Ammo Sale*: *Bring your own casing.',
  },
];

export const getSignageVariantsForFlag = (
  flag: SignageVariantDefinition['flag'],
  value: SignageVariantDefinition['value']
): SignageVariantDefinition[] =>
  signageVariants.filter((variant) => variant.flag === flag && variant.value === value);

export const findSignageVariantById = (
  id: string
): SignageVariantDefinition | undefined => signageVariants.find((variant) => variant.id === id);
