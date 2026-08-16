---
status: MVP
type: system-specification
tags: [get-205, layout, level-0, reference-native, mission-legibility]
canonical: true
---

# GET-205 Reference-Native Layout Contract

## 1. Player fantasy and purpose

Level 0 is a compact mission neighborhood whose geography communicates the operation before the HUD explains it. From the public approach the player sees an ordinary life street on the left, the HIDZU destination and controlled street on the right, a real checkpoint between them and the objective, social cover at the transit stop and café, visible terminals, and one shadow route around the gate.

This specification implements `GDR-ART-019`. It replaces the rejected attempt to retrofit Reference 2 onto the 2026-08-05 four-block grid. The mission grammar survives; the former grid, footprint arrangement, anchor coordinates, and probe expectations do not.

## 2. Player-visible verbs

- Leave the safehouse quarter and enter the public approach.
- Read the life street, HIDZU-controlled street, checkpoint, transit blend, terminals, and sneak seam from one normal-play view.
- Move directly through public streets and alleys.
- Present at the checkpoint and cross only when its existing mission state allows passage.
- Bypass the closed checkpoint through the permanent eastern sneak seam to the service entrance.
- Blend at the authored transit queue while its staged group is present.
- Interact with the three visible terminal fixtures, two contacts, two objective surfaces, safehouse actions, and grounding props at their new anchors.

## 3. Starting state and prerequisites

- The operation still begins at 18:30 inside the safehouse boundary with the same cover, time, movement, interaction, mission, persistence, HUD, surveillance, and George systems.
- Layout identity is `get205-reference-native-v6`; the eventual runtime production identity is `get205-reference-native-production-v3`.
- The amended coordinate seed in section 6 is the requester-approved, frozen v6 layout. `OPEN-LAYOUT-007` is resolved. No production stage may move its routes, parcels, anchors, fixtures, authored-presence slots, camera, or probe expectations without a new canonical decision and requester approval.
- `kitbash-reference2-blend-concept-v1.png` is literal plan and hero-composition authority for the core neighborhood. It remains previsualization, never production geometry or provenance.
- `canvas-quality-target.png` continues to own the wet blue-black material and lighting relationship. `GDR-ART-012`, `GDR-ART-013`, `GDR-ART-014`, and `GDR-ART-016` remain unchanged.
- The accepted GET-204 source scene, the v4 wet rebake, and the rejected v5 recipes remain recoverable historical inputs. None is mutated in place.
- The documentation package and complete Linear description must be committed and read back before any v6 geometry, anchor, collision, camera, art, or runtime implementation begins.

## 4. Complete happy-path behavior

1. The player prepares in the safehouse court, speaks to Lira and optionally Naila or Brant, then confirms departure.
2. The player leaves through the safehouse lane and enters the south approach. The hero neighborhood opens ahead: life street up-left, HIDZU street up-right, the tower directly above its checkpoint, and the shadow bypass beside it.
3. The player can visit the life street, use the transit queue when its authored group is active, meet the public contacts, and operate the outbound fixture without entering controlled space.
4. At the HIDZU street, the barrier spans the controlled road. The public entrance interaction uses the existing verification/mission contract; the barrier is solid while closed and traversable only when that contract opens it.
5. The player may instead enter the eastern sneak seam from the junction, pass the gate line behind the street wall, reach the service entrance and camera-loop terminal, and continue toward the objectives.
6. The player reaches the medkits and optional manifest through the direct or service route, escapes through the same connected neighborhood, and returns to the safehouse for validation.

## 5. State model and transitions

The reference-native geography introduces no new mission phase. It changes the spatial realization of existing states:

| State | Direct HIDZU street | Sneak seam | Player-visible world state |
|---|---|---|---|
| Pre-departure | Not entered | Not entered | Safehouse quarter active; mission neighborhood visible only from its threshold |
| Public approach | Closed at `gate.hidzu.public` | Open | Barrier down, red caution beacons on, guard and Needle staged at the gate |
| Verification resolving | Closed | Open | Existing verification feedback runs at the public entrance; no new trespass simulation is added |
| Authorized passage | Open | Open | Barrier blocker is removed and the direct lane is traversable |
| Failed or aborted verification | Closed | Open | Barrier remains solid; recovery follows the existing mission/surveillance contract |
| Restart Attempt | Closed | Open | Player and all mutable gate/mission state restore from `OperationAttemptBaseline` |

Private space begins immediately north of the barrier line. The barrier is a real navigation/access boundary; it is not a decorative arm laid across a still-walkable road. GET-208 still owns detection, trespass, pursuit, and expanded human-security behavior.

## 6. Rules and tuning values

