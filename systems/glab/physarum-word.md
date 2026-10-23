# Physarum word, with legibility arc (`physarum-word`)

> A Jones-style Physarum agent sim seeded below the word: it wanders, fans out, locks onto the letter strokes, holds a readable word, then eases back into filament script. Variants: Rheinberg arc **membrane / cytoplasm / gradient** and **C5 grain**. Clips: `look-01a-rheinberg-blue-track` (membrane), `look-01b-rheinberg-teal-track` (cytoplasm), `look-01c-rheinberg-huddi-track` (gradient), `batch-c5-grain`; also the source of `var-v8-specimen` (via `specimen_src.py`). Source: `visuals/glab/src/physarum_word.py` (`word_mask`, `legibility_at`, `run`, `build_cache`); look `looks.py` (`rh_*_track`, `grain`).

## 1. What it is
Slime mould that *finds* the word. The glyph is food ("smell only"; the food is never rendered). Agents follow their own trail plus two food scents (far and near), and starve off-letter during the hold. The legibility arc (doc 42 §6.5) drives approach, lock-on and loosening. It is the core "living type" behaviour; the jig already has the agent kernel (`slimeMove`).

## 2. How it works
**State (sim grid S = 540, render N = 1080):**
- agents `pos (n×2 float)`, `ang (n)`; n0 = 3000 → `n_max = 220_000`;
- `trail (S×S float32)`;
- static fields `food_far = 0.6·G₁₄(mask) + 0.15·seedfood`, `food_near = G₁.₂(mask)`, `fedmap = G₂(mask)`;
- `seedfood` = Gaussian σ 7 at `seed_xy = (S/2, 0.42S + 0.62·word_height + 18)` (below the word).

**Per frame:** `u = f/nf`, `L = legibility_at(u, leg)`, `fw_far = 0.15 + 0.45L`, `fw_near = 0.15 + 2.2L`. Then `steps_per_frame = 3` substeps of:
1. **Growth (u < 0.36):** `target = n0 + (n_max − n0)·clip(u/0.33)^1.4`. New agents go uniformly in an ellipse (y × 0.75) of radius `R = 12 + 0.62S·clip(u/0.33)^0.8` around the seed, heading outward ± N(0, 0.4).
2. **Starve (u > 0.36 and n > 45 000):** die with p = `(0.004 + STARVE·L)·(1 − clip(3·fed))`, with `fed = fedmap[agent]`.
3. **Sense** at distance SO along `ang`, `ang ± SA`: `s = tv/(tv + 60) + fw_far·food_far + fw_near·food_near` (saturating trail → network, not blobs).
4. **Turn** (Jones rule): F ≥ L, R → 0; F < both → ±RA at random; else toward the larger side by RA. Plus wander `N(0, 0.08 + 0.30·(1 − L))`.
5. **Move:** `onl = clip(2.5·fed)`; speed `SS·(1 − 0.75·L·onl)` (linger on strokes); reflect at borders (ang += π).
6. **Deposit:** `trail += DEP·bincount(idx, w)`, with `w = 1 + DEPL·L·onl`.
7. **Diffuse/decay:** `trail = uniform_filter₃(trail)·DECAY`.

**Constants (code):** SA = 30°, RA = 40°, SO = 9, SS = 1.0, DEP = 5, DECAY = 0.90.

**Cache (`build_cache`) → render fields:**
- p = running p99.5 of trail (cummax of G₁₂, 0.6, + G₂₄, 0.4);
- `D = clip(t/p)^0.6`, ×2 zoom, G₁; `Z = D^0.9·1.1`, EMA 0.55;
- tips = `clip((G₂(max(fast − slow, 0))/0.16 − 0.6)·2)·clip(3D)·clip(1 − 2.5·slow)`, with fast/slow EMAs 0.3/0.08;
- nucleus = `clip((G₁₀D − 0.72)·6)·Gauss(seed, σ 60)`;
- `A = clip(tips + 0.6·nuc)`, EMA 0.55;
- `track.npy` = [tips mass, tips cx, cy, nuc cx, cy, nuc mass, peak x, y, peak].

