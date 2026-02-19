---
status: MVP
type: mechanic
tags: [stealth]
---

# Stealth

<mechanic name="stealth_mode">
Stealth Mode (MVP Toggle)

Stealth is now a primary player-driven mode that complements Combat and Dialogue:
	•	Activation: Tap `X` outside of combat or conversations to enter stealth. The player automatically shifts into a silent movement profile; manual disengage is instant and carries no penalty.
	•	Lockouts: Combat or active dialogue immediately drop the player out of stealth. Being exposed or triggering an alarm forces a short 4.5s cooldown before stealth can be re-enabled.
	•	Visibility: Guard vision and camera cones shrink based on stealth skill, lighting, paranoia tier, and the active movement profile—sprinting multiplies detection gain while silent footwork cushions it. Hidden → Exposed → Compromised states surface through the dedicated HUD wafer.
	•	Noise Model: Movement emits radial noise (silent ≈ 0 gain, walk ≈ +4 progress within 4 tiles, sprint ≈ +8 within 6 tiles). Noise nudges nearby guards toward Investigating even without direct LoS, letting players feel the pressure of hurried movement.
	•	Cameras: Surveillance no longer consumes crouch flags; motion sensors ignore stealth walk but always trip on sprinting. Hacking dampens detection progress but does not restore crouch-era toggles.
	•	Payoffs & Fail States: Entering combat from stealth no longer grants an ambush bonus. Once compromised, stealth disables, logs the breach, and respects the cooldown/reset requirement before re-entry.
	•	HUD Feedback: A new Stealth indicator sits beside the camera wafer—Hidden (cool tone), Exposed (amber), Compromised (red), Standby (neutral). The badge reports detection %, cooldown status, or availability notes (combat/dialogue blockers).
	•	Controls & Persistence: Player data now stores `stealthModeEnabled`, `stealthCooldownExpiresAt`, and a `movementProfile` union (`silent | normal | sprint`) so saves and subsystems receive consistent engagement context.

<implementation_status>✅ IMPLEMENTED</implementation_status>
</mechanic>
