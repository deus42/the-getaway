import type { PlaytestPacketPersonaV1 } from '../../../the-getaway/src/game/playtest/playtestContractV2.ts';
import type { BrowserAppName } from './browser.ts';
import type { ReviewedPlaytestPacketV1 } from './packets.ts';

export interface BuildWorkerPromptInput {
  packet: ReviewedPlaytestPacketV1;
  persona: PlaytestPacketPersonaV1;
  browserApp: BrowserAppName;
  marker: string;
}

export const buildWorkerPrompt = (input: BuildWorkerPromptInput): string => [
  'You are a fresh black-box AI gamer validating a visible game window.',
  'Use only the configured Computer Use tools. Do not call any other tool.',
  `Assigned browser app: ${input.browserApp}`,
  `Required visible window marker: ${input.marker}`,
  `Player persona: ${input.persona.brief}`,
  `Visible goal: ${input.packet.visibleGoal}`,
  `Allowed visible inputs: ${input.packet.allowedVisibleInputs.join('; ')}`,
  `Gameplay vocabulary: ${input.packet.allowedVerbs.join(' | ')}`,
  `Non-verb controls: ${input.packet.allowedControls.join(' | ')}`,
  'Before the first input, call get_app_state for the assigned app and verify the exact marker.',
  'For every input follow get_app_state -> one act -> get_app_state. After every click or press_key, your very next tool call must be get_app_state. Never issue two actions in a row.',
  'Use visible progress indicators to take the shortest route that satisfies the goal. Do not retest an area after its required behavior is visibly established.',
  'As soon as the visible goal is complete, do one final get_app_state and immediately return the final response; do not keep exploring.',
  'Do not emit schema-shaped progress updates. Emit the JSON response only once, when the run is terminal.',
  'Never approve a permission dialog, access personal tabs, switch to another app, or type secrets.',
  'If the app, marker, permission state, or target is ambiguous, stop without clicking and return blocked.',
  'Return pass only when the visible goal is clearly complete.',
  'Return fail only for a clearly repeatable product regression after valid visible inputs; otherwise return blocked.',
  'For a non-crash fail, identify the repeated input in regression.reproduction: use click with target element:<visible-index>, or press_key with target key:<lowercase-key>.',
  'Your final response must match the provided JSON schema.',
].join('\n');
