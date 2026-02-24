---
status: MVP
type: mechanic
tags: [stealth]
---

# Stealth

Stealth Mode (MVP Toggle)

Stealth is now a primary player-driven mode that complements Combat and Dialogue:
	•	Activation: Use the always-visible Stealth control in the Player HUD header (top-right of the panel) or tap `X` outside of combat/conversations. The button remains visible in all states and never reflows the HUD.
	•	Lockouts: Combat or active dialogue immediately drop the player out of stealth. Confirmed alarm states force a short 4.5s cooldown before stealth can be re-enabled; Suspicious/Investigating pressure remains recoverable.
	•	Visibility: Guard vision and camera cones shrink based on stealth skill, lighting, paranoia tier, and the active movement profile—sprinting multiplies detection gain while silent footwork cushions it. Hidden → Exposed → Compromised states surface through the dedicated bottom Player HUD strip.
	•	Noise Model: Movement emits radial noise (silent ≈ 0 gain, walk ≈ +4 progress within 4 tiles, sprint ≈ +8 within 6 tiles). Noise nudges nearby guards toward Investigating even without direct LoS, letting players feel the pressure of hurried movement.
	•	Cameras: Surveillance no longer consumes crouch flags; motion sensors ignore stealth walk but always trip on sprinting. Camera escalation now flows Suspicious → Investigating → Alarmed, and hacking dampens detection progress without restoring crouch-era toggles.
	•	Payoffs & Fail States: Entering combat from stealth no longer grants an ambush bonus. Once compromised, stealth disables, logs the breach, and respects the cooldown/reset requirement before re-entry.
	•	HUD Feedback: Stealth readability now lives in the bottom Player HUD (not top-right) as a single compact `STEALTH ON/OFF` control chip aligned with header controls (same visual size class as Level). No extra standby/pace strip is shown in this panel.
	•	Controls & Persistence: Player data now stores `stealthModeEnabled`, `stealthCooldownExpiresAt`, and a `movementProfile` union (`silent | normal | sprint`) so saves and subsystems receive consistent engagement context.

**Status:** ✅ IMPLEMENTED
