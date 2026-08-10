import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

export const repoRoot = path.resolve(currentDirectory, '../../..');
export const appRoot = path.join(repoRoot, 'the-getaway');
export const reportRoot = path.join(repoRoot, 'reports/ai-playtests');
export const workerResponseSchemaSource = path.join(
  currentDirectory,
  'schemas/ai-gamer-worker-response-v1.schema.json'
);
