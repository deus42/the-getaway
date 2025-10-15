import { generateSceneMap } from '../generation/worldGenerationPipeline';
import type { GeneratedSceneDefinition } from '../../narrative/tripleTypes';

const buildSampleDefinition = (): GeneratedSceneDefinition => ({
  id: 'scene-sample',
  resourceKey: 'scenes.test.sample',
  levelKey: 'levels.testbed',
  missionKey: 'missions.testbed',
  width: 20,
  height: 14,
  metadata: {
    story: 'Test prompt -> generated scene.',
  },
  moments: [
    {
      id: 'moment-0',
      label: 'Setup',
      order: 0,
      summary: 'Place barricades near the relay.',
      triples: [
        {
          id: 'triple-anchor',
          relation: 'near',
          priority: 0,
          resourceKey: 'triples.test.anchor',
          subject: {
            label: 'makeshift barricade',
            resourceKey: 'props.makeshift_barricade',
            tags: ['cover'],
          },
          object: {
            label: 'relay tower',
            resourceKey: 'props.relay_tower',
          },
        },
        {
          id: 'triple-overwatch',
          relation: 'above',
          priority: 1,
          resourceKey: 'triples.test.overwatch',
          subject: {
            label: 'lookout sniper',
            resourceKey: 'props.lookout_sniper',
          },
          object: {
            label: 'relay tower',
            resourceKey: 'props.relay_tower',
          },
        },
      ],
    },
  ],
  placements: [],
});

describe('worldGenerationPipeline', () => {
  it('generates placements for triples and keeps tiles walkable where expected', () => {
    const definition = buildSampleDefinition();
    const { mapArea, placements, issues } = generateSceneMap(definition);

    expect(issues).toHaveLength(0);
    expect(placements).toHaveLength(3);

    const anchor = placements.find(
      (placement) => placement.resourceKey === 'props.relay_tower'
    );
    const barricade = placements.find(
      (placement) => placement.resourceKey === 'props.makeshift_barricade'
    );
    const lookout = placements.find(
      (placement) => placement.resourceKey === 'props.lookout_sniper'
    );

    expect(anchor).toBeDefined();
    expect(barricade).toBeDefined();
    expect(lookout).toBeDefined();

    if (!anchor || !barricade || !lookout) {
      return;
    }

    const anchorTile =
      mapArea.tiles[anchor.position.y]?.[anchor.position.x];
    const barricadeTile =
      mapArea.tiles[barricade.position.y]?.[barricade.position.x];

    expect(anchorTile?.isWalkable).toBe(true);
    expect(barricadeTile?.provideCover).toBe(true);

    // depth sorting should place higher y-values after lower ones
    expect(barricade.depth).toBeGreaterThanOrEqual(anchor.depth);
  });
});
