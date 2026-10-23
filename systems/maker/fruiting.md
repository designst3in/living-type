# Dictyostelium slime-mould fruiting (`fruiting`)

> Starving amoebae relay cAMP, stream into the letters, mound up and culminate into stalked sori along the strokes. Clips: `fruit` (Grandstander wght 800). Source: `visuals/maker/species/slime-mould-fruiting/fruiting.py`, `fruiting_clip.py`

Paths are relative to the living-type project root.

## 1. What it is
Cellular slime mould *Dictyostelium discoideum*: cells chemotax up a relayed cAMP gradient, line up head-to-tail into branching streams that converge on aggregation centres (here: the glyph, a patch of moist agar the cells favour), mound, then rise into sorocarps (thin cellulose stalk + round sorus). Look: darkfield HUDDI macro, shallow DOF, oblique view of the forest.

## 2. How it works
- **State** (`fruiting_clip.py:simulate`): `ag: float32[N_AG=36000, 4]` = `x, y, heading, stuck` (stills use 70 000 in `fruiting.py:build`); `camp: float32[S,S]`; `attract = norm(0.6·G₄₀(mask) + 0.4·G₁₀(mask))`. Snapshots of `ag[:, :3]` per frame between `T_SIM0 = 1.2 s` and `T_SIM1 = 6.0 s` are cached in `/tmp/fruit_clip_sim.npz` with `sd`, `mask`, per-letter centres and sorocarp sites.
- **Update step** (`fruiting.py:chemotax(ag, camp, attract, sd, steps, seed)`, numba), per step:
  1. Every agent deposits `camp[y,x] += 1` (relay), including stuck ones.
  2. Non-stuck: sense 3 headings `h + {−0.6, 0, 0.6}` at 7 px: `v = 0.06·camp + 6.0·attract`; `h ← h + 0.5·(h_best − h) + N(0, 0.25)`.
  3. Speed `1.3` outside the glyph (`sd > 0`), `0.5` inside ("slower in the mound"); clamp to frame.
  4. If `sd < −2`, stick with p = 0.02 per step.
  5. Field: `camp ← 0.92·(0.5·camp + 0.125·Σ₄ neighbours)` (diffuse + 8 % decay per step).
  - Clip: 260 total steps spread over the frames f0..f1 (`SIM_STEPS`).
- **Frame layer** (`fruiting_clip.py:frame`): before f0 cells crawl `±3 px` sinusoidally; cAMP waves are **drawn, not simulated**: `phase = 2π(r/95 − t/0.75) + warm·θ` around each letter's nearest centre (`r`, `θ`), alternate letters spiral (1-armed) vs target (concentric); `band = clip((cos phase − 0.55)/0.45, 0, 1)` makes cells elongate (`el = 1 + 1.2·band + 0.8·smoothstep(1.3, 2.5, t)`) and brighten. Stragglers outside letters (sd > 4) fade from 4.6–6.4 s. Mounds = `smoothstep(0.25, 0.7, G₃(cells))`.
- **Culmination** (t > 6 s): sorocarp sites = Poisson-disk (27 px) on the skeleton; each has start `6.2 + 1.6·U`, height 22–30, sorus r 6–8.4, bend N(0, 0.06); progress over 1.3 s: finger (Mexican hat, first 30 %) → stalk along view tilt `(0.22, −1)` → sorus sphere (shaded disk, rim scatter, specular ^24).
- **Randomness / seeds:** `default_rng(41)` agents, `9` sorocarps, numba seeds `1000 + f`, grain `3000 + i`.
- **Lifecycle:** spawn (uniform scatter) → seek (cAMP + attract) → lock-on (stick inside sd < −2) → hold (mound) → culminate (keyframed); no decay.

