import { MapArea, Player, Position, SurveillanceZoneState } from '../../interfaces/types';

export interface AutoStealthPlannerContext {
  player: Player;
  mapArea: MapArea | null;
  surveillanceZone?: SurveillanceZoneState;
}

export type AutoStealthDecision =
  | { type: 'wait'; score: number; summary: string; rationale: string[] }
  | { type: 'move'; score: number; summary: string; destination: Position; rationale: string[] }
  | { type: 'hack'; score: number; summary: string; targetId: string; rationale: string[] };

const buildWaitDecision = (): AutoStealthDecision => ({
  type: 'wait',
  score: 0,
  summary: 'Hold position',
  rationale: ['No safer move available'],
});

export const planAutoStealthAction = (_context: AutoStealthPlannerContext): AutoStealthDecision => {
  void _context;
  // MVP stub: prefer waiting until heuristics are implemented (shadow seeking, cone avoidance, camera hacks)
  return buildWaitDecision();
};

