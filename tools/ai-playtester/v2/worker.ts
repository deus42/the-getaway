import path from 'node:path';

import type { PlaytestPacketComputerUsePolicyV1 } from '../../../the-getaway/src/game/playtest/playtestContractV2.ts';

export const CODEX_COMMAND = '/opt/homebrew/bin/codex' as const;
export const CODEX_MODEL = 'gpt-5.6-sol' as const;
export const COMPUTER_USE_MCP_COMMAND =
  '/Users/deus/.codex/computer-use/Codex Computer Use.app/Contents/SharedSupport/SkyComputerUseClient.app/Contents/MacOS/SkyComputerUseClient' as const;
export const COMPUTER_USE_TOOLS = [
  'get_app_state',
  'click',
  'scroll',
  'drag',
  'press_key',
] as const;

export const DISABLED_WORKER_FEATURES = [
  'computer_use',
  'browser_use',
  'browser_use_external',
  'browser_use_full_cdp_access',
  'in_app_browser',
  'shell_tool',
  'unified_exec',
  'shell_snapshot',
  'apps',
  'plugins',
  'remote_plugin',
  'memories',
  'multi_agent',
  'goals',
  'hooks',
  'skill_search',
  'skill_mcp_dependency_install',
  'workspace_dependencies',
  'image_generation',
] as const;

export interface WorkerInvocationInput {
  workerHome: string;
  workerCwd: string;
  outputSchemaPath: string;
  outputPath: string;
  computerUsePolicy: PlaytestPacketComputerUsePolicyV1;
}

export interface WorkerInvocation {
  command: typeof CODEX_COMMAND;
  args: string[];
  env: Record<'CODEX_HOME' | 'HOME' | 'LANG' | 'LC_ALL' | 'PATH' | 'TMPDIR', string>;
}

const requireAbsolute = (label: string, value: string): void => {
  if (!path.isAbsolute(value)) {
    throw new Error(`${label} must be an absolute path.`);
  }
};

const config = (key: string, value: string): string[] => ['-c', `${key}=${value}`];

export const buildWorkerInvocation = (input: WorkerInvocationInput): WorkerInvocation => {
  requireAbsolute('workerHome', input.workerHome);
  requireAbsolute('workerCwd', input.workerCwd);
  requireAbsolute('outputSchemaPath', input.outputSchemaPath);
  requireAbsolute('outputPath', input.outputPath);
  if (path.resolve(input.workerHome) === path.resolve(input.workerCwd)) {
    throw new Error('workerHome and workerCwd must be distinct isolation paths.');
  }
  if (
    input.computerUsePolicy.actionTools.length === 0 ||
    input.computerUsePolicy.actionTools.some((tool) => !COMPUTER_USE_TOOLS.includes(tool)) ||
    (
      input.computerUsePolicy.actionTools.includes('press_key')
        ? input.computerUsePolicy.keys.length === 0
        : input.computerUsePolicy.keys.length !== 0
    )
  ) {
    throw new Error('Worker Computer Use policy is invalid.');
  }

  const enabledComputerUseTools = [
    'get_app_state',
    ...input.computerUsePolicy.actionTools,
  ];

  const args = [
    'exec',
    '--ignore-user-config',
    '--ignore-rules',
    '--strict-config',
    '--skip-git-repo-check',
    '--cd',
    input.workerCwd,
    '--sandbox',
    'read-only',
    '--model',
    CODEX_MODEL,
    ...config('model_provider', '"openai"'),
    ...config('model_reasoning_effort', '"high"'),
    ...config('approval_policy', '"never"'),
    // Preserve the disposable worker's state database until the supervisor has
    // attested it; the entire isolated home is removed immediately afterwards.
    ...config('history.persistence', '"save-all"'),
    ...config('web_search', '"disabled"'),
    ...config('tools.web_search', 'false'),
  ];

  for (const feature of DISABLED_WORKER_FEATURES) {
    args.push('--disable', feature);
  }

  args.push(
    // SkyComputerUseClient authenticates its immediate parent. Keep the signed Codex
    // process directly above it; an interposed Node/tsx proxy is rejected by macOS.
    ...config('mcp_servers.computer-use.command', JSON.stringify(COMPUTER_USE_MCP_COMMAND)),
    ...config('mcp_servers.computer-use.args', JSON.stringify(['mcp'])),
    ...config('mcp_servers.computer-use.cwd', JSON.stringify(input.workerCwd)),
    ...config('mcp_servers.computer-use.enabled', 'true'),
    ...config('mcp_servers.computer-use.enabled_tools', JSON.stringify(enabledComputerUseTools)),
    ...config('mcp_servers.computer-use.startup_timeout_sec', '10'),
    ...config('mcp_servers.computer-use.tool_timeout_sec', '90'),
    '--json',
    '--output-schema',
    input.outputSchemaPath,
    '--output-last-message',
    input.outputPath,
    '--color',
    'never',
    '-'
  );

  return {
    command: CODEX_COMMAND,
    args,
    env: {
      CODEX_HOME: input.workerHome,
      HOME: input.workerHome,
      LANG: 'en_US.UTF-8',
      LC_ALL: 'en_US.UTF-8',
      PATH: '/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin',
      TMPDIR: path.dirname(input.workerHome),
    },
  };
};