## 3. Glyph coupling (GlyphSource)
`mask` (attract blur), `sdf` (speed switch, sticking, straggler fade), per-letter masks (aggregation centre = argmin of each letter's SDF), `skeleton` (`labkit.skeleton`, sorocarp sites along strokes). No direction field, no counters, no legibility module (predates it). Any coverage raster works; centres need per-letter ids.

## 4. Controls & parameters
| Param | Type / range | Default | Unit | What it does | Exposed to jig? |
|---|---|---|---|---|---|
| **`N_AG`** (hero knob) | int | 36000 clip / 70000 stills | cells | crowd density | real `spawnAgents` kind 1 analogue |
| **attract weight** (hero knob) | float | 6.0 (vs cAMP 0.06) | – | glyph pull vs self-relay | real `LifeKnobs.slimeFood` (4.0) analogue |
| **`SIM_STEPS`** (hero knob) | int | 260 | steps | how far aggregation goes | – |
| stick prob / depth | float | 0.02 at sd < −2 | per step / px | how fast cells lock into letters | – |
| sensor | 7 px, ±0.6 rad, turn 0.5, noise 0.25 | – | px / rad | chemotaxis | real `slimeSensor` 9, `slimeAngle` 0.5, `slimeTurn` 0.35 |
| speed | 1.3 out / 0.5 in | – | px/step | – | real `slimeSpeed` 1.2 |
| cAMP decay | 0.92 + 4-neighbour diffuse 0.5 | – | per step | field memory | real `slimeDecay` 0.94, `slimeDiffuse` 0.25 |
| **sorocarp spacing** (hero knob) | px | 27 (clip), 17 (stills, whole letter) | px | how many fruiting bodies (legibility) | proposed |
| wave λ / period | 95 px / 0.75 s | – | – | drawn cAMP bands | – |
| legibility | – | not in code | – | – | – |

## 5. Timeline / arc
9 s. 0–1 vegetative; 0.9–6.4 waves; 1.2–6.0 simulated streaming (replayed snapshots); 5.0–6.6 mounds; 6.2–9 culmination; keyframed except the agent motion.

## 6. Camera & optics
Darkfield HUDDI (`labkit.huddi_finish`, glow (0.35, 0.16)); cells as edge-lit ink, mound cream; macro DOF planes `|y − 0.50|·3` (cells) and `|y − 0.47|·11 − 0.15` (sori, very shallow). Scale bar 1 mm.

## 7. Performance & tiers
Box: chemotaxis is the costly bit (a full-frame Python-loop-in-numba diffuse each step): ~minutes for 260 steps; frames draw 36k polygons each (~several s/frame). [est] M5 real time (Jones-style agents are what `slimeMove` already does); A16 18k cells; A12 8k cells, no wave modulation.

## 8. Port to macOS Swift/Metal
- Buffers: agents `SIMD4<Float>` (x, y, h, stuck) = existing agent layout; `camp` = existing slime trail textures.
- Kernels: this is nearly the existing `slimeMove` (Jones 3-sensor, `PaintSim+Life.swift:292`) with trail = cAMP and food = attract: add a "stick" flag and an inside-speed. Wave bands: a cheap fragment term from per-letter centres. Sorocarps: instanced sprite pass from a CPU-picked site list.
- CPU: Poisson sites, centres (once per text). GPU: agents, field, render.
- Hooks: real `LifeKnobs.slimeSensor/Angle/Turn/Speed/Decay/Diffuse/Food`, `spawnAgents` (kind 1), `setFoodInit` (attract). Proposed: H1 extension for the stick + culmination stage, H5 sorocarp slot, H7 `LivingTypeKnobs` (sorocarpSpacing, legibility).

## 9. Known gaps & next refinement
- cAMP spiral/target waves are a drawn overlay, not an excitable-medium sim (FitzHugh–Nagumo would be the real thing).
- No legibility knob (built before the module).
- Caption shows invented `t = … h` clock (pre-rule).
- Stalks are drawn; slugs are only faint trails in the stills.

## 10. Files & clips
- `visuals/maker/species/slime-mould-fruiting/fruiting.py`, `fruiting_clip.py`
- Font: `visuals/fontcast/fonts/Grandstander.ttf`
- Clip: `fruiting-fruit-clip.mp4` 11.5 MiB / `-m` 2.4 MiB (no web encode made, master just over 10 MiB). Stills `fruiting-1-forming.png`, `fruiting-2-formed.png`.