Sections 6.1–6.9 define the complete frozen v6 seed. The requester approved the dimensioned plan, rejected its first roof-dominated raw projection, authorized only the bounded foreground-band amendment recorded below, and approved the amended raw greybox on 2026-08-13 after the blind five-question read. Any later deviation requires a new canonical decision and requester review; an agent may not “improve” the composition ad hoc. The source-facade blue-hour hero is the next stage, but it begins only after the layout-closure authority package is committed and read back.

### 6.1 Coordinate system and bounds

- Core plan bounds remain `x = 0..44`, `y = 0..38` layout units. The three displaced safehouse masses may extend to `x = -3` as a south-west service extension outside the hero frustum wedge; no route, anchor, mission fixture, or reference-native core parcel moves with them.
- One layout unit remains `3 m`; movement speed and interaction radii do not change merely because coordinates move.
- North is decreasing `y`; east is increasing `x`; the camera looks from the south-west toward the north-east.
- Core Reference 2 neighborhood: `x = 4..33`, `y = 5.5..30`.
- Safehouse court/lane extension: `x = 12..20.5`, `y = 28.5..35.5`. The three taller safehouse identity masses relocate south-west to `x = -3..8`, `y = 31..38`, outside the hero lower-band wedge.
- Logistics depth beyond the gate: `x = 18.5..33`, `y = 5.5..15.8`.
- No old `58×44` coordinate, footprint, route, anchor, or camera-centre pin is inherited.

### 6.2 Street skeleton

All polygons are inclusive boundaries in layout units. Sidewalk strips are part of the named route unless a parcel or declared fixture owns them.

| ID | Polygon / centreline | Width | Purpose |
|---|---|---:|---|
| `route.life-street` | rectangle `(4,20.5)`–`(23,23.5)` | `3.0` | Public café/shop/transit arm running west from the junction |
| `route.approach-street` | rectangle `(21.5,20.5)`–`(24.5,30)` | `3.0` | South approach joining the safehouse lane |
| `route.hidzu-public` | rectangle `(21.5,15.8)`–`(24.5,23.5)` | `3.0` | Public lead-in from the junction to the checkpoint |
| `route.hidzu-private` | rectangle `(21.5,5.5)`–`(24.5,15.8)` | `3.0` | Controlled street beyond the barrier |
| `space.gate-public-apron` | rectangle `(24.5,17.2)`–`(28,18.5)` | — | Public terminal/guard apron connecting the approach to the sneak-seam mouth |
| `space.gate-operations-pad` | rectangle `(26.2,15.35)`–`(28,17.2)` | — | Restricted booth/Needle apron outside the public road lane |
| `space.transit-stop-apron` | rectangle `(13,23.5)`–`(18,25.4)` | — | Recessed public strip and explicit camera-clearance setback for the shelter and queue frontage |
| `route.safehouse-lane` | rectangle `(15.5,28.5)`–`(21.5,31)` | `2.5` | Short preparation/departure connector |
| `space.safehouse-court` | rectangle `(15.5,31)`–`(20.5,35.5)` | — | Outdoor-readable safehouse planning space |
| `route.service-alley` | rectangle `(28,5.5)`–`(30,30)` | `2.0` | Service access linking logistics depth, terminal, shrine, and south return |
| `route.sneak-seam-a` | rectangle `(24.5,18.5)`–`(30,20.5)` | `2.0` | Shadow mouth visible from the junction |
| `route.sneak-seam-b` | rectangle `(28,5.5)`–`(30,20.5)` | `2.0` | North-running bypass behind the gate frontage and east of the tower footprint |
| `route.sneak-seam-c` | rectangle `(24.5,5.5)`–`(30,7)` | `1.5` | Private-side landing north of the tower, connecting back to the controlled street; the fixed service-entry anchor remains on the east bypass leg |
| `route.service-return` | rectangle `(24.5,28)`–`(30,30)` | `2.0` | Reconnects the service alley to the approach/safehouse loop |

The three roads meet at `junction.reference2`, centred on `(23,22)`. This is the plan's visual and traversal hinge. The life street must project up-left and the HIDZU street up-right in the fixed hero frame. Alleys read as narrow shadow seams, never as leftover plazas. Walkable ground is the union of these named routes and spaces minus parcel, fixture, and dynamic blockers; unlabeled gaps are not traversable ground.

### 6.3 Gate and restricted space

| Element | Exact placement | Contract |
|---|---|---|
| `gate.hidzu.public` | segment `(21.5,15.8)`–`(24.5,15.8)` | Barrier collision is active while closed and removed while authorized/open |
| `gate.verification-lane` | rectangle `(22.2,16.0)`–`(24.3,19.2)` | Clear public approach and interaction sightline |
| `gate.guard-booth` | rectangle `(24.7,15.3)`–`(26.2,17.2)` | Low source-traceable booth; never intersects the road lane |
| `gate.beacon.west` | point `(21.8,15.75)` | Sparse red caution source |
| `gate.beacon.east` | point `(24.25,15.75)` | Sparse red caution source |
| `gate.frontage-fence` | segments along `y=15.35`, `x=18.5..21.5`, `x=24.5..24.7`, and `x=26.2..27` | Declares the private edge, terminates at the booth, and never fences public circulation |

