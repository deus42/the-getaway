# Surveillance System Proposal - Step 25.5

## Overview
Implement a surveillance camera system that creates detection zones and integrates with the stealth/alert mechanics. This reinforces the dystopian regime's omnipresent monitoring and adds tactical depth to navigation and combat.

## Core Concept
**Cameras as Curfew Enforcement**: Surveillance devices that only activate during nighttime curfew hours. During the day, cameras are dormant (powered down to conserve energy). At night, they become active detection zones that escalate alerts and call ESD reinforcements.

---

## Step 25.5: Surveillance Camera System

### Phase
Phase 8: World Interactions and Advanced Stealth

### Prerequisites
- Step 20 completed (Guard perception with vision cones and alert states)
- Step 5 completed (Combat system with enemy spawning)
- Grid-based line-of-sight system functional

### Instructions
Implement surveillance cameras with detection zones, alert escalation, hacking/destruction mechanics, and integration with the regime's monitoring network.

---

## Detailed Design

### Camera Types

#### 1. **Static Surveillance Camera**
- **Appearance**: Wall-mounted camera sprite with rotating animation (reuse/adapt Phaser primitive or create simple geometric sprite)
- **Visual states**:
  - **Day (Dormant)**: Gray, no light, lens pointing down
  - **Night (Active)**: Red LED blinking, rotating servo animation
- **Detection**: Fixed 90° cone, 8-tile range, rotates between 2-4 preset angles
- **Rotation**: Sweeps left-right in 3-second cycles (configurable per camera)
- **Alert behavior**: Detects player in vision → Yellow alert (3 sec) → Red alert (calls reinforcements)
- **Locations**: ESD checkpoints, government buildings, major intersections, corporate zones
- **Curfew activation**: Powers on automatically at nighttime transition, powers off at dawn

#### 2. **Motion Sensor Camera**
- **Appearance**: Small sensor box with blinking red LED (simple rectangle + light sprite)
- **Visual states**:
  - **Day (Dormant)**: Gray box, no lights
  - **Night (Active)**: Red LED pulsing every 2 seconds
- **Detection**: 4-tile radius circle, triggers only on movement (standing still = invisible)
- **Alert behavior**: Silent alarm - tags player position for 10 seconds, increases patrol density in area
- **Locations**: Restricted zones, supply depots, armories
- **Counter**: Crouch-walk at 50% speed bypasses detection
- **Curfew activation**: Only active during nighttime curfew

#### 3. **Drone Camera (Mobile Surveillance)**
- **Appearance**: Small hovering drone with searchlight (simple circular body + cone light)
- **Visual states**:
  - **Day (Patrol)**: Drone present but searchlight off, follows patrol path passively
  - **Night (Active)**: Searchlight on, actively scans for curfew violations
- **Detection**: 90° cone, 10-tile range, follows patrol path or investigates alerts
- **Alert behavior**: Pursues player until LOS broken, then returns to patrol
- **Locations**: Open plazas, border checkpoints, outdoor Act II Highway zones
- **Counter**: Destructible (20 HP, 1 hit from any weapon), hacking redirects to false target
- **Curfew behavior**: Searchlight only active at night, daytime drones ignore player unless already in combat

---

### Detection Mechanics

#### Vision Cone Visualization
- **Color-coded overlays**:
  - **Blue**: Camera idle, safe zone
  - **Yellow**: Camera sweep incoming, <2 seconds to detection
  - **Red**: Player detected, alert active
- **Toggle visibility**: Press TAB to show/hide camera ranges (stealth HUD mode)
- **Minimap indicators**: Camera icons show facing direction and alert status

#### Detection States
1. **Idle (Blue)**: Camera sweeps pattern, no threat detected
2. **Suspicious (Yellow)**: Player glimpsed at edge of vision, 3-second grace period to break LOS
3. **Alarmed (Red)**: Full detection, alert transmitted to ESD network
4. **Disabled (Gray)**: Camera hacked or destroyed, shows static on monitor

#### Detection Factors
- **Time of day (CRITICAL)**:
  - **Daytime (Morning/Day)**: Cameras DORMANT, no detection, visual state shows powered down
  - **Nighttime (Evening/Night)**: Cameras ACTIVE, full detection enabled, red LEDs blinking
  - **Curfew enforcement**: "CURFEW ACTIVE - SURVEILLANCE ENGAGED" notification appears at dusk
