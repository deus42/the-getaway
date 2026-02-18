import Phaser from 'phaser';
import type { CharacterToken } from '../../utils/IsoObjectFactory';

export interface OcclusionMassHandle {
  id: string;
  container: Phaser.GameObjects.Container;
  bounds: Phaser.Geom.Rectangle;
}

export interface OcclusionEntityHandle {
  id: string;
  pixelX: number;
  pixelY: number;
  token: CharacterToken;
  nameLabel?: Phaser.GameObjects.Text;
  healthBar?: Phaser.GameObjects.Graphics;
  indicator?: Phaser.GameObjects.Graphics;
}

export interface OcclusionReadabilityState {
  masses: OcclusionMassHandle[];
  entities: OcclusionEntityHandle[];
  occlusionFadeFloor: number;
  emissiveIntensity: number;
}

interface EntityBaseVisualState {
  haloAlpha: number;
  beaconAlpha: number;
  nameAlpha: number;
  healthAlpha: number;
  indicatorAlpha: number;
}

const ENTITY_OVERLAP_PADDING = 20;

export class OcclusionReadabilityController {
  private readonly baseMassAlpha = new WeakMap<Phaser.GameObjects.Container, number>();
  private readonly baseEntityVisuals = new WeakMap<Phaser.GameObjects.Container, EntityBaseVisualState>();

  public applyOcclusionReadability(state: OcclusionReadabilityState): void {
    const fadeFloor = Phaser.Math.Clamp(state.occlusionFadeFloor, 0.2, 0.9);
    const readabilityBoost = Phaser.Math.Clamp(0.14 + state.emissiveIntensity * 0.3, 0.12, 0.5);

    state.masses.forEach((mass) => {
      if (!this.baseMassAlpha.has(mass.container)) {
        this.baseMassAlpha.set(mass.container, mass.container.alpha);
      }
      const base = this.baseMassAlpha.get(mass.container) ?? 1;
      mass.container.setAlpha(base);
    });

    state.entities.forEach((entity) => {
      this.restoreEntityBaseState(entity);
    });

    state.masses.forEach((mass) => {
      const expanded = new Phaser.Geom.Rectangle(
        mass.bounds.x - ENTITY_OVERLAP_PADDING,
        mass.bounds.y - ENTITY_OVERLAP_PADDING,
        mass.bounds.width + ENTITY_OVERLAP_PADDING * 2,
        mass.bounds.height + ENTITY_OVERLAP_PADDING * 2
      );

      const overlapping = state.entities.filter((entity) => expanded.contains(entity.pixelX, entity.pixelY));
      if (!overlapping.length) {
        return;
      }

      const baseMassAlpha = this.baseMassAlpha.get(mass.container) ?? 1;
      mass.container.setAlpha(Math.min(baseMassAlpha, fadeFloor));

      overlapping.forEach((entity) => {
        const token = entity.token;
        token.halo.setAlpha(Math.max(token.halo.alpha, 0.28 + readabilityBoost));
        token.beacon.setAlpha(Math.max(token.beacon.alpha, 0.36 + readabilityBoost * 0.75));

        if (entity.nameLabel) {
          entity.nameLabel.setAlpha(1);
          entity.nameLabel.setScale(1.08);
        }

        if (entity.healthBar && entity.healthBar.visible) {
          entity.healthBar.setAlpha(Math.max(entity.healthBar.alpha, 0.94));
        }

        if (entity.indicator && entity.indicator.visible) {
          entity.indicator.setAlpha(Math.max(entity.indicator.alpha, 0.94));
        }
      });
    });
  }

  private restoreEntityBaseState(entity: OcclusionEntityHandle): void {
    const container = entity.token.container;
    if (!this.baseEntityVisuals.has(container)) {
      this.baseEntityVisuals.set(container, {
        haloAlpha: entity.token.halo.alpha,
        beaconAlpha: entity.token.beacon.alpha,
        nameAlpha: entity.nameLabel?.alpha ?? 1,
        healthAlpha: entity.healthBar?.alpha ?? 1,
        indicatorAlpha: entity.indicator?.alpha ?? 1,
      });
    }

    const base = this.baseEntityVisuals.get(container);
    if (!base) {
      return;
    }

    entity.token.halo.setAlpha(base.haloAlpha);
    entity.token.beacon.setAlpha(base.beaconAlpha);

    if (entity.nameLabel) {
      entity.nameLabel.setAlpha(base.nameAlpha);
      entity.nameLabel.setScale(1);
    }

    if (entity.healthBar) {
      entity.healthBar.setAlpha(base.healthAlpha);
    }

    if (entity.indicator) {
      entity.indicator.setAlpha(base.indicatorAlpha);
    }
  }
}
