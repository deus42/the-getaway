---
category: engineering
status: target-architecture
canonical-for: implementation-ownership
---

# Architecture

This document defines **how** the approved Tokyo escape specification is implemented. It is target architecture, not a claim that the current protected worktree already conforms.

Authority flows from current requester directives through [[01 MVP/12 Game Design Decision Register]] and the canonical system specifications into this document. Architecture may clarify ownership and data flow; it may not change player behavior. Any conflict returns to the specification and review queue before code changes continue.

## 1. Architectural principles

1. **Specification before runtime.** No gameplay recovery or reimplementation begins until the documentation gate in `AGENTS.md` is satisfied.
2. **One authority per state.** Redux owns persistent/domain state, Phaser owns frame-local presentation and simulation objects, React owns DOM presentation and player input for overlays, and content manifests own authored data.
3. **Mission semantics and accepted geometry have separate authority.** The mission skeleton owns required places, route purposes, stable semantic IDs, and player behavior. The current requester-accepted versioned Blender master owns detailed visible geometry. `Level0LayoutContract` is the one reconciled runtime record for walkability, footprints, entrances, occlusion, and gameplay anchors; neither a rejected greybox nor an unaccepted render may silently redefine the other authority. A descendant visual ticket may replace massing only through a new identity plus an executable invariant-route/anchor gate, never by mutating the accepted recipe.
4. **Truthful perception.** Surveillance rendering and detection consume the same resolved geometry and occlusion data.
5. **Explicit effects.** Dialogue, interactions, terminals, and mission transitions commit typed effects; no component mutates unrelated domains opportunistically.
6. **Deterministic recovery.** Autosave and `OperationAttemptBaseline` are distinct persisted records. `restartAttempt` restores the complete departure baseline rather than reversing later events.
7. **Knowledge is state.** Facts and discovery control what the dossier, minimap, George, dialogue, and objectives may reveal.
8. **Pause is ownership, not a boolean.** Every pause surface acquires a reason; simulation resumes only when all reasons release.
9. **Human evidence outranks technical proxies.** Validators and tests protect contracts. Live human-control behavior and inspected frames prove the game.
10. **Retired code has no design authority.** Existing Ghost/Wire/Force, A*, combat, AutoBattle, storylet, reputation, and inventory code may be archived, removed, or selectively salvaged only after recovery; its presence cannot justify behavior.
11. **Provisional means reversible.** An unresolved `OPEN-*` recommendation may be encoded only through an authored constant, content record, manifest, or isolated presentation seam that is named in progress evidence and can be replaced without rewriting unrelated systems.

## 2. Runtime boundaries

### React application shell

React owns:

- main menu and New Game entry;
- cover-select;
- four-lane HUD DOM;
- dialogue, Character screen, dossier, feed, terminal, debrief, failure, Restart Attempt, completion, and Game Design Bible overlays;
- localization rendering;
- accessible focus, keyboard routing, and modal ownership;
- creation/destruction of the Phaser canvas boundary.

React does not calculate camera detection, move actors, choose routes, or directly mutate Phaser objects.

### Redux domain store

Redux owns serializable run state:

- identity and build;
- Paranoia tiers and ability state;
- world clock and pause reasons;
- mission/objective/fact/outcome ledgers;
- discovered map knowledge;
- surveillance network state and last-known position;
- contact/dialogue state;
- safehouse, autosave metadata, and `OperationAttemptBaseline` metadata;
- settings and localization.

Reducers accept typed domain events and remain deterministic. Selectors produce read models for React, Phaser synchronization, save serialization, George prompts, and diagnostics.

### Phaser runtime

Phaser owns frame-local world behavior:

- projected environment and dynamic actor rendering;
- direct movement intent and collision sliding;
- camera follow, pan, zoom, and observation framing;
- interaction hit testing against layout semantics;
- camera sweep, shared visibility geometry, drone movement, and authored NPC schedules;
- depth/occlusion presentation;
- runtime audio positioning and live visual feedback.

Phaser reports domain events to Redux. It does not persist authoritative mission outcomes in display objects.

### Authored content layer

Typed content modules/manifests own:

- Level 0 layout contract;
- mission/objective definitions;
- facts and checks;
- dialogue graphs and localized content;
- schedules;
- hiding/blending contexts;
- terminals and surveillance devices;
- George prompts;
- the curated finalized-only bilingual Game Design Bible catalog, its stable topic IDs, and non-rendered source/decision traceability metadata;
- audio cue registry;
- art and actor manifests;
- acceptance fixtures and deterministic diagnostics.

### Production tooling

Tooling owns:

- Neo Tokyo source inventory and license metadata;
- Blender master-scene recipe and deterministic export;
- semantic mask/anchor extraction;
- art, actor, layout, localization, and content validation;
- fixed-viewport capture;
- AI playtest regression evidence.

Tool output never marks a player-experience gate accepted automatically.

### Active Level 0 runtime seam

The shipping application entry mounts the canonical Level 0 runtime island through `src/App.tsx` and `src/components/level0/Level0RuntimeShell.tsx`. The island deliberately does not mount the retired `GameController`, `BootScene`, `MainScene`, A* input modules, tactical-combat managers, or whole-root prototype hydration. Those modules remain recoverable source until their owning tickets salvage or remove them, but they are not part of ordinary New Game.

Current ownership is explicit:

- `src/content/levels/level0/layoutContract.ts` is the authored runtime topology;
- `src/game/level0/layout/` owns validation and the reversible 64×32 projection adapter;
- `src/game/level0/movement/directMovement.ts` owns direct intent, local collision sampling, and axis sliding;
- `src/game/level0/interaction/interactionResolver.ts` owns knowledge, independently derived world-ownership, range, occlusion, and authoritative availability results; automatic discovery filters unknown or wrong-domain anchors instead of revealing their existence through an error;
- `src/game/level0/art/` owns the T4 named-source city contract and the T5 production-profile resolver. The normal route selects the registered GET-205 Hidzu derivative; `visualTreatment=get204-1` is the explicit T4 diagnostic fallback, `visualProfile=desktop|mobile` is a diagnostic override, and ordinary profile selection uses viewport width. Every T5 layer retains T4 target/layout ownership and versioned Neo Tokyo 2 source provenance;
- `src/game/level0/runtime/` owns authored-ID map knowledge, the clock, safehouse effects, exact schema and spatial validation, transient-pause normalization, autosave, the immutable `OperationAttemptBaseline`, and the `restartAttempt` action;
- `src/game/level0/rpg/` owns cover validation, the authored ability/gate catalogs and pure gate resolver, Paranoia tier derivation, Paranoia/research ledgers, provisional tuning tables, breakdown transitions, and safehouse research rules;
- `src/store/level0RuntimeSlice.ts` is the isolated serializable domain lane;
- `src/game/level0/scene/Level0Scene.ts` owns live city-layer composition, explicit diagnostic fallback, separate actor transforms/hard foreground occlusion, camera, generation-safe GET-205 lighting-set transitions, and input. It renders one geometry-stable production composition from registered background tiles and same-source foreground crops; protagonist position or zoom must never replace one architectural plate with another or mutate actor scale;
- `src/game/level0/playtest/level0AgentBridge.ts` derives diagnostics from the same store/layout and may dispatch only normal runtime events;
- `src/content/gameBible/` owns the finalized English/Ukrainian reference catalog, shared language-neutral rules, search extraction, relations, topic coverage, and non-rendered traceability; `src/components/level0/Level0GameBible.tsx` owns its accessible presentation and cannot dispatch game-domain effects;
- `art/iso-assets/contracts/level0-layout-contract.json` is the deterministic Blender-facing export of the same contract.

The current realized GET-205 v4 asset pipeline is manifest-driven. `art/blender/get205/manifests/wet-blue-black-v4-states.json`, `safehouse-cleanup-v1.json`, and `reference-delta-v1.json` declare the three Cycles source states, bounded connected-component removal, and fixed-frame visual gates. `render_wet_blue_black_states.py` derives aligned people-free dusk, blue-hour, and curfew plates plus sixteen foreground silhouettes per state from the recoverable v4 master. `scripts/build-get205-runtime-assets.mjs` validates the complete matrix in staging and atomically publishes schema-v2 desktop and mobile profiles under `public/environment/level0/get205-hidzu-production-v1/`; failed validation or post-swap readback restores the prior public root. Placement, crop, depth, camera, fit, and occlusion metadata remain state-independent; each asset nests only `path`, `sha256`, and `bytes` under its three lighting states. The runtime imports that manifest through a typed phase resolver rather than duplicating asset paths or anchors in scene code. This v4 runtime was visually rejected on 2026-08-11 and is recoverable technical salvage, not the accepted endpoint.

