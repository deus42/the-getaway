---
status: review-required
type: specification-review-queue
---

# Specification Review Queue

These are the remaining product decisions that materially affect implementation. They are not permission to invent an untracked value. Each item includes a recommended baseline so the team can build, inspect, accept, alter, postpone, or remove it efficiently.

## Execution treatment

- The documentation package and separate GET-201 commit are the program entry gate. The existence of open items does not keep every implementation ticket in `Todo`.
- `Critical` means the affected behavior cannot be accepted as final while the decision remains open. The owning ticket may implement the recorded recommendation as a reversible provisional trial when its progress note and Linear comment identify the assumption, implementation seam, live proof, and rollback path.
- `High` means the affected player-facing surface may be explored with the recorded recommendation but must be resolved before that surface is accepted or the ticket moves beyond `In Review`.
- A provisional trial remains an `OPEN-*` item. It is not an `Approved` decision, may not be described as final, and must be easy to revise after live review.
- A missing baseline, irreversible scope/license/save decision, or contradiction with an approved rule stops only that implementation seam until the queue and owning specification are corrected.
- GET-202 owns recovery rather than product tuning and has no direct `OPEN-*` blocker. It may start immediately after the GET-201 documentation commit is validated.

## Narrative and fiction

| ID | Priority | Decision required | Recommended baseline | Affected tickets / acceptance gates |
|---|---|---|---|---|
| OPEN-NAR-001 | Critical | Why and when the protagonist moved to Tokyo | They left Miami after the Battle and built an ordinary expatriate life in Tokyo before following a fragment of their father's detention trail. | T7, T10 |
| OPEN-NAR-002 | Critical | Exact evidence that caused Hidzu to flag the protagonist | A freight-identity record linking the father's transfer number to a Hidzu logistics subcontract; opening it correlates the protagonist's identity across systems. | T9, T10 |
| OPEN-NAR-003 | High | Takahiro Kobayashi's title and knowledge | Executive Chairman; public safety visionary; personally approves the Cold Iron supply relationship but does not know the protagonist. | T5, T10 |
| OPEN-NAR-004 | Critical | Lira's identity, relationship, and ability to arrange passage | Medical mutual-aid courier with prior practical history with the protagonist; she controls one place on a covert multi-leg cargo route. | T9, T10 |
| OPEN-NAR-005 | Critical | Immediate beneficiary of the medkits | A small undocumented clinic serving people excluded by Hidzu identity scoring; no visible crowd of generic victims is required. | T9, T10 |
| OPEN-NAR-006 | High | Why Hidzu seized the supplies | Automated compliance seizure for an invalid clinic identity plus deliberate pressure on Lira's network. | T9, T10 |
| OPEN-NAR-007 | Critical | Why midnight ends the operation | The outbound credential expires when Hidzu's nightly identity reconciliation runs and the cargo leg closes. | T3, T9, T10 |
| OPEN-NAR-008 | Critical | Exact manifest contents | Shipment of identity-scoring accelerators and verifier-drone inference modules from Hidzu to Eisenclave/ESD staging logistics for Cold Iron. | T9, T10 |
| OPEN-NAR-009 | High | George's origin and hardware | Local encrypted model on a personal wearable/retinal AR channel, offline-capable, network-isolated by default; only the protagonist perceives the overlay. | T6, T9 |
| OPEN-NAR-010 | High | Naila biography and knowledge provenance | Former Hidzu network contractor helping people avoid identity exclusion; knows topology but lacks live privileged access. | T6, T9, T10 |
| OPEN-NAR-011 | High | Brant biography and knowledge provenance | Independent service courier whose work depends on reading Hidzu delivery routines; not a resistance operative. | T6, T9, T10 |
| OPEN-NAR-012 | High | Capture fiction | Administrative detention and disappearance into Hidzu identity custody; fail screen avoids depicting unimplemented incarceration. | T8, T10 |
| OPEN-NAR-013 | High | District name and social identity | A mixed transit/logistics district shaped by a Hidzu civic hub, service streets, public delivery activity, and residential edges. Final Japanese name requires cultural review. | T3, T4, T5, T10 |
| OPEN-NAR-014 | High | Diegetic language policy | UI/dialogue ships in English and Ukrainian; authored Japanese signage and announcements are translated contextually, not replaced by Ukrainian fiction. | T5, T9, T10 |
| OPEN-NAR-015 | Critical | Exact public identity and function of the Hidzu logistics site | A Hidzu logistics-compliance annex attached to a service-distribution hub, publicly framed as a safety/identity hold facility rather than a military base. | T4, T5, T9, T10 |

## Gameplay and tuning

