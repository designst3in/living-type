# Mycelium + spore heads (`mycelium`)

> Aspergillus-like hyphal tips grow into the letters, branch, avoid each other, then raise conidiophores (stalk → vesicle → bead chains of conidia). Clips: `spore` (Gluten wght 800), `kerning` (Pixelify Sans 700, tight tracking), `LIGATURE` (Kablammo morph 20, tight tracking + anastomoses), `LIGATURE` legibility 1.0 → 0.0 (same font). Script only, never rendered: `network` (Rubik 800 + CoC rack). The same `grow` kernel also drives V5 widow, V7 contrast, B1 strike, B2 anchor, B3 venation (tertiary veins) and C1 patina (hyphal margin); those have their own docs. Source: `visuals/maker/species/mycelium-spore-heads/mycelium.py`, `myc_motion.py`

Paths are relative to the living-type project root.

## 1. What it is
Conidia germinate (1–2 germ tubes each) on letter-shaped nutrient. Hyphal tips extend at the apex, turn toward food, avoid existing hyphae (negative autotropism) and branch subapically, so each glyph fills with an evenly spaced network that fuzzes slightly past the edge. Mature hyphae raise conidiophores. Look: stained brightfield, lactophenol cotton blue tape mount, desaturated to a grey lab photo (`mycelium.py` docstring).

## 2. How it works
- **State** (`mycelium.py:build`, `myc_motion.py:build_knob`):
  - `tips: float32[60000, 6]`, columns `x, y, h (heading rad), alive (0/1), gen (branch generation), age (steps since birth/last branch)`; `ntip` live count.
  - `food: float32[S,S]` (S = 1080), `dens: float32[S,S]` (crowding footprint).
  - `segs: float32[2_500_000, 6]`: `x0, y0, x1, y1, step, gen` (append-only growth record; render replays it by step).
  - Spores: `SPORES` (2 per letter default; 5 in kerning/ligature) seed points where the per-letter SDF < −10.
- **Update step** (`mycelium.py:grow(tips, ntip, food, dens, segs, nseg, steps, seed)`, numba `@njit`), per step, per live tip:
  1. Sense 5 headings `h + {−0.5, −0.25, 0, 0.25, 0.5}` at radii 5 and 9 px: `v = Σ_r 1.6·food − 1.6·dens` (−9 off-canvas), `+0.15` for straight ahead (apical persistence).
  2. Turn: `h ← h + 0.25·(h_best − h) + N(0, 0.045)`.
  3. Step 1 px: `(x, y) += (cos h, sin h)`.
  4. Stop rules: if `age > 8` and `dens` 3 px ahead > 0.9, die with p = 0.35 (crowding/fusion); if `food < 0.02` at the new cell, die with p = 0.08 (starvation).
  5. Record a segment; deposit a 5×5 footprint into `dens` (0.35 centre, 0.12 within L1 ≤ 2, 0.04 corners).
  6. Branch: if `age > 14` and `food > 0.2`, with p = 0.05 spawn a child at heading `h ± (0.6 + 0.5·U)`, `gen + 1`; parent age resets to 0.
  - Every 50 steps `dens *= 0.995`.
  - `build`: `STEPS = 1300` in one call. `build_knob` (legibility): 52 chunks of 25 steps, food re-evaluated with `LG.food_field(mask, sd, leg_at(cfg, c/760))` whenever the rounded legibility changes; segment step stamps are offset by the chunk start.
