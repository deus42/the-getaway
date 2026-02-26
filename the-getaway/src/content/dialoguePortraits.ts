export interface DialoguePortraitDefinition {
  id: string;
  initials: string;
  accentHex: string;
  gradientFromHex: string;
  gradientToHex: string;
  imagePath?: string;
}

const deriveInitials = (displayName?: string): string => {
  if (!displayName) {
    return '?';
  }

  const tokens = displayName
    .split(/[\s-]+/)
    .map((token) => token.trim())
    .filter(Boolean);

  if (tokens.length === 0) {
    return '?';
  }

  if (tokens.length === 1) {
    return tokens[0].slice(0, 2).toUpperCase();
  }

  return `${tokens[0][0] ?? ''}${tokens[1][0] ?? ''}`.toUpperCase();
};

export const DIALOGUE_PORTRAITS: Record<string, DialoguePortraitDefinition> = {
  lira_smuggler: {
    id: 'lira_smuggler',
    initials: 'LS',
    accentHex: '#f97316',
    gradientFromHex: '#7c2d12',
    gradientToHex: '#fb923c',
    imagePath: '/portraits/level0/lira_smuggler.svg',
  },
  archivist_naila: {
    id: 'archivist_naila',
    initials: 'AN',
    accentHex: '#38bdf8',
    gradientFromHex: '#0f172a',
    gradientToHex: '#0ea5e9',
    imagePath: '/portraits/level0/archivist_naila.svg',
  },
  courier_brant: {
    id: 'courier_brant',
    initials: 'CB',
    accentHex: '#22d3ee',
    gradientFromHex: '#0f172a',
    gradientToHex: '#14b8a6',
    imagePath: '/portraits/level0/courier_brant.svg',
  },
  firebrand_juno: {
    id: 'firebrand_juno',
    initials: 'FJ',
    accentHex: '#f43f5e',
    gradientFromHex: '#431407',
    gradientToHex: '#ef4444',
    imagePath: '/portraits/level0/firebrand_juno.svg',
  },
  seraph_warden: {
    id: 'seraph_warden',
    initials: 'SW',
    accentHex: '#93c5fd',
    gradientFromHex: '#1e293b',
    gradientToHex: '#3b82f6',
    imagePath: '/portraits/level0/seraph_warden.svg',
  },
  drone_handler_kesh: {
    id: 'drone_handler_kesh',
    initials: 'DK',
    accentHex: '#c084fc',
    gradientFromHex: '#312e81',
    gradientToHex: '#9333ea',
    imagePath: '/portraits/level0/drone_handler_kesh.svg',
  },
  medic_yara: {
    id: 'medic_yara',
    initials: 'MY',
    accentHex: '#4ade80',
    gradientFromHex: '#14532d',
    gradientToHex: '#16a34a',
    imagePath: '/portraits/level0/medic_yara.svg',
  },
  captain_reyna: {
    id: 'captain_reyna',
    initials: 'CR',
    accentHex: '#facc15',
    gradientFromHex: '#713f12',
    gradientToHex: '#f59e0b',
    imagePath: '/portraits/level0/captain_reyna.svg',
  },
};

const FALLBACK_PORTRAIT: Omit<DialoguePortraitDefinition, 'id' | 'initials'> = {
  accentHex: '#94a3b8',
  gradientFromHex: '#0f172a',
  gradientToHex: '#334155',
};

export const resolveDialoguePortrait = (
  portraitId?: string,
  displayName?: string
): DialoguePortraitDefinition => {
  if (portraitId && DIALOGUE_PORTRAITS[portraitId]) {
    return DIALOGUE_PORTRAITS[portraitId];
  }

  return {
    id: portraitId ?? 'portrait_fallback',
    initials: deriveInitials(displayName),
    ...FALLBACK_PORTRAIT,
  };
};
