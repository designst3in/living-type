# Tardigrade 'BOLD' anhydrobiosis (`tardigrade`)

> Plump clawed water bears crawl in, pack and pump inside heavy letters, then desiccate: hydration drives the font's YEAR axis (1979 wet → 2019 dry), letters and their gel skin thin, bodies retract legs and curl into tuns, then rehydrate. Clips: `BOLD` (Climate Crisis, YEAR axis = hydration), legibility 0.85. Source: `visuals/maker/species/tardigrade-bold/tardigrade_clip.py`

Paths are relative to the living-type project root. (Unrelated, unfinished: `species/tardigrade-eggs/eggs.py`, on hold.)

## 1. What it is
*Hypsibius*-like tardigrades: barrel body, 4 leg pairs with hooked claws, eyespots, pharynx bulb, storage-cell granules. Anhydrobiosis: they lose water, retract legs, curl into a "tun", and revive on rehydration. The variable font's YEAR axis (Climate Crisis thins as the year rises) doubles as the water content. Darkfield HUDDI; green only on eyespots and claw tips.

## 2. How it works
- **Hydration curve** (`hydration(t)`): `h = 1 − ss(3.6, 6.0, t) + ss(7.0, 9.0, t)`; `dry = 1 − h`; `year = 1979 + 40·dry`.
- **Glyph per frame** (`mask_year`, `mask_at`): the word is rasterised at integer YEAR values with a font size fixed by fitting at 1979 (`width 0.88`, `max_h 0.42`, so it thins in place), cached; fractional years lerp two masks. `sd = sdf(m)`, `sdt = legibility.tissue_sd(sd, LEGIBILITY, counters_soft(sd))` every frame.
- **State** (`setup`): bodies placed by greedy dart throwing in `sdt0 < −10.5` (min distance 33 px checked against the last 400 placed); strays outside the letters: `round(0.12·leak·N)` in `10 < sd0 < 30 + 60·leak`; per body: home, heading (along the stroke tangent `atan2(gx, −gy)` of `G₆(sd0)` if within 40 px, ± π, + N(0, 0.35)), scale 1.0–1.25, phase, walk-in distance 70–170, arrival `t_in ∈ [0, 0.9]`, duration 1.1–1.6 s, layer (25 % back), 14 granule offsets, curl ±0.7–1.2, spin. Dry crack map = Voronoi edges of 900 seeds.
- **Per frame** (`frame`, `body`): bodies walk in along their heading, wobble 1.6 px while hydrated; while drying (non-strays) they are pulled toward the nearest pixel of the eroded letter interior (`binary_erosion(sdt<0, 3 + 5·dry)`, EDT indices) with weight `ss(0, 0.6, dry)`. Body = analytic superellipse in body coords: half-length `A = s(23.5(1−ds) + 12.5ds)`, half-width `B = s(9.0(1−ds) + 10.8ds)`, exponent `pw = 2 + 2.8ds` (ellipse → barrel), `ds = smoothstep(dry)`; curl `v' = v − (0.011/s)·ds·curl·u²`; peristaltic wave `1 + 0.06cos(2π·2.2u/A − 4t + ph)(1−ds)` + pump `0.05 sin(5.2t + ph)(1−ds)`; rim, folds, granules, pharynx; legs: 3 lateral pairs + 1 rear pair, length `5.6s(1−ds)^1.4`, gait `0.38 sin(6t + ph)`, hooked claw pairs (green tips); eyespots `(1 − 0.65ds)`. Drawn at 2×, max-composited in 2 depth layers.
- Letter + gel: gel width `2 + 6h`, letter fill 0.085 + edge; cracks fade in with `ss(0.35, 0.9, dry)`. Bodies are clipped to the gel skin (`clipm`) except strays and the first 2.4 s (crawling in).
- **Randomness / seeds:** 11 (all body attributes), 4000 + i (finish).
- **Lifecycle:** crawl in (0–2.3) → pack + pump (–3.6) → desiccate (–6.0) → tun hold (–7.0) → rehydrate (–9.0) → active. Hydration is keyframed; positions are kinematic.

