# Darkfield HUDDI, three tiers (`darkfield-huddi`)

> Oblique-ring darkfield scatter rendered in HUDDI colours (black field, cream/ink scatter, green accent only on tips and nuclei), in cheap / mid / full tiers. Clips: `visuals/glab/darkfield-huddi-full`, `darkfield-tiers-sbs`, `darkfield-focus-rack`, `darkfield-physarum`, `looks/batch-c6-nucleus` (cell pass). Source: `visuals/glab/src/darkfield_huddi.py` (`darkfield`, `tilted_coc`, `defocus`, `ring_kernel`, `scene`); drivers `darkfield_video.py`, `darkfield_physarum.py`, `darkfield_clips.py`.

## 1. What it is
The house look. A hollow cone of light misses the objective, so only edges, granules and dust scatter into the image: bright rims on black. This is the numpy reference for the internal perf notes (model §2.7.2, Metal sketch §2.7.3, tiers §2.7.4). It is also the base pass of the C6 nucleus hero.

## 2. How it works
- **State:** none. Each frame is a pure function of the scene `s = {Z, accent, gran, dust, focus, tilt, maxr}` plus `seed` (grain).
- **Update step (`darkfield(s, tier, seed=5, ring_dirs=8, ring_bias=0.35, ring_angle=-0.6)`):**
  1. `φ = 2.4·Z`; scales `[1.0, 2.5]` (full) else `[1.0]`. Each scale is blurred `G_σ`, then central-difference gradient (gx, gy).
  2. Ring scatter:
     - **cheap:** closed form, `E = |∇φ|²·(1 + 0.5·b) + b·max(0, ∇φ·d̂₀)²`;
     - **mid:** K = 4 directions;
     - **full:** K = `ring_dirs`. With `θ_k = θ₀ + 2πk/K`, `E += Σ_k (1 + b·cos(θ_k − θ₀))·max(0, ∇φ·d̂_k)²·4/K`.
     - Then `E ×= 14/len(scales)`.
  3. Saturation `I = E/(E + 0.9)`.
  4. Ridge (mid/full) `+1.4·max(0, −∇²G₁.₂φ)`; granules `+0.35·gran`; faint bulk `+0.01·Z`; full adds `+0.6·dust` and a forward-scatter skirt `+0.25·G₃∗I`.
  5. Accent alpha `A = accent·(0.6 + 0.4·[I > 0.05])`.
  6. Defocus with the CoC from `tilted_coc(s, focus, tilt, maxr)`:
     - **cheap:** Gaussian, 5 levels, half res;
     - **mid:** ring, 6 levels;
     - **full:** ring, 8 levels (`inner = 0.62`).
  7. Bloom `B = max(I − 0.55, 0)`: `I += 0.35·G₆B` (+ `0.25·G₁₈B` full).
  8. `L = (1 − e^{−1.6I})·STOP` with STOP from `field_stop` (r over 0.56·W).
  9. Grain `L += Poisson(L·P)/P − L + N(0, 0.006)` with P = 220 (cheap 160), RNG `seed`.
  10. HUDDI mix: `rgb = BG + (INK − BG)·L`, then `rgb·(1 − a) + ACC·a` with `a = A·(0.5 + 0.5L)`; sRGB.
- **Randomness/seeds:** grain only (`seed`; video drivers use `seed = 1000 + i` or `100 + i`). `static.npz` from `rng(7)`.
- **Lifecycle:** n/a (look, not a sim). The clips' lifecycle comes from the source (creatures video, physarum video, nucleus sim).

## 3. Glyph coupling (GlyphSource)
None directly; reads Z/accent only. **Today's derivations for its sources:**
- **creatures:** `Z = (clip((G₀.₉ luma − 0.17)/0.6))^0.9·1.1`, EMA 0.55; accent from the orange swimmers;
- **physarum video:** density = `clip((g − b − 0.20)/0.60)`, `Z = G₀.₉(D)^0.9·1.1`; tips = fast−slow EMA band-pass gated by low long-term density; nucleus = `clip((G₁₀D − 0.72)·6)`.

Swapping the font or using a PencilKit/SVG glyph changes only the upstream sim.

