---
status: MVP
type: spine
---

# MVP Spine

## Product thesis

The Getaway turns modern institutional anxieties—identity scoring, pervasive cameras, automated verification, curated social narratives, compromised devices, and shrinking private space—into a grounded role-playing escape game.

The player succeeds by interpreting systems and people rather than overpowering them. The experience should feel tense, observed, intimate, and contemporary. Technology is credible infrastructure with ownership and limits, not magic.

## Level 0 pillars

### Surveillance

The Hidzu network is visible, systemic, and fallible. Cameras and the verifier drone share truthful geometry and last-known information. They can become concerned, search evidence, and lose the protagonist. They never read the true player position through solid geometry.

### Paranoia

Paranoia is an honest 0–100 resource caused by surveillance exposure, pursuit, injury, dangerous escape, capture outcomes, and authored shocks. It penalizes deterministic checks at visible thresholds and becomes fatal at 100. It never creates false UI, hallucinations, or fake objectives.

### Dialogue and facts

Dialogue changes knowledge and practical possibilities. Lira, Naila, and Brant author different parts of the operation. Facts have names and provenance; they reveal routes, clarify objectives, change checks, inform George, and alter the debrief. There is no generic trust currency.

### Escape

Movement, observation, hiding, blending, timing, and evasion are the primary tension verbs. A caught protagonist receives one short deterministic confrontation with social, composure, evasion, or physical options when supported. There is no Level 0 combat mode.

### George

George is the protagonist's private AI companion. He appears as a fourth HUD lane and a near-character AR avatar, summarizes verified state, explains blocked actions, compares known risk, and surfaces authored contextual questions. He cannot act for the player or reveal undiscovered information.

### RPG identity

The player chooses a callsign, appearance, four attributes, and eight skills. Deterministic checks, explicit facts, authored XP, safehouse level-ups, Health, Paranoia, and long-term consequence summaries create a small but real RPG foundation.

### City

Level 0 is one continuous outdoor Tokyo district with three interlocking traversal loops, recognizable public and service spaces, credible surveillance coverage, discrete hiding and blending contexts, and a two-to-three-minute outer loop. Architecture forms streets rather than sitting as isolated objects.

## Complete Level 0 loop

1. **Create.** Choose callsign, one of four appearances, four attribute points, and six skill points.
2. **Wake exposed.** Begin inside the safehouse boundary at 18:30. George gives only immediate context and controls.
3. **Meet Lira.** Learn that Hidzu seized medical supplies, the cache is in a logistics site, passage toward Miami is the payment, and midnight is the deadline.
4. **Prepare or proceed.** Consult Naila, Brant, both, or neither. Preparation yields specific facts, not buffs.
5. **Choose timing through play.** Infiltrate before 22:00 through public delivery activity or wait for curfew and use the service alley.
6. **Read the network.** Observe known cameras, public behavior, entrances, hiding/blending contexts, and the verifier drone. Use George and the dossier only within known information.
7. **Recover the medkits.** Explicitly operate the cache-locker terminal and take the mission object.
8. **Investigate optionally.** Recognize the Hidzu–Harrow shipping manifest through Naila's fact or an authored Awareness check. Missing it never blocks completion.
9. **Escape honestly.** Resolve Suspicious or Pursuit through line-of-sight break, direction change, hiding, blending, or an authored confrontation—not an invisible exit trigger.
10. **Return to Lira.** Explicitly hand over the medkits. Lira reads the actual outcome ledger.
11. **Validate passage.** Use the outbound terminal at the safehouse before midnight.
12. **Recover and progress.** Rest, review the dossier, consult George, allocate any earned level-up, and receive the factual debrief.
13. **Close.** Choose `Continue Exploring` or `End Demo`. Do not load Miami until Level 1 exists.

## First-run pacing target

The following segment bands are the explicit reversible trial baseline for `OPEN-TIME-001`, not Approved tuning. Segment maxima do not stack; the Approved governing target remains a 15–20 minute complete first run with the first meaningful decision inside three minutes.

| Segment | Target wall-clock time | Simulation ownership |
|---|---:|---|
| Character creation | 1–2 min | Paused |
| Safehouse and Lira | 2–3 min | Paused during dialogue |
| Optional preparation | 0–4 min | Mixed |
| Infiltration and recovery | 6–8 min | Running except observation/terminal UI |
| Escape and return | 3–4 min | Mixed |
| Validation and debrief | 2–3 min | Paused |

The 18:30–00:00 world window equals eleven minutes of unpaused simulation at 30×. Dialogue, menus, character, dossier, observation, terminals, debrief, and failure pause the simulation, allowing the complete experience to land at 15–20 wall-clock minutes without lying about the deadline. Exact route timings remain a provisional tuning and final pacing-acceptance item in [[14 Specification Review Queue]].

## Campaign continuity

Level 0 establishes that Hidzu supplies identity, logistics, and surveillance infrastructure to Harrow's Operation Cold Iron. The optional manifest determines how much the protagonist and future Miami contact know at handoff. The protagonist's missing father remains the personal connection to Cold Iron. Miami is the first playable campaign destination after the prologue.

## Definition of the MVP

MVP means this loop is complete, readable, emotionally coherent, and replayable through ordinary controls. It does not mean every existing subsystem is surfaced. A system that does not serve this loop is removed from Level 0 or postponed.

## Permanent Level 0 boundaries

- No fantasy or supernatural mechanics.
- No tactical or automatic combat loop.
- No hidden safest-route planner.
- No automatic pickups or proximity completion.
- No free-text AI chat.
- No procedural dialogue, quests, or storylets.
- No reputation, karma, relationship, or trust meters.
- No deep inventory, equipment, economy, crafting, or survival UI.
- No decorative clutter added only to fill space.
- No placeholder Level 1 transition.
- No acceptance based only on tests, fixtures, debug bridges, or generated screenshots.
