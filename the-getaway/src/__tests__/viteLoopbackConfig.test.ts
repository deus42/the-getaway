import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Vite loopback listener contract', () => {
  const configSource = readFileSync(resolve(__dirname, '../../vite.config.ts'), 'utf8');

  it('serves the documented dev and preview URLs on IPv4 loopback', () => {
    expect(configSource).toMatch(
      /server:\s*\{[\s\S]*?host:\s*['"]127\.0\.0\.1['"]/,
    );
    expect(configSource).toMatch(
      /preview:\s*\{[\s\S]*?host:\s*['"]127\.0\.0\.1['"]/,
    );
  });
});
