import { createHash } from 'node:crypto';

import { COMPUTER_USE_TOOLS } from './worker.ts';

export interface TranscriptAuditInput {
  jsonl: string;
  stderr?: string;
  expectedBrowserApp?: string;
  expectedMarker?: string;
  allowedComputerUseActions?: readonly string[];
  allowedPlayerKeys?: readonly string[];
  complete?: boolean;
}

export interface TranscriptAudit {
  valid: boolean;
  calls: string[];
  blockingReasons: string[];
}

export interface CompletedComputerUseCall {
  id: string;
  tool: typeof COMPUTER_USE_TOOLS[number];
  arguments: Record<string, unknown>;
  fingerprint: string;
  resultSha256: string;
  markerVerified: boolean;
}

interface JsonObject {
  [key: string]: unknown;
}

const harmlessItemTypes = new Set(['reasoning', 'agent_message']);
const defaultAllowedPlayerKeys = [
  'w',
  'a',
  's',
  'd',
  'e',
  'o',
  'up',
  'down',
  'left',
  'right',
  'escape',
] as const;

const objectValue = (value: unknown): JsonObject | undefined =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonObject)
    : undefined;

const stringValue = (...values: unknown[]): string | undefined =>
  values.find((value): value is string => typeof value === 'string');

const failedEventMessage = (event: JsonObject): string => {
  const error = objectValue(event.error);
  return stringValue(error?.message, event.message) ?? 'unknown worker failure';
};

const toolArguments = (item: JsonObject): JsonObject | undefined => {
  const value = item.arguments ?? item.args ?? item.input;
  if (value === undefined) return undefined;
  if (typeof value === 'string') {
    try {
      return objectValue(JSON.parse(value) as unknown);
    } catch {
      return undefined;
    }
  }
  return objectValue(value);
};

export const computerUseResultText = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (value === undefined) return '';
  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
};

const toolResultText = (item: JsonObject): string =>
  computerUseResultText(item.result ?? item.output ?? item.error);

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  const object = objectValue(value);
  if (!object) return value;
  return Object.fromEntries(
    Object.entries(object)
      .sort(([left], [right]) => left.localeCompare(right, 'en'))
      .map(([key, entry]) => [key, canonicalize(entry)])
  );
};

const canonicalComputerUseResultText = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (value === undefined) return '';
  try {
    return JSON.stringify(canonicalize(value));
  } catch {
    return '';
  }
};

export const hashComputerUseResult = (value: unknown): string =>
  createHash('sha256').update(canonicalComputerUseResultText(value)).digest('hex');

export const computerUseCallFingerprint = (tool: string, args: JsonObject): string => {
  const { app: _assignedApp, ...visibleArguments } = args;
  return `${tool}:${createHash('sha256')
    .update(JSON.stringify(canonicalize(visibleArguments)))
    .digest('hex')}`;
};

export const parseCompletedComputerUseCall = (
  line: string,
  expectedBrowserApp: string,
  expectedMarker?: string,
  allowedComputerUseActions: readonly string[] = COMPUTER_USE_TOOLS
): CompletedComputerUseCall | undefined => {
  try {
    const event = objectValue(JSON.parse(line) as unknown);
    if (!event || event.type !== 'item.completed') return undefined;
    const item = objectValue(event.item);
    if (!item || item.type !== 'mcp_tool_call') return undefined;
    const server = stringValue(item.server, item.server_name, item.mcp_server);
    const tool = stringValue(item.tool, item.name);
    const id = stringValue(item.id);
    const status = stringValue(item.status);
    const args = toolArguments(item);
    const allowedToolNames = new Set(['get_app_state', ...allowedComputerUseActions]);
    if (
      server !== 'computer-use' ||
      !tool ||
      !id ||
      !allowedToolNames.has(tool) ||
      (status !== undefined && status !== 'completed' && status !== 'success') ||
      !args ||
      stringValue(args.app) !== expectedBrowserApp
    ) {
      return undefined;
    }
    const resultText = toolResultText(item);
    const markerVerified = tool !== 'get_app_state' ||
      !expectedMarker ||
      resultText.includes(expectedMarker);
    if (!markerVerified) return undefined;
    return {
      id,
      tool: tool as CompletedComputerUseCall['tool'],
      arguments: args,
      fingerprint: computerUseCallFingerprint(tool, args),
      resultSha256: hashComputerUseResult(item.result ?? item.output ?? item.error),
      markerVerified,
    };
  } catch {
    return undefined;
  }
};