The approved but not yet realized GET-205 v5 boundary uses new recipe identity `get205-dense-four-block-v5` and runtime identity `get205-dense-four-block-production-v2`. Before facade or runtime work it must version the two roads, three alleys, crossing, safehouse threshold/court, traversal loops, and all required anchor-clearance discs; reject new footprints that intersect them; keep the recovered 24-point table's 14 Class A geometry/bounds outcomes invariant; record fresh v5 outcomes for its 10 actor/interstitial/guard-dependent Class B points; and pass a fixed-registration building-pixel-fraction band against the locked blend. After massing and hero approval, v5 regenerates the three state masters, 12–16 independent identity cutouts/depth anchors, collision/placement pins, profiles, hashes, budgets, and regression baselines. Until those gates pass and publication swaps atomically, the realized v4 architecture remains current and no v5 identity may resolve at runtime.

The retired `the-getaway-state` schema remains disabled. Level 0 schema/runtime content version 3 uses independent autosave and `OperationAttemptBaseline` keys plus exact nested envelopes, so legacy or stale development saves cannot hydrate or overwrite the canonical run. Validation checks the authored `CoverIdentity`, held ability IDs, research-state map, committed gate verdicts, ordered Paranoia event history, announced tier history, research events, camera-group attempt history, grounding usage, Cold Iron evidence state, processed clock boundaries, and the internal Paranoia value. It also rejects non-walkable player/last-known positions, non-unit facing, mismatched generation/seed/layout identity, inconsistent clock boundaries, and cause-specific failure data that does not match the authoritative ledgers. `OperationAttemptBaseline` additionally requires the authored departure anchor and carries the complete cover, ability, research, Paranoia, surveillance, recovery, and schedule state. Transient overlay pause owners are never serialized; hydration derives only durable failure/completion ownership. Departure persists the baseline before the departed autosave, rejects stale-session or divergent-state conflicts, and recreates Phaser at the committed departure transform. Player transforms are checkpointed only after change at a bounded cadence rather than stored every render frame. Exact layout dimensions, start zoom, movement speed, safehouse policy, ability/gate mappings, research options, and unresolved surveillance/art values remain provisional while their `OPEN-*` decisions are unresolved.

## 3. Application lifecycle

The target lifecycle is:

```text
BOOT
  → MAIN_MENU
  → L0_COVER_SELECT
  → L0_SAFEHOUSE_INTRO
  → L0_LIRA_BRIEFING
  → L0_PREPARATION
  → L0_OPERATION_DEPARTED
  → L0_INFILTRATION
  → L0_MEDKITS_SECURED
  → L0_ESCAPE
  → L0_LIRA_RETURN
  → L0_TRANSIT_VALIDATION
  → L0_DEBRIEF
  → L0_COMPLETE
  → CONTINUE_EXPLORING | END_DEMO
```

Scene loading is an application side effect between valid cover confirmation and `L0_SAFEHOUSE_INTRO`, not a second mission state. Any authored run failure enters `L0_FAILED` with one exact `failure.*` cause and exposes Restart Attempt only when an `OperationAttemptBaseline` exists. `failure.save_incompatible` prevents Level 0 hydration and offers New Game. Miami is continuation data only; no Level 1 scene is loaded.

Starting or restarting a run must:

1. stop and dispose the previous Phaser scene/runtime;
2. clear frame-local event handlers, timers, audio, and pause ownership;
3. initialize or hydrate only the current save schema;
4. load the correct layout/art/schedule state;
5. create the protagonist from `CoverIdentity` and `RunAbilities`;
6. center the camera and broadcast current viewport knowledge before input;
7. expose the correct React surface with no stale overlay or focus owner.

## 4. State ownership map

| Domain | Authority | Runtime mirror | Persisted | Notes |
|---|---|---|---|---|
| Cover/abilities/research | Redux | Actor/portrait selection and gate presentation | Yes | No free-text name, numeric build, XP, level, or package state. |
| Paranoia and ability locks | Redux | HUD and transient feedback | Yes | Changes only through authored effects; locks derive from the tier at read time. |
| Mission/objectives/facts/outcomes | Redux | Markers, prompts, debrief | Yes | Stable keys and provenance. |
| World time/schedules | Redux clock | Phaser schedule evaluation | Yes | Frame deltas emit clock progress only while unpaused. |
| Pause ownership | Redux | Phaser active/frozen gate | Yes for save-safe states | Additive reason set. |
| Surveillance state | Redux | Phaser detection/search presentation | Yes | Geometry remains content/runtime derived. |
| Actor transforms | Phaser during play | Redux checkpoint records only | Baseline/autosave | Avoid per-frame Redux position churn. |
| Discovery/minimap knowledge | Redux | Minimap/world emphasis | Yes | Unknown content cannot leak. |
| Dialogue state | Redux/content graph | React overlay | Yes | Effects commit atomically. |
| Safehouse/autosave/Restart Attempt | Persistence service + Redux metadata | React actions | Yes | `OperationAttemptBaseline` is a separate record restored only by `restartAttempt`. |
| Camera/viewport | Phaser | React minimap scroller read model | No | Reinitialized deterministically. |
| Audio instances | Phaser/audio service | None | No | Derived from current domain events/state. |

## 5. Public typed contracts

The names below are required public concepts. Exact module locations may change during recovery, but the semantic fields and ownership must remain explicit and typed.

### Level0LayoutContract

```ts
type Level0SurfaceKind =
  | 'road'
  | 'sidewalk'
  | 'crossing'
  | 'alley'
  | 'plaza'
  | 'interior-boundary'
  | 'blocked';

type Level0AnchorKind =
  | 'safehouse'
  | 'contact'
  | 'entrance'
  | 'terminal'
  | 'camera'
  | 'drone-launch'
  | 'hiding'
  | 'blending'
  | 'objective'
  | 'interaction'
  | 'audio';

type Level0TraversalLoopId =
  | 'loop.public-contact'
  | 'loop.logistics-service'
  | 'loop.outer-escape';

interface Level0TraversalLoopDisplayName {
  loopId: Level0TraversalLoopId;
  localizedDisplayNameKey: string;
}

interface Level0VerificationLane {
  id: 'verification.lane.level0';
  entryBoundary: WorldSegment;
  committedRegion: WorldPolygon;
  exitBoundary: WorldSegment;
  queueRailOccluderIds: string[];
  floorFlowAnchorIds: string[];
  instructionDisplayAnchorId: string;
}

interface Level0BlendingContext {
  id: string;
  region: WorldPolygon;
  entryAnchorId: string;
  seatedCapacity: 2 | 3;
  standingCapacity: number;
  seatAnchorIds: string[];
  standingAnchorIds: string[];
  scheduleId: string;
}

interface Level0LayoutContract {
  id: string;
  schemaVersion: number;
  projection: { tileWidth: 64; tileHeight: 32; orientation: 'isometric-2:1' };
  bounds: WorldPolygon;
  zones: Level0Zone[];
  traversalLoops: Level0TraversalLoop[];
  traversalLoopDisplayNames: Level0TraversalLoopDisplayName[];
  surfaces: Level0SurfaceRegion[];
  buildingFootprints: Level0BuildingFootprint[];
  entrances: Level0Entrance[];
  droneRegions: Level0DroneRegion[];
  verificationLanes: Level0VerificationLane[];
  blendingContexts: Level0BlendingContext[];
  anchors: Level0Anchor[];
  occluders: WorldPolygon[];
  semanticMaskIds: string[];
  artLayerIds: string[];
}
```

The contract is authored from approved rules plus explicitly recorded provisional layout data. Both Blender export and Phaser runtime consume it. The three stable loop IDs resolve through localization to **Transit Road**, **Market Ring**, and **Outer Space** without renaming internal IDs. The one verification-lane record aligns the authored pedestrian rails/arrows/panel with the runtime commitment boundaries. A blending context records visible seated and standing capacity; its runtime occupants may never exceed the declared anchors. Exact dimensions and anchors remain non-final while their review items are open and must stay replaceable through this contract.

### Cover identity and abilities

```ts
interface CoverIdentity {
  coverId: Level0CoverId;            // one protagonist, four authored covers; slice ships one playable
  appearancePresetId: string;        // derived from the cover, validated against the sprite manifest
}

interface AbilityDefinition {
  id: Level0AbilityId;               // stable authored key
  tag: 'hardened' | { fragile: 'uneasy' | 'shaken' };  // lock tier for fragile abilities
}

interface RunAbilities {
  heldAbilityIds: readonly Level0AbilityId[];   // cover start + completed research
  researchState: Record<Level0ResearchOptionId, 'unavailable' | 'available' | 'consumed'>;
}
```

The ability catalog, tags, and lock tiers are versioned authored content (`OPEN-ABL-001`); the run persists only held IDs and research state. Lit/locked derivation is computed from the Paranoia tier at read time and never stored.

### Deterministic gates

```ts
interface GateRequirement {
  id: Level0GateId;
  abilityPath: Level0AbilityId | null;
  factPath: Level0FactId | null;
  costedPath: Level0GateCostId | null;   // declared worse-but-real alternative
}

interface GateVerdict {
  gateId: Level0GateId;
  met: boolean;
  reasonId: string;                       // exact reason: missing ability, locking tier, missing fact, or cost
  presentation: 'preview' | 'result';
}
```