**Randomness/seeds:** `rng(seed=1)`; `static.npz` `rng(7)`.

**Lifecycle (arc):**
- **spawn** 0–33 % (fan growth);
- **seek** 0–30 % (L = 0.2, wide wander);
- **lock-on** 30–40 % (L ramps to 1);
- **hold** 40–75 % (L = 1; starvation clears off-letter mass);
- **decay** 75–100 % (L → 0.35; wander ↑, food weights ↓ → filament script);
- **eat:** n/a (no eating of ink).

## 3. Glyph coupling (GlyphSource)
**Derived today:**
- `mask` only, rasterised by PIL at S = 540, per character with `getlength` advances (no GPOS kerning), plus `TRACK` em letter-spacing;
- width fitted to `width_frac = 0.84`; baseline so the box centre sits at 0.42S;
- `GROW` thickens: `clip(2.2·G_GROW(mask))`;
- food_far / food_near / fedmap are Gaussian blurs of that mask. No SDF, skeleton, direction field, counters or stroke order are used.

| Product | Used? | How it maps |
|---|---|---|
| mask | **yes** | food + fedmap |
| sdf | no (equivalent) | `food_near ≈ smoothstep(+1.2, −1.2, SDF)`; `fedmap ≈ smoothstep(+2, −2, SDF)`; `food_far ≈ exp(−max(SDF, 0)/14)` approx [est]; derive from GlyphField `glyphSDF` (doc 42 §6.1) |
| centreline/skeleton | no | optional: deposit bonus on `glyphSkel` for thin-stroke fonts (would fix the C5 'r' arm) |
| stroke direction field | no | optional: bias the turn toward ±`glyphGrad`⟂ when L is high (cleaner strokes) [proposed] |
| counters | no | counters fill when GROW is high (cytoplasm). Counters could be negative food [proposed] |
| per-letter ids | no | could stagger lock-on per letter (doc 42 §6.4) [proposed] |
| outline paths | no | – |

**Replaced font:** any TTF/OTF/variable axes via CLI `word font axes`. Hand-drawn PencilKit stroke → rasterise the stroke to coverage (or SDF) at S, done. SVG path → rasterise. All three only need a coverage/SDF texture.

## 4. Controls & parameters
| Param | Type / range | Default | Unit | What it does | Exposed to jig? |
|---|---|---|---|---|---|
| ★ `leg` (legibility) | `arc` / `sweep` / float 0..1 | `arc` | – | the master arc; see the mapping below | proposed `LivingTypeKnobs.legibility`; `LifeKnobs.leak` = 1 − legibility (doc 42 §6.5) |
| ★ `TRACK` (env) | 0..0.2 | 0 | em | letter spacing; keeps letters from merging | proposed `LivingTypeKnobs.tracking` |
| ★ `GROW` (env) | 0..3 | 0 | px @S | stroke thickening (more food, filled counters) | proposed |
| ★ `STARVE` (env) | 0..0.06 | 0.022 | 1/substep | off-letter death rate at L = 1 | proposed |
| ★ `DEPL` (env) | 0..8 | 3.0 | – | extra stroke deposit at L = 1 | ≈ `slimeFood` |
| `n_max` | 50k..400k | 220 000 | agents | final mass | jig `maxAgents = 400_000` |
| SA | rad | 30° | deg | sensor angle | `slimeAngle` (0.5 rad) |
| RA | rad | 40° | deg | turn | `slimeTurn` (0.35 rad) |
| SO | px | 9 | px @S | sensor offset | `slimeSensor` (9.0) |
| SS | px/step | 1.0 | px | speed | `slimeSpeed` (1.2) |
| DEP | – | 5 | – | deposit | (fixed 256-scale in `slimeMove`) |
| DECAY | 0..1 | 0.90 (after a 3×3 box) | /step | trail fade | `slimeDecay` (0.94) + `slimeDiffuse` |
| `steps_per_frame` | 1..6 | 3 | – | speed | `LifeKnobs.speed` |
| `width_frac` | 0.5..0.95 | 0.84 | – | word width | layout |
| `seed` | int | 1 | – | RNG | snapshot |
| `secs` | s | 10 | s | clip length | Score |

