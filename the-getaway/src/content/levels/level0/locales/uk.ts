import { Level0LocaleContent } from '../types';
import { getItemPrototype } from '../../../items';

const encryptedDatapadUk = {
  ...getItemPrototype('misc_encrypted_datapad'),
  name: 'Зашифрований дата-пад',
  description: 'Містить маніфести чорного ринку, які охороняє Ліра.',
};

const corporateKeycardUk = {
  ...getItemPrototype('misc_corporate_keycard'),
  name: 'Корпоративна ключ-картка',
  description: 'Пропуск, поцуплений у топ-менеджера корпорації.',
};

const transitTokenUk = {
  ...getItemPrototype('misc_transit_tokens'),
  name: 'Трамвайний жетон',
  description: 'Штампований жетон для метро Центру. Кур’єри ховають їх, щоб прослизнути повз КПП.',
};

const abandonedMedkitUk = {
  ...getItemPrototype('misc_abandoned_medkit'),
  name: 'Покинута аптечка',
  description: 'Запилений комплект першої допомоги, покинутий після раптового рейду.',
};

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
              factionRequirement: {
                factionId: 'scavengers',
                minimumStanding: 'friendly',
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
      id: 'npc_firebrand_juno',
      npcId: 'Юно Вогнеборець',
      nodes: [
        {
          id: 'intro',
          text: 'Юно роздмухує жар у бочці з пальним, окуляри запітніли від вологи. "Увесь район — це паровий котел. Або ми випустимо пару, або розірве нас разом із корпусами."',
          options: [
            {
              text: 'Покажи, як тримаєш барикади.',
              nextNodeId: 'defense',
            },
            {
              text: 'Я підкину припаси, якщо підеш у влучні руки.',
              nextNodeId: 'supplies',
              skillCheck: {
                skill: 'charisma',
                threshold: 7,
              },
              factionRequirement: {
                factionId: 'resistance',
                minimumStanding: 'neutral',
              },
            },
            {
              text: 'Тримай жар гарячим, Юно.',
              nextNodeId: null,
            },
          ],
        },
        {
          id: 'defense',
          text: '"Нетри розрізають патрулі на три кишені." Вона креслить маршрути в попелі. "Заглуши дронів на даху Транзитного вузла, а я дам команду засідці."',
          options: [
            {
              text: 'Познач мені точки для глушаків.',
              nextNodeId: null,
            },
          ],
        },
        {
          id: 'supplies',
          text: '"Сміливий язик." Усмішка Юно спалахує неоном. "Обміняю твою милість на вибухівку й перев’язки. Гель наш, медикаменти — лікарям."',
          options: [
            {
              text: 'Домовились. Підлатаємо повстанців.',
              nextNodeId: null,
            },
          ],
        },
      ],
    },
    {
      id: 'npc_seraph_warden',
      npcId: 'Сераф-Вартовий',
      nodes: [
        {
          id: 'intro',
          text: 'Хромована маска Серафа відбиває голографічні борди. "Центр — це собор покори. Ви дихаєте тут, бо я це дозволяю."',
          options: [
            {
              text: 'Собори падають, коли хор іде геть.',
              nextNodeId: 'warning',
            },
            {
              text: 'Твої дрони збиваються біля Доків аеростатів.',
              nextNodeId: 'maintenance',
              skillCheck: {
                skill: 'intelligence',
                threshold: 8,
              },
            },
            {
              text: 'Просто проходжу.',
              nextNodeId: null,
            },
          ],
        },
        {
          id: 'warning',
          text: '"Повстання — це неоплачений рахунок." Рука вартового лягає на шокову дубинку. "Сплатіть до контрольної ночі, інакше відсотки з’їдять вас."',
          options: [
            {
              text: 'Рахунок отримано. Інкасація скасовується.',
              nextNodeId: null,
            },
          ],
        },
        {
          id: 'maintenance',
          text: '"Це аномалія під грифом." Візор мерехтить. "Та стримування важливіше марнославства. Познач несправність — і я призначу переналаштування."',
          options: [
            {
              text: 'Менше дронів — довше живуть.',
              nextNodeId: null,
            },
          ],
        },
      ],
    },
    {
      id: 'npc_drone_handler_kesh',
      npcId: 'Кеш — дрон-технік',
      nodes: [
        {
          id: 'intro',
          text: 'Кеш схилилася над розібраним дроном-розвідником, тримаючи паяльник. "Корп-код співає в одній тональності. Зміни хор — зміниш марш."',
          options: [
            {
              text: 'Зможеш підманити патруль, аби він стеріг наших?',
              nextNodeId: 'spoof',
            },
            {
              text: 'Продай глушак, який не спалить мою систему.',
              nextNodeId: 'jammer',
            },
            {
              text: 'Продовжуй, маестро.',
              nextNodeId: null,
            },
          ],
        },
        {
          id: 'spoof',
          text: '"Дай їхній маршрутний реєстр — і я переверну дрону друзів і ворогів." Кеш заштовхує картридж у корпус. "Одна ніч, поки вони не залатають дірку."',
          options: [
            {
              text: 'Принесу телеметрію патруля.',
              nextNodeId: null,
            },
          ],
        },
        {
          id: 'jammer',
          text: '"Тобі потрібна точність — плати за точність." Вона підсуває тонкий диск. "Прикріпи під опорою небомосту — і отримаєш максимальний ефект."',
          options: [
            {
              text: 'Домовилися.',
              nextNodeId: null,
            },
          ],
        },
      ],
    },
    {
      id: 'npc_archivist_naila',
      npcId: 'Архіварка Найла',
      toneDefaults: {
        personaId: 'persona.amara_velez',
        authorId: 'author.vonnegut_brautigan_core',
        sceneId: 'scene.post_ambush_reassurance',
        seedKey: 'naila',
      },
      nodes: [
        {
          id: 'intro',
          text: 'Найла протирає побиті лінзи, що показують три різні небеса. "Знання — це важіль. Допоможи зняти маску з маніфестів, і я виріжу для тебе вікно повітря."',
          tone: {
            sceneId: 'scene.share_scarce_food',
            templateId: 'template.deadpan.reassure',
            seedKey: 'intro',
          },
          options: [
            {
              text: 'Який артефакт витягаємо цього разу?',
              nextNodeId: 'mission',
              questEffect: {
                questId: 'quest_datapad_truth',
                effect: 'start',
              },
              factionRequirement: {
                factionId: 'resistance',
                minimumStanding: 'neutral',
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
          tone: {
            sceneId: 'scene.pre_heist_briefing',
            templateId: 'template.urgent.push',
            seedKey: 'mission',
          },
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
          tone: {
            sceneId: 'scene.post_ambush_reassurance',
            templateId: 'template.surreal.resilience',
            seedKey: 'complete',
          },
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
              factionRequirement: {
                factionId: 'resistance',
                minimumStanding: 'friendly',
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
    {
      id: 'npc_firebrand_juno',
      npcId: 'Вогняна Джуно',
      nodes: [
        {
          id: 'intro',
          text: 'Джуно розпалює іскри з бочки для олії, окуляри затуманені вологою. "Весь район — це скороварка. Або випустимо пару, або вибухнемо разом із нею."',
          options: [
            {
              text: 'Потрібна допомога в саботажі обладнання КорпБез?',
              nextNodeId: 'sabotage_quest',
              questEffect: {
                questId: 'quest_equipment_sabotage',
                effect: 'start',
              },
            },
            {
              text: 'Їхні камери спостереження тепер металобрухт.',
              nextNodeId: 'sabotage_complete',
              questEffect: {
                questId: 'quest_equipment_sabotage',
                effect: 'complete',
              },
            },
            {
              text: 'Тримай вогонь, Джуно.',
              nextNodeId: null,
            },
          ],
        },
        {
          id: 'sabotage_quest',
          text: '"Камери в Центрі душать наші рухи. Знищ три з них — і я покажу, де ховаються сліпі зони патрулів."',
          options: [
            {
              text: 'Вважай, вони вимкнені.',
              nextNodeId: null,
            },
          ],
        },
        {
          id: 'sabotage_complete',
          text: '"Три камери темні, а Вартові спішно відправляють ремонтні дрони. Це вікно не триватиме довго, тож використай його різко."',
          options: [
            {
              text: 'Хаос — сама собі нагорода, Джуно.',
              nextNodeId: null,
            },
          ],
        },
      ],
    },
    {
      id: 'npc_drone_handler_kesh',
      npcId: 'Оператор дронів Кеш',
      nodes: [
        {
          id: 'intro',
          text: 'Кеш стоїть на колінах біля потрошеного розвідувального дрона, паяльник у руці. "Корпоративний код співає в одній тональності. Зміни хор — зміниш марш."',
          options: [
            {
              text: 'Мені потрібна розвідка про слабкості патрульних дронів.',
              nextNodeId: 'intel_quest',
              questEffect: {
                questId: 'quest_drone_recon',
                effect: 'start',
              },
            },
            {
              text: 'Я відсканував маршрути патруля. Ось дані.',
              nextNodeId: 'intel_complete',
              questEffect: {
                questId: 'quest_drone_recon',
                effect: 'complete',
              },
            },
            {
              text: 'Продовжуй, маестро.',
              nextNodeId: null,
            },
          ],
        },
        {
          id: 'intel_quest',
          text: '"Патрульні дрони слідують маршрутами, як гімнами. Простеж три кола без спрацювання тривог — і я навчу тебе їхніх сліпих зон."',
          options: [
            {
              text: 'Я пройду їхню проповідь.',
              nextNodeId: null,
            },
          ],
        },
        {
          id: 'intel_complete',
          text: '"Ідеальна розвідка. Тепер ми знаємо, коли вони моргають і як довго моляться." Кеш передає зім\'яту схему. "Використай до того, як знову перемішають."',
          options: [
            {
              text: 'Точність понад віру, Кеш.',
              nextNodeId: null,
            },
          ],
        },
      ],
    },
    {
      id: 'npc_medic_yara',
      npcId: 'Медик Яра',
      nodes: [
        {
          id: 'intro',
          text: 'Яра витирає кров із рук ганчіркою, заплямованою поза порятунком. "Клініка працює на парах і надії. Принеси медичні набори, якщо натрапиш."',
          options: [
            {
              text: 'Я відшукаю припаси.',
              nextNodeId: 'medkit_quest',
              questEffect: {
                questId: 'quest_medkit_supplies',
                effect: 'start',
              },
            },
            {
              text: 'Знайшов аптечки для клініки.',
              nextNodeId: 'medkit_complete',
              questEffect: {
                questId: 'quest_medkit_supplies',
                effect: 'complete',
              },
            },
            {
              text: 'Будь пильною, медику.',
              nextNodeId: null,
            },
          ],
        },
        {
          id: 'medkit_quest',
          text: '"Вони розкидають припаси біля патрульних маршрутів, сподіваючись, що ми спрацюємо тривоги, забираючи їх. Доведи, що помиляються."',
          options: [
            {
              text: 'Вважай, це зроблено.',
              nextNodeId: null,
            },
          ],
        },
        {
          id: 'medkit_complete',
          text: '"Це підтримає дихання ще трьох бігунів упродовж тижня. Це перемога в цій конкретній арифметиці."',
          options: [
            {
              text: 'Кожен подих на рахунку, Яро.',
              nextNodeId: null,
            },
          ],
        },
      ],
    },
    {
      id: 'npc_captain_reyna',
      npcId: 'Капітан Рейна',
      nodes: [
        {
          id: 'intro',
          text: 'Рейна підтягує ремінь гвинтівки та сканує обрій. "Транспортний вузол кишить важкими бійцями КорпБез. Очисти їх — і ми зможемо знову переміщувати припаси."',
          options: [
            {
              text: 'Я візьмусь за патруль.',
              nextNodeId: 'combat_quest',
              questEffect: {
                questId: 'quest_combat_patrol',
                effect: 'start',
              },
            },
            {
              text: 'Транспортний вузол очищено.',
              nextNodeId: 'combat_complete',
              questEffect: {
                questId: 'quest_combat_patrol',
                effect: 'complete',
              },
            },
            {
              text: 'Трим позицію, капітане.',
              nextNodeId: null,
            },
          ],
        },
        {
          id: 'combat_quest',
          text: '"Бий їх сильно і швидко. Вони викликають підкріплення, якщо дозволиш співати гімни в комунікатори."',
          options: [
            {
              text: 'Мовчки та хірургічно.',
              nextNodeId: null,
            },
          ],
        },
        {
          id: 'combat_complete',
          text: '"Троє охоронців знищено, жодної тривоги не підняли. Це та арифметика, яка перемагає райони." Вона кидає тобі кредитний жетон. "Напої за мій рахунок, якщо доживемо до святкування."',
          options: [
            {
              text: 'Залиш на переможний раунд, капітане.',
              nextNodeId: null,
            },
          ],
        },
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
    {
      name: 'Юно Вогнеборець',
      position: { x: 32, y: 74 },
      health: 18,
      maxHealth: 18,
      routine: [
        { position: { x: 32, y: 74 }, timeOfDay: 'day', duration: 200 },
        { position: { x: 28, y: 80 }, timeOfDay: 'evening', duration: 200 },
        { position: { x: 36, y: 72 }, timeOfDay: 'night', duration: 200 },
      ],
      dialogueId: 'npc_firebrand_juno',
      isInteractive: true,
    },
    {
      name: 'Сераф-Вартовий',
      position: { x: 84, y: 28 },
      health: 24,
      maxHealth: 24,
      routine: [
        { position: { x: 84, y: 28 }, timeOfDay: 'day', duration: 220 },
        { position: { x: 90, y: 22 }, timeOfDay: 'evening', duration: 220 },
        { position: { x: 76, y: 30 }, timeOfDay: 'night', duration: 220 },
      ],
      dialogueId: 'npc_seraph_warden',
      isInteractive: true,
    },
    {
      name: 'Кеш — дрон-технік',
      position: { x: 54, y: 64 },
      health: 14,
      maxHealth: 14,
      routine: [
        { position: { x: 54, y: 64 }, timeOfDay: 'day', duration: 210 },
        { position: { x: 50, y: 58 }, timeOfDay: 'evening', duration: 210 },
        { position: { x: 60, y: 66 }, timeOfDay: 'night', duration: 210 },
      ],
      dialogueId: 'npc_drone_handler_kesh',
      isInteractive: true,
    },
  ],
  itemBlueprints: [
    corporateKeycardUk,
    encryptedDatapadUk,
    transitTokenUk,
    transitTokenUk,
    transitTokenUk,
    abandonedMedkitUk,
    abandonedMedkitUk,
  ],
  buildingDefinitions: [
    {
      id: 'block_1_1',
      name: 'Набережний комплекс',
      footprint: { from: { x: 4, y: 4 }, to: { x: 23, y: 19 } },
      door: { x: 13, y: 20 },
      interior: { width: 20, height: 12 },
      district: 'downtown',
      signageStyle: 'corp_brass',
      propDensity: 'medium',
      encounterProfile: 'downtown_waterfront',
    },
    {
      id: 'block_1_2',
      name: 'Торговий обмін',
      footprint: { from: { x: 27, y: 4 }, to: { x: 59, y: 19 } },
      door: { x: 43, y: 20 },
      interior: { width: 26, height: 12 },
      district: 'downtown',
      signageStyle: 'corp_holo',
      propDensity: 'high',
      encounterProfile: 'downtown_market_patrol',
      factionRequirement: {
        factionId: 'scavengers',
        minimumStanding: 'friendly',
      },
    },
    {
      id: 'block_1_3',
      name: 'Площа аркологій',
      footprint: { from: { x: 63, y: 4 }, to: { x: 95, y: 19 } },
      door: { x: 79, y: 20 },
      interior: { width: 26, height: 12 },
      district: 'downtown',
      signageStyle: 'corp_holo',
      propDensity: 'medium',
      encounterProfile: 'downtown_public_forum',
    },
    {
      id: 'block_2_1',
      name: 'Емпайр-Стейт-Білдінг',
      footprint: { from: { x: 4, y: 22 }, to: { x: 23, y: 43 } },
      door: { x: 13, y: 44 },
      interior: { width: 18, height: 14 },
      district: 'downtown',
      signageStyle: 'corp_brass',
      propDensity: 'medium',
      encounterProfile: 'downtown_residential',
    },
    {
      id: 'block_2_2',
      name: 'Ринковий вузол',
      footprint: { from: { x: 27, y: 22 }, to: { x: 59, y: 43 } },
      door: { x: 43, y: 44 },
      interior: { width: 26, height: 14 },
      district: 'downtown',
      signageStyle: 'corp_holo',
      propDensity: 'high',
      encounterProfile: 'downtown_market_inner',
      workbench: { type: 'market', feeRequired: 50 },
    },
    {
      id: 'block_2_3',
      name: 'Корпоративна площа',
      footprint: { from: { x: 63, y: 22 }, to: { x: 95, y: 43 } },
      door: { x: 79, y: 44 },
      interior: { width: 26, height: 14 },
      district: 'downtown',
      signageStyle: 'corp_holo',
      propDensity: 'high',
      encounterProfile: 'downtown_exec_patrol',
      factionRequirement: {
        factionId: 'corpsec',
        minimumStanding: 'friendly',
      },
    },
    {
      id: 'block_3_1',
      name: 'Промислові двори',
      footprint: { from: { x: 4, y: 46 }, to: { x: 23, y: 67 } },
      door: { x: 13, y: 68 },
      interior: { width: 18, height: 14 },
      district: 'slums',
      signageStyle: 'slums_scrap',
      propDensity: 'medium',
      encounterProfile: 'slums_industrial_watch',
      factionRequirement: {
        factionId: 'resistance',
        minimumStanding: 'friendly',
      },
      workbench: { type: 'industrial' },
    },
    {
      id: 'block_3_2',
      name: 'Транзитний вузол',
      footprint: { from: { x: 27, y: 46 }, to: { x: 59, y: 67 } },
      door: { x: 43, y: 68 },
      interior: { width: 26, height: 14 },
      district: 'slums',
      signageStyle: 'slums_neon',
      propDensity: 'high',
      encounterProfile: 'slums_transit_crossroads',
      factionRequirement: {
        factionId: 'resistance',
        minimumStanding: 'friendly',
      },
      workbench: { type: 'safehouse' },
    },
    {
      id: 'block_3_3',
      name: 'Науковий сектор',
      footprint: { from: { x: 63, y: 46 }, to: { x: 95, y: 67 } },
      door: { x: 79, y: 68 },
      interior: { width: 26, height: 14 },
      district: 'slums',
      signageStyle: 'slums_neon',
      propDensity: 'medium',
      encounterProfile: 'slums_research_ruin',
    },
  ],
  coverSpots: {
    downtown: [
      {
        position: { x: 13, y: 21 },
        profile: { north: 'full', east: 'half' },
      },
      {
        position: { x: 24, y: 32 },
        profile: { west: 'full', south: 'half' },
      },
      {
        position: { x: 43, y: 21 },
        profile: { north: 'full', west: 'half' },
      },
      {
        position: { x: 61, y: 34 },
        profile: { east: 'full', south: 'half' },
      },
      {
        position: { x: 79, y: 21 },
        profile: { north: 'full' },
      },
      {
        position: { x: 13, y: 45 },
        profile: { north: 'half', south: 'half' },
      },
      {
        position: { x: 43, y: 45 },
        profile: { north: 'half', east: 'half' },
      },
      {
        position: { x: 79, y: 45 },
        profile: { north: 'half', west: 'half' },
      },
    ],
    slums: [
      {
        position: { x: 24, y: 58 },
        profile: { west: 'full', north: 'half' },
      },
      {
        position: { x: 13, y: 69 },
        profile: { south: 'full', west: 'half' },
      },
      {
        position: { x: 43, y: 69 },
        profile: { south: 'full', east: 'half' },
      },
      {
        position: { x: 79, y: 69 },
        profile: { south: 'full', east: 'half' },
      },
    ],
  },
  world: {
    areaName: 'Командна сітка Нетрищ',
    objectives: [
      'Поверніть контрабандний сховок Ліри з центрових камер зберігання доказів.',
      'Розшифруйте наглядові маніфести, які Архіварка Найла винесла потайки.',
      'Відновіть кур\'єрські маршрути Бранта по сітці Нетрищ до початку комендантської години.',
      'Заглушіть мережу камер КорпСеку, що охороняє барикади.',
      'Картуйте петлі патрульних дронів і призначте безпечні обхідні стежки.',
      'Поповніть критичні запаси клініки Медика Яри польовими аптечками.',
      'Влаштуйте засідку на транзитний патруль, що супроводжує капітана зачисток.',
      'Спровокуйте патруль або камеру КорпСеку, відстежте сплеск індикатора підозри й розірвіть лінію огляду, доки жар не згасне.',
    ],
    initialEnemyName: 'Капітан зачисток КорпСеку',
    zoneId: 'downtown_checkpoint',
  },
};
