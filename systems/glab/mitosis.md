# Mitosis: a dividing embryo fills the phrase (`mitosis`)

> One fertilised cell cleaves (2, 4, 8, 16 cells) inside its zona, hatches, and the population divides and migrates until soft cells pack the phrase "Trust the process". The camera zooms out from the single cell to the whole word. Darkfield HUDDI, 22 s, 1080×1920 portrait. AJ: loved it (🔥). Source: `visuals/mitosis/mitosis.py` (ownership assumed glab: it lives outside `visuals/glab/`).

## 1. What it is
An overdamped soft-disc tissue sim (division, apoptosis, migration) on a glyph wall, with a log-zoom camera from ×12.5 to ×0.965. Legibility rises as cells pack the letters.

## 2. How it works
**Constants:**
- `FPS 24`, `SECS 22`, `WW/WH 1080/1920`.
- Cell radius `RF = 7.5` (×0.72–1.28 jitter); early cleavage cell `RC = 5.5`; `R0 = 4RC`; zona `RZ = 1.16·R0`; hatch `T_REL = 3.95` s.
- `LEG = 0.85` (target legibility).
- Phrase: Inter wght 680 opsz 32, tracking +0.05 em.

**Cleavage:** `CLV_T = [0.40, 2.12, 2.86, 3.46]` s with durations `CLV_D = [(0.80, 0.90), (0.35, 0.38), (0.28, 0.30), (0.24, 0.26)]`.

**Unlock schedule:** `UNLOCK = [0.0, 5.6, 6.2, 6.8, 7.4, 8.6, 9.1, 9.6, 9.9, 10.3, 10.7, 11.1, 11.5, 11.9, 12.3]` s, per letter (14 + start). Cap `NM = 9000` cells.

**Forces (`nb_forces`, numba):**
- Repulsion `KR 40`, adhesion `KA 3`, spring `KS 14`; `SUB 4` substeps.
- Glyph wall: penalty `pen = sd + R·(0.72 − (1 − LEG)·4·bul)`, k 10 (cells bulge slightly beyond the strokes when legibility is low).
- Zona k 60 until hatch.

**Division:** if the free area within 4.5·RF passes thresholds 0.05/0.09, p 0.7. Phases Tp `0.16·jj` and Tc `0.20·jj` (prophase/cytokinesis durations with jitter).

**Death:** apoptosis if outside the glyph > 0.7 s.

**Migrants:** seeds by farthest-point sampling (one per area/4200) into newly unlocked letters; speed `clip(d/1.1, 50, 240)` px/s.

**Strays:** after 13 s, ≤ 9 wandering cells.

**Camera / focus:**
- `CAM_K` zoom 12.5 → 0.965, PCHIP-interpolated in log space.
- Focus via a `FOC_K` table; CoC `glob + tilt·|wy − fy + 0.22(wx − cx)|/(0.5·Hv)`, ≤ 30 px.

**Render (`nb_specimen`, numba):**
- Cells as membranes, nuclei and granules.
- Optics: scatter 8 directions at 2 scales; ring defocus 7 levels; bloom `0.35·G₆ + 0.25·G₁₈`; tone `1.6 − 0.3·lowz`; Poisson 320 + N(0, 0.0035) read noise. ACC_HI `#00ff88`.

**Seeds:** 23 sim, 99 sizes/strays, 77 floaters, `1e4 + i` per-frame grain.

**Run modes:** `sim` (~15 s), `frames`, `render` (3 workers), `encode` (CRF 23; `-m` CRF 26).

**Lifecycle:** spawn (zygote) → cleavage → hatch (3.95 s) → seek (migrants to unlocked letters, 5.6–12.3 s) → lock-on (packing) → hold (strays drift) → no decay (ends on the full phrase).

## 3. Glyph coupling (GlyphSource)
| Product | Used? | How |
|---|---|---|
| mask / sdf | **yes** | wall penalty `sd`, apoptosis outside |
| per-letter ids + order | **yes** | `UNLOCK` schedule |
| area | yes | migrant count (area/4200), farthest-point seeds |
| layout / metrics | yes | camera targets, portrait phrase layout |
| others | no | – |

