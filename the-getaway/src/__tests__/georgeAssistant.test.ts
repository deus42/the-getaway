import {
  buildAssistantIntel,
  buildConversationResponse,
  pickBanterLine,
  pickInterjectionLine,
} from '../game/systems/georgeAssistant';
import { ObjectiveQueueEntry } from '../store/selectors/questSelectors';
import { PersonalityProfile } from '../game/interfaces/types';

describe('George assistant helper utilities', () => {
  const basePersonality: PersonalityProfile = {
    alignment: 'sarcastic',
    flags: {
      earnest: 0.1,
      sarcastic: 0.7,
      ruthless: 0.1,
      stoic: 0.1,
    },
    lastUpdated: 0,
  };

  const objectiveQueue: ObjectiveQueueEntry[] = [
    {
      questId: 'quest_market_cache',
      questName: 'Market Cache Recovery',
      questDescription: 'Recover the lost cache',
      objective: {
        id: 'recover-keycard',
        description: 'Secure the Corporate Keycard hidden in Downtown.',
        isCompleted: false,
        type: 'collect',
        target: 'Corporate Keycard',
        count: 1,
        currentCount: 0,
      },
      priority: 0,
      isPrimary: true,
    },
    {
      questId: 'quest_datapad_truth',
      questName: 'Manifests of Control',
      questDescription: 'Deliver the datapad',
      objective: {
        id: 'deliver-naila',
        description: 'Deliver the datapad to Archivist Naila in Downtown.',
        isCompleted: false,
        type: 'talk',
        target: 'Archivist Naila',
      },
      priority: 10,
      isPrimary: false,
    },
  ];

  it('buildAssistantIntel returns tuned hints and status lines', () => {
    const intel = buildAssistantIntel({
      objectiveQueue,
      personality: basePersonality,
      karma: 250,
      factionReputation: {
        resistance: 45,
        corpsec: -20,
        scavengers: 5,
      },
    });

    expect(intel.primaryHint).toContain('Broadcast from your favorite snark circuit');
    expect(intel.secondaryHint).toContain('Optional chaos');
    expect(intel.statusLine).toContain('Karma steady (+250)');
    expect(intel.statusLine).toContain('Resistance +45');
    expect(intel.statusLine).toContain('CorpSec -20');
  });

  it('buildConversationResponse injects replacements into templates', () => {
    const response = buildConversationResponse('guidance', 'earnest', {
      primaryHint: 'Primary directive',
      secondaryHint: 'Optional follow-up',
    });

    expect(response.text).toContain('Primary directive');
    expect(response.text).toContain('Optional follow-up');
    expect(response.guidelineRef).toBe('plot.tone.guideline.1');
  });

  it('pickBanterLine returns deterministic output when Math.random is stubbed', () => {
    const originalRandom = Math.random;
    Math.random = () => 0;
    try {
      const line = pickBanterLine('stoic');
      expect(line.text.length).toBeGreaterThan(0);
    } finally {
      Math.random = originalRandom;
    }
  });

  it('buildAssistantIntel prefers mission objective summaries when provided', () => {
    const intel = buildAssistantIntel({
      objectiveQueue,
      personality: basePersonality,
      karma: 0,
      factionReputation: {
        resistance: 0,
        corpsec: 0,
        scavengers: 0,
      },
      missionPrimary: {
        id: 'mission-primary',
        label: 'Cut the broadcast uplink',
        summary: 'Silence the corp propaganda tower before curfew.',
        questIds: ['quest_market_cache'],
        kind: 'primary',
        totalQuests: 1,
        completedQuests: 0,
        isComplete: false,
      },
      missionSide: {
        id: 'mission-side',
        label: 'Map the drone sweep',
        summary: 'Shadow drones and log their corridor rotations.',
        questIds: ['quest_datapad_truth'],
        kind: 'side',
        totalQuests: 1,
        completedQuests: 0,
        isComplete: false,
      },
    });

    expect(intel.primaryHint).toContain('Cut the broadcast uplink');
    expect(intel.secondaryHint).toContain('Map the drone sweep');
  });

  it('pickInterjectionLine surfaces lines for distinct triggers', () => {
    const originalRandom = Math.random;
    Math.random = () => 0;
    try {
      const questLine = pickInterjectionLine('questCompleted', 'earnest');
      const hostileLine = pickInterjectionLine('hostileEntered', 'ruthless');
      expect(questLine?.text).toContain('Objective');
      expect(hostileLine?.text).toContain('Hostile zone');
    } finally {
      Math.random = originalRandom;
    }
  });
});
