# Glass-sponge spicule lattice (`sponge`)

> Hexactine spicules drift onto the pixel grid of a pixel font, rays elongate (green PDMPO = fresh silica), then fuse into a rigid lattice with checkerboard diagonal buttresses and basalia. Clips: `SILICA` (Silkscreen Regular; the font's pixel grid = the sponge's spicule grid). Source: `visuals/maker/species/sponge-spicules/sponge.py`, `sponge_clip.py`

Paths are relative to the living-type project root.

## 1. What it is
Hexactinellid sponge (*Euplectella aspergillum*): sclerocytes secrete six-rayed spicules on a square grid; later silica cements them into a lattice with diagonal struts; long basalia anchor it; PDMPO dye fluoresces green where silica is being laid down now. Darkfield HUDDI, 10×.

## 2. How it works
Graph built from the glyph's pixel grid, then a keyframed state dict drives one renderer.
- **State** (`sponge.py:build`): mask from `word_mask('Silkscreen.ttf', 'silica')` (rendered upper case by the font); grid cell `c0` = 5th percentile of horizontal run lengths sampled every 5th row (= the font's pixel size); `occ[ny, nx]` = cells whose centre is inside; nodes = cell corners of occupied cells, edges = cell sides (deduplicated); `pos` = grid positions + N(0, 1.7) jitter; per-edge width `1.9 + 1.5U`, bow N(0, 1.6), 6 width-noise values; `diag` = per cell 4 corners + checkerboard flag `(i+j) % 2`; basalia: per column (65 %) 2 roots from the lowest occupied cell, length 35–80; per-node rotation N(0, 0.07), grow 0.55–1.0, sclerocyte attributes, tip noise; neighbour lists `nb`.
- **Renderer** (`sponge.py:render_state(B, st, seed)`) takes `st` = `node_xy, node_rot, node_a, ray` (per node) and scalars `fuse, diag, bas, sclero, mono, green_tips, green_struts, tissue` (0..1). Each node draws rays toward each neighbour to `0.5·ray` of the edge with `_rod` (bowed polyline, width varies ×0.72–1.28 along length); width `2.3(1−fuse) + w_e·fuse·1.15`; end-on rays / cement knot disc `r = 3.2 + 1.6·fuse`; green tips; diagonals (full X on checkerboard cells, half-strength midpoint cross on the others); basalia curves; loose monaxons. Glass look: edge of blurred rod `2.6|∇|` × wandering thickness + 0.18·body + sparse sparkles.
- **Keyframes** (`sponge_clip.py:frame`): arrival `ta = 0.45 + 2.3·clip(0.55U + 0.45·x_norm)` (roughly left → right); settle `u = ss(0, 1, t − ta)` from an offset 70–180 px away (`(1−u)^1.5`), alpha over 0.35 s; rotation relaxes 4.6–6.0 s; `ray` grows 3.3–5.2 s; `fuse` 4.8–6.4; `diag` 5.8–7.2; `bas` 6.2–7.9; sclerocytes 0.8–1.8 in, 5.2–6.4 out; monaxons 0.2–1.2 in, 4.0–5.5 out; green tips 3.0–3.8 in, 5.0–6.0 out; green struts 5.0–6.0, partly fading 6.8–7.8; tissue 0–0.8, −40 % 6–7.5.
- **Randomness / seeds:** 77 (build), 12 (arrival/offsets), 3 (render), 4 (forming still jitter), 91 (monaxons), 6000 + i (finish).
- **Lifecycle:** tissue + sclerocytes → spicules carried in → rays elongate → fuse → buttresses + basalia → hold. No decay.

## 3. Glyph coupling (GlyphSource)
Unusual: needs a **grid-quantised glyph**. Reads `mask` only, and infers the pixel grid from run lengths. Not used: SDF, skeleton, counters, direction field, legibility module. With a non-pixel font the run-length trick gives a meaningless cell size; to swap fonts, quantise any glyph onto a chosen grid (`occ = coverage(cell centre) > 0.5`), or take a bitmap/pixel font directly; a hand drawing can be snapped to the grid the same way. An SVG of a pixel font works unchanged.

## 4. Controls & parameters
| Param | Type / range | Default | Unit | What it does | Exposed to jig? |
|---|---|---|---|---|---|
| **cell size** (hero knob) | px | auto (5th pct run length) | px | lattice pitch | proposed (GlyphField grid quantise) |
| **`fuse`** curve (hero knob) | 0..1 | ss(4.8, 6.4) | – | spicules → rigid glass | Director (proposed) |
| **`diag`** curve (hero knob) | 0..1 | ss(5.8, 7.2) | – | buttress struts | Director (proposed) |
| **green (PDMPO)** (hero knob) | 0..1 | tips 3.0–6.0, struts 5.0–7.8 | – | fresh-silica highlight | proposed |
| node jitter | px | 1.7 | px | imperfect grid | – |
| arrival spread | s | 0.45–2.75 | s | drift-in order | – |
| legibility | – | not in code | – | – | – |

## 5. Timeline / arc
8 s fully keyframed (all `st` fields are smoothstep curves of t); captions `time-lapse` only.

## 6. Camera & optics
Darkfield HUDDI with heavier grain/dust (`grain_amt=0.032, dust_amt=0.3`); plane `|0.65x + 0.35y − 0.47|·2.3` + low-freq noise; back layer (diagonals, basalia) +0.6 defocus. Ink glass, cream sclerocytes, green PDMPO. Scale 500 µm.

## 7. Performance & tiers
Box: a few hundred nodes, ~1–2 s/frame (several full-frame blurs). [est] trivial on all tiers as line instances + one glass-edge pass.

## 8. Port to macOS Swift/Metal
Buffers: node buffer (pos, rot, alpha, ray, grow), edge buffer (a, b, w, bow), cell buffer (corners, checker). Kernels: instanced capsule/rod draw (vertex shader bows the rod) into front/back coverage textures, glass-edge compute (gradient of blurred coverage), finish. CPU once per text: grid detect/quantise, graph. Hooks: none real; proposed H5 slot / H6 render-only pass, H7 `LivingTypeKnobs` (gridPitch, fuse, struts, pdmpo). Portable as-is.

## 9. Known gaps & next refinement
- Grid inference only works for pixel fonts.
- No sim: spicules don't collide or actually "fuse"; just keyframed widths.
- No legibility knob.

## 10. Files & clips
- `visuals/maker/species/sponge-spicules/sponge.py`, `sponge_clip.py`; font `visuals/fontcast/fonts/Silkscreen.ttf`.
- Clip `sponge-silica-clip.mp4` 5.2 MiB / `-m` 0.2 MiB; stills `sponge-1-forming.png`, `sponge-2-formed.png`.
