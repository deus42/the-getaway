import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, rm, stat, unlink, writeFile } from 'node:fs/promises';
import { request } from 'node:http';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Browser, Page } from 'playwright';
import type {
  GetawayAgentAction,
  GetawayAgentActionResult,
  GetawayAgentSnapshot,
} from '../../the-getaway/src/game/playtest/agentBridge';
import {
  buildPlaytestMarkdownReport,
  normalizeAiPlaytestFindings,
  type PlaytestTraceEntry,
} from '../../the-getaway/src/game/playtest/reporting';
import {
  parseCodexAgentDecision,
  type AiPlaytestFinding,
  type CodexAgentDecision,
} from '../../the-getaway/src/game/playtest/reportSchema';

type PlaytestProfile = 'guided-level0' | 'stealth-curfew' | 'misuse-regression';

interface RunnerOptions {
  profile: PlaytestProfile;
  maxSteps: number;
  useCodex: boolean;
  baseUrl: string;
  headless: boolean;
}

interface CapturedErrors {
  consoleErrors: string[];
  pageErrors: string[];
  networkErrors: string[];
}

type GuidedLevel0MilestoneId =
  | 'lira-started'
  | 'keycard-collected'
  | 'lira-hand-in-attempted'
  | 'naila-route-reached'
  | 'brant-route-reached'
  | 'recap-reached';

interface MilestoneState {
  completed: GuidedLevel0MilestoneId[];
  blocked?: {
    milestone: GuidedLevel0MilestoneId | string;
    reason: string;
  };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');
const appRoot = path.join(repoRoot, 'the-getaway');
const reportRoot = path.join(repoRoot, 'reports/ai-playtests');
const transientReportRoot = path.join(tmpdir(), 'the-getaway-ai-playtests');
const codexSchemaPath = path.join(__dirname, 'schemas/codex-action.schema.json');
const codexAdvisoryTimeoutMs = 45_000;
const requireFromApp = createRequire(path.join(appRoot, 'package.json'));
const { chromium } = requireFromApp('playwright') as typeof import('playwright');

const defaultOptions: RunnerOptions = {
  profile: 'guided-level0',
  maxSteps: 120,
  useCodex: true,
  baseUrl: 'http://localhost:5174',
  headless: true,
};

const profileGoals: Record<PlaytestProfile, string> = {
  'guided-level0': 'Complete the Level 0 route through Lira, Naila, and Brant while checking guidance, pickups, recap, and mission completion clarity.',
  'stealth-curfew': 'Force night conditions and probe stealth, camera, noise, paranoia, and curfew fairness without mutating game files.',
  'misuse-regression': 'Try wrong-order objective flow, ignored guidance, camera-risk movement, and recovery loops to find regressions.',
};

const parseArgs = (argv: string[]): RunnerOptions => {
  const options = { ...defaultOptions };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === '--profile' && next) {
      if (!['guided-level0', 'stealth-curfew', 'misuse-regression'].includes(next)) {
        throw new Error(`Unknown playtest profile: ${next}`);
      }
      options.profile = next as PlaytestProfile;
      index += 1;
    } else if (arg === '--max-steps' && next) {
      const parsed = Number(next);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error('--max-steps must be a positive number.');
      }
      options.maxSteps = Math.floor(parsed);
      index += 1;
    } else if (arg === '--no-codex') {
      options.useCodex = false;
    } else if (arg === '--codex') {
      options.useCodex = true;
    } else if (arg === '--url' && next) {
      options.baseUrl = next.replace(/\/$/, '');
      index += 1;
    } else if (arg === '--headed') {
      options.headless = false;
    } else if (arg === '--headless') {
      options.headless = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
};