**Legibility mapping (as coded):**
- `fw_far = 0.15 + 0.45L` (approach range);
- `fw_near = 0.15 + 2.2L` (lock);
- wander σ = `0.08 + 0.30(1 − L)`;
- stroke linger `1 − 0.75·L·onl`;
- stroke deposit `1 + DEPL·L·onl`;
- starvation `0.004 + STARVE·L`.

So leak = 1 − L widens wander and weakens the food pull.

**Variants:**

| Variant | Word / font / axes | Sim env | Look preset | Focus |
|---|---|---|---|---|
| membrane | membrane / Gluten / wght 500 | TRACK 0.08 | `rh_blue_track` (stop #1c4a66, cream, rose #e8707e) | coc_track |
| cytoplasm | cytoplasm / Rubik Microbe (static) | GROW 1.6, TRACK 0.04 | `rh_teal_track` (#1f5c5a, #f2a43a, #c9741f) | coc_track |
| gradient | gradient / Recursive / MONO 0, CASL 0, wght 700, slnt 0, CRSV 0 | – | `rh_huddi_track` (#0d0d0d×2.2, cream, cream×0.55) | coc_track |
| **C5 grain** | grain / Bitter / wght 800 | TRACK 0.04, GROW 1.2, **DEPL 5.5, STARVE 0.045** | `grain` (#3d1166, #ffb547, #e0812e) | coc_track tilt_k 1.6, maxr 24 |

C5 adds a **stroke floor** in the cache (applied by hand, not in a script): `Z = max(Z_raw, 0.13·w·eroded_mask)`, with w = 0 until the arc passes 0.6. This reattaches the 'r' arm; the raw trail is kept in `Z_raw.npy`.

## 5. Timeline / arc
| u | L | What you see |
|---|---|---|
| 0–0.30 | 0.2 | seed blob fans out, wide wandering network |
| 0.30–0.40 | 0.2 → 1 | network snaps onto the letters (~35–40 %) |
| 0.40–0.75 | 1.0 | clearly readable word; off-letter mass starves |
| 0.75–1.0 | 1 → 0.35 | strokes loosen into filament script |

`sweep`: 1.0 until 0.55, then `1 − 0.9·sin²(π·w)`. Poster frame 132 (55 %).

## 6. Camera & optics
Rheinberg presets above, `coc_track` focus (front tips early → nucleus/word later), ring inner 0.62. See [`rheinberg.md`](systems/glab/rheinberg.md), [`focus.md`](systems/glab/focus.md).

## 7. Performance & tiers
- **Box CPU:** sim ≈55 s per 10-s clip (NumPy, ≤220k agents, S = 540); look ≈2–2.5 s/frame.
- **GPU [est]:** the agent step is the existing `slimeMove` pattern (memory-bound scatter). Device agent budgets per the internal perf notes (not repeated):
  - M5: full `n_max` at sim res ≥ 1080;
  - A16: reduced agent count at 540–720;
  - A12: lowest row, buffer atomics only (no texture atomics, Apple5; the internal perf notes).
- **Optics** per [`optics.md`](systems/glab/optics.md) §7 (Rheinberg ≈1.2–1.3× darkfield mid).

## 8. Port to macOS Swift/Metal
**Buffers:**
- `glabAgents`: 8 B/agent per the internal perf notes: `ushort2 pos` (unorm16 fixed-point) + `half heading` + `ushort flags` (alive, seed-group). The jig today uses 16 B `float4` (`PaintSim.swift`, `maxAgents·16`); the 8 B vs 16 B choice is bench job `jobs/perf/04-agent-layout-8B-vs-16B.yaml` (result UNKNOWN).
- `glabDeposit`: `atomic_uint` buffer, S² (integer atomics; determinism the internal perf notes).
- `glabTrail`: `r16Float` (sampling format per bench 05).
- `glabFood`: `rgba16Float` (far, near, fed, seedfood), derived once per glyph change from `glyphSDF` (r16Float) + coverage mip.
- `lifeCoverage`: reduction buffer (front/tip centroid, nucleus, mass) for focus and Director (doc 42 §6.6).

**Kernels** (in `Shaders/GlabShaders.swift`, the internal perf notes):
- `pwFood`: SDF → food fields;
- `pwSpawn`: fan growth, append via an atomic counter;
- `pwAgent`: sense / turn / move / deposit / starve-flag; based on `slimeMove` (`LifeShaders.swift:160` at d37f560; `PaintSim+Life.swift:292` in the local `ea48744`);
- `pwCompact`: stream compaction; SIMD prefix on Apple7+, threadgroup fallback on A12 (the internal perf notes);
- `pwField`: fused resolve deposit → 3×3 box → decay;
- `pwCache`: D/Z/tips/nucleus EMAs, for render.

**Passes:** sim (H1) → body `Z, accent` → `MicroscopePass` Rheinberg + `focCoC/focRing` (H6) → `lifeComposite` (H5).

**Hooks (doc 42 §2.3; proposed, not found in checkout `ea48744`):**
- H1 `lifeExtensions` (`LifeExtension` at the end of `lifeTick`);
- H2 seeds via `ecoDeposit` (new `Seed` case ≥ 10; the existing `Seed` enum ends at `magnet = 9`, `Knobs.swift:156`);
- H3 `lifeRuns`;
- H4 `Snapshot.ext` (agents + trail + RNG tick);
- H5 `paintRender` `hasLifeExt`;
- H6 `postPasses`;
- H7 `LifeKnobs.livingType: LivingTypeKnobs?` (proposed fields: `legibility, tracking, grow, starve, strokeDeposit, nMax, seed, arc`);
- H8 `MediaTool.living`.

**Tiers:** M5 full res sim + full optics; A16 ½-res sim, mid optics; A12 ½-res sim at the lowest agent row, cheap optics, buffer atomics, no SIMD reductions.

**Portable as-is:** the rules, constants and arc. **Rewrite:** `bincount` → atomics; `uniform_filter` → fused field kernel; the p99.5 normaliser → a running histogram or max reduction [est]; cache EMAs → per-frame textures.

## 9. Known gaps & next refinement
- No kerning: the mask uses per-char advances.
- Thin arms (C5 'r') detach without the stroke floor, and the floor isn't in a script yet (hand-applied in the cache). Codify it as a skeleton deposit bonus.
- Food is a Gaussian of the mask, not the SDF.
- The sim uses `u = f/nf` while the looks use `i/(nf − 1)` (a tiny arc offset).
- The green accent on growth tips clashes with the amber/violet C5 palette.
- No per-letter staggering.
- The p99.5 normaliser is non-causal (it smooths over the clip).

## 10. Files & clips
- Source: `visuals/glab/src/physarum_word.py`, `looks.py`; cache `/tmp/looks_sim_<word>/{Z,A,track,legibility}.npy, static.npz, mask.png` (C5 also `Z_raw.npy`).
- Clips: `visuals/glab/looks/look-01a-rheinberg-blue-track*`, `look-01b-rheinberg-teal-track*`, `look-01c-rheinberg-huddi-track*`, `batch-c5-grain*`.
- Fonts: `visuals/fontcast/fonts/`.
- Refs: doc 42 §6.4–6.6, the internal perf notes, `visuals/glab/looks/README.md`.
