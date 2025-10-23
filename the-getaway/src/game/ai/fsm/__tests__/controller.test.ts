import { createNpcFsmController } from '../controller';
import { NpcFsmConfig } from '../types';
import { Enemy, MapArea, NPC, Player, Position } from '../../../interfaces/types';
import { AlertLevel } from '../../../interfaces/types';

const buildTile = (position: Position) => ({
  type: 'floor' as const,
  position,
  isWalkable: true,
  provideCover: false,
});

const createMapArea = (): MapArea => {
  const width = 3;
  const height = 3;
  const tiles = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => buildTile({ x, y }))
  );

  return {
    id: 'test-area',
    name: 'Test Area',
    zoneId: 'test-zone',
    width,
    height,
    tiles,
    entities: {
      enemies: [],
      npcs: [],
      items: [],
    },
  };
};

const createEnemy = (overrides: Partial<Enemy> = {}): Enemy => ({
  id: 'enemy-1',
  name: 'Test Guard',
  position: { x: 1, y: 1 },
  health: 40,
  maxHealth: 40,
  actionPoints: 4,
  maxActionPoints: 4,
  damage: 5,
  attackRange: 1,
  isHostile: true,
  suppression: 0,
  visionCone: {
    range: 6,
    angle: 90,
    direction: 0,
  },
  alertLevel: AlertLevel.IDLE,
  alertProgress: 0,
  lastKnownPlayerPosition: null,
  ...overrides,
});

const createPlayer = (overrides: Partial<Player> = {}): Player => ({
  id: 'player',
  name: 'Runner',
  position: { x: 2, y: 1 },
  health: 60,
  maxHealth: 60,
  actionPoints: 6,
  maxActionPoints: 6,
  damage: 8,
  attackRange: 1,
  facing: 'east',
  coverOrientation: null,
  suppression: 0,
  stamina: 100,
  maxStamina: 100,
  isExhausted: false,
  isCrouching: false,
  skills: {
    strength: 5,
    perception: 5,
    endurance: 5,
    charisma: 5,
    intelligence: 5,
    agility: 5,
    luck: 5,
  },
  skillTraining: {} as Player['skillTraining'],
  taggedSkillIds: [],
  level: 1,
  experience: 0,
  credits: 0,
  skillPoints: 0,
  attributePoints: 0,
  perks: [],
  pendingPerkSelections: 0,
  karma: 0,
  personality: {
    alignment: 'stoic',
    flags: {
      earnest: 0,
      sarcastic: 0,
      ruthless: 0,
      stoic: 1,
    },
    lastUpdated: 0,
  },
  factionReputation: {
    resistance: 0,
    corpsec: 0,
    scavengers: 0,
  },
  inventory: {
    items: [],
    maxWeight: 50,
    currentWeight: 0,
    hotbar: [null, null, null, null, null],
  },
  equipped: {
    primaryWeapon: null,
    secondaryWeapon: null,
    meleeWeapon: null,
    bodyArmor: null,
    helmet: null,
    accessory1: null,
    accessory2: null,
  },
  ...overrides,
});

const baseConfig: NpcFsmConfig = {
  id: 'spec-guard',
  initialState: 'patrol',
  baseWeights: {
    idle: 0,
    patrol: 1,
    chase: 1,
    search: 0,
    attack: 0,
    inspectNoise: 0,
    flee: 0,
    panic: 0,
  },
};

