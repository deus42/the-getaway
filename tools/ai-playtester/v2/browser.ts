export type BrowserAppName =
  | 'Google Chrome for Testing'
  | 'Google Chrome'
  | 'Brave Browser';

export interface BrowserTarget {
  app: BrowserAppName;
  executablePath: string;
}

export interface OwnedBrowserProcessExpectation {
  executablePath: string;
  profileDirectory: string;
  rootPid: number;
}

export const classifyBrowserProcessCollisions = (
  processList: string,
  requestedTargets: readonly BrowserTarget[]
): string[] => requestedTargets.flatMap((target) =>
  processList.split(/\r?\n/).some((line) => line.includes(target.executablePath))
    ? [`${target.app} already has a running process; reserved targeting is ambiguous.`]
    : []
);

export const reserveBrowserTargets = (
  processList: string,
  workerCount: 1 | 2,
  dedicatedTarget: BrowserTarget
): BrowserTarget[] => {
  const collisions = classifyBrowserProcessCollisions(processList, [dedicatedTarget]);
  if (collisions.length > 0) {
    throw new Error(collisions.join(' '));
  }
  return Array.from({ length: workerCount }, () => dedicatedTarget);
};

export const browserTargetsRequireSequentialExecution = (
  targets: readonly BrowserTarget[]
): boolean => {
  const identities = targets.map((target) => `${target.app}\0${target.executablePath}`);
  return new Set(identities).size !== identities.length;
};

interface BrowserProcessEntry {
  pid: number;
  command: string;
}

const parseBrowserProcessEntries = (processList: string): BrowserProcessEntry[] =>
  processList.split(/\r?\n/).flatMap((line) => {
    const match = line.match(/^\s*(\d+)\s+(.+)$/);
    if (!match) return [];
    return [{ pid: Number(match[1]), command: match[2] }];
  });

const rootBrowserProcesses = (
  processList: string,
  executablePath: string
): BrowserProcessEntry[] => parseBrowserProcessEntries(processList).filter((entry) =>
  entry.command === executablePath || entry.command.startsWith(`${executablePath} `)
);

export const resolveOwnedBrowserRootPid = (
  processList: string,
  expectation: Omit<OwnedBrowserProcessExpectation, 'rootPid'>
): number => {
  const roots = rootBrowserProcesses(processList, expectation.executablePath);
  const owned = roots.filter((entry) => entry.command.includes(expectation.profileDirectory));
  if (roots.length !== 1 || owned.length !== 1) {
    throw new Error('Fresh browser did not expose exactly one owned root process.');
  }
  return owned[0].pid;
};

export const validateOwnedBrowserProcessSnapshot = (
  processList: string,
  expectation: OwnedBrowserProcessExpectation
): { valid: boolean; reason: string | null } => {
  const roots = rootBrowserProcesses(processList, expectation.executablePath);
  const valid = roots.length === 1 &&
    roots[0].pid === expectation.rootPid &&
    roots[0].command.includes(expectation.profileDirectory);
  return valid
    ? { valid: true, reason: null }
    : { valid: false, reason: 'Browser process ownership changed or became ambiguous.' };
};
