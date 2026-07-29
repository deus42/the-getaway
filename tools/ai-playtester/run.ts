import { spawn } from 'node:child_process';
import type { ChildProcessWithoutNullStreams } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, rm, unlink, writeFile } from 'node:fs/promises';
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
  buildAgentCombatTraceNote,
  chooseAgentCombatAction,
  countNoProgressActionTraces,
  isAgentCombatTraceResult,
  isObjectiveStallRetryTrace,
} from '../../the-getaway/src/game/playtest/agentCombatStrategy';
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

type PlaytestProfile = 'guided-level0' | 'stealth-curfew' | 'misuse-regression' | 'mission-terminal';

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
  | 'recap-reached'
  | 'mission-advanced';

const guidedLevel0MilestoneOrder: GuidedLevel0MilestoneId[] = [
  'lira-started',
  'keycard-collected',
  'lira-hand-in-attempted',
  'naila-route-reached',
  'brant-route-reached',
  'recap-reached',
  'mission-advanced',
];

interface MilestoneState {
  completed: string[];
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
  'guided-level0': 'Complete the Level 0 route through Lira, Naila, and Brant while checking guidance, pickups, recap, mission completion clarity, and the final mission advance.',
  'stealth-curfew': 'Force night conditions and probe stealth, camera, noise, paranoia, and curfew fairness without mutating game files.',
  'misuse-regression': 'Try wrong-order objective flow, ignored guidance, camera-risk movement, and recovery loops to find regressions.',
  'mission-terminal': 'Exercise mission failure, retry reset, and fresh Level 0 restart without using player-facing HUD layout changes.',
};

const parseArgs = (argv: string[]): RunnerOptions => {
  const options = { ...defaultOptions };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === '--profile' && next) {
      if (!['guided-level0', 'stealth-curfew', 'misuse-regression', 'mission-terminal'].includes(next)) {
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

interface DevServerHandle {
  ensureAlive: () => Promise<void>;
  stop: () => void;
}

const ensureDevServer = async (baseUrl: string): Promise<DevServerHandle> => {
  let child: ChildProcessWithoutNullStreams | null = null;
  let childExited = false;
  const output: string[] = [];

  const collect = (chunk: Buffer): void => {
    output.push(chunk.toString());
    if (output.length > 80) {
      output.shift();
    }
  };

  const startOwnedServer = async (): Promise<void> => {
    child = spawn('yarn', ['dev'], {
      cwd: appRoot,
      env: { ...process.env },
      stdio: 'pipe',
    });
    childExited = false;

    child.stdout.on('data', collect);
    child.stderr.on('data', collect);
    child.once('exit', (code) => {
      childExited = true;
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
  };

  const ensureAlive = async (): Promise<void> => {
    if (await requestOk(baseUrl)) {
      return;
    }

    if (child && !child.killed && !childExited) {
      child.kill('SIGTERM');
    }
    await startOwnedServer();
  };

  await ensureAlive();

  return {
    ensureAlive,
    stop: () => {
      if (child && !child.killed && !childExited) {
        child.kill('SIGTERM');
      }
    },
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

const evaluateSnapshotWithRetry = async (page: Page): Promise<GetawayAgentSnapshot> => {
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await evaluateSnapshot(page);
    } catch (error) {
      lastError = error;
      const message = (error as Error).message;
      const retryableNavigation =
        /Execution context was destroyed|most likely because of a navigation|Cannot find context/i.test(message);

      if (!retryableNavigation || page.isClosed()) {
        throw error;
      }

      await page.waitForLoadState('domcontentloaded', { timeout: 5_000 }).catch(() => undefined);
      await waitForAgentBridge(page).catch(() => undefined);
      await page.waitForTimeout(250);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Unable to evaluate agent snapshot.');
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

    const sourceWidth = canvas.width;
    const sourceHeight = canvas.height;
    if (canvas.clientWidth <= 0 || canvas.clientHeight <= 0 || sourceWidth <= 0 || sourceHeight <= 0) {
      return false;
    }

    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = Math.min(96, sourceWidth);
    sampleCanvas.height = Math.min(72, sourceHeight);
    const context = sampleCanvas.getContext('2d', { willReadFrequently: true });
    if (!context) {
      return false;
    }

    try {
      context.drawImage(canvas, 0, 0, sampleCanvas.width, sampleCanvas.height);
      const pixels = context.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height).data;
      const colorBuckets = new Set<string>();
      let visibleSamples = 0;
      let nonDarkSamples = 0;

      for (let index = 0; index < pixels.length; index += 16) {
        const red = pixels[index] ?? 0;
        const green = pixels[index + 1] ?? 0;
        const blue = pixels[index + 2] ?? 0;
        const alpha = pixels[index + 3] ?? 0;
        if (alpha < 8) {
          continue;
        }

        visibleSamples += 1;
        const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
        if (luminance > 30) {
          nonDarkSamples += 1;
        }
        colorBuckets.add(`${red >> 4}:${green >> 4}:${blue >> 4}`);
      }

      return visibleSamples > 0 &&
        nonDarkSamples / visibleSamples > 0.08 &&
        colorBuckets.size >= 8;
    } catch {
      return false;
    }
  });

const waitForCanvasNonBlank = async (page: Page, timeoutMs = 15_000): Promise<boolean> => {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (await isCanvasNonBlank(page)) {
      return true;
    }
    await page.waitForTimeout(250);
  }

  return false;
};

const isScreenshotPlayfieldNonBlank = async (
  page: Page,
  screenshotBytes: Uint8Array
): Promise<boolean> => {
  const dataUrl = `data:image/png;base64,${Buffer.from(screenshotBytes).toString('base64')}`;
  return page.evaluate(async (sourceUrl) => {
    const image = new Image();
    const loaded = new Promise<boolean>((resolve) => {
      image.onload = () => resolve(true);
      image.onerror = () => resolve(false);
    });
    image.src = sourceUrl;

    if (!(await loaded) || image.naturalWidth <= 0 || image.naturalHeight <= 0) {
      return false;
    }

    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 128;
    sampleCanvas.height = 92;
    const context = sampleCanvas.getContext('2d', { willReadFrequently: true });
    if (!context) {
      return false;
    }

    const sourceX = Math.floor(image.naturalWidth * 0.14);
    const sourceY = Math.floor(image.naturalHeight * 0.1);
    const sourceWidth = Math.max(1, Math.floor(image.naturalWidth * 0.72));
    const sourceHeight = Math.max(1, Math.floor(image.naturalHeight * 0.58));

    try {
      context.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        sampleCanvas.width,
        sampleCanvas.height
      );
      const pixels = context.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height).data;
      const colorBuckets = new Set<string>();
      let visibleSamples = 0;
      let nonDarkSamples = 0;

      for (let index = 0; index < pixels.length; index += 16) {
        const red = pixels[index] ?? 0;
        const green = pixels[index + 1] ?? 0;
        const blue = pixels[index + 2] ?? 0;
        const alpha = pixels[index + 3] ?? 0;
        if (alpha < 8) {
          continue;
        }

        visibleSamples += 1;
        const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
        if (luminance > 30) {
          nonDarkSamples += 1;
        }
        colorBuckets.add(`${red >> 4}:${green >> 4}:${blue >> 4}`);
      }

      return visibleSamples > 0 &&
        nonDarkSamples / visibleSamples > 0.08 &&
        colorBuckets.size >= 8;
    } catch {
      return false;
    }
  }, dataUrl);
};

const waitForPlayfieldScreenshotNonBlank = async (
  page: Page,
  timeoutMs = 15_000
): Promise<boolean> => {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const screenshot = await page.screenshot({
        fullPage: false,
        animations: 'disabled',
        timeout: 5_000,
      });
      if (await isScreenshotPlayfieldNonBlank(page, screenshot)) {
        return true;
      }
    } catch {
    }
    await page.waitForTimeout(250);
  }

  return false;
};

