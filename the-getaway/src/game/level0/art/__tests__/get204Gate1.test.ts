import { LEVEL0_LAYOUT_CONTRACT } from '../../../../content/levels/level0/layoutContract';
import { isPointWalkableWithClearance } from '../../layout/validator';
import {
  GET204_GATE1_MOVEMENT_CONTRACT,
  GET204_GATE1_VISUAL,
  get204ArtPixelToLayout,
  isGet204Gate1ProofRequested,
  isGet204VisualPixelBlocked,
  resolveGet204Gate1OccluderAlpha,
  resolveGet204Gate1LayerTopLeft,
  resolveGet204Gate1StartPosition,
  resolveGet204OverviewFitZoom,
  resolveGet204WorldViewBlend,
} from '../get204Gate1';

describe('GET-204 Gate 1 live visual contract', () => {
  it('loads on the normal mission path and uses the query only for proof positioning', () => {
    expect(GET204_GATE1_VISUAL.runtimeEnabled).toBe(true);
    expect(isGet204Gate1ProofRequested('?visualGate=get204-1')).toBe(true);
    expect(isGet204Gate1ProofRequested('?visualGate=other')).toBe(false);
    expect(isGet204Gate1ProofRequested('')).toBe(false);
  });

  it('remains registered to the Level 0 projection', () => {
    expect(GET204_GATE1_VISUAL.projection).toEqual(LEVEL0_LAYOUT_CONTRACT.projection);
    expect(GET204_GATE1_VISUAL.canvas).toEqual({
      width: 1586,
      height: 992,
      pixelOrigin: { x: -240, y: -862 },
    });
    expect(resolveGet204Gate1LayerTopLeft({ x: 2160, y: 180 })).toEqual({
      x: 2400,
      y: 1042,
    });
  });

  it('uses people-free matte layers and runtime-owned street life', () => {
    expect(GET204_GATE1_VISUAL.layers.map((layer) => layer.view)).toEqual([
      'overview',
      'close',
    ]);
    expect(GET204_GATE1_VISUAL.layers[0]).toMatchObject({
      textureKey: 'level0:get204-city-v2:overview',
      path: 'environment/level0/get204-city-v2/overview-nopeople-matte-v3.png',
      view: 'overview',
    });
    expect(GET204_GATE1_VISUAL.layers[1]).toMatchObject({
      textureKey: 'level0:get204-city-v2:close',
      path: 'environment/level0/get204-city-v2/close-nopeople-matte-v2.png',
      view: 'close',
    });
    expect(GET204_GATE1_VISUAL.overviewCanvas).toEqual({ width: 1586, height: 992 });
    expect(GET204_GATE1_VISUAL.zoomBlend).toEqual({
      overviewOnlyProgress: 0.16,
      closeOnlyProgress: 0.62,
    });
    expect(GET204_GATE1_VISUAL.occluders).toEqual([]);
    expect(GET204_GATE1_VISUAL.populationOwnership).toBe('runtime-authored-proof');
    expect(GET204_GATE1_VISUAL.population).toHaveLength(7);
    const humanActors = GET204_GATE1_VISUAL.population.filter(
      (actor) => actor.kind !== 'drone'
    );
    expect(humanActors).toHaveLength(6);
    expect(humanActors.every((actor) => Boolean(actor.textureKey && actor.path))).toBe(true);
    expect(new Set(humanActors.map((actor) => actor.textureKey)).size).toBe(6);
    expect(
      humanActors.every((actor) =>
        actor.path?.startsWith('environment/level0/get204-city-v2/population/')
      )
    ).toBe(true);
  });

  it('registers the visible plate to layout space and blocks building silhouettes', () => {
    expect(get204ArtPixelToLayout({ x: 784, y: 520 })).toEqual({
      x: 59.1875,
      y: 27.1875,
    });
    expect(isGet204VisualPixelBlocked({ x: 430, y: 230 })).toBe(true);
    expect(isGet204VisualPixelBlocked({ x: 1450, y: 200 })).toBe(true);
    expect(isGet204VisualPixelBlocked({ x: 1450, y: 760 })).toBe(true);
    expect(isGet204VisualPixelBlocked({ x: 780, y: 520 })).toBe(false);
  });

  it('uses plate-derived blockers while preserving the authored traversal seam', () => {
    expect(GET204_GATE1_VISUAL.proofPath.map((point) => point.role)).toEqual([
      'road',
      'sidewalk',
      'controlled-threshold',
      'service-seam',
      'foreground-occlusion',
    ]);
    expect(GET204_GATE1_MOVEMENT_CONTRACT.id).toBe('level0-get204-live-candidate-v2');
    expect(GET204_GATE1_MOVEMENT_CONTRACT.buildingFootprints.length).toBeGreaterThanOrEqual(10);
    expect(
      GET204_GATE1_MOVEMENT_CONTRACT.buildingFootprints.some(
        (footprint) => footprint.id === 'building.safehouse'
      )
    ).toBe(false);
    expect(
      GET204_GATE1_MOVEMENT_CONTRACT.buildingFootprints.some(
        (footprint) => footprint.id === 'building.hidzu_offices'
      )
    ).toBe(false);
    [
      { x: 49, y: 27 },
      { x: 64, y: 12 },
      { x: 46, y: 41 },
      { x: 77, y: 35 },
    ].forEach((point) => {
      expect(isPointWalkableWithClearance(GET204_GATE1_MOVEMENT_CONTRACT, point, 0.2)).toBe(false);
    });
    GET204_GATE1_VISUAL.population
      .filter((actor) => actor.kind !== 'drone')
      .forEach((actor) => {
        expect(
          isPointWalkableWithClearance(GET204_GATE1_MOVEMENT_CONTRACT, actor.position, 0.12)
        ).toBe(false);
      });
    GET204_GATE1_VISUAL.proofPath.forEach((point) => {
      expect(isPointWalkableWithClearance(GET204_GATE1_MOVEMENT_CONTRACT, point, 0.2)).toBe(true);
    });
  });

  it('uses the approved close-play actor and camera relationship', () => {
    expect(GET204_GATE1_VISUAL.proofStart).toEqual({ x: 59.2, y: 27.2 });
    expect(GET204_GATE1_VISUAL.defaultZoom).toBe(1.48);
    expect(GET204_GATE1_VISUAL.maxZoom).toBe(1.84);
    expect(GET204_GATE1_VISUAL.maxZoom - GET204_GATE1_VISUAL.defaultZoom).toBeGreaterThanOrEqual(0.3);
    expect(GET204_GATE1_VISUAL.actorScreenHeightTargetPx).toEqual({ min: 115, max: 150 });
  });

  it('covers supported viewports at overview zoom and blends relative to that fit', () => {
    const fit1440 = resolveGet204OverviewFitZoom(1440, 900);
    const fit1920 = resolveGet204OverviewFitZoom(1920, 1080);

    expect(fit1440).toBeCloseTo(1440 / 1586, 5);
    expect(fit1920).toBeCloseTo(1920 / 1586, 5);
    expect(resolveGet204WorldViewBlend(fit1440, fit1440)).toMatchObject({
      overviewAlpha: 1,
      closeAlpha: 0,
    });
    expect(
      resolveGet204WorldViewBlend(GET204_GATE1_VISUAL.defaultZoom, fit1920)
    ).toMatchObject({ overviewAlpha: 0, closeAlpha: 1 });
  });

  it('keeps proof positioning query-only and fades only the local foreground segment', () => {
    expect(resolveGet204Gate1StartPosition({ x: 16, y: 47 }, '')).toEqual({ x: 16, y: 47 });
    expect(
      resolveGet204Gate1StartPosition({ x: 16, y: 47 }, '?visualGate=get204-1')
    ).toEqual(GET204_GATE1_VISUAL.proofStart);
    expect(resolveGet204Gate1OccluderAlpha('occluder.south-west-corner', { x: 52, y: 35 })).toBe(1);
    expect(resolveGet204Gate1OccluderAlpha('missing', { x: 52, y: 35 })).toBe(1);
  });
});
