const noop = () => undefined;

type LogMethod = (...args: unknown[]) => void;

type ConsoleMethod = 'debug' | 'info' | 'warn' | 'error';

const resolveEnvironment = (): string => {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV) {
    return process.env.NODE_ENV;
  }

  return 'development';
};

const hasVerboseOverride = (): boolean => {
  const overrideFlags = [
    typeof process !== 'undefined' ? process.env?.ENABLE_VERBOSE_LOGS : undefined,
    typeof globalThis !== 'undefined'
      ? (globalThis as { __ENABLE_VERBOSE_LOGS?: unknown }).__ENABLE_VERBOSE_LOGS
      : undefined,
  ];

  return overrideFlags.some((flag) => {
    if (typeof flag === 'string') {
      return flag.toLowerCase() === 'true';
    }
    return flag === true;
  });
};

const shouldSuppressLogs = !hasVerboseOverride() && resolveEnvironment() === 'test';

const getConsoleMethod = (method: ConsoleMethod): LogMethod => {
  const candidate = console[method] ?? console.log;
  if (typeof candidate === 'function') {
    return candidate.bind(console);
  }
  return console.log.bind(console);
};

const bindConsoleMethod = (method: ConsoleMethod, scope: string): LogMethod => {
  const consoleMethod = getConsoleMethod(method);

  if (shouldSuppressLogs && (method === 'debug' || method === 'info')) {
    return noop;
  }

  return (...args: unknown[]) => {
    consoleMethod(`[${scope}]`, ...args);
  };
};

export type ScopedLogger = Record<ConsoleMethod, LogMethod>;

export const createScopedLogger = (scope: string): ScopedLogger => ({
  debug: bindConsoleMethod('debug', scope),
  info: bindConsoleMethod('info', scope),
  warn: bindConsoleMethod('warn', scope),
  error: bindConsoleMethod('error', scope),
});

export const logger = createScopedLogger('app');
