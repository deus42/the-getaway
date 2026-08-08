import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const APP_URL = 'http://127.0.0.1:5174/';
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUTPUT_DIR = path.resolve(process.cwd(), '..', 'progress');
const DEFAULT_SIZES = [
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];

const parseSizes = () => {
  const value = process.argv.find((entry) => entry.startsWith('--sizes='))?.split('=')[1];
  if (!value) {
    return DEFAULT_SIZES;
  }

  return value.split(',').map((entry) => {
    const [width, height] = entry.split('x').map(Number);
    if (!Number.isFinite(width) || !Number.isFinite(height)) {
      throw new Error(`Invalid capture size: ${entry}`);
    }
    return { width, height };
  });
};

const bridgeSnapshot = (page) =>
  page.evaluate(() => window.__getawayAgent?.snapshot());

const dispatchBridgeAction = (page, action) =>
  page.evaluate((nextAction) => window.__getawayAgent?.dispatch(nextAction), action);

const waitForBridge = async (page) => {
  await page.waitForFunction(() => Boolean(window.__getawayAgent), null, { timeout: 15_000 });
  await page.waitForFunction(
    () => document.documentElement.dataset.visualStyle === 'graphic-painterly-noir',
    null,
    { timeout: 15_000 }
  );
  await page.waitForTimeout(5_000);
};

const activeObjective = (snapshot) =>
  snapshot.objectives.find((objective) => objective.isActive && !objective.isCompleted);

