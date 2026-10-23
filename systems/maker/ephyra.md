# Moon-jelly ephyra pulse (`ephyra`)

> Each letter is an Aurelia strobila (stack of discs along the stroke); discs mature from the oral end, pop off as 8-armed ephyrae that drift to packed spots in the glyph and pulse. Clips: `pulse` (Fredoka wght 700 · wdth 100). Source: `visuals/maker/species/jellyfish-ephyra/ephyra.py`, `ephyra_clip.py`

Paths are relative to the living-type project root.

## 1. What it is
Scyphistoma strobilation: the polyp body segments into saucer discs, oral-most maturing first (lobed rim, rhopalia in marginal notches); each disc is released as an ephyra (8 arms, paired lappets, rhopalium per arm, radial canals, 4-cornered manubrium) that swims by pulsing. Darkfield HUDDI; green on rhopalia, cream on canals.

## 2. How it works
Procedural, field-driven; no physics.
- **State** (`ephyra.py:build`): `sd`, `sk = skeleton(mask)`; skeleton components labelled (8-connected, ≥ 15 px); per component the oral start = lowest skeleton terminal; `geo` = `MCP_Geometric` arc length along the skeleton from the starts; `g_abs` = arc length projected to every pixel via nearest skeleton pixel (EDT indices) then mask-normalised blur σ 7 (keeps grooves transverse through curves); `g_n` = arc length / component max; `halfw = median(−sd[sk])`.
- Ephyra sites (`ephyra_clip.py:setup`): dart-throwing Poisson disk in `−sd > 0.45·R0`, min distance `1.62·R0`, `R0 = 0.52·halfw`, first 120 000 random candidates; each gets birth spot `P0` = nearest skeleton pixel, release time `trel = 2.6 + 2.4·clip(g_n + N(0, 0.03))`, radius `R0·(0.85 + 0.3U)`, rotation, phase, spin N(0, 0.25), pulse frequency `1.2 + 0.35U` Hz.
- **Per frame** (`ephyra_clip.py:frame`):
  - strobila: `fs = ss(0.3, 2.6, t)`; segmented region `seg = smoothstep(1.15fs+0.05, 1.15fs−0.10, g_n)`; `crest = |sin(π·g_abs/Pd)|`, `Pd = 0.62·halfw`; `mature = (1 − ss(0.15, 0.85, g_n))·seg`; outline constriction `shape = −sd − (1−crest)·halfw·(0.10 + 0.38·mature)·seg`; released discs removed by `gone = smoothstep(rel−0.02, rel−0.08, g_n)` with `rel = (t−2.6)/2.4`; rhopalia where `crest > 0.93`, `|shape| < 1.5`, `mature > 0.45`.
  - tentacle crown at each oral end: 16 tentacles, resorbed by `1 − 0.75·ss(1.2, 4.0, t)`.
  - ephyrae: after `trel` slide `P0 → P` over `T_DRIFT = 1.1 s`, fade in over 0.35 s, wobble ±1.2 px; pulse `pul = 0.5 − 0.5cos(2π(freq(t−trel) + ph))`, radius `R·(0.6 + 0.4u)·(1 − 0.18·pul)`; shape `ephyra.py:ephyra_poly` (arm coordinate `(θ−rot)·4/π`, arm profile `clip(1 − d/0.36)^0.7`, lappet notch `1 − 0.2·exp(−(d/0.045)²)`).
- **Randomness / seeds:** rng 5 (sites), 11 (tentacles), 1 (granularity), 100 + i, 4000 + i (finish).
- **Lifecycle:** polyp → strobilation (keyframed by g_n) → release (ordered oral → aboral) → settle in a packed site → pulse (hold). No decay.

## 3. Glyph coupling (GlyphSource)
`mask`, `sdf`, **centreline/skeleton** (arc length, oral ends from terminals, nearest-skeleton projection), stroke half-width (`median(−sd[sk])`, one global value). No counters, no direction field (implicit in arc length), no legibility module. A replaced font or SVG works through the raster; a hand-drawn PencilKit stroke is actually a better input (its path *is* the centreline and its order gives the oral end directly).

## 4. Controls & parameters
| Param | Type / range | Default | Unit | What it does | Exposed to jig? |
|---|---|---|---|---|---|
| **`T_STROB`** (hero knob) | (s, s) | (0.3, 2.6) | s | strobilation window | Director (proposed) |
| **`T_REL`** (hero knob) | (s, s) | (2.6, 5.0) | s | release window (oral first) | Director (proposed) |
| **R0 / packing** (hero knob) | ×halfw | 0.52, min dist 1.62·R0 | – | ephyra size and count (legibility by packing) | proposed |
| **pulse freq** (hero knob) | Hz | 1.2–1.55 | Hz | bell pulse rate | proposed |
| disc pitch `Pd` | ×halfw | 0.62 | – | groove spacing | – |
| constriction depth | ×halfw | 0.10 + 0.38·mature | – | saucer stack depth | – |
| `T_DRIFT` | s | 1.1 | s | release slide | – |
| pulse amplitude | – | 0.18 | ×R | contraction | – |
| legibility | – | not in code | – | – | – |

## 5. Timeline / arc
8 s keyframed: polyp → strobila 0.3–2.6 → release 2.6–5.0 → pulsing swarm. Caption clock ends at 5.6 s and then says "now real time".

## 6. Camera & optics
Darkfield HUDDI (`huddi_finish`); tilted plane `clip(|0.6x + 0.4y − 0.45|·2.3, 0, 2.2)`, ephyrae get a random per-blob depth offset (G₁₈ of a binary noise ×0.6); tentacles +0.8. Palette: ink rims/body, cream canals, green rhopalia. Scale 1 mm.

## 7. Performance & tiers
Box: build seconds (MCP, EDT); per frame several hundred ephyra polygons + 4 DOF layers: ~2–4 s/frame (`run` falls back to 540 if total > 200 s). [est] all tiers fine as instanced sprites with a vertex-shader pulse; A12: drop per-ephyra depth.

## 8. Port to macOS Swift/Metal
Textures: `sd`, `g_abs r16Float`, `g_n r16Float`, `crest` computed in-shader. Strobila: one fragment kernel (shape, edge, groove, rhopalia). Ephyrae: instance buffer (`P0, P, trel, R, rot, ph, spin, freq`) → vertex shader for slide + pulse + arm profile (procedural SDF of the 8-arm polygon in the fragment shader). CPU once per text: skeleton, arc length (graph walk from terminal), Poisson sites. Hooks: none real (no LifeKnobs species); proposed H1 (or render-only H5/H6), H7 `LivingTypeKnobs` (release window, packing, pulseHz), GlyphField skeleton product. Portable as-is.

## 9. Known gaps & next refinement
- No legibility knob; packing is the only legibility control.
- Single global half-width; thin vs thick strokes get the same disc pitch.
- Caption prints an invented `t = … d` clock (pre-rule).
- Ephyrae do not avoid each other while drifting (sites are disjoint, paths can cross).

## 10. Files & clips
- `visuals/maker/species/jellyfish-ephyra/ephyra.py`, `ephyra_clip.py`; font `visuals/fontcast/fonts/Fredoka.ttf`.
- Clip `ephyra-pulse-clip.mp4` 3.2 MiB / `-m` 0.5 MiB; stills `ephyra-1-forming.png`, `ephyra-2-formed.png`.