The player must see the barrier and tower together from `proof.hero.approach`. A clear `6.5`-unit sight corridor runs from `(23,22.3)` to `(23,15.8)`. No roof, prop, actor, sign, or booth may enter that corridor.

### 6.4 Parcel strips and height rhythm

Every listed parcel is a separate identity, source/provenance record, collision footprint, rendered mask, and foreground cutout/depth anchor. Adjacent street-facing parcels differ by at least one floor. Blank frontage gaps above `0.5` unit are prohibited unless they are a named route or public-space opening.

| Parcel ID | Footprint | Floors | Mission/composition role |
|---|---|---:|---|
| `life.west-residential` | `(4,16.5)`–`(7,20.5)` | 4 | Lit residential edge |
| `life.cafe` | `(7,16.5)`–`(10,20.5)` | 3 | Café awning and seated patrons |
| `life.shop` | `(10,16.5)`–`(13,20.5)` | 5 | Warm/cold shop-window identity |
| `life.mixed` | `(13,16.5)`–`(16,20.5)` | 4 | Mixed frontage and labels |
| `life.transit-corner` | `(16,16.5)`–`(19,20.5)` | 6 | Frames transit stop and public queue |
| `life.junction-corner` | `(19,16.5)`–`(21.5,20.5)` | 5 | Turns the life wall into the HIDZU approach |
| `life.south-west` | `(4,23.5)`–`(7,28.5)` | 1 | Reference-like lower-edge roof sliver |
| `life.south-market` | `(7,23.5)`–`(10,28.5)` | 1 | Reference-like lower-edge public-market sliver |
| `life.south-service` | `(10,23.5)`–`(13,28.5)` | 1 | Reference-like lower-edge service sliver |
| `life.south-transit-west` | `(13,25.4)`–`(15.5,28.5)` | 1 | One-unit shelter setback plus lower-edge backdrop |
| `life.south-transit-east` | `(15.5,25.4)`–`(18,28.5)` | 1 | One-unit shelter setback plus lower-edge backdrop |
| `life.south-corner` | `(18,23.5)`–`(21.5,28.5)` | 1 | Keeps the crossing and street level visible |
| `hidzu.west-north` | `(18.5,5.5)`–`(21.5,8.5)` | 5 | Private-street canyon |
| `hidzu.west-mid` | `(18.5,8.5)`–`(21.5,11.5)` | 4 | Private-street canyon |
| `hidzu.west-south` | `(18.5,11.5)`–`(21.5,15.35)` | 6 | Frames the checkpoint without rivaling the tower |
| `hidzu.landmark` | `(24.5,7)`–`(28,15.2)` | 10 | One dominant HIDZU tower, stepped crown, identity face toward south-west |
| `logistics.depth-north` | `(30,5.5)`–`(33,10)` | 6 | Logistics depth beyond the gate |
| `logistics.depth-south` | `(30,10)`–`(33,14.5)` | 5 | Logistics depth and service-entrance frame |
| `service.north` | `(30,15)`–`(33,18)` | 4 | Service street wall |
| `service.terminal` | `(30,18)`–`(33,21)` | 1 | Camera-loop frontage held below the sneak-mouth sight wedge |
| `service.mid` | `(30,21)`–`(33,24)` | 1 | Lower-edge right-frame frontage held below the sneak-mouth sight wedge |
| `service.workshop` | `(30,24)`–`(33,27)` | 1 | Lower-edge workshop strip held below the sneak-mouth sight wedge |
| `service.shrine-wall` | `(30,27)`–`(33,30)` | 3 | Shrine threshold and south return |
| `safehouse.workshop` | `(12,28.5)`–`(15.5,31)` | 1 | Low safehouse-lane foreground sliver |
| `safehouse.home` | `(0.5,32)`–`(4,38)` | 4 | Safehouse identity shifted south-west outside the hero lower band |
| `safehouse.corner` | `(4,32)`–`(8,38)` | 3 | Safehouse identity shifted south-west outside the hero lower band |
| `safehouse.service-edge` | `(-3,31)`–`(0.5,38)` | 3 | Service-edge identity shifted south-west outside the hero lower band |

`hidzu.landmark` is the only mass above seven floors and is at least two floors taller than every other parcel. Its podium may expose three `2.4`-unit facade bays but remains one landmark identity. The south-transit pair, south-market, south-service, south-corner, south-west, safehouse workshop, and the service terminal/mid/workshop strip are exactly one floor with roof props at or below `0.5` unit. Taller safehouse masses remain south-west of the hero lower-band wedge. Three explicit no-occlusion wedges run from the camera to the transit apron, café patio, and sneak mouth; no parcel, fixture, or backdrop above one floor may intersect them.

