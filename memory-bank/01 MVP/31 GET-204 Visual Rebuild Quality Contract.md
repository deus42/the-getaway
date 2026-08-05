---
status: MVP
type: visual-design-specification
tags: [get-204, visual-quality, city, blender, camera, acceptance]
canonical: true
---

# GET-204 Visual Rebuild Quality Contract

## 1. Authority and non-negotiable outcome

GET-204 is successful only when the requester sees a superb, beautiful, coherent live game frame and explicitly approves it. Ticket state, gate completion, asset counts, validators, offline renders, internal ratings, and technical effort are supporting evidence only.

The current Gate 1 implementation is a disposable prototype. It proves that Neo Tokyo 2-derived layers can run inside Phaser, but its geometry, camera, lighting, materials, population staging, collision candidate, and asset choices have no preservation right. Any element that prevents the final frame from reaching the references is replaced.

The rebuild produces one complete outdoor Tokyo district master scene. It is not another isolated intersection patch and is not constrained by the rejected nine-block map.

## 2. Locked visual references

Three durable reference images define different aspects of the target. They are complementary and must not be substituted for one another.

### Quality and rendering target

- File: `art/references/get204/canvas-quality-target.png`
- SHA-256: `ff53c06f9b03966c2468b9bf22e13449421b16f20101573929fcbbcc20083e6d`
- Owns: material richness, wet-surface response, facade detail, restrained atmospheric depth, warm practical lighting, cool blue-hour fill, readable midtones, reflections, building seating, signage integration, and overall finish.

This image is the minimum quality direction. The live result does not need identical objects or geography, but it may not regress to flat roads, blank facades, crushed black masses, isolated buildings, or unmotivated emissive rectangles.

### Normal-play composition target — Reference 2

- File: `art/references/get204/street-play-target.png`
- SHA-256: `66cc72f0ec09b928cf2d95f0fe3db61881776ba87f48c99c83852cf47583c9a9`
- Owns: close street-first camera, protagonist prominence, lower-center framing, human-scale architecture, dense low-rise edges, social clusters, readable entrances, ordinary life under surveillance, and foreground/context balance.

Reference 2 is the binding normal-play relationship. The live frame should feel like the player is standing in a street, not inspecting a board from above.

### Full-district composition target

- File: `art/references/get204/dense-city-target.png`
- SHA-256: `3cca77d4f57d7960b6b58869f8b3a4ddeb5589f2c46dbf7015e1e4c4d9860cd0`
- Owns: compact district silhouette, coherent skyline, three readable subdistricts, dense core, simpler edges, two or three taller landmarks, complete manual-zoom composition, and absence of blank or corrupted boundaries.

## 3. Player-visible promise

At normal play, the protagonist is the visual lead. The player can read their body, nearby people, entrances, cameras, the controlled threshold, and the next spatial decision without labels. Architecture creates a close street canyon around the player while leaving enough negative space for movement and observation.

At maximum manual zoom-out, the same world becomes one deliberately composed city district. It does not reveal a greybox, unfinished perimeter, repeated plates, floating bases, missing layers, or camera corruption.

The city must feel beautiful before it feels oppressive. Surveillance is embedded in a desirable, maintained public environment; institutional control becomes unsettling because the city is credible and inhabited, not because everything is dirty or black.

## 4. Scope of the rebuild

The rebuild owns the complete visible world frame required to judge the city:

- one full-district Blender master scene;
- city topology and architectural massing;
- streets, sidewalks, curbs, crossings, alleys, drainage, entrance aprons, and service areas;
- environment materials, blue-hour lighting, practical emitters, wet response, reflections, and atmosphere;
- cameras, checkpoint language, civic technology, Hidzu signage, public screens, utilities, and service props;
- authored public-life staging and representative civilian/security/drone presentation;
- normal camera distance, follow composition, manual zoom range, and foreground occlusion treatment;
- flattened runtime layers plus candidate collision, entrance, occlusion, mask, and anchor metadata derived from the visible scene.

