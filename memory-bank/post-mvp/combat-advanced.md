# Post-MVP: Combat (Advanced / Full Spec)

Moved out of memory-bank/game-design.md to keep the MVP doc focused.


<mechanic name="combat_overview">
Combat Overview

Combat in The Getaway is turn-based and takes place on a grid, offering tactical depth in each encounter. When combat is triggered (for example, an enemy spots the player or a hostile encounter is initiated via a quest), the game transitions from real-time exploration to a turn-based combat mode. The battlefield is divided into tiles (squares or hexes), much like classic games such as Fallout 2 or Heroes of Might & Magic 3. Each participant – player characters, allies, enemies, and even vehicles – takes turns according to an initiative order determined by their stats or situational factors.

This turn-based approach allows players to carefully plan moves, use cover, and coordinate attacks. It slows the pace during combat so that positioning and strategy matter more than reflexes. Outside of combat, the game returns to real-time exploration seamlessly.
</mechanic>


<mechanic name="cover_line_of_sight">
Cover & Line-of-Sight

The combat system emphasizes using cover and line-of-sight for tactical advantage, similar to modern tactical RPGs:
	•	Cover Objects: The environment in combat is filled with objects that can serve as cover — walls, barricades, vehicles, furniture, etc. Standing behind cover makes a character harder to hit. We categorize cover as partial (e.g., crouching behind a low wall or car hood) which provides some defense, or full (e.g., completely behind a solid wall) which can block attacks entirely until the enemy flanks or destroys the cover.
	•	Taking Cover: Characters can use a portion of their movement/AP to take cover against an object. The interface will indicate when a position offers cover (for example, a shield icon might appear if moving to that tile will put the character behind cover relative to an enemy). Proper use of cover greatly improves survival, as firefights in the open are deadly.
	•	Line-of-Sight (LoS): An attack can only hit a target if there is line-of-sight. If an obstacle is between attacker and target, the target might be completely safe or have an evasion bonus. The game will calculate LoS for each attack; if an enemy isn’t visible due to walls or darkness, the player may need to move or use tools like sensors.
	•	Flanking: Because cover is directional, enemies will try to flank the player, and the player can do the same. Flanking an enemy (attacking from a side where their cover doesn’t protect) negates their cover bonus. This encourages moving characters around the battlefield rather than staying in one spot.
	•	Destructible Cover: Some cover objects can be destroyed by sustained fire or explosives. For instance, wooden crates or glass windows offer cover initially but can shatter after a few hits. This means cover doesn’t guarantee safety forever — if you hunker down behind a flimsy barrier and the enemy focuses fire, you’ll have to relocate or risk exposure.
	•	Overwatch & Reactions: A character can choose to spend their turn going into Overwatch mode (using any remaining AP). In overwatch, if an enemy moves within a character’s line-of-sight during the enemy’s turn, the character will automatically use reserved AP to take a shot at that enemy. This mechanic allows defensive play and area denial, and it interacts with cover (e.g., running between two covered spots could trigger enemy overwatch fire if you cross an open gap). Enemies can use overwatch too, so the player must be cautious when advancing.

Using cover effectively and managing sight-lines is crucial. Rushing in without cover will usually result in quick defeat, whereas clever use of the environment allows a smaller force to take on larger groups successfully.
</mechanic>


<mechanic name="special_abilities">
Special Abilities & Tactical Options

