import { Locale } from '../locales';

interface LogStrings {
  npcNotReady: (name: string) => string;
  npcNoNewInfo: (name: string) => string;
  npcChannelEmpty: (name: string) => string;
  npcChannelOpened: (name: string) => string;
  curfewPatrolName: string;
  combatChatterOverrides: string;
  npcBoxedIn: (name: string) => string;
  checkpointSealed: string;
  npcOutOfReach: (name: string) => string;
  nightFalls: string;
  dawnBreaks: string;
  combatOver: string;
  notEnoughAp: string;
  enemyOutOfRange: string;
  hitEnemy: (enemyName: string, damage: number) => string;
  missedEnemy: (enemyName: string) => string;
  allEnemiesDefeated: string;
  conversationEnded: string;
  noFriendlyContact: string;
  enteredCombat: string;
  noEnemiesInRange: string;
  zoneSecured: string;
  notYourTurn: string;
  actionPointsDepleted: string;
  slipInsideStructure: string;
  searchlightsWarning: string;
  curfewOpenFire: string;
  curfewReinforcement: string;
  curfewFootsteps: string;
  operationStart: string;
  questAccepted: (questName: string) => string;
  questCompleted: (questName: string) => string;
  objectiveUpdated: (objectiveDescription: string, questName: string) => string;
  rewardExperience: (amount: number, questName: string) => string;
  rewardCredits: (amount: number, questName: string) => string;
  rewardItem: (itemName: string, questName: string) => string;
  alertSuspicious: string;
  alertInvestigating: string;
  alertAlarmed: string;
  reinforcementsIncoming: string;
}

interface SystemStrings {
  logs: LogStrings;
}

