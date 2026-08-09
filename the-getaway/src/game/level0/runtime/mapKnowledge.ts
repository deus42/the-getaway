import { LEVEL0_LAYOUT_CONTRACT } from '../../../content/levels/level0/layoutContract';
import type { Level0Anchor } from '../layout/types';
import type { Level0RunState } from './types';

const SAFEHOUSE_WORLD_IDS = new Set([
  'safehouse.boundary',
  'safehouse.spawn',
  'safehouse.departure',
  'entrance.safehouse',
  'interaction.safehouse.wait',
  'interaction.safehouse.rest',
]);

// Grounding anchors are ordinary street furniture: visible to anyone standing
// in the district, so they are known without a discovery step (GDR-PAR-006).
const STREET_FURNITURE_IDS = new Set([
  'interaction.grounding.vending_coffee',
  'interaction.grounding.shrine',
]);

export const isLevel0AnchorKnown = (run: Level0RunState, anchor: Level0Anchor): boolean => {
  if (
    SAFEHOUSE_WORLD_IDS.has(anchor.id) &&
    run.mapKnowledge.discoveredLocationIds.includes('safehouse.boundary')
  ) {
    return true;
  }
  if (STREET_FURNITURE_IDS.has(anchor.id)) {
    return true;
  }
  switch (anchor.kind) {
    case 'camera':
      return run.mapKnowledge.discoveredCameraIds.includes(anchor.id);
    case 'terminal':
      return run.mapKnowledge.discoveredTerminalIds.includes(anchor.id);
    case 'hiding':
      return run.mapKnowledge.discoveredHidingContextIds.includes(anchor.id);
    case 'blending':
      return run.mapKnowledge.discoveredBlendingContextIds.includes(anchor.id);
    case 'objective':
      // District/area/entrance knowledge is intentionally approximate. T9 may
      // render authored uncertainty regions, but only exact knowledge may expose
      // the gameplay anchor itself.
      return run.mapKnowledge.objectivePrecision[anchor.id] === 'exact';
    case 'contact':
    case 'entrance':
    case 'drone-launch':
    case 'safehouse':
    case 'interaction':
      return run.mapKnowledge.discoveredLocationIds.includes(anchor.id);
    case 'audio':
      return false;
  }
};

export const getKnownLevel0AnchorIds = (run: Level0RunState): string[] =>
  LEVEL0_LAYOUT_CONTRACT.anchors
    .filter((anchor) => isLevel0AnchorKnown(run, anchor))
    .map((anchor) => anchor.id);

export const getWorldOwnedLevel0AnchorIds = (run: Level0RunState): string[] =>
  LEVEL0_LAYOUT_CONTRACT.anchors
    .filter((anchor) => {
      if (anchor.kind === 'objective') {
        return run.objectives[anchor.id] !== undefined;
      }
      if (anchor.kind === 'contact') {
        const contactId = anchor.id.startsWith('contact.') ? anchor.id.slice('contact.'.length) : '';
        return contactId === 'lira' || contactId === 'naila' || contactId === 'brant';
      }
      return true;
    })
    .map((anchor) => anchor.id);
