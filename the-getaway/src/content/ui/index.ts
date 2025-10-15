import { Locale } from '../locales';
import { TimeOfDay } from '../../game/world/dayNightCycle';

type SkillKey =
  | 'strength'
  | 'perception'
  | 'endurance'
  | 'charisma'
  | 'intelligence'
  | 'agility'
  | 'luck';

type StatFocusKey =
  | 'combat'
  | 'perception'
  | 'survival'
  | 'social'
  | 'intellect'
  | 'mobility'
  | 'fortuity';

type PersonalityAlignment = 'earnest' | 'sarcastic' | 'ruthless' | 'stoic';
type AmbientCategoryKey = 'rumor' | 'signage' | 'weather' | 'zoneDanger' | 'hazardChange';
type StoryFunctionKey = 'foreshadow' | 'misdirect' | 'payoff' | 'world-building';
type EnvironmentFlagKey = 'gangHeat' | 'curfewLevel' | 'supplyScarcity' | 'blackoutTier';

interface MenuStrings {
  tag: string;
  title: string;
  tagline: string;
  start: string;
  resume: string;
  settingsHeading: string;
  languageLabel: string;
  alphaLabel: (year: number) => string;
  languageNames: Record<Locale, string>;
}

interface QuestLogStrings {
  panelLabel: string;
  title: string;
  active: string;
  completed: string;
  empty: string;
  rewardsHeading: string;
  currencyLabel: (amount: number) => string;
  experienceLabel: (amount: number) => string;
  supplyFallback: string;
}

interface ShellStrings {
  reconLabel: string;
  reconTitle: string;
  squadLabel: string;
  squadTitle: string;
  telemetryLabel: string;
  telemetryTitle: string;
  menuButton: string;
  characterButton: string;
  characterTitle: string;
  characterSubtitle: string;
  collapseLeft: string;
  expandLeft: string;
  collapseRight: string;
  expandRight: string;
}

interface PlayerStatusStrings {
  vitalsLabel: string;
  vitalsHint: string;
  readinessLabel: string;
  readinessHint: string;
  levelLabel: string;
  experienceLabel: string;
  creditsLabel: string;
  actionPointsLabel: string;
  staminaLabel: string;
  fatigueStatus: string;
  fatigueHint: string;
  crouchIndicator: string;
  roundLabel: (round: number) => string;
  yourMove: string;
  enemyAdvance: string;
  hostilesLabel: (count: number) => string;
  capabilitiesLabel: string;
  skillsHint: string;
  inventoryLabel: string;
  inventoryItems: (count: number) => string;
  inventoryWeight: (current: number, max: number) => string;
  inventoryEmpty: string;
  inventoryOverflow: (count: number) => string;
  attributesLabel: string;
  attributesTitle: string;
  attributePointsLabel: string;
  attributePointsHint: string;
  increaseAttribute?: ((abbr: string) => string) | string;
  attributeMaxed: string;
  derivedLabel: string;
  derivedTitle: string;
  derivedStats: DerivedStatsStrings;
  factionReputationLabel: string;
  factions: {
    resistance: string;
    corpsec: string;
    scavengers: string;
  };
}

interface DerivedStatsStrings {
  hp: string;
  ap: string;
  stamina: string;
  carryWeight: string;
  crit: string;
  hit: string;
  dodge: string;
}

interface FactionPanelStrings {
  heading: string;
  ariaLabel: string;
  standingLabel: string;
  reputationLabel: string;
  effectsLabel: string;
  noEffects: string;
  nextThreshold: (standing: string, value: number) => string;
  maxStanding: string;
}

interface FactionToastStrings {
  reputationChange: (factionName: string, delta: string, reason?: string) => string;
  standingChange: (standing: string) => string;
  rivalChange: (factionName: string, delta: string, standing?: string) => string;
  reasons: Record<string, string>;
}

interface MiniMapStrings {
  heading: string;
  playerLabel?: string;
  enemyLabel?: string;
  npcLabel?: string;
  objectiveLabel?: string;
  objectivesHeading?: string;
  noObjectives?: string;
}

interface DayNightStrings {
  timeOfDay: Record<TimeOfDay, string>;
  phaseLabel: string;
  nextLabel: string;
  nextIn: (time: string) => string;
  resetLabel: string;
  progressLabel: string;
  curfewEnforced: string;
  safeToTravel: string;
}

interface LevelIndicatorStrings {
  levelLabel: string;
  zoneLabel: string;
  dangerLabel: string;
  zoneSummaryLabel: string;
  zoneObjectivesLabel: string;
  objectivesLabel: string;
  emptyObjectives: string;
  sideObjectivesLabel: string;
  noSideObjectives: string;
  missionReadyBadge: string;
  primaryCompleteFootnote: string;
  unknownLevel: string;
  hazardsLabel: string;
  hazardsNone: string;
  dangerLevels: Record<'low' | 'moderate' | 'high' | 'critical', string>;
}

interface MissionStrings {
  accomplishedTitle: string;
  accomplishedSubtitle: (levelName: string) => string;
  primarySummaryLabel: string;
  continueCta: string;
  deferCta: string;
  deferHint: string;
  sideReminder: string;
}

interface DialogueOverlayStrings {
  closeButton: string;
  questLocks: {
    alreadyCompleted: string;
    alreadyActive: string;
    notActive: string;
    objectiveCompleted: string;
  };
  requiresSkill: (requirement: string) => string;
  checkSkill: (requirement: string) => string;
  escHint: string;
  itemRecoveredDescription: (questName: string) => string;
}