The resolver is pure and deterministic, modeled on the interaction resolver's `{status, reasonId}` pattern. The same verdict renders before selection (`preview`) and after commitment (`result`); no arithmetic exists anywhere. Every authored gate keeps at least two non-null paths (`GDR-RPG-009`), and every nonfatal failure commits a declared `failForwardEffectId`.

### Facts and discovery

```ts
interface FactAcquisition {
  acquisitionId: string;
  factId: string;
  sourceKind: 'opening' | 'dialogue' | 'observation' | 'interaction' | 'check';
  sourceId: string;
  acquiredAtWorldMinute: number;
  contextId?: string;
}

interface KnownFact {
  factId: string;
  acquisitions: FactAcquisition[];
  appliedEffectIds: string[];
}

type ColdIronEvidenceState =
  | 'unknown'
  | 'naila_warning'
  | 'manifest_recognized'
  | 'manifest_copied';

interface FactLedger {
  known: Record<string, KnownFact>;
  coldIronEvidence: ColdIronEvidenceState;
}

interface MapKnowledgeState {
  discoveredLocationIds: string[];
  discoveredCameraIds: string[];
  discoveredTerminalIds: string[];
  discoveredHidingContextIds: string[];
  discoveredBlendingContextIds: string[];
  objectivePrecision: Record<string, 'hidden' | 'district' | 'area' | 'entrance' | 'exact'>;
}
```

Facts are stable authored keys with declared effects. The general ledger remains binary: a fact is known or unknown. The dedicated `ColdIronEvidenceState` is the only staged evidence chain and advances in order from `unknown` through Naila's warning and manifest recognition to an explicit manifest-copy interaction. Copying costs exactly five world minutes, has no additional check, and is idempotent. The first valid acquisition creates the `KnownFact` and atomically records the declared effect IDs after they apply. A later valid acquisition may append or refine provenance through a unique `acquisitionId`, but it cannot reapply an effect already present in `appliedEffectIds`. Discovery and facts are related but not interchangeable.

### Surveillance

```ts
type SurveillanceLevel = 'clear' | 'suspicious' | 'pursuit';
type SurveillanceRuleBreakKind =
  | 'restricted-area-breach'
  | 'protected-interaction'
  | 'medkit-removal'
  | 'failed-verification'
  | 'detected-camera-feed-change';
type CameraGroupAttemptHistory = 'unused' | 'active' | 'clean' | 'traced';
type NeedlePresentationState = 'neutral-patrol' | 'verification' | 'pursuit';

interface CameraPresentationCue {
  cameraId: string;
  status: 'inactive' | 'active' | 'focused' | 'looped';
  ledToken: string;
  irGlintVisible: boolean;
  pavementCueRegionId?: string;
  coverageRevision: string;
}

interface ObservationEvidence {
  observerId: string;
  observedAtWorldMinute: number;
  position: WorldPoint;
  visible: boolean;
  occluderIds: string[];
}

interface SurveillanceRuleBreakEvidence {
  evidenceId: string;
  kind: SurveillanceRuleBreakKind;
  sourceId: string;
  observedById: string;
  observedAtWorldMinute: number;
  position: WorldPoint;
}

interface SurveillanceLedgerEntry {
  entryId: string;
  kind: 'sighting' | 'detected-camera-feed-change' | 'needle-verification' | 'capture';
  sourceId: string;
  worldMinute: number;
  position: WorldPoint;
  ruleBreakEvidenceId?: string;
}

interface SurveillanceState {
  level: SurveillanceLevel;
  sourceDeviceId?: string;
  sourceActorId?: string;
  activeObserverIds: string[];
  recognitionSourceIds: string[];
  cameraGroupHistory: Record<string, CameraGroupAttemptHistory>;
  ledger: SurveillanceLedgerEntry[];
  lastTransitionReasonId?: string;
  lastKnownPosition?: WorldPoint;
  lastObservedAtWorldMinute?: number;
  suspiciousSinceWorldMinute?: number;
  pursuitSinceWorldMinute?: number;
  searchAreaId?: string;
  traceProvenance?: {
    terminalId: string;
    cameraGroupId: string;
    createdAtWorldMinute: number;
  };
  verificationProvenance?: {
    verifierId: string;
    verifiedAtWorldMinute: number;
  };
  droneAssignment?: {
    droneId: string;
    target: WorldPoint;
    phase: 'dispatching' | 'verifying' | 'searching' | 'returning';
  };
}

interface CaptureReportReadModel {
  corporationDisplayNameKey: string;
  sightings: Array<{
    sourceId: string;
    worldMinute: number;
    position: WorldPoint;
  }>;
  detectedTampering: SurveillanceLedgerEntry[];
  needleVerifications: SurveillanceLedgerEntry[];
  captureEvidence: SurveillanceLedgerEntry;
  connectedSightlineSegmentIds: string[];
  disconnectedGapCount: number;
}
```

Runtime geometry emits raw `ObservationEvidence`. A separate rule-break resolver emits `SurveillanceRuleBreakEvidence` only for the five approved behaviors. The transition owner may create concern or Paranoia only when valid visibility and valid rule-break evidence coincide; ordinary public camera visibility is inert. `CameraPresentationCue` is derived from the same device state and coverage revision consumed by detection and Observation, so LED, IR glint, pavement cue, and exact discovered geometry cannot disagree. Solid geometry and ordinary occlusion create blind spots without an off-grid zone type. Returning fully to `clear` empties recognition sources and makes later ordinary public visibility harmless until another observed rule break.

Each camera group has one attempt-long history. Activation may expire, but `clean` or `traced` remains authoritative until `restartAttempt`; Level 0 authors exactly one usable group. `Needle` is the localized player-facing name for the single verifier drone, while its internal ID remains stable. Its presentation state is derived from network/controller state: `neutral-patrol` uses warm-white/amber, while `verification` and `pursuit` alone use crimson. Civilians consume only current visible camera, Needle, and player-behavior presentation signals; they never read this hidden ledger, raise reports, or mutate surveillance.

The capture-report selector reads only the surveillance ledger. It may connect sightings that the ledger can actually relate, but it never interpolates the protagonist's full movement path; unseen gaps remain disconnected. `CaptureReportReadModel` is unavailable for deadline and breakdown failures.

### World clock and pause

```ts
type PauseOwner =
  | 'menu'
  | 'settings'
  | 'cover_select'
  | 'character'
  | 'dossier'
  | 'social_feed'
  | 'dialogue'
  | 'observation'
  | 'terminal'
  | 'safehouse_action'
  | 'george_consultation'
  | 'interception'
  | 'restart_attempt_confirmation'
  | 'debrief'
  | 'mission_recap'
  | 'failure'
  | 'completion';

type Level0ClockBoundaryId =
  | 'clock.2100'
  | 'clock.2130'
  | 'clock.2200'
  | 'clock.2330';

interface WorldClockState {
  currentMinute: number;
  phase: 'dusk' | 'blue-hour' | 'curfew';
  curfewActive: boolean;
  deadlineReached: boolean;
  processedBoundaryIds: Level0ClockBoundaryId[];
  pauseOwners: PauseOwner[];
  scheduleStates: Record<string, string>;
}

interface GroundingActionDefinition {
  actionId: 'grounding.transit-road-vending-coffee' | 'grounding.market-ring-shrine';
  anchorId: string;
  worldMinuteCost: 10;
  paranoiaDelta: -10;
  usesPerAttempt: 1;
}

interface Level0AttemptRecoveryState {
  usedGroundingActionIds: GroundingActionDefinition['actionId'][];
  difficultSurveillanceEscapeReliefUsed: boolean;
}
```

Frame time advances the clock only when `pauseOwners` is empty and the run is in an active exploration state. Boundary IDs persist as an idempotency set so 21:00, 21:30, 22:00, and 23:30 each fire exactly once across pause, autosave, hydration, and explicit clock jumps. Attempt recovery state makes both ten-minute/−10 grounding actions one-use and limits the qualifying difficult-escape relief to one −5 event. George's once-per-attempt threshold history remains the single existing `Level0RpgLedger.announcedParanoiaTiers` record rather than a duplicate recovery field.

### Safehouse and Restart Attempt

