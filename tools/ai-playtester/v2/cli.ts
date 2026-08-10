export type GateMode = 'affected' | 'closeout';
export type GateOutcome = 'pass' | 'fail' | 'blocked' | 'harness-error';

export interface GateCliOptions {
  ticket: string;
  mode: GateMode;
  dryRun: boolean;
}

const legacyFlags = new Set(['--profile', '--max-steps', '--codex', '--no-codex']);

const migrationError = (flag: string): Error =>
  new Error(
    `Legacy option ${flag} is retired; use --ticket GET-XXX [--mode affected|closeout] [--dry-run].`
  );

export const parseCliArgs = (argv: readonly string[]): GateCliOptions => {
  let ticket: string | undefined;
  let mode: GateMode = 'affected';
  let modeProvided = false;
  let dryRun = false;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    const legacyFlag = [...legacyFlags].find(
      (flag) => argument === flag || argument.startsWith(`${flag}=`)
    );
    if (legacyFlag) {
      throw migrationError(legacyFlag);
    }

    if (argument === '--ticket') {
      if (ticket !== undefined) {
        throw new Error('--ticket may be provided only once.');
      }
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error('--ticket GET-XXX is required.');
      }
      if (!/^GET-\d+$/.test(value)) {
        throw new Error('--ticket must match GET-XXX, where XXX is numeric.');
      }
      ticket = value;
      index += 1;
      continue;
    }

    if (argument === '--mode') {
      if (modeProvided) {
        throw new Error('--mode may be provided only once.');
      }
      const value = argv[index + 1];
      if (value !== 'affected' && value !== 'closeout') {
        throw new Error('--mode must be affected or closeout.');
      }
      mode = value;
      modeProvided = true;
      index += 1;
      continue;
    }

    if (argument === '--dry-run') {
      if (dryRun) {
        throw new Error('--dry-run may be provided only once.');
      }
      dryRun = true;
      continue;
    }

    throw new Error(`Unknown argument: ${argument}`);
  }

  if (!ticket) {
    throw new Error('--ticket GET-XXX is required.');
  }

  return { ticket, mode, dryRun };
};

const exitCodes: Record<GateOutcome, 0 | 1 | 2 | 3> = {
  pass: 0,
  fail: 1,
  blocked: 2,
  'harness-error': 3,
};

export const exitCodeForOutcome = (outcome: GateOutcome): 0 | 1 | 2 | 3 =>
  exitCodes[outcome];