interface PerkStrings {
  panelTitle: string;
  remainingLabel: (count: number) => string;
  categoryLabels: Record<'combat' | 'utility' | 'dialogue' | 'capstone', string>;
  selectLabel: string;
  lockedLabel: string;
  closeLabel: string;
  requirementsLabel: string;
  effectsLabel: string;
  alreadyOwnedLabel: string;
  capstoneTag: string;
  emptyLabel: string;
}

interface GeorgeStrings {
  dockLabel: string;
  dockStatusIdle: string;
  consoleTitle: string;
  subtitle: (alignment: string) => string;
  guidanceIntro: string;
  statusIntro: (statusLine: string) => string;
  questsIntro: string;
  questNone: string;
  questMore: string;
  interjectionIdle: string;
  logEmpty: string;
  options: Record<'guidance' | 'status' | 'quests', string>;
  references: Record<'guidance' | 'status' | 'quests' | 'ambient' | 'prompt', string>;
  actors: Record<'george' | 'player', string>;
  ambientFeed: {
    tabs: { intel: string; ambient: string };
    empty: string;
    dockBadge: string;
    categoryLabels: Record<AmbientCategoryKey, string>;
    fallbacks: Record<'rumor' | 'signage' | 'weather', string>;
    storyFunctionLabels: Record<StoryFunctionKey, string>;
    flagLabels: Record<EnvironmentFlagKey, string>;
    formatFlagValue: (key: EnvironmentFlagKey, value: string | number) => string;
    dangerFallback: string;
    formatRumor: (payload: { line: string; storyLabel?: string }, alignment: PersonalityAlignment) => string;
    formatSignage: (payload: { text: string; storyLabel?: string }, alignment: PersonalityAlignment) => string;
    formatWeather: (payload: { description: string; storyLabel?: string }, alignment: PersonalityAlignment) => string;
    formatZoneDanger: (payload: {
      zoneName?: string | null;
      dangerLabel: string;
      previousDangerLabel?: string | null;
      flagChanges: Array<{ label: string; previous: string; next: string }>;
    }, alignment: PersonalityAlignment) => string;
    formatHazards: (payload: {
      zoneName?: string | null;
      additions: string[];
      removals: string[];
    }, alignment: PersonalityAlignment) => string;
  };
  ambient: string[];
}

interface UIStrings {
  menu: MenuStrings;
  questLog: QuestLogStrings;
  shell: ShellStrings;
  playerStatus: PlayerStatusStrings;
  factionPanel: FactionPanelStrings;
  factionToast: FactionToastStrings;
  miniMap: MiniMapStrings;
  dayNight: DayNightStrings;
  levelIndicator: LevelIndicatorStrings;
  dialogueOverlay: DialogueOverlayStrings;
  perks: PerkStrings;
  skills: Record<SkillKey, string>;
  skillDescriptions: Record<SkillKey, string>;
  statFocus: Record<StatFocusKey, string>;
  george: GeorgeStrings;
  mission: MissionStrings;
}