```ts
interface SafehouseState {
  insideBoundary: boolean;
  operationAttemptBaselineCreated: boolean;
  recoveryAvailable: boolean;
  transitCredentialState: 'not-issued' | 'issued' | 'validated';
  debriefAvailable: boolean;
  usedActionIds: string[];
}

interface SafehouseActionAvailability {
  actionId: string;
  available: boolean;
  blockedReasonId?: string;
  evaluatedAgainstSurveillanceLevel: SurveillanceLevel;
  directlyObserved: boolean;
}

interface RuntimeGenerationState {
  generationVersion: string;
  seed: string;
  authoredVariantIds: Record<string, string>;
}

type Level0MissionState =
  | 'L0_COVER_SELECT'
  | 'L0_SAFEHOUSE_INTRO'
  | 'L0_LIRA_BRIEFING'
  | 'L0_PREPARATION'
  | 'L0_OPERATION_DEPARTED'
  | 'L0_INFILTRATION'
  | 'L0_MEDKITS_SECURED'
  | 'L0_ESCAPE'
  | 'L0_LIRA_RETURN'
  | 'L0_TRANSIT_VALIDATION'
  | 'L0_DEBRIEF'
  | 'L0_COMPLETE'
  | 'L0_FAILED';

type ObjectiveStatus =
  | 'hidden'
  | 'available'
  | 'active'
  | 'completed'
  | 'failed'
  | 'superseded';

interface ObjectiveState {
  objectiveId: string;
  status: ObjectiveStatus;
  completedAtWorldMinute?: number;
}

type ObjectiveStateRecord = Record<string, ObjectiveState>;

interface ContactState {
  consulted: boolean;
  lastDialogueNodeId?: string;
  acquiredFactIds: string[];
}

type ContactStateRecord = Record<'lira' | 'naila' | 'brant', ContactState>;

interface OperationAttemptBaseline {
  schemaVersion: 3;
  contentVersions: Record<string, string>;
  sessionId: string;
  createdAtWorldMinute: number;
  identity: PlayerIdentity;
  identity: CoverIdentity;
  abilities: RunAbilities;
  rpg: Level0RpgLedger;
  paranoia: number;
  recovery: Level0AttemptRecoveryState;
  worldClock: WorldClockState;
  mission: Level0MissionState;
  objectives: ObjectiveStateRecord;
  facts: FactLedger;
  mapKnowledge: MapKnowledgeState;
  contacts: ContactStateRecord;
  safehouse: SafehouseState;
  surveillance: Level0SurveillanceRuntimeState;
  player: Level0PlayerRuntimeCheckpoint;
  runtimeGeneration: RuntimeGenerationState;
  completion: Level0RunState['completion'];
}

interface OperationAttemptBaselineReadback {
  departureWorldMinute: number;
  contactsConsulted: Array<'naila' | 'brant'>;
  paranoia: number;
  localizedRestorationMeaningKey: string;
}
```

`OperationAttemptBaseline` is written once when the player explicitly leaves the safehouse for the operation. George reads the actual departure time, consulted contacts, the Paranoia tier, held abilities, and restoration meaning through `OperationAttemptBaselineReadback` before confirmation. The player-facing **Restart Attempt** action dispatches `restartAttempt`, which hydrates the baseline as a whole and clears all post-departure runtime state. The confirmation overlay owns only `restart_attempt_confirmation`.

### George prompts

```ts
interface GeorgePrompt {
  id: string;
  allowedContexts: Array<'hud' | 'observation' | 'safehouse' | 'dossier'>;
  requiredFactIds: string[];
  requiredMissionStates: string[];
  excludedSurveillanceStates?: SurveillanceLevel[];
  localizedQuestionKey: string;
  localizedResponseKey: string;
  unavailableReasonKey?: string;
  effect: 'none';
}
```

George prompts are authored, contextual, informational, and effect-free. Every unavailable or incomplete answer resolves to an authored truthful reason: missing discovery, non-networked space, absent source, or insufficient current evidence. Silence is never encoded as hidden gameplay information. George has no personal desire, deletion request, or Miami freedom arc in Level 0. He never accepts unrestricted free text in Level 0.

### Outcome ledger

```ts
interface Level0OutcomeLedger {
  acceptedAt: number;
  departedAt: number;
  completedAt: number | null;
  primaryTiming: 'dusk_public' | 'curfew_service' | 'mixed';
  contactsConsulted: Array<'lira' | 'naila' | 'brant'>;
  factsAcquired: Array<{
    factId: string;
    acquisitionIds: string[];
  }>;
  cameraGroupHistory: Record<string, CameraGroupAttemptHistory>;
  networkPeak: 'clear' | 'suspicious' | 'pursuit';
  needleVerified: boolean;
  hidingContextsUsed: string[];
  blendingContextsUsed: string[];
  interceptionOutcome: string | null;
  paranoiaTierPeak: string;
  researchCompleted: readonly string[];
  paranoiaPeak: number;
  medkitsRecovered: boolean;
  medkitsReturned: boolean;
  coldIronEvidence: ColdIronEvidenceState;
  transitValidated: boolean;
  failureCause:
    | 'failure.breakdown'
    | 'failure.paranoia'
    | 'failure.capture'
    | 'failure.deadline'
    | null;
}
```

Content may add stable detail fields only through a specification update. Debrief reads this ledger; it does not reconstruct outcomes from display logs.

### Art and actors

```ts
interface ActorLightRegion {
  id: string;
  bounds: WorldPolygon;
  semanticTint: 'amber' | 'cyan';
  intensity: number;
  priority: number;
}

interface Level0ArtManifest {
  schemaVersion: 2;
  id: string;
  usage: 'candidate-evidence' | 'runtime';
  compositionStage: 'four-block-source' | 'quality-lookdev' | 'live-candidate';
  recipeId: string;
  layoutContractId: string;
  projection: { tileWidth: 64; tileHeight: 32; orientation: 'isometric-2:1' };
  worldOrigin: WorldPoint;
  canvas: {
    width: number;
    height: number;
    pixelOrigin: WorldPoint;
    tileSize: number;
    columns: number;
    rows: number;
  };
  actorLightRegions: ActorLightRegion[];
  budget: { maxTotalBytes: number; maxTileBytes: number; measuredTotalBytes: number };
  layers: Array<{
    id: string;
    kind: 'ground' | 'architecture-back' | 'architecture-front' | 'lighting-foundation' | 'semantic-mask';
    state?: 'dusk' | 'blue-hour' | 'curfew';
    maskId?: string;
    tiles: Array<{
      id: string;
      imagePath: string;
      sha256: string;
      byteSize: number;
      column: number;
      row: number;
      x: number;
      y: number;
      width: number;
      height: number;
    }>;
    fallbackLayerId: string;
  }>;
  anchorMetadata: { path: string; sha256: string; count: number };
  fallbackProfile: 'level0-t4-live-city';
}

type CharacterState = 'idle' | 'move' | 'interact';
type CharacterDirection =
  | 'north'
  | 'north-east'
  | 'east'
  | 'south-east'
  | 'south'
  | 'south-west'
  | 'west'
  | 'north-west';

interface CharacterSpriteManifestEntry {
  actorId: string;
  ownership: 'player' | 'contact' | 'security' | 'civilian';
  spriteSetId: string;
  bindings: {
    appearancePresetIds?: readonly string[];
    dialogueIds?: readonly string[];
    resourceKeys?: readonly string[];
    visualRoleKey?: string;
  };
  frameSize: { width: 64; height: 96 };
  frameCount: 4;
  stateFps: Record<CharacterState, number>;
  origin: { x: 0.5; y: 0.92 };
  footAnchorTolerancePx: 2;
  worldScale: number;
  alphaOccupancy: { minHeightPx: number; maxHeightPx: number; footRowPx: number; tolerancePx: 2 };
  depthPolicy: 'ground-anchor-y';
  portrait: CharacterPortraitManifestEntry;
  fallback: { kind: 'neutral-diagnostic'; rigKey: string };
  provenance: CharacterAssetProvenance;
}

interface CharacterPortraitManifestEntry {
  portraitId: string;
  path: string;
  dimensions: { width: 256; height: 256 };
  safeArea: { x: number; y: number; width: number; height: number };
  sha256: string;
  compressedBytes: number;
  decodedBytes: number;
  fallbackKey: 'portrait:neutral-diagnostic';
}

interface NonWorldPresentationManifestEntry {
  presentationId: string;
  path: string;
  dimensions: { width: 256; height: 256 };
  safeArea: { x: number; y: number; width: number; height: number };
  sha256: string;
  compressedBytes: number;
  decodedBytes: number;
  background: 'opaque' | 'transparent';
  fallbackKey: 'portrait:neutral-diagnostic' | 'ar:neutral-diagnostic';
  provenance: CharacterAssetProvenance;
}

interface CharacterAssetProvenance {
  recipeId: string;
  recipeSha256: string;
  generatorSha256: string;
  pngLibrarySha256: string;
  spriteReferenceId: string;
  spriteReferenceSha256: string;
  portraitReferenceId: string;
  portraitReferenceSha256: string;
}

declare const getCharacterSpriteSheetPath: (
  spriteSetId: string,
  state: CharacterState,
  direction: CharacterDirection
) => string;
```

The sheet matrix is derived from the stable actor/state/direction path function rather than duplicated inside every manifest entry. `Level0Scene` resolves one explicit presentation plan and passes the same typed sheet references through preload, loaded-state checks, and animation registration: all 24 `idle`/`move`/`interact` direction leaves for the selected protagonist, plus only fixed-facing `idle`/`interact` leaves for Lira, Naila, and Brant (30 sheets total). This prevents loading unused contact movement/directions or the other eight actor sets while retaining the complete validated inventory for later tickets. Layout-space motion is projected through the 2:1 isometric basis before eight-direction animation selection.

