# Ink bleed through paper fibres (`ink-bleed`)

> A crisply printed word in blue-black ink on warm paper. Ink is released from the stroke edges as Jones/Physarum agents that wick along an anisotropic cellulose-fibre field, while the strokes themselves are eaten along the fibres. The legibility arc is **reversed**. Clip: `var-v1-bleed` ("bleed", Newsreader wght 560 opsz 72). Source: `visuals/glab/src/ink_bleed.py` (`leg_rev`, `fibres`, `sim`, `frame`, `full`).

## 1. What it is
Capillary wicking of bad ink into unsized paper. Ink travels faster and further along fibres, dries off-fibre, and leaves feathered edges and a tide line. Unlike every other glab clip, the word starts legible and ends nearly gone.

## 2. How it works
**State:**
- Sim grid `S = 540`.
- `fib`: fibre texture from `fibres(n, seed 4)`, ×4 density at N for render. It has 2600·scale curved strokes, length 30–160 px (at 540), width 0.6–1.6, mostly ±35° of horizontal (`N(0, 0.6)` rad, 15 % vertical), slight curvature `N(0, 0.012)`.
- Agents `pos (k×2)`, `ang`, capped at 160 000.
- `trail` (S²), cached as `trail.npy` (nf×S×S, memmap).

**Step (per frame, 2 substeps):**
1. `L = leg_rev(u) = 1 − 0.85·sm((u − 0.45)/0.55)`: 1.0 until 45 %, ≈0.8 at 55 %, 0.15 at the end.
2. **Release** `rel = 80 + 3200·(1 − L)^1.3` agents at random 1-px stroke-edge pixels (jitter N(0, 0.6)).
3. **Sense** at offset `SO = 3.5` px, angles 0, ±`SA = 22°`: `0.35·tv/(tv + 40) + 1.4·fibf` (the fibres dominate the trail).
4. **Turn** `RA = 30°` toward the best (Jones rule) + N(0, 0.22).
5. **Speed** `0.35 + 0.9·fibf` (capillary runs along fibres).
6. **Dry/stall:** p = `0.012 + 0.04·(1 − fibf)`.
7. **Deposit** `DEP = 2.0` via bincount; trail decay 0.975.

**Render (`frame`):**
- **Eaten strokes:** `Mink = M·clip(1 − (1 − L)·0.95·(0.25 + eat))`, with `eat` = fibres + a σ6 noise blotch − 0.75.
- **Ink in fibres:** `T = trail/(trail + 130)`, then `G₁.₂(T)·(0.15 + 1.4·fibx^1.3) + 0.25·G₅(T)`.
- **Feather** `G₂.₅(M)·fib·(1 − L)·0.7`.
- **Optical density** `D = clip(1.15·Mink + 0.75T + feather, 0, 2)`.
- **Tide line** `wet = clip(G₃(T) − 0.6T)`.
- **Beer–Lambert on paper:** `C = PAPER·tex·exp(−(D + 0.6·wet)·INK)`, PAPER `#efe5cf`, INK absorbance `(2.6, 2.4, 1.6)` (blue-black). Fibre shading ×(1 − 0.03·fib).
- **Post:** `tilted_coc(0.45, 0.22, maxr 7)`, 5-level ring defocus, soft stop `0.88 + 0.12·STOP`, grain (900, 0.003), label.

**Seeds:** sim rng 2; fibres 4; eat noise 9; paper tex 5.

**Lifecycle:** hold (crisp print, 0–45 %) → spawn/release ramps with (1 − L) → wick along fibres → eat (strokes erode along fibres) → end at L 0.15, with a ghost of the word left on purpose (AJ: "toned-down level that leaves a ghost").

## 3. Glyph coupling (GlyphSource)
| Product | Used? | How |
|---|---|---|
| mask | **yes** | `pw.word_mask` (TRACK/GROW env apply), printed ink + release band |
| outline (edge band) | **yes** | 1-px edge = release sites |
| sdf | indirect | feather = blurred mask; could be `clip(−sdf/w)` |
| direction field | no (fibres are paper, not glyph) | INVENTORY next step: bias sensing/turning by fibre direction |
| counters / ids | no | – |

**Replaced font / PencilKit / SVG:** any mask works. Hand strokes are ideal: release sites = stroke outline. Paper fibres are independent of the glyph.

