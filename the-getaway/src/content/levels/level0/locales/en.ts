import { Level0LocaleContent } from '../types';
import { getItemPrototype } from '../../../items';

export const level0EnglishContent: Level0LocaleContent = {
  dialogues: [
    {
      id: 'npc_lira_vendor',
      npcId: 'Lira the Smuggler',
      nodes: [
        {
          id: 'intro',
          text: 'Lira taps ash into a ration tin shaped like a coyote. "Need gear, gossip, or a miracle? Silver buys silence. Favours keep you breathing past curfew."',
          options: [
            {
              text: 'What’s humming through the market tonight?',
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
              text: 'Any shipments vanish like the coyotes Harbour Control promised us?',
              nextNodeId: 'quest',
              questEffect: {
                questId: 'quest_market_cache',
                effect: 'start',
              },
            },
            {
              text: 'Cache is back in rebel hands.',
              nextNodeId: 'quest_complete',
              questEffect: {
                questId: 'quest_market_cache',
                effect: 'complete',
              },
            },
            {
              text: 'Keep that halo crooked, Lira.',
              nextNodeId: null,
            },
          ],
        },
        {
          id: 'trade',
          text: '"Inventory is thinner than curfew soup. Bring transit tokens and I’ll pop the reserve locker before the drones finish their hymn."',
          options: [
            {
              text: 'I’ll rattle a few turnstiles.',
              nextNodeId: null,
            },
          ],
        },
        {
          id: 'quest',
          text: '"CorpSec bagged my street cache and called it evidence. Slip into Downtown, liberate the crates, and we’ll toast with reclaimed rainwater."',
          options: [
            {
              text: 'Consider their evidence misplaced.',
              nextNodeId: null,
            },
          ],
        },
        {
          id: 'quest_complete',
          text: '"Knew you’d outrun their choirboys. I’m rerouting stock through alleys where the neon farms still glow."',
          options: [
            {
              text: 'Stay unscannable, Lira.',
              nextNodeId: null,
            },
          ],
        },
      ],
    },
    {
      id: 'npc_archivist_naila',
      npcId: 'Archivist Naila',
      toneDefaults: {
        personaId: 'persona.amara_velez',
        authorId: 'author.vonnegut_brautigan_core',
        sceneId: 'scene.post_ambush_reassurance',
        seedKey: 'naila',
      },
      nodes: [
        {
          id: 'intro',
          text: 'Naila polishes cracked lenses that reflect three different skies. "Knowledge is leverage. Help me unmask their manifests and I’ll carve you breathing space."',
          tone: {
            sceneId: 'scene.share_scarce_food',
            templateId: 'template.deadpan.reassure',
            seedKey: 'intro',
          },
          options: [
            {
              text: 'What relic are we lifting today?',
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
              text: 'The manifests are singing on my rig.',
              nextNodeId: 'mission_complete',
              questEffect: {
                questId: 'quest_datapad_truth',
                effect: 'complete',
              },
            },
            {
              text: 'Rain check, Archivist.',
              nextNodeId: null,
            },
          ],
        },
        {
          id: 'mission',
          text: '"Lira’s guarding a datapad fat with patrol math. Bring it home and I’ll paint their rotations like constellations."',
          tone: {
            sceneId: 'scene.pre_heist_briefing',
            templateId: 'template.urgent.push',
            seedKey: 'mission',
          },
          options: [
            {
              text: 'I’ll fetch the glowing brick.',
              nextNodeId: null,
            },
          ],
        },
        {
          id: 'mission_complete',
          text: '"This cracks them wide open. Uploading safe windows to your ops board before Harrow’s speechwriters invent new lies."',
          tone: {
            sceneId: 'scene.post_ambush_reassurance',
            templateId: 'template.surreal.resilience',
            seedKey: 'complete',
          },
          options: [
            {
              text: 'Appreciate the starlight, Naila.',
              nextNodeId: null,
            },
          ],
        },
      ],
    },
    {
      id: 'npc_courier_brant',
      npcId: 'Courier Brant',
      nodes: [
        {
          id: 'intro',
          text: 'Brant pats a battered messenger bag like it might bark. "My runners vanished after curfew. Help me find them and I’ll open my routes like a choose-your-own-adventure."',
          options: [
            {
              text: 'Point me toward their last breadcrumb.',
              nextNodeId: 'task',
              questEffect: {
                questId: 'quest_courier_network',
                effect: 'start',
              },
              factionRequirement: {
                factionId: 'resistance',
                minimumStanding: 'neutral',
              },
            },
            {
              text: 'Your couriers beat the curfew this time.',
              nextNodeId: 'task_complete',
              questEffect: {
                questId: 'quest_courier_network',
                effect: 'complete',
              },
            },
            {
              text: 'Different fire to put out tonight.',
              nextNodeId: null,
            },
          ],
        },
        {
          id: 'task',
          text: '"They were logging tram tokens near the hub, humming old Metro jingles. Sweep the plazas, grab whatever they stashed."',
          options: [
            {
              text: 'Stay restless, Brant.',
              nextNodeId: null,
            },
          ],
        },
        {
          id: 'task_complete',
          text: '"You dragged them out of the drone choir. These routes will keep you two minutes ahead of the sweepers."',
          options: [
            {
              text: 'Keep the network breathing raggedly.',
              nextNodeId: null,
            },
          ],
        },
      ],
    },
    {
      id: 'npc_firebrand_juno',
      npcId: 'Firebrand Juno',
      nodes: [
        {
          id: 'intro',
          text: 'Juno coaxes sparks from an oil drum brazier, goggles fogged with humidity. "Whole district’s a pressure cooker. Either we vent it or we blow with it."',
          options: [
            {
              text: 'Show me how you are holding the barricades.',
              nextNodeId: 'defense',
            },
            {
              text: 'I can spare supplies if you aim them right.',
              nextNodeId: 'supplies',
              skillCheck: {
                skill: 'charisma',
                threshold: 7,
              },
              factionRequirement: {
                factionId: 'resistance',
                minimumStanding: 'friendly',
              },
            },
            {
              text: 'Need help sabotaging CorpSec equipment?',
              nextNodeId: 'sabotage_quest',
              questEffect: {
                questId: 'quest_equipment_sabotage',
                effect: 'start',
              },
            },
            {
              text: 'Their surveillance cameras are scrap metal now.',
              nextNodeId: 'sabotage_complete',
              questEffect: {
                questId: 'quest_equipment_sabotage',
                effect: 'complete',
              },
            },
            {
              text: 'Keep the coals hot, Juno.',
              nextNodeId: null,
            },
          ],
        },
        {
          id: 'defense',
          text: '"Slums grids funnel patrols into three kill boxes." She sketches alley routes in ash. "You jam drones on the Transit Node roof, and I’ll spring the ambushers."',
          options: [
            {
              text: 'Mark the jammer sweet spots for me.',
              nextNodeId: null,
            },
          ],
        },
        {
          id: 'supplies',
          text: '"A brave tongue. I will trade your goodwill for explosive gel and field dressings." Her grin flashes neon. "We keep the gel; the medics get the rest."',
          options: [
            {
              text: 'Deal. Keep the rebels mended.',
              nextNodeId: null,
            },
          ],
        },
        {
          id: 'sabotage_quest',
          text: '"Downtown cameras are choking our movements. Blast three of them and I will show you where the patrol blind spots hide."',
          options: [
            {
              text: 'Consider them disabled.',
              nextNodeId: null,
            },
          ],
        },
        {
          id: 'sabotage_complete',
          text: '"Three cameras dark, and the Wardens are scrambling their repair drones. This window will not last, so use it sharp."',
          options: [
            {
              text: 'Chaos is its own reward, Juno.',
              nextNodeId: null,
            },
          ],
        },
      ],
    },
    {
      id: 'npc_seraph_warden',
      npcId: 'Seraph Warden',
      nodes: [
        {
          id: 'intro',
          text: 'Seraph’s chrome mask reflects the holo-billboards overhead. "Downtown is a cathedral of compliance. You breathe here because I allow it."',
          options: [
            {
              text: 'Cathedrals fall when the choir walks.',
              nextNodeId: 'warning',
            },
            {
              text: 'Your drones are glitching near the Aerostat Docks.',
              nextNodeId: 'maintenance',
              skillCheck: {
                skill: 'intelligence',
                threshold: 8,
              },
            },
            {
              text: 'Just passing through.',
              nextNodeId: null,
            },
          ],
        },
        {
          id: 'warning',
          text: '"Rebellion is an unpaid invoice." The warden’s hand drifts toward a stun baton. "Settle it before audit night or the balance compounds."',
          options: [
            {
              text: 'Invoice accepted. Collection denied.',
              nextNodeId: null,
            },
          ],
        },
        {
          id: 'maintenance',
          text: '"That anomaly is classified." The warden’s visor flickers. "Still, containment trumps ego. Mark the fault and I’ll schedule a recalibration."',
          options: [
            {
              text: 'Send fewer drones and they might last longer.',
              nextNodeId: null,
            },
          ],
        },
      ],
    },
    {
      id: 'npc_drone_handler_kesh',
      npcId: 'Drone Handler Kesh',
      nodes: [
        {
          id: 'intro',
          text: 'Kesh kneels beside a gutted recon drone, soldering iron in hand. "Corp code sings in one key. Change the chorus, change the march."',
          options: [
            {
              text: 'Could you spoof a patrol to guard my people instead?',
              nextNodeId: 'spoof',
            },
            {
              text: 'Sell me a jammer that will not fry my rig.',
              nextNodeId: 'jammer',
            },
            {
              text: 'I need intel on patrol drone weaknesses.',
              nextNodeId: 'intel_quest',
              questEffect: {
                questId: 'quest_drone_recon',
                effect: 'start',
              },
            },
            {
              text: 'I scanned the patrol routes. Here is the data.',
              nextNodeId: 'intel_complete',
              questEffect: {
                questId: 'quest_drone_recon',
                effect: 'complete',
              },
            },
            {
              text: 'Carry on, maestro.',
              nextNodeId: null,
            },
          ],
        },
        {
          id: 'spoof',
          text: '"Feed me their route ledger and I’ll flip a drone’s friend-or-foe." Kesh snaps a cartridge into the chassis. "One night only before they patch."',
          options: [
            {
              text: 'I’ll bring you patrol telemetry.',
              nextNodeId: null,
            },
          ],
        },
        {
          id: 'jammer',
          text: '"You want finesse, you pay finesse." She slides a wafer-thin disk across the workbench. "Stick it under a skybridge strut for maximum bleed."',
          options: [
            {
              text: 'Consider it purchased.',
              nextNodeId: null,
            },
          ],
        },
        {
          id: 'intel_quest',
          text: '"Patrol drones follow routes like hymns. Shadow three circuits without tripping alarms, and I will teach you their blind spots."',
          options: [
            {
              text: 'I will walk their sermon.',
              nextNodeId: null,
            },
          ],
        },
        {
          id: 'intel_complete',
          text: '"Perfect reconnaissance. Now we know when they blink and how long they pray." Kesh hands you a crumpled schematic. "Use it before they re-randomize."',
          options: [
            {
              text: 'Precision over faith, Kesh.',
              nextNodeId: null,
            },
          ],
        },
      ],
    },
    {
      id: 'npc_medic_yara',
      npcId: 'Medic Yara',
      nodes: [
        {
          id: 'intro',
          text: 'Yara wipes blood from her hands with a rag stained beyond salvage. "Clinic is running on fumes and hope. Bring me medkits if you stumble across any."',
          options: [
            {
              text: 'I will scout for supplies.',
              nextNodeId: 'medkit_quest',
              questEffect: {
                questId: 'quest_medkit_supplies',
                effect: 'start',
              },
            },
            {
              text: 'Found medkits for the clinic.',
              nextNodeId: 'medkit_complete',
              questEffect: {
                questId: 'quest_medkit_supplies',
                effect: 'complete',
              },
            },
            {
              text: 'Stay sharp, Medic.',
              nextNodeId: null,
            },
          ],
        },
        {
          id: 'medkit_quest',
          text: '"They scatter supplies near patrol routes hoping we will trip alarms retrieving them. Prove them wrong."',
          options: [
            {
              text: 'Consider it done.',
              nextNodeId: null,
            },
          ],
        },
        {
          id: 'medkit_complete',
          text: '"These will keep three more runners breathing through the week. That is a victory in this particular arithmetic."',
          options: [
            {
              text: 'Every breath counts, Yara.',
              nextNodeId: null,
            },
          ],
        },
      ],
    },
    {
      id: 'npc_captain_reyna',
      npcId: 'Captain Reyna',
      nodes: [
        {
          id: 'intro',
          text: 'Reyna adjusts her rifle strap and scans the skyline. "Transit hub is crawling with CorpSec heavies. Clear them out and we can move supplies again."',
          options: [
            {
              text: 'I will handle the patrol.',
              nextNodeId: 'combat_quest',
              questEffect: {
                questId: 'quest_combat_patrol',
                effect: 'start',
              },
            },
            {
              text: 'The transit hub is clear.',
              nextNodeId: 'combat_complete',
              questEffect: {
                questId: 'quest_combat_patrol',
                effect: 'complete',
              },
            },
            {
              text: 'Hold position, Captain.',
              nextNodeId: null,
            },
          ],
        },
        {
          id: 'combat_quest',
          text: '"Hit them hard and fast. They call reinforcements if you let them sing their hymns into comms."',
          options: [
            {
              text: 'Silent and surgical.',
              nextNodeId: null,
            },
          ],
        },
        {
          id: 'combat_complete',
          text: '"Three guards down, zero alarms raised. That is the kind of arithmetic that wins districts." She tosses you a credit chit. "Drinks are on me if we live to celebrate."',
          options: [
            {
              text: 'Save it for the victory round, Captain.',
              nextNodeId: null,
            },
          ],
        },
      ],
    },
  ],
  npcBlueprints: [
    {
      name: 'Lira the Smuggler',
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
      name: 'Orn Patrol Sentry',
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
      name: 'Archivist Naila',
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
      name: 'Courier Brant',
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
      name: 'Firebrand Juno',
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
      name: 'Seraph Warden',
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
      name: 'Drone Handler Kesh',
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
    {
      name: 'Medic Yara',
      position: { x: 18, y: 32 },
      health: 15,
      maxHealth: 15,
      routine: [
        { position: { x: 18, y: 32 }, timeOfDay: 'day', duration: 240 },
        { position: { x: 16, y: 28 }, timeOfDay: 'evening', duration: 240 },
        { position: { x: 20, y: 34 }, timeOfDay: 'night', duration: 240 },
      ],
      dialogueId: 'npc_medic_yara',
      isInteractive: true,
    },
    {
      name: 'Captain Reyna',
      position: { x: 42, y: 52 },
      health: 22,
      maxHealth: 22,
      routine: [
        { position: { x: 42, y: 52 }, timeOfDay: 'day', duration: 220 },
        { position: { x: 38, y: 48 }, timeOfDay: 'evening', duration: 220 },
        { position: { x: 46, y: 56 }, timeOfDay: 'night', duration: 220 },
      ],
      dialogueId: 'npc_captain_reyna',
      isInteractive: true,
    },
  ],
  itemBlueprints: [
    getItemPrototype('misc_corporate_keycard'),
    getItemPrototype('misc_encrypted_datapad'),
    getItemPrototype('misc_transit_tokens'),
    getItemPrototype('misc_transit_tokens'),
    getItemPrototype('misc_transit_tokens'),
    getItemPrototype('misc_abandoned_medkit'),
    getItemPrototype('misc_abandoned_medkit'),
  ],
  buildingDefinitions: [
    {
      id: 'block_1_1',
      name: 'Waterfront Commons',
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
      name: 'Mercantile Exchange',
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
      name: 'Arcology Plaza',
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
      name: 'Residency Row',
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
      name: 'Market Hub',
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
      name: 'Corporate Plaza',
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
      name: 'Industrial Yards',
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
      name: 'Transit Node',
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
      name: 'Research Quadrant',
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
    areaName: 'Slums Command Grid',
    objectives: [
      'Recover Lira\'s contraband cache from the downtown evidence lockers.',
      'Decrypt the surveillance manifests Archivist Naila smuggled out.',
      'Re-establish Brant\'s courier drop routes across the grid before curfew.',
      'Black out the CorpSec camera grid guarding the barricades.',
      'Map patrol drone loops and assign safe counter-routes.',
      'Restock Medic Yara\'s rebel clinic with field medkits.',
      'Ambush the transit patrol escorting the sweep captain.',
      'Bait a CorpSec patrol or camera, watch the Suspicion Inspector spike, then break line-of-sight until the heat cools.',
    ],
    initialEnemyName: 'CorpSec Sweep Captain',
    zoneId: 'downtown_checkpoint',
  },
};