Actor tint samples authored `ActorLightRegion` metadata at the actor foot anchor. The reversible `OPEN-ART-005` baseline selects only the strongest overlapping region, eases changes over 250 ms, and applies restrained semantic amber/cyan palette tokens. The tint renderer is presentation-only: it cannot enter visibility, surveillance, collision, movement, interaction, or schedule calculations.

A generated integrity module owns portrait/non-world hashes and byte counts; sheet metrics remain adjacent to each actor directory. The validator independently compares those generated TypeScript records with the central integrity JSON so updating source PNGs and only one generated surface cannot pass. Required actors must pass complete-matrix, pixel-derived anchor/occupancy, portrait/provenance/path, generated-record parity, and fault-injection validation before production acceptance. Fallback is observable neutral resilience, never a rejected fantasy asset or acceptance evidence. Performance measurements are recorded, but shipping acceptance remains blocked until `OPEN-PERF-001` defines target hardware and numeric ceilings.

The four current appearance IDs are defined once by the actor manifest and reused by selection, persistence, and runtime resolution. Save decode strictly rejects unknown or retired IDs, including the pre-T6 `provisional-runtime-silhouette`; it never guesses a current preset from stale identity data.

## 6. Layout and Blender data flow

```mermaid
flowchart LR
  A["Approved mission skeleton, four-block envelope, and locked references"] --> B["Named-source Neo Tokyo 2 Blender master"]
  B --> C["Close render and four-block overview from the same master"]
  C --> D{"Requester accepts Blender source and composition?"}
  D -- "No" --> B
  D -- "Yes" --> E["Export candidate geometry, layers, collision, occlusion, entrances, and anchors"]
  E --> F["Reconcile one Level0LayoutContract and integrate live"]
  F --> G["Close, current-HUD, and four-block overview review"]
  G --> H{"Requester accepts live candidate?"}
  H -- "No" --> B
  H -- "Yes" --> I["Closeout validation and authorized commit"]
  I --> J["GET-204 verified; downstream ticket may start"]
```

### Contract discipline

- The mission skeleton owns stable semantic IDs, required places, route purposes, and player-facing behavior. The current envelope is exactly four dense mission blocks with three functional identities and three interlocking loops. It does not preserve the rejected sparse/fenced four-block compound or `84×60` nine-block geometry.
- The named-source Neo Tokyo 2 Blender master owns candidate street/building/public-realm geometry for those four blocks. The approved AI-assisted concept owns composition/camera/value relationships only. After the Blender proof is accepted, candidate geometry is reconciled into the one versioned layout contract; after the live result is accepted, that exact reconciled contract becomes the delivery boundary.
- Phaser collision, entrances, occluders, devices, contacts, terminals, hiding/blending contexts, objectives, and rendered derivatives all consume the accepted contract; no hidden greybox geometry may coexist with a different visible city.
- Architectural placement parcels are composition envelopes, not collision geometry. Each registered source root records its measured structural plan bounds; the runtime applies the cluster scale, orthogonal rotation, placement anchor, and street-wall inset to derive the visible-source collision AABB. The Blender builder verifies those measurements against the imported source and exports the placed collision footprint, while a city-wide quarter-unit reachability audit guards against disconnected walkable pockets.
- GET-204 has two distinct requester gates: actual Blender close/overview source proof before runtime replacement, then close/current-HUD/overview proof in the live runtime. A validator cannot accept either gate, and an AI-generated concept cannot satisfy source provenance.
- The complete live candidate must produce a close frame, a clean city frame, and a four-block mission overview from equivalent world/camera parameters.
- T4 export validation proves projection and canvas containment, tile-grid registration, file hashes/bytes/budgets, layer semantics/fallbacks, and complete anchor values against the layout contract. Decoded raster-edge agreement remains a visual/runtime acceptance responsibility rather than a claim made by metadata validation alone.
- The realized v4 T5 path opens the accepted T4 master in a separate ignored derivative and keeps source-cluster transforms, public-realm geometry, topology, collision, masks, anchors, projection, and actor ownership immutable. That restriction describes the rejected v4 implementation only. `GDR-ART-017` authorizes v5 to replace massing under a new identity after the preserved-route/anchor/probe greybox gate; it does not authorize mutation of T4/v4.
- The realized v4 path owns three aligned people-free `6400×3600` stable plates and sixteen same-scene alpha silhouettes per state. The approved v5 replacement must regenerate all three plates and retain 12–16 per-building identity slices with independent depth anchors; a merged continuous-wall cutout is invalid because it breaks actor sorting at wall ends.
- `scripts/build-get205-runtime-assets.mjs` verifies each stable source dimension and hash, rejects crop/depth/registration drift across states, emits WebP derivatives into owned staging, records state-specific paths/hashes/bytes under schema v2, and atomically replaces only its bounded production output root after full validation and readback. Desktop tiling uses overlap so filtering cannot expose seams; mobile downsampling is a separate page-stable profile, not browser-side texture scaling.
- `get205HidzuRuntime.ts` resolves page-stable profile plus phase-specific paths and texture keys while preserving the geometry-facing layer contract. `get205LightingTransition.ts` prefetches complete blue-hour and curfew sets at `19:50` and `21:50`, keeps the old set until the target is complete, crossfades aligned layers for `750 ms`, then destroys the old GameObjects and textures. A generation token rejects stale direct-jump, Restart Attempt, hydration-rewind, and asynchronous completions. Transition failure discards the partial target, keeps the current complete state, emits an observable diagnostic, and retries on later synchronization; initial-state failure remains visibly fatal. Environment tint and the atmosphere rectangle no longer own city color. V5 must retain and revalidate this interface while replacing the asset/geometry identities; the old and new production identities are not supported simultaneously as automatic fallbacks.
- The earlier grammar-heavy T5 generator, staged publication pointer, and 17-frame evidence bundle remain historical research recoverable from commit `7a6bba7`; their active manifest, runner, validator, mutation command, and Blender builder are retired. They do not own the current four-block production runtime and cannot substitute for the current live close/overview/mobile/schedule acceptance frames. `art:level0:t5:production` remains the sole T5 package entrypoint because it publishes the current four-block runtime profiles.
- If a parallelogram footprint cannot match a visual base within one tile, author a custom polygon or multi-region footprint rather than trim-chasing.
- One full master scene prevents per-building angle, scale, and light drift.
- Raw vendor geometry and textures remain outside Git. Requester-authorized flattened game derivatives, original gap-fill assets, source manifests, recipes, and validators may be versioned after the complete live candidate is accepted; generated `.blend` files remain untracked.

## 7. Movement, interaction, camera, and observation

### Direct movement

Click-to-move stores a world-space intent point. WASD stores a directional intent. A new input replaces the old intent immediately. The movement integrator advances directly toward the intent and uses local collision sliding; it does not request a path.

Invalid clicks resolve against the layout’s walkable geometry and return a typed reason plus optional nearest reachable marker. They do not silently route around buildings.

### Interaction

Committed street interactions implement the `GDR-INT-002` commit/resolve boundary: a deliberation surface (paused) previews the gate verdict, duration, and abort outcomes; confirmation snapshots that contract into the resolution interval, which runs with simulation active and resolves to completion or an explicit abort with its previewed outcome. Live world events during the interval may append observation/Paranoia sources to the ledger but cannot mutate the snapshotted contract.

The interaction resolver evaluates:

1. target exists and is currently available;
2. pointer/keyboard action belongs to the world, not a DOM overlay;
3. protagonist is within forgiving target range;
4. required visibility and occlusion rules pass;
5. the target’s owning domain authorizes the requested interaction.

It returns a typed available/blocked result consumed by both prompt UI and activation. Proximity alone never commits an interaction.

Player knowledge and world ownership are separate inputs. Knowledge controls whether a target may be surfaced; world ownership proves that the target's backing domain state exists. An explicitly addressed invalid target may return a truthful diagnostic, while automatic interaction discovery silently excludes unknown or wrong-domain anchors so it cannot leak hidden content.

### Camera

- Level 0 exposes a close street-first normal frame and a manual minimum zoom that reaches the composed four-block mission overview. Exact numeric values are frozen from the accepted same-master GET-204 live candidate rather than inherited from the greybox or generated plate.
- Camera follow binds to the current protagonist after every load/restart.
- Observation mode may pan independently while paused, then restores follow without a sacrificial click.
- Minimap viewport derives from current camera transform, not stale render bounds.
- Exact start zoom, movement speed, and camera easing remain open tuning values.

### Observation

Observation acquires the `observation` pause reason. It permits camera pan and read-only inspection of known cameras, exact discovered coverage, Needle, last-known state, contacts, entrances, hiding/blending contexts, current objective, facts, and one authored George prompt. Normal play receives only subtle authored camera light/reflection warnings; Observation is the exact-coverage surface. It cannot issue movement, activate terminals, alter surveillance, commit world state, or trigger a vignette/reward.

