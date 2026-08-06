---
category: engineering
type: historical-reference
status: superseded
---

# 3D → 2D Isometric Asset Pipeline — Historical POC

This note preserves the conclusion of GET-155 and the rejected GET-180/iso-compiler experiments. It is not the current Level 0 production contract.

## What the prototypes proved

- Blender can reproduce the runtime 64×32, 2:1 isometric projection.
- Transparent raster derivatives can be anchored, depth-sorted, and aligned to gameplay-owned collision.
- Source manifests, camera/light recipes, asset provenance, semantic masks, and validation can be deterministic and versioned without committing raw licensed geometry.
- Build and publish should remain separate so incomplete derivatives cannot silently replace a playable runtime bundle.

## What they did not prove

- A collection of separately rendered building sprites does not become a coherent city when assembled in Phaser.
- Numeric footprint validation does not prove correct human scale, street rhythm, lighting, actor readability, or visual quality.
- The sparse/fenced four-block compound, nine-parcel, `54×38`, `84×60`, and `96×72` experiments are not approved Level 0 topology. The later requester-approved dense four-block mission envelope is current and distinct.
- Generated synthetic replacements, opaque parcel plates, and per-building collage are not production art direction.
- Successful commands, validators, tests, or an AI visual rating are not requester acceptance.

## Current replacement

The approved production path is defined in:

- [[01 MVP/30 Art Direction (MVP)]] — graphic surveillance-noir visual rules and two-gate Blender workflow;
- [[Architecture]] — `Level0LayoutContract`, `Level0ArtManifest`, ownership, export data flow, and validation;
- [[Roadmap]] — T3 mission/runtime skeleton → T4 complete live city rebuild → T5 Hidzu Corporation identity → T6 actor follow-up;
- [[Building Positioning Runbook]] — measured alignment after the replacement layout is approved.

The current path uses the requester-owned Neo Tokyo 2 pack in one four-block outdoor Level 0 Blender master scene, with original gap-fill work only where public realm or gameplay needs it. GET-204 first presents actual same-master close and four-block overview renders for source/composition approval, then exports, reconciles, integrates, and presents the live candidate for separate acceptance. The mission skeleton stays authoritative for semantics while accepted city geometry is back-propagated into the shared layout contract. Raw vendor geometry/textures and generated `.blend` files remain untracked; requester-approved flattened game derivatives, original gap-fill assets, recipes, manifests, metadata, and validators may be committed.

## Historical artifact boundary

Old compiler commands, manifests, rendered atlases, and layout constants may be recovered from Git history and the verified GET-139 archive. They may be selectively salvaged under T2 only when they implement the new specification. Their presence in the worktree or archive gives them no current design authority.
