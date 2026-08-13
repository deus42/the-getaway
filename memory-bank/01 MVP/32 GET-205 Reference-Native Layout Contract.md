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
- The exact coordinate seed in section 6 is the mandatory reversible baseline under `OPEN-LAYOUT-007`. It leaves no implementation-level compositional discretion, but it is not frozen as the final accepted layout until the requester approves the dimensioned plan and raw greybox.
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

Sections 6.1–6.9 define the complete provisional v6 seed governed by `OPEN-LAYOUT-007`. An implementation may reproduce it literally for the plan/greybox gate after the documentation entry commit. Any deviation requires a stated geometric reason, an updated canonical seed, and requester review; an agent may not “improve” the composition ad hoc.

### 6.1 Coordinate system and bounds

- Plan bounds: `x = 0..44`, `y = 0..38` layout units.
- One layout unit remains `3 m`; movement speed and interaction radii do not change merely because coordinates move.
- North is decreasing `y`; east is increasing `x`; the camera looks from the south-west toward the north-east.
- Core Reference 2 neighborhood: `x = 4..33`, `y = 5.5..30`.
- Safehouse extension behind the camera: `x = 12..25`, `y = 28.5..37`.
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
| `space.transit-stop-apron` | rectangle `(13,23.5)`–`(18,24.4)` | — | Recessed public strip for the shelter and queue frontage |
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
| `life.south-west` | `(4,23.5)`–`(7,28.5)` | 3 | Low foreground edge |
| `life.south-market` | `(7,23.5)`–`(10,28.5)` | 2 | Low public-market edge |
| `life.south-service` | `(10,23.5)`–`(13,28.5)` | 3 | Low foreground edge; no roof clutter above `1` unit |
| `life.south-transit-west` | `(13,24.4)`–`(15.5,28.5)` | 2 | Low backdrop behind the transit-stop apron |
| `life.south-transit-east` | `(15.5,24.4)`–`(18,28.5)` | 3 | Low stepped backdrop behind the transit-stop apron |
| `life.south-corner` | `(18,23.5)`–`(21.5,28.5)` | 2 | Keeps the crossing and street level visible |
| `hidzu.west-north` | `(18.5,5.5)`–`(21.5,8.5)` | 5 | Private-street canyon |
| `hidzu.west-mid` | `(18.5,8.5)`–`(21.5,11.5)` | 4 | Private-street canyon |
| `hidzu.west-south` | `(18.5,11.5)`–`(21.5,15.35)` | 6 | Frames the checkpoint without rivaling the tower |
| `hidzu.landmark` | `(24.5,7)`–`(28,15.2)` | 10 | One dominant HIDZU tower, stepped crown, identity face toward south-west |
| `logistics.depth-north` | `(30,5.5)`–`(33,10)` | 6 | Logistics depth beyond the gate |
| `logistics.depth-south` | `(30,10)`–`(33,14.5)` | 5 | Logistics depth and service-entrance frame |
| `service.north` | `(30,15)`–`(33,18)` | 4 | Service street wall |
| `service.terminal` | `(30,18)`–`(33,21)` | 3 | Camera-loop terminal frontage |
| `service.mid` | `(30,21)`–`(33,24)` | 5 | Right-frame identity wall |
| `service.workshop` | `(30,24)`–`(33,27)` | 4 | Workshop/service identity |
| `service.shrine-wall` | `(30,27)`–`(33,30)` | 3 | Shrine threshold and south return |
| `safehouse.workshop` | `(12,28.5)`–`(15.5,31)` | 2 | Low safehouse-lane frontage |
| `safehouse.home` | `(12,31)`–`(15.5,37)` | 4 | Safehouse quarter identity |
| `safehouse.corner` | `(20.5,31)`–`(24.5,37)` | 3 | Frames the court behind the camera |
| `safehouse.service-edge` | `(24.5,30)`–`(28,37)` | 3 | Low service-return boundary |

`hidzu.landmark` is the only mass above seven floors and is at least two floors taller than every other parcel. Its podium may expose three `2.4`-unit facade bays but remains one landmark identity. Foreground parcels intersecting `y >= 23.5` and `x <= 21.5` remain at or below three floors with roof props below one unit so the crossing, people, barrier, and tower base stay visible.

### 6.5 Public-realm fixtures and authored presence

| Element | Placement | Required presentation |
|---|---|---|
| Transit shelter | `(14.2,23.5)`–`(16.8,24.4)` | Bench, timetable screen toward camera, two seated and one standing passenger slots |
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

### 6.8 Hero-camera derivation

The camera family remains `1440×900`, orthographic isometric, `45°` azimuth, `30°` elevation. The old target `{29,22}` and its crop registration are retired. The v6 camera solver derives translation and orthographic scale from the plan once, records the exact result in the versioned recipe, and may not move individual geometry to compensate for a bad crop.

The solver must place these plan facts within the following normalized screen boxes in the raw greybox:

| Fact | Required screen box `(x/W, y/H)` |
|---|---|
| Junction centre | `x 0.44–0.52`, `y 0.57–0.64` |
| Café frontage | `x 0.10–0.25`, `y 0.42–0.60` |
| Transit shelter and people | `x 0.20–0.36`, `y 0.60–0.76` |
| Barrier and guard | `x 0.58–0.72`, `y 0.40–0.56` |
| HIDZU identity face/crown | `x 0.57–0.76`, `y 0.08–0.35` |
| Sneak-seam mouth | `x 0.54–0.66`, `y 0.55–0.68` |
| Foreground roof band | lower edge only, at most `0.18H` |

