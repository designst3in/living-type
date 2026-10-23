# Stony-coral budding colony (`coral`)

> Planulae settle at each letter's foot; corallites bud outward along geodesic age until the letters are tiled with cups; at night polyps open with flickering fluorescent tentacle tips. Clips: `coral` (Bricolage Grotesque opsz 96 · wght 800 · wdth 100). Source: `visuals/maker/species/coral-polyps/coral.py`, `coral_clip.py`

Paths are relative to the living-type project root.

## 1. What it is
Scleractinian colony (*Galaxea fascicularis*): clonal polyps in cups (corallites) with 6 + 6 septa, joined by coenosarc; extratentacular budding spreads the colony; at night polyps expand tentacle crowns; GFP-like green fluorescence on tips; zooxanthellae speckle. Darkfield HUDDI.

## 2. How it works
- **State** (`coral.py:build`): `sd`, `sk`, `hw = median(−sd[sk])`; polyp centres `C` = Poisson disk (`coral.py:poisson`, dart throwing, ≤ 80 000 tries) in `−sd > 7` with min distance `1.65·R`, `R = 0.62·hw`; founder per letter = lowest skeleton pixel of that letter; `geo` = `MCP_Geometric` inside the mask from founders; polyp `age = 1 − geo/geo_max`.
- `coral_clip.py:setup`: appearance time `ta = T_SET + T_GROW·(1 − age)`; **budding parent** = nearest polyp with smaller `1 − age` (strictly older); per polyp radius `R·(0.92 + 0.16U)`, septa rotation, night opening `te = T_NIGHT + 0.2 + 0.9U`, tentacle curl N(0, 0.25), flicker phase/frequency (0.8–2.4 Hz) per tentacle; tentacle room = `max(−sd, r)` (crowns stay on the letter).
- **Per frame** (`coral_clip.py:frame`): planulae (ellipses) swim from above to founders until `T_SET`; each polyp after `ta` grows `g = ss(ta, ta+0.55)`: slides out of its parent's cup (`C[par]→C[k]`), radius `0.35 + 0.65g`, secondary septa after g > 0.4; opens `e = ss(te, te+0.8)` (retracted cream knot if e < 0.12); 10 tentacles, length `min(r(0.8 + 0.35e), room + 4)`, tip brightness `(0.5 + 0.5 sin(2π(ff·t + fph)))³`.
- Coenosarc: `G₂(mask)` + bright margin `3.5|∇|` + zooxanthellae (random > 0.965 speckle).
- **Randomness / seeds:** 17 (sites), 23 (polyp attributes), 5 (textures).
- **Lifecycle:** settle (planula) → bud outward by geodesic age (parent→child) → hold (dusk, retracted) → night opening + flicker. No decay.

## 3. Glyph coupling (GlyphSource)
`mask` (geodesic domain, coenosarc), `sdf` (site domain, tentacle room), `skeleton` (hw, founders), per-letter masks (one founder per letter). No counters, no direction field, no legibility module. Any coverage raster works; founders need per-letter ids or connected components.

## 4. Controls & parameters
| Param | Type / range | Default | Unit | What it does | Exposed to jig? |
|---|---|---|---|---|---|
| **R (cup size)** (hero knob) | ×hw | 0.62 (min spacing 1.65·R) | – | corallite size / count | proposed |
| **`T_GROW`** (hero knob) | s | 3.9 | s | budding sweep duration | Director (proposed) |
| **`T_NIGHT`** (hero knob) | s | 5.6 | s | polyps open | Director (proposed) |
| **flicker** (hero knob) | Hz | 0.8–2.4, cubed sine | Hz | tip fluorescence twinkle | proposed |
| `T_SET` | s | 1.0 | s | planula settle | – |
| bud share (stills) | p | 0.22 | – | figure-of-eight cups in the forming still | – |
| tentacles | count | 10 | – | per polyp | – |
| legibility | – | not in code | – | – | – |

## 5. Timeline / arc
8 s keyframed: settle 0–1 s, bud 1.0–4.9 s, dusk hold, night opening from 5.8 s. Emergent only in the order (geodesic age).

## 6. Camera & optics
Darkfield HUDDI; plane `clip(|0.6x + 0.4y − 0.46|·2.3, 0, 2.2)`, skeleton layer +0.25 behind tentacles. Ink walls/septa, cream oral discs/zooxanthellae, green acrospheres. Scale 5 mm. Captions say `time-lapse` only.

## 7. Performance & tiers
Box: ~200–300 polyps × (12 septa + 10 tentacles) lines per frame; ~1–3 s/frame. [est] trivial on all tiers as instanced sprites.

## 8. Port to macOS Swift/Metal
Instance buffer per polyp (`C, par, ta, te, r, a0`, 10 curls/phases); vertex shader for slide/grow; procedural corallite SDF in fragment shader; coenosarc from `glyphMask` blur. CPU once: Poisson, geodesic (fast-marching), parent assignment. Hooks: real nearest analogue `LifeKnobs.rdFeed/rdKill` + `coral` pigment (`Knobs.swift:194-195`) is the Gray–Scott "coral", **a different thing**; nothing maps directly. Proposed: H5 slot or a pure render pass, H7 `LivingTypeKnobs` (cupSize, growSecs, nightAt).

## 9. Known gaps & next refinement
- Budding is replayed by age, not simulated (no crowding or competition).
- No legibility knob.
- Tentacle crowns can overlap neighbours.

## 10. Files & clips
- `visuals/maker/species/coral-polyps/coral.py`, `coral_clip.py`; font `visuals/fontcast/fonts/BricolageGrotesque.ttf`.
- Clip `coral-coral-clip.mp4` 2.8 MiB / `-m` 0.3 MiB; stills `coral-1-forming.png`, `coral-2-formed.png`.