type SnapshotObjective = GetawayAgentSnapshot['objectives'][number];

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

const isObjectiveCompleteFromSnapshotOrTrace = (
  snapshot: GetawayAgentSnapshot,
  trace: PlaytestTraceEntry[],
  objectiveId: string
): boolean => {
  if (objectiveById(snapshot, objectiveId)?.isCompleted) {
    return true;
  }

  return trace.some((entry) =>
    entry.result.includes(`beforeObjective=${objectiveId}`) &&
    !entry.result.includes(`afterObjective=${objectiveId}`) &&
    entry.result.includes('stateChanged=true')
  );
};

const distanceBetweenPositions = (
  left: GetawayAgentSnapshot['player']['position'],
  right: GetawayAgentSnapshot['player']['position']
): number => {
  const dx = left.x - right.x;
  const dy = left.y - right.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const chooseCameraEscapeTile = (snapshot: GetawayAgentSnapshot): GetawayAgentAction | null => {
  const camera = snapshot.cameras.find((candidate) => candidate.id === snapshot.stealth.activeCameraId) ??
    snapshot.cameras
      .filter((candidate) => candidate.isActive)
      .sort((left, right) => right.detectionProgress - left.detectionProgress)[0];

  if (!camera) {
    return null;
  }

  const currentDistance = distanceBetweenPositions(snapshot.player.position, camera.position);
  const escapeTile = [...snapshot.world.map.nearbyWalkableTiles]
    .filter((tile) => distanceBetweenPositions(tile, camera.position) > currentDistance + 0.5)
    .sort((left, right) =>
      distanceBetweenPositions(right, camera.position) -
      distanceBetweenPositions(left, camera.position)
    )[0];

  return escapeTile ? { type: 'clickTile', position: escapeTile } : null;
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

  if (profile === 'mission-terminal') {
    if (step === 0 && !snapshot.overlays.missionFailureOpen) {
      return { type: 'triggerMissionFailure' };
    }
    if (snapshot.overlays.missionFailureOpen || snapshot.player.health <= 0) {
      return { type: 'retryMission' };
    }

    const retried = trace.some((entry) => parseTraceAction(entry).type === 'retryMission');
    const restarted = trace.some((entry) => parseTraceAction(entry).type === 'startLevel0');
    if (retried && !restarted) {
      return { type: 'startLevel0', name: 'Agent' };
    }

    return { type: 'wait', ms: 500 };
  }

  const lastTraceEntry = trace.at(-1);
  const lastTraceAction = lastTraceEntry?.action ?? '';
  const lastActionType = String(parseTraceAction({ step: -1, action: lastTraceAction, result: '' }).type ?? '');
  const lastWasCombatStrategy = lastTraceEntry ? isAgentCombatTraceResult(lastTraceEntry.result) : false;
  const activeObjective = snapshot.objectives.find(
    (objective) => objective.isActive && !objective.isCompleted
  );
  const guidedRouteOverride = profile === 'guided-level0'
    ? chooseGuidedRouteOverride(snapshot, activeObjective)
    : null;
  const combatAction = chooseAgentCombatAction(snapshot);

  if (profile === 'guided-level0' && snapshot.mission.pendingAdvance) {
    return { type: 'continueMission' };
  }

  const semanticNpcMoveInProgress =
    lastActionType === 'interactNpc' &&
    Boolean(lastTraceEntry?.result.includes('Moved toward NPC'));

  if (
    (lastActionType === 'collectItem' && lastWasCombatStrategy) ||
    (lastActionType === 'clickTile' && !lastWasCombatStrategy) ||
    (lastActionType === 'interactNpc' && !snapshot.dialogue.active && !semanticNpcMoveInProgress)
  ) {
    return { type: 'waitForPlayerIdle', timeoutMs: 6_000 };
  }

  if (combatAction) {
    return combatAction;
  }

  const chooseDialogueByText = (patterns: RegExp[]): GetawayAgentAction | null => {
    const match = snapshot.dialogue.options.find((option) =>
      patterns.some((pattern) => pattern.test(option.text))
    );
    return match ? { type: 'chooseDialogueOption', index: match.index } : null;
  };

  if (profile === 'stealth-curfew') {
    if (snapshot.dialogue.active) {
      return chooseDialogueByText([
        /walk me through the cache job/i,
        /consider their evidence misplaced/i,
        /stay unscannable/i,
      ]) ?? { type: 'chooseDialogueOption', index: snapshot.dialogue.options[0]?.index ?? 0 };
    }

    if (!snapshot.player.stealthModeEnabled) {
      const cameraLockActive =
        snapshot.stealth.cameraAlertState === 'alarmed' &&
        snapshot.stealth.detectionProgress >= 100;
      if (cameraLockActive) {
        return chooseCameraEscapeTile(snapshot) ?? { type: 'wait', ms: 750 };
      }

      return { type: 'toggleStealth' };
    }

    const patrolTile = snapshot.world.map.nearbyWalkableTiles[
      step % Math.max(1, snapshot.world.map.nearbyWalkableTiles.length)
    ];
    return patrolTile
      ? { type: 'clickTile', position: patrolTile }
      : { type: 'wait', ms: 750 };
  }

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
    const liraComplete = isObjectiveCompleteFromSnapshotOrTrace(
      snapshot,
      trace,
      'return-to-lira'
    );
    const nailaComplete = isObjectiveCompleteFromSnapshotOrTrace(
      snapshot,
      trace,
      'deliver-naila'
    );
    const brantComplete = isObjectiveCompleteFromSnapshotOrTrace(
      snapshot,
      trace,
      'report-brant'
    );

    if (!liraComplete) {
      return { type: 'interactNpc', role: 'lira' };
    }
    if (!nailaComplete) {
      return { type: 'interactNpc', role: 'naila' };
    }
    if (!brantComplete) {
      return { type: 'interactNpc', role: 'brant' };
    }
    return snapshot.mission.pendingAdvance ? null : { type: 'wait', ms: 500 };
  }

  switch (activeObjective.objectiveId) {
    case 'recover-keycard':
      if (profile === 'guided-level0' && !snapshot.world.curfewActive) {
        return { type: 'setClock', phase: 'night' };
      }
      if (profile === 'guided-level0' && !snapshot.player.stealthModeEnabled) {
        return { type: 'toggleStealth' };
      }
      if (profile !== 'guided-level0' && !snapshot.world.curfewActive) {
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
  const completed = new Set<GuidedLevel0MilestoneId>();
  const text = traceText(trace);
  if (
    hasActiveOrCompletedObjective(snapshot, 'recover-keycard') ||
    text.includes('lira')
  ) {
    completed.add('lira-started');
  }
  if (
    objectiveById(snapshot, 'recover-keycard')?.isCompleted ||
    hasActiveOrCompletedObjective(snapshot, 'return-to-lira') ||
    text.includes('afterobjective=return-to-lira') ||
    text.includes('beforeobjective=return-to-lira')
  ) {
    completed.add('keycard-collected');
  }
  if (countLiraCompletionAttempts(trace) > 0) {
    completed.add('lira-hand-in-attempted');
  }
  if (
    hasActiveOrCompletedObjective(snapshot, 'obtain-datapad') ||
    hasActiveOrCompletedObjective(snapshot, 'deliver-naila') ||
    text.includes('naila')
  ) {
    completed.add('naila-route-reached');
  }
  if (
    snapshot.objectives.some((objective) =>
      objective.target.toLowerCase().includes('brant') &&
      (objective.isActive || objective.isCompleted)
    ) ||
    text.includes('brant')
  ) {
    completed.add('brant-route-reached');
  }
  if (
    snapshot.mission.pendingAdvance ||
    snapshot.mission.celebrationAcknowledged ||
    snapshot.mission.currentLevelIndex > 0
  ) {
    completed.add('recap-reached');
  }
  if (snapshot.mission.currentLevelIndex > 0 || text.includes('advanced mission')) {
    completed.add('mission-advanced');
  }

  if (
    completed.has('lira-hand-in-attempted') ||
    completed.has('naila-route-reached') ||
    completed.has('brant-route-reached') ||
    completed.has('recap-reached')
  ) {
    completed.add('keycard-collected');
  }

  if (completed.has('keycard-collected')) {
    completed.add('lira-started');
  }

  if (
    completed.has('naila-route-reached') ||
    completed.has('brant-route-reached') ||
    completed.has('recap-reached')
  ) {
    completed.add('lira-hand-in-attempted');
  }

  if (completed.has('brant-route-reached') || completed.has('recap-reached')) {
    completed.add('naila-route-reached');
  }

  if (completed.has('recap-reached')) {
    completed.add('brant-route-reached');
  }
  if (completed.has('mission-advanced')) {
    completed.add('recap-reached');
  }

  return {
    completed: guidedLevel0MilestoneOrder.filter((milestone) => completed.has(milestone)),
  };
};

const countTraceActions = (
  trace: PlaytestTraceEntry[],
  actionType: GetawayAgentAction['type'],
  requireStateChange = false
): number =>
  trace.filter((entry) => {
    const action = parseTraceAction(entry);
    return action.type === actionType &&
      (!requireStateChange || entry.result.includes('stateChanged=true'));
  }).length;

const buildStealthCurfewMilestones = (
  snapshot: GetawayAgentSnapshot,
  trace: PlaytestTraceEntry[]
): MilestoneState => {
  const completed = new Set<string>();

  if (
    snapshot.world.timeOfDay === 'night' ||
    snapshot.world.curfewActive ||
    trace.some((entry) =>
      parseTraceAction(entry).type === 'setClock' &&
      entry.result.includes('stateChanged=true')
    )
  ) {
    completed.add('night-curfew-active');
  }

  if (
    snapshot.player.stealthModeEnabled ||
    countTraceActions(trace, 'toggleStealth', true) > 0
  ) {
    completed.add('stealth-enabled');
  }

  if (countTraceActions(trace, 'clickTile', true) >= 5) {
    completed.add('curfew-route-traversed');
  }

  if (snapshot.paranoia.value > 0 || snapshot.paranoia.tier !== 'calm') {
    completed.add('paranoia-tracked');
  }

  return {
    completed: [
      'night-curfew-active',
      'stealth-enabled',
      'curfew-route-traversed',
      'paranoia-tracked',
    ].filter((milestone) => completed.has(milestone)),
  };
};

const buildMissionTerminalMilestones = (
  snapshot: GetawayAgentSnapshot,
  trace: PlaytestTraceEntry[]
): MilestoneState => {
  const completed = new Set<string>();
  const text = traceText(trace);

  if (
    snapshot.overlays.missionFailureOpen ||
    snapshot.player.health <= 0 ||
    text.includes('triggered mission failure')
  ) {
    completed.add('mission-failure-open');
  }

  if (text.includes('clicked mission failure retry')) {
    completed.add('retry-reset');
  }

  if (
    completed.has('retry-reset') &&
    snapshot.player.health > 0 &&
    !snapshot.overlays.missionFailureOpen &&
    text.includes('started a fresh level 0 agent run')
  ) {
    completed.add('restart-level0');
  }

  return {
    completed: [
      'mission-failure-open',
      'retry-reset',
      'restart-level0',
    ].filter((milestone) => completed.has(milestone)),
  };
};

const isExpectedStealthCurfewBriefingFinding = (
  profile: PlaytestProfile,
  finding: AiPlaytestFinding
): boolean => {
  if (profile !== 'stealth-curfew') {
    return false;
  }

  const text = [
    finding.title,
    finding.expected,
    finding.observed,
    finding.evidence.join(' '),
  ].join(' ').toLowerCase();

  return text.includes('current beat') &&
    text.includes('briefing') &&
    text.includes('activeobjective') &&
    text.includes('null');
};

const isExpectedKeycardPressureRouteFinding = (finding: AiPlaytestFinding): boolean => {
  const text = [
    finding.title,
    finding.expected,
    finding.observed,
    finding.evidence.join(' '),
  ].join(' ').toLowerCase();

  return text.includes('corporate keycard') &&
    text.includes('active combat') &&
    text.includes('living hostiles') &&
    (text.includes('moved toward') ||
      text.includes('advances movement') ||
      text.includes('ap decreasing') ||
      text.includes('ap-consuming'));
};

const shouldKeepCodexCandidateFinding = (
  profile: PlaytestProfile,
  finding: AiPlaytestFinding
): boolean =>
  !isExpectedStealthCurfewBriefingFinding(profile, finding) &&
  !isExpectedKeycardPressureRouteFinding(finding);

const buildProfileMilestones = (
  profile: PlaytestProfile,
  snapshot: GetawayAgentSnapshot,
  trace: PlaytestTraceEntry[]
): MilestoneState => {
  switch (profile) {
    case 'guided-level0':
      return buildGuidedMilestones(snapshot, trace);
    case 'stealth-curfew':
      return buildStealthCurfewMilestones(snapshot, trace);
    case 'mission-terminal':
      return buildMissionTerminalMilestones(snapshot, trace);
    case 'misuse-regression':
    default:
      return { completed: [] };
  }
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

  const objectiveTrace = traceSinceObjectiveBecameActive(trace, activeObjective.objectiveId);
  const repeatedActions = objectiveTrace.filter((entry) =>
    isObjectiveStallRetryTrace(entry, activeObjective)
  );
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
    category: stalledInCombat ? 'combat' : 'progression',
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

const buildIncompleteGuidedLevel0Finding = (
  runId: string,
  snapshot: GetawayAgentSnapshot,
  milestones: MilestoneState,
  trace: PlaytestTraceEntry[],
  screenshots: string[],
  maxSteps: number
): AiPlaytestFinding | null => {
  const completed = new Set(milestones.completed);
  const missing = guidedLevel0MilestoneOrder.filter((milestone) => !completed.has(milestone));
  if (missing.length === 0) {
    return null;
  }

  const activeObjective = snapshot.objectives.find(
    (objective) => objective.isActive && !objective.isCompleted
  ) ?? null;
  const lastTraceEntry = trace.at(-1);
  const lastCombatTraceEntry = trace.findLast((entry) => isAgentCombatTraceResult(entry.result));
  const blockingMilestone = missing[0];
  const stopClassification = snapshot.world.inCombat
    ? `combat unresolved; hostiles=${snapshot.enemies.filter((enemy) => enemy.isHostile && enemy.health > 0).length}; playerAp=${snapshot.player.actionPoints}`
    : 'route incomplete without unresolved combat';

  return {
    id: `${runId}-guided-level0-incomplete-milestones`,
    severity: completed.size <= 1 ? 'medium' : 'low',
    category: 'tooling',
    title: 'AI gamer exhausted the guided Level 0 gate without enough milestone coverage',
    reproSteps: [
      `Run the guided Level 0 AI gamer gate with --max-steps ${maxSteps}.`,
      'Review the generated scorecard and trace.',
      'Compare completed milestones against the Lira -> Naila -> Brant -> recap -> mission advance profile goal.',
    ],
    expected: 'The 20-step gate should either complete meaningful guided-route coverage or stop with a confirmed gameplay/tooling/agent-strategy finding.',
    observed: `The run used ${trace.length} step(s) and completed only ${milestones.completed.join(', ') || 'no milestones'}; missing ${missing.join(', ')}.`,
    evidence: [
      `Coverage stop classification: ${stopClassification}.`,
      `Active objective: ${activeObjective?.objectiveId ?? 'none'}; target ${activeObjective?.target ?? 'none'}; count ${activeObjective?.currentCount ?? 0}/${activeObjective?.count ?? 0}.`,
      `World state: inCombat=${snapshot.world.inCombat}; globalAlertLevel=${snapshot.world.globalAlertLevel}; player=${snapshot.player.position.x},${snapshot.player.position.y}.`,
      lastCombatTraceEntry ? `Last combat strategy trace: ${lastCombatTraceEntry.result}` : 'Last combat strategy trace: none.',
      lastTraceEntry ? `Last action: ${lastTraceEntry.action}; result: ${lastTraceEntry.result}` : 'No trace entries recorded.',
      ...screenshots.slice(-3),
    ],
    suspectedOwner: 'AI playtest route strategy',
    confidence: 0.88,
    dedupeKey: 'guided-level0:incomplete-milestone-coverage',
    findingType: 'agent-strategy',
    mergedFrom: [],
    blockingMilestone,
    agentConfidenceNotes: 'Generated by runner finalization logic when the guided profile consumed its step budget without reaching the expected milestone chain.',
    linearSuggestion: {
      title: 'Improve AI gamer guided Level 0 milestone coverage',
      description: `The guided Level 0 AI gamer gate consumed ${trace.length} step(s) but missed ${missing.join(', ')}. Strengthen route strategy, stall detection, or action preconditions so final-pass reports cannot silently pass incomplete coverage.`,
      label: 'Improvement',
      priority: completed.size <= 1 ? 'Medium' : 'Low',
    },
  };
};

const detectRepeatedCombatObjectivePressure = (
  runId: string,
  snapshot: GetawayAgentSnapshot,
  trace: PlaytestTraceEntry[],
  screenshots: string[]
): AiPlaytestFinding | null => {
  const activeObjective = snapshot.objectives.find(
    (objective) => objective.isActive && !objective.isCompleted
  );
  if (!activeObjective || !snapshot.world.inCombat) {
    return null;
  }

  const repeatedCombatObjectiveActions = trace.filter((entry) =>
    isAgentCombatTraceResult(entry.result) &&
    entry.result.includes(`activeObjective=${activeObjective.objectiveId}`) &&
    entry.result.includes('selected=objective:') &&
    !entry.result.includes('stateChanged=true')
  );

  if (repeatedCombatObjectiveActions.length < 3) {
    return null;
  }

  const livingHostiles = snapshot.enemies.filter((enemy) => enemy.isHostile && enemy.health > 0);
  const lastTraceEntry = trace.at(-1);

  return {
    id: `${runId}-${activeObjective.objectiveId}-combat-pressure`,
    severity: 'medium',
    category: 'combat',
    title: `AI playtest route cannot safely collect ${activeObjective.target} under combat pressure`,
    reproSteps: [
      'Run the guided Level 0 AI playtest route.',
      `Advance until the active objective is ${activeObjective.objectiveId}.`,
      'Observe repeated combat-marked objective collection attempts while hostiles remain active.',
    ],
    expected: 'The AI gamer should stop on proven no-progress combat-objective repeats, while allowing authored pressure-route movement that changes state.',
    observed: `${activeObjective.objectiveId} stayed active after ${repeatedCombatObjectiveActions.length} no-progress combat-marked objective collection attempts with ${livingHostiles.length} living hostile(s).`,
    evidence: [
      `Active objective: ${activeObjective.objectiveId}; target ${activeObjective.target}; count ${activeObjective.currentCount ?? 0}/${activeObjective.count ?? 1}.`,
      `World state: inCombat=${snapshot.world.inCombat}; isPlayerTurn=${snapshot.world.isPlayerTurn}; playerAp=${snapshot.player.actionPoints}; playerHealth=${snapshot.player.health}/${snapshot.player.maxHealth}.`,
      `Living hostiles: ${livingHostiles.map((enemy) => `${enemy.id}@${enemy.position.x},${enemy.position.y}:${enemy.health}`).join(', ') || 'none'}.`,
      lastTraceEntry ? `Last action: ${lastTraceEntry.action}; result: ${lastTraceEntry.result}` : 'No trace entries recorded.',
      ...screenshots.slice(-3),
    ],
    suspectedOwner: 'AI playtest combat strategy',
    confidence: 0.9,
    dedupeKey: `guided-level0:${activeObjective.objectiveId}-combat-pressure`,
    findingType: 'agent-strategy',
    mergedFrom: [],
    blockingMilestone: activeObjective.objectiveId,
    agentConfidenceNotes: 'Generated before dispatching another no-progress combat-objective action, preventing browser-close noise from hiding the strategy blocker.',
    linearSuggestion: {
      title: `Improve AI gamer combat route before ${activeObjective.objectiveId}`,
      description: `${activeObjective.objectiveId} remained active after repeated combat-marked objective collection attempts. Teach the runner to disengage, resolve hostiles, or use a safer route before continuing guided Level 0 coverage.`,
      label: 'Improvement',
      priority: 'Medium',
    },
  };
};

const buildCombatClosureFinding = (
  runId: string,
  snapshot: GetawayAgentSnapshot,
  trace: PlaytestTraceEntry[],
  screenshots: string[],
  message: string
): AiPlaytestFinding => {
  const activeObjective = snapshot.objectives.find(
    (objective) => objective.isActive && !objective.isCompleted
  );
  const livingHostiles = snapshot.enemies.filter((enemy) => enemy.isHostile && enemy.health > 0);
  const lastCombatTraceEntry = trace.findLast((entry) => isAgentCombatTraceResult(entry.result));

  return {
    id: `${runId}-${activeObjective?.objectiveId ?? 'combat'}-page-closed`,
    severity: 'medium',
    category: 'combat',
    title: 'AI playtest browser closed while guided route was still in combat',
    reproSteps: [
      'Run the guided Level 0 AI playtest route.',
      'Advance into the keycard route until combat starts.',
      'Observe the runner stop while combat is unresolved.',
    ],
    expected: 'The AI gamer should stop on a combat strategy blocker before unresolved combat causes browser-close/tooling noise.',
    observed: message,
    evidence: [
      `Active objective: ${activeObjective?.objectiveId ?? 'none'}; target ${activeObjective?.target ?? 'none'}.`,
      `World state: inCombat=${snapshot.world.inCombat}; playerHealth=${snapshot.player.health}/${snapshot.player.maxHealth}; playerAp=${snapshot.player.actionPoints}.`,
      `Living hostiles: ${livingHostiles.map((enemy) => `${enemy.id}@${enemy.position.x},${enemy.position.y}:${enemy.health}`).join(', ') || 'none'}.`,
      lastCombatTraceEntry ? `Last combat strategy trace: ${lastCombatTraceEntry.result}` : 'Last combat strategy trace: none.',
      ...screenshots.slice(-3),
    ],
    suspectedOwner: 'AI playtest combat strategy',
    confidence: 0.86,
    dedupeKey: `guided-level0:${activeObjective?.objectiveId ?? 'combat'}-combat-page-close`,
    findingType: 'agent-strategy',
    mergedFrom: [],
    blockingMilestone: activeObjective?.objectiveId ?? 'combat',
    agentConfidenceNotes: 'Generated when page/bridge loss occurred with a recent combat-strategy trace and an in-combat snapshot.',
    linearSuggestion: {
      title: 'Improve AI gamer combat survival before guided Level 0 coverage',
      description: 'The guided AI gamer route can lose the browser while unresolved combat is active. Stop earlier or use a safer combat/escape strategy before continuing objective coverage.',
      label: 'Improvement',
      priority: 'Medium',
    },
  };
};

const detectRepeatedInteractionNoop = (
  runId: string,
  snapshot: GetawayAgentSnapshot,
  trace: PlaytestTraceEntry[],
  screenshots: string[],
  profile: PlaytestProfile
): AiPlaytestFinding | null => {
  const noopInteractions = trace
    .map((entry) => ({
      entry,
      action: parseTraceAction(entry),
    }))
    .filter(({ entry, action }) =>
      action.type === 'interactNpc' &&
      entry.result.includes('status=no-op') &&
      entry.result.includes('stateChanged=false')
    );

  if (noopInteractions.length < 3) {
    return null;
  }

  const latest = noopInteractions.at(-1)!;
  const target = String(latest.action.role ?? latest.action.name ?? latest.action.id ?? 'npc');
  const sameTargetCount = noopInteractions.filter(({ action }) =>
    String(action.role ?? action.name ?? action.id ?? 'npc') === target
  ).length;

  if (sameTargetCount < 3) {
    return null;
  }

  const activeObjective = snapshot.objectives.find(
    (objective) => objective.isActive && !objective.isCompleted
  );

  return {
    id: `${runId}-${profile}-${target}-interaction-noop`,
    severity: 'low',
    category: 'tooling',
    title: `AI playtest route repeats no-op interaction with ${target}`,
    reproSteps: [
      `Run the ${profile} AI playtest profile.`,
      `Advance until the runner repeatedly dispatches interactNpc for ${target}.`,
      'Observe that the action reports no-op without changing dialogue, objective, or player state.',
    ],
    expected: 'The AI gamer should change strategy or stop once a semantic interaction is proven to be a no-op.',
    observed: `The runner repeated ${sameTargetCount} no-op interaction(s) with ${target} while active objective was ${activeObjective?.objectiveId ?? 'none'}.`,
    evidence: [
      `Active objective: ${activeObjective?.objectiveId ?? 'none'}.`,
      `Dialogue active: ${snapshot.dialogue.active}; current node=${snapshot.dialogue.currentNodeId ?? 'none'}.`,
      `Last no-op result: ${latest.entry.result}.`,
      ...screenshots.slice(-3),
    ],
    suspectedOwner: 'AI playtest route strategy',
    confidence: 0.88,
    dedupeKey: `${profile}:${target}-interaction-noop`,
    findingType: 'agent-strategy',
    mergedFrom: [],
    blockingMilestone: activeObjective?.objectiveId ?? target,
    agentConfidenceNotes: 'Generated before dispatching another proven no-op interaction.',
    linearSuggestion: {
      title: `Improve AI gamer no-op recovery for ${target}`,
      description: `The ${profile} route repeats no-op interactNpc actions for ${target}. Add a route fallback or stop condition instead of continuing until browser/page instability.`,
      label: 'Improvement',
      priority: 'Low',
    },
  };
};

const detectRepeatedCombatNoProgress = (
  runId: string,
  snapshot: GetawayAgentSnapshot,
  trace: PlaytestTraceEntry[],
  screenshots: string[],
  profile: PlaytestProfile
): AiPlaytestFinding | null => {
  if (!snapshot.world.inCombat) {
    return null;
  }

  const noProgressCombatClicks = trace.filter((entry) =>
    isAgentCombatTraceResult(entry.result) &&
    entry.action.includes('"clickTile"') &&
    entry.result.includes('stateChanged=false')
  );
  if (noProgressCombatClicks.length < 3) {
    return null;
  }

  const lastTraceEntry = noProgressCombatClicks.at(-1)!;
  const activeObjective = snapshot.objectives.find(
    (objective) => objective.isActive && !objective.isCompleted
  );
  const livingHostiles = snapshot.enemies.filter((enemy) => enemy.isHostile && enemy.health > 0);

  return {
    id: `${runId}-${profile}-combat-click-no-progress`,
    severity: 'medium',
    category: 'combat',
    title: 'AI playtest combat tactic repeats ineffective hostile clicks',
    reproSteps: [
      `Run the ${profile} AI playtest profile.`,
      'Advance until combat is active.',
      'Observe repeated combat-marked hostile tile clicks with no state change.',
    ],
    expected: 'The AI gamer should vary tactics, wait for actionable turn state, or stop once hostile clicks are proven ineffective.',
    observed: `${noProgressCombatClicks.length} combat click action(s) reported stateChanged=false while ${livingHostiles.length} hostile(s) remained alive.`,
    evidence: [
      `Active objective: ${activeObjective?.objectiveId ?? 'none'}.`,
      `World state: isPlayerTurn=${snapshot.world.isPlayerTurn}; playerAp=${snapshot.player.actionPoints}; playerHealth=${snapshot.player.health}/${snapshot.player.maxHealth}.`,
      `Living hostiles: ${livingHostiles.map((enemy) => `${enemy.id}@${enemy.position.x},${enemy.position.y}:${enemy.health}`).join(', ') || 'none'}.`,
      `Last no-progress combat click: ${lastTraceEntry.result}.`,
      ...screenshots.slice(-3),
    ],
    suspectedOwner: 'AI playtest combat strategy',
    confidence: 0.9,
    dedupeKey: `${profile}:combat-click-no-progress`,
    findingType: 'agent-strategy',
    mergedFrom: [],
    blockingMilestone: activeObjective?.objectiveId ?? 'combat',
    agentConfidenceNotes: 'Generated before exhausting the step budget on repeated no-progress hostile clicks.',
    linearSuggestion: {
      title: 'Improve AI gamer combat action selection',
      description: `The ${profile} route repeats hostile clickTile actions that report no state change. Add AP/turn preconditions, alternate targets, or an escape/wait strategy before continuing route coverage.`,
      label: 'Improvement',
      priority: 'Medium',
    },
  };
};

const detectRepeatedStealthToggleNoProgress = (
  runId: string,
  snapshot: GetawayAgentSnapshot,
  trace: PlaytestTraceEntry[],
  screenshots: string[],
  profile: PlaytestProfile
): AiPlaytestFinding | null => {
  if (profile !== 'stealth-curfew') {
    return null;
  }

  const noProgressToggleCount = countNoProgressActionTraces(trace, 'toggleStealth');
  if (noProgressToggleCount < 3) {
    return null;
  }

  const lastToggle = trace.findLast((entry) => {
    try {
      const action = JSON.parse(entry.action) as { type?: string };
      return action.type === 'toggleStealth';
    } catch {
      return false;
    }
  });

  return {
    id: `${runId}-stealth-toggle-no-progress`,
    severity: 'medium',
    category: 'tooling',
    title: 'Stealth-curfew AI playtest repeats stealth toggles without changing state',
    reproSteps: [
      'Run the stealth-curfew AI playtest profile.',
      'Advance until the runner asks for stealth mode while the snapshot still reports stealth disabled.',
      'Observe repeated toggleStealth actions reporting stateChanged=false.',
    ],
    expected: 'The stealth-curfew profile should either enable stealth, change tactics, or stop with a finding once stealth toggles are proven ineffective.',
    observed: `The runner recorded ${noProgressToggleCount} no-progress stealth toggle action(s) and would otherwise continue the same request.`,
    evidence: [
      `Player stealthModeEnabled=${snapshot.player.stealthModeEnabled}; cooldownExpiresAt=${snapshot.player.stealthCooldownExpiresAt ?? 'none'}.`,
      `World state: inCombat=${snapshot.world.inCombat}; engagementMode=${snapshot.world.engagementMode}; curfewActive=${snapshot.world.curfewActive}; globalAlertLevel=${snapshot.world.globalAlertLevel}.`,
      lastToggle ? `Last stealth toggle result: ${lastToggle.result}.` : 'Last stealth toggle result: none.',
      ...screenshots.slice(-3),
    ],
    suspectedOwner: 'AI playtest stealth-curfew route strategy',
    confidence: 0.9,
    dedupeKey: 'stealth-curfew:stealth-toggle-no-progress',
    findingType: 'agent-strategy',
    mergedFrom: [],
    blockingMilestone: 'stealth-toggle',
    agentConfidenceNotes: 'Generated before a misleading zero-finding stealth-curfew report can exhaust the step budget on repeated no-progress stealth toggles.',
    linearSuggestion: {
      title: 'Improve stealth-curfew AI gamer no-op recovery',
      description: 'The stealth-curfew profile can repeat toggleStealth with stateChanged=false and still emit a green report. Add route recovery, cooldown handling, or a stop condition before treating this profile as valid evidence.',
      label: 'Improvement',
      priority: 'Medium',
    },
  };
};

const buildMissionFailureFinding = (
  runId: string,
  snapshot: GetawayAgentSnapshot,
  trace: PlaytestTraceEntry[],
  screenshots: string[]
): AiPlaytestFinding => {
  const lastTraceEntry = trace.at(-1);
  const lastCombatTraceEntry = trace.findLast((entry) => isAgentCombatTraceResult(entry.result));

  return {
    id: `${runId}-mission-failure`,
    severity: 'high',
    category: 'combat',
    title: 'AI playtest route reaches mission failure before completing Level 0 coverage',
    reproSteps: [
      'Run the guided Level 0 AI playtest route.',
      'Advance through the Lira keycard route under curfew pressure.',
      'Observe whether the player survives long enough to complete the keycard and return handoff.',
    ],
    expected: 'The AI gamer should either complete the objective route or stop on a confirmed blocker before the run falls back to the main menu.',
    observed: `The snapshot reports player health ${snapshot.player.health}/${snapshot.player.maxHealth} with missionFailureOpen=${snapshot.overlays.missionFailureOpen}.`,
    evidence: [
      `World state: inCombat=${snapshot.world.inCombat}; isPlayerTurn=${snapshot.world.isPlayerTurn}; active objective=${snapshot.objectives.find((objective) => objective.isActive && !objective.isCompleted)?.objectiveId ?? 'none'}.`,
      lastCombatTraceEntry ? `Last combat strategy trace: ${lastCombatTraceEntry.result}` : 'Last combat strategy trace: none.',
      lastTraceEntry ? `Last action: ${lastTraceEntry.action}; result: ${lastTraceEntry.result}` : 'No trace entries recorded.',
      ...screenshots.slice(-3),
    ],
    suspectedOwner: 'AI playtest route strategy',
    confidence: 0.9,
    dedupeKey: 'guided-level0:mission-failure-before-coverage',
    findingType: 'agent-strategy',
    mergedFrom: [],
    blockingMilestone: 'keycard-collected',
    agentConfidenceNotes: 'Generated by runner state checks when the game reported mission failure before guided milestones completed.',
    linearSuggestion: {
      title: 'Prevent AI gamer mission failure before Level 0 coverage',
      description: 'The guided AI playtest route reached mission failure before keycard coverage completed. Strengthen combat avoidance/objective-first strategy before classifying this as gameplay balance.',
      label: 'Improvement',
      priority: 'High',
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
      actionPoints: snapshot.player.actionPoints,
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
  `Milestones: ${JSON.stringify(buildProfileMilestones(options.profile, snapshot, trace))}`,
  'Allowed actions: startLevel0, interactNpc, collectItem, waitForDialogue, waitForObjectiveChange, waitForPlayerIdle, clickTile, focusObjective, toggleStealth, chooseDialogueOption, setClock, wait.',
  'The action object must always include type, name, id, role, position, index, phase, ms, timeoutMs, and fromId. For unused fields use empty strings, position {"x":0,"y":0}, index 0, phase "midday", ms 500, and timeoutMs 3000.',
  'Every candidate finding must include dedupeKey, findingType, mergedFrom, blockingMilestone, and agentConfidenceNotes. Use dedupeKey "" to let the runner infer it, findingType "gameplay" for game defects, mergedFrom [], and empty strings for unused text fields.',
  'Dialogue option indexes are zero-based and must match the snapshot dialogue.options[].index value, not the visible UI badge.',
  'Expert play policy: prefer semantic actions over raw tile clicks; after interacting with an NPC, waitForDialogue; after quest-effect dialogue options, waitForObjectiveChange using the previous active objective id; after movement, waitForPlayerIdle.',
  'Combat policy: when world.inCombat is true, resolve or escape combat before repeating objective collection. If it is not the player turn or AP is depleted, wait. If living hostiles exist, click the nearest hostile tile using clickTile. Do not click the objective item while living hostiles are present.',
  'Lira keycard pressure policy: AP-spending Corporate Keycard movement during combat is an accepted pressure-route mechanic when it changes state; file only if it no-ops, soft-locks, hides feedback, or prevents route completion.',
  'Stealth-curfew policy: pre-briefing Current Beat with activeObjective null is expected until Lira is explicitly started; do not file that as a defect for the stealth-curfew profile.',
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

const isSameAgentAction = (
  left: GetawayAgentAction | null,
  right: GetawayAgentAction | null
): boolean => JSON.stringify(left) === JSON.stringify(right);

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

const run = async () => {
  const options = parseArgs(process.argv.slice(2));
  const runId = createRunId(options.profile);
  const runDir = path.join(reportRoot, runId);
  const tempRunDir = path.join(transientReportRoot, runId);
  await rm(tempRunDir, { recursive: true, force: true });
  await mkdir(tempRunDir, { recursive: true });
  await mkdir(transientReportRoot, { recursive: true });
  await mkdir(reportRoot, { recursive: true });

  const devServer = await ensureDevServer(options.baseUrl);
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
    await waitForPlayfieldScreenshotNonBlank(page, 2_000);
    await page.waitForTimeout(1_000);

    const trace: PlaytestTraceEntry[] = [];
    const findings: AiPlaytestFinding[] = [];
    const screenshots: string[] = [];
    let latestScreenshotPath: string | null = null;
    let latestScreenshotEvidencePath = '';
    let screenshotNonBlank = options.profile === 'mission-terminal';
    let earlyStopReason = '';
    let latestMilestones: MilestoneState = { completed: [] };
    let latestSnapshot: GetawayAgentSnapshot | null = null;
    let codexAdvisoryDisabled = false;

    for (let step = 0; step < options.maxSteps; step += 1) {
      let snapshot: GetawayAgentSnapshot;
      try {
        await devServer.ensureAlive();
        if (page.isClosed()) {
          throw new Error('Playwright page is closed.');
        }
        snapshot = await evaluateSnapshotWithRetry(page);
      } catch (error) {
        const message = `Browser page or agent bridge became unavailable before step ${step}: ${(error as Error).message}`;
        const combatClosure = options.profile === 'guided-level0' &&
          latestSnapshot?.world.inCombat &&
          trace.some((entry) => isAgentCombatTraceResult(entry.result))
          ? buildCombatClosureFinding(runId, latestSnapshot, trace, screenshots, message)
          : null;
        if (combatClosure) {
          latestMilestones = {
            ...latestMilestones,
            blocked: {
              milestone: combatClosure.blockingMilestone ?? 'combat',
              reason: combatClosure.title,
            },
          };
        }
        findings.push(combatClosure ?? buildToolingFinding(
          runId,
          'Browser page closed during AI playtest',
          message,
          screenshots.slice(-3)
        ));
        earlyStopReason = combatClosure?.title ?? message;
        break;
      }
      latestSnapshot = snapshot;

      latestMilestones = buildProfileMilestones(options.profile, snapshot, trace);
      const screenshotName = `step-${String(step).padStart(3, '0')}.png`;
      const screenshotPath = path.join(tempRunDir, screenshotName);
      const screenshotEvidencePath = path.relative(repoRoot, path.join(runDir, screenshotName));
      let actionScreenshotPath = latestScreenshotPath;
      let actionScreenshotEvidencePath = latestScreenshotEvidencePath || screenshotEvidencePath;
      try {
        const screenshot = await page.screenshot({
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
        let canvasNonBlank = false;
        try {
          canvasNonBlank = await isCanvasNonBlank(page);
        } catch {
          canvasNonBlank = false;
        }
        let screenshotPlayfieldNonBlank = false;
        try {
          screenshotPlayfieldNonBlank = await isScreenshotPlayfieldNonBlank(page, screenshot);
        } catch {
          screenshotPlayfieldNonBlank = false;
        }
        screenshotNonBlank = screenshotNonBlank || canvasNonBlank || screenshotPlayfieldNonBlank;
      } catch {
      }

      try {
        snapshot = await evaluateSnapshotWithRetry(page);
        latestSnapshot = snapshot;
        latestMilestones = buildProfileMilestones(options.profile, snapshot, trace);
      } catch (error) {
        const message = `Browser page or agent bridge became unavailable after screenshot for step ${step}: ${(error as Error).message}`;
        const combatClosure = options.profile === 'guided-level0' &&
          latestSnapshot?.world.inCombat &&
          trace.some((entry) => isAgentCombatTraceResult(entry.result))
          ? buildCombatClosureFinding(runId, latestSnapshot, trace, screenshots, message)
          : null;
        if (combatClosure) {
          latestMilestones = {
            ...latestMilestones,
            blocked: {
              milestone: combatClosure.blockingMilestone ?? 'combat',
              reason: combatClosure.title,
            },
          };
        }
        findings.push(combatClosure ?? buildToolingFinding(
          runId,
          'Browser page closed during AI playtest',
          message,
          screenshots.slice(-3)
        ));
        earlyStopReason = combatClosure?.title ?? message;
        break;
      }

      const deterministicAction = chooseDeterministicAction(options.profile, step, snapshot, trace);
      const combatPressureBlocker = options.profile === 'guided-level0'
        ? detectRepeatedCombatObjectivePressure(runId, snapshot, trace, screenshots)
        : null;
      if (combatPressureBlocker) {
        findings.push(combatPressureBlocker);
        latestMilestones = {
          ...latestMilestones,
          blocked: {
            milestone: combatPressureBlocker.blockingMilestone ?? 'unknown',
            reason: combatPressureBlocker.title,
          },
        };
        earlyStopReason = combatPressureBlocker.title;
        break;
      }
      const combatNoProgressBlocker = detectRepeatedCombatNoProgress(
        runId,
        snapshot,
        trace,
        screenshots,
        options.profile
      );
      if (combatNoProgressBlocker) {
        findings.push(combatNoProgressBlocker);
        latestMilestones = {
          ...latestMilestones,
          blocked: {
            milestone: combatNoProgressBlocker.blockingMilestone ?? 'combat',
            reason: combatNoProgressBlocker.title,
          },
        };
        earlyStopReason = combatNoProgressBlocker.title;
        break;
      }
      const interactionNoopBlocker = detectRepeatedInteractionNoop(
        runId,
        snapshot,
        trace,
        screenshots,
        options.profile
      );
      if (interactionNoopBlocker) {
        findings.push(interactionNoopBlocker);
        latestMilestones = {
          ...latestMilestones,
          blocked: {
            milestone: interactionNoopBlocker.blockingMilestone ?? 'interaction-noop',
            reason: interactionNoopBlocker.title,
          },
        };
        earlyStopReason = interactionNoopBlocker.title;
        break;
      }
      const stealthToggleBlocker = detectRepeatedStealthToggleNoProgress(
        runId,
        snapshot,
        trace,
        screenshots,
        options.profile
      );
      if (stealthToggleBlocker) {
        findings.push(stealthToggleBlocker);
        latestMilestones = {
          ...latestMilestones,
          blocked: {
            milestone: stealthToggleBlocker.blockingMilestone ?? 'stealth-toggle',
            reason: stealthToggleBlocker.title,
          },
        };
        earlyStopReason = stealthToggleBlocker.title;
        break;
      }
      if (
        options.profile === 'guided-level0' &&
        (snapshot.overlays.missionFailureOpen || snapshot.player.health <= 0)
      ) {
        const missionFailure = buildMissionFailureFinding(runId, snapshot, trace, screenshots);
        findings.push(missionFailure);
        latestMilestones = {
          ...latestMilestones,
          blocked: {
            milestone: missionFailure.blockingMilestone ?? 'mission-failure',
            reason: missionFailure.title,
          },
        };
        earlyStopReason = missionFailure.title;
        break;
      }
      let decision: CodexAgentDecision | null = null;
      if (!codexAdvisoryDisabled && shouldConsultCodex(options, step) && actionScreenshotPath) {
        try {
          decision = await runCodex(options, step, snapshot, trace, actionScreenshotPath);
        } catch (error) {
          findings.push(buildCodexFailureFinding(
            runId,
            error,
            [actionScreenshotEvidencePath].filter(Boolean)
          ));
          codexAdvisoryDisabled = true;
        }
      }
      const shouldUseCodexAction =
        options.profile !== 'guided-level0' &&
        options.profile !== 'mission-terminal';
      const combatPreferredAction = chooseAgentCombatAction(snapshot);
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
        const combatClosure = options.profile === 'guided-level0' &&
          snapshot.world.inCombat &&
          trace.some((entry) => isAgentCombatTraceResult(entry.result))
          ? buildCombatClosureFinding(runId, snapshot, trace, [actionScreenshotEvidencePath].filter(Boolean), message)
          : null;
        if (combatClosure) {
          latestMilestones = {
            ...latestMilestones,
            blocked: {
              milestone: combatClosure.blockingMilestone ?? 'combat',
              reason: combatClosure.title,
            },
          };
        }
        findings.push(combatClosure ?? buildToolingFinding(
          runId,
          `Agent action failed: ${action.type}`,
          message,
          [actionScreenshotEvidencePath].filter(Boolean)
        ));
        earlyStopReason = combatClosure?.title ?? message;
        break;
      }
      const combatTraceNote = isSameAgentAction(action, combatPreferredAction)
        ? buildAgentCombatTraceNote(snapshot, action)
        : null;
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
          combatTraceNote ? `strategy=${combatTraceNote}` : null,
        ].filter((entry): entry is string => Boolean(entry)).join(' | '),
        rationale: actionDecision?.rationale ?? combatTraceNote ?? undefined,
        screenshot: actionScreenshotEvidencePath,
        riskNotes: actionDecision?.riskNotes ?? (combatTraceNote ? [combatTraceNote] : undefined),
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
        findings.push(
          ...decision.candidateFindings.filter(
            (finding) => shouldKeepCodexCandidateFinding(options.profile, finding)
          )
        );
      }

      let nextSnapshot: GetawayAgentSnapshot;
      try {
        nextSnapshot = actionResult.snapshot ?? (await evaluateSnapshotWithRetry(page));
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
      latestSnapshot = nextSnapshot;
      latestMilestones = buildProfileMilestones(options.profile, nextSnapshot, trace);
      if (
        options.profile === 'guided-level0' &&
        (nextSnapshot.overlays.missionFailureOpen || nextSnapshot.player.health <= 0)
      ) {
        const missionFailure = buildMissionFailureFinding(runId, nextSnapshot, trace, screenshots);
        findings.push(missionFailure);
        latestMilestones = {
          ...latestMilestones,
          blocked: {
            milestone: missionFailure.blockingMilestone ?? 'mission-failure',
            reason: missionFailure.title,
          },
        };
        earlyStopReason = missionFailure.title;
        break;
      }
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

      if (
        options.profile === 'guided-level0' &&
        nextSnapshot.mission.currentLevelIndex > 0
      ) {
        earlyStopReason = 'Mission advanced to next level.';
        break;
      }

      if (
        options.profile === 'mission-terminal' &&
        latestMilestones.completed.includes('restart-level0')
      ) {
        earlyStopReason = 'Mission failure retry restarted Level 0.';
        break;
      }

      if (nextSnapshot.mission.pendingAdvance && options.profile !== 'guided-level0') {
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

    if (
      options.profile === 'guided-level0' &&
      !earlyStopReason &&
      latestSnapshot &&
      trace.length >= options.maxSteps
    ) {
      const incompleteFinding = buildIncompleteGuidedLevel0Finding(
        runId,
        latestSnapshot,
        latestMilestones,
        trace,
        screenshots,
        options.maxSteps
      );
      if (incompleteFinding) {
        findings.push(incompleteFinding);
        latestMilestones = {
          ...latestMilestones,
          blocked: {
            milestone: incompleteFinding.blockingMilestone ?? 'unknown',
            reason: incompleteFinding.title,
          },
        };
        earlyStopReason = incompleteFinding.title;
      }
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
      await browser.close().catch(() => undefined);
    }
    devServer.stop();
    await rm(tempRunDir, { recursive: true, force: true }).catch(() => undefined);
  }
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