- **Food:** without the knob `food = clip(0.5 − sd/8, 0, 1)` (saturated inside, 8 px shoulder). With the knob, `legibility.food_field` (see [`legibility.md`](systems/maker/legibility.md)).
- **Render/replay** (`myc_motion.py:frame`): visible segments are `segs[step < cut]`, `cut = cut_end·(ease((t−g0)/(g1−g0)) + creep·smoothstep(hold−1, secs, t))`, `cut_end = quantile(step, q_end)` (never past the open "forming" density). Width `clip(1.4 + 1.6·age − 0.25·√gen, 1.0, 3.2)` (age normalised to cut); lumen line for w > 2; septa every 31st segment. OD = `hy·0.85 − lumen·0.35 + spores`, plus `LG.consumed(substrate, hy, lv)·0.10` (faint letter eaten by the knob).
- **Conidiophores** (`myc_motion.py:setup`): picked on segments older than `0.75·cut_end`, base SDF < −4, ≥ 72 px apart, head SDF < −6, stalk 20–44 px, vesicle r 4.5–7, 26–41 chains of 3–6 conidia over a 1.3π–2π fan. Each head has start `ts ∈ heads_t`; progress `p = (t−ts)/0.9`: stipe extends (p/0.45), vesicle swells (smoothstep 0.35–0.65), conidia bead out (0.55–1.0). Drifting conidia (`drift_n` per head) detach in the hold.
- **Anastomoses** (`setup`, when `anast > 0`): `cKDTree.query_pairs(anast_r)` on every 3rd segment end; score = 3·(different letters) + 1·(birth steps > 60 apart) + (dist > 6) + 0.5·U; top `anast` pairs ≥ 22 px apart become H-bridges that grow in from both sides over 70 steps and end in a fusion knot.
- **Randomness / seeds:** module RNG `default_rng(11)` (spores), numba `np.random.seed(seed)` per `grow` call (5, or 5 + chunk start), head/drift RNG `cfg['seed']` (77 spore, 78 kerning, 79 ligature, 81 network). Deterministic per config.
- **Lifecycle:** spawn (germ tubes) → seek (food/density sensing) → lock-on (saturated food inside glyph keeps tips alive; outside they starve) → hold (`creep` slow tip growth + drifting conidia) → decay/eat only through the knob (`consumed`, counters lure at low legibility). No death of the network.

## 3. Glyph coupling (GlyphSource)
- `mask` (`labkit.word_mask`), `sdf` (`labkit.sdf`), per-letter masks (spore placement: SDF < −10 inside each letter; anastomosis letter ids by dilating each letter 14 px), counters/gaps through `legibility.food_field`.
- Kerning variant replaces `labkit.word_mask` with `myc_motion.tracked_word_mask(track)` (advances ×`track`, 0.90).
- Not used: skeleton, direction field.
- Replaced font / PencilKit / SVG: only a coverage raster is needed; SDF and food derive from it. Per-letter ids for spores/bridges come from per-glyph rasters, or connected components for hand drawing.

## 4. Controls & parameters
`CFG` defaults (`myc_motion.py:CFG`) then `BASE` overrides for kerning/ligature (`mycelium_words.py:BASE`).

| Param | Type / range | Default | Unit | What it does | Exposed to jig? |
|---|---|---|---|---|---|
| **`legibility`** (hero knob) | float 0..1 or (l0, l1) ramp | absent = old food; 0.8 'network'; (1.0, 0.0) ligature-knob | – | food field via `legibility.food_field`; substrate eating | proposed `LivingTypeKnobs.legibility`; real `LifeKnobs.leak` |
| **`q_end`** (hero knob: density) | 0..1 | 0.52 (spore), 0.72 (BASE) | quantile | how far the growth record is replayed | proposed |
| **`n_heads`** (hero knob) | int | 20 / 13 | count | conidiophores | proposed |
| **`anast`, `anast_r`** (hero knob, ligature) | int, px | 0 / 46, 18 | count, px | fusion bridges between letters | proposed |
| **`track`** (hero knob, kerning) | float | 1.0 / 0.90 | × advance | letter tracking | proposed (GlyphField layout) |
| `spores` | int | 2 / 5 | per letter | germination points | `spawnAgents` kind 2 (real) |
| `secs`, `grow`, `heads_t`, `hold` | s | 15, (0.6, 10), (7.4, 10.4), 11.6 / BASE 9, (0.5, 6.4), (4.6, 6.9), 7.7 | s | arc timing | Director (proposed) |
| `creep` | float | 0.035 / 0.025 | frac of cut_end | tip creep in hold | – |
| `drift_n` | int | 5 | per head | loose conidia | – |
| `hours` | float | 36 / 30 | h | caption clock (see gaps) | – |
| `seed` | int | 77..81 | – | head/drift layout | – |
| `focus` | callable | None | – | swaps static DOF for the CoC rack (network) | proposed H6 |
| kernel constants | sense r 5/9; ±0.5 rad fan; turn 0.25; noise 0.045; branch p 0.05 after 14 steps, angle 0.6–1.1; crowd 0.9 / p 0.35; starve 0.02 / p 0.08 | – | px / rad | hard-coded in `grow` | real jig analogue: `fungusRate`, `fungusWander` (`Knobs.swift:188`) |
| `STEPS` | int | 1300 | steps | sim length | – |
| `leg_ref_steps` | int | 760 | steps | step count mapped to knob progress 1.0 | – |

