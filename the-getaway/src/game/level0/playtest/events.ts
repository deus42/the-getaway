export const LEVEL0_AGENT_MOVE_EVENT = 'getawayLevel0AgentMove';
export const LEVEL0_AGENT_MOVE_RESULT_EVENT = 'getawayLevel0AgentMoveResult';
export const LEVEL0_AGENT_INTERACTION_EVENT = 'getawayLevel0AgentInteraction';
export const LEVEL0_AGENT_RETRY_EVENT = 'getawayLevel0AgentRetry';

export interface Level0AgentMoveDetail {
  requestId: string;
  x: number;
  y: number;
}

export interface Level0AgentMoveResultDetail {
  requestId: string;
  accepted: boolean;
  reason: string;
}

export interface Level0AgentInteractionDetail {
  anchorId?: string;
}