Characters and enemies have more than just basic attacks, adding depth and variety to combat:
	•	Targeted Shots: Skilled characters can perform aimed shots targeting specific enemy body parts. For example, shooting an enemy’s legs can slow their movement, or aiming for the arms can disarm them or reduce their accuracy. This mirrors Fallout’s targeted shot system. Targeted shots typically cost extra AP and require a higher skill, but inflict strategic debuffs.
	•	Melee Takedowns: Stealthy or melee-focused characters can execute powerful close-quarters moves. If a player manages to start combat with an enemy unaware (an ambush), they might get a free melee takedown attempt that can silently eliminate or heavily damage an enemy at the outset. This encourages stealthy approaches and skillful positioning before a fight begins.
	•	Area-of-Effect Attacks: Explosives like grenades, Molotov cocktails, or planted mines can hit multiple targets in a radius. These are useful against clustered enemies or those behind cover (since splash damage can bypass cover). The player must use them carefully to avoid injuring their own team or destroying valuable loot. Some heavy weapons also have blast radii (rocket launchers, etc.).
	•	Support Abilities: Characters may have support abilities such as throwing a smoke grenade (to create temporary cover and block enemy vision), using a flashbang (to stun enemies and reduce their AP on their next turn), or deploying a small drone or turret. For example, a deployable turret could act as an extra ally for a few turns, drawing fire and shooting at enemies.
	•	Buffs and Debuffs: Certain actions can temporarily enhance allies or weaken enemies. For instance, a “Battle Cry” ability might boost allies’ damage or AP for the next turn, while a “Marked Target” ability could make a chosen enemy easier for everyone to hit. Some of these effects might come from gadgets or leadership skills rather than inherent character abilities.
	•	Consumables: During combat, the player can use consumable items for tactical gains. Examples include medkits or syringes to heal or grant temporary stat boosts (like an adrenaline shot to increase AP), combat drugs that enhance speed or strength at a cost, or gadgets like an EMP device that can disable robotic enemies and electronic defenses for a short time.

These varied options ensure combat doesn't feel repetitive. The player can approach encounters in different ways: one fight might involve sniping and traps, another could be resolved by hacking a security robot to turn on its masters, and another might see the player use brute force with heavy weapons. Tactical creativity is rewarded.
</mechanic>


<mechanic name="autobattle_mode">
AutoBattle Mode & Behaviour Profiles

AutoBattle lets players temporarily hand tactical control to combat AI so fights can flow like a modern autochess round while still respecting The Getaway’s AP economy and cover rules.
	•	Automation Toggle: A dedicated AutoBattle toggle lives in the settings menu, pause/options shell, and combat HUD (button plus `Shift+A`). When enabled, the preference persists per save, so grinders can clear easier encounters hands-off yet still opt for manual play in tough missions.
	•	Behaviour Profiles: Players select Aggressive, Balanced, or Defensive profiles that weight priorities differently—Aggressive spends consumables and closes distance, Balanced values positive expected damage vs. incoming risk, Defensive hoards AP for overwatch, healing, and fortified cover. Profiles can be swapped mid-encounter to react to changing board states.
	•	HUD Quick Toggle: The combat overlay keeps AutoBattle to a single enable/disable button; behaviour presets stay in the Game Menu so the slim widget never overwhelms the battlefield.
	•	Autochess-style Planner: Each AutoBattle step now scores candidate attacks and reposition moves via expected damage, cover gain, distance deltas, and AP reserve penalties tuned per profile. The top-scoring option triggers whenever the player still has AP available in the active turn, mirroring the “plan → resolve” cadence of autochess rather than scripted rotations.
	•	Player Agency & Fail-Safes: Manual input (movement keys, attack hotkeys, HUD clicks) instantly pauses automation and flips the toggle off. The controller also halts when dialogue prompts appear, combat ends, or AP drops below the configured reserve so the AI never overruns a story beat or burns the last action point unintentionally.
	•	Transparency & Debugging: Combat logs annotate automation decisions (“AutoBattle (Balanced) → Move to cover (Gain cover)”), and the HUD badge tracks Engaged/Paused/Standby states with the last decision summary. Designers can inspect the persisted decision payload in `autoBattleSlice` for deeper tuning without stepping through code.

This optional layer gives newcomers and grinders a low-friction way to enjoy turn phases while retaining deep tactical control the moment they toggle back to manual play.
</mechanic>
