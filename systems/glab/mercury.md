# Mercury: chrome droplets pool into the word (`mercury`)

> ~46 liquid-metal beads roll in on curved paths, merge into a counter-preserving pool shaped like the word, ripple and wobble, then the thin parts bead up again at the end. Mirror Fresnel against a procedural studio. Clip: `goo-g6-mercury` ("mercury", Comfortaa wght 700). Source: `visuals/glab/src/goo.py` (`CFG.g6`, `setup_merc`, `studio_env`, `frame_merc`).

## 1. What it is
Surface-tension liquid metal: beads, pooling, capillary rings and dewetting. Chrome reads only by what it reflects, so the look *is* the environment map. There's no fluid sim; it's a height field from a distance transform plus analytic ripples.

## 2. How it works
**State (`setup_merc`, rng 31):**
- `g` = glyph at `width_frac 0.80`, **fattened 9.5 px outside but only 3 px into counters**.
- `cin` = soft interior of the counters (kept open).
- 46 beads (`nb = 46`):
  - `home` on the mask;
  - `start` on an ellipse at radius 220–520 px;
  - `arrive ∈ U(0.16, 0.37)` u, `r ∈ U(9, 26)`, `curl ~ N(0, 0.6)`.
- `rho = G₄(g)`; 36 specks.

**Per frame** (`frame_merc`, half-res field):
1. **Beads** follow a quadratic Bézier start → curled mid → home with eased `e = sm(u/arrive)`. Unarrived beads add `1.25·exp(−d²/2(0.72r)²)`.
2. **Pool:**
   - `form = sm((u − 0.12)/0.26)` adds `1.9·rho`, warped by a wobble noise.
   - Dewetting `tail = sm((u − 0.80)/0.20)` subtracts `0.55·noise`, so thin parts bead.
   - Counter mask `×(1 − 0.95·cin)`.
3. **Surface:**
   - `merc = clip((F − 0.5)/0.04)`.
   - Domed height `H = 1.3·Rm·√(1 − (1 − d/Rm)²)` from the EDT, `Rm = 26`.
   - Capillary rings per arrival: `2.2·sin(0.11(r − 140dt))·env·e^{−1.1dt}` for 3 s.
   - Global ripple `0.8(1 − 0.6L)·sin·sin`. Ring amplitude ×(1 − 0.5L).
4. **Shading:**
   - Reflect the view vector.
   - `studio_env(rx, ry, rz)`: overhead softbox, an overhead zenith panel, right/left vertical strip lights at grazing elevation, a thin top strip, a dim warm floor; black elsewhere.
   - Fresnel `F0 = 0.72` (Schlick).
   - Anisotropic key streak `2.2·exp(−((nx − 0.32)/0.22)² − ((ny + 0.36)/0.035)²)`.
   - Slight cool tint `(0.96, 0.985, 1.03)`; contact AO `1 − 0.6·(G₁₂(merc) − merc)`.
5. **Post:** `tilted_coc(0.50 + 0.02·sin(2π·0.6u), 0.28, maxr 13)`, 7-level ring defocus, bloom `0.25·G₇` above 0.8, tone `BG + 1 − e^{−1.3·1.45·C}`, grain (450, 0.004).

**Lifecycle:** spawn (beads in flight 0–37 %) → lock-on (pool fills from 12 %, full ≈ 38 %) → hold → decay: dewetting beads the thin parts from 80 %.

## 3. Glyph coupling (GlyphSource)
| Product | Used? | How |
|---|---|---|
| mask | **yes** | pool density and bead homes |
| sdf | yes (EDT) | outward fattening (9.5 px), surface dome from the interior EDT |
| counters | **yes** | `binary_fill_holes(m) & ~m`: fattening limited to 3 px inside, `cin` keeps them open |
| others | no | – |

**Replaced font / stroke / SVG:** fine for any mask. Counters come from hole-filling, so open shapes (C, hand-drawn hooks) have none and fill normally. Use GlyphSource `counters` and `gaps` when ported.

## 4. Controls & parameters
| Param | Type / range | Default | Unit | What it does | Exposed to jig? |
|---|---|---|---|---|---|
| ★ bead count | int | 46 | – | how much metal arrives | proposed |
| ★ arrival window | u | 0.16–0.37 | u | when the beads land | proposed `arriveIn/Out` |
| ★ dewet start | u | 0.80 (+0.20) | u | late beading | proposed (≈ leak) |
| fatten out / in counters | px | 9.5 / 3.0 | px | stroke growth vs open counters | proposed |
| `Rm` | px | 26 | px | surface-tension dome radius | proposed `domeRadius` |
| ripple speed / decay | px/s, 1/s | 140, 1.1 | – | capillary rings | proposed |
| `F0` | 0..1 | 0.72 | – | metal Fresnel base | internal |
| ★ studio env | lights | see `studio_env` | – | what the chrome reflects | proposed preset |
| DOF | 0.50 / 0.28 / 13 | – | – | [`optics.md`](systems/glab/optics.md) | `zFocal`, `cocScale` |

**Legibility:** L only scales the ripples (`1 − 0.5L`, `1 − 0.6L`). Form and dewet are hard-coded u windows. Proposed: dewet amount ∝ (1 − L).

## 5. Timeline / arc
Keyframed u windows over 8 s; ripples keyed off each bead's arrival time.

## 6. Camera & optics
Fixed camera, real-ish chrome on black, tilted ring CoC with the plane nudged down so the 'y' tail is sharper (code comment).

## 7. Performance & tiers
- **Box CPU:** **UNKNOWN** (not logged).
- **GPU [est]:** mid. Droplet field sum + domed normals + analytic env + ripple sum + ring bokeh. Ray-traced liquid metal with inter-reflections would be high (README).
- **Tiers [est]:** M5 full; A16 half-res height + 5-level DOF; A12 quarter-res height, ripples capped to the 8 most recent beads, mip DOF.

## 8. Port to macOS Swift/Metal
**Buffers:** `mcBeads` (float4 start/home + float4 r/arrive/curl); the env is analytic (no texture), or a baked `rgba16Float` lat-long [proposed].

**Kernels / passes:**
1. `mcField` (½ res).
2. `mcHeight`: EDT dome via the JFA SDF of the thresholded field, per frame. This is the only expensive step; a cheap alternative is `H = smoothstep` of the field [est].
3. `mcShade`.
4. Shared focus/bloom/tone.

**Hooks:** **H6** `PostPass` or **H5** slot; **H7** knobs (proposed `beads, arriveIn, dewet, domeRadius`). Proposed hooks (doc 42 §2.3), not in checkout.

**Portable:** all closed-form. **Rewrite:** the per-frame `distance_transform_edt` → JFA (GlyphSource SDF kernels, `glyph-source.md` §4).

## 9. Known gaps & next refinement
- A dark-grey band on steep edges. Hypothesis (not checked): grazing reflections hit the black studio floor. Add a low horizon strip or clamp the reflected ray (INVENTORY §4).
- Beads don't interact before arrival.
- No inter-reflections.
- CPU timing not logged.

## 10. Files & clips
`visuals/glab/src/goo.py` (`g6`); clip `visuals/glab/looks/goo-g6-mercury*`. Refs: INVENTORY §4, [`optics.md`](systems/glab/optics.md).
