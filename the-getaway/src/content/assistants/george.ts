import { PersonalityTrait } from '../../game/interfaces/types';

export interface GeorgeLine {
  text: string;
  guidelineRef: string;
}

export interface GeorgeDialogueTemplate {
  id: 'guidance' | 'status' | 'banter';
  prompt: string;
  responses: Record<PersonalityTrait, GeorgeLine> & { earnest: GeorgeLine };
}

export type GeorgeInterjectionTrigger =
  | 'questCompleted'
  | 'reputationPositive'
  | 'reputationNegative'
  | 'hostileEntered';

export type GeorgeInterjectionLibrary = Record<GeorgeInterjectionTrigger, Record<PersonalityTrait, GeorgeLine[]>>;

interface GeorgeDialogueLibrary {
  prompts: GeorgeDialogueTemplate[];
  banter: Record<PersonalityTrait, GeorgeLine[]> & { earnest: GeorgeLine[] };
  interjections: GeorgeInterjectionLibrary;
}

export const GEORGE_DIALOGUE_LIBRARY: GeorgeDialogueLibrary = {
  prompts: [
    {
      id: 'guidance',
      prompt: 'What should I do?',
      responses: {
        earnest: {
          text: '{{primaryHint}}. {{secondaryHint}}',
          guidelineRef: 'plot.tone.guideline.1',
        },
        sarcastic: {
          text: 'Headline flash: {{primaryHint}}. Bonus mischief: {{secondaryHint}}',
          guidelineRef: 'plot.tone.guideline.4',
        },
        ruthless: {
          text: 'Mission chain: {{primaryHint}}. Secondary vector: {{secondaryHint}}',
          guidelineRef: 'plot.tone.guideline.5',
        },
        stoic: {
          text: 'Orders remain: {{primaryHint}}. Auxiliary thread: {{secondaryHint}}',
          guidelineRef: 'plot.tone.guideline.3',
        },
      },
    },
    {
      id: 'status',
      prompt: 'How are we doing?',
      responses: {
        earnest: {
          text: 'Vitals read steady: {{statusLine}}. Keep breathing; Shelterline hears every win.',
          guidelineRef: 'plot.tone.guideline.7',
        },
        sarcastic: {
          text: 'Dashboard says {{statusLine}}. Translation: we’re still on the playlists the drones hate.',
          guidelineRef: 'plot.tone.guideline.4',
        },
        ruthless: {
          text: 'Metrics: {{statusLine}}. We push until the numbers blink surrender.',
          guidelineRef: 'plot.tone.guideline.5',
        },
        stoic: {
          text: 'Telemetry synced: {{statusLine}}. Adjustments queued as conditions evolve.',
          guidelineRef: 'plot.tone.guideline.3',
        },
      },
    },
    {
      id: 'banter',
      prompt: 'Give me something weird.',
      responses: {
        earnest: {
          text: '{{banterLine}}',
          guidelineRef: 'plot.tone.guideline.2',
        },
        sarcastic: {
          text: '{{banterLine}}',
          guidelineRef: 'plot.tone.guideline.4',
        },
        ruthless: {
          text: '{{banterLine}}',
          guidelineRef: 'plot.tone.guideline.5',
        },
        stoic: {
          text: '{{banterLine}}',
          guidelineRef: 'plot.tone.guideline.3',
        },
      },
    },
  ],
  banter: {
    earnest: [
      {
        text: 'Shelterline kids started a rumor that thunder is just the ocean applauding us. Let’s stay worth the encore.',
        guidelineRef: 'plot.tone.guideline.7',
      },
      {
        text: 'Amara logged a new morale playlist: ninety minutes of clattering cutlery recorded during a pre-war dinner rush. We could dance to that later.',
        guidelineRef: 'plot.tone.guideline.6',
      },
    ],
    sarcastic: [
      {
        text: 'CorpSec just issued an alert about “unauthorized optimism in Sector 12.” Congratulations, you’re contraband joy.',
        guidelineRef: 'plot.tone.guideline.4',
      },
      {
        text: 'Fun fact: drone firmware now includes “coyote deterrent mode.” Somewhere an engineer thinks we’re wildlife. Let’s give them a nature documentary.',
        guidelineRef: 'plot.tone.guideline.2',
      },
    ],
    ruthless: [
      {
        text: 'Found an ESD memo describing us as “surgical entropy.” I’ll embrace the brand if you do.',
        guidelineRef: 'plot.tone.guideline.5',
      },
      {
        text: 'CorpSec requisitioned riot foam flavored like citrus. Imagine choking on oranges while we dismantle their barricade.',
        guidelineRef: 'plot.tone.guideline.2',
      },
    ],
    stoic: [
      {
        text: 'Filed under anomalies: pigeons roosting in the comms tower tapped out Morse for “stay loud.” No human hands detected.',
        guidelineRef: 'plot.tone.guideline.2',
      },
      {
        text: 'Supply ledger shows someone requisitioned 40 kilos of glitter for “psychological operations.” I logged it as “to be determined.”',
        guidelineRef: 'plot.tone.guideline.3',
      },
    ],
  },
  interjections: {
    questCompleted: {
      earnest: [
        {
          text: 'Objective archived. You just stretched curfew a little thinner.',
          guidelineRef: 'plot.tone.guideline.1',
        },
        {
          text: 'Quest wrapped. Shelterline will taste this win in their next ration drop.',
          guidelineRef: 'plot.tone.guideline.7',
        },
      ],
      sarcastic: [
        {
          text: 'You crushed that objective so hard the drones filed a workplace grievance.',
          guidelineRef: 'plot.tone.guideline.4',
        },
        {
          text: 'Quest complete. Somewhere an ESD analyst just spat in their nutrient slurry.',
          guidelineRef: 'plot.tone.guideline.4',
        },
      ],
      ruthless: [
        {
          text: 'Target neutralized. Momentum stays with us.',
          guidelineRef: 'plot.tone.guideline.5',
        },
        {
          text: 'Objective cleared. Line them up for the next strike.',
          guidelineRef: 'plot.tone.guideline.5',
        },
      ],
      stoic: [
        {
          text: 'Task completed. Logging success before it cools.',
          guidelineRef: 'plot.tone.guideline.3',
        },
        {
          text: 'Objective done. Updating projections now.',
          guidelineRef: 'plot.tone.guideline.3',
        },
      ],
    },
    reputationPositive: {
      earnest: [
        {
          text: 'Your name circulates with smiles today. Resistance morale just spiked.',
          guidelineRef: 'plot.tone.guideline.7',
        },
      ],
      sarcastic: [
        {
          text: 'Congrats, you’re trending on the underground net for something other than property damage.',
          guidelineRef: 'plot.tone.guideline.4',
        },
      ],
      ruthless: [
        {
          text: 'Factions noticed your precision. They’ll expect more sharp edges.',
          guidelineRef: 'plot.tone.guideline.5',
        },
      ],
      stoic: [
        {
          text: 'Reputation bump logged. Allies recalibrating expectations.',
          guidelineRef: 'plot.tone.guideline.3',
        },
      ],
    },
    reputationNegative: {
      earnest: [
        {
          text: 'Heads up: whispers turned uneasy. We might need to mend fences soon.',
          guidelineRef: 'plot.tone.guideline.1',
        },
      ],
      sarcastic: [
        {
          text: 'Your popularity dip just broke a few pirate radio polls. Impressive in its own way.',
          guidelineRef: 'plot.tone.guideline.4',
        },
      ],
      ruthless: [
        {
          text: 'Standing dropped. Intimidation can be leverage, but watch the collateral.',
          guidelineRef: 'plot.tone.guideline.5',
        },
      ],
      stoic: [
        {
          text: 'Faction trust decaying. Rebalancing recommendations forthcoming.',
          guidelineRef: 'plot.tone.guideline.3',
        },
      ],
    },
    hostileEntered: {
      earnest: [
        {
          text: 'Sensors scream hostile territory. Stay quick, stay breathing.',
          guidelineRef: 'plot.tone.guideline.1',
        },
      ],
      sarcastic: [
        {
          text: 'Welcome to enemy hospitality. Complimentary bullets on the mezzanine.',
          guidelineRef: 'plot.tone.guideline.4',
        },
      ],
      ruthless: [
        {
          text: 'Hostile zone confirmed. Perfect conditions for decisive violence.',
          guidelineRef: 'plot.tone.guideline.5',
        },
      ],
      stoic: [
        {
          text: 'Hostility detected. Updating threat overlay now.',
          guidelineRef: 'plot.tone.guideline.3',
        },
      ],
    },
  },
};