const STRINGS: Record<Locale, UIStrings> = {
  en: {
    menu: {
      tag: 'The Getaway',
      title: 'Escape the Regime',
      tagline:
        'Lead your cell through the fortified Slums. Stealth or strike? Every move echoes through the city.',
      start: 'Start New Game',
      resume: 'Resume Game',
      settingsHeading: 'Settings',
      languageLabel: 'Language',
      alphaLabel: (year: number) => `Alpha Build ${year}`,
      languageNames: {
        en: 'English',
        uk: 'Українська',
      },
    },
    questLog: {
      panelLabel: 'Quests',
      title: 'Quest Log',
      active: 'Active Quests',
      completed: 'Completed Quests',
      empty: 'No quests tracked. Connect with contacts to unlock new objectives.',
      rewardsHeading: 'Rewards',
      currencyLabel: (amount) => `₿${amount} ${amount === 1 ? 'credit' : 'credits'}`,
      experienceLabel: (amount) => `${amount} XP`,
      supplyFallback: 'Supply',
    },
    shell: {
      reconLabel: 'Recon',
      reconTitle: 'Tactical Feed',
      squadLabel: 'Squad',
      squadTitle: 'Recon Status',
      telemetryLabel: 'Telemetry',
      telemetryTitle: 'Action Log',
      menuButton: 'Menu',
      characterButton: 'Character',
      characterTitle: 'Operative Profile',
      characterSubtitle: 'Stats • Skills • Loadout',
      collapseLeft: 'Hide Recon Panel',
      expandLeft: 'Show Recon Panel',
      collapseRight: 'Hide Ops Panel',
      expandRight: 'Show Ops Panel',
    },
    playerStatus: {
      vitalsLabel: 'Vital Status',
      vitalsHint: 'Keep your vitals stable—the regime rations medkits after curfew.',
      readinessLabel: 'Combat Readiness',
      readinessHint: 'Track AP, kit, and morale between engagements.',
      levelLabel: 'Level',
      experienceLabel: 'Experience',
      creditsLabel: 'Credits',
      actionPointsLabel: 'Action Points',
      staminaLabel: 'Stamina',
      fatigueStatus: 'Fatigued',
      fatigueHint: 'Fatigue makes this harder—rest or recover stamina to shake it off.',
      crouchIndicator: 'Crouching',
      roundLabel: (round) => `Round ${round}`,
      yourMove: 'Your move',
      enemyAdvance: 'Enemy advance',
      hostilesLabel: (count) => `${count} ${count === 1 ? 'hostile' : 'hostiles'}`,
      capabilitiesLabel: 'Capabilities & Inventory',
      skillsHint: 'Core proficiencies influence dialogue checks and tactics.',
      inventoryLabel: 'Pack Overview',
      inventoryItems: (count) => `Items: ${count}`,
      inventoryWeight: (current, max) => {
        const currentLoad = Math.round(current * 10) / 10;
        const maxLoad = Math.round(max * 10) / 10;
        return `Load: ${currentLoad}/${maxLoad}`;
      },
      inventoryEmpty: 'Pack is empty — scavenge essentials.',
      inventoryOverflow: (count) => `+${count} more`,
      attributesLabel: 'Core Attributes',
      attributesTitle: 'S.P.E.C.I.A.L. Profile',
      attributePointsLabel: 'Attribute Points Available',
      attributePointsHint: 'Spend these to raise your base SPECIAL stats before the next encounter.',
      increaseAttribute: (abbr) => `Increase ${abbr}`,
      attributeMaxed: 'Attribute already at maximum value.',
      derivedLabel: 'Derived Metrics',
      derivedTitle: 'Combat Readouts',
      derivedStats: {
        hp: 'Max HP',
        ap: 'Action Points',
        stamina: 'Max Stamina',
        carryWeight: 'Carry Capacity',
        crit: 'Critical Chance',
        hit: 'Hit Bonus',
        dodge: 'Dodge Bonus',
      },
      factionReputationLabel: 'Faction Standing',
      factions: {
        resistance: 'Resistance',
        corpsec: 'CorpSec',
        scavengers: 'Scavengers',
      },
    },
    factionPanel: {
      heading: 'Faction Reputation',
      ariaLabel: 'Faction reputation standings',
      standingLabel: 'Standing',
      reputationLabel: 'Reputation',
      effectsLabel: 'Active Effects',
      noEffects: 'No active benefits at this standing.',
      nextThreshold: (standing, value) => `${standing} at ${value}`,
      maxStanding: 'Maximum standing reached',
    },
    factionToast: {
      reputationChange: (faction, delta, reason) =>
        reason ? `${faction} reputation ${delta} — ${reason}` : `${faction} reputation ${delta}`,
      standingChange: (standing) => `Standing now ${standing}`,
      rivalChange: (faction, delta, standing) =>
        standing ? `${faction} ${delta} (${standing})` : `${faction} ${delta}`,
      reasons: {
        resistance_rescue_civilian: 'Civilian rescued',
        resistance_sabotage_corpsec: 'CorpSec assets sabotaged',
        resistance_complete_quest: 'Resistance op completed',
        resistance_betray_member: 'Resistance member betrayed',
        resistance_turn_in_contact: 'Resistance contact exposed',
        corpsec_report_crime: 'Incident reported to CorpSec',
        corpsec_eliminate_resistance: 'Resistance cell neutralised',
        corpsec_complete_contract: 'CorpSec contract fulfilled',
        corpsec_attack_patrol: 'CorpSec patrol attacked',
        corpsec_sabotage_checkpoint: 'Checkpoint sabotaged',
        scavengers_trade: 'Traded with Scavengers',
        scavengers_salvage_contract: 'Salvage contract completed',
        scavengers_share_loot: 'Shared loot intel',
        scavengers_steal_cache: 'Scavenger cache stolen',
        scavengers_kill_merchant: 'Scavenger merchant killed',
      },
    },
    miniMap: {
      heading: 'Tactical Map',
      playerLabel: 'Cell Lead',
      enemyLabel: 'Hostile',
      npcLabel: 'Neutral',
      objectiveLabel: 'Objective',
      objectivesHeading: 'Tracked Objectives',
      noObjectives: 'No objectives visible.',
    },
    dayNight: {
      timeOfDay: {
        morning: 'Morning',
        day: 'Day',
        evening: 'Evening',
        night: 'Night',
      },
      phaseLabel: 'PHASE',
      nextLabel: 'NEXT',
      nextIn: (time) => `in ${time}`,
      resetLabel: 'RESET',
      progressLabel: 'PROGRESS',
      curfewEnforced: 'CURFEW ENFORCED',
      safeToTravel: 'SAFE TO TRAVEL',
    },
    levelIndicator: {
      levelLabel: 'LEVEL',
      zoneLabel: 'ZONE',
      dangerLabel: 'DANGER',
      zoneSummaryLabel: 'SUMMARY',
      zoneObjectivesLabel: 'LOCAL DIRECTIVES',
      objectivesLabel: 'PRIMARY OBJECTIVES',
      emptyObjectives: 'No active tasks in this sector.',
      sideObjectivesLabel: 'SIDE OPERATIONS',
      noSideObjectives: 'No optional ops tracked.',
      missionReadyBadge: 'MISSION READY',
      primaryCompleteFootnote: 'All primary objectives secured.',
      unknownLevel: 'Unknown district',
      hazardsLabel: 'ENVIRONMENTAL HAZARDS',
      hazardsNone: 'No environmental hazards detected.',
      dangerLevels: {
        low: 'Low',
        moderate: 'Elevated',
        high: 'Hazardous',
        critical: 'Critical',
      },
    },
    dialogueOverlay: {
      closeButton: 'Close',
      questLocks: {
        alreadyCompleted: 'Quest already completed',
        alreadyActive: 'Quest already in progress',
        notActive: 'Quest not active',
        objectiveCompleted: 'Objective already complete',
      },
      requiresSkill: (requirement) => `Requires ${requirement}`,
      checkSkill: (requirement) => `Check ${requirement}`,
      escHint: 'Press Esc to disengage',
      itemRecoveredDescription: (questName) => `Recovered during ${questName}.`,
    },
    perks: {
      panelTitle: 'Perk Selection',
      remainingLabel: (count) =>
        count === 1
          ? '1 perk choice remaining'
          : `${count} perk choices remaining`,
      categoryLabels: {
        combat: 'Combat',
        utility: 'Utility',
        dialogue: 'Dialogue',
        capstone: 'Capstone',
      },
      selectLabel: 'Select Perk',
      lockedLabel: 'Locked',
      closeLabel: 'Close',
      requirementsLabel: 'Requirements',
      effectsLabel: 'Effects',
      alreadyOwnedLabel: 'Already owned',
      capstoneTag: 'Capstone',
      emptyLabel: 'No perks acquired yet.',
    },
    george: {
      dockLabel: 'GEORGE // AI ASSISTANT',
      dockStatusIdle: 'Tap the console or press G to check in.',
      consoleTitle: 'George // AI Assistant',
      subtitle: (alignment: string) => `Alignment: ${alignment.toUpperCase()} mode engaged.`,
      guidanceIntro: 'Priority queue coming online:',
      statusIntro: (statusLine: string) => `Status report: ${statusLine}`,
      questsIntro: 'Objectives in motion:',
      questNone: 'No active quests on deck—time to improvise.',
      questMore: 'Additional objectives are parked in the ops log.',
      interjectionIdle: 'Console linked. You speak, I listen.',
      logEmpty: 'Awaiting your command. No dialogue logged yet.',
      options: {
        guidance: 'What should I do?',
        status: 'How are we doing?',
        quests: 'Remind me of quests',
      },
      references: {
        guidance: 'guidance',
        status: 'status report',
        quests: 'quest log',
        ambient: 'ambient',
        prompt: 'command',
      },
      actors: {
        george: 'GEORGE',
        player: 'YOU',
      },
      ambientFeed: {
        tabs: {
          intel: 'Intel Feed',
          ambient: 'Ambient Feed',
        },
        empty: 'No ambient signals logged yet.',
        dockBadge: 'Ambient ping',
        categoryLabels: {
          rumor: 'Rumor',
          signage: 'Signage',
          weather: 'Weather',
          zoneDanger: 'Danger',
          hazardChange: 'Hazards',
        },
        fallbacks: {
          rumor: 'No rumors circulating.',
          signage: 'Signage stable.',
          weather: 'Weather steady.',
        },
        storyFunctionLabels: {
          foreshadow: 'Foreshadow',
          misdirect: 'Misdirect',
          payoff: 'Payoff',
          'world-building': 'World Beat',
        },
        flagLabels: {
          gangHeat: 'Gang Heat',
          curfewLevel: 'Curfew Tier',
          supplyScarcity: 'Supply Lines',
          blackoutTier: 'Grid Status',
        },
        formatFlagValue: (key, value) => {
          switch (key) {
            case 'gangHeat': {
              const mapping: Record<string, string> = {
                low: 'LOW',
                med: 'ELEVATED',
                high: 'LOCKDOWN',
              };
              return mapping[String(value)] ?? String(value).toUpperCase();
            }
            case 'supplyScarcity': {
              const mapping: Record<string, string> = {
                norm: 'NORMAL',
                tight: 'TIGHT',
                rationed: 'RATIONED',
              };
              return mapping[String(value)] ?? String(value).toUpperCase();
            }
            case 'blackoutTier': {
              const mapping: Record<string, string> = {
                none: 'NONE',
                brownout: 'BROWNOUT',
                rolling: 'ROLLING',
              };
              return mapping[String(value)] ?? String(value).toUpperCase();
            }
            case 'curfewLevel': {
              const tier = Number(value);
              if (!Number.isFinite(tier) || tier <= 0) {
                return 'OFF';
              }
              return `TIER ${tier}`;
            }
            default:
              return String(value).toUpperCase();
          }
        },
        dangerFallback: 'Danger steady.',
        formatRumor: ({ line, storyLabel }, alignment) => {
          const suffix = storyLabel ? ` (${storyLabel})` : '';
          switch (alignment) {
            case 'sarcastic':
              return `Gossip wire update: ${line}${suffix}. Try not to look surprised.`;
            case 'ruthless':
              return `Rumor ping logged: ${line}${suffix}. Treat it as actionable until proven soft.`;
            case 'stoic':
              return `Rumor archived: ${line}${suffix}. Monitoring for confirmation.`;
            default:
              return `Street whisper: ${line}${suffix}. Stay sharp out there.`;
          }
        },
        formatSignage: ({ text, storyLabel }, alignment) => {
          const suffix = storyLabel ? ` (${storyLabel})` : '';
          switch (alignment) {
            case 'sarcastic':
              return `Prop desk swapped the billboards again: ${text}${suffix}. Clap if the drones notice.`;
            case 'ruthless':
              return `Signage intercept: ${text}${suffix}. Bank it for propaganda leverage.`;
            case 'stoic':
              return `Signage update: ${text}${suffix}. Logging the change for records.`;
            default:
              return `Fresh signage drop: ${text}${suffix}. Shelterline will appreciate the morale boost.`;
          }
        },
        formatWeather: ({ description, storyLabel }, alignment) => {
          const suffix = storyLabel ? ` (${storyLabel})` : '';
          switch (alignment) {
            case 'sarcastic':
              return `Sky mood swing: ${description}${suffix}. Pack a poncho or an attitude.`;
            case 'ruthless':
              return `Weather shift logged: ${description}${suffix}. Adjust tactics accordingly.`;
            case 'stoic':
              return `Atmospheric update: ${description}${suffix}. Calibrating alerts.`;
            default:
              return `Weather drift: ${description}${suffix}. Keep the crew dry and breathing.`;
          }
        },
        formatZoneDanger: ({ zoneName, dangerLabel, previousDangerLabel, flagChanges }, alignment) => {
          const zone = zoneName ?? 'this sector';
          const dangerSummary =
            previousDangerLabel && previousDangerLabel !== dangerLabel
              ? `${dangerLabel.toUpperCase()} (was ${previousDangerLabel.toUpperCase()})`
              : dangerLabel.toUpperCase();
          const flagSummary = flagChanges.length
            ? flagChanges.map((change) => `${change.label}: ${change.next}`).join(' · ')
            : 'No flag shifts.';
          const base = `${zone}: danger now ${dangerSummary}. ${flagSummary}`;
          switch (alignment) {
            case 'sarcastic':
              return `Conditions report: ${base} Try not to make it worse.`;
            case 'ruthless':
              return `Operational alert: ${base} Leverage the churn.`;
            case 'stoic':
              return `Zone telemetry: ${base} Updating playbook.`;
            default:
              return `Heads-up: ${base} Keep civilians breathing.`;
          }
        },
        formatHazards: ({ zoneName, additions, removals }, alignment) => {
          const zone = zoneName ?? 'this sector';
          const additionText = additions.length ? `New hazard: ${additions.join(', ')}.` : '';
          const removalText = removals.length ? `Cleared: ${removals.join(', ')}.` : '';
          const summary = [additionText, removalText].filter(Boolean).join(' ') || 'No changes recorded.';
          switch (alignment) {
            case 'sarcastic':
              return `Hazard graffiti for ${zone}: ${summary} Welcome to the obstacle course.`;
            case 'ruthless':
              return `Hazard ledger (${zone}): ${summary} Exploit the chaos.`;
            case 'stoic':
              return `Hazard register (${zone}): ${summary} Logging adjustments.`;
            default:
              return `Hazard update for ${zone}: ${summary} Stay nimble.`;
          }
        },
      },
      ambient: [
        'Diagnostics show morale at "manageable"—keep it that way.',
        'Filed another complaint against the rain. Status: pending since 2034.',
        'If you spot Theo, remind him the coffee synth still needs a filter.',
        'Today’s lucky number is 404. Let’s try not to vanish.',
      ],
    },
    mission: {
      accomplishedTitle: 'Mission Accomplished',
      accomplishedSubtitle: (levelName: string) => `Primary objectives cleared for ${levelName}.`,
      primarySummaryLabel: 'Primary objectives completed:',
      continueCta: 'Next Level',
      deferCta: 'Stay in Level',
      deferHint: 'You can remain in this district to finish optional operations or resupply before deploying.',
      sideReminder: 'Optional operations remaining:',
    },
    skills: {
      strength: 'Strength',
      perception: 'Perception',
      endurance: 'Endurance',
      charisma: 'Charisma',
      intelligence: 'Intelligence',
      agility: 'Agility',
      luck: 'Luck',
    },
    skillDescriptions: {
      strength: 'Close-quarters power and carry capacity.',
      perception: 'Ranged accuracy, detection, and recon awareness.',
      endurance: 'Health reserves, toxin resistance, and stamina.',
      charisma: 'Dialogue sway, recruitment, and contact reliability.',
      intelligence: 'Skill checks, hacking aptitude, and XP bonuses.',
      agility: 'Initiative, evasion, and action point efficiency.',
      luck: 'Critical chances, loot fortune, and event outcomes.',
    },
    statFocus: {
      combat: 'Combat',
      perception: 'Recon',
      survival: 'Survival',
      social: 'Social',
      intellect: 'Tactical Intel',
      mobility: 'Mobility',
      fortuity: 'Fortune',
    },
  },
  uk: {
    menu: {
      tag: 'The Getaway',
      title: 'Втеча від режиму',
      tagline:
        'Проведіть свій осередок укріпленими Нетрищами. Ховатися чи бити? Кожен крок відлунює по місту.',
      start: 'Почати нову гру',
      resume: 'Продовжити гру',
      settingsHeading: 'Налаштування',
      languageLabel: 'Мова',
      alphaLabel: (year: number) => `Альфа-версія ${year}`,
      languageNames: {
        en: 'Англійська',
        uk: 'Українська',
      },
    },
    questLog: {
      panelLabel: 'Завдання',
      title: 'Журнал завдань',
      active: 'Активні завдання',
      completed: 'Завершені завдання',
      empty: 'Жодного завдання не відстежується. Звʼяжіться з контактами, щоб відкрити нові цілі.',
      rewardsHeading: 'Нагорода',
      currencyLabel: (amount) => {
        const label = amount === 1 ? 'кредит' : amount >= 2 && amount <= 4 ? 'кредити' : 'кредитів';
        return `₿${amount} ${label}`;
      },
      experienceLabel: (amount) => `${amount} ОД досвіду`,
      supplyFallback: 'поставка',
    },
    shell: {
      reconLabel: 'Розвідка',
      reconTitle: 'Тактичний канал',
      squadLabel: 'Загін',
      squadTitle: 'Зведення розвідки',
      telemetryLabel: 'Телеметрія',
      telemetryTitle: 'Журнал дій',
      menuButton: 'Меню',
      characterButton: 'Профіль',
      characterTitle: 'Профіль оперативника',
      characterSubtitle: 'Стати • Навички • Спорядження',
      collapseLeft: 'Приховати панель розвідки',
      expandLeft: 'Показати панель розвідки',
      collapseRight: 'Приховати панель операцій',
      expandRight: 'Показати панель операцій',
    },
    playerStatus: {
      vitalsLabel: 'Стан бійця',
      vitalsHint: 'Тримайте життєві показники в нормі — після комендантської медпаки видають дозовано.',
      readinessLabel: 'Бойова готовність',
      readinessHint: 'Стежте за ОД, спорядженням та моральним станом між сутичками.',
      levelLabel: 'Рівень',
      experienceLabel: 'Досвід',
      creditsLabel: 'Кредити',
      actionPointsLabel: 'Очки дії',
      staminaLabel: 'Витривалість',
      fatigueStatus: 'Виснажено',
      fatigueHint: 'Виснаження ускладнює кожну дію — відпочиньте або відновіть витривалість.',
      crouchIndicator: 'Присів',
      roundLabel: (round) => `Раунд ${round}`,
      yourMove: 'Ваш хід',
      enemyAdvance: 'Хід противника',
      hostilesLabel: (count) => `${count} ${count === 1 ? 'ціль' : count >= 2 && count <= 4 ? 'цілі' : 'цілей'}`,
      capabilitiesLabel: 'Навички та спорядження',
      skillsHint: 'Ключові характеристики впливають на діалоги й бойові перевірки.',
      inventoryLabel: 'Інвентар',
      inventoryItems: (count) => `Предмети: ${count}`,
      inventoryWeight: (current, max) => {
        const currentLoad = Math.round(current * 10) / 10;
        const maxLoad = Math.round(max * 10) / 10;
        return `Вага: ${currentLoad}/${maxLoad}`;
      },
      inventoryEmpty: 'Наплічник порожній — час поповнити запаси.',
      inventoryOverflow: (count) => `+${count} ще`,
      attributesLabel: 'Основні характеристики',
      attributesTitle: 'Профіль S.P.E.C.I.A.L.',
      attributePointsLabel: 'Доступні очки атрибутів',
      attributePointsHint: 'Витратьте їх, щоб підвищити базові характеристики SPECIAL перед наступною операцією.',
      increaseAttribute: (abbr) => `Підвищити ${abbr}`,
      attributeMaxed: 'Атрибут уже на максимальному рівні.',
      derivedLabel: 'Похідні показники',
      derivedTitle: 'Бойові параметри',
      derivedStats: {
        hp: 'Максимум здоровʼя',
        ap: 'Очки дії',
        stamina: 'Максимум витривалості',
        carryWeight: 'Вага перенесення',
        crit: 'Шанс критичного удару',
        hit: 'Бонус влучності',
        dodge: 'Бонус ухилення',
      },
      factionReputationLabel: 'Репутація у фракціях',
      factions: {
        resistance: 'Опір',
        corpsec: 'КорпСек',
        scavengers: 'Мародери',
      },
    },
    factionPanel: {
      heading: 'Репутація у фракціях',
      ariaLabel: 'Поточний статус репутації у фракціях',
      standingLabel: 'Статус',
      reputationLabel: 'Репутація',
      effectsLabel: 'Активні ефекти',
      noEffects: 'На цьому рівні немає активних бонусів.',
      nextThreshold: (standing, value) => `${standing} при значенні ${value}`,
      maxStanding: 'Досягнуто максимального статусу',
    },
    factionToast: {
      reputationChange: (faction, delta, reason) =>
        reason ? `Репутація ${faction}: ${delta} — ${reason}` : `Репутація ${faction}: ${delta}`,
      standingChange: (standing) => `Новий статус: ${standing}`,
      rivalChange: (faction, delta, standing) =>
        standing ? `${faction}: ${delta} (${standing})` : `${faction}: ${delta}`,
      reasons: {
        resistance_rescue_civilian: 'Врятовано цивільного',
        resistance_sabotage_corpsec: 'Диверсія проти CorpSec',
        resistance_complete_quest: 'Завдання Опору виконано',
        resistance_betray_member: 'Зраджено члена Опору',
        resistance_turn_in_contact: 'Контакт Опору видано CorpSec',
        corpsec_report_crime: 'Повідомлено про правопорушення CorpSec',
        corpsec_eliminate_resistance: 'Знищено осередок Опору',
        corpsec_complete_contract: 'Контракт CorpSec виконано',
        corpsec_attack_patrol: 'Напад на патруль CorpSec',
        corpsec_sabotage_checkpoint: 'Саботовано блокпост',
        scavengers_trade: 'Укладено угоду зі Скраперами',
        scavengers_salvage_contract: 'Виконано контракт на брухт',
        scavengers_share_loot: 'Поділенося місцем схованки',
        scavengers_steal_cache: 'Вкрадено тайник Скраперів',
        scavengers_kill_merchant: 'Вбито торговця Скраперів',
      },
    },
    miniMap: {
      heading: 'Тактична мапа',
      playerLabel: 'Оперативник',
      enemyLabel: 'Ворог',
      npcLabel: 'Нейтральний',
      objectiveLabel: 'Ціль',
      objectivesHeading: 'Відстежувані цілі',
      noObjectives: 'Цілей не виявлено.',
    },
    dayNight: {
      timeOfDay: {
        morning: 'Ранок',
        day: 'День',
        evening: 'Вечір',
        night: 'Ніч',
      },
      phaseLabel: 'ФАЗА',
      nextLabel: 'ДАЛІ',
      nextIn: (time) => `через ${time}`,
      resetLabel: 'СКИДАННЯ',
      progressLabel: 'ПРОГРЕС',
      curfewEnforced: 'КОМЕНДАНТСЬКА ДІЄ',
      safeToTravel: 'РУХ БЕЗПЕЧНИЙ',
    },
    levelIndicator: {
      levelLabel: 'РІВЕНЬ',
      zoneLabel: 'ЗОНА',
      dangerLabel: 'ЗАГРОЗА',
      zoneSummaryLabel: 'ЗВІТ',
      zoneObjectivesLabel: 'МІСЦЕВІ ЗАВДАННЯ',
      objectivesLabel: 'ОСНОВНІ ЦІЛІ',
      emptyObjectives: 'У цьому секторі немає активних завдань.',
      sideObjectivesLabel: 'ДОДАТКОВІ ОПЕРАЦІЇ',
      noSideObjectives: 'Побічні операції не відстежуються.',
      missionReadyBadge: 'МІСІЮ ВИКОНАНО',
      primaryCompleteFootnote: 'Усі основні цілі виконані.',
      unknownLevel: 'Невідомий район',
      hazardsLabel: 'НЕБЕЗПЕКИ СЕРЕДОВИЩА',
      hazardsNone: 'Небезпек не виявлено.',
      dangerLevels: {
        low: 'Низька',
        moderate: 'Підвищена',
        high: 'Висока',
        critical: 'Критична',
      },
    },
    dialogueOverlay: {
      closeButton: 'Закрити',
      questLocks: {
        alreadyCompleted: 'Завдання вже виконано',
        alreadyActive: 'Завдання вже виконується',
        notActive: 'Завдання не активоване',
        objectiveCompleted: 'Ціль уже виконана',
      },
      requiresSkill: (requirement) => `Потрібно: ${requirement}`,
      checkSkill: (requirement) => `Перевірка: ${requirement}`,
      escHint: 'Натисніть Esc, щоб завершити',
      itemRecoveredDescription: (questName) => `Здобуто під час «${questName}».`,
    },
    perks: {
      panelTitle: 'Вибір таланту',
      remainingLabel: (count) => {
        if (count === 1) {
          return 'Залишився 1 вибір таланту';
        }
        const plural = count >= 2 && count <= 4 ? 'вибори' : 'виборів';
        return `Залишилось ${count} ${plural} таланту`;
      },
      categoryLabels: {
        combat: 'Бойові',
        utility: 'Прикладні',
        dialogue: 'Діалогові',
        capstone: 'Капстони',
      },
      selectLabel: 'Обрати талант',
      lockedLabel: 'Заблоковано',
      closeLabel: 'Закрити',
      requirementsLabel: 'Вимоги',
      effectsLabel: 'Ефекти',
      alreadyOwnedLabel: 'Уже отримано',
      capstoneTag: 'Капстон',
      emptyLabel: 'Таланти ще не відкриті.',
    },
    george: {
      dockLabel: 'ДЖОРДЖ // AI-АСИСТЕНТ',
      dockStatusIdle: 'Торкнись консолі або натисни G, щоб підключитися.',
      consoleTitle: 'Джордж // AI-асистент',
      subtitle: (alignment: string) => `Режим: ${alignment.toUpperCase()} активовано.`,
      guidanceIntro: 'Пріоритетні завдання:',
      statusIntro: (statusLine: string) => `Звіт стану: ${statusLine}`,
      questsIntro: 'Активні цілі:',
      questNone: 'Наразі немає активних завдань — час дослідити район.',
      questMore: 'Додаткові цілі чекають у журналі операцій.',
      interjectionIdle: 'Канал відкрито. Говори — слухаю.',
      logEmpty: 'Чекаю на твою команду. Діалогів ще не було.',
      options: {
        guidance: 'Що мені робити?',
        status: 'Як у нас справи?',
        quests: 'Нагадай про завдання',
      },
      references: {
        guidance: 'керівництво',
        status: 'звіт',
        quests: 'журнал',
        ambient: 'коментар',
        prompt: 'запит',
      },
      actors: {
        george: 'ДЖОРДЖ',
        player: 'ТИ',
      },
      ambientFeed: {
        tabs: {
          intel: 'Інтел-стрічка',
          ambient: 'Середовище',
        },
        empty: 'Сигнали середовища ще не зафіксовані.',
        dockBadge: 'Сигнал середовища',
        categoryLabels: {
          rumor: 'Поголос',
          signage: 'Вивіски',
          weather: 'Погода',
          zoneDanger: 'Небезпека',
          hazardChange: 'Небезпеки',
        },
        fallbacks: {
          rumor: 'Слухів не помічено.',
          signage: 'Вивіски без змін.',
          weather: 'Погода стабільна.',
        },
        storyFunctionLabels: {
          foreshadow: 'Передвістя',
          misdirect: 'Відволікання',
          payoff: 'Розв’язка',
          'world-building': 'Світ',
        },
        flagLabels: {
          gangHeat: 'Активність банд',
          curfewLevel: 'Рівень комендантської',
          supplyScarcity: 'Ланцюги постачання',
          blackoutTier: 'Статус мережі',
        },
        formatFlagValue: (key, value) => {
          switch (key) {
            case 'gangHeat': {
              const mapping: Record<string, string> = {
                low: 'НИЗЬКА',
                med: 'ПІДВИЩЕНА',
                high: 'БЛОКАДА',
              };
              return mapping[String(value)] ?? String(value).toUpperCase();
            }
            case 'supplyScarcity': {
              const mapping: Record<string, string> = {
                norm: 'НОРМА',
                tight: 'ОБМЕЖЕНА',
                rationed: 'РАЦІОН',
              };
              return mapping[String(value)] ?? String(value).toUpperCase();
            }
            case 'blackoutTier': {
              const mapping: Record<string, string> = {
                none: 'НЕМАЄ',
                brownout: 'ПРИГЛУШЕНЕ',
                rolling: 'ХВИЛЬОВЕ',
              };
              return mapping[String(value)] ?? String(value).toUpperCase();
            }
            case 'curfewLevel': {
              const tier = Number(value);
              if (!Number.isFinite(tier) || tier <= 0) {
                return 'ВИМКНЕНО';
              }
              return `РІВЕНЬ ${tier}`;
            }
            default:
              return String(value).toUpperCase();
          }
        },
        dangerFallback: 'Небезпека без змін.',
        formatRumor: ({ line, storyLabel }, alignment) => {
          const suffix = storyLabel ? ` (${storyLabel})` : '';
          switch (alignment) {
            case 'sarcastic':
              return `Піратські хвилі шепочуть: ${line}${suffix}. Не роби вигляд, що здивований.`;
            case 'ruthless':
              return `Оперативний слух: ${line}${suffix}. Використаємо, якщо підтвердиться.`;
            case 'stoic':
              return `Поголос зафіксовано: ${line}${suffix}. Слідкую за підтвердженням.`;
            default:
              return `Новий поголос: ${line}${suffix}. Бережи наших.`;
          }
        },
        formatSignage: ({ text, storyLabel }, alignment) => {
          const suffix = storyLabel ? ` (${storyLabel})` : '';
          switch (alignment) {
            case 'sarcastic':
              return `Пропагандисти перемалювали вивіски: ${text}${suffix}. Хай дрони захлинаються плакатами.`;
            case 'ruthless':
              return `Вивіски оновлено: ${text}${suffix}. Обернемо на свою користь.`;
            case 'stoic':
              return `Оновлення вивісок: ${text}${suffix}. Фіксую в журналі.`;
            default:
              return `Нова вивіска на районах: ${text}${suffix}. Люди матимуть привід усміхнутися.`;
          }
        },
        formatWeather: ({ description, storyLabel }, alignment) => {
          const suffix = storyLabel ? ` (${storyLabel})` : '';
          switch (alignment) {
            case 'sarcastic':
              return `Небо знову в настрої: ${description}${suffix}. Парасоля чи сарказм — обирай.`;
            case 'ruthless':
              return `Погодна поправка: ${description}${suffix}. Перебудовую маршрути.`;
            case 'stoic':
              return `Атмосферний звіт: ${description}${suffix}. Синхронізую сирени.`;
            default:
              return `Погодний дрейф: ${description}${suffix}. Тримай команду в теплі.`;
          }
        },
        formatZoneDanger: ({ zoneName, dangerLabel, previousDangerLabel, flagChanges }, alignment) => {
          const zone = zoneName ?? 'цей сектор';
          const dangerSummary =
            previousDangerLabel && previousDangerLabel !== dangerLabel
              ? `${dangerLabel.toUpperCase()} (було ${previousDangerLabel.toUpperCase()})`
              : dangerLabel.toUpperCase();
          const flagSummary = flagChanges.length
            ? flagChanges.map((change) => `${change.label}: ${change.next}`).join(' · ')
            : 'Без змін прапорців.';
          const base = `${zone}: небезпека тепер ${dangerSummary}. ${flagSummary}`;
          switch (alignment) {
            case 'sarcastic':
              return `Зведення умов: ${base} Спробуй не погіршити статистику.`;
            case 'ruthless':
              return `Тривога по району: ${base} Використаємо турбулентність.`;
            case 'stoic':
              return `Телеметрія сектора: ${base} Перераховую маршрути.`;
            default:
              return `Попередження: ${base} Пильнуй цивільних.`;
          }
        },
        formatHazards: ({ zoneName, additions, removals }, alignment) => {
          const zone = zoneName ?? 'цей сектор';
          const additionText = additions.length ? `Новий ризик: ${additions.join(', ')}.` : '';
          const removalText = removals.length ? `Усунуто: ${removals.join(', ')}.` : '';
          const summary = [additionText, removalText].filter(Boolean).join(' ') || 'Змін не виявлено.';
          switch (alignment) {
            case 'sarcastic':
              return `Дошка небезпек для ${zone}: ${summary} Прохідний двір зі спецефектами.`;
            case 'ruthless':
              return `Реєстр небезпек (${zone}): ${summary} Плануємо удари відповідно.`;
            case 'stoic':
              return `Журнал небезпек (${zone}): ${summary} Запис зроблено.`;
            default:
              return `Оновлення небезпек у ${zone}: ${summary} Тримайся гнучко.`;
          }
        },
      },
      ambient: [
        'Сенсори показують, що мораль «прийнятна» — тримайся цього рівня.',
        'Знову подав скаргу на дощ. Статус: у черзі з 2034 року.',
        'Якщо побачиш Тео, нагадай про фільтр у кавовому синті.',
        'Сьогодні щасливе число 404. Постараймося не зникнути.',
      ],
    },
    mission: {
      accomplishedTitle: 'Місію виконано',
      accomplishedSubtitle: (levelName: string) => `Основні цілі для «${levelName}» виконані.`,
      primarySummaryLabel: 'Основні цілі виконано:',
      continueCta: 'Наступний рівень',
      deferCta: 'Залишитися у секторі',
      deferHint: 'Можна залишитися, щоб завершити побічні операції або поповнити ресурси.',
      sideReminder: 'Незавершені побічні операції:',
    },
    skills: {
      strength: 'Сила',
      perception: 'Сприйняття',
      endurance: 'Стійкість',
      charisma: 'Харизма',
      intelligence: 'Інтелект',
      agility: 'Спритність',
      luck: 'Вдача',
    },
    skillDescriptions: {
      strength: 'Сила ближнього бою та вантажопідйомність.',
      perception: 'Точність на відстані, виявлення та розвідка.',
      endurance: 'Запаси здоровʼя, опір токсинам і витривалість.',
      charisma: 'Переконання в діалогах, набір союзників і довіра контактів.',
      intelligence: 'Перевірки навичок, злам систем і бонуси досвіду.',
      agility: 'Ініціатива, ухилення та ефективність очок дії.',
      luck: 'Шанс критичних ударів, трофеї та перебіг подій.',
    },
    statFocus: {
      combat: 'Бій',
      perception: 'Розвідка',
      survival: 'Виживання',
      social: 'Соціум',
      intellect: 'Тактичний інтелект',
      mobility: 'Мобільність',
      fortuity: 'Удача',
    },
  },
};

export const getUIStrings = (locale: Locale): UIStrings => STRINGS[locale] ?? STRINGS.en;