const permissionOrApprovalBlocked = (value: string): boolean =>
  /Computer Use permissions are still pending|Required .* permissions were not granted|permission setup is still open|Computer Use is not allowed to use the app|Running application not found|Ambiguous app identifier|app approval (?:is )?(?:pending|required)|session has been stopped/i.test(
    value
  );

const validateVisibleInput = (
  tool: string,
  args: JsonObject,
  allowedPlayerKeys: ReadonlySet<string>
): string[] => {
  const reasons: string[] = [];
  if (tool === 'press_key') {
    const key = stringValue(args.key);
    if (!key || !allowedPlayerKeys.has(key.toLowerCase())) {
      reasons.push(
        `Computer Use key is outside the packet-visible input allowlist: ${key ?? 'missing'}.`
      );
    }
  }
  if (tool === 'click') {
    if (args.mouse_button !== undefined && args.mouse_button !== 'left') {
      reasons.push('Computer Use click must use the left mouse button.');
    }
    if (args.click_count !== undefined && args.click_count !== 1) {
      reasons.push('Computer Use click_count must be exactly 1.');
    }
  }
  return reasons;
};

const isModelOrConfigWarning = (line: string): boolean => {
  const warning = /\bwarn(?:ing)?\b/i.test(line);
  const sensitiveTopic = /\b(model|reasoning|config(?:uration)?)\b/i.test(line);
  const silentFallback =
    /\b(model|reasoning)\b.*\b(fallback|falling back|migrat|unavailable|unsupported|not found)\b/i.test(
      line
    );
  return (warning && sensitiveTopic) || silentFallback;
};

