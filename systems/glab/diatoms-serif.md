# Diatoms tile a serif word (`diatoms-serif`)

> About 276 procedural frustules (pennate boats with raphe and striae; centric discs with areolae) glide stop-start from a scatter, dock into slots packed inside the letters, hold, then loosen. Polarised look. Clip: `look-06-diatoms-serif` ("serif", Kalnia, CLI axes 500,115; see §4). Source: `visuals/glab/src/diatom_word.py` (`word_mask`, `sprite`, `pack`, `run`, `step`, `render`, `build_cache`); look `looks.py` `diatom_polar`.

## 1. What it is
A colony of silica cells assembling into type. The serifs and hairlines get thin pennate lenses aligned to the stroke; bowls and stems get bigger pennates and centric discs. It is a rigid-body, slot-docking sim (not a field sim), so legibility comes from packing quality.

## 2. How it works
**State (N = 1080, no sub-grid):**
- per cell: target `T (x, y)`, target angle `TH`, `kind` (0 pennate / 1 centric), semi-axes `A, B`;
- position `P`, angle `PHI`, raphe direction `SGN ±1`;
- stop-start gate `om ∈ U(0.15, 0.35)`, `ph`;
- arrival `u_in ∈ U(0.06, 0.16)`, release `u_out ∈ U(0.76, 1.15)`;
- loosen offset `off ~ N(0, 1)²`; `lead` (22 %), `chl` (7 %) flags.

**Packing (`pack`, once):**
- `dt = EDT(mask)`; orientation from the structure tensor of `∇G₂dt` (σ 6), `ori ⟂ ∇dt`;
- serif band = rows within 14 px of the baseline or 12 px of the x-height line (`xh = base − 0.62·(base − top)`);
- 4 passes, scales 1 / 0.75 / 0.55 / 0.42, over random pixels with `dt ≥ 2.5`:
  - **pennate** if thin (`dt < 12` or in the serif band) or p 0.55: `b = min(0.95dt, U(4, 6.5)·scale)`, `a = b·U(3, 3.8)`; aligned to `ori` (serif bars horizontal ± N(0, 0.08));
  - else **centric**: `a = b = min(0.95dt, U(8, 14)·scale)`;
  - reject if a < 5 or b < 2, overlap with occupied > 6 %, or < 82 % inside the mask.

**Sprites (`sprite`):**
- pennate: lens `w = b·(1 − (u/a)²)^0.75`, rim, transverse striae `cos(2πu/λ)` with λ = 3.1, central raphe groove, central nodule;
- centric: rim + radial areolae (`n = max(8, 2πa/λ)`) + annulus.
- Z ≤ 1.2.

**Step** (2 substeps per frame, `u = f/nf`, `L = legibility_at(u, "arc")`):
1. Attraction `g = sm((u − u_in)/0.17)·(1 − sm((u − u_out)/0.12))`; target `Tt = T + 18·off·(1 − L)·[u > 0.7]` (loosening).
2. Gate `= clip(1.7·sin(om·f + ph) + 0.5)` (stop-start gliding).
3. **Raphe reversal:** a stopped pennate whose target lies behind it (cos < −0.3) flips SGN; plus random flips at p 0.01.
4. Pennate turn `clip(Δ, ±1)·(0.06 + 0.14g)·g + N(0, 0.035)(1 − 0.8g)`; speed `vmax = 4.2 + 3.5g` (pennate) or `1.1 + 2g` (centric), × gate, slowed near the target. Centrics drift straight toward the target (≤ 6 px·g·0.9) + Brownian.
5. **Docking:** `k = clip((3.5A − d)/2A)·g·(0.08 + 0.32L)`; lock `= g·sm((u − 0.27)/0.11)`: `P += 0.07·lock·(Tt − P)`; rotate onto `TH` (pennates mod π) at rate `min(1.4k, 1)`.
6. Clamp to the frame; cells beyond 0.47N turn back.

**Render:**
- max-composite of the sprites → Z;
- accent `A`: leading ends of gliding `lead` pennates (v > 1.5) + chloroplast specks (`chl`), `clip(22·G₂A)`;
- cache: `Z = G₀.₆`, EMA 0.7; A EMA 0.6; track = moving-cell heat-map peak, word centroid.

**Seeds:** `rng(seed=3)`; static granules p 0.0004 ×3.

**Lifecycle:**
- **spawn:** scattered disc r ≤ 0.46N at t = 0;
- **seek:** gliding, stop-start, raphe reversals;
- **lock-on:** 27–39 %;
- **hold:** to ~76 %;
- **decay:** per-cell release at `u_out` + loosening offset 18(1 − L);
- **eat:** n/a.

## 3. Glyph coupling (GlyphSource)
**Derived today:**
- `mask`: PIL render at N, centre at 0.46N, `width_frac 0.84`, thickened by `EDT ≤ GROW` (default 4 px) so hairlines fit a frustule;
- **SDF:** inside EDT `dt`, used for sizes and rejection;
- **stroke direction field:** structure tensor of ∇dt;
- **baseline / x-height:** from mask rows (`base = last row`, x-height estimated 0.62 of the height).
- Not used: skeleton, counters, per-letter ids, stroke order.

