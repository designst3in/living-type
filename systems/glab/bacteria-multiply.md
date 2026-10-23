# Bacteria multiply into a dot font (`bacteria-multiply`)

> Rod bacteria fill a dot-matrix word by binary fission: letters start one by one, each rod elongates into a free neighbouring dot, pinches a septum and splits, then late overgrowth spills off-grid. Epifluorescence. Clip: `look-07-bacteria-multiply` ("multiply", Doto ROND 100 wght 700). Source: `visuals/glab/src/bacteria_word.py` (`dots`, `Sim.step`, `Sim.render`, `build_cache`); look `looks.py` `bact_fluor`.

## 1. What it is
Growth by division on a lattice that *is* the font. Doto's dots become the slots; a word is "written" by exponential growth. The green accent marks dividing cells only.

## 2. How it works
**State:**
- dots `D (n×2)` with letter index `let`; median nearest-neighbour `pitch p`;
- neighbour lists `nb[i]` = dots within 1.6p of the same letter;
- occupancy `occ[i]` ∈ {−1 free, −2 reserved, cell id};
- cells: `{c, ang, dot, div: {t0, dur, to, ang} | None, cool, tgt_ang}`.

**Step** (`u = f/nf`):
1. **Founders:** letter k starts at `0.03 + 0.024k ± 0.005`. ⌈dots/6⌉ founders per letter: the first is the lowest-left dot (max `y − 0.3x`), the rest by farthest-point sampling.
2. **Dividing cells:** progress `τ = (f − t0)/dur`. At τ ≥ 1, the daughter appears at the target dot (or the off-grid point) and the parent cools for 1–4 frames.
3. **Idle cells after cooldown:** pick a random free neighbour dot (reserve it). Duration `U{8..11}` frames, direction toward it.
4. **Overgrowth (u > 0.78):** with p = `0.012·(u − 0.78)/0.22 + 0.002`, divide to an off-grid point one pitch away, if > 0.8p from all cells.
5. Idle rods rotate toward the stroke direction (mod π; mean doubled angle of neighbour vectors) at 0.15/frame + N(0, 0.01). Off-grid cells jitter N(0, 0.25).