const SYSTEM_STRINGS: Record<Locale, SystemStrings> = {
  en: {
    logs: {
      npcNotReady: (name) => `${name} isn't ready to talk right now.`,
      npcNoNewInfo: (name) => `${name} has nothing new to share right now.`,
      npcChannelEmpty: (name) => `${name} falls silent—the channel is empty.`,
      npcChannelOpened: (name) => `You open a quiet channel with ${name}.`,
      curfewPatrolName: 'Curfew Patrol',
      combatChatterOverrides:
        'Combat chatter overrides civilian channels—clear the area first.',
      npcBoxedIn: (name) => `${name} is boxed in—you can't reach their position.`,
      checkpointSealed:
        "Checkpoint sealed. The regime's curfew keeps the district locked down.",
      npcOutOfReach: (name) => `${name} is out of reach—their channel fades into static.`,
      nightFalls: 'Night falls over the Slums. Curfew squadrons sweep the streets.',
      dawnBreaks: 'Dawn breaks. The regime eases the curfew for a few precious hours.',
      combatOver: 'Combat Over!',
      notEnoughAp: 'Not enough AP to attack!',
      enemyOutOfRange: 'Enemy out of range!',
      hitEnemy: (enemyName, damage) => `You hit ${enemyName} for ${damage} damage.`,
      missedEnemy: (enemyName) => `You missed ${enemyName}.`,
      allEnemiesDefeated: 'All enemies defeated!',
      conversationEnded: 'You end the conversation and refocus on the street.',
      noFriendlyContact: 'No friendly contact within whisper range.',
      enteredCombat: 'Entered combat mode!',
      noEnemiesInRange: 'No enemies in range to attack!',
      zoneSecured: 'Zone secured. The street is yours again.',
      notYourTurn: "It's not your turn!",
      actionPointsDepleted: "You're out of action points. The opposition seizes the initiative.",
      slipInsideStructure: 'You slip inside the structure. Patrol scanners lose your trail.',
      searchlightsWarning:
        'Searchlights pin you in the open—duck inside before the patrols lock on.',
      curfewOpenFire: 'Curfew patrol opens fire! Survive until the sirens fade.',
      curfewReinforcement: 'Another patrol joins the skirmish, tightening the net.',
      curfewFootsteps: "You hear armored boots closing in, but they can't reach you yet.",
      operationStart: 'Operation Emberfall commences. Your cell slips back into the Slums.',
      questAccepted: (questName) => `Quest accepted: ${questName}.`,
      questCompleted: (questName) => `Quest completed: ${questName}.`,
      objectiveUpdated: (objectiveDescription, questName) =>
        `Objective updated: ${objectiveDescription} (${questName}).`,
      rewardExperience: (amount, questName) => `+${amount} XP from ${questName}.`,
      rewardCredits: (amount, questName) => `+${amount} credits secured from ${questName}.`,
      rewardItem: (itemName, questName) => `Received ${itemName} from ${questName}.`,
      alertSuspicious: 'Guard patrol notices something off—stay cautious.',
      alertInvestigating: 'Patrol is actively searching the area. Get to cover!',
      alertAlarmed: 'ALERT! Enemy has locked onto your position!',
      reinforcementsIncoming: 'Reinforcements called in—more hostiles incoming!',
    },
  },
  uk: {
    logs: {
      npcNotReady: (name) => `${name} зараз не готовий говорити.`,
      npcNoNewInfo: (name) => `${name} наразі не має новин.`,
      npcChannelEmpty: (name) => `${name} замовкає — канал порожній.`,
      npcChannelOpened: (name) => `Ви відкриваєте тихий канал з ${name}.`,
      curfewPatrolName: 'Комендантський патруль',
      combatChatterOverrides:
        'Бойовий канал перекриває цивільний зв’язок — спершу звільніть сектор.',
      npcBoxedIn: (name) => `${name} заблокований — до їхньої позиції не дістатися.`,
      checkpointSealed:
        'Контрольно-пропускний пункт зачинено. Комендантська година тримає район у блокаді.',
      npcOutOfReach: (name) => `${name} поза досяжністю — канал тоне у перешкодах.`,
      nightFalls: 'Ніч накриває Нетрища. Патрулі прочісують вулиці.',
      dawnBreaks: 'Світання. Режим тимчасово послаблює комендантську годину.',
      combatOver: 'Бій завершено!',
      notEnoughAp: 'Недостатньо ОД для атаки!',
      enemyOutOfRange: 'Ціль поза досяжністю!',
      hitEnemy: (enemyName, damage) => `Ви вражаєте ${enemyName} на ${damage} шкоди.`,
      missedEnemy: (enemyName) => `Ви промахнулися по ${enemyName}.`,
      allEnemiesDefeated: 'Усі вороги знешкоджені!',
      conversationEnded: 'Ви завершуєте розмову та повертаєтесь до вулиці.',
      noFriendlyContact: 'Немає союзних контактів у зоні шепоту.',
      enteredCombat: 'Бойовий режим активовано!',
      noEnemiesInRange: 'Немає ворогів у зоні ураження!',
      zoneSecured: 'Зона під контролем. Вулиця знову ваша.',
      notYourTurn: 'Зараз не ваш хід!',
      actionPointsDepleted: 'ОД вичерпано. Противник перехоплює ініціативу.',
      slipInsideStructure: 'Ви прослизаєте до будівлі. Сканери патруля втрачають слід.',
      searchlightsWarning:
        'Прожектори засікли вас — заховайтеся, доки патрулі не навелися.',
      curfewOpenFire: 'Патруль відкриває вогонь! Виживіть, поки сирени не вщухнуть.',
      curfewReinforcement: 'Ще один патруль стискає кільце.',
      curfewFootsteps: 'Чути важкі кроки, але вони ще не дісталися до вас.',
      operationStart: 'Операція "Жар-Птаха" починається. Осередок повертається до Нетрищ.',
      questAccepted: (questName) => `Завдання прийнято: ${questName}.`,
      questCompleted: (questName) => `Завдання виконано: ${questName}.`,
      objectiveUpdated: (objectiveDescription, questName) =>
        `Ціль оновлено: ${objectiveDescription} (${questName}).`,
      rewardExperience: (amount, questName) => `+${amount} од. досвіду за ${questName}.`,
      rewardCredits: (amount, questName) => `+${amount} кредитів за ${questName}.`,
      rewardItem: (itemName, questName) => `Отримано ${itemName} від ${questName}.`,
      alertSuspicious: 'Патруль помічає щось підозріле — будьте обережні.',
      alertInvestigating: 'Патруль активно обшукує зону. Сховайтеся!',
      alertAlarmed: 'ТРИВОГА! Ворог засік вашу позицію!',
      reinforcementsIncoming: 'Викликано підкріплення — більше ворогів на підході!',
    },
  },
};

export const getSystemStrings = (locale: Locale): SystemStrings =>
  SYSTEM_STRINGS[locale] ?? SYSTEM_STRINGS.en;
