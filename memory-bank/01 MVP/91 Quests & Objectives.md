---
status: MVP
type: system
tags: [quests]
---

# Quests & Objectives

Quest Drivers (MVP scope)

**Status:** ✅ MVP scope. Quest-driving is deterministic and debuggable (simple triggers + clear state). Advanced/procedural quest drivers live in [[02 Post-MVP/narrative-advanced]].

MVP intent:
	•	Hand-authored quests, triggered by simple conditions (dialogue choice, stepping on tile, pickup collected, flag set).
	•	Keep logic transparent and debuggable in the quest log / action log.

### Rule: structure

Level Progression & Objective Hierarchy

- The campaign advances through discrete levels (Level 0: Slums, Level 1: Downtown, Level 2: Industrial Wasteland, and future tiers). Each level ships with a curated list of primary objectives that embody the main mission beats for that space.
- Every primary objective is composed of one or more quests. Quests define the atomic interactions (dialogue, combat encounters, searches) that flip the underlying state flags. Objectives are therefore collections that resolve to complete when all child quests reach a terminal state (complete or failed when permitted).
- Objectives include structured metadata: display label, summary copy, gating requirements, and an ordered quest ID list. This enables the HUD panel and quest log to render consistent sequencing and partial progress regardless of how the player reached the current level.

### Rule: completion_feedback

Objective Completion & Level Advancement

- The HUD Level & Objectives panel mirrors the quest log: active objectives render with an inline checkbox and will be crossed out visually once the associated quest set reports completion. Partial progress lines remain normal weight so players can scan outstanding tasks quickly.
- When all primary objectives for the current level are complete, the UI announces "Mission Accomplished" and hands control to the level advancement funnel. Progression offers a continue prompt, then loads post-mission dialogue, rewards, or the world transition for the next level. Side content remains available until the player confirms the transition.
- Objective state changes emit Redux events so auxiliary systems (assistant hints, minimap focus, George overlay) can react immediately without polling bespoke quest state.
- George assistant consumes the same selectors that drive the panel, promoting the top-priority active objective as its default guidance line and celebrating once the level transition modal confirms the mission wrap.

### Rule: side_content

Side Quests & Optional Tasks

- Side quests coexist alongside primary objectives but are tagged as optional. They inherit the same quest atom structure yet render in a dedicated subsection of the HUD panel so they never block level completion.
- Completing or abandoning side quests has no effect on the Mission Accomplished gate; however, they can grant bonuses, reputation shifts, or alternate dialogue in the next level's intro sequences to reward thorough players.
- Optional quest metadata includes recommended level and originating faction so the assistant and logbook can surface the most relevant detours without overwhelming the player during critical objectives.

### Rule: player_surface

Canonical Player Objective Surface (Level 0 MVP)

- The player-facing objective UI is the **Quests panel** (`OpsBriefingsPanel`) and is structured as:
  - **Primary Progress** (mission-level completion state),
  - **Active Side Quests** (started + not completed),
  - **Available Side Quests** (visible from start, not yet accepted),
  - **Completed Quests** (history overlay).
- The former dedicated Level HUD card is not part of the player runtime path for this pass; objective debugging is provided in test mode via the Debug Panel Mission Snapshot.
- Available side quests surface giver attribution (`Talk to <NPC>`) and mission summary copy so players can decide what to pull next without opening dialogue first.

### Rule: side_progression_plumbing

Level 0 Side Quest Progression Contracts

- Side-quest progression can begin from the **Available** pool (no hard dialogue prerequisite): on first valid objective progress event, the quest is promoted into Active automatically.
- Enemy defeat progression updates side-quest `kill` objectives deterministically and counts each enemy id only once per objective.
- Camera sabotage progression updates `devices.surveillance_camera` objectives when the player presses `E` near a valid active camera (NPC interaction keeps priority when both are available).
- Drone recon progression updates `devices.patrol_drone` objectives on unique waypoint sightings using `${cameraId}:${currentWaypointIndex}` tokens while the drone is active and not in `ALARMED` state.
- Surveillance-dependent side objectives are curfew-window tasks (22:00-06:00) and must communicate this explicitly in objective copy/log feedback.

