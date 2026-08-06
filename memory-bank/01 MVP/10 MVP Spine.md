---
status: MVP
type: spine
---

# MVP Spine

## Product thesis

The Getaway turns modern institutional anxieties—identity scoring, pervasive cameras, automated verification, curated social narratives, compromised devices, and shrinking private space—into a grounded role-playing escape game.

The player succeeds by interpreting systems and people rather than overpowering them. The experience should feel tense, observed, intimate, and contemporary. Technology is credible infrastructure with ownership and limits, not magic.

## Product promise

Build a personal expatriate who needs passage toward Miami to investigate their missing father and Operation Cold Iron. Begin as an ordinary person Hidzu Corporation does not consider a problem, recover medicine for Lira, become legible only through observed rule-breaking, escape the resulting evidence-driven response, and validate passage before midnight. Every useful advantage must come from the player's build, a fact with provenance, readable world state, or deliberate physical action.

The first three minutes establish identity, exposure, George, Lira, the humanitarian objective, the two timing possibilities, and the deadline. The middle of the slice turns knowledge into route choice and surveillance pressure. The final minutes convert the player's actual conduct into return, validation, debrief, recovery, and persistent RPG progression.

The intended audience is a player who enjoys authored RPG consequence and systemic stealth but does not want a combat power fantasy, opaque immersive-sim puzzle logic, or a sprawling sandbox before the central experience is coherent.

## Level 0 pillars

### Surveillance

The Hidzu Corporation network is visible, systemic, and fallible. Ordinary public camera visibility is harmless. Concern requires shared visibility plus an observed restricted-area breach, protected interaction, medkit removal, failed verification, or detected feed change. Cameras and Needle share truthful geometry and last-known information, lose recognition after full recovery to `Clear`, and never read the true player position through solid geometry. Blind spots are ordinary occlusion, never authored off-grid zones.

### Paranoia

Paranoia is an honest 0–100 resource caused by rule-break-linked surveillance exposure, pursuit, authored physical consequences, dangerous escape, capture outcomes, and authored shocks. It penalizes deterministic checks at visible thresholds and becomes fatal at 100. Two one-use city grounding actions trade ten world minutes for ten relief, and the first qualifying difficult escape can remove five. It never creates false UI, hallucinations, or fake objectives.

### Dialogue and facts

Dialogue changes knowledge and practical possibilities. Lira, Naila, and Brant author different parts of the operation. Facts have names and provenance; they reveal routes, clarify objectives, change checks, inform George, and alter the debrief. There is no generic trust currency.

### Escape

Movement, observation, hiding, blending, timing, and evasion are the primary tension verbs. A caught protagonist receives one short deterministic confrontation with social, composure, evasion, or physical options when supported. There is no Level 0 combat mode.

### George

George is the protagonist's private AI companion. He appears as a fourth HUD lane and a near-character AR avatar, summarizes verified state, explains blocked actions and missing information, compares known risk, and surfaces authored contextual questions. Silence is never hidden information; Level 0 adds no deletion/freedom desire arc. He cannot act for the player or reveal undiscovered information.

### RPG identity

The player chooses a callsign, appearance, four attributes, and eight skills. Deterministic checks, explicit facts, authored XP, safehouse level-ups, Health, Paranoia, and long-term consequence summaries create a small but real RPG foundation.

### City

Level 0 is exactly four dense, continuous outdoor Tokyo mission blocks with three functional identities and three interlocking traversal loops. It contains recognizable public and service spaces, credible surveillance coverage, discrete hiding and blending contexts, and a two-to-three-minute outer loop. Architecture forms streets rather than sitting as isolated objects. This approved topology is distinct from both the rejected sparse/fenced four-block compound and the rejected oversized nine-block board.

## Player agency contract

The player chooses their build, whether to seek optional preparation, when to depart, which route context to exploit, which risks to accept, whether to inspect optional evidence, how to escape, and whether to continue exploring after completion. The game may clarify consequences and known risk; it may not choose a route, perform an interaction, conceal deterministic requirements, invent knowledge, or convert failure into an unexplained state change.