const createCaptureSession = (page, size, trace) => {
  const suffix = `${size.width}x${size.height}`;

  const capture = async (name) => {
    const target = path.join(OUTPUT_DIR, `GET-180-acceptance-${name}-${suffix}.png`);
    await page.screenshot({ path: target });
    trace.push({ type: 'capture', name, path: target });
  };

  const act = async (action) => {
    const result = await dispatchBridgeAction(page, action);
    const snapshot = await bridgeSnapshot(page);
    trace.push({
      type: 'action',
      action,
      status: result?.status ?? 'missing',
      message: result?.message ?? 'Agent bridge returned no result.',
      objective: activeObjective(snapshot)?.objectiveId ?? null,
      position: snapshot?.player.position ?? null,
      inCombat: snapshot?.world.inCombat ?? null,
    });
    return { result, snapshot };
  };

  const interactUntilDialogue = async (role, attempts = 4) => {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const { snapshot } = await act({ type: 'interactNpc', role });
      if (snapshot.dialogue.active) {
        return snapshot;
      }
      if (snapshot.world.inCombat) {
        throw new Error(`Combat blocked ${role} dialogue.`);
      }
    }
    throw new Error(`Dialogue with ${role} did not open.`);
  };

  const chooseDialogue = async (patterns) => {
    const snapshot = await bridgeSnapshot(page);
    if (!snapshot.dialogue.active) {
      return snapshot;
    }

    const option = snapshot.dialogue.options.find((candidate) =>
      patterns.some((pattern) => pattern.test(candidate.text))
    ) ?? snapshot.dialogue.options[0];
    if (!option) {
      throw new Error(`Dialogue ${snapshot.dialogue.dialogueId} has no selectable option.`);
    }

    return (await act({ type: 'chooseDialogueOption', index: option.index })).snapshot;
  };

  const closeDialogue = async (patterns = []) => {
    for (let step = 0; step < 6; step += 1) {
      const snapshot = await bridgeSnapshot(page);
      if (!snapshot.dialogue.active) {
        return snapshot;
      }
      await chooseDialogue(patterns);
      await page.waitForTimeout(220);
    }
    throw new Error('Dialogue did not close after six selections.');
  };

  const collectUntilStateChanges = async (role, attempts = 6) => {
    const first = await bridgeSnapshot(page);
    const startingObjective = activeObjective(first)?.objectiveId ?? null;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const { snapshot } = await act({ type: 'collectItem', role });
      const currentObjective = activeObjective(snapshot)?.objectiveId ?? null;
      if (snapshot.world.inCombat || currentObjective !== startingObjective) {
        return snapshot;
      }
      await page.waitForTimeout(350);
    }
    throw new Error(`Collect action for ${role} did not change state.`);
  };

  const resolveCombat = async () => {
    const snapshot = await bridgeSnapshot(page);
    if (!snapshot.world.inCombat) {
      return snapshot;
    }

    const nearby = snapshot.world.map.nearbyWalkableTiles.at(-1);
    if (nearby) {
      void dispatchBridgeAction(page, { type: 'clickTile', position: nearby });
      await page.waitForTimeout(140);
    }

    const toggle = page.locator('[data-testid="combat-control-widget"] button').first();
    await toggle.click();
    await page.waitForTimeout(220);
    await capture('corpsec-combat-attack');

    await page.waitForFunction(
      () => !window.__getawayAgent?.snapshot().world.inCombat,
      null,
      { timeout: 75_000 }
    );
    await page.waitForTimeout(700);
    return bridgeSnapshot(page);
  };

  const completeLevelUpFlow = async () => {
    const maxPanelPasses = 64;
    let idlePasses = 0;
    for (let panelPass = 0; panelPass < maxPanelPasses; panelPass += 1) {
      const levelUpModal = page.locator('.level-up-modal');
      if (await levelUpModal.isVisible().catch(() => false)) {
        idlePasses = 0;
        if (!trace.some((entry) => entry.type === 'capture' && entry.name === 'level-up')) {
          await capture('level-up');
        }
        await page.locator('.level-up-modal__continue').click();
        await page.waitForTimeout(250);
        continue;
      }

      const perkPanel = page.locator('.perk-selection');
      if (await perkPanel.isVisible().catch(() => false)) {
        idlePasses = 0;
        if (!trace.some((entry) => entry.type === 'capture' && entry.name === 'perk-selection')) {
          await capture('perk-selection');
        }

        for (let selection = 0; selection < 8; selection += 1) {
          const selectable = page.locator('.perk-selection__select:not(:disabled)');
          if (await selectable.count() === 0) {
            break;
          }
          await selectable.first().click();
          await page.waitForTimeout(120);
        }

        const continueButton = page.locator('.perk-selection__continue:not(:disabled)');
        if (await continueButton.count() > 0) {
          await continueButton.click();
          await page.waitForTimeout(250);
          continue;
        }
      }

      const allocationPanel = page.locator('.level-up-allocation');
      if (await allocationPanel.isVisible().catch(() => false)) {
        idlePasses = 0;
        if (!trace.some((entry) => entry.type === 'capture' && entry.name === 'point-allocation')) {
          await capture('point-allocation');
        }

        for (let allocation = 0; allocation < 40; allocation += 1) {
          const increaseButton = page.locator('.level-up-allocation__adjust[title^="Increase "]:not(:disabled)');
          if (await increaseButton.count() === 0) {
            break;
          }
          await increaseButton.first().click();
          await page.waitForTimeout(70);
        }

        const continueButton = page.locator('.level-up-allocation__continue:not(:disabled)');
        if (await continueButton.count() === 0) {
          throw new Error('Point allocation could not be completed after spending available points.');
        }
        await continueButton.click();
        await page.waitForTimeout(250);
        continue;
      }

      idlePasses += 1;
      if (idlePasses >= 3) {
        break;
      }
      await page.waitForTimeout(500);
    }

    const remainingPanel = page.locator('.level-up-modal, .perk-selection, .level-up-allocation');
    if (await remainingPanel.count() > 0) {
      const panelText = (await remainingPanel.first().innerText()).replace(/\s+/g, ' ').slice(0, 240);
      throw new Error(`Level-up flow remained open after ${maxPanelPasses} passes: ${panelText}`);
    }
  };

  return {
    act,
    capture,
    chooseDialogue,
    closeDialogue,
    collectUntilStateChanges,
    interactUntilDialogue,
    resolveCombat,
    completeLevelUpFlow,
  };
};

