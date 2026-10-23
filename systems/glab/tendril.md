# Tendril: climbing vines unlock the word letter by letter (`tendril`)

> A Physarum network can only feed on letters that have been "unlocked". Climbing tendrils reach for each next letter, coil when they touch it, and unlock it; the slime then crawls across the newly opened letter as a geodesic front. Leafy loose vines sprout late. Rheinberg teal/cream look. Clip: `bio-b4-tendril` ("tendril", Quicksand wght 700). Source: `visuals/glab/src/tendril_word.py` (`letters`, `geodesic`, `sim`, build), look `looks.py` (Rheinberg + `spec_coc`).

## 1. What it is
Thigmotropism as typesetting: a plant-like explorer touches a letter, and only then can the slime eat it. Reading order is literally the growth order, left to right.

## 2. How it works
**State:**
- `S = 540`, `SPF = 4` substeps, seed 3.
- `letters(track 0.16, width_frac 0.80)`: per-letter masks + ids.
- `t_unlock[k]`, set from frame 0 for letter 0 at its lowest-left point (the start).
- Jones agents (`pos`, `ang`); trail `tv`; the crawl band per unlocked letter is a geodesic distance from the unlock point.
- Tendril list (pts, angle, phase, amp, target, coil counter); loose-vine list; leaves.

**Step:**
1. **Agents (Jones):** `SA 30°, RA 40°, SO 7 px, DEP 5, DECAY 0.90`.
   - Sense `tv/(tv + 60) + (0.4 + 2.4L)·food`, food = unlocked-letter pixels inside the crawl band `r ≤ 5.5·(f − t_unlock) + 4` (band width 7, so a front crawls along the stroke).
   - Spawn: quota 16 000 at 150/step, then +45/step while u < 0.75 and agents < 90k.
   - Death p `(0.008 + 0.03L)·(1 − clip(3·fd))`, fd = food under the agent.
   - Speed `1.7·(1 − 0.6·L·onl·[u > 0.40])` (slows on letters at the hold).
   - Deposit weight `1 + 5L·onl`.
2. **Grab tendrils:**
   - 2 per newly unlocked letter, 5 frames after unlock, from the right 20 % of its edge, targeting the next letter.
   - Steer `a += 0.20·wrap(desired − a) + amp·sin(ph + s/11)`, amp U(0.09, 0.14); step 1.6.
   - Contact: EDT to the target < 1.5 unlocks letter k+1; then coil `a += 0.22·sg` for 20 steps.
3. **Loose vines:**
   - One per letter at +12 frames, plus p `0.006 + 0.02(1 − L)` per frame for 0.75 < u < 0.95.
   - Length 55–120 steps of 1.1; stop on letters before u 0.78.
   - Leaves every 15 steps (teardrop, size 3.5–6).

**Build (to `/tmp/looks_sim_tendril/`):**
- Trail normalised by the stroke-median p60 (so letters read evenly); `D = FAR G₁₂ + NEAR G₁.₄·1.7`.
- Tendril/leaf rasters `Zt`, `Zl`; `Zk = max(D^0.9·1.1, 0.95Zt, 0.75Zl)`, EMA 0.55.
- `A` = crawl fronts + growing tips (activity for the look).

**Lifecycle:** spawn at letter 0 → seek (tendril reaches) → lock-on (contact → unlock → geodesic crawl) → repeat per letter → hold (agents slow, deposit up) → late loose vines (decorative decay).

## 3. Glyph coupling (GlyphSource)
| Product | Used? | How |
|---|---|---|
| mask | **yes** | food |
| per-letter ids + order | **yes** | unlock chain, left → right |
| sdf / EDT | **yes** | tendril contact (< 1.5 px), loose-vine stop |
| geodesic (in-mask distance) | **yes** | crawl band from the unlock point (`geodesic`, BFS) |
| outline | yes | grab sites (right 20 % of the letter edge), unlock point (lowest-left) |
| skeleton / direction | no | could guide the crawl front direction |

**Replaced font / PencilKit / SVG:** needs **per-letter ids in reading order** (GlyphSource §4 product). For PencilKit, stroke order can be used directly as the unlock order. Non-Latin or connected scripts need a letter segmentation; for cursive, unlock by arc-length segments [proposed].