| ID | Priority | Decision required | Recommended baseline | Affected tickets / acceptance gates |
|---|---|---|---|---|
| OPEN-RPG-001 | Critical | Check requirement scale and exact Level 0 requirements | Use 2 routine, 3 trained, 4 demanding, 5 expert, 6 exceptional; use the proposed matrix in [[13 Level 0 Content and State Matrix]]. | T7, T9, T10 |
| OPEN-RPG-002 | Critical | Level 0 XP award and first threshold | Trial a `100 XP` Level 2 threshold: award `50 XP` once for explicit medkit return and `50 XP` once for outbound-transit validation. The second award makes Level 2 pending; allocation remains safehouse/debrief-only and grants two skill points. | T7, T10 |
| OPEN-RPG-003 | High | Derived stats beyond Health/Paranoia | No derived player-facing stats in Level 0; movement and surveillance use authored constants plus named skills only where specified. | T7, T8 |
| OPEN-RPG-004 | Critical | Exact fact and situational-modifier rule for every deterministic check | Freeze every modifier by stable fact/context ID. Recommended: no modifier for Naila/Brant contact checks; Brant protocol lowers public blending and named public-route Influence by 1 but never guarantees; Naila topology lowers camera-loop requirement by 1; Naila Cold Iron pattern guarantees manifest recognition only; a node-named nearby hiding fact lowers Evasion by 1; all other listed checks receive no undeclared fact bonus. | T7, T9, T10 |
| OPEN-RPG-005 | High | Callsign normalization and display validation | Normalize to Unicode NFC, trim and collapse whitespace, allow 1–24 Unicode code points using letters/numbers plus internal space, apostrophe, hyphen, underscore, or period, and reject control characters or unsupported punctuation. Store and display the normalized value identically in every locale. | T7, T9 |
| OPEN-HLT-001 | Critical | Authored Health costs | Minor escape 10, dangerous escape 25, severe interception 40; never apply unpreviewed damage. | T7, T8, T10 |
| OPEN-PAR-001 | Critical | Paranoia event amounts/rates | Use discrete communicated events where possible; if sustained exposure needs a rate, define one shared network rate and cap it per state. | T7, T8, T10 |
| OPEN-PAR-002 | High | Smaller recovery amounts | Trusted Lira/Naila conversation −10 once; difficult successful recovery −5; no stacking farm. | T7, T9, T10 |
| OPEN-TIME-001 | Critical | Beat-level time budget for both routes | Trial first-run wall-clock bands: character creation 1–2 min; safehouse/Lira 2–3; optional preparation 0–4; infiltration/recovery 6–8; escape/return 3–4; validation/debrief 2–3. Segment maxima do not stack; total remains 15–20 min. Trial dusk departure by 19:15–19:45; curfew uses safe waiting; reserve at least 60 world minutes for return/validation. | T3, T10 |
| OPEN-MOV-001 | Critical | Direct click movement exact behavior | Hold straight-line intent until arrival/collision/new input; no click queue; collision slide; blocked click shows nearest reachable point but does not route there automatically. | T3 |
| OPEN-MOV-002 | High | Movement speeds and isometric WASD mapping | Author one walk speed first; postpone explicit sneak/sprint stance unless playtest proves it necessary. | T3, T8 |
| OPEN-MOV-003 | High | Camera default zoom versus 0.60 floor | Set default from actor/entrance readability in the accepted master-scene blockout; retain 0.60 as normal floor and decide whether a diagnostic overview may go lower. | T3, T4 |
| OPEN-SUR-001 | Critical | Camera concern rate and Suspicious threshold | Require enough visible exposure for recognition and one correction opportunity; tune from a fixed route test, not arbitrary seconds. | T8 |
| OPEN-SUR-002 | Critical | Pursuit confirmation rule | Confirmation requires continued exposure after Suspicious, explicit identity checkpoint, or drone verification; never a hidden timer alone. | T8 |
| OPEN-SUR-003 | Critical | Search/recovery timings | Search last-known area long enough to require a real hide/blend decision but short enough to avoid passive waiting; lock after greybox timing tests. | T8 |
| OPEN-SUR-004 | High | Camera-loop duration and network scope | Loop only the connected approach camera group for one crossing window; exact duration follows route measurement. | T8 |
| OPEN-CIV-001 | Critical | Civilian counts, schedules, and blending behavior | Use small authored groups tied to public-route contexts, not a simulated crowd; each group has visible arrival/hold/depart phases. | T3, T8, T10 |
| OPEN-SEC-001 | Critical | Human security count and schedules | Use the smallest authored set that makes both routes credible; security verifies and intercepts but does not enter combat. | T3, T8, T10 |
| OPEN-LAYOUT-001 | Critical | District dimensions and loop geometry | Determine from two-to-three-minute outer-loop walking time and target viewports, not from the old 54×38 or 96×72 maps. | T3 |
| OPEN-LAYOUT-002 | Critical | Street/sidewalk/alley widths | Establish from actor scale, camera coverage, passing space, and public blending needs in greybox. | T3, T4 |
| OPEN-LAYOUT-003 | Critical | Exact locations/counts for hiding, blending, contacts, devices, entrances | Place only after route timing and sightline tests; minimum contexts are listed in [[13 Level 0 Content and State Matrix]]. | T3, T8 |
| OPEN-LAYOUT-004 | High | Safehouse boundary and exterior presentation | Keep it outdoor-readable with a clear planning boundary; no full interior in Level 0. | T3, T4, T5 |
| OPEN-LAYOUT-005 | Critical | Exact preparation/departure topology and when the Retry snapshot is created relative to Lira/Naila/Brant visits | Treat Lira and optional contacts as a compact pre-operation planning loop, then require one explicit safehouse departure action after preparation; keep the return leg short and never make contact consultation mandatory. | T3, T10 |
| OPEN-SAFE-001 | Critical | Safehouse entry and action behavior while observed, Suspicious, or in Pursuit | The boundary is not a magical escape: crossing it never clears surveillance. Disable Wait, Rest, save, level-up, George planning, and terminal actions unless the network is Clear and the player is unobserved; Suspicious/Pursuit continue under their normal evidence and recovery rules, with a visible unavailable reason. | T3, T8, T9, T10 |

