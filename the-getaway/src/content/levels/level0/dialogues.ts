import { Dialogue } from '../../../game/interfaces/types';

export const level0Dialogues: Dialogue[] = [
  {
    id: 'npc_lira_vendor',
    npcId: 'Lira the Smuggler',
    nodes: [
      {
        id: 'intro',
        text:
          'Lira flicks ash from a smuggled cigarette. "Need gear, intel, or a favour? Silver buys silence, but favours buy survival."',
        options: [
          {
            text: 'Show me what’s moving on the street.',
            nextNodeId: 'trade',
            skillCheck: {
              skill: 'charisma',
              threshold: 6,
            },
          },
          {
            text: 'Any shipments gone missing recently?',
            nextNodeId: 'quest',
            questEffect: {
              questId: 'quest_market_cache',
              effect: 'start',
            },
          },
          {
            text: 'Cache’s back in safe hands.',
            nextNodeId: 'quest_complete',
            questEffect: {
              questId: 'quest_market_cache',
              effect: 'complete',
            },
          },
          {
            text: 'Keep your head low, Lira.',
            nextNodeId: null,
          },
        ],
      },
      {
        id: 'trade',
        text: '"Merch is scarce, but creds talk. Bring me transit tokens and I’ll open the reserve locker."',
        options: [
          {
            text: 'I’ll see what I can find.',
            nextNodeId: null,
          },
        ],
      },
      {
        id: 'quest',
        text: '"Corporate patrol seized my street cache. Slip into Downtown and liberate what’s mine—we both profit."',
        options: [
          {
            text: 'Consider it done.',
            nextNodeId: null,
          },
        ],
      },
      {
        id: 'quest_complete',
        text: '"Didn’t doubt you. I’ll reroute stock through safer alleys."',
        options: [
          {
            text: 'Stay sharp, Lira.',
            nextNodeId: null,
          },
        ],
      },
    ],
  },
  {
    id: 'npc_archivist_naila',
    npcId: 'Archivist Naila',
    nodes: [
      {
        id: 'intro',
        text:
          'Naila adjusts her cracked lenses. "Knowledge is leverage. Help me expose the patrol manifests and I’ll clear your path."',
        options: [
          {
            text: 'What do you need recovered?',
            nextNodeId: 'mission',
            questEffect: {
              questId: 'quest_datapad_truth',
              effect: 'start',
            },
          },
          {
            text: 'The manifests are decoded.',
            nextNodeId: 'mission_complete',
            questEffect: {
              questId: 'quest_datapad_truth',
              effect: 'complete',
            },
          },
          {
            text: 'Maybe later.',
            nextNodeId: null,
          },
        ],
      },
      {
        id: 'mission',
        text: '"Rumours say Lira handles a datapad with the manifests I need. Retrieve it and I’ll map patrol rotations for you."',
        options: [
          {
            text: 'I’ll recover the datapad.',
            nextNodeId: null,
          },
        ],
      },
      {
        id: 'mission_complete',
        text: '"With this, the patrol routes are ours. I’ll upload the safe windows to your ops board."',
        options: [
          {
            text: 'Appreciate the intel, Naila.',
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
        text:
          'Brant adjusts a battered messenger bag. "My runners vanished after curfew. Help me find them and I’ll share my routes."',
        options: [
          {
            text: 'Point me towards their last drop.',
            nextNodeId: 'task',
            questEffect: {
              questId: 'quest_courier_network',
              effect: 'start',
            },
          },
          {
            text: 'Your couriers are accounted for.',
            nextNodeId: 'task_complete',
            questEffect: {
              questId: 'quest_courier_network',
              effect: 'complete',
            },
          },
          {
            text: 'Not my priority right now.',
            nextNodeId: null,
          },
        ],
      },
      {
        id: 'task',
        text: '"They were logging tram tokens near the transit hub. Check the plazas and bring back whatever they cached."',
        options: [
          {
            text: 'Stay mobile, Brant.',
            nextNodeId: null,
          },
        ],
      },
      {
        id: 'task_complete',
        text: '"You pulled them out of the fire. These routes will keep you ahead of patrol sweepers."',
        options: [
          {
            text: 'Keep the network breathing.',
            nextNodeId: null,
          },
        ],
      },
    ],
  },
];
