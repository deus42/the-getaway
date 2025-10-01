import { Level0LocaleContent } from '../types';

export const level0UkrainianContent: Level0LocaleContent = {
  dialogues: [
    {
      id: 'npc_lira_vendor',
      npcId: 'Ліра-контрабандистка',
      nodes: [
        {
          id: 'intro',
          text: 'Ліра постукує попелом у консервну бляшанку у формі койота. "Потрібні залізяки, плітки чи маленьке диво? Срібло купує тишу. Послуги лишають легені цілими після комендантської."',
          options: [
            {
              text: 'Що сьогодні гуде на базарі?',
              nextNodeId: 'trade',
              skillCheck: {
                skill: 'charisma',
                threshold: 6,
              },
            },
            {
              text: 'Поставки теж зникли, як ті койоти, що нам обіцяли?',
              nextNodeId: 'quest',
              questEffect: {
                questId: 'quest_market_cache',
                effect: 'start',
              },
            },
            {
              text: 'Твій тайник знову у наших руках.',
              nextNodeId: 'quest_complete',
              questEffect: {
                questId: 'quest_market_cache',
                effect: 'complete',
              },
            },
            {
              text: 'Тримай німб навскіс, Ліро.',
              nextNodeId: null,
            },
          ],
        },
        {
          id: 'trade',
          text: '"Товару менше, ніж супу на комендантську. Принеси трамвайні жетони — відкрию резерв до того, як дрони доспівають гімн."',
          options: [
            {
              text: 'Пошкрябаю турнікети.',
              nextNodeId: null,
            },
          ],
        },
        {
          id: 'quest',
          text: '"Корпсек загріб мій тайник і назвав це доказами. Прослизни в Центр, визволь ящики, і вип’ємо очищеної дощівки."',
          options: [
            {
              text: 'Нехай їхні докази заблукають.',
              nextNodeId: null,
            },
          ],
        },
        {
          id: 'quest_complete',
          text: '"Знала, що обженеш їхніх співаків. Перекрою маршрути через провулки з неоновими городами."',
          options: [
            {
              text: 'Будь невидимка, Ліро.',
              nextNodeId: null,
            },
          ],
        },
      ],
    },
    {
      id: 'npc_archivist_naila',
      npcId: 'Архіварка Найла',
      nodes: [
        {
          id: 'intro',
          text: 'Найла протирає побиті лінзи, що показують три різні небеса. "Знання — це важіль. Допоможи зняти маску з маніфестів, і я виріжу для тебе вікно повітря."',
          options: [
            {
              text: 'Який артефакт витягаємо цього разу?',
              nextNodeId: 'mission',
              questEffect: {
                questId: 'quest_datapad_truth',
                effect: 'start',
              },
            },
            {
              text: 'Маніфести вже співають у мене на пульті.',
              nextNodeId: 'mission_complete',
              questEffect: {
                questId: 'quest_datapad_truth',
                effect: 'complete',
              },
            },
            {
              text: 'Іншим разом, архіварко.',
              nextNodeId: null,
            },
          ],
        },
        {
          id: 'mission',
          text: '"Ліра тримає дата-пад, повний патрульної математики. Принеси — і я намалюю їхні маршрути, як сузір’я."',
          options: [
            {
              text: 'Заберу сяйливу цеглину.',
              nextNodeId: null,
            },
          ],
        },
        {
          id: 'mission_complete',
          text: '"Це їх розкриває. Завантажую безпечні вікна, поки спічрайтери Гарроу не вигадають нових казок."',
          options: [
            {
              text: 'Дякую за зорі, Найло.',
              nextNodeId: null,
            },
          ],
        },
      ],
    },
    {
      id: 'npc_courier_brant',
      npcId: 'Кур’єр Брант',
      nodes: [
        {
          id: 'intro',
          text: 'Брант плескає по потертій сумці, ніби та от-от загавкає. "Мої бігуни зникли після комендантської. Допоможи їх знайти — і я розкрию свої маршрути, як книжку пригод."',
          options: [
            {
              text: 'Де їхній останній слід із крихт?',
              nextNodeId: 'task',
              questEffect: {
                questId: 'quest_courier_network',
                effect: 'start',
              },
            },
            {
              text: 'Твої кур’єри цього разу пережили комендантську.',
              nextNodeId: 'task_complete',
              questEffect: {
                questId: 'quest_courier_network',
                effect: 'complete',
              },
            },
            {
              text: 'Сьогодні гасимо іншу пожежу.',
              nextNodeId: null,
            },
          ],
        },
        {
          id: 'task',
          text: '"Вони рахували трамвайні жетони біля вузла і наспівували старі джингли метро. Пройди площі та забери все, що сховали."',
          options: [
            {
              text: 'Будь непосидючим, Бранте.',
              nextNodeId: null,
            },
          ],
        },
        {
          id: 'task_complete',
          text: '"Ти витяг їх із дронового хору. Ці маршрути триматимуть тебе на дві хвилини попереду змітальників."',
          options: [
            {
              text: 'Нехай мережа дихає уривчасто.',
              nextNodeId: null,
            },
          ],
        },
      ],
    },
  ],
  quests: [
    {
      id: 'quest_market_cache',
      name: 'Повернення ринкового тайника',
      description: 'Ліра хоче повернути конфіскований тайник із контрабандою на патрульному маршруті в Центрі.',
      isActive: false,
      isCompleted: false,
      objectives: [
        {
          id: 'recover-keycard',
          description: 'Добудьте корпоративну ключ-картку, заховану в Центрі.',
          isCompleted: false,
          type: 'collect',
          target: 'Корпоративна ключ-картка',
          count: 1,
          currentCount: 0,
        },
        {
          id: 'return-to-lira',
          description: 'Поверніться до Ліри в Нетрищах.',
          isCompleted: false,
          type: 'talk',
          target: 'Ліра-контрабандистка',
        },
      ],
      rewards: [
        { type: 'currency', amount: 80 },
        { type: 'item', id: 'Зашифрований дата-пад', amount: 1 },
      ],
    },
    {
      id: 'quest_datapad_truth',
      name: 'Маніфести контролю',
      description: 'Архіварці Найлі потрібен зашифрований дата-пад, щоби викрити патрульні маршрути.',
      isActive: false,
      isCompleted: false,
      objectives: [
        {
          id: 'obtain-datapad',
          description: 'Добудьте зашифрований дата-пад із сховку в Нетрищах.',
          isCompleted: false,
          type: 'collect',
          target: 'Зашифрований дата-пад',
          count: 1,
          currentCount: 0,
        },
        {
          id: 'deliver-naila',
          description: 'Передайте дата-пад Архіварці Найлі в Центрі.',
          isCompleted: false,
          type: 'talk',
          target: 'Архіварка Найла',
        },
      ],
      rewards: [
        { type: 'experience', amount: 120 },
        { type: 'item', id: 'Трамвайні жетони', amount: 1 },
      ],
    },
    {
      id: 'quest_courier_network',
      name: 'Порятунок кур’єрської мережі',
      description: 'Кур’єр Брант втратив зв’язок зі своїми бігунами біля транспортного вузла.',
      isActive: false,
      isCompleted: false,
      objectives: [
        {
          id: 'find-transit-tokens',
          description: 'Зберіть трамвайні жетони на площах Центру.',
          isCompleted: false,
          type: 'collect',
          target: 'Трамвайні жетони',
          count: 3,
          currentCount: 0,
        },
        {
          id: 'report-brant',
          description: 'Доповідайте Бранту про повернення жетонів.',
          isCompleted: false,
          type: 'talk',
          target: 'Кур’єр Брант',
        },
      ],
      rewards: [
        { type: 'experience', amount: 90 },
        { type: 'currency', amount: 60 },
      ],
    },
  ],
  npcBlueprints: [
    {
      name: 'Ліра-контрабандистка',
      position: { x: 26, y: 20 },
      health: 12,
      maxHealth: 12,
      routine: [
        { position: { x: 26, y: 20 }, timeOfDay: 'day', duration: 240 },
        { position: { x: 30, y: 26 }, timeOfDay: 'evening', duration: 240 },
        { position: { x: 22, y: 19 }, timeOfDay: 'night', duration: 240 },
      ],
      dialogueId: 'npc_lira_vendor',
      isInteractive: true,
    },
    {
      name: 'Вартовий Орн',
      position: { x: 46, y: 28 },
      health: 20,
      maxHealth: 20,
      routine: [
        { position: { x: 46, y: 28 }, timeOfDay: 'day', duration: 180 },
        { position: { x: 50, y: 20 }, timeOfDay: 'evening', duration: 180 },
        { position: { x: 40, y: 34 }, timeOfDay: 'night', duration: 180 },
      ],
      dialogueId: 'npc_guard_orn',
      isInteractive: false,
    },
    {
      name: 'Архіварка Найла',
      position: { x: 28, y: 14 },
      health: 14,
      maxHealth: 14,
      routine: [
        { position: { x: 28, y: 14 }, timeOfDay: 'day', duration: 300 },
        { position: { x: 32, y: 24 }, timeOfDay: 'evening', duration: 300 },
      ],
      dialogueId: 'npc_archivist_naila',
      isInteractive: true,
    },
    {
      name: 'Кур’єр Брант',
      position: { x: 14, y: 24 },
      health: 16,
      maxHealth: 16,
      routine: [
        { position: { x: 14, y: 24 }, timeOfDay: 'day', duration: 180 },
        { position: { x: 10, y: 16 }, timeOfDay: 'evening', duration: 180 },
        { position: { x: 34, y: 16 }, timeOfDay: 'night', duration: 180 },
      ],
      dialogueId: 'npc_courier_brant',
      isInteractive: true,
    },
  ],
  itemBlueprints: [
    {
      name: 'Покинута аптечка',
      description: 'Напівповна аптечка, захована біля ринкового намету.',
      weight: 2,
      value: 40,
      isQuestItem: false,
    },
    {
      name: 'Зашифрований дата-пад',
      description: 'Містить маніфести чорного ринку, які охороняє Ліра.',
      weight: 1,
      value: 150,
      isQuestItem: true,
    },
    {
      name: 'Корпоративна ключ-картка',
      description: 'Пропуск, поцуплений у топ-менеджера корпорації.',
      weight: 0.2,
      value: 200,
      isQuestItem: true,
    },
    {
      name: 'Трамвайні жетони',
      description: 'Старі жетони метро. Деякі торговці досі їх приймають.',
      weight: 0.5,
      value: 30,
      isQuestItem: false,
    },
  ],
  buildingDefinitions: [
    {
      id: 'block_1_1',
      name: 'Набережний комплекс',
      footprint: { from: { x: 4, y: 4 }, to: { x: 23, y: 19 } },
      door: { x: 13, y: 20 },
      interior: { width: 20, height: 12 },
    },
    {
      id: 'block_1_2',
      name: 'Торговий обмін',
      footprint: { from: { x: 27, y: 4 }, to: { x: 59, y: 19 } },
      door: { x: 43, y: 20 },
      interior: { width: 26, height: 12 },
    },
    {
      id: 'block_1_3',
      name: 'Площа аркологій',
      footprint: { from: { x: 63, y: 4 }, to: { x: 95, y: 19 } },
      door: { x: 79, y: 20 },
      interior: { width: 26, height: 12 },
    },
    {
      id: 'block_1_4',
      name: 'Громадський форум',
      footprint: { from: { x: 99, y: 4 }, to: { x: 131, y: 19 } },
      door: { x: 115, y: 20 },
      interior: { width: 28, height: 12 },
    },
    {
      id: 'block_2_1',
      name: 'Житловий ряд',
      footprint: { from: { x: 4, y: 22 }, to: { x: 23, y: 43 } },
      door: { x: 13, y: 44 },
      interior: { width: 18, height: 14 },
    },
    {
      id: 'block_2_2',
      name: 'Ринковий вузол',
      footprint: { from: { x: 27, y: 22 }, to: { x: 59, y: 43 } },
      door: { x: 43, y: 44 },
      interior: { width: 26, height: 14 },
    },
    {
      id: 'block_2_3',
      name: 'Корпоративна площа',
      footprint: { from: { x: 63, y: 22 }, to: { x: 95, y: 43 } },
      door: { x: 79, y: 44 },
      interior: { width: 26, height: 14 },
    },
    {
      id: 'block_2_4',
      name: 'Площа реєстру',
      footprint: { from: { x: 99, y: 22 }, to: { x: 131, y: 43 } },
      door: { x: 115, y: 44 },
      interior: { width: 28, height: 14 },
    },
    {
      id: 'block_3_1',
      name: 'Промислові двори',
      footprint: { from: { x: 4, y: 46 }, to: { x: 23, y: 67 } },
      door: { x: 13, y: 68 },
      interior: { width: 18, height: 14 },
    },
    {
      id: 'block_3_2',
      name: 'Транзитний вузол',
      footprint: { from: { x: 27, y: 46 }, to: { x: 59, y: 67 } },
      door: { x: 43, y: 68 },
      interior: { width: 26, height: 14 },
    },
    {
      id: 'block_3_3',
      name: 'Науковий сектор',
      footprint: { from: { x: 63, y: 46 }, to: { x: 95, y: 67 } },
      door: { x: 79, y: 68 },
      interior: { width: 26, height: 14 },
    },
    {
      id: 'block_3_4',
      name: 'Музейна алея',
      footprint: { from: { x: 99, y: 46 }, to: { x: 131, y: 67 } },
      door: { x: 115, y: 68 },
      interior: { width: 28, height: 14 },
    },
    {
      id: 'block_4_1',
      name: 'Логістичний двір',
      footprint: { from: { x: 4, y: 70 }, to: { x: 23, y: 91 } },
      door: { x: 13, y: 92 },
      interior: { width: 18, height: 14 },
    },
    {
      id: 'block_4_2',
      name: 'Розважальна смуга',
      footprint: { from: { x: 27, y: 70 }, to: { x: 59, y: 91 } },
      door: { x: 43, y: 92 },
      interior: { width: 26, height: 14 },
    },
    {
      id: 'block_4_3',
      name: 'Сонячний масив',
      footprint: { from: { x: 63, y: 70 }, to: { x: 95, y: 91 } },
      door: { x: 79, y: 92 },
      interior: { width: 26, height: 14 },
    },
    {
      id: 'block_4_4',
      name: 'Док аеростатів',
      footprint: { from: { x: 99, y: 70 }, to: { x: 131, y: 91 } },
      door: { x: 115, y: 92 },
      interior: { width: 28, height: 14 },
    },
  ],
  coverSpots: {
    slums: [
      { x: 12, y: 20 },
      { x: 18, y: 14 },
      { x: 24, y: 24 },
      { x: 28, y: 30 },
      { x: 34, y: 22 },
      { x: 40, y: 28 },
      { x: 8, y: 24 },
      { x: 14, y: 32 },
      { x: 22, y: 8 },
      { x: 30, y: 10 },
      { x: 44, y: 24 },
      { x: 48, y: 32 },
      { x: 36, y: 12 },
      { x: 50, y: 18 },
      { x: 18, y: 34 },
      { x: 10, y: 12 },
    ],
    downtown: [
      { x: 12, y: 18 },
      { x: 20, y: 20 },
      { x: 42, y: 18 },
      { x: 52, y: 20 },
      { x: 74, y: 18 },
      { x: 84, y: 20 },
      { x: 106, y: 18 },
      { x: 118, y: 20 },
      { x: 14, y: 40 },
      { x: 22, y: 44 },
      { x: 44, y: 38 },
      { x: 56, y: 44 },
      { x: 76, y: 40 },
      { x: 88, y: 44 },
      { x: 108, y: 38 },
      { x: 120, y: 44 },
      { x: 16, y: 68 },
      { x: 26, y: 70 },
      { x: 46, y: 66 },
      { x: 58, y: 68 },
      { x: 80, y: 66 },
      { x: 92, y: 68 },
      { x: 112, y: 66 },
      { x: 124, y: 68 },
      { x: 18, y: 94 },
      { x: 30, y: 96 },
      { x: 48, y: 94 },
      { x: 62, y: 92 },
      { x: 82, y: 94 },
      { x: 100, y: 92 },
      { x: 116, y: 96 },
      { x: 132, y: 94 },
    ],
  },
  world: {
    areaName: 'Центр міста',
    objectives: [
      'Обстежте периметр Нетрищ і позначте ворожі патрулі',
      'Встановіть контакт із Лірою-контрабандисткою',
      'Знайдіть укриття до початку комендантських облав',
    ],
    initialEnemyName: 'Гвардієць',
  },
};