**Replaced font / PencilKit / SVG:** needs a signed distance and letter ids. `UNLOCK` has 15 entries (fixed to this phrase). Derive the schedule from the letter count [proposed `unlockStart, unlockStep`].

## 4. Controls & parameters
| Param | Type / range | Default | Unit | What it does | Exposed to jig? |
|---|---|---|---|---|---|
| ★ `LEG` | 0..1 | 0.85 | – | wall tightness/bulge | H7 `legibility` |
| ★ cell radius `RF` | px | 7.5 (0.72–1.28×) | px | cell size vs stroke | proposed `cellSize` |
| ★ unlock schedule | s | 5.6 … 12.3 | s | reading-order fill | proposed |
| cleavage times | s | 0.40, 2.12, 2.86, 3.46 | s | embryo tempo | internal |
| hatch `T_REL` | s | 3.95 | s | zona release | internal |
| KR / KA / KS | – | 40 / 3 / 14 | – | mechanics | internal |
| wall k / zona k | – | 10 / 60 | – | confinement | internal |
| division thresholds | – | free 0.05/0.09, p 0.7 | – | packing density | proposed `divisionRate` |
| ★ camera | zoom | 12.5 → 0.965 (log PCHIP) | × | the reveal | proposed camera keys |
| cap `NM` | int | 9000 | cells | budget | tier |
| strays | count | ≤ 9 after 13 s | – | life during the hold | proposed |

## 5. Timeline / arc
Emergent mechanics on a keyed schedule (cleavage, hatch, unlock, camera). 22 s.

## 6. Camera & optics
Zooming camera (the only glab system with a big zoom) with a zoom-aware focus table, HUDDI darkfield-styled scatter (its own numba implementation, not `dh.darkfield`). See [`optics.md`](systems/glab/optics.md) for the shared model.

## 7. Performance & tiers
- **Box CPU:** sim ≈15 s; render per frame **UNKNOWN** (3 workers).
- **GPU [est]:** mid. ≤ 9000 discs is small for a GPU neighbour grid; most cost is the darkfield render at portrait full res.
- **Tiers [est]:** M5 full 9000 cells, 7-level DOF; A16 9000 cells, 5 levels, 1 scatter scale; A12 cap 5000 (bigger RF), mip DOF.
- **Zoom-aware LOD:** at ×12.5 only a few cells are visible, so render detail per cell can be high early and drop as the camera pulls out.

## 8. Port to macOS Swift/Metal
**Buffers:** `mtCells` (pos, vel, r, phase, timer, flags; ≤ 9000); uniform grid (cell list); glyph SDF texture; letter-id texture; unlock times.

**Kernels:**
1. `mtGrid` (bin).
2. `mtForces` (neighbour forces + wall + zona; 4 substeps).
3. `mtDivide` / `mtApoptose` (atomic append/compact).
4. `mtMigrants`.
5. `mtSpecimen` (instanced disc SDF splat) → darkfield H6 with a zoom-aware CoC.

**Hooks:** H1 tick, H2 (`ecoDeposit` for painted seeds, optional), H3 gating (unlock), H4 snapshot (cells), H5/H6, H7 (proposed `cellSize, divisionRate`, camera keys), H8 `MediaTool.living` (tap to drop a zygote). Proposed per doc 42 §2.3.

**Portable:** mechanics and schedule. **Rewrite:** numba loops → compute kernels; PCHIP camera → CPU spline uniforms.

## 9. Known gaps & next refinement
No gaps recorded by AJ (it was approved as is). Port note: model as overdamped soft discs with zoom-aware LOD. The unlock schedule is hard-coded to this phrase.

## 10. Files & clips
`visuals/mitosis/mitosis.py` (outside `visuals/glab/`, ownership assumed); renders per its README in `visuals/mitosis/`. Refs: [`optics.md`](systems/glab/optics.md), [`nucleus.md`](systems/glab/nucleus.md), [`darkfield-huddi.md`](systems/glab/darkfield-huddi.md).
