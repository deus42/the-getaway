---
status: MVP
type: checklist
level: 0
---

# MVP Readiness Checklist (Level 0 Vertical Slice)

This checklist answers: **“Is Level 0 a playable MVP that matches the intended experience?”**

Guiding principle: MVP is not “minimal”, it’s **complete for its intended loop**.

## Update protocol (use this every time)
- After finishing any feature/task, update the relevant checkboxes here.
- Add a short entry under **Changelog** with date + what changed.
- When reporting progress, paste the **MVP Readiness Summary** section.

---

## MVP Readiness Summary

**Current estimate** (update over time):
- Technical MVP completeness: ☐ 0–100% (target: ≥90%)
- Experience MVP completeness: ☐ 0–100% (target: ≥85%)

**Current biggest risks** (keep to 1–3 bullets):
- ☐ 
- ☐ 
- ☐ 

---

## A) Core loop completeness (must be true)

**A1. A complete vertical-slice run exists**
- ☐ New Game → Character Creation → Level 0 start works reliably
- ☐ Day phase: player can progress via dialogue/quests (low-risk errands)
- ☐ Night phase: infiltration under curfew pressure is playable and fair
- ☐ The run has a clear closure: Mission Complete / Fail (with recap)

**A2. “What do I do next?” is always clear**
- ☐ The top-priority objective is always visible (HUD + George guidance)
- ☐ Quest log reflects current state (no stale or contradictory objectives)
- ☐ Player can recover from mistakes (clear reset path / reattempt loop)

---

## B) Quest + objectives reliability (high priority)

**B1. Objective state correctness**
- ☐ Objective completion is gated correctly (no premature completion)
- ☐ Collect/pickup objectives increment deterministically (no double count, no missed count)
- ☐ Objectives update immediately after the triggering action (pickup/dialogue/flag)
- ☐ Mission Accomplished triggers only when all primary objectives are complete

**B2. QA/debuggability**
- ☐ Action log clearly shows quest/objective state transitions
- ☐ Dev tools (or debug panel) can display: active quests, flags, objective completion

---

## C) Stealth / curfew / paranoia experience (signature feel)

**C1. Stealth feels like a first-class path**
- ☐ Stealth toggle + HUD feedback are clear and responsive
- ☐ Guard vision + camera cones are readable (player understands why they’re detected)
- ☐ Noise model is legible (player understands walk vs sprint consequences)
- ☐ Detection escalation is fair (no “instant fail” unless clearly telegraphed)

**C2. Curfew pressure is tuned**
- ☐ Curfew creates meaningful tension without soft-locking normal play
- ☐ Cameras meaningfully matter (avoid being cosmetic)
- ☐ “Night rules” are communicated (through UI, George, and/or a short prompt)

**C3. Paranoia is the core pressure resource**
- ☐ Paranoia rises from surveillance/curfew exposure in a predictable way
- ☐ Paranoia decreases through safe/day/rest loops in a predictable way
- ☐ Paranoia tiers have noticeable, not-annoying impact (tune penalties)

---

## D) Combat path (exists, but not the whole game)

- ☐ Combat can start/end cleanly without UI/state corruption
- ☐ Combat logs are readable (damage, AP, turn transitions)
- ☐ AutoBattle works as a convenience toggle (doesn’t break story beats)
- ☐ Combat is a viable fallback, not the main required path

---

## E) Onboarding + UX (first 3 minutes)

- ☐ Player can learn movement/path preview quickly
- ☐ Player learns stealth toggle + curfew/cameras without reading docs
- ☐ Player learns Paranoia as “the pressure bar”
- ☐ Dialogue choices communicate tone/approach clearly

Recommended MVP-only tutorialization:
- ☐ 3–5 contextual tooltips/callouts (only once each)

---

## F) “Signature” MVP content (makes it memorable)

- ☐ At least 1 night stealth set-piece that feels authored (guards + camera + meaningful choice)
- ☐ At least 1 dialogue scene that sells the tone (Disco-ish but simpler)
- ☐ At least 1 consequence that feels real (quest-state shift + immediate payoff)

---

## G) Stability, resetability, and testability (must be boringly solid)

- ☐ No soft-locks in the core loop (day→night→closure)
- ☐ Save/load or session persistence does not corrupt quest state
- ☐ New Game / Reset produces a clean state (repeatable QA)
- ☐ Basic smoke test script/checklist exists for every new build

---

## H) Presentation polish (high leverage, small scope)

- ☐ Basic audio pass (footsteps + alarm/curfew sting + UI confirms)
- ☐ Visual clarity: stealth/detection/paranoia states are readable
- ☐ Performance: stable framerate on target machines for Level 0

---

## Definition of Done (MVP Ready)
MVP is considered **ready** when:
- All sections **A + B + C + G** are checked ✅, and
- Sections **D + E + F + H** are at least “good enough” to not break the intended feel.

