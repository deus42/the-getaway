import { sampleWitnesses } from '../witnessService';
import { ReputationEvent } from '../types';
import { MapArea, MapTile, TileType, NPC } from '../../../interfaces/types';

const createTile = (x: number, y: number, type: TileType = TileType.FLOOR): MapTile => ({
  type,
  position: { x, y },
  isWalkable: type !== TileType.WALL,
  provideCover: false,
});

const createMapArea = (width: number, height: number, npcs: NPC[]): MapArea => {
  const tiles: MapTile[][] = [];
  for (let y = 0; y < height; y += 1) {
    const row: MapTile[] = [];
    for (let x = 0; x < width; x += 1) {
      row.push(createTile(x, y));
    }
    tiles.push(row);
  }

  return {
    id: 'area::test',
    name: 'Test Area',
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

const createWitnessEvent = (overrides?: Partial<ReputationEvent>): ReputationEvent => ({
  id: 'evt-1',
  actorId: 'player-1',
  actorLabel: 'Player',
  zoneId: 'zone::test',
  cellId: '0:0',
  position: { x: 5, y: 5 },
  intensity: 'moderate',
  traits: { heroic: 18 },
  tags: ['rescue'],
  timestamp: Date.now(),
  visibility: {
    base: 0.95,
    noiseLevel: 0.75,
    lightingFactor: 1,
    disguiseFactor: 1,
    crowdDensity: 0.5,
  },
  ...overrides,
});

const createNPC = (id: string, x: number, y: number, extras?: Partial<NPC>): NPC => ({
  id,
  name: id,
  position: { x, y },
  health: 10,
  maxHealth: 10,
  routine: [],
  dialogueId: 'npc-test',
  isInteractive: true,
  ...extras,
});

describe('sampleWitnesses', () => {
  it('returns direct witnesses above visibility threshold', () => {
    const npc = createNPC('npc-1', 6, 5, { socialTags: ['resistance'] });
    const mapArea = createMapArea(10, 10, [npc]);
    const event = createWitnessEvent();

    const candidates = sampleWitnesses({
      event,
      mapArea,
      ambientLighting: 1,
      ambientNoise: 0.7,
      disguisePenalty: 0,
    });

    expect(candidates).toHaveLength(1);
    const [candidate] = candidates;
    expect(candidate.witnessId).toBe('npc-1');
    expect(candidate.isRumorOnly).toBe(false);
    expect(candidate.visibilityScore).toBeGreaterThan(0.6);
  });

  it('marks faint observers as rumor-only', () => {
    const npc = createNPC('npc-near', 8, 5, { socialTags: ['scavenger'] });
    const mapArea = createMapArea(20, 20, [npc]);
    const event = createWitnessEvent();

    const candidates = sampleWitnesses({
      event,
      mapArea,
      ambientLighting: 0.8,
      ambientNoise: 0.35,
      disguisePenalty: 0.15,
      visibilityThreshold: 0.85,
    });

    expect(candidates).toHaveLength(1);
    const [candidate] = candidates;
    expect(candidate.isRumorOnly).toBe(true);
    expect(candidate.visibilityScore).toBeGreaterThan(0.45);
    expect(candidate.visibilityScore).toBeLessThan(0.85);
  });
});