### 6.5 Public-realm fixtures and authored presence

| Element | Placement | Required presentation |
|---|---|---|
| Transit shelter | `(14.2,23.5)`–`(16.8,25.4)` | Bench, timetable screen toward camera, two seated and one standing passenger slots; the extra one-unit apron is its projection clearance setback |
| Café terrace | `(7.3,20.6)`–`(9.8,21.4)` | Awning, two tables, exactly two seated patron slots along the life-street edge |
| Outbound terminal fixture | centred `(17.5,22.9)` | `1×0.6×1.6` unit camera-facing kiosk, clear of the shelter |
| Cache terminal fixture | centred `(25.2,18.0)` | `1×0.6×1.6` unit camera-facing kiosk beside checkpoint, outside road lane |
| Camera-loop terminal fixture | centred `(29.0,19.2)` | `1×0.6×1.6` unit camera-facing kiosk in service alley |
| Public checkpoint guard | `(26.6,17.8)` | One authored static slot outside the booth and sight corridor |
| Needle launch | `(27.2,16.4)` | Patrol begins visibly associated with gate approach |

Runtime actor slots are exact plan data:

| Runtime slot | Point | Collision / schedule contract |
|---|---:|---|
| `presence.transit.seated-west` | `(14.8,24.0)` | Seated; bench collision only |
| `presence.transit.seated-east` | `(15.6,24.0)` | Seated; bench collision only |
| `presence.transit.standing` | `(16.5,24.0)` | Bounded standing blocker inside the stop apron, never the life-street through-lane |
| `presence.cafe.seated-west` | `(8.1,21.0)` | Seated; café-chair collision only |
| `presence.cafe.seated-east` | `(9.0,21.0)` | Seated; café-chair collision only |
| `presence.guard.public` | `(26.6,17.8)` | Bounded static blocker inside the gate apron |
| `presence.needle.launch` | `(27.2,16.4)` | Drone origin; no ground blocker |

Random ambient NPC allocation is prohibited. These staged people remain runtime-owned and schedule-owned. Seating furniture owns collision; seated people add no duplicate blocker. The standing passenger and guard use the declared bounded blockers without obstructing a through-route or required anchor clearance.

### 6.6 Anchor relocation table

Stable semantic IDs survive. Coordinates are replaced as one versioned dataset:

| Anchor | New point | Role |
|---|---:|---|
| `safehouse.boundary` | `(18.0,32.5)` | Safehouse boundary centre |
| `safehouse.spawn` | `(17.8,33.0)` | Attempt/reset spawn |
| `safehouse.departure` | `(20.8,29.6)` | Explicit departure threshold |
| `contact.lira` | `(16.6,32.5)` | Safehouse contact |
| `contact.naila` | `(9.0,22.7)` | Life-street contact |
| `contact.brant` | `(13.0,22.7)` | Life-street contact |
| `entrance.logistics.public` | `(23.0,16.4)` | Public verification point south of barrier |
| `entrance.logistics.service` | `(29.2,13.8)` | Sneak/service entry beyond gate line |
| `entrance.safehouse` | `(15.9,34.5)` | Safehouse exterior threshold |
| `terminal.camera_loop` | `(29.0,19.2)` | Service-alley terminal |
| `terminal.cache_locker` | `(25.2,18.0)` | Gate-area terminal |
| `terminal.outbound_transit` | `(17.5,22.9)` | Transit terminal |
| `camera.public_approach` | `(22.4,19.2)` | Public approach camera |
| `camera.public_gate` | `(24.35,16.2)` | Gate camera |
| `camera.service_gate` | `(29.3,14.2)` | Service-entry camera |
| `camera.service_alley` | `(29.0,22.5)` | Service-alley camera |
| `drone.launch` | `(27.2,16.4)` | Needle launch/patrol origin |
| `hide.service_recess` | `(28.5,20.0)` | Sneak-seam recess |
| `hide.maintenance_bay` | `(29.0,25.8)` | Service-wall recess |
| `hide.transit_structure` | `(20.8,20.9)` | Dark junction-side recess at the parcel edge |
| `blend.delivery_activity` | `(29.0,23.0)` | Deferred GET-208 delivery blend |
| `blend.public_queue` | `(15.5,23.0)` | Authored transit group |
| `objective.medkits` | `(23.2,11.5)` | Primary objective beyond checkpoint |
| `objective.manifest` | `(29.2,13.2)` | Optional objective beside service entry |
| `interaction.safehouse.wait` | `(17.2,32.8)` | Safehouse wait |
| `interaction.safehouse.rest` | `(18.6,32.8)` | Safehouse rest |
| `interaction.grounding.vending_coffee` | `(9.8,22.7)` | Café/life-street grounding |
| `interaction.grounding.shrine` | `(29.0,27.2)` | Service-alley grounding |
| `proof.hero.approach` | `(23.0,25.8)` | Greybox and fixed-frame proof start only |

