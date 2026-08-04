import path from 'node:path';
import { validateCharacterAssets } from './lib/characterAssetValidator';

interface CliOptions {
  appRoot?: string;
  repositoryRoot?: string;
}

const parseArgs = (args: string[]): CliOptions => {
  const options: CliOptions = {};
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument !== '--app-root' && argument !== '--repository-root') {
      throw new Error(`Unknown argument ${argument}`);
    }
    const value = args[index + 1];
    if (!value) throw new Error(`${argument} requires a path`);
    if (argument === '--app-root') options.appRoot = path.resolve(value);
    else options.repositoryRoot = path.resolve(value);
    index += 1;
  }
  return options;
};

const main = async (): Promise<void> => {
  let options: CliOptions;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`[sprites] ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
    return;
  }

  const report = await validateCharacterAssets(options);
  if (report.errors.length > 0) {
    console.error(`[sprites] Validation failed with ${report.errors.length} error(s):`);
    report.errors.forEach((error) => console.error(`- ${error}`));
    process.exitCode = 1;
    return;
  }

  const { summary } = report;
  console.log(
    `[sprites] Validated ${summary.actors} actors, ${summary.sheets} sheets, ${summary.frames} frames, ` +
      `${summary.portraits} portraits, and ${summary.nonWorldPresentations} non-world presentations ` +
      `(${summary.compressedBytes} compressed bytes; ${summary.decodedBytes} decoded bytes) in ${report.appRoot}`
  );
};

void main();