## 3. Glyph coupling (GlyphSource)
Re-rasterises the **variable font every frame** along an axis (`Year`): mask, SDF and counters per frame. Uses `sdf` (packing, tissue_sd, gel), counters (`counters_soft`), stroke direction field (tangent from SDF gradient, for body headings), eroded interior (tun retreat). For other fonts any variable axis that thins/fattens (e.g. `wght`) works; for hand-drawn/SVG glyphs, emulate the axis by offsetting the SDF (`sd + k·dry`) instead of re-rasterising.

## 4. Controls & parameters
| Param | Type / range | Default | Unit | What it does | Exposed to jig? |
|---|---|---|---|---|---|
| **`LEGIBILITY`** (hero knob) | 0..1 (env) | 0.85 | – | tissue swell, stray count `0.12·leak·N`, stray band `30 + 60·leak` px | proposed `LivingTypeKnobs.legibility` / real `LifeKnobs.leak` |
| **hydration curve** (hero knob) | `1 − ss(3.6,6.0) + ss(7.0,9.0)` | – | – | drives YEAR axis, body shape, legs, gel | Director (proposed) |
| **axis range `Y0`,`Y1`** (hero knob) | font units | 1979, 2019 | YEAR | how much the letters thin | proposed (GlyphField variable axis) |
| **packing distance** (hero knob) | px | 33 (interior sd < −10.5) | px | body count | proposed |
| body size | px | A 23.5→12.5, B 9.0→10.8, scale 1–1.25 | px | – | – |
| gait / pump | Hz-ish | 6.0, 5.2 rad/s | – | leg swing, pumping | – |
| gel width | px | 2 + 6h | px | skin | – |

## 5. Timeline / arc
10 s keyframed hydration arc (see Lifecycle); stills at end and at 6.5 s (tun).

## 6. Camera & optics
Darkfield HUDDI (`huddi_finish`, `sat=1.0`); back-layer bodies blurred σ 1.6 (no rack). Custom label with ink rule + scale bar (green reserved for eyes/claws). 10×, scale 500 µm.

## 7. Performance & tiers
Box: per frame an SDF + `tissue_sd` + erosion/EDT of the word plus per-body analytic shading on 2× patches (~100 bodies): ~5–10 s/frame. [est] M5 real time (analytic SDF bodies in a fragment shader); A16 fine; A12 halve bodies, skip granules.

## 8. Port to macOS Swift/Metal
- Glyph: Core Text with `kCTFontVariationAttribute` per frame (or keep a few axis keyframes as SDF textures and lerp) → JFA SDF; `counters` once.
- Buffers: body instance buffer (home, heading, scale, phase, t_in, curl, layer, 14 granules); kernels: `tardiPlace` (CPU once), `tardiBody` fragment shader (superellipse SDF in body space, legs/claws as capsule SDFs), letter/gel pass, interior-retreat target from an eroded-SDF gradient (`p += −∇sd·…`), finish.
- Hooks: real `LifeKnobs.leak`; proposed H7 `LivingTypeKnobs.legibility` + `hydration`; GlyphField variable-axis morph (doc 42 §6.1 "Variable `wght` axis … so weight can animate").

## 9. Known gaps & next refinement
- Bodies don't avoid each other while walking in (only the homes are spaced).
- Packing check uses only the last 400 placed points, so rare overlaps occur.
- Per-frame full re-raster + SDF is the cost driver; a port should precompute axis keyframes.
- Climate Crisis-specific axis name `Year`.

## 10. Files & clips
- `visuals/maker/species/tardigrade-bold/tardigrade_clip.py`; font `visuals/fontcast/fonts/ClimateCrisis.ttf`.
- Clip `tardigrade-bold-clip.mp4` 5.6 MiB / `-m` 1.5 MiB; stills `tardigrade-bold-still.png`, `tardigrade-bold-tun-still.png`, `tardigrade-bold-wip.png`.
