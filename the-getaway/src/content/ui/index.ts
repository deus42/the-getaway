import { Locale } from '../locales';
import { TimeOfDay } from '../../game/world/dayNightCycle';
import type { TravelAdvisoryLevel } from '../../game/world/environment/environmentMatrix';
import type { AutoBattleProfileId } from '../../game/combat/automation/autoBattleProfiles';

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
type AmbientCategoryKey = 'rumor' | 'signage' | 'weather' | 'zoneDanger' | 'hazardChange' | 'zoneBrief';
type StoryFunctionKey = 'foreshadow' | 'misdirect' | 'payoff' | 'world-building';
type EnvironmentFlagKey = 'gangHeat' | 'curfewLevel' | 'supplyScarcity' | 'blackoutTier';

interface MenuStrings {
  tag: string;
  title: string;
  tagline: string;
  start: string;
  resume: string;
  settingsHeading: string;
  settingsCTA: string;
  settingsBack: string;
  languageLabel: string;
  surveillanceLabel: string;
  surveillanceToggleLabel: string;
  surveillanceToggleDescription: string;
  lightingLabel: string;
  lightingToggleLabel: string;
  lightingToggleDescription: string;
  alphaLabel: (year: number) => string;
  languageNames: Record<Locale, string>;
}

type AutoBattleProfileCopy = Record<AutoBattleProfileId, { name: string; summary: string }>;