Legibility mapping: `food_field` (attract, leak_px, counter lure) changes where tips survive and branch; `consumed` fades the faint letter where hyphae sit.

## 5. Timeline / arc
Emergent growth (one sim), **keyframed replay**: the full record is simulated first and then revealed by `cut(t)`; heads are scheduled (`heads_t`), the hold has `creep`. Arc: germinate → thread letters → conidiophores rise → hold. Stage text from `frame` (`stage_fn` overrides for kerning/ligature).

## 6. Camera & optics
Brightfield: OD → transmission `exp(−OD·absorb·1.6)` with `absorb = −ln([0.50, 0.62, 0.86])` (cotton blue), condenser halo `0.35·clip(G₃.₅(OD) − OD)`, lamp `[0.90, 0.89, 0.86]`, agar noise, Köhler, vignette, dust; desaturate to 38 % chroma; grain 0.03; gamma 1/1.06. Static tilted focus band `plane = clip(|0.4x + 0.6y − 0.47|·2.6, 0, 2)` with per-layer offsets (hyphae 0, near heads +0.25, far heads +1.6, drift +1.1). 'network' swaps in `coc.ring_defocus` with a there-and-back tilted rack (`mycelium_network.py:rack`, maxr 14). 40×, scale bar 50 µm.

## 7. Performance & tiers
Box: `grow` 1300 steps with up to ~tens of thousands of tips: tens of seconds (numba, 1–2 threads). Render dominates: PIL draws every visible segment at 2× per frame (~0.5–2 M lines), roughly 10–30 s/frame; `run()` auto-falls back to a 540 output if render time exceeds `200·secs/8` s. [est] M5: real time at 1080p with ≤ 50k tips and a segment texture; A16: 20k tips, half-res DOF; A12: 8k tips, no conidia drift, Gaussian DOF.

## 8. Port to macOS Swift/Metal
- **Buffers:** `tips` as `SIMD4<Float>` (x, y, h, kind) + side buffer (gen, age, alive), matching the real agent layout `spawnAgents(_:_:)` (`PaintSim+Life.swift:89`, kind 2 = hypha tip, 16 B/agent). `dens r32Float` (atomic-uint deposit like `slimeMove`), `food r32Float` (real `food` texture), segments → do not store; deposit straight into a `hyphae` coverage texture + a `birthStep r32Float` texture (replay = threshold on birth step; width from age).
- **Kernels per tick:** `hyphaTipStep` (sense 10 taps, turn, move, deposit footprint with integer atomics, stop rules, branch via reserved-slot append / prefix-sum compaction, doc 42 §2.3 item 4), `densDecay` (every 50 steps), `foodField` when legibility changes. Render: `hyphaRender` (coverage + lumen), `conidiophoreStamp` (instanced sprites from a CPU head list), brightfield OD → transmission in `paintRender`-style pass, DOF/CoC in post.
- **CPU vs GPU:** head and bridge selection (kd-tree, a few hundred items) on CPU once; everything per-step on GPU.
- **Hooks:** real: `LifeKnobs.fungusRate/fungusWander/fungus` pigment (`Knobs.swift:188-189`), existing hypha tips in `slimeMove` (no branching per doc 42 §1), `spawnAgents`, `setFoodInit`, `LifeKnobs.leak`. Proposed (doc 42 §2.3): H1 `lifeExtensions` (our `hyphaTipStep` with branching lives in `PaintSim+Agents.swift`, "hyphae v2"), H5 render slot, H6 `MicroscopePass`, H7 `LivingTypeKnobs` with `legibility`, `qEnd`, `heads`, `anastomoses`, `tracking`.
- **Portable as-is:** the tip rule and constants. **Rewrite:** the "simulate then replay by quantile" structure (live engine must steer growth in time instead, e.g. by the Director, doc 42 §6.6), PIL line drawing → GPU deposit.