## 4. Controls & parameters
| Param | Type / range | Default | Unit | What it does | Exposed to jig? |
|---|---|---|---|---|---|
| ★ crawl speed | px/frame | 5.5 (+4 offset), band 7 | px | how fast a letter fills | proposed `crawlSpeed` |
| ★ tendrils per letter | int | 2 grab + 1 loose | – | vine density | proposed `tendrils` |
| ★ steer / wiggle | – | 0.20, amp 0.09–0.14, period s/11 | rad | reach character | proposed `tendrilWiggle` |
| coil | rad/step × steps | 0.22 × 20 | – | coil after contact | internal |
| loose-vine rate | p/frame | `0.006 + 0.02(1−L)` (0.75–0.95) | – | late sprouting | proposed |
| leaves | every n steps, size | 15, 3.5–6 | px | foliage | proposed |
| Jones | SA/RA/SO/DEP/DECAY | 30°/40°/7/5/0.90 | – | slime | internal |
| agents | quota / cap | 16k (150/step) / 90k | – | budget | tier |
| ★ `legibility` | 0..1 | arc | – | food weight `0.4 + 2.4L`, death, hold slow-down, deposit | H7 |
| look | Rheinberg | stop `#1d5a5e`, CREAM, `#b9e6cf` | – | palette | `MicroscopeKnobs` |

## 5. Timeline / arc
Emergent (unlock times aren't keyed; they depend on tendril travel). Default arc for L. About 10 s.

## 6. Camera & optics
Rheinberg ([`rheinberg.md`](systems/glab/rheinberg.md)) with a teal stop, plus `spec_coc` ([`optics.md`](systems/glab/optics.md) §3).

## 7. Performance & tiers
- **Box CPU:** sim ≈1 min, ≈2.5 s/frame on 3 procs (README).
- **GPU [est]:** mid. ≤90k agents + a few dozen polyline tips; the geodesic is a per-letter BFS, done as a JFA-in-mask or an iterative relax per frame.
- **Tiers [est]:** M5 90k agents, geodesic relax 8 iters/frame; A16 45k, 4 iters; A12 25k, precomputed geodesic per letter at glyph build (unlock points are deterministic given the order), no leaves.

## 8. Port to macOS Swift/Metal
**Buffers:** agents (8 B); `tdTrail`; `tdLetterId` `r8Uint`; `tdGeo` `r16Float` per letter (precomputed from the unlock point; BFS on CPU at glyph build); `tdUnlock` small uniform array; `tdTips` (≤ 64 × 128 pts) + `tdLeaves`.

**Kernels:**
1. `slimeMove`-pattern agent kernel with food = `geo ≤ band(f − t_unlock)` (`PaintSim+Life.swift:292`, local `ea48744`).
2. Trail resolve.
3. `tdTipStep` (one thread per tendril; contact via the SDF texture; raises an unlock flag via an atomic).
4. Tip/leaf raster (line SDF).
5. Build/EMA.
6. Rheinberg H6.

`lifeHyphae` (tip-growth kernel, doc 42) is not present in local `ea48744`, so tendril tips are a new kernel: **UNKNOWN** whether one exists at `d37f560`.

**Hooks:** H1 tick, H3 gating (unlock as gating), H4 snapshot (unlock state + tips), H5/H6 render, H7 (proposed `crawlSpeed, tendrils, tendrilWiggle`), H8 `MediaTool.living` for hand-placed unlock points. Proposed per doc 42 §2.3.

**Portable:** all rules. **Rewrite:** BFS geodesic → GPU or precompute; the Python tendril loop → per-tip thread; unlock order from GlyphSource ids.

## 9. Known gaps & next refinement
- Stroke edges snap to the mask (stroke-median normalisation is too even).
- Too few loose vines.
- Leaves are flat (no shading or vein).
- Unlock timing isn't art-directable; add an optional keyed `t_unlock` schedule (INVENTORY §6).

## 10. Files & clips
`visuals/glab/src/tendril_word.py`; cache `/tmp/looks_sim_tendril/`; clip `visuals/glab/looks/bio-b4-tendril*`. Refs: INVENTORY §6, [`physarum-word.md`](systems/glab/physarum-word.md), [`rheinberg.md`](systems/glab/rheinberg.md), [`optics.md`](systems/glab/optics.md).