export interface AutoBattleStrings {
  heading: string;
  toggleLabel: string;
  toggleDescription: string;
  profileLabel: string;
  profileDescription: string;
  manualOption: { name: string; summary: string };
  profiles: AutoBattleProfileCopy;
  hudTitle: string;
  hudStatusIdle: string;
  hudStatusEngaged: string;
  hudStatusPaused: string;
  hudToggleOnLabel: string;
  hudToggleOffLabel: string;
  hudPauseReasons: {
    manualInput: string;
    dialogue: string;
    objective: string;
    resources: string;
    ap: string;
    none: string;
  };
  hudToggleHint: string;
  hudProfileCycleHint: string;
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
  completedToggleOpen: string;
  completedToggleClose: string;
  eventsToggleOpen: string;
  eventsToggleClose: string;
  collapseLeft: string;
  expandLeft: string;
  collapseRight: string;
  expandRight: string;
  completedOverlayTitle: string;
  eventsOverlayTitle: string;
  activeListTitle: string;
  completedListTitle: string;
  noAssignments: string;
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
  paranoiaLabel: string;
  paranoiaTierLabels: Record<string, string>;
  healthLabel: string;
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
  loadLabel: string;
  itemsLabel: string;
  perksLabel: string;
  backgroundLabel: string;
  backgroundFallback: string;
  loadUnit: string;
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
  travelAdvisory: {
    label: string;
    levels: Record<TravelAdvisoryLevel, string>;
    stats: (params: { stamina: number; encounters: number }) => string;
  };
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

type InventoryFilterId = 'all' | 'weapons' | 'armor' | 'consumables' | 'quest' | 'misc';
type EquipmentSlotKey =
  | 'primaryWeapon'
  | 'secondaryWeapon'
  | 'meleeWeapon'
  | 'bodyArmor'
  | 'helmet'
  | 'accessory1'
  | 'accessory2';
type EncumbranceDescriptorKey = 'normal' | 'heavy' | 'overloaded' | 'immobile' | 'unknown';
type SkillBranchKey = 'combat' | 'tech' | 'survival' | 'social';

interface TurnTrackerStrings {
  heading: string;
  playerTurn: string;
  enemyTurn: string;
  exploration: string;
  hostileReadout: string;
  timeLabel: string;
}

interface CharacterScreenStrings {
  profileToggle: string;
  systemsToggle: string;
  closeLabel: string;
  tablistAria: string;
  tabs: Record<'inventory' | 'loadout' | 'skills' | 'reputation', string>;
  hiddenState: string;
}

interface InventoryPanelStrings {
  title: string;
  summary: (inventoryWeight: string, loadoutWeight: string) => string;
  filters: Record<InventoryFilterId, string>;
  filtersAriaLabel: string;
  itemsAriaLabel: string;
  equippedAriaLabel: string;
  hotbarAriaLabel: string;
  showingCount: (visible: number, total: number) => string;
  emptyState: string;
  weightTitle: string;
  badges: {
    quest: string;
    weapon: string;
    armor: string;
    consumable: string;
  };
  encumbranceLabel: string;
  encumbranceDescriptors: Record<EncumbranceDescriptorKey, string>;
  encumbranceSummary: {
    normal: string;
    heavy: (movement: number, attack: number) => string;
    overloaded: (movement: number, attack: number) => string;
    immobile: string;
    unknown: string;
  };
  encumbranceWarning: Record<EncumbranceDescriptorKey, string | null>;
  weightValue: (weight: string, value: number) => string;
  durabilityLabel: (current: number, max: number) => string;
  conditionLabel: (percentage: number) => string;
  itemWeightAria: (weight: string, value: number) => string;
  actions: {
    equip: string;
    unequip: string;
    use: string;
    repair: (cost: number) => string;
    repairAria: (itemName: string, cost: number) => string;
    addToHotbar: string;
    removeFromHotbar: string;
    hotbarFull: string;
    clearHotbar: string;
  };
  equipment: {
    title: string;
    slotEmpty: string;
    slots: Record<EquipmentSlotKey, { label: string; description: string; empty: string }>;
    conditionHeading: string;
    noCompatible: string;
  };
  hotbar: {
    title: string;
    slotLabel: (index: number) => string;
    unassigned: string;
  };
  hotbarBadge: (index: number) => string;
}

interface LoadoutPanelStrings {
  ariaLabel: string;
  headingLabel: string;
  headingTitle: string;
  perksLabel: string;
  noPerks: string;
  stats: {
    damage: string;
    range: string;
    apCost: string;
    skill: string;
    protection: string;
    weight: string;
    value: string;
    durability: string;
  };
  condition: {
    pristine: (percentage: number) => string;
    broken: string;
    critical: (percentage: number) => string;
    worn: (percentage: number) => string;
    used: (percentage: number) => string;
  };
  actions: {
    unequip: string;
    equip: (itemName: string) => string;
  };
  noCompatible: string;
}

interface SkillTreePanelStrings {
  title: string;
  baseHint: string;
  pointsLabel: (count: number) => string;
  tablistAria: string;
  branches: Record<SkillBranchKey, string>;
  tagBadge: string;
  incrementLabel: (increment: number, tagged: boolean) => string;
  decreaseAria: (skillName: string) => string;
  increaseAria: (skillName: string) => string;
  announcement: (skillName: string, verb: 'increase' | 'decrease', value: number, effect: string) => string;
}

interface PlayerStatsPanelStrings {
  ariaLabel: string;
  equipmentWarning: string;
  rankLabel: (value: number) => string;
  baseLabel: (value: number) => string;
  focusLabel: (focusName: string) => string;
}

interface GeorgeStrings {
  dockLabel: string;
  dockStatusIdle: string;
  consoleTitle: string;
  openChat: string;
  closeChat: string;
  subtitle: (alignment: string) => string;
  guidanceIntro: string;
  statusIntro: (statusLine: string) => string;
  questsIntro: string;
  questNone: string;
  questMore: string;
  interjectionIdle: string;
  logEmpty: string;
  feedLabels: {
    mission: string;
    status: string;
    guidance: string;
    interjection: string;
    zone: string;
    ambient: string;
  };
  levelAdvance: (descriptor: string) => string;
  guidancePrimaryComplete: (levelName: string) => string;
  guidancePrimaryObjective: (label: string, progress?: string) => string;
  guidanceSideObjective: (label: string) => string;
  guidanceProgress: (completed: number, total: number) => string;
  missionComplete: (name: string) => string;
  zoneFallback: string;
  ambientFeed: {
    empty: string;
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
    formatZoneBrief: (payload: {
      zoneName?: string | null;
      summary?: string | null;
      dangerLabel: string;
      hazards: string[];
      directives: string[];
    }, alignment: PersonalityAlignment) => string;
  };
  ambient: string[];
  reassure: {
    button: string;
    hint: string;
    cooldown: (seconds: number) => string;
  };
}

interface UIStrings {
  menu: MenuStrings;
  autoBattle: AutoBattleStrings;
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
  turnTracker: TurnTrackerStrings;
  character: CharacterScreenStrings;
  inventoryPanel: InventoryPanelStrings;
  loadoutPanel: LoadoutPanelStrings;
  skillTreePanel: SkillTreePanelStrings;
  playerStatsPanel: PlayerStatsPanelStrings;
  george: GeorgeStrings;
  mission: MissionStrings;
}

const STRINGS: Record<Locale, UIStrings> = {
  en: {
    menu: {
      tag: 'The Getaway',
      title: 'Escape the Regime',
      tagline: '',
      start: 'Start New Game',
      resume: 'Resume Game',
      settingsHeading: 'Settings',
      settingsCTA: 'Settings',
      settingsBack: 'Return to Menu',
      languageLabel: 'Language',
      surveillanceLabel: 'Surveillance Overlay',
      surveillanceToggleLabel: 'Show detection cones',
      surveillanceToggleDescription: 'Toggles the camera detection cones (same as pressing TAB).',
      lightingLabel: 'Visual Lighting',
      lightingToggleLabel: 'Enable noir lighting',
      lightingToggleDescription: 'Turns on dynamic Light2D rendering for atlas props. Requires WebGL.',
      alphaLabel: () => 'Alpha',
      languageNames: {
        en: 'English',
        uk: 'Українська',
      },
    },
    autoBattle: {
      heading: 'AutoBattle',
      toggleLabel: 'Enable AutoBattle',
      toggleDescription:
        'Delegate turn-by-turn control to squad AI. Manual input instantly cancels automation.',
      profileLabel: 'Behaviour Profile',
      profileDescription: 'Profiles tune how the AI spends AP and manages risk.',
      manualOption: {
        name: 'Manual',
        summary: 'Take every turn yourself; automation stays disabled.',
      },
      profiles: {
        balanced: {
          name: 'Balanced',
          summary: 'Mix of ranged pressure and cover discipline.',
        },
        aggressive: {
          name: 'Aggressive',
          summary: 'Closes distance fast and spends resources to finish fights.',
        },
        defensive: {
          name: 'Defensive',
          summary: 'Turtles in cover, conserves supplies, retreats early.',
        },
      },
      hudTitle: 'AutoBattle Control',
      hudStatusIdle: 'Standby',
      hudStatusEngaged: 'Executing',
      hudStatusPaused: 'Paused',
      hudToggleOnLabel: 'Auto On',
      hudToggleOffLabel: 'Auto Off',
      hudPauseReasons: {
        manualInput: 'Manual input detected',
        dialogue: 'Dialogue or prompt active',
        objective: 'Objective interrupt',
        resources: 'Insufficient resources',
        ap: 'No AP remaining',
        none: 'Ready',
      },
      hudToggleHint: 'Shift+A to toggle automation.',
      hudProfileCycleHint: 'Use the selector to swap profiles mid-fight.',
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
      completedToggleOpen: 'Show All Quests',
      completedToggleClose: 'Hide All Quests',
      eventsToggleOpen: 'Show All Events',
      eventsToggleClose: 'Hide All Events',
      collapseLeft: 'Hide Recon Panel',
      expandLeft: 'Show Recon Panel',
      collapseRight: 'Hide Ops Panel',
      expandRight: 'Show Ops Panel',
      completedOverlayTitle: 'All Quests',
      eventsOverlayTitle: 'Event Feed',
      activeListTitle: 'Active Objectives',
      completedListTitle: 'Completed Archive',
      noAssignments: 'No active objectives.',
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
      paranoiaLabel: 'Paranoia',
      paranoiaTierLabels: {
        calm: 'Calm',
        uneasy: 'Uneasy',
        on_edge: 'On Edge',
        panicked: 'Panicked',
        breakdown: 'Breakdown',
      },
      healthLabel: 'Health',
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
      loadLabel: 'Load',
      itemsLabel: 'Items',
      perksLabel: 'Perks',
      backgroundLabel: 'Background',
      backgroundFallback: 'Unaffiliated',
      loadUnit: 'kg',
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
      travelAdvisory: {
        label: 'TRAVEL ADVISORY',
        levels: {
          clear: 'Clear corridors',
          caution: 'Heightened patrols',
          severe: 'Hazardous transit',
        },
        stats: ({ stamina, encounters }) => {
          const segments: string[] = [];
          if (stamina > 0) {
            segments.push(`Stamina +${stamina}/min`);
          }
          if (Math.abs(encounters - 1) > 0.01) {
            segments.push(`Encounters ×${encounters.toFixed(2)}`);
          }
          if (segments.length === 0) {
            return 'Conditions stable';
          }
          return segments.join(' · ');
        },
      },
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
      escHint: 'Press 1-9 to respond, Esc to disengage',
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
      dockStatusIdle: 'Standing by for new intel.',
      consoleTitle: 'George // AI Assistant',
      openChat: 'Open Chat',
      closeChat: 'Close Chat',
      subtitle: (alignment: string) => `Alignment: ${alignment.toUpperCase()} mode engaged.`,
      guidanceIntro: 'Priority queue coming online:',
      statusIntro: (statusLine: string) => `Status report: ${statusLine}`,
      questsIntro: 'Objectives in motion:',
      questNone: 'No active quests on deck—time to improvise.',
      questMore: 'Additional objectives are parked in the ops log.',
      interjectionIdle: 'Console linked. You speak, I listen.',
      logEmpty: 'No notifications yet. I’ll ping when the city twitches.',
      levelAdvance: (descriptor) => `Prepping overlays for ${descriptor}. Say the word and I’ll broadcast updates.`,
      guidancePrimaryComplete: (levelName) => `• Primary: Mission accomplished in ${levelName}.`,
      guidancePrimaryObjective: (label, progress = '') => `• Primary: ${label}${progress}`,
      guidanceSideObjective: (label) => `• Optional: ${label}`,
      guidanceProgress: (completed, total) => ` (${completed}/${total})`,
      missionComplete: (name) => `Mission secured in ${name}. Awaiting redeploy.`,
      zoneFallback: 'current zone',
      feedLabels: {
        mission: 'Mission Intel',
        status: 'Status',
        guidance: 'Guidance',
        interjection: 'Broadcast',
        zone: 'Zone Brief',
        ambient: 'Ambient',
      },
      ambientFeed: {
        empty: 'No ambient signals logged yet.',
        categoryLabels: {
          rumor: 'Rumor',
          signage: 'Signage',
          weather: 'Weather',
          zoneDanger: 'Danger',
          hazardChange: 'Hazards',
          zoneBrief: 'Zone Brief',
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
        formatZoneBrief: ({ zoneName, summary, dangerLabel, hazards, directives }, alignment) => {
          const zone = zoneName ?? 'this sector';
          const infoLines = [
            `Danger: ${dangerLabel.toUpperCase()}`,
            summary ? `Summary: ${summary}` : 'Summary: No intel logged.',
            hazards.length ? `Hazards: ${hazards.join(', ')}` : 'Hazards: none logged.',
            directives.length ? `Local directives: ${directives.join('; ')}` : 'Local directives: none posted.',
          ].join('\n');
          switch (alignment) {
            case 'sarcastic':
              return `Zone brief: ${zone}.\n${infoLines}\nStay sarcastic, stay alive.`;
            case 'ruthless':
              return `Zone briefing (${zone}).\n${infoLines}\nLeverage every edge.`;
            case 'stoic':
              return `Zone telemetry synced for ${zone}.\n${infoLines}\nAdjusting projections.`;
            default:
              return `Zone brief for ${zone}.\n${infoLines}\nKeep the crew steady.`;
          }
        },
      },
      ambient: [
        'Diagnostics show morale at "manageable"—keep it that way.',
        'Filed another complaint against the rain. Status: pending since 2034.',
        'If you spot Theo, remind him the coffee synth still needs a filter.',
        'Today’s lucky number is 404. Let’s try not to vanish.',
      ],
      reassure: {
        button: 'Reassure',
        hint: 'Clamps paranoia spikes for a short window. Breathe with me.',
        cooldown: (seconds: number) => `Recharging (${seconds}s)`,
      },
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
    turnTracker: {
      heading: 'Turn Status',
      playerTurn: 'Player Turn',
      enemyTurn: 'Enemy Turn',
      exploration: 'Exploration',
      hostileReadout: 'Hostile Readout',
      timeLabel: 'Local Time',
    },
    character: {
      profileToggle: 'Profile',
      systemsToggle: 'Systems',
      closeLabel: 'Close',
      tablistAria: 'Character systems',
      tabs: {
        inventory: 'Inventory',
        loadout: 'Loadout',
        skills: 'Skill Tree',
        reputation: 'Reputation',
      },
      hiddenState: 'Toggle a panel to view character data.',
    },
    inventoryPanel: {
      title: 'Inventory',
      summary: (inventoryWeight, loadoutWeight) => `Inventory ${inventoryWeight} · Loadout ${loadoutWeight}`,
      filters: {
        all: 'All',
        weapons: 'Weapons',
        armor: 'Armor',
        consumables: 'Consumables',
        quest: 'Quest',
        misc: 'Misc',
      },
      filtersAriaLabel: 'Inventory filters',
      itemsAriaLabel: 'Inventory items',
      equippedAriaLabel: 'Equipped items',
      hotbarAriaLabel: 'Hotbar assignments',
      showingCount: (visible, total) => `Showing ${visible} of ${total} items`,
      emptyState: 'Pack is empty — time to scavenge.',
      weightTitle: 'Total Weight',
      badges: {
        quest: 'Quest',
        weapon: 'Weapon',
        armor: 'Armor',
        consumable: 'Use',
      },
      encumbranceLabel: 'Encumbrance',
      encumbranceDescriptors: {
        normal: 'Stable',
        heavy: 'Heavy',
        overloaded: 'Overloaded',
        immobile: 'Immobile',
        unknown: 'Unknown',
      },
      encumbranceSummary: {
        normal: 'Encumbrance nominal',
        heavy: (movement, attack) =>
          `Heavy load: movement x${movement.toFixed(2)}, attacks x${attack.toFixed(2)}`,
        overloaded: (movement, attack) =>
          `Overloaded: movement x${movement.toFixed(2)}, attacks x${attack.toFixed(2)}`,
        immobile: 'Immobile: cannot move or act',
        unknown: 'Encumbrance unknown',
      },
      encumbranceWarning: {
        normal: null,
        heavy: 'Pack weight is slowing you. You will bleed AP if you keep hauling this much.',
        overloaded: 'Overloaded. Movement now chews double AP until you off-load gear.',
        immobile: 'You are pinned by your gear. Drop items before you can move or fight.',
        unknown: null,
      },
      weightValue: (weight, value) => `${weight} • ₿${value}`,
      durabilityLabel: (current, max) => `Durability ${current}/${max}`,
      conditionLabel: (percentage) => `Condition ${percentage}%`,
      itemWeightAria: (weight, value) => `Weight ${weight}, value ₿${value}`,
      actions: {
        equip: 'Equip',
        unequip: 'Unequip',
        use: 'Use',
        repair: (cost) => `Repair (${cost} parts)`,
        repairAria: (itemName, cost) => `Repair ${itemName}, estimated cost ${cost} parts`,
        addToHotbar: 'Add to Hotbar',
        removeFromHotbar: 'Remove from Hotbar',
        hotbarFull: 'Hotbar Full',
        clearHotbar: 'Clear',
      },
      equipment: {
        title: 'Equipped Loadout',
        slotEmpty: 'Empty',
        slots: {
          primaryWeapon: {
            label: 'Primary Weapon',
            description: 'Main-hand firearms and rifles.',
            empty: 'No weapon equipped',
          },
          secondaryWeapon: {
            label: 'Secondary Weapon',
            description: 'Sidearms and backup firearms.',
            empty: 'No sidearm equipped',
          },
          meleeWeapon: {
            label: 'Melee Weapon',
            description: 'Close-quarters blades and batons.',
            empty: 'No melee weapon equipped',
          },
          bodyArmor: {
            label: 'Body Armor',
            description: 'Chest protection layers.',
            empty: 'No armor equipped',
          },
          helmet: {
            label: 'Headgear',
            description: 'Visors, helmets, and masks.',
            empty: 'No headgear equipped',
          },
          accessory1: {
            label: 'Accessory I',
            description: 'Implants, belts, or wrist mods.',
            empty: 'No accessory slotted',
          },
          accessory2: {
            label: 'Accessory II',
            description: 'Secondary accessory slot.',
            empty: 'No accessory slotted',
          },
        },
        conditionHeading: 'Condition',
        noCompatible: 'No compatible items in pack',
      },
      hotbar: {
        title: 'Hotbar',
        slotLabel: (index) => `Slot ${index}`,
        unassigned: 'Unassigned',
      },
      hotbarBadge: (index) => `Hotbar ${index}`,
    },
    loadoutPanel: {
      ariaLabel: 'Player Loadout',
      headingLabel: 'Operative',
      headingTitle: 'Loadout',
      perksLabel: 'Perks',
      noPerks: 'No perks acquired',
      stats: {
        damage: 'Damage',
        range: 'Range',
        apCost: 'AP Cost',
        skill: 'Skill',
        protection: 'Protection',
        weight: 'Weight',
        value: 'Value',
        durability: 'Durability',
      },
      condition: {
        pristine: (percentage) => `Condition ${percentage}%`,
        broken: 'Condition 0% – Broken',
        critical: (percentage) => `Condition ${percentage}% – Critical`,
        worn: (percentage) => `Condition ${percentage}% – Worn`,
        used: (percentage) => `Condition ${percentage}%`,
      },
      actions: {
        unequip: 'Unequip',
        equip: (itemName) => `Equip ${itemName}`,
      },
      noCompatible: 'No compatible items in pack',
    },
    skillTreePanel: {
      title: 'Skill Trees',
      baseHint: '+5 base • +10 tagged',
      pointsLabel: (count) => `${count} Skill Point${count === 1 ? '' : 's'}`,
      tablistAria: 'Skill branches',
      branches: {
        combat: 'Combat',
        tech: 'Tech',
        survival: 'Survival',
        social: 'Social',
      },
      tagBadge: 'Tag',
      incrementLabel: (increment, tagged) =>
        tagged ? `1 pt → +${increment} (tag)` : `1 pt → +${increment}`,
      decreaseAria: (skillName) => `Decrease ${skillName}`,
      increaseAria: (skillName) => `Increase ${skillName}`,
      announcement: (skillName, verb, value, effect) => {
        const verbText = verb === 'increase' ? 'increased' : 'decreased';
        return `${skillName} ${verbText} to ${value}. ${effect}`;
      },
    },
    playerStatsPanel: {
      ariaLabel: 'Player statistics',
      equipmentWarning: 'Equipment stats unavailable. Showing base attributes only.',
      rankLabel: (value) => `Rank ${value}`,
      baseLabel: (value) => `Base ${value}`,
      focusLabel: (focusName) => `${focusName} Focus`,
    },
  },
  uk: {
    menu: {
      tag: 'The Getaway',
      title: 'Втеча від режиму',
      tagline: '',
      start: 'Почати нову гру',
      resume: 'Продовжити гру',
      settingsHeading: 'Налаштування',
      settingsCTA: 'Налаштування',
      settingsBack: 'Повернутися до меню',
      languageLabel: 'Мова',
      surveillanceLabel: 'Накладка спостереження',
      surveillanceToggleLabel: 'Показувати конуси виявлення',
      surveillanceToggleDescription: 'Перемикає конуси виявлення камер (аналогічно клавіші TAB).',
      lightingLabel: 'Візуальне освітлення',
      lightingToggleLabel: 'Увімкнути неонове освітлення',
      lightingToggleDescription: 'Активує динамічне Light2D-освітлення для атласних спрайтів (потрібен WebGL).',
      alphaLabel: () => 'Альфа',
      languageNames: {
        en: 'Англійська',
        uk: 'Українська',
      },
    },
    autoBattle: {
      heading: 'Автобій',
      toggleLabel: 'Увімкнути автобій',
      toggleDescription:
        'Передайте покрокове керування загону ШІ. Будь-який ручний ввід миттєво зупиняє режим.',
      profileLabel: 'Профіль поведінки',
      profileDescription: 'Профілі визначають, як ШІ витрачає ОД і приймає ризики.',
      manualOption: {
        name: 'Ручний режим',
        summary: 'Кожну дію виконуєте самостійно; автобій вимкнено.',
      },
      profiles: {
        balanced: {
          name: 'Збалансований',
          summary: 'Поєднує вогневий тиск і дисципліну укриттів.',
        },
        aggressive: {
          name: 'Агресивний',
          summary: 'Швидко зближується та сміливо витрачає ресурси.',
        },
        defensive: {
          name: 'Оборонний',
          summary: 'Утримує укриття, економить припаси, відступає завчасно.',
        },
      },
      hudTitle: 'Керування автобоєм',
      hudStatusIdle: 'Очікування',
      hudStatusEngaged: 'Виконує',
      hudStatusPaused: 'Пауза',
      hudToggleOnLabel: 'Авто вкл.',
      hudToggleOffLabel: 'Авто викл.',
      hudPauseReasons: {
        manualInput: 'Виявлено ручний ввід',
        dialogue: 'Активний діалог або вибір',
        objective: 'Перервано сюжетною подією',
        resources: 'Недостатньо ресурсів',
        ap: 'ОД вичерпано',
        none: 'Готово',
      },
      hudToggleHint: 'Shift+A — перемкнути автоматизацію.',
      hudProfileCycleHint: 'Використовуйте селектор, щоб змінити профіль під час бою.',
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
      squadTitle: 'Статус розвідки',
      telemetryLabel: 'Телеметрія',
      telemetryTitle: 'Журнал дій',
      menuButton: 'Меню',
      characterButton: 'Профіль',
      characterTitle: 'Профіль оперативника',
      characterSubtitle: 'Стати • Навички • Спорядження',
      completedToggleOpen: 'Показати завершені',
      completedToggleClose: 'Приховати завершені',
      eventsToggleOpen: 'Показати події',
      eventsToggleClose: 'Приховати всі події',
      collapseLeft: 'Сховати панель розвідки',
      expandLeft: 'Показати панель розвідки',
      collapseRight: 'Сховати оперативну панель',
      expandRight: 'Показати оперативну панель',
      completedOverlayTitle: 'Завершені',
      eventsOverlayTitle: 'Журнал подій',
      activeListTitle: 'Активні цілі',
      completedListTitle: 'Архів цілей',
      noAssignments: 'Немає активних цілей.',
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
      paranoiaLabel: 'Параноя',
      paranoiaTierLabels: {
        calm: 'Спокійно',
        uneasy: 'Тривожно',
        on_edge: 'На межі',
        panicked: 'Паніка',
        breakdown: 'Зрив',
      },
      healthLabel: 'Здоровʼя',
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
      loadLabel: 'Навантаження',
      itemsLabel: 'Предмети',
      perksLabel: 'Таланти',
      backgroundLabel: 'Походження',
      backgroundFallback: 'Без приналежності',
      loadUnit: 'кг',
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
      travelAdvisory: {
        label: 'ПОПЕРЕДЖЕННЯ РУХУ',
        levels: {
          clear: 'Маршрути чисті',
          caution: 'Підвищений ризик',
          severe: 'Рух небезпечний',
        },
        stats: ({ stamina, encounters }) => {
          const segments: string[] = [];
          if (stamina > 0) {
            segments.push(`Витривалість +${stamina}/хв`);
          }
          if (Math.abs(encounters - 1) > 0.01) {
            segments.push(`Сутички ×${encounters.toFixed(2)}`);
          }
          if (segments.length === 0) {
            return 'Умови стабільні';
          }
          return segments.join(' · ');
        },
      },
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
      escHint: 'Натисніть 1-9 для вибору, Esc щоб завершити',
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
      dockStatusIdle: 'На зв\'язку, слухаю ефір.',
      consoleTitle: 'Джордж // AI-асистент',
      openChat: 'Відкрити чат',
      closeChat: 'Закрити чат',
      subtitle: (alignment: string) => `Режим: ${alignment.toUpperCase()} активовано.`,
      guidanceIntro: 'Пріоритетні завдання:',
      statusIntro: (statusLine: string) => `Звіт стану: ${statusLine}`,
      questsIntro: 'Активні цілі:',
      questNone: 'Наразі немає активних завдань — час дослідити район.',
      questMore: 'Додаткові цілі чекають у журналі операцій.',
      interjectionIdle: 'Канал відкрито. Говори — слухаю.',
      logEmpty: 'Сповіщень поки немає. Дам знак, коли місто заворушиться.',
      levelAdvance: (descriptor) => `Готую накладки для ${descriptor}. Дай сигнал — запущу трансляцію.`,
      guidancePrimaryComplete: (levelName) => `• Основна: місію у ${levelName} виконано.`,
      guidancePrimaryObjective: (label, progress = '') => `• Основна: ${label}${progress}`,
      guidanceSideObjective: (label) => `• Побічна: ${label}`,
      guidanceProgress: (completed, total) => ` (${completed}/${total})`,
      missionComplete: (name) => `Операцію в ${name} завершено. Чекаю на нове розгортання.`,
      zoneFallback: 'поточна зона',
      feedLabels: {
        mission: 'Місія',
        status: 'Статус',
        guidance: 'Підказка',
        interjection: 'Вихід в ефір',
        zone: 'Зведення зони',
        ambient: 'Середовище',
      },
      ambientFeed: {
        empty: 'Сигнали середовища ще не зафіксовані.',
        categoryLabels: {
          rumor: 'Поголос',
          signage: 'Вивіски',
          weather: 'Погода',
          zoneDanger: 'Небезпека',
          hazardChange: 'Небезпеки',
          zoneBrief: 'Зведення зони',
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
        formatZoneBrief: ({ zoneName, summary, dangerLabel, hazards, directives }, alignment) => {
          const zone = zoneName ?? 'цей сектор';
          const infoLines = [
            `Небезпека: ${dangerLabel.toUpperCase()}`,
            summary ? `Зведення: ${summary}` : 'Зведення: даних немає.',
            hazards.length ? `Небезпеки: ${hazards.join(', ')}` : 'Небезпеки: не виявлено.',
            directives.length ? `Локальні директиви: ${directives.join('; ')}` : 'Локальні директиви: відсутні.',
          ].join('\n');
          switch (alignment) {
            case 'sarcastic':
              return `Зведення зони: ${zone}.\n${infoLines}\nСарказм – теж броня.`;
            case 'ruthless':
              return `Бойове зведення (${zone}).\n${infoLines}\nВикористаємо кожну слабку ланку.`;
            case 'stoic':
              return `Телеметрія зони для ${zone}.\n${infoLines}\nКоригую сценарії.`;
            default:
              return `Зведення для ${zone}.\n${infoLines}\nБерегти команду.`;
          }
        },
      },
      ambient: [
        'Сенсори показують, що мораль «прийнятна» — тримайся цього рівня.',
        'Знову подав скаргу на дощ. Статус: у черзі з 2034 року.',
        'Якщо побачиш Тео, нагадай про фільтр у кавовому синті.',
        'Сьогодні щасливе число 404. Постараймося не зникнути.',
      ],
      reassure: {
        button: 'Заспокоїти',
        hint: 'Притлуми параною і візьми паузу на подих.',
        cooldown: (seconds: number) => `Перезарядка (${seconds}с)`,
      },
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
    turnTracker: {
      heading: 'Стан ходу',
      playerTurn: 'Хід гравця',
      enemyTurn: 'Хід ворога',
      exploration: 'Дослідження',
      hostileReadout: 'Зведення ворогів',
      timeLabel: 'Локальний час',
    },
    character: {
      profileToggle: 'Профіль',
      systemsToggle: 'Системи',
      closeLabel: 'Закрити',
      tablistAria: 'Системи персонажа',
      tabs: {
        inventory: 'Інвентар',
        loadout: 'Спорядження',
        skills: 'Дерево навичок',
        reputation: 'Репутація',
      },
      hiddenState: 'Увімкніть панель, щоб переглянути дані оперативника.',
    },
    inventoryPanel: {
      title: 'Інвентар',
      summary: (inventoryWeight, loadoutWeight) => `Інвентар ${inventoryWeight} · Спорядження ${loadoutWeight}`,
      filters: {
        all: 'Усе',
        weapons: 'Зброя',
        armor: 'Броня',
        consumables: 'Витратні',
        quest: 'Завдання',
        misc: 'Інше',
      },
      filtersAriaLabel: 'Фільтри інвентарю',
      itemsAriaLabel: 'Елементи інвентарю',
      equippedAriaLabel: 'Екіпіровані предмети',
      hotbarAriaLabel: 'Оснащення хотбару',
      showingCount: (visible, total) => `Показано ${visible} з ${total} предметів`,
      emptyState: 'Наплічник порожній — час на пошуки.',
      weightTitle: 'Загальна вага',
      badges: {
        quest: 'Квест',
        weapon: 'Зброя',
        armor: 'Броня',
        consumable: 'Використати',
      },
      encumbranceLabel: 'Навантаження',
      encumbranceDescriptors: {
        normal: 'Стабільне',
        heavy: 'Важке',
        overloaded: 'Перевантаження',
        immobile: 'Нерухомий',
        unknown: 'Невідоме',
      },
      encumbranceSummary: {
        normal: 'Навантаження в нормі',
        heavy: (movement, attack) =>
          `Важке навантаження: рух x${movement.toFixed(2)}, атаки x${attack.toFixed(2)}`,
        overloaded: (movement, attack) =>
          `Критичне перевантаження: рух x${movement.toFixed(2)}, атаки x${attack.toFixed(2)}`,
        immobile: 'Нерухомий: не може рухатись чи діяти',
        unknown: 'Навантаження невідоме',
      },
      encumbranceWarning: {
        normal: null,
        heavy: 'Вага гальмує. Ви втратите ОД, якщо не розвантажитеся.',
        overloaded: 'Перевантажено. Рух коштує подвійні ОД, доки не позбудетеся баласту.',
        immobile: 'Спорядження скувало вас. Скиньте речі, щоб зрушити.',
        unknown: null,
      },
      weightValue: (weight, value) => `${weight} • ₿${value}`,
      durabilityLabel: (current, max) => `Міцність ${current}/${max}`,
      conditionLabel: (percentage) => `Стан ${percentage}%`,
      itemWeightAria: (weight, value) => `Вага ${weight}, вартість ₿${value}`,
      actions: {
        equip: 'Екіпірувати',
        unequip: 'Зняти',
        use: 'Використати',
        repair: (cost) => `Полагодити (${cost} деталей)`,
        repairAria: (itemName, cost) => `Полагодити ${itemName}, орієнтовно ${cost} деталей`,
        addToHotbar: 'Додати до хотбару',
        removeFromHotbar: 'Прибрати з хотбару',
        hotbarFull: 'Хотбар заповнений',
        clearHotbar: 'Очистити',
      },
      equipment: {
        title: 'Екіпіроване спорядження',
        slotEmpty: 'Порожньо',
        slots: {
          primaryWeapon: {
            label: 'Основна зброя',
            description: 'Основні вогнепальні та гвинтівки.',
            empty: 'Зброя не споряджена',
          },
          secondaryWeapon: {
            label: 'Резервна зброя',
            description: 'Пістолети та запасні стволи.',
            empty: 'Резервна зброя відсутня',
          },
          meleeWeapon: {
            label: 'Ближній бій',
            description: 'Клинки та кийки для короткої дистанції.',
            empty: 'Зброю ближнього бою не споряджено',
          },
          bodyArmor: {
            label: 'Броня корпусу',
            description: 'Захисні шари на торс.',
            empty: 'Броню не споряджено',
          },
          helmet: {
            label: 'Головний захист',
            description: 'Візори, шоломи та маски.',
            empty: 'Шолом не споряджено',
          },
          accessory1: {
            label: 'Аксесуар I',
            description: 'Імпланти, пояси чи наручні моди.',
            empty: 'Слот аксесуару порожній',
          },
          accessory2: {
            label: 'Аксесуар II',
            description: 'Другий слот аксесуару.',
            empty: 'Слот аксесуару порожній',
          },
        },
        conditionHeading: 'Стан',
        noCompatible: 'Сумісних предметів у рюкзаку немає',
      },
      hotbar: {
        title: 'Хотбар',
        slotLabel: (index) => `Слот ${index}`,
        unassigned: 'Не призначено',
      },
      hotbarBadge: (index) => `Хотбар ${index}`,
    },
    loadoutPanel: {
      ariaLabel: 'Спорядження оперативника',
      headingLabel: 'Оперативник',
      headingTitle: 'Спорядження',
      perksLabel: 'Таланти',
      noPerks: 'Таланти ще не здобуті',
      stats: {
        damage: 'Шкода',
        range: 'Дальність',
        apCost: 'Ціна ОД',
        skill: 'Навичка',
        protection: 'Захист',
        weight: 'Вага',
        value: 'Вартість',
        durability: 'Міцність',
      },
      condition: {
        pristine: (percentage) => `Стан ${percentage}%`,
        broken: 'Стан 0% — Зламано',
        critical: (percentage) => `Стан ${percentage}% — Критично`,
        worn: (percentage) => `Стан ${percentage}% — Зношено`,
        used: (percentage) => `Стан ${percentage}%`,
      },
      actions: {
        unequip: 'Зняти',
        equip: (itemName) => `Екіпірувати ${itemName}`,
      },
      noCompatible: 'Сумісних предметів у рюкзаку немає',
    },
    skillTreePanel: {
      title: 'Дерево навичок',
      baseHint: '+5 базово • +10 з тегом',
      pointsLabel: (count) => {
        const mod10 = count % 10;
        const mod100 = count % 100;
        let suffix = 'очок';
        if (mod10 === 1 && mod100 !== 11) {
          suffix = 'очко';
        } else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
          suffix = 'очки';
        }
        return `${count} ${suffix} навичок`;
      },
      tablistAria: 'Гілки навичок',
      branches: {
        combat: 'Бойове',
        tech: 'Техніка',
        survival: 'Виживання',
        social: 'Соціальне',
      },
      tagBadge: 'Тег',
      incrementLabel: (increment, tagged) =>
        tagged ? `1 очк. → +${increment} (тег)` : `1 очк. → +${increment}`,
      decreaseAria: (skillName) => `Зменшити ${skillName}`,
      increaseAria: (skillName) => `Збільшити ${skillName}`,
      announcement: (skillName, verb, value, effect) => {
        const verbText = verb === 'increase' ? 'підвищено' : 'знижено';
        return `${skillName} ${verbText} до ${value}. ${effect}`;
      },
    },
    playerStatsPanel: {
      ariaLabel: 'Характеристики гравця',
      equipmentWarning: 'Дані спорядження недоступні. Показано базові атрибути.',
      rankLabel: (value) => `Ранг ${value}`,
      baseLabel: (value) => `База ${value}`,
      focusLabel: (focusName) => `Фокус: ${focusName}`,
    },
  },
};

export const getUIStrings = (locale: Locale): UIStrings => STRINGS[locale] ?? STRINGS.en;