- **Stealth skill modifier**: Higher Stealth reduces detection range
  - Formula: `effectiveRange = baseRange * (1 - (stealthSkill / 200))`
  - Stealth 50 = 25% range reduction, Stealth 100 = 50% reduction
- **Crouch mode**: 50% detection range when crouched (press C to toggle)
- **Power outages**: Triggering blackout disables all cameras in zone for duration
- **Camouflage clothing**: Wearing ESD uniform or civilian clothes reduces detection by 20%

---

### Alert System Integration

#### Alert Escalation
1. **Yellow Alert (Suspicious)**:
   - Camera spotted player briefly, 3-second timer starts
   - Alarm klaxon sound plays (low intensity)
   - Player has 3 seconds to break LOS or hide behind cover
   - If timer expires → Red Alert

2. **Red Alert (Compromised)**:
   - Full detection, ESD reinforcements dispatched
   - **Reinforcement mechanic**:
     - 2-4 ESD guards spawn at nearest entry point (door, elevator, stairs)
     - Arrive in 10-15 seconds (displayed as countdown timer)
     - Guards have "Investigate Camera Alert" objective, converge on last known position
   - **Lockdown**: Doors in zone auto-lock for 30 seconds (requires Hacking to bypass)
   - **Persistent alert**: Red alert lasts until player escapes zone or destroys all cameras

3. **Network Alert (Multi-Camera Detection)**:
   - If 3+ cameras detect player within 60 seconds → Network-wide alert
   - **Effect**: All ESD patrols in current map area become hostile, double patrol density
   - **Duration**: 5 minutes real-time or until player leaves area
   - **Narrative consequence**: Increases ESD Suspicion meter (affects future missions)

#### Faction Integration
- **ESD Checkpoints**: 2-3 cameras per checkpoint, cameras trigger ESD guard response
- **Shelterline Safe Houses**: No cameras (resistance has disabled them)
- **Scavenger Territory**: Cameras present but disabled/looted for parts
- **NARC Drop Zones**: Cameras hacked to show looped footage (safe passage)

---

### Countermeasures

#### 1. Hacking Cameras
- **Requirements**:
  - Hacking skill 40+ (lower skill = longer hack time, higher detection risk)
  - Within 3 tiles of camera
  - 5 AP cost, 5-second hack duration
- **Options**:
  - **Loop Footage**: Camera shows looped safe footage for 60 seconds, player invisible to camera
  - **Disable**: Permanently disables camera (shows "OFFLINE" on monitor)
  - **Redirect**: Camera "sees" false target in opposite direction, guards investigate wrong area
- **Hacking minigame** (optional implementation):
  - 3x3 grid of binary switches
  - Match pattern within 10 seconds or fail (triggers alert)

#### 2. Destroying Cameras
- **Methods**:
  - Shoot camera (requires ranged weapon, 1 bullet, 2 AP)
  - EMP grenade (disables all cameras in 5-tile radius for 30 seconds)
  - Melee destruction (requires climbing to camera, 3 AP, makes noise)
- **Consequences**:
  - **Loud method** (shooting, melee): Triggers Yellow Alert at camera's last position
  - **Silent method** (EMP, hacking): No immediate alert, but ESD patrols notice offline cameras after 60 seconds
  - **Maintenance response**: If >3 cameras destroyed in zone, ESD sends technician patrol to investigate

#### 3. Avoiding Detection
- **Blind spots**: Stay outside vision cones (use TAB to reveal ranges)
- **Timing**: Wait for camera rotation, sprint through gap when facing away
- **Crouch-walk**: Reduces speed by 50% but halves detection range
- **Cover**: Standing behind walls/objects breaks LOS even if in vision cone
- **Disguise**: Wearing ESD uniform (looted from defeated guards) reduces detection chance by 40%

---

### UI/UX Components

#### Camera Detection HUD
- **Top-right corner widget** (appears when cameras nearby):
  - Camera icon with color-coded status (blue/yellow/red)
  - "Cameras Nearby: 3" counter
  - Detection bar (fills from 0-100% when in vision)
  - "TAB - Toggle Camera Vision" tooltip

#### Minimap Integration
- **Camera icons**: Small triangular markers showing facing direction
- **Color matches alert state**: Blue (idle), Yellow (suspicious), Red (alarmed), Gray (disabled)
- **Pulse animation**: When camera is sweeping toward player position