**Status:** ⚠️ PARTIAL - HUD scaffold exists; objective gating and mission celebration flow targeted for Step 35.2.

Quest Structure & Journal

Managing the variety of quests requires clear structure and player tools to keep track of objectives and progression:
	•	Quest Journal: The game provides a journal (or Pip-Boy-like device, or smartphone in a cyberpunk context) where all active and completed quests are logged. Each quest entry includes:
	•	Quest Name – often hinting at the task or story beat (e.g., “Escape from Downtown” or “A Friend in Need”).
	•	Description/Context – a brief summary of the situation and goal, often written in a narrative tone. After major decisions, this description can update. (For example, if you chose to help Faction A instead of B in a quest, the description notes that path.)
	•	Current Objectives – a list of tasks or steps needed to complete the quest, with indicators of which ones are done. e.g., “1. Meet the contact at the old church (Completed). 2. Retrieve the hidden cache. 3. Return to the contact.”
	•	Quest Giver/Related NPC – notes who initiated the quest or who is important for it, helpful if you need to find them again.
	•	Rewards (if known) – sometimes listed if the NPC promised something (e.g., payment or an item) or if it’s obvious (completing certain quests might list “+Reputation” or a skill unlock).
	•	Main vs Side vs Procedural: The journal categorizes quests by type. Main story or faction-critical quests might be under “Main Quests”, optional side quests under “Side Quests”, and repeatable or procedural ones under “Contracts” or “Jobs”. This helps players prioritize and know which quests advance the main narrative versus which are extra content.
	•	Sorting and Filtering: As the game can have many quests, the player can sort the journal by active/inactive or by location (maybe tag a quest to see it on the map). Completed quests go into a separate history section for review if needed. Failed quests might have their own tab or marking.
	•	Map Integration: The map will show markers for active quest objectives if appropriate. There could be different colored markers for different quests, or the ability to set one quest as “tracked” so only its markers show to avoid clutter. Some quests might not give a precise marker (for instance, a clue-based quest might just mark a broad area to search or none at all to encourage puzzle-solving).
	•	Dynamic Updates: The journal updates in real-time as conditions change. If a quest becomes unavailable due to your actions (say you killed an NPC who would give or continue a quest), the quest entry might move to failed and note what happened (“You killed X, so you can no longer help them with Y.”). If a quest’s objectives change mid-way (like an ambush happens, adding a new objective “Survive the ambush”), the journal reflects that.
	•	Quest Dependencies: Sometimes one quest can affect another. The journal can hint at this. For example, if you have two quests from different factions that are at odds (“Steal the data for Faction A” and “Protect the data for Faction B”), the journal might note the conflict or even merge them into one entry with a branching choice. We aim to avoid having the player confused by two opposite quests active simultaneously without clarification. The game should prompt the player at such junctures to make a decision.
	•	Quest Completion & Rewards: When a quest is completed, a summary might pop up (“Quest Completed: [Name]. Rewards: XP, items, rep changes.”) and the journal entry moves to completed with a brief epilogue line if needed (“You chose to give the medicine to the clinic, saving many lives.”). This helps reinforce the consequence and gives closure in the log.
	•	Dialogue Integration: The quest log often echoes information from dialogues (like if an NPC said “Meet me in two days at location X,” the log will have that note). This reduces the chance of players forgetting verbal instructions.

The quest structure and journal are about player guidance and memory. With so much freedom and branching, it's vital that players have a reliable way to recall what they're supposed to do and what's happening in the world. A well-maintained quest log ensures players can take a break from the game and come back without being lost, and it lets them juggle multiple quests at once in a manageable way.
