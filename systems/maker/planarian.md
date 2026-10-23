# Planarian regeneration + CoC rack (`planarian`)

> Each letter is one planarian; amputated fragments grow green blastemas over the missing part, which then differentiate (pigment, branched gut, pharynx, eyespots) while a tilted ring-blur focal plane racks through the word. Clips: `regen` (Shantell Sans wght 800 · INFM 100 · BNCE 40; repeat requested by AJ for the CoC clip), legibility 0.8. Source: `visuals/maker/species/planarian-regeneration/planarian.py`, `planarian_clip.py`

CoC maths from graphics lab (`visuals/glab/src/darkfield_huddi.py`, teammate code, imported read-only through `_common/coc.py`). Paths are relative to the living-type project root.

## 1. What it is
*Schmidtea mediterranea*: flat ciliated body, triangular head with auricles, two pigment-cup eyes, mid-body pharynx, branched gut. After amputation, neoblast blastemas (unpigmented, no gut) cap the cut and rebuild the missing part. Darkfield HUDDI; blastema tissue in green.

## 2. How it works
- **State** (`planarian.py:build`, per letter): `sd0 = sdf(letter mask)`, skeleton `sk`, terminals; body axis = the farthest pair of skeleton terminals by skeleton geodesic (`MCP_Geometric` on skeleton cost); head = the higher end; `u` (0 head → 1 tail) = geodesic from head / length, projected to all pixels by nearest skeleton pixel (EDT indices); head frame `dv, nr` from skeleton points within 22 px of the head; `hw = median(−sd0[sk])`; body SDF = `min(sd0, two auricle discs r 0.42·hw)` + ruffle `0.45·G₂.₅ noise + 1.2·G₁₀ noise`.
- `planarian_clip.py:setup`: body SDF passed through `legibility.tissue_sd(sd, LEGIBILITY, counters_soft(sd))` (tissue swells and creeps into counters as legibility falls); gut sample points every 7 px of skeleton arc (local tangent by PCA of skeleton points within 7 px), pharynx = skeleton with `|u − 0.54| < 0.12`.
- **Per frame** (`planarian_clip.py:frame`, `masks_at`): cut plan `PLAN = [('tail',0.55), ('head',0.42), ('tail',0.62), ('head',0.38), ('both',(0.30,0.72))]` (one per letter of 'regen'). `out = ss(T_CUT=0.7, T_OUT=3.0, t)` = blastema reach toward the lost end; `dif = ss(T_OUT − 0.3, T_DIFF=6.4, t)` = old-tissue differentiation sweeping into the blastema; both are smoothstep thresholds on `u`. Old tissue = ink body + edge + cream gut (diverticula length ∝ old-tissue maturity), blastema = green; eyespots `eye_p = ss(4.2, 6.6, t)`: green spots appear, then darken into pigment cups; pharynx sways `0.06 sin(2.1t + k)`; ciliary green fringe flicker.
- **Focus rack:** `u = t/8`, `v = min(u/0.78, 1)`, `w = ease(2v)` up then down; `land = ss(0.72, 0.95, u)`; `focus = (0.30 + 0.34w)(1 − land) + 0.46·land`, `tilt = ((0.55 − 0.85w)(1 − land) + 0.04·land, 0)`, `maxr = 18`; `coc.ring_defocus(lay, cmap, levels=7)`.
- **Randomness / seeds:** 31 (ruffle), 7 (gut randoms, speckle), 1000 + i, 2000 + i.
- **Lifecycle:** fragments → blastema out → differentiate → regenerated hold; keyframed.

## 3. Glyph coupling (GlyphSource)
Per-letter `mask`/`sdf`, **skeleton + terminals** (body axis, head/tail, gut, pharynx), stroke half-width (`median −sd` on skeleton), **counters** (`legibility.counters_soft`, for tissue overflow). Direction field = local skeleton tangent (PCA). Head end rule ("higher terminal") and the cut plan are word-specific. With a new font the skeleton must give a clear longest path per letter; a PencilKit stroke is ideal (stroke = body axis, start = head).

## 4. Controls & parameters
| Param | Type / range | Default | Unit | What it does | Exposed to jig? |
|---|---|---|---|---|---|
| **`LEGIBILITY`** (hero knob) | 0..1 (env) | 0.8 | – | `tissue_sd`: swell `18·k²` px + counter creep `45·k^1.5` | proposed `LivingTypeKnobs.legibility` / real `LifeKnobs.leak` |
| **`PLAN`** (hero knob) | list per letter | see §2 | u | which part each worm lost | proposed |
| **`T_OUT`, `T_DIFF`** (hero knob) | s | 3.0, 6.4 | s | blastema reach / differentiation | Director (proposed) |
| **rack** `maxr`, focus/tilt curve (hero knob) | px, frac | 18; 0.30→0.64→0.46 | – | CoC sweep and landing | proposed H6 `MicroscopePass` |
| `T_CUT` | s | 0.7 | s | start | – |
| eye timing | s | 4.2–6.6 | s | eyespot appear/pigment | – |
| ruffle | px | 0.45, 1.2 | px | margin wobble | – |

## 5. Timeline / arc
8 s keyframed (cut → out → differentiate → regenerated); rack sweeps for the first 78 % then lands level on the word.

## 6. Camera & optics
Darkfield HUDDI, `coc.ring_defocus` ring bokeh, `huddi_finish`. Ink body/edge, cream gut, green blastema + new eyes + ciliary fringe. Scale 1 mm. Caption `time-lapse` (no clock).

## 7. Performance & tiers
Box: build ~10–30 s (all-pairs terminal geodesics per letter); frame ~3–6 s (7 FFT ring convolutions on 3 channels). [est] M5 real time; A16 half-res CoC, 5 levels; A12 Gaussian DOF.

## 8. Port to macOS Swift/Metal
Textures per word: `bodySD r16Float` (all letters min-combined), `u r16Float`, `letterId r8Uint`; per-letter params buffer (cut kind, cut u, head pos/frame, hw). One compute kernel: old/blastema masks from `u`, edges, colour; gut + pharynx + eyes as instanced strokes from a CPU point list; CoC post pass. CPU once per text: skeleton, axis (longest path), gut points. Hooks: real `LifeKnobs.leak`; proposed H7 `LivingTypeKnobs.legibility` → tissue swell, H6 `MicroscopePass` (CoC rack), H5 slot. Rewrite: skeleton longest-path search (graph on skeleton pixels, BFS twice).

## 9. Known gaps & next refinement
- `PLAN` has exactly 5 entries: a word with more than 5 letters would raise IndexError; needs a per-letter rule.
- Head = higher terminal: wrong for letters whose natural "head" is low.
- Skeleton spurs on blobby fonts can make odd axes.
- Blastema is a smoothstep on `u`, not tissue growth.

## 10. Files & clips
- `visuals/maker/species/planarian-regeneration/planarian.py`, `planarian_clip.py`; font `visuals/fontcast/fonts/ShantellSans.ttf`.
- Clip `planarian-regen-coc-clip.mp4` 2.5 MiB / `-m` 0.3 MiB; stills `planarian-1-forming.png`, `planarian-2-formed.png`, `planarian-regen-coc-still.png`, `planarian-regen-coc-wip.png`.