#### Notification System
- **"CAMERA ALERT" banner**: Appears when entering Yellow/Red alert
- **Countdown timer**: "Reinforcements arriving in: 12s"
- **Audio cues**:
  - Soft beep when entering camera range
  - Louder beep + alarm when Yellow Alert
  - Klaxon siren when Red Alert

---

### World Integration

#### Map Placement Strategy
- **ESD-Controlled Zones**: High camera density (4-6 per zone)
  - Government buildings
  - Corporate checkpoints
  - Train stations
  - Border crossings
- **Neutral Zones**: Medium density (1-3 cameras)
  - Commercial districts
  - Public squares
  - Industrial warehouses
- **Resistance Zones**: No cameras or all disabled
  - Slums
  - Shelterline safe houses
  - Underground tunnels

#### Quest Integration Examples
- **"Eyes Everywhere" (Stealth Mission)**:
  - Objective: Infiltrate ESD data center without triggering any cameras
  - Reward: +100 XP, Stealth +10, unlock "Ghost" perk
  - Failure: Triggered camera = mission fail, retry or loud approach

- **"Signal Choke" (Sabotage Quest)**:
  - Objective: Hack 5 cameras in New Columbia to create blind corridor for refugee convoy
  - Mechanics: Must hack within 10-minute time limit while avoiding patrols
  - Reward: +150 XP, NARC reputation +20, unlock "Surveillance Mastery" perk

- **"False Flag" (Deception Mission)**:
  - Objective: Hack cameras to show fabricated footage of ESD brutality, upload to pirate broadcast
  - Mechanics: Requires Hacking 60, Intelligence 7, must avoid detection while uploading
  - Consequence: ESD paranoia increases, more patrols but also internal investigations slow operations