Every required anchor retains at least `0.32` layout-unit actor clearance from parcel footprints and unrelated blockers, plus its existing semantic interaction radius unless a separately approved system decision changes it. A device/object anchor may coincide with the centre of its own declared fixture; the fixture's usable interaction point still clears every unrelated blocker.

### 6.7 Traversal loops

The stable loop IDs and localized names survive; their world geometry is replaced:

- `loop.public-contact` / **Transit Road**: `safehouse.departure → proof.hero.approach → junction.reference2 → life street → transit/café → junction.reference2 → approach → safehouse.departure`.
- `loop.logistics-service` / **Market Ring**: `junction.reference2 → entrance.logistics.public → gate.hidzu.public → hidzu-private → objectives → entrance.logistics.service → sneak-seam → junction.reference2`. The gate edge is conditional on gate state; the service/sneak half remains traversable while it is closed.
- `loop.outer-escape` / **Outer Space**: `safehouse.departure → approach → junction.reference2 → sneak-seam → service alley → service-return → safehouse-lane → safehouse.departure`.

These stable IDs and purposes preserve the operation's mission grammar; their old coordinates and polygons are not preserved.

### 6.8 Hero-camera freeze

The requester-approved hero camera is frozen at `1440×900`, orthographic isometric, `45°` azimuth, `30°` elevation, target `{21.177121,17.126983,1.621967}`, and orthographic scale `25.687085`. The old target `{29,22}` and its crop registration are retired. The failed first-greybox candidate `{21.734958,18.626983,2.499995}` at scale `25.661101` remains failure evidence. Source-facade dressing, lighting, state bakes, cutout exports, runtime profiles, and regression captures must reproduce the frozen camera exactly; none may move mission geometry, retarget, or rescale to compensate for dressing.

The solver must place these plan facts within the following normalized screen boxes in the raw greybox:

| Fact | Required screen box `(x/W, y/H)` |
|---|---|
| Junction centre | `x 0.44–0.52`, `y 0.57–0.64` |
| Café frontage | `x 0.10–0.25`, `y 0.42–0.60` |
| Transit shelter and people | `x 0.20–0.36`, `y 0.60–0.76` |
| Barrier and guard | `x 0.58–0.72`, `y 0.40–0.56` |
| HIDZU identity face/crown | `x 0.57–0.76`, `y 0.08–0.35` |
| Sneak-seam mouth | `x 0.54–0.66`, `y 0.55–0.68` |
| Foreground roof band | each tagged foreground roof's projected vertical span is at most `0.18H`; the former `1 - top` diagnostic is invalid and retired |

The tower crown and complete future HIDZU face must be inside the frame. The barrier and tower must overlap vertically as one destination/obstacle read. No other silhouette may exceed seven floors or compete with the landmark.

Before any source-facade render, a seed-only projection preflight projects the parcel cuboids and three staging wedges through the frozen camera. It fails unless every named foreground parcel is exactly one floor; roof props are `<=0.5` unit; each displaced safehouse mass clears the lower band; the maximum tagged roof span is `<=0.18H`; and the transit apron, café patio, and sneak-mouth polygons project to at least `80`, `60`, and `2,500` pixels respectively with no intersecting parcel, fixture, fence segment, or declared perimeter mass above one floor. The approved amended greybox measured `0.116993H`, `3,032`, `1,228`, and `6,752` respectively. Dressed rendered masks remain the truth and must retain at least `80`, `60`, and `2,500` visible pixels.

### 6.9 Replacement probe fixture

The 2026-08-08 24-point fixture is retained only with the rejected v4/v5 records. The requester-approved v6 invariant is the following 22-static/four-dynamic fixture with `0.32` clearance. Its baseline raw hero is `v6-raw-greybox-1440x900.png`, SHA-256 `ddf5a224da0eec2fe8af5b1c0bf2f7ca8f5e618080ef1d63b4a18c4c72aa7369`.

Static geometry probes:

| # | Point | Expected |
|---:|---:|---|
| 1 | `(6,22)` | walkable life street |
| 2 | `(9,22)` | walkable café frontage |
| 3 | `(15.5,22.8)` | walkable transit frontage |
| 4 | `(23,22)` | walkable junction |
| 5 | `(23,19)` | walkable public HIDZU approach |
| 6 | `(23,28)` | walkable south approach |
| 7 | `(18,29.5)` | walkable safehouse lane |
| 8 | `(18,33)` | walkable safehouse court |
| 9 | `(26,19.5)` | walkable sneak-seam mouth |
| 10 | `(29,14)` | walkable north sneak seam |
| 11 | `(29,8)` | walkable north service alley |
| 12 | `(29,26)` | walkable south service alley |
| 13 | `(23,12)` | geometry-walkable private street; access state tested separately |
| 14 | `(26,6.2)` | walkable private-side bypass landing |
| 15 | `(8.5,18.5)` | rejected inside `life.cafe` |
| 16 | `(20,18.5)` | rejected inside `life.junction-corner` |
| 17 | `(26,11)` | rejected inside `hidzu.landmark` |
| 18 | `(31.5,19.5)` | rejected inside `service.terminal` |
| 19 | `(2.2,34.5)` | rejected inside relocated `safehouse.home` |
| 20 | `(25.5,16.2)` | rejected inside `gate.guard-booth` |
| 21 | `(-3.5,22)` | rejected outside amended district extension |
| 22 | `(23,38.5)` | rejected outside district |