The tower crown and complete future HIDZU face must be inside the frame. The barrier and tower must overlap vertically as one destination/obstacle read. No other silhouette may exceed seven floors or compete with the landmark.

### 6.9 Replacement probe fixture

The 2026-08-08 24-point fixture is retained only with the rejected v4/v5 records. V6 authors a new fixture from this plan with `0.32` clearance.

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
| 19 | `(13.5,33)` | rejected inside `safehouse.home` |
| 20 | `(25.5,16.2)` | rejected inside `gate.guard-booth` |
| 21 | `(-0.5,22)` | rejected outside district |
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

- `Level0LayoutContract`, building footprints, collision, entrances, anchor coordinates, camera constants, occlusion regions, proof starts, minimap geometry, surveillance geometry, route tests, and position-pinning tests must be regenerated together from `get205-reference-native-v6`.
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
- If the plan greybox fails route connectivity, source/proportion feasibility, or the raw five-question read, facades and state bakes do not begin.
- Restart Attempt restores gate state and player position through the existing attempt baseline; it does not restore an old coordinate system.
- Existing initial texture failure, state-transition failure, stale-generation, and rollback rules remain unchanged.

## 11. Content-authoring requirements

- Build one versioned plan manifest from sections 6.1–6.9 before Blender work. The manifest is the only source for footprints, anchors, routes, gate collision, proof starts, and the replacement probe fixture.
- Derive a v6 Blender scene from recoverable Neo Tokyo 2 source geometry. Every production building/prop keeps named source object, material, transform, license/provenance, and authored-change records.
- Use 12–16 materially visible per-identity cutouts in the hero neighborhood; additional safehouse/logistics identities may exist outside the hero. Never merge a continuous wall into one depth anchor.
- Outside-bounds backdrop mass is allowed only behind the north/west/east frame edges, never as reachable fake geometry.
- The plan gate package contains: dimensioned top-down plan, parcel/anchor overlay, raw fixed-camera greybox, Reference 2 side-by-side, occlusion-aware identity masks, route/probe report, and an annotated answer key supplied only after the requester performs the blind read.
- The raw greybox must answer all five questions without HUD labels: where to go, what blocks the direct route, where to blend, what to hack, and where to sneak.
- After plan approval, freeze exact camera constants and accepted plan/greybox frames as v6 baselines. Only then begin source-facade identity and wet blue-black look work.

## 12. Edge cases and prohibited shortcuts

- Do not preserve any old coordinate, route polygon, footprint, anchor, camera target, crop, or probe verdict merely because runtime code currently contains it.
- Do not move the tower away from the controlled street, place the gate behind foreground roofs, leave the barrier decorative, or put the restricted boundary across a public route.
- Do not widen plazas to create composition breathing room. Density comes from continuous 2–3-unit frontage parcels and route-width public space.
- Do not satisfy identity count through hidden objects, token slivers, one wall split into fake IDs, or declared recipe count without rendered masks.
- Do not bake actors into environment plates or replace authored mission presence with random NPC allocation.
- Do not use AI-generated concept geometry as production source identity.
- Do not weaken the wet-look, proportion, source-provenance, three-state delivery, accessibility, or live-evidence gates during the topology rebuild.
- Do not produce full-resolution state masters, cutouts, runtime assets, or publication changes before requester approval of the reference-native plan greybox.

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

- Inspect the dimensioned plan and confirm that it is Reference 2's implied Y/T intersection and mission staging extended into a safehouse quarter, logistics depth, service alley, and one sneak bypass—not another four-block reinterpretation.
- Run all 22 static and four dynamic probes with exact recorded results; every required anchor has clearance and every required route state is connected as specified.
- View the raw `1440×900` greybox before the key. A stranger can point to the HIDZU destination, checkpoint obstacle, transit blend, visible terminal, and shadow bypass. Any wrong or missing answer rejects the plan.
- Confirm the tower/face is fully in frame, the gate and tower read together, the street-level crossing is unobstructed, and foreground roofs consume no more than `18%` of frame height.
- Occlusion-aware masks show at least ten materially visible identities, each at least `0.005` of full frame, and no identity exceeds `0.15`. Metrics support the visual decision; they cannot pass a failed read.

### Live gate

- After source/facade/look work, inspect live clean-world, current-HUD, overview, desktop/mobile, occlusion, actor-foot, and zoom evidence at the ticket's named viewports.
- Play both direct/checkpoint and sneak/service approaches under normal movement. The direct route is actually blocked while closed, the bypass remains usable, visible geometry matches collision, and mission interactions retain their existing semantics.
- Inspect dusk, blue hour, and curfew in the same rebuilt geography with aligned state transitions, no partial loads, no stale-state flash, and no geometry shift.

## 16. Owning Linear ticket

`T5` (`GET-205`) owns the reference-native v6 plan, greybox gate, source-derived city rebuild, anchor/collision/camera regeneration, wet blue-black three-state bakes, occlusion/profile/runtime publication, and live visual proof. `T8` (`GET-208`) owns expanded detection, trespass, human security, civilian reactions, and the deferred delivery blend. GET-205 remains non-terminal until the requester verifies the committed live build.