## 8. Surveillance architecture

### Shared geometry

Each surveillance device owns one current orientation/sweep definition. The visibility resolver combines it with range, field of view, layout occluders, and active schedule. Both the world rendering layer and detection sampler consume that same result. Blind spots are the ordinary result of solid geometry and occlusion; there is no separate off-grid region or network-null topology.

### Network transition owner

A pure network reducer receives typed evidence:

- raw observation started/continued/broken;
- observed restricted-area breach, protected interaction, or medkit removal;
- detected camera-feed change;
- failed verification or Needle verification;
- recovery-context entered/maintained/invalidated;
- interception result.

It updates `SurveillanceState` according to the approved matrix. Visibility alone in ordinary public space creates no concern. A concern transition requires current valid `ObservationEvidence` paired with `SurveillanceRuleBreakEvidence`; it cannot query the hidden protagonist transform when no valid observer has supplied it. A full transition to `clear` resets recognition and active observer attribution.

The safehouse boundary never dispatches a network-clear event by itself. A pure safehouse-availability resolver consumes `SafehouseState`, `SurveillanceState`, and current valid observation evidence and returns `SafehouseActionAvailability` records for Wait, Rest, research, George planning, mission handoff, and terminals. Read-only Character and dossier access remain available anywhere. Until `OPEN-SAFE-001` is accepted, the resolver uses that queue entry's documented recommendation as explicit replaceable content data; UI and world interactions consume the same typed result and cannot invent a separate safe-zone policy. The provisional value cannot be treated as final acceptance evidence.

### Drone

Exactly one Level 0 verifier drone, player-facing **Needle**, receives dispatch targets from the network. Its runtime controller follows one authored patrol, moves toward stored legitimate last-known positions, verifies visible/hiding areas according to authored rules, searches, and returns. Presentation emits its authored hum, approach warning, verification warning, and derived `NeedlePresentationState`; no independent visual toggle can leave the lamp crimson during neutral patrol. It has no weapon, HP, combat turn, or defeat state.

### Hiding and blending

Contexts are layout/content records, not tile tags inferred at runtime. Each declares bounds, entry point, schedule, direct-observation restriction, allowed network states, recovery behavior, and player-facing fiction. `blend.public_queue` additionally binds to the transit shelter's explicit seat/standing anchors and capacity; eligibility selectors consume the current schedule plus actual runtime occupancy. Environment plates never count as occupants.

### Camera loop

Only the connected camera terminal can request the single Level 0 camera-group loop, and that group can be used once per attempt. The gate/effect resolver uses `ability.terminal_craft` to operate the loop and `ability.trace_discipline` or a declared alternate path to determine whether it remains clean, applies exactly the target declared by the terminal, schedules active-loop expiry, and records `clean` or `traced`. That terminal history persists until `restartAttempt`; expiry never returns it to `unused`. There is no global hack bus.

## 9. Dialogue, facts, objectives, and George

### Dialogue graph

Dialogue content is an authored graph with stable nodes and localized exact lines. The dialogue domain evaluates availability and declared gate paths, exposes one exact `preview` verdict before every gated choice, commits typed effects atomically, advances the node, records the matching `result` verdict, and follows the declared worse path on every nonterminal failure. React renders the read model; no UI component dispatches unrelated low-level state mutations.

### Effect registry

Allowed Level 0 effects include:

- add fact;
- update objective or mission state;
- refine map knowledge;
- add an outcome-ledger field;
- apply authored time or Paranoia consequence;
- update contact state;
- issue/validate mission object;
- unlock a researched ability;
- enter a declared failure.

Every effect is idempotent or protected by a stable event ID.

### Objectives and facts

Mission state and objective state are separate. The mission state machine controls legal sequence; objectives provide player-facing instructions. General facts remain binary and determine knowledge/modifiers. The dedicated Cold Iron state machine advances only through Naila warning → manifest recognition → explicit five-minute manifest copy. No log text is parsed to infer any of these domains.

### George

George consumes a read-only context assembled from mission state, facts, known devices/locations, time, the Paranoia tier, and allowed prompt definitions. His response resolver selects authored content only and always returns a truthful limit reason when useful information is unavailable. Threshold announcements are gated by attempt history at 40, 70, and 90. Departure confirmation consumes the baseline readback. `effect: 'none'` is enforced at the contract boundary; absence of a line never carries hidden gameplay meaning.

## 10. Paranoia, abilities, and research

Paranoia changes are idempotent authored effects with stable event/source IDs, signed amount, exact before/after values, world minute, feedback key, attempt treatment, and crossed-threshold metadata. Attempt treatment is derived from the operation-departure boundary: events already present when the immutable baseline is created are `captured-at-departure`; later events are `discard-on-restart-attempt`. Presets cannot hard-code a contradictory treatment. An existing event ID or terminal run rejects another application. No render frame loop applies passive damage or Paranoia decay/gain. Surveillance-origin Paranoia requires the approved paired observation/rule-break evidence; ordinary public visibility is never a source.

The vending-machine coffee and shrine actions use authored `GroundingActionDefinition` records and the attempt recovery ledger: each costs ten world minutes, removes ten Paranoia, and is consumed once. The first qualifying difficult surveillance escape may emit one authored −5 Paranoia event. Dialogue cannot create grounding relief. Physical consequence expresses only as time, Paranoia, or capture; no condition band drives a limp, movement multiplier, detection modifier, or civilian response.

The Redux runtime keeps only ephemeral Paranoia-event IDs for currently visible feedback. The HUD resolves those IDs back to the authoritative run ledger and renders localized named-tier movement plus authored source copy; it never renders the internal 0–100 value or derives player text from a machine ID. Persistent consequence summaries remain outcome-ledger data and never reuse transient feedback logs.

The pure tier resolver maps the internal value to `calm`, `uneasy`, `shaken`, `breaking`, or terminal `breakdown`. Ability availability is derived from the current tier and the ability definition's `hardened` or `fragile` tag. A fragile ability locks at its declared tier; a hardened ability stays lit. Gates are binary and explain the exact ability, fact, costed path, or missing path—there is no arithmetic total or hidden roll.

Research uses stable option IDs and an ordered research-event ledger to prevent duplication. Option costs and granted abilities remain replaceable content data whether provisional or approved; they are not duplicated into event payloads beyond the exact resolved option outcome. A research option is consumed only in a clear, unobserved safehouse or during debrief, consumes its declared fact and 15 or 20 world minutes, grants exactly one declared ability, and writes one idempotent event. Domain rejection remains authoritative and the Character UI disables the same action with the same exact explanation.

## 11. Time, schedules, and pause

The clock service receives frame deltas only during active exploration with no pause owners. It advances at 30×, persists idempotent boundary IDs, and derives phase/curfew/deadline state. Authored city changes fire exactly once at 21:00, 21:30, 22:00, and 23:30 even when a pause, save hydration, or explicit clock jump straddles the boundary.

Schedules are authored state tables keyed by world phase/boundary, not free-running NPC scripts. Schedule transitions can change availability, position/path definitions, public/blending context, shutters, crowd density, signage/light state, and ambience. They cannot move a currently interacting actor or mutate geometry silently. The transit-shelter schedule is populated at 18:45, winds down after 21:30, and disables blending at curfew while keeping occupancy within the layout contract's visible seated/standing anchors. Spatial ambience has three authored world anchors: the Transit Road restaurant, Market Ring workshop, and safehouse-side apartment.

Safehouse Wait and Rest dispatch explicit clock jumps after confirmation. All boundary events between old and new time are processed deterministically.

## 12. Safehouse, persistence, and compatibility

### Persistence records

Use distinct storage keys and schema envelopes for:

- current-run autosave;
- operation-departure `OperationAttemptBaseline`;
- settings/localization.

Each envelope contains schema version, content/layout version, timestamp, and a deeply validated payload. Version 3 requires `CoverIdentity`, `RunAbilities`, the complete `Level0RpgLedger`, internal Paranoia, surveillance/camera history, Cold Iron evidence, grounding/tier history, and processed clock boundaries; there is no production default character or best-effort field filling. Cover/appearance ownership, ability IDs, research-state/event consistency, gate-verdict provenance, Paranoia event ordering, announced-tier history, camera history, boundary idempotency, and terminal breakdown state are recomputed during hydration. Spatial checkpoints must be finite, walkable, and compatible with the active layout; facing is a nonzero unit vector; deterministic generation identifiers must match the active runtime; deadline failure requirements must equal the completion fields that remain false. Version 2 and other stale development saves are rejected explicitly with `failure.save_incompatible` and a New Game path.

### Autosave

Autosave records current run at declared safe transitions. It is for continuing the run, not for deterministic mission restoration.

### Restart Attempt

The `OperationAttemptBaseline` is created when the player explicitly crosses the operation-departure boundary after preparation. **Restart Attempt** dispatches `restartAttempt`, discards post-departure state, and hydrates the baseline. Runtime-only controllers are rebuilt from restored domain state; they are not serialized as opaque objects.