const requestOk = (url: string, timeoutMs = 2_000): Promise<boolean> =>
  new Promise((resolve) => {
    const req = request(url, { method: 'GET', timeout: timeoutMs }, (res) => {
      res.resume();
      resolve(Boolean(res.statusCode && res.statusCode >= 200 && res.statusCode < 500));
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });

const waitForHttp = async (url: string, timeoutMs: number): Promise<void> => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await requestOk(url)) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for dev server at ${url}`);
};

const ensureDevServer = async (baseUrl: string): Promise<() => void> => {
  if (await requestOk(baseUrl)) {
    return () => undefined;
  }

  const child = spawn('yarn', ['dev'], {
    cwd: appRoot,
    env: { ...process.env },
    stdio: 'pipe',
  });

  const output: string[] = [];
  const collect = (chunk: Buffer) => {
    output.push(chunk.toString());
    if (output.length > 80) {
      output.shift();
    }
  };

  child.stdout.on('data', collect);
  child.stderr.on('data', collect);
  child.once('exit', (code) => {
    if (code !== null && code !== 0) {
      output.push(`[dev-server exited with code ${code}]`);
    }
  });

  try {
    await waitForHttp(baseUrl, 30_000);
  } catch (error) {
    child.kill('SIGTERM');
    throw new Error(`${(error as Error).message}\n${output.join('')}`);
  }

  return () => {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  };
};

const createRunId = (profile: PlaytestProfile): string => {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const suffix = createHash('sha1').update(`${profile}-${stamp}`).digest('hex').slice(0, 8);
  return `${stamp}-${profile}-${suffix}`;
};

const setupErrorCapture = (page: Page): CapturedErrors => {
  const captured: CapturedErrors = {
    consoleErrors: [],
    pageErrors: [],
    networkErrors: [],
  };

  page.on('console', (message) => {
    if (message.type() === 'error') {
      const text = message.text();
      if (/WebSocket connection to 'ws:\/\/localhost:5174/i.test(text)) {
        return;
      }
      captured.consoleErrors.push(text);
    }
  });
  page.on('pageerror', (error) => {
    captured.pageErrors.push(error.message);
  });
  page.on('requestfailed', (requestEntry) => {
    const failure = requestEntry.failure();
    captured.networkErrors.push(`${requestEntry.method()} ${requestEntry.url()} ${failure?.errorText ?? 'failed'}`);
  });

  return captured;
};

const waitForAgentBridge = (page: Page): Promise<unknown> =>
  page.waitForFunction(() => Boolean(window.__getawayAgent), null, { timeout: 10_000 });

const evaluateSnapshot = async (page: Page): Promise<GetawayAgentSnapshot> => {
  const directSnapshot = await page.evaluate(() => window.__getawayAgent?.snapshot() ?? null);
  if (directSnapshot) {
    return directSnapshot;
  }

  await waitForAgentBridge(page);
  return page.evaluate(() => window.__getawayAgent!.snapshot());
};

const dispatchAgentAction = async (
  page: Page,
  action: GetawayAgentAction
): Promise<GetawayAgentActionResult> => {
  const directResult = await page.evaluate(
    (nextAction) => window.__getawayAgent?.dispatch(nextAction) ?? null,
    action
  );
  if (directResult) {
    return directResult;
  }

  await waitForAgentBridge(page);
  return page.evaluate((nextAction) => window.__getawayAgent!.dispatch(nextAction), action);
};

const dispatchAgentActionWithRetry = async (
  page: Page,
  action: GetawayAgentAction
): Promise<GetawayAgentActionResult> => {
  try {
    return await dispatchAgentAction(page, action);
  } catch (error) {
    const message = (error as Error).message;
    if (!/Execution context was destroyed|Cannot find context|navigation/i.test(message)) {
      throw error;
    }

    await page.waitForLoadState('domcontentloaded', { timeout: 10_000 }).catch(() => undefined);
    await page.waitForTimeout(750);
    return dispatchAgentAction(page, action);
  }
};

const isCanvasNonBlank = async (page: Page): Promise<boolean> =>
  page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) {
      return false;
    }

    const context = canvas.getContext('2d') ?? canvas.getContext('webgl') ?? canvas.getContext('webgl2');
    if (!context) {
      return canvas.clientWidth > 0 && canvas.clientHeight > 0;
    }

    return canvas.clientWidth > 0 && canvas.clientHeight > 0;
  });

type SnapshotObjective = GetawayAgentSnapshot['objectives'][number];
type SnapshotItem = GetawayAgentSnapshot['items'][number];

const normalizedNeedle = (value: string | null | undefined): string =>
  (value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const collectObjectiveTokens = (objective: SnapshotObjective): string[] => {
  const routeTokens: Record<string, string[]> = {
    'recover-keycard': ['items.corporate_keycard', 'corporate keycard', 'keycard'],
    'obtain-datapad': ['items.encrypted_datapad', 'encrypted datapad', 'datapad'],
    'find-transit-tokens': ['items.transit_tokens', 'transit tokens', 'tokens'],
  };

  return [
    objective.target,
    objective.description,
    ...(routeTokens[objective.objectiveId] ?? []),
  ].map(normalizedNeedle).filter(Boolean);
};

const findCollectObjectiveItem = (
  snapshot: GetawayAgentSnapshot,
  objective: SnapshotObjective | null | undefined
): SnapshotItem | null => {
  if (!objective || objective.type !== 'collect') {
    return null;
  }

  const tokens = collectObjectiveTokens(objective);
  return snapshot.items.find((item) => {
    if (!item.position) {
      return false;
    }

    const itemText = [
      item.id,
      item.definitionId,
      item.resourceKey,
      item.name,
      ...item.tags,
    ].map(normalizedNeedle).join(' ');

    return tokens.some((token) => itemText.includes(token));
  }) ?? null;
};

const guidedRouteObjectiveIds = new Set([
  'recover-keycard',
  'return-to-lira',
  'obtain-datapad',
  'deliver-naila',
  'find-transit-tokens',
  'report-brant',
]);

const chooseGuidedRouteOverride = (
  snapshot: GetawayAgentSnapshot,
  activeObjective: SnapshotObjective | null | undefined
): GetawayAgentAction | null => {
  if (activeObjective && guidedRouteObjectiveIds.has(activeObjective.objectiveId)) {
    return null;
  }

  if (
    objectiveById(snapshot, 'recover-keycard')?.isCompleted &&
    !objectiveById(snapshot, 'return-to-lira')?.isCompleted
  ) {
    return { type: 'interactNpc', role: 'lira' };
  }

  if (objectiveById(snapshot, 'recover-keycard')?.isCompleted && !objectiveById(snapshot, 'deliver-naila')?.isCompleted) {
    return { type: 'interactNpc', role: 'naila' };
  }

  if (objectiveById(snapshot, 'deliver-naila')?.isCompleted && !objectiveById(snapshot, 'report-brant')?.isCompleted) {
    return { type: 'interactNpc', role: 'brant' };
  }

  return null;
};

const chooseDeterministicAction = (
  profile: PlaytestProfile,
  step: number,
  snapshot: GetawayAgentSnapshot,
  trace: PlaytestTraceEntry[] = []
): GetawayAgentAction | null => {
  if (profile === 'stealth-curfew' && step === 0) {
    return { type: 'setClock', phase: 'night' };
  }

  if (profile === 'misuse-regression' && step === 0) {
    return { type: 'focusObjective' };
  }

  const lastTraceAction = trace.at(-1)?.action ?? '';
  const lastActionType = String(parseTraceAction({ step: -1, action: lastTraceAction, result: '' }).type ?? '');
  const activeObjective = snapshot.objectives.find(
    (objective) => objective.isActive && !objective.isCompleted
  );
  const guidedRouteOverride = profile === 'guided-level0'
    ? chooseGuidedRouteOverride(snapshot, activeObjective)
    : null;

  if (
    lastActionType === 'collectItem' ||
    lastActionType === 'clickTile' ||
    (lastActionType === 'interactNpc' && !snapshot.dialogue.active)
  ) {
    return { type: 'waitForPlayerIdle', timeoutMs: 6_000 };
  }

  if (snapshot.world.inCombat) {
    if (!snapshot.world.isPlayerTurn || snapshot.player.actionPoints <= 0) {
      return { type: 'wait', ms: 750 };
    }

    const objectiveItem = findCollectObjectiveItem(snapshot, activeObjective);
    if (objectiveItem?.position) {
      return { type: 'clickTile', position: objectiveItem.position };
    }

    const closestHostile = snapshot.enemies
      .filter((enemy) => enemy.isHostile && enemy.health > 0)
      .sort((a, b) => {
        const distanceA =
          Math.abs(a.position.x - snapshot.player.position.x) +
          Math.abs(a.position.y - snapshot.player.position.y);
        const distanceB =
          Math.abs(b.position.x - snapshot.player.position.x) +
          Math.abs(b.position.y - snapshot.player.position.y);
        return distanceA - distanceB;
      })[0];

    return closestHostile
      ? { type: 'clickTile', position: closestHostile.position }
      : { type: 'wait', ms: 750 };
  }

  const chooseDialogueByText = (patterns: RegExp[]): GetawayAgentAction | null => {
    const match = snapshot.dialogue.options.find((option) =>
      patterns.some((pattern) => pattern.test(option.text))
    );
    return match ? { type: 'chooseDialogueOption', index: match.index } : null;
  };

  if (snapshot.dialogue.active) {
    return chooseDialogueByText([
      /walk me through the cache job/i,
      /cache is back in rebel hands/i,
      /what relic are we lifting today/i,
      /manifests are singing/i,
      /point me toward/i,
      /couriers beat the curfew/i,
      /consider their evidence misplaced/i,
      /fetch the glowing brick/i,
      /stay restless/i,
      /appreciate the starlight/i,
      /keep the network breathing/i,
    ]) ?? { type: 'chooseDialogueOption', index: snapshot.dialogue.options[0]?.index ?? 0 };
  }

  if (guidedRouteOverride) {
    return guidedRouteOverride;
  }

  if (!activeObjective) {
    if (!objectiveById(snapshot, 'recover-keycard')?.isCompleted) {
      return { type: 'interactNpc', role: 'lira' };
    }
    if (!objectiveById(snapshot, 'deliver-naila')?.isCompleted) {
      return { type: 'interactNpc', role: 'naila' };
    }
    if (!objectiveById(snapshot, 'report-brant')?.isCompleted) {
      return { type: 'interactNpc', role: 'brant' };
    }
    return snapshot.mission.pendingAdvance ? null : { type: 'wait', ms: 500 };
  }

  switch (activeObjective.objectiveId) {
    case 'recover-keycard':
      if (!snapshot.world.curfewActive) {
        return { type: 'setClock', phase: 'night' };
      }
      return { type: 'collectItem', role: 'corporate_keycard' };
    case 'return-to-lira':
      return { type: 'interactNpc', role: 'lira' };
    case 'obtain-datapad':
      return { type: 'collectItem', role: 'encrypted_datapad' };
    case 'deliver-naila':
      return { type: 'interactNpc', role: 'naila' };
    case 'find-transit-tokens':
      return { type: 'collectItem', role: 'transit_tokens' };
    case 'report-brant':
      return { type: 'interactNpc', role: 'brant' };
    default:
      return profile === 'guided-level0'
        ? { type: 'focusObjective' }
        : { type: 'wait', ms: 750 };
  }
};

const objectiveById = (snapshot: GetawayAgentSnapshot, objectiveId: string) =>
  snapshot.objectives.find((objective) => objective.objectiveId === objectiveId);

const hasActiveOrCompletedObjective = (snapshot: GetawayAgentSnapshot, objectiveId: string): boolean => {
  const objective = objectiveById(snapshot, objectiveId);
  return Boolean(objective?.isActive || objective?.isCompleted);
};

const traceText = (trace: PlaytestTraceEntry[]): string =>
  trace
    .map((entry) => [
      entry.action,
      entry.result,
      entry.rationale,
      ...(entry.riskNotes ?? []),
    ].filter(Boolean).join(' '))
    .join(' ')
    .toLowerCase();

const parseTraceAction = (entry: PlaytestTraceEntry): Record<string, unknown> => {
  try {
    const parsed = JSON.parse(entry.action);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
};

const traceSinceObjectiveBecameActive = (
  trace: PlaytestTraceEntry[],
  objectiveId: string
): PlaytestTraceEntry[] => {
  const activationIndex = trace.findLastIndex((entry) =>
    entry.result.includes(`afterObjective=${objectiveId}`) &&
    !entry.result.includes(`beforeObjective=${objectiveId}`)
  );
  const firstMentionIndex = trace.findIndex((entry) =>
    entry.result.includes(`beforeObjective=${objectiveId}`) ||
    entry.result.includes(`afterObjective=${objectiveId}`)
  );

  if (activationIndex >= 0) {
    return trace.slice(activationIndex);
  }

  if (firstMentionIndex >= 0) {
    return trace.slice(firstMentionIndex);
  }

  return trace.slice(-8);
};

const countLiraCompletionAttempts = (trace: PlaytestTraceEntry[]): number => {
  const explicitSelections = trace.filter((entry) => {
    const text = [entry.action, entry.result, entry.rationale, ...(entry.riskNotes ?? [])]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return text.includes('choosedialogueoption') &&
      (text.includes('lira') || text.includes('cache is back') || text.includes('completion') || text.includes('hand-in'));
  }).length;
  const objectiveTimeouts = trace.filter((entry) =>
    entry.result.toLowerCase().includes('timed out waiting for objective change from return-to-lira')
  ).length;

  return explicitSelections + objectiveTimeouts;
};

const buildGuidedMilestones = (
  snapshot: GetawayAgentSnapshot,
  trace: PlaytestTraceEntry[]
): MilestoneState => {
  const completed: GuidedLevel0MilestoneId[] = [];
  if (
    hasActiveOrCompletedObjective(snapshot, 'recover-keycard') ||
    traceText(trace).includes('lira')
  ) {
    completed.push('lira-started');
  }
  if (objectiveById(snapshot, 'recover-keycard')?.isCompleted) {
    completed.push('keycard-collected');
  }
  if (countLiraCompletionAttempts(trace) > 0) {
    completed.push('lira-hand-in-attempted');
  }
  if (
    hasActiveOrCompletedObjective(snapshot, 'obtain-datapad') ||
    hasActiveOrCompletedObjective(snapshot, 'deliver-naila') ||
    traceText(trace).includes('naila')
  ) {
    completed.push('naila-route-reached');
  }
  if (
    snapshot.objectives.some((objective) =>
      objective.target.toLowerCase().includes('brant') &&
      (objective.isActive || objective.isCompleted)
    ) ||
    traceText(trace).includes('brant')
  ) {
    completed.push('brant-route-reached');
  }
  if (snapshot.mission.pendingAdvance || snapshot.mission.celebrationAcknowledged) {
    completed.push('recap-reached');
  }

  return { completed };
};

const detectGuidedLevel0Blocker = (
  runId: string,
  snapshot: GetawayAgentSnapshot,
  trace: PlaytestTraceEntry[],
  screenshots: string[]
): AiPlaytestFinding | null => {
  const recoverKeycard = objectiveById(snapshot, 'recover-keycard');
  const returnToLira = objectiveById(snapshot, 'return-to-lira');
  const lira = snapshot.npcs.find((npc) =>
    [npc.id, npc.name, npc.dialogueId].some((value) => value.toLowerCase().includes('lira'))
  );
  const adjacentToLira = Boolean(lira) &&
    Math.abs(snapshot.player.position.x - lira!.position.x) + Math.abs(snapshot.player.position.y - lira!.position.y) <= 1;
  const attempts = countLiraCompletionAttempts(trace);

  if (!recoverKeycard?.isCompleted || !returnToLira?.isActive || returnToLira.isCompleted || !adjacentToLira || attempts < 2) {
    return null;
  }

  const evidence = [
    `recover-keycard is completed; return-to-lira remains active after ${attempts} Lira completion attempt(s).`,
    `Player is adjacent to Lira at ${snapshot.player.position.x},${snapshot.player.position.y}; Lira is at ${lira!.position.x},${lira!.position.y}.`,
    `Active dialogue: ${snapshot.dialogue.active}; current objective id: ${returnToLira.objectiveId}.`,
    ...screenshots.slice(-3),
  ];

  return {
    id: `${runId}-guided-level0-lira-handin-blocker`,
    severity: 'critical',
    category: 'progression',
    title: 'Lira keycard hand-in blocks guided Level 0 progression',
    reproSteps: [
      'Start the guided Level 0 AI playtest route.',
      'Interact with Lira, accept the cache route, switch to night, and collect the Corporate Keycard.',
      'Return adjacent to Lira and select the completion dialogue option.',
      'Repeat the hand-in once or wait for the objective to change.',
      'Observe that return-to-lira stays active and the Naila route does not activate.',
    ],
    expected: 'Completing the Lira hand-in should complete return-to-lira and activate the next guided Naila objective.',
    observed: 'The objective remains on return-to-lira after repeated completion attempts, blocking the guided route.',
    evidence,
    suspectedOwner: 'Level 0 quest/dialogue progression',
    confidence: 0.93,
    dedupeKey: 'guided-level0:lira-handin-stuck',
    findingType: 'gameplay',
    blockingMilestone: 'lira-hand-in-attempted',
    agentConfidenceNotes: 'Generated by runner milestone logic after repeated state-confirmed attempts, not by a single Codex guess.',
    linearSuggestion: {
      title: 'Fix Level 0 Lira keycard hand-in progression',
      description: 'After the Corporate Keycard is collected, selecting Lira completion can leave return-to-lira active and block the Naila route. Verify the Lira dialogue quest effect and objective transition.',
      label: 'Bug',
      priority: 'Urgent',
    },
  };
};

const detectRepeatedObjectiveStall = (
  runId: string,
  snapshot: GetawayAgentSnapshot,
  trace: PlaytestTraceEntry[],
  screenshots: string[]
): AiPlaytestFinding | null => {
  if (snapshot.dialogue.active) {
    return null;
  }

  const activeObjective = snapshot.objectives.find(
    (objective) => objective.isActive && !objective.isCompleted
  ) ?? null;
  if (!activeObjective) {
    return null;
  }

  const objectiveToken = activeObjective.target.toLowerCase().split(/\s+/).at(-1) ?? activeObjective.target.toLowerCase();
  const objectiveTrace = traceSinceObjectiveBecameActive(trace, activeObjective.objectiveId);
  const repeatedActions = objectiveTrace.filter((entry) => {
    const action = parseTraceAction(entry);
    const type = String(action.type ?? '');
    const role = String(action.role ?? action.name ?? action.id ?? '').toLowerCase();
    const result = entry.result.toLowerCase();
    const sameObjectiveNoProgress =
      entry.result.includes(`beforeObjective=${activeObjective.objectiveId}`) &&
      entry.result.includes(`afterObjective=${activeObjective.objectiveId}`) &&
      (entry.result.includes('stateChanged=false') || type === 'collectItem');
    return (
      (type === 'collectItem' || type === 'interactNpc' || type === 'clickTile') &&
      (
        role.includes(objectiveToken) ||
        result.includes(activeObjective.target.toLowerCase()) ||
        sameObjectiveNoProgress
      )
    );
  });
  const settledWaits = objectiveTrace.filter((entry) => {
    const action = parseTraceAction(entry);
    return action.type === 'waitForPlayerIdle' && entry.result.includes('stateChanged=false');
  });

  if (repeatedActions.length < 3 || settledWaits.length < 2) {
    return null;
  }

  const stalledInCombat = snapshot.world.inCombat;
  const dedupeKey = `guided-level0:${activeObjective.objectiveId}-stall`;
  return {
    id: `${runId}-${activeObjective.objectiveId}-stall`,
    severity: stalledInCombat ? 'medium' : activeObjective.objectiveId === 'recover-keycard' ? 'high' : 'medium',
    category: stalledInCombat ? 'agent-strategy' : 'progression',
    title: stalledInCombat
      ? `AI playtest route stalls in combat before ${activeObjective.description}`
      : `Guided Level 0 stalls on ${activeObjective.description}`,
    reproSteps: [
      'Start the guided Level 0 AI playtest route.',
      `Advance until the active objective is ${activeObjective.objectiveId}.`,
      `Repeat the semantic action for ${activeObjective.target} and wait for the player to settle.`,
      'Observe that the active objective and objective count do not change.',
    ],
    expected: stalledInCombat
      ? 'The AI playtest strategy should resolve or avoid combat before treating the objective as a gameplay blocker.'
      : 'Repeated semantic actions should either advance the objective or produce a clear recoverable next step.',
    observed: stalledInCombat
      ? `${activeObjective.objectiveId} stayed active while the agent was in combat after ${repeatedActions.length} action attempts and ${settledWaits.length} idle waits.`
      : `${activeObjective.objectiveId} stayed active after ${repeatedActions.length} matching action attempts and ${settledWaits.length} idle waits.`,
    evidence: [
      `Active objective: ${activeObjective.objectiveId}; count ${activeObjective.currentCount ?? 0}/${activeObjective.count ?? 1}; target ${activeObjective.target}.`,
      `World state: inCombat=${snapshot.world.inCombat}; globalAlertLevel=${snapshot.world.globalAlertLevel}; player=${snapshot.player.position.x},${snapshot.player.position.y}.`,
      `Recent logs: ${snapshot.recentLogs.slice(-3).join(' | ')}`,
      ...screenshots.slice(-3),
    ],
    suspectedOwner: stalledInCombat ? 'AI playtest combat strategy' : 'Level 0 objective routing',
    confidence: stalledInCombat ? 0.86 : activeObjective.objectiveId === 'recover-keycard' ? 0.9 : 0.82,
    dedupeKey,
    findingType: stalledInCombat ? 'agent-strategy' : 'gameplay',
    mergedFrom: [],
    blockingMilestone: activeObjective.objectiveId,
    agentConfidenceNotes: stalledInCombat
      ? 'Generated by runner early-stop logic; classified as strategy because combat was active when the stall was detected.'
      : 'Generated by runner early-stop logic after repeated no-progress semantic actions.',
    linearSuggestion: {
      title: stalledInCombat
        ? `Improve AI playtest combat handling before ${activeObjective.objectiveId}`
        : `Fix guided Level 0 ${activeObjective.objectiveId} stall`,
      description: stalledInCombat
        ? `${activeObjective.objectiveId} remained active while the AI playtest fallback was in combat. Add stronger combat tactics or an explicit combat action bridge before filing this as a gameplay blocker.`
        : `${activeObjective.objectiveId} remained active after repeated semantic action attempts during AI playtest. Review objective routing, combat lockout, and recovery guidance for this step.`,
      label: stalledInCombat ? 'Improvement' : 'Bug',
      priority: stalledInCombat ? 'Medium' : activeObjective.objectiveId === 'recover-keycard' ? 'High' : 'Medium',
    },
  };
};

const buildCodexObservation = (
  snapshot: GetawayAgentSnapshot,
  trace: PlaytestTraceEntry[]
) => {
  const activeObjective = snapshot.objectives.find(
    (objective) => objective.isActive && !objective.isCompleted
  ) ?? null;
  const namedContacts = snapshot.npcs
    .filter((npc) => /lira|naila|brant/i.test(`${npc.name} ${npc.dialogueId}`))
    .map((npc) => ({
      id: npc.id,
      name: npc.name,
      dialogueId: npc.dialogueId,
      position: npc.position,
      distance: Math.abs(snapshot.player.position.x - npc.position.x) +
        Math.abs(snapshot.player.position.y - npc.position.y),
    }));
  const questItems = snapshot.items
    .filter((item) => item.isQuestItem)
    .map((item) => ({
      id: item.id,
      definitionId: item.definitionId,
      name: item.name,
      position: item.position,
      tags: item.tags,
    }));
  const keyObjectives = snapshot.objectives
    .filter((objective) =>
      [
        'recover-keycard',
        'return-to-lira',
        'obtain-datapad',
        'deliver-naila',
        'find-transit-tokens',
        'report-brant',
      ].includes(objective.objectiveId)
    )
    .map((objective) => ({
      id: objective.objectiveId,
      questId: objective.questId,
      description: objective.description,
      type: objective.type,
      target: objective.target,
      currentCount: objective.currentCount,
      count: objective.count,
      isActive: objective.isActive,
      isCompleted: objective.isCompleted,
    }));

  return {
    player: {
      position: snapshot.player.position,
      health: snapshot.player.health,
      stamina: snapshot.player.stamina,
      stealth: snapshot.player.stealthModeEnabled,
      inventoryCount: snapshot.player.inventoryCount,
    },
    world: {
      timeOfDay: snapshot.world.timeOfDay,
      curfewActive: snapshot.world.curfewActive,
      inCombat: snapshot.world.inCombat,
      isPlayerTurn: snapshot.world.isPlayerTurn,
      globalAlertLevel: snapshot.world.globalAlertLevel,
      nearbyWalkableTiles: snapshot.world.map.nearbyWalkableTiles.slice(0, 8),
    },
    nearbyHostiles: snapshot.enemies
      .filter((enemy) => enemy.isHostile && enemy.health > 0)
      .map((enemy) => ({
        id: enemy.id,
        name: enemy.name,
        position: enemy.position,
        health: enemy.health,
      }))
      .slice(0, 5),
    activeObjective,
    keyObjectives,
    namedContacts,
    questItems,
    dialogue: snapshot.dialogue,
    stealth: snapshot.stealth,
    mission: {
      pendingAdvance: snapshot.mission.pendingAdvance,
      celebrationAcknowledged: snapshot.mission.celebrationAcknowledged,
    },
    recentLogs: snapshot.recentLogs.slice(-5),
    recentActions: trace.slice(-5),
  };
};

const formatPrompt = (
  options: RunnerOptions,
  step: number,
  snapshot: GetawayAgentSnapshot,
  trace: PlaytestTraceEntry[]
): string => [
  'You are an expert QA gamer controlling The Getaway through a constrained Playwright bridge.',
  'Return only JSON matching getaway_codex_action_v1. Do not edit files, run commands, create issues, or ask questions.',
  `Profile: ${options.profile}`,
  `Goal: ${profileGoals[options.profile]}`,
  `Step: ${step + 1} of ${options.maxSteps}`,
  `Milestones: ${JSON.stringify(options.profile === 'guided-level0' ? buildGuidedMilestones(snapshot, trace) : { completed: [] })}`,
  'Allowed actions: startLevel0, interactNpc, collectItem, waitForDialogue, waitForObjectiveChange, waitForPlayerIdle, clickTile, focusObjective, toggleStealth, chooseDialogueOption, setClock, wait.',
  'The action object must always include type, name, id, role, position, index, phase, ms, timeoutMs, and fromId. For unused fields use empty strings, position {"x":0,"y":0}, index 0, phase "midday", ms 500, and timeoutMs 3000.',
  'Every candidate finding must include dedupeKey, findingType, mergedFrom, blockingMilestone, and agentConfidenceNotes. Use dedupeKey "" to let the runner infer it, findingType "gameplay" for game defects, mergedFrom [], and empty strings for unused text fields.',
  'Dialogue option indexes are zero-based and must match the snapshot dialogue.options[].index value, not the visible UI badge.',
  'Expert play policy: prefer semantic actions over raw tile clicks; after interacting with an NPC, waitForDialogue; after quest-effect dialogue options, waitForObjectiveChange using the previous active objective id; after movement, waitForPlayerIdle.',
  'Do not repeat a failed hand-in more than twice. If repeated snapshots prove a blocker, return a finding and choose waitForObjectiveChange or wait instead of thrashing.',
  'Prefer completing the current objective, then probing clarity/fairness regressions. Candidate findings must be evidence-backed and dedupe-friendly.',
  '',
  'Current tactical observation:',
  JSON.stringify(buildCodexObservation(snapshot, trace), null, 2),
  '',
  'Recent trace:',
  JSON.stringify(trace.slice(-8), null, 2),
].join('\n');

const shouldConsultCodex = (options: RunnerOptions, step: number): boolean =>
  options.useCodex && (step === 0 || step % 12 === 0);

const runCodex = async (
  options: RunnerOptions,
  step: number,
  snapshot: GetawayAgentSnapshot,
  trace: PlaytestTraceEntry[],
  screenshotPath: string
): Promise<CodexAgentDecision> => {
  const outputPath = path.join(transientReportRoot, `.codex-action-${process.pid}-${step}.json`);
  const args = [
    'exec',
    '--ephemeral',
    '--ignore-user-config',
    '--ignore-rules',
    '--cd',
    repoRoot,
    '--sandbox',
    'read-only',
    '-c',
    'approval_policy="never"',
    '--output-schema',
    codexSchemaPath,
    '-i',
    screenshotPath,
    '--output-last-message',
    outputPath,
    '--color',
    'never',
    '-',
  ];

  const child = spawn('/opt/homebrew/bin/codex', args, {
    cwd: repoRoot,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  const stderr: string[] = [];
  child.stdout.on('data', () => undefined);
  child.stderr.on('data', (chunk: Buffer) => stderr.push(chunk.toString()));
  child.stdin.end(formatPrompt(options, step, snapshot, trace));

  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeout);
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    };
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), 2_000).unref();
      finish(new Error(`codex exec timed out after ${codexAdvisoryTimeoutMs}ms: ${stderr.join('')}`));
    }, codexAdvisoryTimeoutMs);
    child.once('error', finish);
    child.once('exit', (code) => {
      if (code === 0) {
        finish();
      } else {
        finish(new Error(`codex exec failed with code ${code}: ${stderr.join('')}`));
      }
    });
  });

  const output = await readFile(outputPath, 'utf8');
  await unlink(outputPath).catch(() => undefined);
  return parseCodexAgentDecision(output);
};

const buildToolingFinding = (
  runId: string,
  title: string,
  observed: string,
  evidence: string[]
): AiPlaytestFinding => ({
  id: `${runId}-tooling-${createHash('sha1').update(title + observed).digest('hex').slice(0, 6)}`,
  severity: 'medium',
  category: 'tooling',
  title,
  reproSteps: [
    'Run the AI playtest agent with the same profile and max step count.',
    'Review the generated trace and captured browser error evidence.',
  ],
  expected: 'The playtest harness should run without browser console, page, or network failures.',
  observed,
  evidence,
  suspectedOwner: 'AI playtest harness',
  confidence: 0.82,
  linearSuggestion: {
    title,
    description: observed,
    label: 'Bug',
    priority: 'Medium',
  },
});

const buildCodexFailureFinding = (
  runId: string,
  error: unknown,
  evidence: string[]
): AiPlaytestFinding => {
  const rawMessage = (error as Error).message;
  const retryMatch = rawMessage.match(/You've hit your usage limit\.[^\n]+/);
  const schemaMatch = rawMessage.match(/invalid_json_schema[^\n]+/);
  const timeoutMatch = rawMessage.match(/codex exec timed out after \d+ms/);
  const conciseMessage = retryMatch?.[0] ?? timeoutMatch?.[0] ?? schemaMatch?.[0] ?? rawMessage.split('\n').slice(0, 3).join(' ');

  return {
    id: `${runId}-tooling-${createHash('sha1').update(conciseMessage).digest('hex').slice(0, 6)}`,
    severity: retryMatch || timeoutMatch ? 'low' : 'medium',
    category: 'tooling',
    title: 'Codex advisory step unavailable',
    reproSteps: [
      'Run the AI playtest agent with --codex.',
      'Observe whether local codex exec returns a valid getaway_codex_action_v1 response.',
    ],
    expected: 'The local Codex CLI should return a strict planner action or the runner should fall back cleanly.',
    observed: `Codex advisory failed; deterministic bridge action continued. ${conciseMessage}`,
    evidence,
    suspectedOwner: 'Local Codex CLI/auth/config',
    confidence: 0.9,
    dedupeKey: 'tooling:codex-advisory-unavailable',
    findingType: 'tooling',
    mergedFrom: [],
    blockingMilestone: '',
    agentConfidenceNotes: retryMatch
      ? 'Local Codex usage limit was reached; game/browser automation still completed via deterministic fallback.'
      : 'The runner continued with deterministic bridge actions after Codex failed.',
    linearSuggestion: {
      title: 'Make Codex advisory failures concise in AI playtest reports',
      description: `Codex advisory failed during a playtest run: ${conciseMessage}`,
      label: 'Improvement',
        priority: retryMatch || timeoutMatch ? 'Low' : 'Medium',
    },
  };
};

const writeReport = async (
  runId: string,
  options: RunnerOptions,
  findings: AiPlaytestFinding[],
  screenshots: string[],
  trace: PlaytestTraceEntry[],
  captured: CapturedErrors,
  milestones: MilestoneState,
  earlyStopReason: string
): Promise<string> => {
  const generatedAt = new Date().toISOString();
  const reportPath = path.join(reportRoot, `${runId}.md`);
  const normalizedFindings = normalizeAiPlaytestFindings(findings);
  const summary =
    normalizedFindings.length === 0
      ? `Profile ${options.profile} completed without confirmed findings.`
      : `Profile ${options.profile} completed with ${normalizedFindings.length} normalized finding(s).`;

  const markdown = buildPlaytestMarkdownReport({
    runId,
    profile: options.profile,
    generatedAt,
    summary,
    scorecard: {
      profileGoal: profileGoals[options.profile],
      stepsExecuted: trace.length,
      findings: normalizedFindings.length,
      milestonesCompleted: milestones.completed.join(', ') || 'none',
      blockedMilestone: milestones.blocked?.milestone ?? 'none',
      earlyStopReason: earlyStopReason || 'none',
      consoleErrors: captured.consoleErrors.length,
      pageErrors: captured.pageErrors.length,
      networkErrors: captured.networkErrors.length,
      codexMode: options.useCodex ? 'enabled' : 'disabled',
    },
    findings: normalizedFindings,
    screenshots,
    trace,
  });

  await mkdir(reportRoot, { recursive: true });
  await writeFile(reportPath, markdown, 'utf8');
  return reportPath;
};

const collectFileSize = async (filePath: string): Promise<number> => {
  try {
    const info = await stat(filePath);
    return info.size;
  } catch {
    return 0;
  }
};

const run = async () => {
  const options = parseArgs(process.argv.slice(2));
  const runId = createRunId(options.profile);
  const runDir = path.join(reportRoot, runId);
  const tempRunDir = path.join(transientReportRoot, runId);
  await rm(tempRunDir, { recursive: true, force: true });
  await mkdir(tempRunDir, { recursive: true });
  await mkdir(transientReportRoot, { recursive: true });
  await mkdir(reportRoot, { recursive: true });

  const stopServer = await ensureDevServer(options.baseUrl);
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({ headless: options.headless });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 980 },
      deviceScaleFactor: 1,
    });
    await context.addInitScript(() => {
      window.localStorage.clear();
    });

    const page = await context.newPage();
    const captured = setupErrorCapture(page);
    const url = `${options.baseUrl}/?agent=1&agentStart=level0&fresh=1`;
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => Boolean(window.__getawayAgent), null, { timeout: 10_000 });
    await page.waitForFunction(
      () => Array.from(document.querySelectorAll('canvas')).some(
        (canvas) => canvas.clientWidth > 0 && canvas.clientHeight > 0
      ),
      null,
      { timeout: 20_000 }
    );
    await page.waitForTimeout(1_000);

    const trace: PlaytestTraceEntry[] = [];
    const findings: AiPlaytestFinding[] = [];
    const screenshots: string[] = [];
    let latestScreenshotPath: string | null = null;
    let latestScreenshotEvidencePath = '';
    let screenshotNonBlank = false;
    let earlyStopReason = '';
    let latestMilestones: MilestoneState = { completed: [] };

    for (let step = 0; step < options.maxSteps; step += 1) {
      let snapshot: GetawayAgentSnapshot;
      try {
        if (page.isClosed()) {
          throw new Error('Playwright page is closed.');
        }
        snapshot = await evaluateSnapshot(page);
      } catch (error) {
        const message = `Browser page or agent bridge became unavailable before step ${step}: ${(error as Error).message}`;
        findings.push(buildToolingFinding(
          runId,
          'Browser page closed during AI playtest',
          message,
          screenshots.slice(-3)
        ));
        earlyStopReason = message;
        break;
      }

      latestMilestones = options.profile === 'guided-level0'
        ? buildGuidedMilestones(snapshot, trace)
        : { completed: [] };
      const screenshotName = `step-${String(step).padStart(3, '0')}.png`;
      const screenshotPath = path.join(tempRunDir, screenshotName);
      const screenshotEvidencePath = path.relative(repoRoot, path.join(runDir, screenshotName));
      let actionScreenshotPath = latestScreenshotPath;
      let actionScreenshotEvidencePath = latestScreenshotEvidencePath || screenshotEvidencePath;
      try {
        await page.screenshot({
          path: screenshotPath,
          fullPage: false,
          animations: 'disabled',
          timeout: 5_000,
        });
        screenshots.push(screenshotEvidencePath);
        latestScreenshotPath = screenshotPath;
        latestScreenshotEvidencePath = screenshotEvidencePath;
        actionScreenshotPath = screenshotPath;
        actionScreenshotEvidencePath = screenshotEvidencePath;
        const screenshotSize = await collectFileSize(screenshotPath);
        let canvasNonBlank = false;
        try {
          canvasNonBlank = await isCanvasNonBlank(page);
        } catch {
          canvasNonBlank = false;
        }
        screenshotNonBlank = screenshotNonBlank || canvasNonBlank || screenshotSize > 8_000;
      } catch {
      }

      const deterministicAction = chooseDeterministicAction(options.profile, step, snapshot, trace);
      let decision: CodexAgentDecision | null = null;
      if (shouldConsultCodex(options, step) && actionScreenshotPath) {
        try {
          decision = await runCodex(options, step, snapshot, trace, actionScreenshotPath);
        } catch (error) {
          findings.push(buildCodexFailureFinding(
            runId,
            error,
            [actionScreenshotEvidencePath].filter(Boolean)
          ));
        }
      }
      const shouldUseCodexAction = options.profile !== 'guided-level0';
      const action = shouldUseCodexAction
        ? decision?.action ?? deterministicAction ?? null
        : deterministicAction ?? decision?.action ?? null;
      const actionDecision = decision?.action === action ? decision : null;
      if (!action) {
        break;
      }

      let actionResult: GetawayAgentActionResult;
      try {
        actionResult = await dispatchAgentActionWithRetry(page, action);
      } catch (error) {
        const message = `Agent action failed at step ${step}: ${(error as Error).message}`;
        findings.push(buildToolingFinding(
          runId,
          `Agent action failed: ${action.type}`,
          message,
          [actionScreenshotEvidencePath].filter(Boolean)
        ));
        earlyStopReason = message;
        break;
      }
      trace.push({
        step,
        action: JSON.stringify(action),
        result: [
          actionResult.message,
          `status=${actionResult.status}`,
          `beforeObjective=${actionResult.beforeObjectiveId ?? 'none'}`,
          `afterObjective=${actionResult.afterObjectiveId ?? 'none'}`,
          `stateChanged=${actionResult.stateChanged}`,
          `evidence=${actionResult.evidenceHint}`,
        ].join(' | '),
        rationale: actionDecision?.rationale,
        screenshot: actionScreenshotEvidencePath,
        riskNotes: actionDecision?.riskNotes,
      });

      const recoverableDialogueRejection =
        action.type === 'chooseDialogueOption' &&
        /no active dialogue option/i.test(actionResult.message);
      const snapshotActiveObjectiveId = snapshot.objectives.find(
        (objective) => objective.isActive && !objective.isCompleted
      )?.objectiveId ?? 'none';
      const recoverableStaleCollectRejection =
        action.type === 'collectItem' &&
        /no matching collectable map item/i.test(actionResult.message) &&
        Boolean(actionResult.beforeObjectiveId) &&
        actionResult.beforeObjectiveId !== snapshotActiveObjectiveId;
      const expectedMisuseFocusRejection =
        options.profile === 'misuse-regression' &&
        action.type === 'focusObjective' &&
        /no active objective target position/i.test(actionResult.message);
      if (
        actionResult.status === 'rejected' &&
        !recoverableDialogueRejection &&
        !recoverableStaleCollectRejection &&
        !expectedMisuseFocusRejection
      ) {
        findings.push(buildToolingFinding(
          runId,
          `Agent action rejected: ${action.type}`,
          actionResult.message,
          [actionScreenshotEvidencePath].filter(Boolean)
        ));
      }

      if (decision?.candidateFindings.length) {
        findings.push(...decision.candidateFindings);
      }

      let nextSnapshot: GetawayAgentSnapshot;
      try {
        nextSnapshot = actionResult.snapshot ?? (await evaluateSnapshot(page));
      } catch (error) {
        const message = `Browser page or agent bridge became unavailable after step ${step}: ${(error as Error).message}`;
        findings.push(buildToolingFinding(
          runId,
          'Browser page closed after agent action',
          message,
          screenshots.slice(-3)
        ));
        earlyStopReason = message;
        break;
      }
      latestMilestones = options.profile === 'guided-level0'
        ? buildGuidedMilestones(nextSnapshot, trace)
        : { completed: [] };
      const blocker = options.profile === 'guided-level0'
        ? detectGuidedLevel0Blocker(runId, nextSnapshot, trace, screenshots)
        : null;
      const repeatedStall = options.profile === 'guided-level0'
        ? detectRepeatedObjectiveStall(runId, nextSnapshot, trace, screenshots)
        : null;
      const earlyBlocker = blocker ?? repeatedStall;
      if (earlyBlocker) {
        findings.push(earlyBlocker);
        latestMilestones = {
          ...latestMilestones,
          blocked: {
            milestone: earlyBlocker.blockingMilestone ?? 'unknown',
            reason: earlyBlocker.title,
          },
        };
        earlyStopReason = earlyBlocker.title;
        break;
      }

      if (options.profile === 'guided-level0' && nextSnapshot.mission.pendingAdvance) {
        earlyStopReason = 'Mission pending advance reached.';
        break;
      }

    }

    if (!screenshotNonBlank) {
      findings.push(buildToolingFinding(
        runId,
        'Screenshot or canvas appeared blank',
        'The runner could not confirm a nonblank canvas/screenshot during smoke execution.',
        screenshots
      ));
    }

    const browserEvidence = [
      ...captured.consoleErrors.map((entry) => `console: ${entry}`),
      ...captured.pageErrors.map((entry) => `page: ${entry}`),
      ...captured.networkErrors.map((entry) => `network: ${entry}`),
    ];
    if (browserEvidence.length > 0) {
      findings.push(buildToolingFinding(
        runId,
        'Browser errors during AI playtest',
        'The browser emitted console, page, or network errors during the playtest run.',
        browserEvidence.slice(0, 12)
      ));
    }

    const normalizedFindings = normalizeAiPlaytestFindings(findings);
    await rm(runDir, { recursive: true, force: true });
    await cp(tempRunDir, runDir, { recursive: true });
    const reportPath = await writeReport(
      runId,
      options,
      normalizedFindings,
      screenshots,
      trace,
      captured,
      latestMilestones,
      earlyStopReason
    );
    console.log(JSON.stringify({
      runId,
      profile: options.profile,
      reportPath,
      screenshots: screenshots.length,
      findings: normalizedFindings.length,
      codexMode: options.useCodex,
      earlyStopReason: earlyStopReason || null,
      milestones: latestMilestones,
    }, null, 2));
  } finally {
    if (browser) {
      await browser.close();
    }
    stopServer();
    await rm(tempRunDir, { recursive: true, force: true }).catch(() => undefined);
  }
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