describe('createNpcFsmController', () => {
  it('boosts flee weight when health ratio falls below threshold', () => {
    const controller = createNpcFsmController({
      ...baseConfig,
      baseWeights: {
        idle: 0,
        patrol: 0.1,
        chase: 0.1,
        search: 0,
        attack: 0,
        inspectNoise: 0,
        flee: 0.1,
        panic: 0,
      },
      utilityModifiers: [
        { kind: 'healthBelow', state: 'flee', threshold: 0.5, weight: 5 },
      ],
    });

    const enemy = createEnemy({ health: 10, maxHealth: 40 });
    const player = createPlayer();
    const mapArea = createMapArea();

    const { state } = controller.step({
      enemy,
      player,
      mapArea,
      squad: [],
      civilians: [] as NPC[],
      hasLineOfSight: false,
      distanceToPlayer: 2,
      tookRecentDamage: true,
      healthRatio: enemy.health / enemy.maxHealth,
      suppressionRatio: 0,
      alertLevel: enemy.alertLevel,
      lastKnownPlayerPosition: null,
      directorIntensity: undefined,
      now: 0,
    });

    expect(state).toBe('flee');
  });

  it('prefers attack when line of sight is available', () => {
    const controller = createNpcFsmController({
      ...baseConfig,
      baseWeights: {
        idle: 0,
        patrol: 0,
        chase: 0,
        search: 0.1,
        attack: 0,
        inspectNoise: 0,
        flee: 0,
        panic: 0,
      },
      utilityModifiers: [
        { kind: 'lineOfSight', state: 'attack', weight: 5 },
        { kind: 'lostLineOfSight', state: 'search', weight: 5 },
      ],
    });

    const enemy = createEnemy({ alertLevel: AlertLevel.SUSPICIOUS });
    const player = createPlayer();
    const mapArea = createMapArea();

    const attacking = controller.step({
      enemy,
      player,
      mapArea,
      squad: [],
      civilians: [],
      hasLineOfSight: true,
      distanceToPlayer: 1,
      tookRecentDamage: false,
      healthRatio: 1,
      suppressionRatio: 0,
      alertLevel: enemy.alertLevel,
      lastKnownPlayerPosition: player.position,
      directorIntensity: undefined,
      now: 100,
    });

    expect(attacking.state).toBe('attack');

    const searching = controller.step({
      enemy,
      player,
      mapArea,
      squad: [],
      civilians: [],
      hasLineOfSight: false,
      distanceToPlayer: 1,
      tookRecentDamage: false,
      healthRatio: 1,
      suppressionRatio: 0,
      alertLevel: enemy.alertLevel,
      lastKnownPlayerPosition: player.position,
      directorIntensity: undefined,
      now: 200,
    });

    expect(searching.state).toBe('search');
  });

  it('enforces cooldowns before allowing panic again', () => {
    const controller = createNpcFsmController({
      ...baseConfig,
      baseWeights: {
        idle: 0.1,
        patrol: 0,
        chase: 0,
        search: 0,
        attack: 0,
        inspectNoise: 0,
        flee: 0,
        panic: 5,
      },
      cooldowns: {
        panic: 1000,
      },
    });

    const enemy = createEnemy();
    const player = createPlayer();
    const mapArea = createMapArea();

    const first = controller.step({
      enemy,
      player,
      mapArea,
      squad: [],
      civilians: [],
      hasLineOfSight: true,
      distanceToPlayer: 3,
      tookRecentDamage: true,
      healthRatio: 0.4,
      suppressionRatio: 0.9,
      alertLevel: AlertLevel.ALARMED,
      lastKnownPlayerPosition: player.position,
      directorIntensity: undefined,
      now: 0,
    });

    expect(first.state).toBe('panic');

    const second = controller.step({
      enemy,
      player,
      mapArea,
      squad: [],
      civilians: [],
      hasLineOfSight: true,
      distanceToPlayer: 3,
      tookRecentDamage: true,
      healthRatio: 0.4,
      suppressionRatio: 0.9,
      alertLevel: AlertLevel.ALARMED,
      lastKnownPlayerPosition: player.position,
      directorIntensity: undefined,
      now: 500,
    });

    expect(second.state).not.toBe('panic');

    const third = controller.step({
      enemy,
      player,
      mapArea,
      squad: [],
      civilians: [],
      hasLineOfSight: true,
      distanceToPlayer: 3,
      tookRecentDamage: true,
      healthRatio: 0.4,
      suppressionRatio: 0.9,
      alertLevel: AlertLevel.ALARMED,
      lastKnownPlayerPosition: player.position,
      directorIntensity: undefined,
      now: 1500,
    });

    expect(third.state).toBe('panic');
  });

  it('produces deterministic state transitions with identical seeds', () => {
    const config: NpcFsmConfig = {
      id: 'deterministic-guard',
      initialState: 'patrol',
      baseWeights: {
        idle: 0.2,
        patrol: 0.5,
        chase: 1,
        search: 0.5,
        attack: 1,
        inspectNoise: 0.1,
        flee: 0.1,
        panic: 0.1,
      },
    };

    const controllerA = createNpcFsmController(config);
    const controllerB = createNpcFsmController(config);

    const enemy = createEnemy();
    const player = createPlayer();
    const mapArea = createMapArea();

    const sequenceA: string[] = [];
    const sequenceB: string[] = [];

    for (let i = 0; i < 5; i += 1) {
      const now = i * 100;
      sequenceA.push(
        controllerA.step({
          enemy,
          player,
          mapArea,
          squad: [],
          civilians: [],
          hasLineOfSight: i % 2 === 0,
          distanceToPlayer: 2,
          tookRecentDamage: false,
          healthRatio: 1,
          suppressionRatio: 0,
          alertLevel: AlertLevel.SUSPICIOUS,
          lastKnownPlayerPosition: player.position,
          directorIntensity: undefined,
          now,
        }).state
      );

      sequenceB.push(
        controllerB.step({
          enemy,
          player,
          mapArea,
          squad: [],
          civilians: [],
          hasLineOfSight: i % 2 === 0,
          distanceToPlayer: 2,
          tookRecentDamage: false,
          healthRatio: 1,
          suppressionRatio: 0,
          alertLevel: AlertLevel.SUSPICIOUS,
          lastKnownPlayerPosition: player.position,
          directorIntensity: undefined,
          now,
        }).state
      );
    }

    expect(sequenceA).toEqual(sequenceB);
  });
});
