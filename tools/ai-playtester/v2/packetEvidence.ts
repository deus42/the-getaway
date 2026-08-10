import { createHash } from 'node:crypto';
import { chmod, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { ReviewedPlaytestPacketV1 } from './packets.ts';

export interface ReviewedPacketBinding {
  revision: number;
  sha256: string;
  evidenceRef: string;
}

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right, 'en'))
      .map(([key, entry]) => [key, canonicalize(entry)])
  );
};

export const canonicalReviewedPacketJson = (
  packet: ReviewedPlaytestPacketV1
): string => JSON.stringify(canonicalize(packet));

export const bindReviewedPacket = async (
  runDirectory: string,
  packet: ReviewedPlaytestPacketV1
): Promise<ReviewedPacketBinding> => {
  const canonicalPacket = canonicalReviewedPacketJson(packet);
  const sha256 = createHash('sha256').update(canonicalPacket).digest('hex');
  const evidenceRef = 'playtest-packet.json';
  const evidencePath = path.join(runDirectory, evidenceRef);
  await writeFile(
    evidencePath,
    `${JSON.stringify({
      schema: 'reviewed_playtest_packet_evidence_v1',
      packetSha256: sha256,
      packet: JSON.parse(canonicalPacket) as unknown,
    }, null, 2)}\n`,
    'utf8'
  );
  await chmod(evidencePath, 0o600);
  return { revision: packet.revision, sha256, evidenceRef };
};
