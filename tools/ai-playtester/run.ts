import { runPlaytestGate } from './v2/gate.ts';

const main = async (): Promise<void> => {
  process.exitCode = await runPlaytestGate(process.argv.slice(2));
};

void main().catch((error: Error) => {
  process.stderr.write(`AI Gamer gate crashed before it could classify evidence: ${error.message}\n`);
  process.exitCode = 3;
});