The rebuild does not redesign quests, dialogue, progression, Paranoia, George behavior, surveillance rules, or HUD information architecture. It may reposition their world anchors only where necessary to agree with the new accepted city.

Final actor production remains owned by the actor specification, but the rebuild cannot hide behind visibly poor placeholders. The acceptance frame must use the best available grounded protagonist and representative street population at the correct scale and staging. Any remaining actor-art limitation is stated plainly and cannot be counted as accepted final presentation.

## 5. City composition

The district is authored as one connected place with three interlocking identities:

1. **Safehouse and backstreets** — tighter residential/service frontage, sheltered thresholds, ordinary utilities, plausible places to pause, and a discreet route into the public district.
2. **Transit and public-commercial streets** — the highest civilian presence, shelter/kiosk activity, small food or service frontage, public screens, visible cameras, and a legible route toward contacts and logistics.
3. **Hidzu logistics and civic control** — cleaner institutional materials, controlled entrances, delivery/service behavior, identity verification, cameras, and the mission objective without a military-fortress silhouette.

Mostly three-to-eight-storey buildings form continuous street walls. Two or three taller landmarks orient the district without dwarfing the player. Corners are architecturally resolved. Open space is rare, compact, and purposeful. Every large frontage gap becomes an entrance court, alley, loading seam, transit element, or other credible urban condition.

The mission skeleton survives: safehouse, Lira, optional Naila and Brant preparation, public and service approaches, logistics objective, return path, and outbound terminal. Exact old coordinates and footprints do not survive merely because code already references them.

## 6. Camera and character relationship

Normal play uses the Reference 2 relationship:

- close classic 2:1 isometric view;
- protagonist in the lower-center lead area;
- provisional default zoom centered around `1.28`, calibrated within `1.24–1.32` from live screenshots rather than accepted numerically in advance;
- protagonist visible height target approximately `95–115 px` at `1440×900`;
- nearby civilians and security use the same grounded scale relationship;
- enough surrounding street remains visible to read one immediate movement choice, one social context, and one surveillance relationship.

The camera may not solve weak composition by zooming so close that movement context disappears. Conversely, it may not reveal more architecture by shrinking the protagonist into a token.

Maximum manual zoom-out is a separate composed overview. It never becomes the normal framing and cannot expose unfinished world edges.

## 7. Material, lighting, and atmosphere contract

### Roads and public realm

- Asphalt has roughness variation, repairs, staining, drainage, lane wear, and restrained wet reflections.
- Sidewalks and curbs have real value, height, edge, joint, and material separation from the road.
- Crossings, service markings, entrance aprons, manholes, drains, and puddles reinforce scale and route identity.
- Reflections respond to visible lights and facade sources; they are not broad painted glow.

### Buildings

- Facades preserve readable midtone structure and material differences.
- Entrances, windows, shutters, signs, awnings, roof equipment, service fixtures, and ground-floor variation prevent blank masses.
- Buildings meet sidewalks through believable thresholds rather than floating pads or black seams.
- Window light varies by use and occupancy. Uniform emissive rectangles are rejected.

### Lighting

- Blue hour supplies cool ambient fill without crushing values.
- Warm practicals come from visible lamps, windows, kiosks, entries, and controlled thresholds.
- Technology cyan is scarce and attached to active Hidzu systems.
- Crimson is reserved for confirmed danger or a genuine restricted-state cue.
- Atmospheric depth separates near, middle, and far mass without hiding weak geometry in fog.

## 8. Street life and surveillance staging

Population is composed as behavior, not rows of sprites:

- civilians wait, talk, sit, use a terminal, work a kiosk, or move through a crossing;
- a service worker or delivery context supports the public infiltration route;
- security staff occupy believable controlled positions rather than decorative sentry symmetry;
- one unarmed verifier drone reads as civic-surveillance hardware, not a fantasy enemy;
- cameras are mounted where their geometry and institutional purpose make sense;
- planters, awnings, shelter elements, vending, utilities, bins, signage, and parked service vehicles reinforce place, navigation, surveillance, hiding, or blending.

No permanent labels, random filler, repeated crowd clones, tactical enemy staging, or decorative cyberpunk clutter are allowed.