**Render (capsule SDF):**
- radius `r = 0.21p`, half-length `h = 0.24p`;
- dividing: extent `h + p·sm(τ)`, septum pinch `rr = r·(1 − 0.8·pinch·exp(−((u − mid)/0.16p)²))` with pinch = `sm((τ − 0.35)/0.65)`;
- `z = 0.95·√(1 − (d/rr)²)`, max-composite;
- `A = [z > 0.15]·sin(πτ)^0.7` on dividing cells;
- cache: `Z = G₀.₇`, `A = G₁`; track = dividing-cell heat peak (mass = 150·#dividing), word centroid as "nucleus".

**Seeds:** `rng(seed=5)`; granules p 0.0004 ×3.

**Lifecycle:**
- **spawn:** founders per letter, staggered;
- **seek:** n/a (lattice);
- **lock-on:** inherent (cells sit on dots);
- **hold:** filled ≈ 97 % mid-clip (README);
- **decay:** overgrowth after 0.78 blurs the letterforms;
- **eat:** n/a.

## 3. Glyph coupling (GlyphSource)
**Derived today:**
- per-letter PIL render → connected components → **dot centroids** + per-letter ids (`let`);
- pitch from nearest-neighbour distances;
- **local stroke direction** from neighbour vectors (doubled-angle mean);
- word fitted to `width_frac 0.88`, centre at 0.45N;
- whole-word mask saved for `spec_coc` and the cache.

| Product | Used? | Notes |
|---|---|---|
| mask | only for the cache / focus | – |
| sdf | no | – |
| centreline/skeleton | no (implicit) | **non-dot fonts:** sample the skeleton at spacing p to make the dot lattice [proposed] |
| direction field | yes (from the dot lattice) | could read `glyphGrad`⟂ |
| counters | no | – |
| per-letter ids | **yes** | letter start order, same-letter neighbours |
| stroke order | partly | founders start at the lowest-left dot; division is a random BFS |

**Replaced font:**
- dot fonts work directly (components = dots);
- **solid fonts produce one component per letter, so the sim breaks.** It needs a lattice from Poisson-disc sampling inside the mask, or from the skeleton at pitch p [proposed; not implemented].

**Hand-drawn PencilKit / SVG:** resample the stroke path at arc-length spacing p to make the dots; stroke order then gives a natural founder (the stroke start) and growth order.

## 4. Controls & parameters
| Param | Type / range | Default | Unit | What it does | Exposed to jig? |
|---|---|---|---|---|---|
| ★ letter stagger | u | 0.03 + 0.024k | u | write-on speed | proposed `letterStagger` |
| ★ founders per dot | – | 1 per 6 dots | – | how many starts per letter | proposed |
| ★ division duration | frames | 8–11 | frames | fission tempo | proposed `divisionTime` |
| cooldown | frames | 2–6 initial, 1–4 after split | frames | pause between divisions | proposed |
| neighbour radius | × pitch | 1.6 | – | lattice connectivity | internal |
| ★ overgrowth | u, p | after 0.78; 0.012·…+0.002 | – | late loss of legibility | proposed (≈ leak) |
| rod r / half | × pitch | 0.21 / 0.24 | – | cell shape | proposed `cellSize` |
| `width_frac` | 0.5..0.95 | 0.88 | – | layout | layout |
| `EXPO` (env, look) | 0.5..3 | 2.0 | – | fluor exposure | proposed `exposure` |
| `seed` | int | 5 | – | – | snapshot |

**Legibility:** `legibility_at(u, "arc")` is computed and logged but **not used** by the step. The decay is the hard-coded overgrowth. Proposed mapping: overgrowth p ∝ (1 − legibility), and division into off-letter neighbours allowed when leak > 0.

## 5. Timeline / arc
| u | |
|---|---|
| 0.03–0.20 | letters ignite one by one (8 letters × 0.024) |
| ~0.30 | ≈76 % of dots filled (README) |
| ~0.5 | ≈97 % filled; readable dot word |
| 0.78–1.0 | overgrowth spills between and around the letters |

## 6. Camera & optics
`look_fluor` with cg 2.2, expo `EXPO` (2.0), `coc_track` (target = dividing-cell heat peak). See [`fluorescence.md`](systems/glab/fluorescence.md).

## 7. Performance & tiers
- **Box CPU:** sim ≈10 s / 240 frames; look ≈2 s/frame.
- **GPU [est]:** negligible (hundreds to a few thousand capsules; instanced SDF splats). Fluor ≈0.7× darkfield mid.
- **Tiers:** the same on all devices.

## 8. Port to macOS Swift/Metal
**Buffers:**
- `bmDots`: `float2` + `ushort letter` + `int occ` (atomic for reservation);
- `bmNbr`: CSR neighbour list, `ushort`;
- `bmCells`: `float4 (c, ang, tgtAng)` + `half4 (t0, dur, cool, flags)` + `uint dot/to`;
- `Z r16Float`, `accent r8Unorm`.

**Kernels:**
- `bmStep`: one thread per cell. The reservation uses `atomic_compare_exchange` on `occ` (deterministic order needs a two-phase claim: propose, then lowest-id wins; the internal perf notes).
- `bmAppend`: daughters via an atomic counter, compacted.
- `bmSplat`: instanced capsule SDF, max blend.
- `bmLattice`: **CPU**, once per glyph: components or a skeleton resample.

**Passes:** H1 step → splat → H6 MicroscopePass fluor → H5.

**Hooks:** H1, H4 (cells + occ + rng), H7 `LivingTypeKnobs` (proposed `letterStagger, divisionTime, overgrowth`), H8. Proposed per doc 42 §2.3; not found in checkout.

**Portable:** the logic as-is. **Rewrite:** Python object lists → SoA buffers; random choices → hash.

## 9. Known gaps & next refinement
- Only dot fonts are supported (no lattice generator for solid fonts or paths).
- Legibility is unused.
- No crowding mechanics (cells never push each other).
- Overgrowth looks uniform. Use nutrient gradients or a chain direction.
- Division always lands exactly on a dot (no slip).

## 10. Files & clips
`visuals/glab/src/bacteria_word.py`, `looks.py`; cache `/tmp/looks_sim_multiply/`; clip `visuals/glab/looks/look-07-bacteria-multiply*`.
