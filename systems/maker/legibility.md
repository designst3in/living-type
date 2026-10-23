# Legibility knob + shared glyph/optics kit (`legibility`)

> The shared `legibility` 0..1 knob (alias `leak = 1 − legibility`) plus the glyph-raster, SDF, skeleton, optics and caption helpers every maker system imports. Clips: every maker clip from the planarian CoC clip onward (value logged per row in `visuals/maker/used-words-fonts.md`). Source: `visuals/maker/species/_common/legibility.py`, `_common/labkit.py`, `_common/coc.py`

All paths below are relative to the living-type project root. `coc.py` wraps graphics-lab code (`visuals/glab/src/darkfield_huddi.py`, a teammate's, imported read-only).

## 1. What it is
Not an organism. It is the contract that lets one designer-facing number decide how far a living medium is allowed to wreck the word: 1.0 = growth stays inside the strokes, counters and gaps stay clean; 0.0 = it invades counters and gaps and eats the strokes. Named to line up with the macOS ink jig life layer: `LifeKnobs.leak` (`ink-read/InkJig/Sources/PaintCore/Knobs.swift:177`, "how far growth creeps past the food", default 0.15) and the planned `LivingTypeKnobs.legibility` (doc 42 §2.1/§2.3 H7: leak "becomes (1 − legibility)").

`labkit.py` is the glyph source (outline font → mask/SDF/skeleton) and the shared microscope finish (DOF stack, Köhler unevenness, vignette, dust, grain, HUDDI preset, specimen caption). `coc.py` is the tilted-plane circle-of-confusion ring-blur ("CoC rack") AJ liked.

## 2. How it works
- **State:** stateless functions. `legibility.regions` caches `(counters, gaps)` per mask in a module dict `_CACHE` keyed by `id(mask)`. `coc.grid` caches the `(yy, xx)` meshgrid per size.
- **Update step:** called whenever legibility changes (mycelium re-evaluates every 25 sim steps, `myc_motion.py:build_knob`).
  - `legibility.py:params(l)` with `k = 1 − l`:
    - `attract = 0.55 + 0.45·l` (food strength inside strokes)
    - `leak_px = 8 + 46·k^1.3` (px width of the food shoulder outside the glyph; 8 px at l=1, 54 px at l=0)
    - `counter = 0.55·l − 0.65·k` (>0 repels growth from counters, <0 lures it in; sign flips at l ≈ 0.54)
    - `consume = k` (how much growth eats the letter substrate)
    - `margin = 1 + 3·k` (returned but **not read by any maker script I could find**: `rg "\['margin'\]"` finds nothing)
  - `legibility.py:regions(mask)`: `m = mask > 0.5`; `counters = fill_holes(m) & ~m`; `gaps = bbox(m) & ~fill_holes(m)`.
  - `legibility.py:food_field(mask, sd, l)`:
    `food = attract·clip(0.5 − sd/leak_px, 0, 1) − counter·G₃(counters)·[sd>1] + 0.35·(1−l)·G₆(gaps)·[sd>1]·exp(−max(sd,0)/60)` (G_σ = Gaussian blur, σ in px). Can go negative (repellent).
  - `legibility.py:consumed(substrate, growth, l, gblur)`: `substrate·(1 − clip(G₅(growth)·2.2·consume, 0, 1))`.
  - `legibility.py:tissue_sd(sd, l, counters_soft)` (body-shaped species): `sd − 18·k² − counters_soft·45·k^1.5` → tissue swells past the outline and creeps into counters as l falls.
  - `legibility.py:counters_soft(sd_letter)`: `G₄(fill_holes(sd<0) & ~(sd<0))`.
  - `coc.py:coc_map(S, focus, tilt, maxr)` → `darkfield_huddi.tilted_coc` (glab): per-pixel CoC radius for a tilted focal plane: `plane = focus + tilt[0]·(x/W − 0.5) + tilt[1]·(y/H − 0.5)`, `coc = clip(|y/H − plane|·maxr·2.6·W/1600, 0, maxr·W/1600)` (so at W = 1080 the cap is 0.675·maxr px; `tilt` must be a 2-tuple). `coc.py:ring_defocus(img, c, levels=7, inner=0.62)`: `levels` blur radii `linspace(0, max c)`, each a ring (annulus, inner/outer 0.62) kernel from `darkfield_huddi.ring_kernel` (annulus `clip(r + 0.5 − d)·clip(d − inner·r + 0.5)`, normalised), FFT-convolved, lerped per pixel by c.
- **Randomness / seeds:** none in legibility/coc. `labkit.kohler(seed)`, `dust(seed)`, `grain(seed)` are seeded numpy RNGs.
- **Lifecycle:** n/a. The knob can be constant (most clips, default 0.8) or ramped (`myc_motion.leg_at`: `l0 + (l1−l0)·smoothstep(0.05, 0.95, p)` over growth progress p, used 1.0 → 0.0 for 'ligature').

## 3. Glyph coupling (GlyphSource)
This module *is* the glyph source for every maker system:
- `labkit.py:word_mask(fontname, word, axes=None, width=0.84, cy=0.47, size=1080, ss=2, max_h=0.42)`: PIL `ImageFont.truetype` (variable axes via `set_variation_by_axes`), shrinks the font size ×0.95 until the word fits `width·S` × `max_h·S`, draws at 2× and box-reduces → antialiased float mask (S×S). Also returns **per-letter masks** (each glyph drawn at `getlength(word[:i])`, so per-letter placement ignores kerning pairs; C2 hairline had to re-assign components because of this) and the pixel font size. Fonts load from `labkit.FONTS = visuals/fontcast/fonts`; batch B/C clips load from `visuals/fontcast/fonts/` instead.
- `labkit.py:sdf(mask, thr=0.5)`: exact Euclidean (`scipy.ndimage.distance_transform_edt`) signed distance, px, **negative inside**.
- `labkit.py:skeleton(mask)`: `skimage.morphology.skeletonize(mask > 0.5)`; `skel_terminals(sk)`: skeleton pixels with exactly one neighbour.
- counters / gaps: `legibility.regions` (hole fill) and `counters_soft`.
- No direction field and no stroke width product here; systems that need them derive them locally (gradient of SDF; `-sd` at the skeleton = half stroke width).

Swapping the source: anything that yields a coverage raster at S×S works: another TTF/OTF/variable font (pass a new file name/axes), a PencilKit stroke rasterised to coverage, or an SVG/CGPath filled into coverage. The SDF, skeleton and counters are all derived from the raster, so they follow automatically. Per-letter ids need either per-glyph rasters (font/SVG path per glyph) or connected-component labelling of the coverage (hand-drawn).

## 4. Controls & parameters
| Param | Type / range | Default | Unit | What it does | Exposed to jig? |
|---|---|---|---|---|---|
| **`legibility`** (hero knob) | float 0..1 | 0.8 on new pieces (env `LEGIBILITY` in some scripts) | – | drives attract, leak_px, counter, consume (formulas §2) | proposed: `LivingTypeKnobs.legibility`; maps to real `LifeKnobs.leak = 1 − legibility` |
| `attract` | derived 0.55..1.0 | 0.91 at l=0.8 | – | food level inside strokes | via legibility |
| `leak_px` | derived 8..54 | ≈11.2 at l=0.8 | px @1080 | food shoulder width outside the outline | via legibility (≈ `LifeKnobs.leak` semantics) |
| `counter` | derived −0.65..0.55 | 0.31 at l=0.8 | – | counter repulsion (+) / lure (−) | via legibility |
| `consume` | derived 0..1 | 0.2 at l=0.8 | – | how much growth erodes the letter substrate | via legibility |
| `margin` | derived 1..4 | 1.6 at l=0.8 | – | not used by any script (dead output) | no |
| **`width`, `max_h`, `cy`** (hero knob: layout) | float | 0.84 / 0.42 / 0.47 | frame fraction | word size/placement in `word_mask` | proposed (GlyphField layout) |
| `axes` | dict | None | font units | variable-font axis values | proposed (`kCTFontVariationAttribute`, doc 42 §6.1) |
| **`focus`, `tilt`, `maxr`** (hero knob: CoC rack) | float | per clip (e.g. maxr 14 in mycelium 'network', 7 in C2) | frame fraction / px | tilted focal plane and max blur radius | proposed (`MicroscopePass`, H6) |
| `levels`, `inner` | int, float | 7, 0.62 | –, ratio | ring-blur quantisation, ring hole size | no |

## 5. Timeline / arc
Keyframed: scripts pass a constant or a ramp; nothing emergent here.

## 6. Camera & optics
`labkit.dof` (Gaussian blur stack σ = 0, 1.4, 3.2, 6.5, lerped by a per-pixel defocus), `coc.ring_defocus` (ring bokeh), `labkit.huddi_finish` (glow from G₆/G₂₂, dust, Köhler, vignette, field `#0d0d0d`, desaturate 0.9, grain). Palette swatches `labkit.HUDDI`: bg `#0d0d0d`, ink `#e8e8e8`, green `#33ff66`, cream `#f5e6a8`, mid `#666666`, dim `#333333`. Captions: IBM Plex Serif Italic / Plex Sans Condensed (`labkit.label`, `huddi_label`).

## 7. Performance & tiers
Box: `sdf` on 1080² ≈ tens of ms; `food_field` a few Gaussian blurs (cheap). `ring_defocus` is the expensive bit: up to 7 FFT convolutions per channel stack per frame (seconds per frame on the box). [est] M5: all trivially real time on GPU; A16: CoC with 5 levels at half res; A12: replace ring CoC with a 3-level Gaussian/mip blur.

## 8. Port to macOS Swift/Metal
- **Textures:** `glyphMask r8Unorm`, `glyphSDF r16Float`, `glyphId r8Uint`, `counters r8Unorm` (+ blurred copy), `gaps r8Unorm`, `food r32Float` (matches the real `food` texture fed by `PaintSim.setFoodInit(_:)`, `PaintSim+Life.swift:99`).
- **Kernels:** glyph raster via Core Text → CGContext (CPU, once per text change), JFA SDF (`glyphJFASeed/Step/Resolve`, proposed in doc 42 §6.1), hole-fill for counters (CPU flood fill once per text, or GPU connected components), `foodField` compute kernel (one pass: the formula in §2 with pre-blurred counters/gaps), `consume` kernel (one blur + multiply). CoC: `cocMap` + N ring-kernel convolutions or a gather bokeh in a post pass.
- **CPU vs GPU:** text layout, raster, hole fill on CPU (once); SDF, food, consume, CoC on GPU per tick/frame.
- **Hooks:** real today: `LifeKnobs.leak` (`Knobs.swift:177`), `PaintSim.setFoodInit` (food mask), the `food` texture read by `lifeStep`/`slimeMove`. Proposed (doc 42 §2.3, not in code): H7 `LifeKnobs.livingType: LivingTypeKnobs?` carrying `legibility`, with `leak = 1 − legibility`; `GlyphField` (`PaintSim+Glyph.swift`); H6 `postPasses` / `MicroscopePass` for CoC and HUDDI finish.
- **Portable as-is:** all the formulas. **Needs rewrite:** PIL text layout → Core Text; EDT → JFA (approximate, fine at these scales).

## 9. Known gaps & next refinement
- `margin` is computed but unused.
- `regions` caches on `id(mask)`; if a mask array is freed and a new one gets the same id the cache returns stale regions (never hit in practice, but a port should key by text/content).
- Per-letter masks ignore kerning (`word_mask` uses `getlength(word[:i])`, i.e. per-prefix advance, which does include kerning in PIL's basic layout but not the full shaper; C2 hairline saw mismatches). A port should take per-glyph positions from Core Text runs.
- Counters are found by hole filling, so an open counter (e.g. 'c', or a 'e' whose eye touches the edge after AA) is a "gap", not a counter.
- No vector/centreline product; skeletons are raster and spurry (each system prunes its own).

## 10. Files & clips
- `visuals/maker/species/_common/legibility.py` (58 lines), `labkit.py` (148), `coc.py` (33); `phone_copy.sh` (encode helper).
- Imported (teammate, read-only): `visuals/glab/src/darkfield_huddi.py` (`ring_kernel`, `tilted_coc`), and by some clips `visuals/glab/src/looks.py`.
- Used by: every doc in this folder; see `_glyph-needs.md`.
