import { createBasicMapArea } from '../grid';
import { computePlacementFromRelation } from '../generation/relationRules';
import type { NarrativeTriple } from '../../narrative/tripleTypes';

describe('relationRules', () => {
  const relations: NarrativeTriple['relation'][] = [
    'on',
    'near',
    'inside',
    'left_of',
    'right_of',
    'above',
    'below',
    'adjacent_to',
    'behind',
    'in_front_of',
  ];

  const createTriple = (relation: NarrativeTriple['relation']): NarrativeTriple => ({
    id: `triple-${relation}`,
    relation,
    priority: 0,
    resourceKey: `triples.test.${relation}`,
    subject: {
      label: `subject-${relation}`,
      resourceKey: `props.subject_${relation}`,
      tags: relation === 'near' ? ['cover'] : undefined,
    },
    object: {
      label: 'anchor-object',
      resourceKey: 'props.anchor_object',
    },
  });

  relations.forEach((relation) => {
    it(`places subject without collisions for relation "${relation}"`, () => {
      const mapArea = createBasicMapArea(`map-${relation}`, 12, 12);
      const anchorPosition = { x: 6, y: 6 };
      const occupied = new Set<string>([`6:6`]);
      const triple = createTriple(relation);

      const placement = computePlacementFromRelation({
        mapArea,
        triple,
        anchorPosition,
        occupiedPositions: occupied,
        defaultDepthScale: mapArea.width,
      });

      expect(placement).not.toBeNull();

      if (!placement) {
        return;
      }

      const tile = mapArea.tiles[placement.position.y]?.[placement.position.x];
      expect(tile).toBeDefined();
      expect(tile?.isWalkable).toBe(true);
      expect(placement.resourceKey).toBe(triple.subject.resourceKey);

      // ensure newly chosen position is not already occupied
      const encodedPosition = `${placement.position.x}:${placement.position.y}`;
      expect(occupied.has(encodedPosition)).toBe(false);
    });
  });
});