#### Environmental Storytelling
- **Destroyed cameras in Slums**: Spray-painted with resistance symbols, shot out
- **Looped footage clue**: Player notices camera showing same scene repeatedly (loop installed by previous agent)
- **Abandoned camera networks**: Act II Highway has rusted, non-functional cameras (regime can't maintain infrastructure)
- **Corporate vs ESD cameras**: Different models reveal corporate surveillance separate from government

---

### Technical Implementation

#### File Structure
```
src/game/systems/surveillance/
├── cameraSystem.ts          // Core camera logic, detection calculations, curfew toggling
├── cameraTypes.ts           // Camera type definitions and configs
├── alertManager.ts          // Alert escalation and reinforcement spawning
└── hackingMechanics.ts      // Hacking minigame and camera override

src/game/objects/
└── CameraSprite.ts          // Phaser camera game object with rotation, day/night states

src/components/ui/
├── CameraDetectionHUD.tsx   // Top-right detection widget
├── HackingInterface.tsx     // Camera hacking UI overlay
└── CurfewWarning.tsx        // Dusk notification "CURFEW ACTIVE"

src/content/
└── cameraConfigs.ts         // Per-zone camera placements and patterns
```

#### Camera Sprite Implementation (Phaser Primitives)
```typescript
// src/game/objects/CameraSprite.ts
export class CameraSprite extends Phaser.GameObjects.Container {
  private body: Phaser.GameObjects.Rectangle;
  private lens: Phaser.GameObjects.Ellipse;
  private led: Phaser.GameObjects.Circle;
  private visionCone: Phaser.GameObjects.Graphics;
  private isActive: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    // Camera body (simple rectangle - 16x12px)
    this.body = scene.add.rectangle(0, 0, 16, 12, 0x333333);

    // Camera lens (ellipse - 8x6px)
    this.lens = scene.add.ellipse(0, 2, 8, 6, 0x000000);

    // LED indicator (small circle - 3px radius)
    this.led = scene.add.circle(-6, -4, 3, 0xff0000);
    this.led.setAlpha(0); // Hidden when dormant

    // Vision cone (graphics primitive)
    this.visionCone = scene.add.graphics();

    this.add([this.body, this.lens, this.led, this.visionCone]);
    scene.add.existing(this);
  }

  setActive(active: boolean) {
    this.isActive = active;

    if (active) {
      // Night mode - red LED blinking
      this.led.setAlpha(1);
      this.scene.tweens.add({
        targets: this.led,
        alpha: { from: 1, to: 0.3 },
        duration: 1000,
        yoyo: true,
        repeat: -1
      });
      this.drawVisionCone();
    } else {
      // Day mode - powered down
      this.led.setAlpha(0);
      this.scene.tweens.killTweensOf(this.led);
      this.visionCone.clear();
      this.angle = 0; // Point lens down when dormant
    }
  }

  drawVisionCone() {
    const range = 8 * 32; // 8 tiles * tile size
    const angle = 90; // degrees

    this.visionCone.clear();
    this.visionCone.fillStyle(0x3b82f6, 0.15); // Blue translucent
    this.visionCone.beginPath();
    this.visionCone.moveTo(0, 0);
    this.visionCone.arc(0, 0, range,
      Phaser.Math.DegToRad(-angle/2),
      Phaser.Math.DegToRad(angle/2),
      false
    );
    this.visionCone.closePath();
    this.visionCone.fillPath();
  }
}
```

#### Camera Data Structure
```typescript
interface SurveillanceCamera {
  id: string;
  type: 'static' | 'motion' | 'drone';  // Removed 'dome' type
  position: Position;
  range: number;
  angle: number;           // Current facing direction (degrees)
  sweepPattern?: {
    angles: number[];      // Rotation waypoints [45, 135, 45] (left-center-right)
    speed: number;         // Degrees per second
  };
  alertState: 'idle' | 'suspicious' | 'alarmed' | 'disabled';
  detectionProgress: number;  // 0-100, fills when player in vision
  lastDetectionTime?: number;
  isHacked: boolean;
  hackExpiresAt?: number;  // Timestamp when loop footage expires
  isActive: boolean;       // True during curfew, false during day
  sprite: CameraSprite;    // Reference to Phaser sprite object
}
```

#### Integration Points
- **MainScene.ts**: Render camera sprites using CameraSprite class, sync rotation animations
- **GameController.ts**: Handle TAB key for camera vision toggle, camera interaction prompts
- **dayNightCycle.ts**: Subscribe to time-of-day changes, toggle camera.isActive on curfew start/end
- **alertSystem.ts**: Trigger reinforcements, lockdown doors, update ESD Suspicion meter
- **stealthSystem.ts**: Calculate effective detection range based on Stealth skill, crouch state, curfew status

---

### Accessibility Considerations
- **High-contrast mode**: Camera cones use bold outlines (red, yellow, blue) instead of transparent overlays
- **Audio cues**: Distinct beeps for camera proximity, alert escalation
- **Colorblind modes**:
  - Blue → Diagonal lines pattern
  - Yellow → Dotted pattern
  - Red → Solid pattern
- **Screen reader**: "Camera facing east, detection range 8 tiles, status idle"

---

### Testing Scenarios
1. **Curfew Activation**: Wait until nighttime (Evening/Night phase), verify "CURFEW ACTIVE" notification appears, all cameras power on with red LEDs
2. **Daytime Dormancy**: Verify cameras show gray/powered-down state during Morning/Day, no detection when walking past
3. **Stealth Bypass**: During curfew, walk through checkpoint with 4 cameras, time movement to rotation gaps, verify no detection
4. **Alert Escalation**: Let camera detect player at night, verify Yellow Alert → 3-second timer → Red Alert → reinforcements arrive
5. **Hacking**: Hack camera with Hacking 50 during curfew, verify loop footage lasts 60 seconds, player invisible during loop
6. **Destruction**: Shoot camera at night, verify Yellow Alert triggers, ESD patrols investigate noise
7. **Multi-Camera Alert**: Trigger 3 cameras within 60 seconds during curfew, verify Network Alert activates, all patrols hostile
8. **Crouch Detection**: Crouch-walk past motion sensor at night, verify no detection when moving slowly
9. **EMP Disable**: Throw EMP grenade at night, verify all cameras in radius go offline for 30 seconds
10. **Minimap Indicators**: Verify camera icons show facing direction and update colors with alert states (gray when dormant)
11. **Time Transition**: Stand near camera, wait for dawn transition, verify camera powers down mid-rotation
12. **Quest Integration**: Complete "Eyes Everywhere" mission during curfew without triggering cameras, verify XP reward
13. **Sprite Primitives**: Verify camera sprites render correctly using Phaser rectangles/ellipses/circles, no external assets needed

---

### Balance Considerations
- **Curfew timing**: Cameras only active during Evening/Night phases (approximately 40% of game time), allowing daytime exploration without surveillance pressure
- **Risk/reward**: Players can risk nighttime missions for better loot/XP but face camera detection, or wait until dawn for safe passage
- **Camera density**: Start conservative (1-2 per zone), increase in Act III+ high-security areas
- **Reinforcement timing**: 10-15 seconds gives player chance to hide or escape, not instant death sentence
- **Hacking skill requirements**: Hacking 40 is mid-game skill level, makes cameras feel like skill-gated obstacles
- **Destruction noise**: Shooting cameras should attract patrols but not instant alert (risk/reward trade-off)
- **EMP scarcity**: EMP grenades should be rare/expensive to prevent trivializing camera challenges
- **Curfew respite**: Players can wait/sleep until dawn to bypass camera zones, but lose time-sensitive opportunities

---

### Future Expansion Hooks
- **Step 26+**: Integrate with advanced combat AI (guards check last camera position, flank player)
- **Step 29+**: Network hacking - disable entire camera grid by hacking central server
- **Step 31+**: Resistance missions to plant camera jammers in key zones (persistent camera-free areas)
- **Multiplayer co-op**: One player hacks cameras while other sneaks through

---

## Narrative Integration

### Plot Connections
- **Act I (Miami)**: Cameras introduced at ESD checkpoint, tutorial mission teaches hacking
- **Act II (Highway)**: Rusted, non-functional cameras show regime infrastructure decay
- **Act III (New Columbia)**: High-tech dome cameras and drones showcase regime's capital power
- **Act IV (Great Lakes)**: Player can hack camera network to blind invasion staging yards

### Dialogue Hooks
- **Theo "Circuit" Anders**: "Those cameras? Lenses haven't been cleaned since '34. Half are recording static. Other half? Well, that's the problem."
- **Commander Sadiq Rahm**: "Compliance Directive 19-B mandates 24/7 surveillance. We see everything. Almost."
- **Amara Velez**: "Cameras only see what they're pointed at. Harrow can't watch every alley—that's our advantage."

### Environmental Storytelling
- Graffiti near cameras: "SMILE FOR HARROW" with lens spray-painted over
- Destroyed camera with wire harness exposed, resistance toolkit left behind
- Camera feed monitors in ESD outposts showing multiple angles of same street

---

## Why This Fits "The Getaway"
1. **Thematic Resonance**: Reinforces dystopian surveillance state, regime's omnipresent curfew enforcement
2. **Curfew Integration**: Cameras only active at night creates meaningful tension around day/night cycle, makes curfew feel enforced
3. **Tactical Depth**: Adds stealth layer beyond guard vision cones, requires planning/timing around curfew
4. **Player Agency**: Multiple solutions (avoid, hack, destroy, wait for dawn), aligns with "improvised hope" theme
5. **Progression Hook**: Hacking skill becomes valuable, ties into Tech branch skill tree
6. **Narrative Tool**: Camera footage can be plot device (evidence of war crimes, false flag operations)
7. **World-Building**: Camera density/functionality shows regime control gradient (high in capital, low in slums)
8. **Risk/Reward**: Nighttime offers better loot but camera danger, creating meaningful player choices

---

## Implementation Priority
**Recommended Phase**: After Step 20 (Guard Perception), before Step 26 (Advanced Combat AI)

**Rationale**:
- Builds on existing vision cone system
- Adds stealth complexity before AI gets smarter
- Provides Hacking skill meaningful application
- Creates high-stakes zones that reward planning

**Estimated Effort**: Medium (2-3 sessions)
- Camera rendering/rotation: 4-6 hours
- Detection logic: 4-6 hours
- Alert system integration: 3-4 hours
- UI components: 3-4 hours
- Testing/balancing: 2-3 hours

---

## Success Criteria
- [ ] Cameras dormant during daytime (gray, powered down, no detection)
- [ ] Cameras activate at nighttime curfew with "CURFEW ACTIVE" notification
- [ ] Camera sprites render using Phaser primitives (rectangles, ellipses, circles, graphics)
- [ ] Red LED blinks when camera active at night
- [ ] Player can see camera vision cones and rotation patterns during curfew
- [ ] Detection triggers Yellow → Red alert escalation
- [ ] Hacking cameras disables or loops footage
- [ ] Destroying cameras triggers investigation response
- [ ] Reinforcements spawn and patrol toward last detection point
- [ ] Minimap shows camera positions and alert states (gray when dormant)
- [ ] TAB toggles camera vision overlay
- [ ] Stealth skill modifies detection range
- [ ] Time transitions (dawn) power down cameras mid-rotation
- [ ] Quest objectives integrate camera challenges
- [ ] Performance: 20+ cameras in zone with no framerate drop

---

**Status**: Proposal - Awaiting approval and roadmap integration
