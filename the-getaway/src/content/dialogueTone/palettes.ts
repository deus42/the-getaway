import { TonePalette } from '../../game/narrative/dialogueTone/toneTypes';

export const TONE_PALETTES: TonePalette[] = [
  {
    id: 'palette.opener.deadpan',
    slotId: 'opener',
    defaultText: 'Streetlight holds.',
    entries: [
      {
        id: 'opener.streetlight',
        text: 'Streetlight holds.',
        weight: 1,
        traitInfluence: { steadiness: 0.4, warmth: 0.2 },
        motifId: 'motif.streetlight',
      },
      {
        id: 'opener.ashtray',
        text: 'Ashtray smoke braids the curfew alarm.',
        weight: 0.8,
        traitInfluence: { melancholy: 0.3, surrealism: 0.4 },
        motifId: 'motif.rain_hum',
      },
      {
        id: 'opener.static',
        text: 'Static licks the PA like a bored coyote.',
        weight: 0.9,
        traitInfluence: { wit: 0.3, sarcasm: 0.35 },
      },
    ],
  },
  {
    id: 'palette.comfort.solidarity',
    slotId: 'comfort',
    defaultText: 'We bend so we do not break.',
    entries: [
      {
        id: 'comfort.breathe',
        text: 'Breathe; the city hums but our pulse sets tempo.',
        weight: 1,
        traitInfluence: { warmth: 0.35, steadiness: 0.35 },
      },
      {
        id: 'comfort.hum',
        text: 'We hum louder than their drones tonight.',
        weight: 0.9,
        traitInfluence: { wit: 0.25, urgency: 0.2 },
        motifId: 'motif.rain_hum',
      },
      {
        id: 'comfort.coffee',
        text: 'Ration coffee still tastes like defiance.',
        weight: 0.8,
        traitInfluence: { wit: 0.3, warmth: 0.3 },
      },
    ],
  },
  {
    id: 'palette.promise.grit',
    slotId: 'promise',
    defaultText: 'We bank this and push the next door.',
    entries: [
      {
        id: 'promise.grid',
        text: 'Map updates in our favour; we move before dawn.',
        weight: 1,
        traitInfluence: { urgency: 0.35, steadiness: 0.4 },
        motifId: 'motif.compass',
      },
      {
        id: 'promise.neon',
        text: 'Neon farms glow for us tonight if we choose.',
        weight: 0.85,
        traitInfluence: { surrealism: 0.4, warmth: 0.25 },
      },
      {
        id: 'promise.ledger',
        text: 'Ledger tilts our way; we cash it in soon.',
        weight: 0.9,
        traitInfluence: { wit: 0.2, melancholy: 0.2 },
      },
    ],
  },
  {
    id: 'palette.urgent.intro',
    slotId: 'urgent_intro',
    defaultText: 'Sirens kick a four count.',
    entries: [
      {
        id: 'urgent.metro',
        text: 'Metro lights stutter; sweepers reroute.',
        weight: 1,
        traitInfluence: { urgency: 0.45, surrealism: 0.25 },
        motifId: 'motif.glowsticks',
      },
      {
        id: 'urgent.chopper',
        text: 'Chopper rotors chew the humidity early.',
        weight: 0.9,
        traitInfluence: { urgency: 0.4, sarcasm: 0.3 },
      },
      {
        id: 'urgent.clocks',
        text: 'Every stolen clock ticks loud right now.',
        weight: 0.85,
        traitInfluence: { melancholy: 0.25, wit: 0.3 },
      },
    ],
  },
  {
    id: 'palette.directive.push',
    slotId: 'directive',
    defaultText: 'Push past the surveillance bloom.',
    entries: [
      {
        id: 'directive.sprint',
        text: 'Sprint the blackout seam before it seals.',
        weight: 1,
        traitInfluence: { urgency: 0.5, wit: 0.2 },
      },
      {
        id: 'directive.slide',
        text: 'Slide between floodlights like you rehearsed it.',
        weight: 0.9,
        traitInfluence: { steadiness: 0.2, wit: 0.35 },
        motifId: 'motif.glowsticks',
      },
      {
        id: 'directive.smile',
        text: 'Smile like the scanners owe you rent.',
        weight: 0.75,
        traitInfluence: { sarcasm: 0.45 },
      },
    ],
  },
  {
    id: 'palette.surreal.image',
    slotId: 'surreal_image',
    defaultText: 'Drones drift like bored gulls.',
    entries: [
      {
        id: 'surreal.malls',
        text: 'Flooded malls grow neon algae halos.',
        weight: 1,
        traitInfluence: { surrealism: 0.55, melancholy: 0.25 },
        motifId: 'motif.rain_hum',
      },
      {
        id: 'surreal.balloons',
        text: 'Propaganda balloons sag like tired saints.',
        weight: 0.9,
        traitInfluence: { sarcasm: 0.3, wit: 0.25 },
      },
      {
        id: 'surreal.kites',
        text: 'Kids fly hacked drones like paper kites.',
        weight: 0.85,
        traitInfluence: { warmth: 0.3, wit: 0.3 },
      },
    ],
  },
  {
    id: 'palette.resolution.resilience',
    slotId: 'resolution',
    defaultText: 'We walk out together and louder.',
    entries: [
      {
        id: 'resolution.compass',
        text: 'Compass north re-centers on us tonight.',
        weight: 1,
        traitInfluence: { steadiness: 0.45, warmth: 0.3 },
        motifId: 'motif.compass',
      },
      {
        id: 'resolution.lunch',
        text: 'Save me a ration bar; we earned dessert.',
        weight: 0.8,
        traitInfluence: { wit: 0.35, warmth: 0.25 },
      },
      {
        id: 'resolution.rain',
        text: 'Let the rain mask our getaway beats.',
        weight: 0.85,
        traitInfluence: { melancholy: 0.3, surrealism: 0.3 },
        motifId: 'motif.rain_hum',
      },
    ],
  },
];