---

## Changelog
- 2026-02-20 — GET-137 phase 1 scene-architecture extraction landed (MainScene module runtime, lifecycle registry, disposable cleanup). No gameplay checklist boxes changed; risk shifted toward follow-up extraction/validation in later phases.
- 2026-02-21 — GET-137 follow-up extraction landed for surveillance rendering lifecycle (`SurveillanceRenderModule`), moving vision-cone/camera sprite ownership out of `MainScene` and validating Level 0 smoke run with 0 console errors. Gameplay checklist boxes unchanged; architecture risk reduced further.
- 2026-02-22 — GET-137 battle-visibility hardening landed in `DayNightOverlayModule` (neutral combat overlay color + alpha cap) with replayed Level 0 combat smoke validation (`PLAYER TURN` visible, 0 console errors). Gameplay checklist boxes unchanged; combat blackout regression risk reduced.
- 2026-02-23 — GET-170 Level 0 visual/pathing pass landed (surface metadata + road/crosswalk rendering, deterministic A* pathing, ESB footprint inset for closer approach, silhouette character tokens). Gameplay checklist boxes unchanged; readability and navigation clarity risk reduced.
- 2026-02-24 — GET-170 follow-up stability hardening landed for React/Redux runtime (selector stabilization + debug panel mount guard) after `Maximum update depth exceeded` report; Level 0 stress playtest and console audit show 0 runtime errors. Gameplay checklist boxes unchanged; UI recursion risk reduced.
- 2026-02-24 — GET-170 ESB follow-up tuning landed (lower camera zoom floor, tighter ESB collision footprint, and south-edge door anchoring) with `?poc=esb&pocDebug=1` browser verification. Gameplay checklist boxes unchanged; landmark readability/navigation mismatch risk reduced.
- 2026-02-24 — GET-144 stealth fairness/readability pass landed (epoch-based cooldown timing, alarm-only forced break, camera `SUSPICIOUS -> INVESTIGATING -> ALARMED`, centralized readability selectors, and explicit camera/vision/noise cues in HUD/logs). Gameplay checklist boxes unchanged pending requester playtest sign-off; stealth readability/fairness regression risk reduced.
- 2026-02-24 — GET-144 follow-up HUD clarity/reliability pass landed (no auto stealth dock reflow on `X`, stealth strip moved to bottom player HUD, hardened menu dropdown focus/portal behavior, and explicit camera daytime/hidden-cone cues). Gameplay checklist boxes unchanged pending requester playtest sign-off; HUD stability/readability risk reduced.
- 2026-02-24 — GET-144 UX refinement pass toned down stealth strip styling, added explicit recovery hints/control guidance (`X` toggle, `Shift` sprint noise), and synchronized movement-profile switching on `Shift + movement` so stealth noise/readability cues match runtime behavior. Gameplay checklist boxes unchanged pending requester sign-off; onboarding/readability risk reduced.
- 2026-02-24 — GET-144 micro-polish pass removed the always-visible standby stealth control treatment and switched to contextual inline status only when stealth state meaningfully changes. Gameplay checklist boxes unchanged pending requester sign-off; bottom-HUD visual clutter risk reduced.
- 2026-02-24 — GET-144 HUD control clarity pass added a persistent compact Player HUD stealth chip (`STEALTH ON/OFF`) inline with header controls, removed duplicate standby/pace surfaces, and kept request-driven HUD toggle routing (`requestStealthToggle` nonce). Gameplay checklist boxes unchanged pending requester sign-off; stealth discoverability risk reduced.
- 2026-02-24 — GET-144 HUD de-dup pass removed the top-right SPY Activity wafer (`CameraDetectionHUD`) so surveillance readability is conveyed by world visuals alone. Gameplay checklist boxes unchanged pending requester sign-off; duplicate-HUD-noise risk reduced.
- 2026-02-24 — GET-144 day/night HUD pass replaced the phase/icon/progress wafer with a single consistent 24-hour digital clock in the top-right rail (no sun icon, no gradient phase shifting, no horizontal progress bar). Gameplay checklist boxes unchanged pending requester sign-off; top-rail HUD consistency risk reduced.
- 2026-02-24 — GET-144 day/night timing pass removed digital-colon blinking, throttled top-right clock updates to larger time steps for calmer readability, and aligned curfew activation to world-clock hours 22:00-06:00. Gameplay checklist boxes unchanged pending requester sign-off; temporal readability/curfew-contract risk reduced.
- 2026-02-24 — GET-144 debug-time alignment pass remapped Debug Inspector presets to 24h expectations (`Set Day` -> 06:00, `Set Night` -> 22:00) and switched inspector time readout to the same clock model as HUD. Gameplay checklist boxes unchanged pending requester sign-off; debug-playtest consistency risk reduced.