## 9. Production approach

Neo Tokyo 2 remains the approved architectural source. The rebuild uses full-scale kit geometry as a coherent urban system, not as isolated catalog objects. Original project-owned gap fills provide roads, curbs, low-rise frontage, shelters, booths, signs, cameras, service vehicles, and other elements the pack does not supply adequately.

One master scene owns geometry, camera family, scale, materials, lighting, and object identity. Runtime layers, masks, collision, entrances, occluders, and anchors derive from that scene. There is no separate painted city that disagrees with gameplay geometry.

Raw vendor geometry, textures, extracted archives, and generated `.blend` files remain outside Git. Versioned recipes, source references, transforms, original assets, metadata, validators, and flattened game derivatives remain reproducible.

## 10. Internal build sequence

The rebuild is executed as one final city, with internal review stages that do not become separately accepted products:

1. Compose the complete district massing, street hierarchy, subdistricts, landmarks, close camera, and overview camera.
2. Reject or replace any composition that does not already read as Reference 2 at normal framing and the dense-city target at overview.
3. Author roads, sidewalks, curbs, crossings, alleys, thresholds, and service/public-realm geometry.
4. Establish final facade, ground, wet-surface, practical-light, and blue-hour treatment against the Canvas target.
5. Add authored street life, surveillance grammar, signage, utilities, and controlled-threshold detail.
6. Export registered layers and semantic metadata from the same master scene.
7. Integrate the complete scene into the live runtime, replace obsolete greybox collision and anchors, and verify movement and selective occlusion.
8. Capture and inspect the full acceptance matrix. Fix visible shortcomings before asking the requester to judge it.

The old Gate 1 may remain recoverable as historical evidence, but it cannot stay active beneath or around the new district.

## 11. Acceptance matrix

The rebuild is not presented for acceptance until all three primary frames are credible:

1. **Close live gameplay:** Reference-2-style normal camera with protagonist, public life, surveillance, entrances, and material depth.
2. **Clean visual frame:** Canvas-target quality without HUD, proving the world itself is beautiful.
3. **Full-district overview:** complete minimum-zoom composition with no greybox, blank edge, repeated plate, or corruption.

Capture clean and current-HUD evidence at `1440×900` and `1920×1080`; verify `1280×720` compatibility. Also inspect safehouse/backstreet, transit/public, logistics/controlled, foreground fade, movement, and curfew variants before presentation.

Before showing a candidate, the implementation must have no obvious failure in:

- camera intimacy and protagonist hierarchy;
- city density and human scale;
- road/sidewalk/facade material depth;
- motivated lighting and readable values;
- lived-in street activity;
- surveillance identity;
- world/collision/anchor agreement;
- normal and minimum-zoom composition.

An internal score or checklist does not accept the work. It only prevents an obviously weak candidate from being presented. Final acceptance belongs solely to the requester viewing and playing the live runtime.

## 12. Rejection conditions

Reject and continue rebuilding if any acceptance frame shows:

- flat or uniformly dark roads;
- blank, black, or floating facades;
- tiny protagonist or token-like people;
- camera too distant to feel street-level;
- isolated buildings, oversized setbacks, empty plazas, or board edges;
- decorative asset-catalog composition;
- repeated static actor rows;
- weak or unmotivated light;
- generic neon cyberpunk, fantasy styling, or militarized compound language;
- hidden greybox collision, roof actors, blocked required routes, broad translucency, or interaction drift;
- minimum-zoom seams, missing layers, voids, blur, or corruption;
- a live runtime visibly worse than the approved Canvas and Reference 2 relationships.

## 13. Ownership and governance

- Owning Linear issue: GET-204.
- GET-204 remains `In Progress` until the requester approves the committed live build.
- The current prototype is not committed as an accepted visual checkpoint.
- No downstream visual ticket is allowed to excuse or conceal a weak city foundation.
- The specification, GET-204 description/comments, Art Direction, Architecture, Roadmap, MVP Readiness, and `progress/GET-204.md` must remain aligned with this contract.
