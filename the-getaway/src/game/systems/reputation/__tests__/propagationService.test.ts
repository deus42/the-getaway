import { seedRumorsFromWitnessRecords, advanceRumors, buildSocialEdges } from '../propagationService';
import { ReputationEvent, WitnessRecord } from '../types';
import { MapArea, MapTile, TileType, NPC } from '../../../interfaces/types';

const createTile = (x: number, y: number): MapTile => ({
  type: TileType.FLOOR,
  position: { x, y },
  isWalkable: true,
  provideCover: false,
});

const createArea = (npcs: NPC[]): MapArea => {
  const width = 12;
  const height = 12;
  const tiles = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => createTile(x, y))
  );
  return {
    id: 'area::prop',
    name: 'Propagation Test',
    zoneId: 'zone::test',
    width,
    height,
    tiles,
    entities: {
      enemies: [],
      npcs,
      items: [],
    },
  };
};

const createNpc = (id: string, x: number, y: number, tags: string[] = []): NPC => ({
  id,
  name: id,
  position: { x, y },
  health: 10,
  maxHealth: 10,
  routine: [],
  dialogueId: 'npc-test',
  isInteractive: true,
  socialTags: tags,
});

const baseEvent: ReputationEvent = {
  id: 'evt-prop',
  actorId: 'player',
  actorLabel: 'Player',
  zoneId: 'zone::test',
  cellId: '0:0',
  position: { x: 5, y: 5 },
  intensity: 'major',
  traits: { heroic: 20 },
  tags: ['rescue'],
  timestamp: 1000,
  visibility: {
    base: 0.75,
    noiseLevel: 0.6,
    lightingFactor: 0.85,
    disguiseFactor: 0.8,
  },
};

const createRecord = (witnessId: string): WitnessRecord => ({
  id: `rec-${witnessId}`,
  eventId: baseEvent.id,
  witnessId,
  witnessName: witnessId,
  factionId: 'resistance',
  zoneId: 'zone::test',
  cellId: '0:0',
  timestamp: baseEvent.timestamp,
  visibilityScore: 0.8,
  confidence: 0.75,
  isRumorOnly: false,
  traits: [
    {
      trait: 'heroic',
      delta: 26,
      confidence: 0.9,
      source: 'witness',
    },
  ],
});

describe('propagationService', () => {
  it('propagates rumors across social edges and produces mutations', () => {
    const npcs = [createNpc('npc-1', 5, 5, ['resistance']), createNpc('npc-2', 7, 5, ['resistance'])];
    const area = createArea(npcs);
    const edges = buildSocialEdges({ mapArea: area });
    expect(edges.length).toBeGreaterThan(0);

    const carriers = seedRumorsFromWitnessRecords(baseEvent, [createRecord('npc-1')]);
    expect(carriers).toHaveLength(1);

    const firstPropagation = advanceRumors({
      timestamp: baseEvent.timestamp + 60,
      elapsedSeconds: 60,
      carriers,
      edges,
    });

    const secondPropagation = advanceRumors({
      timestamp: baseEvent.timestamp + 120,
      elapsedSeconds: 60,
      carriers: firstPropagation.carriers,
      edges: firstPropagation.edges,
    });

    expect(secondPropagation.mutations.length).toBeGreaterThan(0);
  });
});
