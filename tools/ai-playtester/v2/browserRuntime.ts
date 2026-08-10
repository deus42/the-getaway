import { execFile } from 'node:child_process';
import {
  access,
  chmod,
  mkdir,
  mkdtemp,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import type { BrowserContext, Page } from 'playwright';

import type { PlaytestPacketViewportV1 } from '../../../the-getaway/src/game/playtest/playtestContractV2.ts';
import {
  reserveBrowserTargets,
  resolveOwnedBrowserRootPid,
  type BrowserTarget,
} from './browser.ts';
import { appRoot } from './paths.ts';

const execFileAsync = promisify(execFile);
const requireFromApp = createRequire(path.join(appRoot, 'package.json'));
const { chromium } = requireFromApp('playwright') as typeof import('playwright');

interface ChromiumRegistryExecutable {
  directory: string;
  downloadURLs: readonly string[];
  executablePath(): string;
}

interface PlaywrightRegistryModule {
  registry: {
    findExecutable(name: 'chromium'): ChromiumRegistryExecutable | undefined;
  };
}

const resolveChromiumRegistryExecutable = (): ChromiumRegistryExecutable => {
  const { registry } = requireFromApp(
    'playwright-core/lib/server/registry/index'
  ) as PlaywrightRegistryModule;
  const executable = registry.findExecutable('chromium');
  if (!executable || executable.downloadURLs.length === 0) {
    throw new Error('Playwright does not expose a pinned Chromium download.');
  }
  return executable;
};

export interface LaunchedWorkerBrowser {
  target: BrowserTarget;
  marker: string;
  profileDirectory: string;
  rootPid: number;
  context: BrowserContext;
  page: Page;
  close(): Promise<void>;
}

export const readBrowserProcessList = async (): Promise<string> => {
  const result = await execFileAsync('/bin/ps', ['-axo', 'pid=,command='], {
    maxBuffer: 4 * 1024 * 1024,
  });
  return result.stdout;
};

interface LiveBrowserReservationDependencies {
  executablePath?: string;
  executableExists?: (candidate: string) => Promise<boolean>;
  installPinnedBrowser?: () => Promise<void>;
  readProcessList?: () => Promise<string>;
}

const pinnedBrowserIsReady = async (candidate: string): Promise<boolean> => {
  try {
    await access(candidate);
    const executable = resolveChromiumRegistryExecutable();
    if (executable.executablePath() !== candidate) return false;
    await access(path.join(executable.directory, 'INSTALLATION_COMPLETE'));
    return true;
  } catch {
    return false;
  }
};

const installPinnedBrowser = async (): Promise<void> => {
  const executable = resolveChromiumRegistryExecutable();

  const pinnedExecutable = chromium.executablePath();
  if (executable.executablePath() !== pinnedExecutable) {
    throw new Error('Playwright Chromium registry and runtime executable paths disagree.');
  }
  const relativeExecutable = path.relative(executable.directory, pinnedExecutable);
  if (relativeExecutable.startsWith('..') || path.isAbsolute(relativeExecutable)) {
    throw new Error('Pinned Chromium executable is outside its Playwright cache directory.');
  }

  const cacheParent = path.dirname(executable.directory);
  await mkdir(cacheParent, { recursive: true });
  const stagingRoot = await mkdtemp(path.join(cacheParent, '.getaway-ai-gamer-install-'));
  const archivePath = path.join(stagingRoot, 'chromium.zip');
  const stagedDirectory = path.join(stagingRoot, 'browser');
  try {
    let downloaded = false;
    let lastDownloadError: unknown;
    for (const url of executable.downloadURLs) {
      try {
        await execFileAsync('/usr/bin/curl', [
          '--fail',
          '--location',
          '--silent',
          '--show-error',
          '--retry', '3',
          '--retry-delay', '1',
          '--connect-timeout', '30',
          '--max-time', '600',
          '--output', archivePath,
          url,
        ], {
          timeout: 11 * 60_000,
          maxBuffer: 4 * 1024 * 1024,
        });
        downloaded = true;
        break;
      } catch (error) {
        lastDownloadError = error;
      }
    }
    if (!downloaded) {
      throw lastDownloadError ?? new Error('Pinned Chromium download failed.');
    }

    await execFileAsync('/usr/bin/ditto', ['-x', '-k', archivePath, stagedDirectory], {
      timeout: 2 * 60_000,
      maxBuffer: 4 * 1024 * 1024,
    });
    const stagedExecutable = path.join(stagedDirectory, relativeExecutable);
    await access(stagedExecutable);
    await chmod(stagedExecutable, 0o755);
    await writeFile(path.join(stagedDirectory, 'INSTALLATION_COMPLETE'), '');

    await rm(executable.directory, { recursive: true, force: true });
    await rename(stagedDirectory, executable.directory);
  } finally {
    await rm(stagingRoot, { recursive: true, force: true });
  }
};

export const reserveLiveBrowserTargets = async (
  workerCount: 1 | 2,
  dependencies: LiveBrowserReservationDependencies = {}
): Promise<BrowserTarget[]> => {
  const pinnedExecutable = dependencies.executablePath ?? chromium.executablePath();
  const isExecutableAvailable = dependencies.executableExists ?? pinnedBrowserIsReady;
  if (!await isExecutableAvailable(pinnedExecutable)) {
    await (dependencies.installPinnedBrowser ?? installPinnedBrowser)();
  }
  if (!await isExecutableAvailable(pinnedExecutable)) {
    throw new Error(`Pinned AI Gamer browser is unavailable after installation: ${pinnedExecutable}`);
  }
  const target: BrowserTarget = {
    app: 'Google Chrome for Testing',
    executablePath: pinnedExecutable,
  };
  const processList = await (dependencies.readProcessList ?? readBrowserProcessList)();
  return reserveBrowserTargets(processList, workerCount, target);
};

export const launchWorkerBrowser = async (input: {
  target: BrowserTarget;
  baseUrl: string;
  marker: string;
  viewport: PlaytestPacketViewportV1;
  locale: 'en' | 'uk';
  checkpointStorageEntries?: Record<string, string>;
}): Promise<LaunchedWorkerBrowser> => {
  const profileDirectory = await mkdtemp(path.join(tmpdir(), 'getaway-ai-gamer-browser-'));
  let context: BrowserContext | undefined;
  try {
    context = await chromium.launchPersistentContext(profileDirectory, {
      executablePath: input.target.executablePath,
      headless: false,
      locale: input.locale === 'uk' ? 'uk-UA' : 'en-US',
      viewport: {
        width: input.viewport.width,
        height: input.viewport.height,
      },
      deviceScaleFactor: input.viewport.deviceScaleFactor,
      args: [
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-sync',
        '--disable-extensions',
        '--disable-component-update',
        '--password-store=basic',
        '--use-mock-keychain',
      ],
    });
    if (input.checkpointStorageEntries) {
      await context.addInitScript((entries: Record<string, string>) => {
        for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value);
      }, input.checkpointStorageEntries);
    }
    const pages = context.pages();
    if (pages.length !== 1) {
      throw new Error(
        `Fresh ${input.target.app} profile opened ${pages.length} pages; target is ambiguous.`
      );
    }
    const page = pages[0];
    const url = `${input.baseUrl}/?agent=1&gateRun=${encodeURIComponent(input.marker)}`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.getByTestId('level0-gate-run-marker').waitFor({ state: 'visible', timeout: 15_000 });
    const markerText = (await page.getByTestId('level0-gate-run-marker').textContent()) ?? '';
    if (!markerText.includes(input.marker)) {
      throw new Error(`Fresh ${input.target.app} window does not show its assigned marker.`);
    }
    if (context.pages().length !== 1) {
      throw new Error(`Fresh ${input.target.app} target became ambiguous before worker start.`);
    }
    const rootPid = resolveOwnedBrowserRootPid(await readBrowserProcessList(), {
      executablePath: input.target.executablePath,
      profileDirectory,
    });
    return {
      target: input.target,
      marker: input.marker,
      profileDirectory,
      rootPid,
      context,
      page,
      close: async () => {
        await context?.close().catch(() => undefined);
        await rm(profileDirectory, { recursive: true, force: true });
      },
    };
  } catch (error) {
    await context?.close().catch(() => undefined);
    await rm(profileDirectory, { recursive: true, force: true });
    throw error;
  }
};