## 4. Controls & parameters
| Param | Type / range | Default | Unit | What it does | Exposed to jig? |
|---|---|---|---|---|---|
| ★ `legibility` (reversed arc) | 0..1 | `leg_rev(u)` | – | release rate, stroke erosion, feather | H7 `legibility` (arc preset "reverse") |
| ★ release | agents/frame | `80 + 3200(1−L)^1.3` | – | how much ink bleeds | proposed `bleedRate` |
| agent cap | int | 160 000 | – | budget | tier |
| `SA` / `RA` / `SO` | deg / deg / px | 22 / 30 / 3.5 | – | Jones sensor geometry | internal |
| ★ fibre weight | – | 1.4 (trail 0.35) | – | wicking follows fibres vs trail | proposed `fibreBias` |
| speed | px/substep | `0.35 + 0.9·fibf` | – | capillary speed | internal |
| dry | p | `0.012 + 0.04(1 − fibf)` | – | run length | proposed `dryRate` |
| `DEP` / `DECAY` | – | 2.0 / 0.975 | – | trail | internal |
| fibre texture | count, angle σ | 2600, 0.6 rad, 15 % vertical | – | paper grain | proposed paper preset |
| ★ ink / paper | absorbance, hex | (2.6, 2.4, 1.6) / `#efe5cf` | – | colour | palette |
| DOF | 0.45 / 0.22 / 7 | – | – | very shallow blur only | `zFocal`, `cocScale` |

## 5. Timeline / arc
Emergent sim under a keyed reversed arc (`leg_rev`). 10 s at 24 fps. Crisp to 45 %, then bleeding accelerates to the end.

## 6. Camera & optics
Fixed camera, reflected-light paper (not a microscope modality), Beer–Lambert colour, mild ring CoC (maxr 7), fine grain. Palette is real-ish paper/ink, not HUDDI.

## 7. Performance & tiers
- **Box CPU:** sim ≈3 s and frames ≈1.5 s each on 3 procs, as logged in the README. The sim figure looks low for a 160k-agent cap; unverified.
- **GPU [est]:** cheap–mid. A 2D agent sim plus Beer–Lambert (README). Agent budgets per the internal perf notes
- **Tiers [est]:** M5 160k agents at S = 540–1080; A16 ~80k at 540; A12 ~40k at 540, buffer atomics only (the internal perf notes), fibre texture at half res.

## 8. Port to macOS Swift/Metal
**Buffers:** agents as in [`physarum-word.md`](systems/glab/physarum-word.md) (8 B/agent proposal); `ibTrail` `r16Float`; `ibFibre` `r8Unorm` (static, CPU-baked or a GPU line splat); `ibDeposit` `atomic_uint`.

**Kernels:**
1. `ibRelease`: append at edge pixels via an atomic counter, count from L.
2. `ibAgent`: `slimeMove`-pattern sense/turn/move/deposit with the fibre term and the dry flag (`PaintSim+Life.swift:292` in local `ea48744`).
3. `ibField`: deposit resolve + decay.
4. `ibShade`: Beer–Lambert paper, eat, feather, tide line.
5. Shared focus/grain.

**Hooks:** **H1** `lifeExtensions` (sim tick); **H2** an ink seed via `ecoDeposit` if strokes are painted live; **H4** snapshot (agents + trail); **H5** composite (the paper layer replaces the canvas background); **H7** (proposed `bleedRate, fibreBias, dryRate`, arc preset `reverse`). Proposed per doc 42 §2.3; not in checkout.

**Portable:** all rules. **Rewrite:** `bincount` → atomics; Python release loop → append kernel; trail memmap → live texture.

## 9. Known gaps & next refinement
- Fibres radiate evenly instead of following the grain. Bias sensing/turning by the fibre *direction* (doc 42 / INVENTORY §5).
- The tide line is weak late.
- The word ends at L 0.15 as a ghost. The INVENTORY suggests letting consumption finish (L ≈ 0) as an option.
- The sim timing in the README is unverified.

## 10. Files & clips
`visuals/glab/src/ink_bleed.py`; cache `/tmp/looks_ink_bleed/` (`trail.npy`, `legibility.npy`, `mask.npy`, `fib_hi.npy`); clip `visuals/glab/looks/var-v1-bleed*`. Refs: INVENTORY §5, [`physarum-word.md`](systems/glab/physarum-word.md), `controls.md` (`leg_rev`).
