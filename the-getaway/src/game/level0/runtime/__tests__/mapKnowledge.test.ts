import { LEVEL0_LAYOUT_CONTRACT } from '../../../../content/levels/level0/layoutContract';
import { createInitialLevel0RunState } from '../safehouse';
import {
  getKnownLevel0AnchorIds,
  getWorldOwnedLevel0AnchorIds,
  isLevel0AnchorKnown,
} from '../mapKnowledge';

describe('Level 0 map knowledge', () => {
  it('reveals only authored starting knowledge on a new run', () => {
    const run = createInitialLevel0RunState('knowledge-start');
    const known = getKnownLevel0AnchorIds(run);

    expect(known).toContain('safehouse.boundary');
    expect(known).toContain('contact.lira');
    expect(known).toContain('terminal.outbound_transit');
    expect(known).not.toContain('objective.medkits');
    expect(known).not.toContain('objective.manifest');
    expect(known).not.toContain('camera.public_gate');
    expect(known).not.toContain('drone.launch');
  });

  it('reveals a camera only after its stable authored ID is discovered', () => {
    const run = createInitialLevel0RunState('knowledge-camera');
    const camera = LEVEL0_LAYOUT_CONTRACT.anchors.find(
      (anchor) => anchor.id === 'camera.public_gate'
    )!;
    expect(isLevel0AnchorKnown(run, camera)).toBe(false);

    run.mapKnowledge.discoveredCameraIds.push(camera.id);
    expect(isLevel0AnchorKnown(run, camera)).toBe(true);
  });

  it('reveals an exact objective anchor only at exact precision', () => {
    const run = createInitialLevel0RunState('knowledge-objective-precision');
    const objective = LEVEL0_LAYOUT_CONTRACT.anchors.find(
      (anchor) => anchor.id === 'objective.medkits'
    )!;

    for (const precision of ['district', 'area', 'entrance'] as const) {
      run.mapKnowledge.objectivePrecision[objective.id] = precision;
      expect(isLevel0AnchorKnown(run, objective)).toBe(false);
    }

    run.mapKnowledge.objectivePrecision[objective.id] = 'exact';
    expect(isLevel0AnchorKnown(run, objective)).toBe(true);
  });

  it('derives world ownership independently from player knowledge', () => {
    const run = createInitialLevel0RunState('knowledge-ownership');

    expect(getWorldOwnedLevel0AnchorIds(run)).toContain('contact.lira');
    expect(getWorldOwnedLevel0AnchorIds(run)).not.toContain('objective.medkits');

    run.objectives['objective.medkits'] = {
      objectiveId: 'objective.medkits',
      status: 'available',
    };
    expect(getWorldOwnedLevel0AnchorIds(run)).toContain('objective.medkits');
  });
});
