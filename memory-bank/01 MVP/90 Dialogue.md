---
status: MVP
type: system
tags: [dialogue]
---

# Dialogue

<mechanic name="dialogue_system">
Dialogue System

Dialogue is a crucial tool for storytelling, delivered in a text-driven format reminiscent of classic RPGs:
	•	Interactive Conversations: When speaking to NPCs, the player is presented with dialogue options to choose from. These options can advance the conversation, allow asking questions, or make decisions that affect outcomes. The dialogue is typically presented with the NPC’s lines and a list of the player’s possible responses.
	•	Player Choice & Tone: Dialogue options often represent different approaches or tones. For example, you might see choices like “[Friendly] We mean no harm, we just want information,” “[Bribe] Slide some credits across the table How about you help me out?”, “[Threaten] Tell me what I need to know, or else.” The player can shape their character’s personality through these choices, whether they are diplomatic, aggressive, sarcastic, altruistic, etc.
	•	Skill and Stat Checks: Many dialogue choices are gated by the player’s skills, attributes, or prior actions. A high Charisma or a specific perk might unlock a unique persuasion option that lets you avoid a fight. A character with a strong technical background might get extra dialogue about technology or to solve a problem by hacking. If you’ve aligned with a faction, you might get a special option to leverage that (“Invoke your status as a friend of the Rebellion”). When a choice is locked due to insufficient skill, the game might show it greyed out (to indicate that such an approach was possible, adding replay curiosity). Passing or failing a dialogue skill check can significantly change the result of the conversation.
	•	Branching Outcomes: Conversations can have multiple outcomes and even end states. You could negotiate a peaceful solution to a conflict via dialogue (preventing a battle), or you might fail and anger the NPC, leading to combat. You might convince someone to give you a key piece of info, or if you skip the right dialogue options, you miss it and have to find another way. Dialogue can also determine alliances – say the wrong thing to a faction leader and they might turn you away or demand a favor to regain trust.
	•	Information Gathering: Dialogue is a primary way to gather intel about the world. NPCs will share lore, rumors, and hints. A player paying attention to dialogue might discover hidden side quests (“I hear noises from the old subway at night…”), learn passwords or codes, or glean background that helps solve puzzles. We encourage exploration through talking – not every answer is on the map, sometimes you have to chat with locals.
	•	Dialogue Interface & Logs: The dialogue interface will likely show the name or portrait of the character speaking and the text of their dialogue. The player’s selected response is usually shown as well. We will include a dialogue history log that players can scroll if they need to review what was said (useful for remembering clues or instructions given mid-conversation). Dialogue sequences can be exited or returned to if appropriate (some NPCs allow you to come back and ask more questions later). Important decisions in dialogue will usually prompt the player with a confirmation if they lead to a big irreversible change (“Are you sure you want to insult the warlord? This will make his faction hostile.”).

The dialogue system is essentially the narrative engine of the game, driving story progression, quest initiation/completion, and delivering the rich story we plan. It's designed to handle complex branching while giving the player clarity and meaningful choices.
</mechanic>

<mechanic name="choices_consequences">
Choices & Consequences (MVP scope)

<implementation_status>✅ MVP scope. Consequences in MVP are immediate and legible (quest-state changes + scene outcomes). Long-tail/procedural consequence frameworks live in `memory-bank/02 Post-MVP/narrative-advanced.md`.</implementation_status>

MVP policy:
	•	Consequences are primarily quest-state changes + immediate scene outcomes.
	•	Avoid global karma/reputation propagation for MVP (those systems are Post-MVP).
</mechanic>
