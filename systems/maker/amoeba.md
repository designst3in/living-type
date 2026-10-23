# Amoeba 'counter' (`amoeba`)

> An *Amoeba proteus* creeps in from the left as an implicit SDF body, throws a pseudopod at each letter's counter, floods and digests the counters first (letters turn into anonymous blobs), then engulfs and digests the strokes; swallowed letter patches ride backwards in food vacuoles. Legibility animates 1.0 → 0.1. Clips: `counter` (Rubik Puddles; Rubik 900 = identical base outline used for the counter map and faint puddle body). Source: `visuals/maker/species/amoeba-counter/amoeba_clip.py`

Paths are relative to the living-type project root.

## 1. What it is
Amoeboid locomotion + phagocytosis: lobed advancing front, pseudopods, fountain-streaming endoplasm granules, nucleus, contractile vacuole that fills and bursts, food vacuoles digesting what was eaten. The typographic joke: the *counters* go first. Darkfield HUDDI; green only on the contractile vacuole.

## 2. How it works
Implicit-surface body (signed field `f`, > 0 inside) evaluated on the full 1080² grid every frame; scheduled, not simulated.
- **Glyph** (`masks`): `g` = Rubik Puddles raster ('counter', fitted to 0.86 × 0.40); `B` = Rubik wght 900 raster at the same origin (the puddle body, analysis only); per-letter Rubik 900 masks `LB`.
- **State** (`setup`): per letter: counter region `cl = (closing(lb, disk 27) | fill_holes(lb)) & ~lb`, opened by disk 3 (so open counters like 'c' and 'u' count); `inner` = glyph pixels within 4 px of the counter (the puddle crescent marks); pseudopod target = counter centroid (or letter centre if < 30 px); tip time `t_tip = t_of_x(target.x − 330) + 0.75`; counter SDF. Food vacuoles: 3 per letter, each a 44×44 patch of glyph + 0.14·body cut from deep inside the letter (`csd < −6`), launch time after the front passes, velocity (−38..−22, ±6) px/s, spin. 6000 granules. Engulf time per pixel `teng = t_of_x(x)`.
- **Per frame** (`frame`): front position `X(t) = −150 + 1420·clip((t − 0.2)/8.4)^0.92`; body field `f = smin(m1, hb − |y − CY − 20 sin(x/160 + 0.5t)|, 30)` with lobed front `m1 = X + 34 sin(y/57 + 1.3t) + 20 sin(y/23 − 2.1t + 1) − x` and lobed band half-height `hb = 175 + …`; pseudopods = tapered capsules (r 36 → 19 + 5 sin) from `(X − 60, base_y)` toward the target, progress `ss(t0, t_tip)`, joined with `smax(·, ·, 18)`; counter flood `fcl = min(70·fl − |p − target|, −cntsd + 3)`, `fl = ss(t_tip − 0.1, t_tip + 1.4)` only while `k > 0.08`. Counter digestion: glyph `inner` pixels × `(1 − cp)`, `cp = ss(t_tip, t_tip + 0.9)·ss(0.04, 0.12, k)`. Stroke digestion: `pr = ss(teng + 0.8, teng + 4.4, t)·inside·(0.55 + 0.30·noise)` → `legibility.consumed(g, pr, l, gblur)` (and on the puddle body). `smin`/`smax` are polynomial smooth min/max.
- Legibility `l(t) = 1 − 0.9·ss(0.4, 9.3, t)`.
- Contractile vacuole: period 2.6 s, radius `26·ph^0.7`, bursts at ph 0.93–1.0.
- **Randomness / seeds:** 31 (all), 6000 + i (finish).
- **Lifecycle:** reach (pseudopods) → lock-on (tip at counter) → eat counters → engulf (front passes) → digest strokes (`consumed`) → vacuoles drift back and fade (`dig = 1 − 0.55·ss(0.5, 4.5, age)`).

## 3. Glyph coupling (GlyphSource)
`mask` (Puddles glyph), a **hidden base outline** (Rubik 900, same metrics) for **counters** (closing + hole fill per letter, includes open counters), counter SDF, per-letter masks/centroids, SDF of the body (vacuole sampling). No skeleton or direction field. Swapping fonts: any font works if counters can be derived from its own outline (hole fill + closing radius ~27 px at this size); the Puddles/Rubik pairing is specific (the "inner marks" exist only in Puddles). Hand-drawn: counters from closing/hole fill of the drawing.

## 4. Controls & parameters
| Param | Type / range | Default | Unit | What it does | Exposed to jig? |
|---|---|---|---|---|---|
| **legibility ramp** (hero knob) | 1.0 → 0.1 over 0.4–9.3 s | `1 − 0.9·ss(0.4, 9.3, t)` | – | counter digestion gate, `consumed` strength | proposed `LivingTypeKnobs.legibility` / real `LifeKnobs.leak` |
| **front speed `X(t)`** (hero knob) | px over s | −150 → 1270 px over 0.2–8.6 s, ^0.92 | px | travel / engulf timing | Director (proposed) |
| **counter closing radius** (hero knob) | px | disk 27 (open 3) | px | what counts as a counter | proposed (GlyphField counters) |
| **pseudopod lead** (hero knob) | px, s | target.x − 330, +0.75 s | – | how early pods reach counters | – |
| flood radius | px/s | 70·fl | px | counter flood size | – |
| digestion window | s | teng + 0.8 … + 4.4 | s | stroke eating | – |
| vacuoles | count, px/s | 3 per letter, −38..−22 | – | swallowed bits | – |

## 5. Timeline / arc
10 s keyframed by the front: pseudopods (to 1.4 s) → counters eaten (to 4.2) → engulf + digest strokes (to 8.6) → vacuoles. Stills at 3.6 s (counters eaten) and the end.

## 6. Camera & optics
Darkfield HUDDI (`sat=1.0`), no rack; ink rim/glyph, cream flood/granules/vacuoles, green contractile vacuole. 10×, scale 200 µm.

## 7. Performance & tiers
Box: full-frame field maths + up to 7 capsule fields + vacuole patches: ~2–4 s/frame. [est] trivial on GPU (all analytic) on every tier; A12: fewer granules.

## 8. Port to macOS Swift/Metal
One fragment/compute kernel evaluates `f` (front, band, capsules from a small uniform array, counter floods from per-letter counter SDF texture), digestion masks and colour; granules as instanced points; vacuoles as instanced textured quads sampling the glyph texture. CPU once: counters (closing/fill), targets, schedule. Hooks: real `LifeKnobs.leak` (counter digestion is the most literal "leak" use); proposed H7 legibility ramp, H5/H6 render, GlyphField counters. Portable as-is.

## 9. Known gaps & next refinement
- Not a physical amoeba (no membrane mechanics or cytoplasm flow sim); body is an analytic field driven by a schedule.
- Depends on Rubik Puddles + Rubik 900 pairing for the "inner mark" read.
- Pseudopod base is y-random (`base_y = CY ± 60`), fine for one line only.

## 10. Files & clips
- `visuals/maker/species/amoeba-counter/amoeba_clip.py`; fonts `visuals/fontcast/fonts/RubikPuddles.ttf` (+ `RubikPuddles-OFL.txt`), `Rubik.ttf`.
- Clip `amoeba-counter-clip.mp4` 5.0 MiB / `-m` 1.3 MiB; stills `amoeba-counter-still.png`, `amoeba-counter-counters-eaten-still.png`, `amoeba-counter-wip.png`.