Dynamic access probes:

1. With the barrier closed, direct movement from `(23,17)` to `(23,14)` stops south of `y=15.8`.
2. With verification authorized and the barrier open, the same movement crosses into `route.hidzu-private`.
3. With the barrier closed, a route through the three sneak-seam segments reaches `entrance.logistics.service` without intersecting any footprint or dynamic blocker.
4. Restart Attempt restores the barrier to closed, the player to `safehouse.spawn`, and the same static/dynamic probe verdicts.

## 7. Inputs from other systems

- [[41 Movement, Interaction & Observation]] supplies direct movement, collision, interaction, and camera ownership.
- [[42 Surveillance, Security & Civilian Behavior]] supplies existing verification, camera, Needle, and guard state; this layout does not invent new detection logic.
- [[44 Safehouse, Save & Restart Attempt]] supplies spawn, departure, attempt baseline, and reset behavior.
- [[48 Actors & Portraits]] and the character manifest supply every staged person as a separate runtime actor.
- [[80 Day-Night Cycle]] supplies dusk, blue-hour, curfew, schedule boundaries, and 750 ms environment-set transitions.
- [[30 Art Direction (MVP)]] supplies source provenance, wet blue-black look, signage/color boundaries, actor/world proportion, and visual acceptance.

## 8. Effects on other systems

- `Level0LayoutContract`, building footprints, collision, entrances, anchor coordinates, frozen camera constants, occlusion regions, proof starts, minimap geometry, surveillance geometry, route tests, and position-pinning tests must be regenerated together from the approved `get205-reference-native-v6` seed.
- Mission IDs, route-loop IDs and localized names, interaction IDs, facts, objectives, clock rules, HUD behavior, dialogue, persistence semantics, profile selection, tiled environment delivery, per-identity cutouts, and lighting-state preload/prefetch/crossfade interfaces remain stable.
- The gate adds a real dynamic navigation boundary tied to existing verification state. GET-208 later supplies deeper detection/trespass behavior without changing this geometry.
- The transit queue remains the only active blending context in GET-205; `blend.delivery_activity` stays authored but unavailable until GET-208.

## 9. UI, world, audio, and George feedback

- The world, not a waypoint, establishes destination, obstacle, blend, hack, and sneak reads.
- The tower uses one dominant HIDZU identity face. Life-street parcels use smaller independent labels and a mix of detailed warm and cold windows. Cyan remains device/identity-specific; red remains gate/threat-specific.
- The barrier, booth, beacons, guard, and Needle visually declare the restricted boundary. When state changes, world animation and existing interaction feedback agree with collision.
- The café awning, seated patrons, shelter, queue, and timetable screen communicate public life and blending.
- The three terminal fixtures face the camera from their real anchors; no floating label or route marker substitutes for a visible device.
- Audio threshold anchors move with their semantic locations and remain authored data; no coordinate is retained because an old audio fixture used it.

## 10. Failure, recovery, and Restart Attempt behavior

- A closed barrier blocks only the controlled direct lane, never the public junction, life street, approach, or sneak seam.
- Failed asset, layout, collision, or camera validation leaves the currently published production world intact; v6 builds and validates in staging.
- If projection preflight, route connectivity, source/proportion feasibility, or dressed mission-legibility masks regress from the approved baseline, source-facade work stops and state bakes do not begin.
- Restart Attempt restores gate state and player position through the existing attempt baseline; it does not restore an old coordinate system.
- Existing initial texture failure, state-transition failure, stale-generation, and rollback rules remain unchanged.

## 11. Content-authoring requirements

