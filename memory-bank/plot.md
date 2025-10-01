<plot_bible title="The Getaway">
  <setting_snapshot year="2036" region="United States">
    <climate>Subtropical storms hammer the Atlantic coast; seawalls and pumps fail weekly.</climate>
    <government>Chancellor Victor Harrow rules through the Emergent Security Directorate (ESD), a fusion of privatized police, militias, and corporate intelligence.</government>
    <economy>Ration tokens, black-market scrip, and corporate credit chips circulate simultaneously while critical infrastructure is auctioned to loyal oligarchs.</economy>
    <technology>Drones, predictive policing, and biometric checkpoints contain cities; resistance cells rely on repurposed industrial tech and analog dead drops.</technology>
    <alliances>The North Atlantic Resistance Coalition (NARC)—Canada, EU remnants, and sympathetic Latin American states—funds covert cells but avoids overt intervention.</alliances>
  </setting_snapshot>

  <core_conflict code_name="Operation Cold Iron">
    Harrow’s regime prepares a lightning strike into Canada to seize hydroelectric power and rare earth reserves. Player decisions determine whether the invasion collapses and whether Harrow’s war crimes become public.
  </core_conflict>

  <narrative_pillars>
    <pillar id="1" title="Occupation as Everyday Reality">Every mission should remind players that the regime polices food, information, and movement; small victories like lifting curfew in one district matter as much as grand strikes.</pillar>
    <pillar id="2" title="Trust is Currency">Alliances remain fragile. Reputation systems, dialogue checks, and companion loyalty must reflect whom the player chooses to protect.</pillar>
    <pillar id="3" title="Tech vs. Ingenuity">High-end regime technology collides with hacked-together resistance tools. Systems should reward traps, misdirection, and social engineering over brute force.</pillar>
    <pillar id="4" title="Consequences Echo">Choices reverberate across acts (e.g., sparing a syndicate broker unlocks Act III smuggling assistance; leaking intel early hardens ESD patrols in Act IV).</pillar>
  </narrative_pillars>

  <power_factions>
    <faction id="esd" name="Emergent Security Directorate (ESD)">
      <description>Data-obsessed enforcers clad in graphite armor and mirrored visors.</description>
      <internal_rift>Traditionalist commanders clash with profit-driven corporate officers, producing exploitable fractures.</internal_rift>
    </faction>
    <faction id="narc" name="North Atlantic Resistance Coalition (NARC)">
      <description>Provides intel, tech smuggling routes, and extraction contacts.</description>
      <strategy>Prefers long-term destabilization over open war.</strategy>
    </faction>
    <faction id="shelterline" name="Miami Cell “Shelterline”">
      <description>Grassroots network led by Amara Velez, focused on disrupting port logistics and covert evacuations.</description>
    </faction>
    <faction id="scavengers" name="Scavenger Syndicates">
      <description>Crews like the Dockside Brokers trade ration chips, weapon mods, and intel; loyalty shifts with respect earned.</description>
    </faction>
    <faction id="eisenclave" name="Eisenclave Conglomerate">
      <description>Corporate collaborator profiting from surveillance contracts and privatized utilities while supplying Harrow with drone swarms and AI analysis.</description>
    </faction>
  </power_factions>

  <protagonist>
    <callsign default="Trace" customizable="true" />
    <background_threads>
      <thread id="courier" name="Former Courier">Knows smuggling tunnels and excels at stealth objectives.</thread>
      <thread id="cadet" name="Disgraced Cadet">Retains knowledge of ESD protocols and gains unique dialogue with loyalists.</thread>
      <thread id="medic" name="Street Medic">Unlocks pacifist options and leverage over refugee factions.</thread>
    </background_threads>
    <personal_stakes>Trace’s father vanished during the Battle of Miami; rumors suggest he survived as an ESD detainee transferred north with Operation Cold Iron.</personal_stakes>
  </protagonist>

  <narrative_structure>
    <act id="1" title="Ashes of Miami">
      <beat>Break curfew to retrieve contraband medkits.</beat>
      <beat>Meet Shelterline at an abandoned metro hub and disable drone beacons to prove loyalty.</beat>
      <beat>Uncover evidence that Harrow’s forces funnel munitions north via cargo rail.</beat>
    </act>
    <act id="2" title="Fault Lines">
      <location>Mid-Atlantic Corridor</location>
      <beat>Travel alongside refugee caravans and damaged highways; choices impact faction reputation.</beat>
      <beat>Infiltrate Eisenclave data centers to expose Operation Cold Iron logistics.</beat>
      <beat>Secure NARC extraction while witnessing ideological infighting.</beat>
    </act>
    <act id="3" title="Glass Capital">
      <location>New Columbia (former Washington, D.C.)</location>
      <beat>Penetrate a walled corporate arcology.</beat>
      <beat>Collaborate with double agent Commander Sadiq Rahm to sow distrust inside ESD ranks.</beat>
      <beat>Choose between leaking intel publicly or preserving leverage for NARC.</beat>
    </act>
    <act id="4" title="Northern Breakpoint">
      <beat>Sabotage invasion staging yards hidden beneath Great Lakes freight tunnels.</beat>
      <beat>Trigger a citywide blackout or hijack the drone swarm; branching outcome shifts finale tone.</beat>
      <beat>Confront Harrow aboard an airborne command platform; expose crimes, topple the regime, or negotiate a ceasefire.</beat>
    </act>

    <interludes>
      <interlude id="radio_monologues">Between acts, Theo “Circuit” broadcasts shortwave summaries that branch based on player reputation.</interlude>
      <interlude id="refugee_ledger">Persistent menu tab tracks civilians saved, lost, or displaced; values influence NARC asset deployment in later acts.</interlude>
      <interlude id="harrow_address">Mid-campaign propaganda speech adapts to player disruptions and unlocks custom finale dialogue hooks.</interlude>
    </interludes>

    <alternate_outcomes>
      <outcome id="narc_trust">High NARC trust unlocks an Act IV airlift with reduced reinforcements; low trust forces a hazardous ground extraction.</outcome>
      <outcome id="shelterline_morale">Shelterline morale reflects civilian-centric choices. If morale collapses, Amara considers abandoning Miami, altering companion availability.</outcome>
      <outcome id="harrow_negotiation">Prioritizing intel over spectacle opens a ceasefire ending—buying time yet leaving the regime wounded rather than toppled.</outcome>
    </alternate_outcomes>
  </narrative_structure>

  <supporting_cast>
    <character id="amara_velez" role="Shelterline Leader">Direct and dry-humored; prioritizes civilian safety.</character>
    <character id="theo_anders" callsign="Circuit">Teen hacker delivering pirate radio bulletins; balances levity and exposition.</character>
    <character id="sadiq_rahm" role="ESD Commander">Decorated officer with family defected to Canada; speech oscillates between clipped jargon and restrained grief.</character>
    <character id="mireille_duplessis" role="NARC Liaison">Coordinates aid drops with measured, urgent diplomacy.</character>
  </supporting_cast>

  <tone_and_dialogue>
    <voice id="resistance">Grounded optimism under exhaustion; uses coded phrases such as “streetlight” for safe house and “quiet tide” for curfew lift.</voice>
    <voice id="esd">Precise and ominous, referencing protocols and statistics. Intimidation stems from controlled calm.</voice>
    <voice id="civilians">Survival-first with dark humor and wary glances; frequently address the player by nickname.</voice>
    <voice id="broadcast">Propaganda layered with glitch interference, blending authoritarian slogans with upbeat corporate sound bites.</voice>

    <dialogue_examples>
      <example context="resistance">Streetlight’s back on. You’ve got seven minutes before the floodlights sweep—move like you still trust your knees.</example>
      <example context="esd">Citizen Trace. Compliance Directive 19-B authorizes lethal countermeasures. Present for scan or be marked subversive.</example>
      <example context="syndicate">You bring fuel? Then we talk. No fuel, no favors—curfew makes saints of none of us.</example>
      <example context="broadcast">Harrow’s Dawn—Order, Prosperity, Destiny. Stay inside. Stay loyal. Stay alive.</example>
    </dialogue_examples>

    <formatting_cheatsheet>
      <rule>Use em dashes for interruptions during tense stealth moments (“Hold—drone!”).</rule>
      <rule>Reserve ellipses for trauma or exhaustion, not casual hesitation.</rule>
      <rule>Mark code phrases with italics in scripts (_quiet tide_).</rule>
      <rule>Keep broadcast slogans in uppercase to contrast with human dialogue (“HAIL HARROW. HAIL ORDER.”).</rule>
    </formatting_cheatsheet>
  </tone_and_dialogue>

  <themes_and_motifs>
    <theme id="improvised_hope">Makeshift solar arrays, graffiti maps, and coded lullabies indicate culture surviving occupation.</theme>
    <theme id="silenced_histories">Museums repurposed as bunkers; characters fight for memory alongside freedom.</theme>
    <theme id="moral_weight">Missions force trade-offs between protecting civilians, gathering intel, or striking the regime; outcomes affect future support.</theme>
  </themes_and_motifs>

  <quest_hooks>
    <quest id="echoes_of_the_bay">Rescue climate refugees stranded on a seized cruise liner; ration limited ferry space.</quest>
    <quest id="stadium_vault">Recover art and archives hidden beneath Miami Stadium; choose between public release or black-market leverage.</quest>
    <quest id="signal_choke">Disable a satellite uplink relay; success unlocks covert NARC drops, failure strengthens enemy patrol AI.</quest>
    <quest id="ghost_ledger">Investigate ration fraud implicating a sympathetic ESD quartermaster and decide whether to expose or shield them.</quest>
  </quest_hooks>

  <relationship_web>
    <link source="trace" target="amara_velez">Mentor-protégé arc evolving from guarded professionalism to mutual reliance.</link>
    <link source="trace" target="theo_anders">Younger-sibling energy enabling lighter banter and tech exposition.</link>
    <link source="trace" target="sadiq_rahm">Fragile alliance emphasizing strategic debate and betrayal risk.</link>
    <link source="amara_velez" target="mireille_duplessis">Philosophical tension between frontline urgency and geopolitical calculus.</link>
  </relationship_web>

  <visual_audio_motifs>
    <motif id="lighting">Resistance zones glow with reclaimed neon; regime checkpoints drown in sodium floodlights.</motif>
    <motif id="soundscape">Radio static signals nearby pirate broadcasts; sub-bass hum warns of patrol drones.</motif>
    <motif id="environmental_storytelling">Flooded storefronts become hydroponic farms, murals memorialize the missing, ration lines stretch past corporate billboards.</motif>
  </visual_audio_motifs>

  <future_expansion_seeds>
    <seed id="industrial_wasteland">Chemical weapon stockpiles leak in the Midwest after Harrow falls, aligning with roadmap Step 31.</seed>
    <seed id="vehicle_underground">Motorcycle network connects Shelterline safe routes, supporting Step 27.1 content.</seed>
    <seed id="survival_mode">Hunger and thirst mechanics mirror refugee supply chains, reinforcing Step 28.1 systems.</seed>
  </future_expansion_seeds>

  <implementation_notes>
    <note>Mirror each narrative beat with an in-game system hook so morale, reputation, and intel choices surface in UI.</note>
    <note>When scripting dialogue, annotate each cue with faction, emotional intent, and gameplay impact.</note>
    <note>Maintain a rolling changelog appended to this file whenever major plot revisions occur to keep the memory bank auditable.</note>
  </implementation_notes>

  <usage>Use this plot bible to align missions, cinematics, and dialogue. New narrative beats must reinforce Operation Cold Iron, escalate faction stakes, or deepen the player’s connection to dismantling Harrow’s regime.</usage>
</plot_bible>