const captureRoute = async (browser, size) => {
  const page = await browser.newPage({ viewport: size, deviceScaleFactor: 1 });
  const trace = [];
  const errors = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(`console: ${message.text()}`);
    }
  });

  const query = new URLSearchParams({
    agent: '1',
    agentStart: 'level0',
    agentName: 'Operative',
  });
  await page.goto(`${APP_URL}?${query.toString()}`, { waitUntil: 'networkidle' });
  await waitForBridge(page);

  const session = createCaptureSession(page, size, trace);
  await session.capture('daylight-opening');

  await session.interactUntilDialogue('lira');
  await session.capture('dialogue-lira');
  await session.chooseDialogue([/walk me through the cache job/i]);
  await session.closeDialogue([/consider their evidence misplaced/i]);

  await session.act({ type: 'setClock', phase: 'night' });
  await session.act({ type: 'toggleStealth' });
  await session.act({ type: 'focusObjective' });
  await page.waitForTimeout(900);
  await session.capture('night-curfew-stealth');

  let snapshot = await session.collectUntilStateChanges('corporate_keycard');
  if (snapshot.world.inCombat) {
    snapshot = await session.resolveCombat();
  }
  if (activeObjective(snapshot)?.objectiveId === 'recover-keycard') {
    snapshot = await session.collectUntilStateChanges('corporate_keycard');
    if (snapshot.world.inCombat) {
      snapshot = await session.resolveCombat();
      snapshot = await session.collectUntilStateChanges('corporate_keycard');
    }
  }

  await session.interactUntilDialogue('lira');
  await session.closeDialogue([/cache is back in rebel hands/i, /keep that halo crooked/i]);

  await session.interactUntilDialogue('naila');
  await session.capture('naila-route-dialogue');
  await session.closeDialogue([/what relic are we lifting today/i, /stay restless/i]);
  snapshot = await session.collectUntilStateChanges('encrypted_datapad');
  if (snapshot.world.inCombat) {
    snapshot = await session.resolveCombat();
    snapshot = await session.collectUntilStateChanges('encrypted_datapad');
  }
  await session.interactUntilDialogue('naila');
  await session.closeDialogue([/manifests are singing/i, /stay restless/i]);

  await session.interactUntilDialogue('brant');
  await session.capture('brant-route-dialogue');
  await session.closeDialogue([/point me toward/i, /appreciate the starlight/i]);
  snapshot = await session.collectUntilStateChanges('transit_tokens');
  if (snapshot.world.inCombat) {
    snapshot = await session.resolveCombat();
    snapshot = await session.collectUntilStateChanges('transit_tokens');
  }
  await session.interactUntilDialogue('brant');
  await session.closeDialogue([/couriers beat the curfew/i, /appreciate the starlight/i]);

  await page.waitForFunction(
    () => Boolean(window.__getawayAgent?.snapshot().overlays.missionCompletionPending),
    null,
    { timeout: 15_000 }
  );
  await page.waitForTimeout(500);
  await session.completeLevelUpFlow();
  await page.waitForFunction(
    () => Boolean(document.querySelector('.mission-complete__shell')),
    null,
    { timeout: 15_000 }
  );
  await page.waitForTimeout(250);
  await session.capture('mission-recap');

  await page.close();

  const failurePage = await browser.newPage({ viewport: size, deviceScaleFactor: 1 });
  failurePage.on('pageerror', (error) => errors.push(`failure pageerror: ${error.message}`));
  failurePage.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(`failure console: ${message.text()}`);
    }
  });
  await failurePage.goto(`${APP_URL}?${query.toString()}`, { waitUntil: 'networkidle' });
  await waitForBridge(failurePage);

  const failureSession = createCaptureSession(failurePage, size, trace);
  await failureSession.interactUntilDialogue('lira');
  await failureSession.chooseDialogue([/walk me through the cache job/i]);
  await failureSession.closeDialogue([/consider their evidence misplaced/i]);
  await failureSession.act({ type: 'triggerMissionFailure' });
  await failurePage.waitForFunction(
    () => Boolean(document.querySelector('.mission-failure__shell')),
    null,
    { timeout: 15_000 }
  );
  await failurePage.waitForTimeout(250);
  await failureSession.capture('mission-failure');
  await failureSession.act({ type: 'restartAttempt' });
  await failureSession.act({ type: 'startLevel0', name: 'Operative' });
  await waitForBridge(failurePage);
  await failureSession.capture('restart-attempt');

  const finalSnapshot = await bridgeSnapshot(failurePage);
  await failurePage.close();
  return { size, trace, errors, finalSnapshot };
};

await fs.mkdir(OUTPUT_DIR, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: CHROME_PATH,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

const results = [];
try {
  for (const size of parseSizes()) {
    results.push(await captureRoute(browser, size));
  }
} finally {
  await browser.close();
}

const reportPath = path.join(OUTPUT_DIR, 'GET-180-painterly-acceptance-captures.json');
let previousResults = [];
try {
  const storedResults = JSON.parse(await fs.readFile(reportPath, 'utf8'));
  previousResults = Array.isArray(storedResults) ? storedResults : [];
} catch {
  previousResults = [];
}

const mergedResultsBySize = new Map(
  previousResults.map((result) => [`${result.size.width}x${result.size.height}`, result])
);
for (const result of results) {
  mergedResultsBySize.set(`${result.size.width}x${result.size.height}`, result);
}
const mergedResults = [...mergedResultsBySize.values()].sort((left, right) =>
  left.size.width - right.size.width || left.size.height - right.size.height
);
await fs.writeFile(reportPath, `${JSON.stringify(mergedResults, null, 2)}\n`, 'utf8');
console.log(reportPath);