## Presentation, content, and production

| ID | Priority | Decision required | Recommended baseline | Affected tickets / acceptance gates |
|---|---|---|---|---|
| OPEN-UI-001 | High | Exact four-lane width allocation | Minimap 24%, protagonist 25%, George 27%, quest 24% at desktop; collapse behavior must preserve all four functions. | T9 |
| OPEN-UI-002 | High | Character creation and main-menu visual ownership | T9 owns shell/layout; T6 owns appearance art; both must join graphic surveillance noir acceptance. | T6, T9 |
| OPEN-UI-003 | High | Dialogue and dossier wireframes | Use anchored world-visible overlays with fixed reading widths and no simulation leak; produce target-viewport wireframes before final acceptance. | T9 |
| OPEN-ART-001 | Critical | Exact Direction B reference artifact | The original artifact is unavailable. Trial the registered local replacement `art/blender/get205/.generated/reference/hidzu-direction-concept-v1.png` at SHA-256 `148876622bbe3e76166acb112bb7ef8d7f300bc3925a8a51b7d28fe3b6c61760` against the prompt/rubric in `hidzu-treatment.json`; accept, replace, or remove it after requester visual review. It remains provisional local evidence, not production authority. | T5 |
| OPEN-ART-002 | Critical | Exact Neo Tokyo 2 asset selection and license/provenance manifest | Inventory chosen assets, source paths, transformations, and prohibited committed geometry before master-scene work. Current acquisition-specific entitlement remains unavailable, so T4/T5 generated derivatives stay ignored local evidence and cannot be promoted to runtime. | T4, T5 |
| OPEN-ART-003 | High | Actor runtime scale and frame occupancy | The initial shared `1.15` trial was too weak at the `0.60` floor in live greybox evidence. Trial one reversible shared `1.30` scale with unchanged `64×96` frames, origin, anchors, and occupancy; accept, revise, or roll back only after default/0.60 screenshots in the final city context. | T6 |
| OPEN-ART-004 | High | Lighting-state export and crossfade timing | Bake aligned dusk, blue-hour, and curfew states; define runtime crossfade after performance and readability proof. | T4, T5 |
| OPEN-AUD-001 | High | Audio source/licensing and loudness budget | Use licensed/original cues with a simple priority/mixing table; drone, network transitions, objectives, and dialogue UI must remain distinct. | T10 |
| OPEN-LOC-001 | High | Full English/Ukrainian content ownership | Author one canonical semantic node set, then localize; validate state equivalence automatically and review voice/tone manually. | T9, T10 |
| OPEN-ACC-001 | High | Accessibility baseline | Lock text scaling, reduced motion/flash, volume controls, color-independent risk cues, keyboard parity, and readable subtitles before UI acceptance. T5 must prove objective, civic, technology, caution, and threat hooks with shape/placement/value cues rather than color alone. | T5, T9, T10 |
| OPEN-PERF-001 | High | Level 0 performance/load budgets | Set target hardware, first-load budget, texture/memory ceiling, and stable frame target before committing tiled Blender derivatives. T4/T5 may measure ignored local evidence against the documented provisional ceiling without calling it an accepted shipping budget. | T4, T5, T6, T10 |

## Review completion rule

A Critical item must be decided before the affected provisional behavior is accepted as final. High items must be decided before the affected player-facing surface is accepted. Accepted decisions move into [[12 Game Design Decision Register]] with provenance and update every owning specification and Linear ticket. Rejected trials are removed or replaced through the same traceable path.