- Keep one versioned plan manifest from sections 6.1–6.9 as the only source for footprints, anchors, routes, gate collision, proof starts, the frozen camera, and the replacement probe fixture.
- Derive a v6 Blender scene from recoverable Neo Tokyo 2 source geometry. Every production building/prop keeps named source object, material, transform, license/provenance, and authored-change records.
- Treat every GET-204/v4/v5 donor `.blend` as immutable input. The versioned v6 derivative owns texture repair: every image used by retained geometry is remapped to the durable local licensed cache or packed into the derivative, then the saved scene is reopened and audited. Rendering is blocked unless the reopened scene reports zero missing external images; an in-memory basename remap or aggregate repaired-link count is not durable evidence.
- Realize all 27 parcels as visible Neo Tokyo 2 buildings or kit-bashed source assemblies fitted to the frozen section-6 envelopes. The saved scene and generated manifest must agree on each parcel's source collection, retained source objects/materials, source and placed bounds, transforms, mesh complexity/hash evidence, and authored crop/cap/interior-closure work. A parcel with no retained source geometry, or whose apparent facade is supplied by a camera-visible procedural envelope, emissive decal, painted window grid, or generated facade, fails source acceptance.
- The approved greybox remains the massing authority, but modeled source relief uses a dressed-source/greybox silhouette IoU floor of `0.85` rather than the rejected proxy-box implementation's `0.90`. The tolerance covers facade depth, balconies, ledges, crowns, pipes, and bounded roof equipment only. The exact footprint, floor rhythm, mission fixtures, routes, staging wedges, and frozen camera remain immutable.
- Use 12–16 materially visible per-identity cutouts in the hero neighborhood; additional safehouse/logistics identities may exist outside the hero. Never merge a continuous wall into one depth anchor.
- Outside-bounds backdrop mass is allowed only behind the north/west/east frame edges, never as reachable fake geometry.
- The accepted greybox package contains the approved dimensioned plan, seed-only projection-preflight report, raw fixed-camera greybox, Reference 2 side-by-side, occlusion-aware identity masks, route/probe report, and answer key. The requester approved the raw frame only after independently identifying destination, obstacle, blend, hack, and sneak.
- Source-facade work must rerun the same mission-legibility masks. Dressing may not bury any approved read. Keep the sneak mouth unlit and high-contrast against the lit gate; retain the transit group on its declared bench slots and use the shelter screen glow to support its thin `89 px` approved read; keep Needle visibly tied to the gate approach.
- The source-facade hero uses real Neo Tokyo 2 identities, detailed warm and cold windows, the locked wet blue-black look, one dominant HIDZU tower identity, and the real restricted-area treatment. Random ambient NPC allocation remains prohibited.
- Build the HIDZU identity as project-authored dimensional architecture. The landmark receives a projecting vertical steel frame with facade brackets/mount rails, dark sign box and returns, hex mark, and extruded letters with restrained emissive faces; the checkpoint receives a matching dimensional box sign and small unit plates. Banner/image planes, decals, and post-render sign panels fail. Before the full hero render, a low-sample preview from the frozen camera must prove every required glyph is readable and not mirrored.
- Add a bounded, provenance-recorded clutter layer after the source assemblies pass: storefronts and varied source roof units on the parcels; stalls, awnings, vending machines, poles/catenary, bins, planters, roadside cabinets, small shop boards, and non-emissive district-wayfinding fixtures along the life street and junction. Each object must serve building identity, navigation, surveillance, human scale, or civic atmosphere; protected routes, clearance discs, staging sight wedges, and the dark sneak mouth stay clear.
- Apply restrained depth fog, physically motivated practical falloff, the established AgX/Filmic wet-blue-black grade, and subtle neutral grain only after geometry, clutter, material, light, and legibility gates pass. This finish cannot import reference pixels, act as tint-only state authority, add bloom/ripple blur, composite reflections, or hide missing architecture.

## 12. Edge cases and prohibited shortcuts

- Do not preserve any old coordinate, route polygon, footprint, anchor, camera target, crop, or probe verdict merely because runtime code currently contains it.
- Do not move the tower away from the controlled street, place the gate behind foreground roofs, leave the barrier decorative, or put the restricted boundary across a public route.
- Do not widen plazas to create composition breathing room. Density comes from continuous 2–3-unit frontage parcels and route-width public space.
- Do not satisfy identity count through hidden objects, token slivers, one wall split into fake IDs, or declared recipe count without rendered masks.
- Do not bake actors into environment plates or replace authored mission presence with random NPC allocation.
- Do not use AI-generated concept geometry as production source identity.
- Do not count a source prefix, cropped mesh count, texture relink, or hidden licensed object as proof that a parcel visibly uses real kit architecture. The rendered source geometry and the saved-scene provenance record must agree.
- Do not retain a camera-visible parcel envelope merely to manufacture near-perfect silhouette overlap. Collision/mask proxies remain non-rendering; any interior closure must be inset behind the modeled source facade and must not appear as the building identity.
- Do not overwrite a recoverable donor master, depend on a deleted temporary texture cache, accept a render-time-only texture remap as durability evidence, or render while any unpacked image path is unresolved after save/reopen.
- Do not use the replica prototype's altered coordinates, three-wide-donor life wall, approach-straddling foreground mass, widened streets, camera, plane signs, or decals as production instructions. Its images and scripts demonstrate assembly mechanics and a minimum modeled-detail contrast only; the frozen v6 manifest and this contract remain authority.
- Do not weaken the wet-look, proportion, source-provenance, three-state delivery, accessibility, or live-evidence gates during the topology rebuild.
- Do not produce full-resolution state masters, cutouts, runtime assets, or publication changes before requester approval of the source-derived blue-hour hero.

