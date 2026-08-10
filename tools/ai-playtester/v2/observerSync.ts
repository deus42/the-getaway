import { createHmac, timingSafeEqual } from 'node:crypto';
import { chmod, mkdir, rm } from 'node:fs/promises';
import { createConnection, createServer, type Socket } from 'node:net';
import path from 'node:path';

export const OBSERVER_CAPTURE_SYNC_REQUEST_SCHEMA =
  'observer_capture_sync_request_v1' as const;
const OBSERVER_CAPTURE_SYNC_ACK_SCHEMA = 'observer_capture_sync_ack_v1' as const;
const MAX_SYNC_MESSAGE_BYTES = 8 * 1024;

export interface ObserverCaptureSyncRequest {
  schema: typeof OBSERVER_CAPTURE_SYNC_REQUEST_SCHEMA;
  sequence: number;
  token: string;
  captureResultSha256: string;
  authTag: string;
}

interface ObserverCaptureSyncAcknowledgement {
  schema: typeof OBSERVER_CAPTURE_SYNC_ACK_SCHEMA;
  sequence: number;
  token: string;
  ok: boolean;
  authTag: string;
}

export interface ObserverCaptureSyncServerHandle {
  socketPath: string;
  close(): Promise<void>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const validateSecret = (secret: string): void => {
  if (!/^[a-f\d]{64}$/i.test(secret)) {
    throw new Error('Observer capture synchronization secret is invalid.');
  }
};

const requestAuthPayload = (request: Omit<ObserverCaptureSyncRequest, 'authTag'>): string =>
  [request.schema, request.sequence, request.token, request.captureResultSha256].join('\0');

const acknowledgementAuthPayload = (
  acknowledgement: Omit<ObserverCaptureSyncAcknowledgement, 'authTag'>
): string => [
  acknowledgement.schema,
  acknowledgement.sequence,
  acknowledgement.token,
  acknowledgement.ok ? 'true' : 'false',
].join('\0');

const sign = (secret: string, payload: string): string =>
  createHmac('sha256', secret).update(payload).digest('hex');

const authentic = (actual: string, expected: string): boolean =>
  /^[a-f\d]{64}$/i.test(actual) &&
  timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'));

export const createObserverCaptureSyncRequest = (input: {
  secret: string;
  sequence: number;
  token: string;
  captureResultSha256: string;
}): ObserverCaptureSyncRequest => {
  validateSecret(input.secret);
  const unsigned = {
    schema: OBSERVER_CAPTURE_SYNC_REQUEST_SCHEMA,
    sequence: input.sequence,
    token: input.token,
    captureResultSha256: input.captureResultSha256,
  } as const;
  return { ...unsigned, authTag: sign(input.secret, requestAuthPayload(unsigned)) };
};

export const parseObserverCaptureSyncRequest = (
  value: unknown,
  secret: string,
  expectedSequence: number
): ObserverCaptureSyncRequest => {
  validateSecret(secret);
  if (
    !isRecord(value) ||
    value.schema !== OBSERVER_CAPTURE_SYNC_REQUEST_SCHEMA ||
    value.sequence !== expectedSequence ||
    !Number.isSafeInteger(value.sequence) ||
    value.sequence < 1 ||
    typeof value.token !== 'string' ||
    !/^[a-z0-9-]{1,128}$/i.test(value.token) ||
    typeof value.captureResultSha256 !== 'string' ||
    !/^[a-f\d]{64}$/i.test(value.captureResultSha256) ||
    typeof value.authTag !== 'string'
  ) {
    throw new Error('Observer capture synchronization request is malformed.');
  }
  const request = {
    schema: OBSERVER_CAPTURE_SYNC_REQUEST_SCHEMA,
    sequence: value.sequence,
    token: value.token,
    captureResultSha256: value.captureResultSha256,
    authTag: value.authTag,
  };
  if (!authentic(request.authTag, sign(secret, requestAuthPayload(request)))) {
    throw new Error('Observer capture synchronization request is unauthenticated.');
  }
  return request;
};

const acknowledgement = (
  secret: string,
  sequence: number,
  token: string,
  ok: boolean
): ObserverCaptureSyncAcknowledgement => {
  const unsigned = {
    schema: OBSERVER_CAPTURE_SYNC_ACK_SCHEMA,
    sequence,
    token,
    ok,
  } as const;
  return { ...unsigned, authTag: sign(secret, acknowledgementAuthPayload(unsigned)) };
};

const withTimeout = async <T>(
  operation: Promise<T>,
  timeoutMs: number,
  message: string
): Promise<T> => {
  let timeout: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
};

export const startObserverCaptureSyncServer = async (
  socketPath: string,
  secret: string,
  onCapture: (request: ObserverCaptureSyncRequest) => Promise<void>,
  captureTimeoutMs = 10_000
): Promise<ObserverCaptureSyncServerHandle> => {
  validateSecret(secret);
  if (!path.isAbsolute(socketPath)) {
    throw new Error('Observer capture synchronization socket path must be absolute.');
  }
  await mkdir(path.dirname(socketPath), { recursive: true, mode: 0o700 });
  await rm(socketPath, { force: true });

  const activeSockets = new Set<Socket>();
  let captureQueue: Promise<void> = Promise.resolve();
  let expectedSequence = 1;
  const seenTokens = new Set<string>();
  let closed = false;
  const server = createServer((socket) => {
    activeSockets.add(socket);
    socket.setEncoding('utf8');
    let buffer = '';
    let handled = false;

    const handleLine = async (line: string): Promise<void> => {
      let requestForAcknowledgement: ObserverCaptureSyncRequest | undefined;
      try {
        const capture = captureQueue.then(async () => {
          const request = parseObserverCaptureSyncRequest(
            JSON.parse(line) as unknown,
            secret,
            expectedSequence
          );
          if (seenTokens.has(request.token)) {
            throw new Error('Observer capture synchronization token was replayed.');
          }
          requestForAcknowledgement = request;
          seenTokens.add(request.token);
          expectedSequence += 1;
          await withTimeout(
            Promise.resolve(onCapture(request)),
            captureTimeoutMs,
            'Observer capture callback timed out.'
          );
        });
        captureQueue = capture.catch(() => undefined);
        await capture;
        const request = requestForAcknowledgement!;
        socket.end(`${JSON.stringify(acknowledgement(
          secret,
          request.sequence,
          request.token,
          true
        ))}\n`);
      } catch {
        const request = requestForAcknowledgement;
        socket.end(`${JSON.stringify(acknowledgement(
          secret,
          request?.sequence ?? 0,
          request?.token ?? 'invalid',
          false
        ))}\n`);
      }
    };

    socket.on('data', (chunk: string) => {
      if (handled) return;
      buffer += chunk;
      if (Buffer.byteLength(buffer, 'utf8') > MAX_SYNC_MESSAGE_BYTES) {
        handled = true;
        socket.end(`${JSON.stringify(acknowledgement(secret, 0, 'invalid', false))}\n`);
        return;
      }
      const newlineIndex = buffer.indexOf('\n');
      if (newlineIndex < 0) return;
      handled = true;
      void handleLine(buffer.slice(0, newlineIndex));
    });
    socket.on('error', () => undefined);
    socket.on('close', () => activeSockets.delete(socket));
  });

  await new Promise<void>((resolve, reject) => {
    const onError = (error: Error): void => reject(error);
    server.once('error', onError);
    server.listen(socketPath, () => {
      server.off('error', onError);
      resolve();
    });
  });
  await chmod(socketPath, 0o600);

  return {
    socketPath,
    close: async () => {
      if (closed) return;
      closed = true;
      for (const socket of activeSockets) socket.destroy();
      await captureQueue.catch(() => undefined);
      await new Promise<void>((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
      });
      await rm(socketPath, { force: true });
    },
  };
};

export const synchronizeObserverCapture = (
  socketPath: string,
  secret: string,
  request: ObserverCaptureSyncRequest,
  timeoutMs = 10_000
): Promise<void> => {
  parseObserverCaptureSyncRequest(request, secret, request.sequence);
  return new Promise((resolve, reject) => {
    const socket = createConnection(socketPath);
    socket.setEncoding('utf8');
    let buffer = '';
    let settled = false;
    const timeout = setTimeout(() => {
      finish(new Error('Observer capture synchronization timed out.'));
    }, timeoutMs);
    const finish = (error?: Error): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      socket.destroy();
      if (error) reject(error);
      else resolve();
    };

    socket.once('connect', () => {
      socket.write(`${JSON.stringify(request)}\n`);
    });
    socket.on('data', (chunk: string) => {
      buffer += chunk;
      if (Buffer.byteLength(buffer, 'utf8') > MAX_SYNC_MESSAGE_BYTES) {
        finish(new Error('Observer capture synchronization acknowledgement was too large.'));
        return;
      }
      const newlineIndex = buffer.indexOf('\n');
      if (newlineIndex < 0) return;
      try {
        const value = JSON.parse(buffer.slice(0, newlineIndex)) as unknown;
        if (
          !isRecord(value) ||
          value.schema !== OBSERVER_CAPTURE_SYNC_ACK_SCHEMA ||
          value.sequence !== request.sequence ||
          value.token !== request.token ||
          value.ok !== true ||
          typeof value.authTag !== 'string' ||
          !authentic(value.authTag, sign(secret, acknowledgementAuthPayload({
            schema: OBSERVER_CAPTURE_SYNC_ACK_SCHEMA,
            sequence: request.sequence,
            token: request.token,
            ok: true,
          })))
        ) {
          throw new Error('Observer rejected the synchronized capture.');
        }
        finish();
      } catch (error) {
        finish(error as Error);
      }
    });
    socket.once('error', (error) => finish(error));
    socket.once('end', () => {
      if (!settled) {
        finish(new Error('Observer capture synchronization ended without acknowledgement.'));
      }
    });
  });
};