### Compatibility

The new design requires schema version 3. Version 2, rewrite-era saves containing fixed Operative/package/combat/reputation/storylet/inventory assumptions, and other stale development envelopes are rejected. The UI explains incompatibility and offers New Game. No best-effort partial migration is permitted.

## 13. HUD and overlay architecture

The bottom dock is a fixed four-lane semantic layout:

1. knowledge minimap;
2. protagonist;
3. George;
4. current quest beat.

Selectors provide one read model per lane. CSS ownership remains component-local and uses semantic tokens. Level 0 styling is scoped through a visual-style data attribute. No component branches on raw theme IDs for painter logic.

The George and current-task lanes remain distinct selectors and distinct presentation regions. Gated choices consume the shared gate-verdict read model (`GateVerdict` preakdown` preview/result read model; no HUD or dialogue component recalculates the margin. Canonical Bible content is corrected only when a changed approved rule would otherwise make it false—no epigraph, quotation, or decorative-fiction schema is added.

### Civic display read models

```ts
type Level0CivicDisplayRole = 'transit' | 'verification' | 'sector-advisory';

interface Level0CivicDisplayReadModel {
  displayId: string;
  role: Level0CivicDisplayRole;
  primaryTextKey: string;
  secondaryTextKey?: string;
  stateId: string;
  knowledgeSourceIds: string[];
  emptyStateKey: string;
  errorStateKey: string;
}
```

Each physical recurring display is registered with exactly one role. Transit consumes departures and civic-clock state; verification consumes lane procedure, exact verdict, and manual-review state; sector advisory consumes only eligible authored civic-advisory events. The advisory renderer budgets two readable lines at normal zoom. A missing or invalid model uses that role's truthful empty/error state and cannot borrow another role, rotate generic advertising, or reveal an undiscovered fact. Japanese candidate copy and George translation remain replaceable content under `OPEN-NAR-014` until accepted.

Persistent height must remain within 16–18% at supported desktop viewports. Overlays acquire pause/focus ownership and fit at `1280×720`. Overlay close returns focus to the correct world/control owner without issuing gameplay input.

The Game Design Bible follows a one-way content path:

```text
canonical Game Design package + Approved decision rows
  → curated finalized-only EN/UK typed catalogs
  → catalog validation, search index, and independent topic/decision traceability
  → Level0GameBible semantic renderer
  → Level0RuntimeShell entry, focus, input, and transient pause ownership
```

Canonical Markdown is never rendered at runtime. `sourceRefs` and `decisionRefs` are validation metadata excluded from renderer props, search text, DOM, and the player-visible text bridge. A test-only inventory parses the current Decision Register and required-topic registry so both locale catalogs cannot jointly omit an Approved player-facing rule. Governance-only decisions require a bounded non-player-facing classification.

`Level0RuntimeShell` owns local Bible UI state and an idempotent `bible` pause acquisition record. Start-menu access creates no run and no pause owner. Active-play access acquires `bible` once; paused-menu access composes `menu + bible`; closing, unmount, run replacement, New Game, and shell teardown release only an owner acquired by that overlay instance. `bible` is a valid transient pause owner for runtime decoding but is stripped from autosave, hydration, and Restart Attempt like other UI-only owners.

The overlay blocks world keyboard, pointer, and controller input and keeps underlying React/Phaser surfaces inert and hidden from assistive navigation while open. Its UI state is not Redux domain state. The agent bridge receives an optional ref-backed `getUiState` callback and reports open/chapter/section/query/drawer/result information only during `render_game_to_text`; it cannot use that callback to mutate the run.

Responsive ownership remains inside `Level0GameBible.css`: three panes at `>=1200px`, two panes at `841–1199px`, and one reading column plus internal navigation drawer at `<=840px`. The article is capped at `820px`/`76ch`, table overflow is locally bounded, and underlying world dimensions never determine document layout.

## 14. Audio architecture

A typed audio registry maps domain events to cue IDs, priority, cooldown, ducking group, spatial anchor behavior, and fallback. Required categories include city ambience, footsteps, entrances, terminals, camera sweep/focus, Needle hum/approach/verification, Suspicious, Pursuit, the four clock boundaries, safehouse, Paranoia effects, objectives, failure, completion, and restrained UI confirmation. The three required threshold ambience sources bind to authored Transit Road restaurant, Market Ring workshop, and safehouse-side apartment anchors.

Audio is feedback, not authority. Missing audio cannot block state transitions, and repeated selector renders cannot replay one-shot cues.

## 15. Localization architecture

English and Ukrainian share stable content IDs and typed effect definitions. Only player-facing strings differ. Validation fails when a required node, choice, locked reason, objective, fact, prompt, failure cause, terminal state, debrief line, Bible chapter/section/block shape, topic, relation, shared numeric rule, or search field is missing in either language.

State transitions are tested once against shared content effects and with parity assertions across both localized presentations. Bible acceptance additionally requires recorded semantic review of every paired chapter—including examples, tables, state flows, keywords, numbers, and cause/effect direction—because structural parity cannot prove equivalent meaning.

## 16. Failure and recovery architecture

There are three Level 0 terminal failure causes:

- Paranoia reaches 100 and breakdown stages its surrender (`failure.breakdown`);
- authored interception resolves to capture;
- midnight occurs while either Lira return or transit validation remains incomplete.

Failure is a domain event that records the exact cause, freezes simulation, captures a final outcome ledger, and opens the cause-specific failure overlay. Capture derives a short Hidzu Corporation incident report and partial map from real sightings, detected feed changes, Needle verification, and capture evidence only; unseen route gaps remain disconnected. Deadline failure lists the unfinished Lira-return/transit requirements and never fabricates a capture. Breakdown stages its surrender and remains a simple factual explanation. Restart Attempt is available only when a valid `OperationAttemptBaseline` exists; otherwise New Game is offered with an honest explanation.

## 17. Validation and diagnostics

### Static/content validation

- unique stable IDs and valid references;
- complete 16-section canonical specifications;
- decision → document → Linear traceability;
- mission/objective transition legality;
- fact/check/effect validity;
- English/Ukrainian parity;
- Game Design Bible chapter/section/block parity, required semantic roles, Approved-decision/topic coverage, source-reference resolution, graph/search validity, and absence of governance, uncertainty, historical, implementation, repository, or delivery-process text from rendered content;
- layout zones, loops, anchors, footprints, and reachability without pathfinding;
- Blender mask/anchor/projection registration;
- art manifest completeness and source/license metadata;
- actor matrix, frame, direction, origin, scale, and portrait completeness;
- save-schema and `OperationAttemptBaseline` validation;
- paired observation/rule-break evidence, camera-group history, and capture-report non-disclosure;
- check preview/result parity and nonfatal fail-forward coverage;
- Cold Iron state-order, grounding one-use, threshold-history, and clock-boundary idempotency;
- `ActorLightRegion` containment, semantic tint tokens, foot-anchor sampling, and presentation-only dependency checks.

### Runtime diagnostics

Development diagnostics may expose current mission state, objective/facts, pause owners, clock, surveillance state, last-known position, device geometry, interaction result, layout/mask alignment, and outcome ledger. The reviewed packet vocabulary is exactly `move`, `observe`, `interact`, `choose`, `useContext`, and `consultGeorge`; start, wait, and Restart Attempt are typed non-verb controls. Canonical packets reject legacy stealth toggles, automatic collection, forced progress/failure, combat shortcuts, and direct state mutation. Direct mutation remains fixture-only evidence. Diagnostics are never required to play or complete the game and are excluded from production acceptance captures.

Typed milestone probes cover creation, Lira acceptance, preparation, departure baseline, infiltration, medkits, every manifest state and copy action, surveillance recovery, return, transit validation, debrief, capture, deadline, and Restart Attempt. A probe observes reachable domain state; it does not manufacture the milestone.

The acceptance runner consumes reviewed, versioned `PlaytestPacketV1` definitions. Every packet owns an explicit reviewed budget: GET-179 uses five minutes for affected and 25 minutes for closeout, while the bounded GET-204 collision packets use eight minutes per worker in both modes. A checkpoint is acceptance-eligible only when it is the current runtime's deterministically reconstructed New Game state: one canonical visible `start` step, no attempt baseline, a digest of the reconstructed initial run, an identical canonical autosave payload, and matching storage plus current build, content, layout, and probe-schema hashes. Later checkpoints remain blocked until a real replay reducer can prove every transition. Closeout always begins at New Game. The observer bridge is development-only and observation-only: it exports a compact snapshot plus probe states through `render_game_to_text`; it has no clock, dialogue, direct-state mutation, or hidden gameplay-dispatch surface.

GET-204 adds one development-only visible collision-route control to its assigned gate marker. It exposes fourteen reviewed checkpoints: the four formerly overblocked source-lot points plus collision-safe loop, threshold, central-crossing, and security-occupancy bypass segments. Each visible button click dispatches one ordinary direct destination through `Level0Scene.acceptLayoutClick`, `resolveClickIntent`, and `stepDirectMovement`; progress advances only after the canonical runtime checkpoint reaches the destination. It cannot teleport, mutate Redux position, skip occupancy, or appear without a validated `agent=1` gate marker. Focused coverage samples every segment at the production clearance radius and simulates the complete movement route. The closeout observer requires `BLOCK COVERAGE 4/4`, `ALL FOUR BLOCKS VISITED`, and `CITY COLLISION ROUTE COMPLETE` together.

Each AI Gamer is a fresh `codex exec --ephemeral` process pinned to the reviewed exact model and reasoning effort, with a disposable Codex home and empty workspace. A no-turn app-server thread start in that isolation root proves the configured provider/fallback, ephemeral state, empty instruction sources, read-only/no-network sandbox, and workspace root, but it is not effective-model evidence. On the normal live path, the supervisor pauses the running worker after its first completed capture and binds that same thread to the disposable state database and rollout while both still exist; the resulting `paused-live-worker` attestation must prove `gpt-5.6-sol`, high reasoning, and no provider fallback. A post-exit fallback is permitted only when no capture was produced and cannot compensate for missing interaction evidence. Missing, inconsistent, substituted, or shared-home runtime evidence blocks.

The worker's only configured integration is the signed Computer Use MCP launched as a direct child of signed Codex. `SkyComputerUseClient` authenticates its immediate parent, so an unsigned Node/tsx process must never be interposed on the production path; the older proxy implementation remains test-only compatibility coverage. Each reviewed packet supplies a machine-readable action/key policy, and Codex advertises only capture plus that packet subset through `enabled_tools`. Preflight verifies the launcher path, owner/mode, exact OpenAI code-signing identifier, team, authority, and executable digest. The supervisor derives a content-addressed ledger entry from every completed direct-child call, including sequence, tool, action fingerprint, assigned app, marker, and canonical full-result digest. Final reconciliation binds those entries one-to-one and in order to the completed Codex transcript item IDs; omission, insertion, reorder, result drift, wrong app, disallowed input, malformed output, or an unresolved call blocks. Each worker and its MCP descendants run in one owned process group, and the dedicated browser target is not released until that group is proven empty. If descendant-zero cannot be proven, the gate blocks and leaves only the fresh isolated target quarantined. The worker receives only its visible goal, allowed controls, persona, assigned browser application, and unique visible window marker. Repository files, Linear, probes, internal state, expected transitions, other workers, shell, web, apps, memory, and nested agents are outside its context. Streaming and final transcript audits reject unexpected tools, incomplete or failed calls, permission/app-approval output, model/config warnings, invalid capture-before-action order, personal-window collision, or missing transcript evidence. Exact transient capture-sequence, transport-disconnect, and empty Computer Use startup failures may receive at most two fresh replacements per worker slot; superseded evidence stays diagnostic and never participates in quorum. Permission, marker, model, policy, ownership, product, or ambiguous timeout failures remain non-retryable and fail closed.

A separate Playwright/CDP observer owns a newly launched gate server, fixed read-only snapshots, milestone/action-cycle screenshots, console/page/network capture, compact traces, probe timelines, and packet-invariant evaluation. An already-listening port is never reused; the sole port listener must remain in the launched process tree. The gate binds the reviewed packet revision/digest/artifact, launch-environment digest, `index.html`, existing `.env*` inputs, and build/content/layout/probe-schema hashes, then blocks if the listener or served inputs change before completion. Observer/trace/poll failures are bounded tooling blockers and can never prove a product regression. The observer cannot navigate or dispatch gameplay after worker control begins and cannot advise the worker. For each completed direct `get_app_state`, the supervisor pauses the worker/MCP process group, verifies the unchanged dedicated-browser PID/profile and private window marker, performs one secret-authenticated, strictly increasing observer synchronization, records the corresponding state/probes/screenshot and ledger entry, then resumes the group. The acknowledgement contains no gameplay data or advice. Completed transcript calls are digest-bound to those already-captured states, so arbitrary stdout chunk boundaries cannot fabricate before/action/after timing. Missing, rejected, replayed, timed-out, or unmatched synchronization blocks and can never prove a product regression. Playwright trace DOM/canvas snapshots, embedded screenshots, and sources remain disabled because separate observer screenshots carry the visual evidence without unbounded trace growth. A non-crash defect is acceptance-valid only when the worker names the exact visible indexed element or key and the observer records the required number of matching action cycles from the same complete pre-action state. Failed-input/softlock evidence requires identical full model-visible capture results and screenshots plus unchanged progress/probes; an incorrect-transition claim requires the same repeatable changed state, capture, and screenshot outcome. Ambiguous claims block. One worker is normal; a packet may authorize two isolated Chrome/Brave workers. Evidence-valid disagreement closes both and permits exactly one fresh blind tie-breaker. A matching evidence-valid pair decides without a generic majority rule; integrity failure, missing evidence, or disagreement without a valid deciding pair is `blocked`.

`AiGamerVerdictV2` and `PlaytestGateReportV2` retain the reviewed packet revision, canonical digest and artifact reference; worker/model provenance; visible verdicts; probe timelines/results; derived invariant summaries; evidence references; warnings; and quorum. The report schema and Markdown explicitly label invariant results as normalized views of the primary transcript, target, runtime-diagnostic, and observation-lifecycle checks rather than independent corroboration. The gate returns `pass` only when the visible goal plus every required probe and invariant are evidence-valid, `fail` only for an observer-proven product regression, and `blocked` for operational, isolation, checkpoint, evidence, timeout, or unresolved-quorum failure. Exit codes are respectively `0`, `1`, and `2`; invalid packet/configuration is reported as blocked with exit `3`. A fixture-only state helper can test classification but can never produce acceptance evidence or trigger fallback to the retired scripted engine.

### Test layers

1. Pure unit tests for reducers, gates, facts, schedules, state transitions, save validation, and geometry.
2. Component tests for creation, dialogue, HUD, overlays, locked reasons, and localization.
3. Phaser/module tests for movement, collision, camera, interaction, surveillance, drone, depth, and art-layer registration.
4. Integrated deterministic scenarios for every acceptance row.
5. Human-control fixed-viewport playtests for playability and visual truth.
6. Guided AI playtest as regression evidence only.

Required closeout commands remain those in `AGENTS.md` and [[01 MVP/95 MVP Readiness Checklist]].

## 18. Recovery and implementation sequence

1. Preserve and verify the external dirty-tree archive.
2. Complete, review, approve, and separately commit the canonical specification.
3. Restore the pre-rewrite foundation while recording every salvage/rejection.
4. Establish target schema, pause, `OperationAttemptBaseline`, `restartAttempt`, and `Level0LayoutContract` foundations.
5. Implement direct movement, interaction, camera, observation, and shared layout runtime.
6. Rebuild the exact four-block GET-204 district from named Neo Tokyo 2 sources, obtain Blender close/overview approval, reconcile its geometry into the layout contract, integrate it live, and obtain separate live acceptance; only then may closeout and commit proceed.
7. Add, technically validate, and commit the reversible Hidzu Corporation identity/world-art trial; requester acceptance remains its final visual gate.
8. Replace actors and portraits.
9. Restore cover identity, abilities, gates, Paranoia tiers, research, and the Character screen.
10. Implement surveillance, hiding/blending, Needle, single-use camera history, civilian presentation, and interception after the Restart Attempt foundation.
11. Modernize GET-179's reachable-control vocabulary and milestone probes after the Restart Attempt foundation; its milestone plus surveillance block the legibility/content child.
12. Implement exact gate verdicts, Cold Iron evidence, George explanations/readback, cause-specific failure, dialogue, dossier, minimap, and HUD infrastructure.
13. Author/integrate clock moments, named routes, grounding, street sound, mission content, onboarding, bilingual presentation, and end-to-end acceptance.
14. Integrate actor light-region sampling only after the city/content child is delivered.

Large tickets use internal milestones and proof gates; they do not blur ownership across steps.

## 19. Retired and deferred architecture

The following may exist in recovery archives or Git history but are not active target architecture:

- fixed Operative/Trace initialization;
- backgrounds and Ghost/Wire/Force packages;
- A* or threat-aware player routing;
- fixed `54×38` sparse/fenced four-block, `84×60` nine-block, `96×72`, or nine-parcel topology; the later approved dense four-block mission envelope is current and distinct;
- tactical/AP combat, AutoBattle, enemy turns, cover, weapon/loadout, attack sheets;
- EMP, lure, breach, magic hacking, or universal movement-noise systems;
- broad inventory/equipment/economy/crafting/weapon modifications;
- storylets, procedural dialogue, runtime LLM orchestration, witness/gossip, reputation simulation;
- three-lane HUD and generic free-text George chat;
- synthetic building collage as the production city.

Post-MVP research is limited to the explicitly approved postponed areas in [[02 Post-MVP/00 Index]]. No archived module is promoted merely because it compiles or has tests.