## 4. Controls & parameters
| Param | Type / range | Default | Unit | What it does | Exposed to jig? |
|---|---|---|---|---|---|
| ★ `tier` | cheap / mid / full | full | – | feature set (§7) | proposed (device-picked) |
| ★ `ring_bias` b | 0..0.5 | 0.35 | – | decentred condenser → one rim side brighter | proposed `ringBias` (new) |
| `ring_angle` θ₀ | rad | −0.6 | rad | bright-rim direction | proposed `ringAngle` (new) |
| `ring_dirs` K | 4..24 | 8 | – | full-tier directions | `MicroscopeKnobs.darkK` (doc 42 §7.3) |
| κ (φ gain) | 1..4 | 2.4 | – | how strongly thickness scatters | proposed `scatterK` (new) = the internal perf notes `DFParams.kappa` |
| saturation c | 0.5..2 | 0.9 | – | `E/(E + c)` knee | `DFParams.c` |
| ridge gain | 0..2 | 1.4 | – | thin-strand glow | `DFParams.sr` |
| gran / dust gain | 0..1 | 0.35 / 0.6 | – | granule sparkle / dust motes | `DFParams.sg` / `dust` |
| ★ `focus`, ★ `tilt`, ★ `maxr` | see [`focus.md`](systems/glab/focus.md) | 0.42, (0.55, 0), 14 | – | focal band | `zFocal`, `cocScale` |
| bloom | 0.35·G₆ (+0.25·G₁₈) thr 0.55 | – | – | glow | `bloom` |
| tone k | 1.6 | – | – | exposure | proposed `exposure` |
| photons | 220 (cheap 160) | – | – | grain | `grainAmt` |

Legibility: no direct mapping.

## 5. Timeline / arc
Stateless. `darkfield-focus-rack` sweeps focus with `rack_params`: `focus = 0.10 + 0.80w`, `tilt = 0.55 − 0.85w`, `maxr 18`, w = eased there-and-back. C6 animates focus, tilt and maxr with the mitosis phases ([`nucleus.md`](systems/glab/nucleus.md)).

## 6. Camera & optics
Fixed 1080² frame; field stop 0.56N; HUDDI palette; ring bokeh (annulus, inner 0.62) on mid/full; Gaussian on cheap.

## 7. Performance & tiers
| Tier | Features (as coded) | Device mapping (the internal perf notes) |
|---|---|---|
| cheap | closed-form iso + one direction, 1 scale, no ridge, no dust, no skirt, Gaussian DOF at ½ res, 1 bloom level, photons 160 | A12-class at 60; A16 at 120 Hz |
| mid | K = 4, 1 scale, ridge, ring DOF 6 levels, 1 bloom level | A16 at 60; M5 at 120 Hz |
| full | K = 8, 2 scales, ridge, dust, skirt, ring DOF 8 levels, 2 bloom levels | M5 at 60 |

Per-device ms: see the internal perf notes (internal; not repeated). Box CPU ≈1.7 s/frame (full, 1080²).

## 8. Port to macOS Swift/Metal
The internal perf notes already sketches it. Names to keep:
- **`dfScatter`:** compute, full res. Function constants `DF_K` ∈ {0, 4, 8} and `DF_FULL`; `struct DFParams { kappa, ringDir, ringBias, dirs, ringW, se, c, sr, sg, sv, tau }`. In: `Z r16Float`, `accent r8Unorm` (or packed `rg16Float`), `gran r8Unorm`, `dust r8Unorm`. Out: `rg16Float` (I, A).
- **`dfCoC+Down`:** ½ res, writes `rgba16Float` (I, A, CoC, –).
- **`dfRing`:** 12-tap (mid) / 24-tap with near/far split (full) annulus gather; cheap uses a 3-level mip lerp.
- **`dfBloom`:** threshold + mips (MPS Gaussian).
- **`dfTone`:** tone + STOP + `hash21(pixel, tick)` grain + HUDDI mix + sRGB.

**Hooks:** H6 `postPasses: [PostPass]` (as the `MicroscopePass` mode `darkfield`), knobs under H7 (`MicroscopeKnobs.darkK` etc.). Hooks are proposed (doc 42 §2.3) and not found in the local checkout `ea48744`.

**Portable as-is:** all equations. **Rewrite:** the FFT ring convolution becomes a gather; NumPy Poisson becomes hash-based Poisson/Gaussian approximation.

## 9. Known gaps & next refinement
- CoC uses screen-y, not Z (see [`focus.md`](systems/glab/focus.md)).
- K on full is 8; the internal perf notes allows 24 (cost per §2.7.4).
- The skirt is a blur of I, not true forward scatter.
- A real Metal benchmark doesn't exist (the planned `jobs/perf/06-darkfield-optics-tiers.yaml` hasn't run; results UNKNOWN).

## 10. Files & clips
`visuals/glab/src/darkfield_huddi.py`, `darkfield_video.py`, `darkfield_physarum.py`, `darkfield_clips.py`. Clips `visuals/glab/darkfield-*.mp4` (+`-m`, poster, contact). Bench job `jobs/perf/06-darkfield-optics-tiers.yaml`. The internal perf notes