| Product | Used? | Notes |
|---|---|---|
| mask | yes | slots ≥ 82 % inside |
| sdf | yes (EDT inside) | swap for `glyphSDF` (negative inside) |
| centreline/skeleton | no | could seed pennate chains along `glyphSkel` [proposed] |
| direction field | yes (tensor of ∇EDT) | swap for `glyphGrad`⟂ |
| counters | no (implicit) | centrics land in wide bowls by size |
| per-letter ids | no | could stagger `u_in` per letter [proposed] |
| serif/baseline bands | yes (row heuristics) | better: font metrics (baseline, x-height from OS/2 table) via CoreText |

**Replaced font / hand-drawn / SVG:** any mask works. Hand-drawn strokes need `GROW` ≥ 4 px if thin. The baseline and x-height heuristic fails for script or hand lettering, so pass them explicitly or disable the serif band.

## 4. Controls & parameters
| Param | Type / range | Default | Unit | What it does | Exposed to jig? |
|---|---|---|---|---|---|
| ★ `GROW` (env) | 0..8 | 4 | px | min stroke width for frustules | proposed |
| ★ pennate share | 0..1 | 0.55 (+ all thin) | – | boats vs discs | proposed |
| ★ pennate size b | px | U(4, 6.5) × scale | px | cell size → texture scale | proposed `cellSize` |
| pack scales | list | 1, 0.75, 0.55, 0.42 | – | fill density | internal |
| overlap / inside | 0..1 | 0.06 / 0.82 | – | packing strictness | internal |
| λ (striae) | px | 3.1 | px | silica detail | internal |
| ★ vmax | px/frame | pennate 4.2 + 3.5g, centric 1.1 + 2g | px | glide speed | proposed |
| gate ω | rad/frame | U(0.15, 0.35) | – | stop-start rhythm | proposed |
| `u_in`, `u_out` | u | U(0.06, 0.16), U(0.76, 1.15) | – | arrival / release spread | proposed |
| ★ legibility | arc | `arc` | – | docking gain 0.08 + 0.32L; loosen 18(1 − L) after 0.7 | `LivingTypeKnobs.legibility` (proposed) |
| `GSCALE` (env, look) | 0.3..2 | 1.0 | – | polar colour order | proposed `polarGamma` |
| `seed` | int | 3 | – | – | snapshot |

Clip: word "serif", font Kalnia (variable `wdth, wght`); CLI axes `500,115` per the README run line [the axis order follows the font's axis table; exact mapping UNKNOWN without reading the font's fvar].

## 5. Timeline / arc
| u | |
|---|---|
| 0–0.06 | scattered, gliding at random |
| 0.06–0.27 | cells start homing (`u_in`), stop-start, reversals |
| 0.27–0.39 | lock-on; everyone docked by ~0.40 |
| 0.40–0.76 | hold (readable mosaic), polariser sweeping colour |
| 0.70+ | loosening offsets grow as L falls; cells released from `u_out` |

## 6. Camera & optics
`look_polar` with `coc_track` (target = moving-cell heat peak while gliding → word centroid). See [`polarised.md`](systems/glab/polarised.md).

## 7. Performance & tiers
- **Box CPU:** sim ≈27 s / 240 frames (276 cells); the look dominates (≈2 s/frame).
- **GPU [est]:** trivial. 276 rigid bodies (one threadgroup), each sprite an analytic SDF splat (instanced quads). The cost is the polar look (≈1.0× darkfield mid).
- **Tiers:** the same cell count on all devices; A12 uses the cheap polar.

## 8. Port to macOS Swift/Metal
**Buffers:**
- `dtmCells`: struct-of-arrays, `float4 (P, PHI, SGN)`, `float4 (T, TH, kind)`, `half4 (A, B, om, ph)`, `half4 (u_in, u_out, off)`, flags; ≈64 B/cell.
- `dtmZ`: `r16Float`; `accent`: `r8Unorm`.

**Kernels:**
- `dtmPack`: **CPU, once per glyph change.** Port `pack` as-is in Swift; it needs the SDF and direction field from GlyphField. Greedy and serial; fine on CPU for ~300 cells.
- `dtmStep`: compute, one thread per cell (gate, reversal, turn, dock).
- `dtmSplat`: render pass, instanced quads; fragment evaluates `sprite()` analytically with **max blending** (`MTLBlendOperationMax`) into Z; accent via additive blend.

**Passes:** step (H1) → splat → MicroscopePass polar (H6) → `lifeComposite` (H5).

**Hooks:** H1 `lifeExtensions`, H4 `Snapshot.ext` (cell buffer + rng), H7 `LivingTypeKnobs` (proposed fields `diatomGrow, pennateShare, cellSize, glide`), H8 `MediaTool.living`. All proposed (doc 42 §2.3), not found in checkout `ea48744`.

**Portable as-is:** sprites, step and packing logic. **Rewrite:** `np.maximum` composite → max-blend splats; NumPy RNG → per-cell hash.

## 9. Known gaps & next refinement
- No cell–cell collision during gliding (only at packing).
- The baseline / x-height detection is heuristic.
- Silica colours are exaggerated (real-ish).
- Centrics don't rotate meaningfully.
- No division (diatoms do divide; could tie into `bacteria-multiply`).
- Kalnia axis mapping is UNKNOWN (see §4).

## 10. Files & clips
`visuals/glab/src/diatom_word.py`, `looks.py`; cache `/tmp/looks_sim_serif/`; clip `visuals/glab/looks/look-06-diatoms-serif*`.
