import { StoryletLocaleStrings } from './types';

export const storyletStringsEn: StoryletLocaleStrings = {
  roles: {
    protagonist: 'Operative',
    mentor: 'Mentor',
    witness: 'Witness',
    confidant: 'Confidant',
    rival: 'Rival',
  },
  plays: {
    firelight_ambush: {
      title: 'Firelight Ambush',
      synopsis:
        'After the crates are reclaimed, the cell huddles around a burn barrel to measure the cost of provoking CorpSec patrols.',
      roles: {
        protagonist: 'Operative',
        mentor: 'Quartermaster',
        witness: 'Runner',
      },
      outcomes: {
        scarred_victory: {
          base: {
            narrative:
              '{mentor} studies the bandaged gouge across {protagonist}’s ribs. “You took the hit so the crates could run. That balance clears.”',
            logLine: 'Lira marks your scars as the price of keeping the supply line alive.',
          },
          variants: {
            wounded: {
              narrative:
                '{mentor} catches {protagonist} before they slide to the bricks. She seals the fresh wound, the firelight flickering across the stimulant foam. “Next patrol never makes it to the siren,” she vows, voice steady for {witness}’s sake.',
              logLine: 'Lira steadies you, promising the next patrol will never raise an alarm.',
            },
          },
        },
        clean_sweep: {
          base: {
            narrative:
              'The burn barrel sends sparks up past the transit rails. {protagonist} tips confiscated batons into the fire while {mentor} and {witness} sketch new blind spots across a soot-streaked map.',
            logLine: 'The cell celebrates the clean strike and notebooks fill with new patrol gaps.',
          },
        },
      },
    },
    neon_bivouac: {
      title: 'Neon Bivouac',
      synopsis:
        'The crew slumps beneath a humming holo-ad, sharing contraband rations while the grid cools. Stories trade faster than the battered thermos.',
      roles: {
        protagonist: 'Operative',
        confidant: 'Confidant',
      },
      outcomes: {
        bond_renewed: {
          base: {
            narrative:
              '{confidant} nudges a tin mug into {protagonist}’s hands. “Remember the rooftops in District Eight?” The laugh that follows is low and unguarded, the neon glow framing two conspirators instead of soldiers.',
            logLine: '{confidant} shares an old war story and the bivouac feels like home again.',
          },
          variants: {
            bonded: {
              narrative:
                '{confidant} leans shoulder to shoulder with {protagonist}, the steam from the thermos curling between matching scars. “When we ran the Gridfall evac we swore never to sleep alone on watch again. Still true.”',
              logLine: '{confidant} reaffirms the pact forged during Gridfall and your bond deepens.',
            },
          },
        },
        quiet_distance: {
          base: {
            narrative:
              'The neon hum fills the silence between {protagonist} and {confidant}. They trade reports instead of memories, each syllable an inventory count that never strays into feeling.',
            logLine: 'Camp chatter stays clipped—nerves too raw for stories tonight.',
          },
        },
      },
    },
    serrated_omen: {
      title: 'Serrated Omen',
      synopsis:
        'A CorpSec counter-sweep slams into the team on their way back through the alleys. The clash leaves a metallic stink and unanswered questions.',
      roles: {
        protagonist: 'Operative',
        rival: 'Adversary',
        witness: 'Witness',
      },
      outcomes: {
        rivalry_ignites: {
          base: {
            narrative:
              '{rival}’s monofilament blade sparks off the barricade, carving a groove through {protagonist}’s armor. “I told you the curfew rites were mine to enforce,” she hisses, visor fractured yet unyielding.',
            logLine: 'Seraph Warden carves a warning across your armor and vows the next hunt will finish it.',
          },
          variants: {
            rival: {
              narrative:
                '{rival} vents ozone from her pauldrons, the mask reflecting {protagonist}’s blood. “You survived my ambush twice. Next time I bring witnesses.” {witness} pulls you back before the second strike lands.',
              logLine: 'Seraph Warden leaves you bleeding but breathing—her promise of a final duel hangs heavy.',
            },
          },
        },
        shadows_scatter: {
          base: {
            narrative:
              'Sirens bloom and the alleys dissolve into darkness. {protagonist} fires blind, smoke swallowing {rival} while {witness} drags the wounded out before drones arrive.',
            logLine: 'You slip the net, but CorpSec frequencies crackle with renewed suspicion.',
          },
        },
      },
    },
  },
  logs: {
    'storylets.firelight_ambush.log.wounded':
      'Lira steadies you, promising the next patrol will never raise an alarm.',
    'storylets.firelight_ambush.log.clean':
      'The cell celebrates the clean strike and notebooks fill with new patrol gaps.',
    'storylets.neon_bivouac.log.bonded':
      'Sharing Gridfall memories, your confidant reminds you why the fire still burns.',
    'storylets.neon_bivouac.log.distance': 'Camp chatter stays clipped—nerves too raw for stories tonight.',
    'storylets.serrated_omen.log.rival':
      'Seraph Warden leaves you bleeding but breathing—her promise of a final duel hangs heavy.',
    'storylets.serrated_omen.log.default':
      'You lose her in the smoke, but CorpSec channels crackle with orders to tighten the cordon.',
  },
};