Skipping optional content creates less information or stricter checks, never a silent dead end. Every check-bearing choice presents the exact deterministic math before selection and the same contributors after resolution. A difficult build can still finish the mission through another authored action. A failed nonterminal check changes time, Paranoia, Health, route clarity, or another declared state and explains that change; only the final failed capture-escape check may end the attempt.

## Complete Level 0 loop

1. **Create.** Choose callsign, one of four appearances, four attribute points, and six skill points.
2. **Wake exposed.** Begin inside the safehouse boundary at 18:30. George gives only immediate context and controls.
3. **Meet Lira.** Learn that Hidzu Corporation seized medical supplies, the cache is in a logistics site, passage toward Miami is the payment, and midnight is the deadline.
4. **Prepare or proceed.** Consult Naila, Brant, both, or neither. Preparation yields specific facts, not buffs.
5. **Choose timing through play.** Infiltrate before 22:00 through public delivery activity or wait for curfew and use the service alley.
6. **Read the network.** Observe known cameras, public behavior, entrances, hiding/blending contexts, and the verifier drone. Use George and the dossier only within known information.
7. **Recover the medkits.** Explicitly operate the cache-locker terminal and take the mission object; the observed removal is a valid surveillance rule break.
8. **Investigate optionally.** Progress Cold Iron evidence from Naila warning to manifest recognition, then optionally spend five world minutes to copy it. Missing or declining the copy never blocks completion.
9. **Escape honestly.** Resolve Suspicious or Pursuit through line-of-sight break, direction change, hiding, blending, or an authored confrontation—not an invisible exit trigger.
10. **Return to Lira.** Explicitly hand over the medkits. Lira reads the actual outcome ledger.
11. **Validate passage.** Use the outbound terminal at the safehouse before midnight.
12. **Recover and progress.** Rest, review the dossier, consult George, allocate any earned level-up, and receive the factual debrief.
13. **Close.** Choose `Continue Exploring` or `End Demo`. Do not load Miami until Level 1 exists.

The loop is complete only when all transitions are explicit. Medkits require explicit cache interaction and explicit handoff. Manifest copying requires its own five-world-minute confirmation. Passage requires explicit credential issuance and explicit outbound-terminal validation. Pursuit must be resolved rather than erased by crossing the safehouse boundary. Debrief reads the outcome ledger rather than reconstructing history from presentation state. Failure uses a cause-specific surface: only capture receives a Hidzu Corporation incident report and surveillance-limited evidence map.

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

Level 0 establishes that Hidzu Corporation supplies identity, logistics, and surveillance infrastructure to Harrow's Operation Cold Iron. The optional manifest determines how much the protagonist and future Miami contact know at handoff. The protagonist's missing father remains the personal connection to Cold Iron. Miami is the first playable campaign destination after the prologue.

## Definition of the MVP

MVP means this loop is complete, readable, emotionally coherent, and replayable through ordinary controls. It does not mean every existing subsystem is surfaced. A system that does not serve this loop is removed from Level 0 or postponed.

MVP quality is demonstrated in the actual player-visible build. A fixture can prove a state transition, a validator can prove a content contract, and a screenshot can prove a frame. None alone proves that a new player can understand and complete the journey. Final evidence therefore combines ordinary-control play, the target desktop viewports, both languages, the specified state/failure matrix, and a factual debrief.

## Authored content minimum

- one complete Lira operation and factual debrief;
- optional Naila and Brant preparation with a viable neither-contact run;
- dusk/public and curfew/service route contexts in the same four-block district;
- three one-function terminals: one-use camera feed, cache locker, and outbound validation;
- one optional Cold Iron chain with unknown, Naila-warning, recognized, and copied states;
- one named verifier drone, Needle, a small authored security set, and small authored civilian/blending groups that never report hidden state;
- Transit Road, Market Ring, and Outer Space route names; four street-clock moments; two grounding actions; and three threshold ambience sources;
- four protagonist appearances, twelve grounded actor sets, matching portraits, and George AR presentation;
- one progression event plus four normal run failures and deterministic Restart Attempt;
- equivalent English and Ukrainian semantics and non-audio-only critical feedback.

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
