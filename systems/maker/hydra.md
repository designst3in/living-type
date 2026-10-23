# Hydra budding chain (`hydra`)

> 'h' is the parent polyp; each next letter is a bud of the previous one: a round evagination on the parent's column elongates along its own glyph, grows a hypostome with tentacle nubs then a full crown, and a basal disc. Light tilted ring-blur CoC rack. Clips: `hydra` (Sour Gummy wght 800 · wdth 110; repeat requested by AJ for the clip), legibility 0.8. Source: `visuals/maker/species/hydra-budding/hydra.py`, `hydra_clip.py`

CoC from glab `darkfield_huddi.py` via `_common/coc.py` (teammate code, read-only). Paths are relative to the living-type project root.

## 1. What it is
Freshwater polyp: ectoderm + endoderm around a gastric cavity; asexual budding (evagination → elongation → hypostome + tentacle ring → basal disc). Stills also have a "watermelon" GFP/dsRed fluorescence version (`hydra.py:render(look='fluor')`); the clip is darkfield HUDDI with green tentacles.

## 2. How it works
- **State** (`hydra.py:build`, per letter): `sd = sdf(letter) + 2.2·nz` (`nz` = unit-variance G₉ noise: wobbly organic outline); skeleton + terminals; each terminal's direction `dv` = terminal minus mean of skeleton points within 16 px; classify `foot` if `dv.y > 0.6`, `mouth` if `dv.y < 0.2`, else `blunt`; dedupe ends < 30 px apart; attachment point: letter 0 = lowest pixel; letter k = the pixel nearest to letter k−1 (EDT); `geo` = `MCP_Geometric` inside the letter from the attachment, `gmax`.
- `hydra_clip.py:setup`: `sd ← legibility.tissue_sd(sd, LEGIBILITY, counters_soft(sd))`; tentacle list per mouth end: 5–7 tentacles fanned over 1.6 rad, length 45–100, nub 9–15, curl, phase, depth flag (z > 0.7 = out-of-plane layer); static half-width field `hw = grey_dilation(max_filter(depth·sk, 9), 31)` (≥ 6 px); Voronoi cell texture (26 000 points).
- **Per frame**: `SCHED[k] = (bud start, elongation start, elongation end)` = `None, (0.4,1.0,2.2), (1.9,2.5,3.5), (3.2,3.8,4.9), (4.5,5.1,6.2)`; `g = ss(e0, e1, t)`; while `g < 0.10` a round bud (r ≤ 13 px, breathing) sits at the attachment; then `grown = m & (geo ≤ g·gmax + 1)` → SDF of the grown part blurred σ 1.2 (rounded growing tip). Shading by radial coordinate `r = 1 − depth/hw`: ectoderm limb `inside·(0.35 + 0.65r³)·ss(0.45, 0.8, r)·1.35 + 0.16·inside`, endoderm band, lumen. Tentacles appear when `g ≥ 0.7` at reached mouth ends: nub → full length with `mature = ss(e1, e1 + 1.3, t)`; sway `0.18 sin(5s + ph + 1.7t) + 0.12 s sin(0.9t + ph)`; nematocyst dots every 3rd node. Basal disc ellipse at foot ends. Bud stalk: an 11 px line from the parent's nearest pixel to the attachment.
- **Rack:** as planarian but lighter: `focus = (0.34 + 0.26w)(1−land) + 0.47·land`, `tilt = ((0.45 − 0.70w)(1−land) + 0.04·land, 0)`, `maxr = 11`, land `ss(0.74, 0.96, u)`; out-of-plane tentacles get `+3` px CoC.
- **Randomness / seeds:** 21 (outline noise), 5 (tentacles), 3 (cells), 8 (granularity), 3000 + i.
- **Lifecycle:** parent → bud evaginates → elongates (geodesic fill of the glyph) → hypostome + nubs → crown + foot → sway hold. Keyframed per letter.

## 3. Glyph coupling (GlyphSource)
Per-letter `mask`/`sdf`, **skeleton + terminals with direction** (mouth vs foot classification is by end direction: up/side = mouth, down = foot), local stroke half-width (skeleton radius field), counters (`counters_soft` for legibility swell), per-letter order (bud chain left → right, attachment = nearest point to previous letter). Swapping fonts works through the raster; `SCHED` has 5 entries (word length 5). PencilKit strokes give terminals and directions directly.

## 4. Controls & parameters
| Param | Type / range | Default | Unit | What it does | Exposed to jig? |
|---|---|---|---|---|---|
| **`LEGIBILITY`** (hero knob) | 0..1 (env) | 0.8 | – | `tissue_sd` swell/counter creep | proposed `LivingTypeKnobs.legibility` / real `LifeKnobs.leak` |
| **`SCHED`** (hero knob) | per letter (b0, e0, e1) s | see §2 | s | budding cadence | Director (proposed) |
| **tentacles** n / length (hero knob) | 5–7, 45–100 px | – | – | crown fullness | proposed |
| **rack `maxr`** (hero knob) | px | 11 | px | CoC strength | proposed H6 |
| outline noise | px | 2.2 (σ 9) | px | wobbly body | – |
| end classification | dv.y thresholds | foot > 0.6, mouth < 0.2 | – | mouth vs foot | – |
| sway | rad | 0.18, 0.12 | – | tentacle motion | – |

## 5. Timeline / arc
8 s keyframed; reads "hy" + bud, never a half letter (`hydra_clip.py` docstring), then crowns + feet; rack lands level from 74 %.

## 6. Camera & optics
Darkfield HUDDI: ink ectoderm limb, cream endoderm, green tentacles, ink nematocysts; ring CoC rack (6 + 4 levels); 4×, scale 500 µm. Stills: fluorescence (GFP `[0.17, 0.85, 0.29]`, RFP `[1.0, 0.18, 0.23]`) and HUDDI variants.

## 7. Performance & tiers
Box: per frame an EDT + SDF of the growing letter + 10 ring convolutions: ~4–8 s/frame. [est] M5 real time with a JFA per growing letter; A16 recompute the grown SDF every 2nd frame; A12 Gaussian DOF.

## 8. Port to macOS Swift/Metal
Textures: per-letter `geo r16Float` (or a word-wide geodesic + letterId), `sd`, `hw`. Kernel: `grown = geo ≤ g·gmax` → JFA SDF of grown region (or approximate with `max(sd, geo − g·gmax)` to avoid per-frame JFA), shading, then tentacle instanced strokes (vertex shader sway) and CoC post. CPU once per text: skeleton terminals/classes, attachments, geodesics. Hooks: real `LifeKnobs.leak`; proposed H7 legibility, H6 rack, H5 slot.

## 9. Known gaps & next refinement
- `SCHED` is length 5: other word lengths need a generated schedule.
- Mouth/foot by end direction misfires on letters with only horizontal ends.
- The bud does not inherit tissue (each letter is drawn from its glyph); the chain look relies on attachment + stalk.

## 10. Files & clips
- `visuals/maker/species/hydra-budding/hydra.py`, `hydra_clip.py`; font `visuals/fontcast/fonts/SourGummy.ttf`.
- Clip `hydra-bud-clip.mp4` 2.5 MiB / `-m` 0.3 MiB; stills `hydra-1-forming(-huddi).png`, `hydra-2-formed(-huddi).png`, `hydra-bud-still.png`, `hydra-bud-wip.png`.
