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
    accentHex: '#d99a50',
    gradientFromHex: '#1b1f24',
    gradientToHex: '#513b35',
    imagePath: '/portraits/level0/contact_lira.png',
  },
  archivist_naila: {
    id: 'archivist_naila',
    initials: 'AN',
    accentHex: '#d5c8b5',
    gradientFromHex: '#0b0d12',
    gradientToHex: '#31373a',
    imagePath: '/portraits/level0/contact_naila.png',
  },
  courier_brant: {
    id: 'courier_brant',
    initials: 'CB',
    accentHex: '#d99a50',
    gradientFromHex: '#1b1f24',
    gradientToHex: '#513b35',
    imagePath: '/portraits/level0/contact_brant.png',
  },
  firebrand_juno: {
    id: 'firebrand_juno',
    initials: 'FJ',
    accentHex: '#8e4147',
    gradientFromHex: '#1d1214',
    gradientToHex: '#513035',
  },
  seraph_warden: {
    id: 'seraph_warden',
    initials: 'SW',
    accentHex: '#d5c8b5',
    gradientFromHex: '#0b0d12',
    gradientToHex: '#514a42',
  },
  drone_handler_kesh: {
    id: 'drone_handler_kesh',
    initials: 'DK',
    accentHex: '#50bfd0',
    gradientFromHex: '#0b0d12',
    gradientToHex: '#334b4b',
  },
  medic_yara: {
    id: 'medic_yara',
    initials: 'MY',
    accentHex: '#5b7775',
    gradientFromHex: '#0b0d12',
    gradientToHex: '#334541',
  },
  captain_reyna: {
    id: 'captain_reyna',
    initials: 'CR',
    accentHex: '#8e4147',
    gradientFromHex: '#0b0d12',
    gradientToHex: '#51272d',
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