## 9. Known gaps & next refinement
- Turning uses `h + 0.25·(bh − h)` without angle wrapping; fine because candidates are within ±0.5 rad of h, but a port should keep it local.
- `tips[i,4] += 0.0` is a no-op (gen only changes on branching).
- Branch angle is fixed-ish; turn quality is smooth (B2 anchor adds kinks from Python by editing `tips[:,2]` between chunks without editing the kernel).
- Captions on these older clips print `time-lapse t = … h` computed from `hours`: these are invented clock numbers and break the later "time-lapse only" rule.
- 'network' (Rubik 800) is written but was never rendered or logged as used; Rubik.ttf exists in the font folder. As written, `mycelium_network.py:rack` passes a scalar `tilt` to `coc.coc_map`, but glab's `tilted_coc` indexes `tilt[0]`, `tilt[1]`, so it would raise a TypeError on the first frame; it needs `tilt=(value, 0.0)` as in `planarian_clip.py`.
- Render is the bottleneck (CPU line drawing), master files are big (34–64 MiB).
- Conidiophores are stamped geometry, not grown by the sim.

## 10. Files & clips
Folder `visuals/maker/species/mycelium-spore-heads/`:
- Code: `mycelium.py` (kernel `grow`, `build`, stills `render`, `conidiophores`), `myc_motion.py` (`CFG`, `tracked_word_mask`, `leg_at`, `build_knob`, `setup`, `frame`, `run`), `mycelium_clip.py` (8 s spore clip, own copy of the frame logic), `mycelium_clip_15s.py`, `mycelium_words.py` (kerning, ligature), `mycelium_ligature_knob.py`, `mycelium_network.py` (unrendered).
- Fonts (`visuals/fontcast/fonts/`): `Gluten.ttf`, `PixelifySans.ttf`, `Kablammo.ttf`, (`Rubik.ttf` for network).
- Clips (MiB): `mycelium-spore-clip.mp4` 34.2 / `-m` 1.7; `mycelium-spore-clip-15s.mp4` 63.9 / `-m` 3.2; `mycelium-kerning-clip.mp4` 38.0 / `-m` 1.9; `mycelium-ligature-clip.mp4` 37.6 / `-m` 1.9; `mycelium-ligature-legibility-clip.mp4` 37.0 / `-m` 1.9. No web encodes in this folder.
- Stills: `mycelium-1-forming.png`, `mycelium-2-formed.png`, `mycelium-kerning-still.png`, `mycelium-ligature-still.png`, `mycelium-ligature-legibility-{1.0,0.5,0.0}.png`.
- Derived systems: `widow.md` (V5), [`contrast.md`](systems/maker/contrast.md) (V7), [`strike.md`](systems/maker/strike.md) (B1), [`anchor.md`](systems/maker/anchor.md) (B2), [`venation.md`](systems/maker/venation.md) (B3), [`patina.md`](systems/maker/patina.md) (C1).
