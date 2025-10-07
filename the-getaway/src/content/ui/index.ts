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
  objectivesLabel: string;
  emptyObjectives: string;
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
  ambient: string[];
}

interface UIStrings {
  menu: MenuStrings;
  questLog: QuestLogStrings;
  shell: ShellStrings;
  playerStatus: PlayerStatusStrings;
  miniMap: MiniMapStrings;
  dayNight: DayNightStrings;
  levelIndicator: LevelIndicatorStrings;
  dialogueOverlay: DialogueOverlayStrings;
  perks: PerkStrings;
  skills: Record<SkillKey, string>;
  skillDescriptions: Record<SkillKey, string>;
  statFocus: Record<StatFocusKey, string>;
  george: GeorgeStrings;
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
      objectivesLabel: 'OBJECTIVES',
      emptyObjectives: 'No active tasks in this sector.',
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
      ambient: [
        'Diagnostics show morale at "manageable"—keep it that way.',
        'Filed another complaint against the rain. Status: pending since 2034.',
        'If you spot Theo, remind him the coffee synth still needs a filter.',
        'Today’s lucky number is 404. Let’s try not to vanish.',
      ],
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
      objectivesLabel: 'ЦІЛІ',
      emptyObjectives: 'У цьому секторі немає активних завдань.',
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
      ambient: [
        'Сенсори показують, що мораль «прийнятна» — тримайся цього рівня.',
        'Знову подав скаргу на дощ. Статус: у черзі з 2034 року.',
        'Якщо побачиш Тео, нагадай про фільтр у кавовому синті.',
        'Сьогодні щасливе число 404. Постараймося не зникнути.',
      ],
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