export const auditWorkerTranscript = (input: TranscriptAuditInput): TranscriptAudit => {
  const calls: string[] = [];
  const blockingReasons: string[] = [];
  const blockedReasonSet = new Set<string>();
  const seenCallIds = new Set<string>();
  const startedCallIds = new Set<string>();
  const completedCallIds = new Set<string>();
  const toolByCallId = new Map<string, string>();
  const callsWithArguments = new Set<string>();
  const allowedToolNames = new Set([
    'get_app_state',
    ...(input.allowedComputerUseActions ?? COMPUTER_USE_TOOLS),
  ]);
  const allowedPlayerKeys = new Set(
    (input.allowedPlayerKeys ?? defaultAllowedPlayerKeys).map((key) => key.toLowerCase())
  );
  const block = (reason: string): void => {
    if (!blockedReasonSet.has(reason)) {
      blockedReasonSet.add(reason);
      blockingReasons.push(reason);
    }
  };

  const lines = input.jsonl.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line) {
      continue;
    }

    let event: JsonObject;
    try {
      const parsed = JSON.parse(line) as unknown;
      const parsedObject = objectValue(parsed);
      if (!parsedObject) {
        throw new Error('event must be an object');
      }
      event = parsedObject;
    } catch (error) {
      block(
        `Malformed JSONL at line ${index + 1}: ${(error as Error).message}.`
      );
      continue;
    }

    const eventType = stringValue(event.type);
    if (eventType === 'turn.failed' || eventType === 'error') {
      block(`Worker event failed: ${failedEventMessage(event)}.`);
      continue;
    }

    if (eventType !== 'item.started' && eventType !== 'item.completed') {
      continue;
    }

    const item = objectValue(event.item);
    if (!item) {
      block(`${eventType} is missing an item object.`);
      continue;
    }
    const itemType = stringValue(item.type);
    if (itemType !== 'mcp_tool_call') {
      if (!itemType || !harmlessItemTypes.has(itemType)) {
        block(`Unexpected non-Computer-Use item: ${itemType ?? 'unknown'}.`);
      }
      continue;
    }

    const server = stringValue(item.server, item.server_name, item.mcp_server);
    const tool = stringValue(item.tool, item.name);
    const id = stringValue(item.id);
    const status = stringValue(item.status);

    if (!tool) {
      block('MCP tool call is missing its tool name.');
      continue;
    }
    if (!id) {
      block(`Computer Use call ${tool} is missing a stable item ID.`);
      continue;
    }
    if (server !== 'computer-use') {
      block(`Unexpected MCP server: ${server ?? 'unknown'}.`);
      continue;
    }
    if (!allowedToolNames.has(tool)) {
      block(`Computer Use tool is not allowlisted: ${tool}.`);
      continue;
    }
    if (eventType === 'item.completed' && status && status !== 'completed' && status !== 'success') {
      block(`Computer Use call ${tool} did not complete successfully.`);
    }

    const args = toolArguments(item);
    if (args) {
      callsWithArguments.add(id);
      if (input.expectedBrowserApp) {
        const app = stringValue(args.app);
        if (app !== input.expectedBrowserApp) {
          block(
            `Computer Use call ${tool} targeted ${app ?? 'no app'} instead of assigned ${input.expectedBrowserApp}.`
          );
        }
      }
      for (const reason of validateVisibleInput(tool, args, allowedPlayerKeys)) block(reason);
    }
    const existingTool = toolByCallId.get(id);
    if (existingTool && existingTool !== tool) {
      block(`Computer Use call ID ${id} was reused for ${tool} after ${existingTool}.`);
    }
    if (eventType === 'item.completed') {
      if (completedCallIds.has(id)) {
        block(`Computer Use call ID ${id} has duplicate completion evidence.`);
      }
      completedCallIds.add(id);
      const resultText = toolResultText(item);
      if (permissionOrApprovalBlocked(resultText)) {
        block('Computer Use permission or app-target approval was not ready.');
      }
      if (
        tool === 'get_app_state' &&
        input.expectedMarker &&
        !resultText.includes(input.expectedMarker)
      ) {
        block('Computer Use observation did not contain the assigned visible marker.');
      }
    }
    if (eventType === 'item.started') {
      if (completedCallIds.has(id)) {
        block(`Computer Use call ID ${id} started after its completion evidence.`);
      }
      if (startedCallIds.has(id)) {
        block(`Computer Use call ID ${id} has duplicate start evidence.`);
      }
      startedCallIds.add(id);
    }
    if (!existingTool) toolByCallId.set(id, tool);
    if (!seenCallIds.has(id)) {
      seenCallIds.add(id);
      calls.push(tool);
    }
  }

  for (const line of (input.stderr ?? '').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (
      /^GET-179 Computer Use proxy integrity violation:|^Computer Use proxy failed closed:/i.test(
        trimmed
      )
    ) {
      block(`Computer Use proxy integrity violation: ${trimmed}`);
    }
    if (trimmed && isModelOrConfigWarning(trimmed)) {
      block(`Model/config warning: ${trimmed}`);
    }
  }

  if (input.expectedBrowserApp) {
    for (const id of completedCallIds) {
      if (!callsWithArguments.has(id)) {
        block(`Completed Computer Use call ${id} did not expose auditable arguments.`);
      }
    }
  }
  if (input.complete !== false) {
    for (const id of startedCallIds) {
      if (!completedCallIds.has(id)) {
        block(
          `Computer Use call ${toolByCallId.get(id) ?? 'unknown'} (${id}) has no completion evidence.`
        );
      }
    }
  }

  let observedSinceAction = false;
  let pendingAction: string | undefined;
  for (const tool of calls) {
    if (tool === 'get_app_state') {
      observedSinceAction = true;
      pendingAction = undefined;
      continue;
    }

    if (!observedSinceAction) {
      block(`Computer Use action ${tool} must be preceded by get_app_state.`);
    }
    observedSinceAction = false;
    pendingAction = tool;
  }
  if (pendingAction) {
    block(
      `Computer Use action ${pendingAction} must be followed by get_app_state.`
    );
  }
  if (calls.length === 0) {
    block('Transcript contains no Computer Use observation.');
  }

  return { valid: blockingReasons.length === 0, calls, blockingReasons };
};