## 13. Removed behavior

- The `58×44` four-block street grid and all geometry derived from it.
- The frozen anchor-coordinate set, including the landmark-at-`x=36` requirement and camera centre `{29,22}`.
- The interpretation of “preserved topology” in `GDR-ART-017` and `GDR-ART-018`.
- `get205-dense-four-block-v5` as the active production direction.
- The recovered 24-point v4/v5 probe fixture as an acceptance invariant.
- The v5 building-pixel ratio band as layout authority; its mask machinery may be re-parameterized against the accepted v6 plan.
- Random ambient NPC allocation and decorative-only checkpoint treatment.

## 14. Post-MVP extensions

- Interiors, extra districts, additional gates, vehicles, delivery population, wider civilian schedules, and deeper trespass/security behavior remain outside GET-205.
- The reference-native plan may later seed adjacent neighborhoods by the same parcel/street grammar, but no decorative expansion is approved by this specification.

## 15. Human-play acceptance examples

### Plan gate

- Gate accepted by the requester on 2026-08-13. The approved raw baseline is `v6-raw-greybox-1440x900.png`, SHA-256 `ddf5a224da0eec2fe8af5b1c0bf2f7ca8f5e618080ef1d63b4a18c4c72aa7369`.
- Inspect the dimensioned plan and confirm that it is Reference 2's implied Y/T intersection and mission staging extended into a safehouse quarter, logistics depth, service alley, and one sneak bypass—not another four-block reinterpretation.
- Run all 22 static and four dynamic probes with exact recorded results; every required anchor has clearance and every required route state is connected as specified.
- View the raw `1440×900` greybox before the key. A stranger can point to the HIDZU destination, checkpoint obstacle, transit blend, visible terminal, and shadow bypass. Any wrong or missing answer rejects the plan.
- Confirm the tower/face is fully in frame, the gate and tower read together, the street-level crossing is unobstructed, and every tagged foreground roof stays within the corrected `18%` projected-span gate.
- Occlusion-aware masks show at least ten materially visible identities, each at least `0.005` of full frame, and no identity exceeds `0.15`. Metrics support the visual decision; they cannot pass a failed read.

### Source-hero gate

- Inspect the saved Blender scene and manifest: all 27 parcels contain visible retained Neo Tokyo 2 source geometry with named collection/object/material/transform/bounds/hash evidence, and the scene contains zero camera-visible procedural parcel envelopes or generated replacement facades.
- Reopen the saved v6 derivative and inspect every image dependency. The report contains zero missing external images, names the packed or durable repo-local licensed path for each retained image, and proves that no historical donor master was modified.
- Compare the source-only building silhouette with the approved raw greybox at the frozen camera. IoU is at least `0.85`; every deviation is attributable to modeled facade/roof relief rather than a footprint, parcel-height, fixture, route, camera, or sight-wedge change.
- Inspect a facade-detail crop at `200%`. Modeled frames, ledges, balconies/storefront depth, pipes, and varied roof equipment must read as geometry rather than painted rectangles. Provenance counts cannot substitute for this visual check.
- Inspect the low-sample HIDZU parity preview and final hero at the frozen camera. The tower and gate signs read forward, show physical mounts/returns/depth, and contain no camera-facing plane/decal substitute.
- Inspect the life street and junction clutter inventory and render. Each retained object has a declared source and purpose, routes/clearances remain green, HIDZU stays dominant, and the sneak mouth remains dark.
- Apply and judge depth fog, practical falloff, the AgX/Filmic grade, and subtle neutral grain only after the ungraded source/material/light frame passes. All existing ART-016, mission-legibility, identity, window, and color-discipline gates remain green.

### Live gate

- After source/facade/look work, inspect live clean-world, current-HUD, overview, desktop/mobile, occlusion, actor-foot, and zoom evidence at the ticket's named viewports.
- Play both direct/checkpoint and sneak/service approaches under normal movement. The direct route is actually blocked while closed, the bypass remains usable, visible geometry matches collision, and mission interactions retain their existing semantics.
- Inspect dusk, blue hour, and curfew in the same rebuilt geography with aligned state transitions, no partial loads, no stale-state flash, and no geometry shift.

## 16. Owning Linear ticket

`T5` (`GET-205`) owns the reference-native v6 plan, greybox gate, source-derived city rebuild, anchor/collision/camera regeneration, wet blue-black three-state bakes, occlusion/profile/runtime publication, and live visual proof. `T8` (`GET-208`) owns expanded detection, trespass, human security, civilian reactions, and the deferred delivery blend. GET-205 remains non-terminal until the requester verifies the committed live build.
