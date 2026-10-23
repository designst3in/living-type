# Radiolarian glass lattice (`radiolarian`)

> A letter-shaped cell secretes an opaline-silica test: a jittered-hex pore lattice crystallises outward from each letter's capsule, bars thicken, then spines and axopodia grow. Clips: `glass` (Fraunces wght 900 · SOFT 100 · WONK 1 · opsz 144). Source: `visuals/maker/species/radiolarian-lattice/radiolarian.py`, `radiolarian_clip.py`

Paths are relative to the living-type project root.

## 1. What it is
Polycystine radiolarian: central capsule + frothy ectoplasm in the letter's shape; a thin primary lattice of bars around round pores is laid down, thickens with age, then a solid rim, radial spines and beaded axopodia; yellow symbionts. Darkfield, 20×.

## 2. How it works
Not a time-stepped sim: fields computed once, then a scalar `front(t)` sweeps them.
- **State** (`radiolarian.py:build`): `sd`; `tau[S,S]` = per-letter normalised geodesic distance from the letter's thickest point (`skimage.graph.MCP_Geometric` on cost 1 where sd < 3, ∞ elsewhere; per-letter labels from letter masks dilated 7 px); pore lattice: hex grid spacing `a = 15.5 px`, jitter N(0, 1.6), kept where sd < −2; `D1` = distance to nearest pore centre (kd-tree, band sd < 4); `RP` = pore radius `(0.33 + 0.06·U)·a`.
- **Spines** (`radiolarian.py:spines`): edge pixels `|sd| ≤ 1` on convex parts (`laplace(G₆(sd)) ≥ 0.004`), ≥ 42 px apart, direction = normalised `∇G₃(sd)`, length `22 + 46·U^1.5`; dropped if the ray within 1.8× length meets another letter (sd < 2).
- **Per frame** (`radiolarian_clip.py:frame`): `front = 1.36·smoothstep(0.6, 5.0, t)^0.85`; `age = clip((front − tau)/0.35, 0, 1)·[sd<3]`; `bar_w = 0.45 + 0.55·age`; `pore = smoothstep(k+0.8, k−0.8, D1)` with `k = RP·(1 + 0.35(1−bar_w))`; `glass = clip(inside·(1−pore) + rim)·√age`; height `G₀.₇(glass)·(0.6 + 0.4·√(−sd/30))`; emission `clip(2.1|∇H| + 1.7·max(−0.7gx −0.7gy, 0) + 0.04·glass, 0, 1.3)`. Glints: random pixels at the front (age 0.02–0.22) with per-frame RNG, ×9. Spines grow over 1.3 s starting `4.0 + 0.9·tau` at their base; axopodia from 0.12 to full length starting `5.0 + 0.8·tau + 0.4·phase`, granules stream outward at 0.06 /s.
- Cytoplasm (static): capsule `smoothstep(−10.5, −24, sd)`, froth (distance to 5000 random points < 7 px), symbionts (sparse dots, G₂.₂ ×22).
- **Randomness / seeds:** module rng 3 (lattice), 101 (spines in clip), 500 + i (glints), 2000 + i (grain).
- **Lifecycle:** cell present → deposition front → bars thicken → spines → axopodia → mature hold. No decay.

## 3. Glyph coupling (GlyphSource)
`mask`, `sdf` (inside/rim/dome/lattice band/spine normals and convexity), per-letter masks (capsule start = argmin per-letter SDF; per-letter tau normalisation). Direction field = SDF gradient (outward normal), used for spines only. No skeleton, no counters, no legibility module. Works with any coverage raster; stroke half-width is hard-coded `hw = 30` px (dome, capsule), so very thin or very fat fonts need hw from `max(−sd)` per stroke.

## 4. Controls & parameters
| Param | Type / range | Default | Unit | What it does | Exposed to jig? |
|---|---|---|---|---|---|
| **pore pitch `a`** (hero knob) | px | 15.5 | px | lattice scale | proposed |
| **pore radius** (hero knob) | ×a | 0.33–0.39 | – | open vs solid glass | proposed |
| **front curve** (hero knob) | `1.36·ss(0.6,5.0,t)^0.85` | – | – | deposition timing | Director (proposed) |
| maturation width | 0.35 | tau units | – | how long bars take to thicken | – |
| spine spacing / length | 42 px; 22–68 px | – | px | spine density | proposed |
| jitter | 1.6 | px | – | lattice irregularity | – |
| `hw` | 30 | px | – | assumed half stroke width | – |
| legibility | – | not in code | – | – | – |

## 5. Timeline / arc
8 s keyframed: deposition 0.6–5.0 s, spines from 4.0, axopodia from 5.0, mature hold to 8 s.

## 6. Camera & optics
Darkfield (pre-HUDDI): glass `[0.80, 0.90, 1.0]`, amber cytoplasm, gold symbionts; tilted plane `0.15 + 0.9·|0.75x + 0.25y − 0.42|` (×2.2) with layer offsets; condenser flare `0.32·G₆ + 0.18·G₂₂`; dust, Köhler, vignette, near-black bg `[0.008, 0.010, 0.014]`. Scale 100 µm.

## 7. Performance & tiers
Box: build ~seconds (MCP + kd-tree); per frame a few seconds (blur stack). [est] all tiers fine: per-pixel arithmetic on precomputed textures; A12: drop glints and the 3-layer DOF.

## 8. Port to macOS Swift/Metal
Textures: `tau r16Float`, `D1 r16Float`, `RP r16Float`, `sd`. One fragment/compute kernel per frame (age → pore → glass → relief emission). Spines/axopodia: instanced quads from a CPU list. Geodesic tau: CPU once per text (Dijkstra/fast-marching), or GPU iterative relaxation. Hooks: real none directly (no LifeKnobs species matches; nearest is `Reaction` with `age` trigger); proposed H1 extension + H5 slot + H7 `LivingTypeKnobs` (porePitch, poreRadius, front). Portable as-is: all maths.

## 9. Known gaps & next refinement
- No legibility knob; front is a scalar curve, not a growth sim.
- Caption has invented `t = … h` clock (pre-rule).
- `hw` fixed at 30 px.

## 10. Files & clips
- `visuals/maker/species/radiolarian-lattice/radiolarian.py`, `radiolarian_clip.py`; font `visuals/fontcast/fonts/Fraunces.ttf`.
- Clip `radiolarian-glass-clip.mp4` 1.6 MiB / `-m` 0.3 MiB; stills `radiolarian-1-forming.png`, `-2-formed.png`.
