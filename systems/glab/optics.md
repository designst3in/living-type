# Microscope optics: every look + the shared CoC focus post-stack (`optics`)

> The single reference for all glab looks (darkfield HUDDI, Rheinberg, DIC, phase, fluorescence, polarised, and the real-ish material renderers) and the focus/CoC stage they all share. Clips: every `visuals/glab/looks/*.mp4`. Source: `visuals/glab/src/darkfield_huddi.py` (`darkfield`, `tilted_coc`, `ring_kernel`, `defocus`), `visuals/glab/src/looks.py` (`look_*`, `ring_defocus`, `coc*`, `track_plane`, `grain`, `accent_mix`, `STOP`, `label`). Per-look detail docs: [`darkfield-huddi.md`](systems/glab/darkfield-huddi.md), [`rheinberg.md`](systems/glab/rheinberg.md), [`dic.md`](systems/glab/dic.md), [`phase.md`](systems/glab/phase.md), [`fluorescence.md`](systems/glab/fluorescence.md), [`polarised.md`](systems/glab/polarised.md), [`focus.md`](systems/glab/focus.md).

## 1. What it is
The sims (physarum-word, diatoms, bacteria, tendril, synapse, nucleus, …) produce **fields**, not pictures. The optics stage turns those fields into a microscope photograph. There are two halves:
1. **Look (contrast mechanism).** A per-pixel model of one microscope modality, mapping the sim fields to light: darkfield scatter, Rheinberg two-colour scatter, DIC relief, phase halo, epifluorescence emission, crossed-polar interference colour.
2. **Shared post-stack (camera).** The same stage for every look: tilted focal plane → CoC map → ring-blur (annular) defocus → bloom → tone → field stop/vignette → sensor grain → HUDDI accent mix → sRGB → label strip.

House palette (HUDDI, the internal perf notes): bg `#0d0d0d`, ink `#e8e8e8`, accent green `#33ff66` (only on nuclei, tips, pulse fronts and live cells), cream `#f5e6a8`. Looks with non-HUDDI colour (Rheinberg, polarised, goo) are labelled "real-ish colour" on frame.

## 2. How it works

### 2.1 The field contract (what every sim hands to optics)
Per frame, at render res N×N (N = 1080 in every clip):

| Field | Python name | Range | Meaning | Proposed Metal format |
|---|---|---|---|---|
| Thickness / optical path | `Z` | 0..~1.2 | sim density, sprite height or cell dome; φ = κ·Z | `r16Float` |
| Accent | `A` / `accent` | 0..1 | nuclei, growth tips, pulse front, kinetochores (green only here) | `r8Unorm`, or packed with Z as `rg16Float` (the internal perf notes) |
| Granules | `gran` | 0..~6 | point scatterers inside bodies; `gran*body + drifting float_g*(1-body)` (`frame_inputs`) | `r8Unorm` (static texture + drift offset) |
| Dust | `dust` | 0..~14 | static motes, shown out of focus (ring bokeh) | `r8Unorm`, static, scrolls with stage drift |
| Body | `body` | 0..1 | `clip(2.5·Z, 0, 1)`, a soft "inside a body" mask | derived in-shader |
| Track | `track.npy` (9 cols per frame) | px | front mass, tip centroid, nucleus centroid + mass, front peak x,y, peak value | small CPU/GPU buffer, `float4×3` per frame |
| Mask | `mask.png` | 0/1 | glyph coverage (only `spec_coc` reads it, for the centre line) | from GlyphField (doc 42 §6.1) |

`static.npz` is seeded (`rng 7`): `gran = G0.8(rand<0.0011)·6`, `float_g = G1.0(rand<0.00007)·7`, `dust = G1.2(rand<0.0001)·14`.

### 2.2 Look stage (per-pixel, linear light)
All looks start from a phase-like field `φ = a·Z + b·gran (+ c·dust)`, pre-blurred by σ ≈ 0.7–1.0 px, then gradients `(gx, gy)` by central differences.

| Look | Function | Core equation (as coded) | Output channels into the DOF |
|---|---|---|---|
| **Darkfield HUDDI** | `dh.darkfield(s, tier)` | φ=2.4Z; `E = Σ_k w_k·max(0, g·d̂_k)²·4/K`, `w_k = 1 + b·cos(θ_k − θ₀)`; ×14/n_scales; `I = E/(E+0.9)` + 1.4·max(0,−∇²G₁.₂φ) + 0.35·gran + 0.01·Z (+0.6·dust, +0.25·G₃∗I full) | I, A (2) |
| **Rheinberg** | `look_rheinberg` | φ=2.4Z+0.35gran; K=8 directions split by `sin(θ_k−0.4) ≥ 0` into Ec (colour c1) and Er (c2); `I = 6E/(6E+1)`; ridge 1.2·max(0,−∇²G₀.₈φ) (×0.6 to c1, ×0.4 to c2); +dust; stop colour × `0.36·exp(−1.4·G₃Z)` × (1 − 0.85·cover) | Ic, Ir, A (3) |
| **DIC** | `look_dic` | opd = G₀.₉(2.2Z+0.45gran+0.25dust); `dS = ∂opd/∂s` along −45°; `I = sin²(0.42 + 2.6·dS)/sin²(0.42)·0.075·e^{−0.12Z}` | I, A (2) |
| **Phase** | `look_phase(gain)` | φ = G₀.₈(2.2Z+0.5gran+0.3dust); `I = 0.055 − 0.042·gain·(φ − AIRY∗φ)`, AIRY = obscured Airy (R 0.022, W 0.009, β 0.55, 181 px) | I, A (2) |
| **Fluorescence** | `look_fluor(cg, expo, gg, fill, knock)` | memb = 2|∇G₀.₈Z| + 2.4·max(0,−∇²G₁Z) + 0.02Z; `Ic = memb·cg/(memb·cg+1.1) + fill·Z`; `Ig = clip(1.3A + gg·gran·body, 0, 1.5)` | Ic, Ig (2) |
| **Polarised** | `look_polar(gscale)` | θ from the structure tensor of G₁.₂Z (σ 3); Γ = (620Z + 900|∇²G₂Z| + 120·gran·body)·gscale nm; `ext = sin²(2(θ−p))·clip(6Z)`; colour = Michel-Lévy LUT[Γ]·ext | R, G, B, A (4) |
| **Material (goo/bleed/crystal)** | per-script | shaded RGB (refraction, SSS, Fresnel env, Beer–Lambert, crossed-polar ice), see their docs | R, G, B (3) |

### 2.3 Shared post-stack (order as coded)
1. **CoC map** (`dh.tilted_coc`): `plane(x,y) = focus + tilt₀·(x/W − 0.5) + tilt₁·(y/H − 0.5)`; `CoC = clip(|y/H − plane| · maxr · 2.6 · W/1600, 0, maxr·W/1600)` px. **Depth is screen-y distance from a tilted line, not per-pixel Z** (a Scheimpflug band). The focus *target* comes from one of four drivers (§6, [`focus.md`](systems/glab/focus.md)).
2. **Ring-blur defocus** (`LK.ring_defocus(chans, coc, inner, levels)`): `levels` (default 8) radii `r_j = linspace(0, max CoC)`. Each channel is FFT-convolved with an annulus `ring_kernel(r, inner)`: `k = clip(r + 0.5 − d) · clip(d − inner·r + 0.5)`, normalised. Each pixel lerps between the two bracketing levels. `inner` = 0.62 everywhere except DIC (0.45: wide, fuller aperture). The accent channel is defocused with the same CoC. Cheap tier (`dh.defocus(mode="gauss")`): 5 Gaussian levels σ = r/2 at half resolution.
3. **Bloom:** `B = max(C − t, 0)`, then `C += k·G_σ∗B` (darkfield t 0.55, 0.35·G₆ + 0.25·G₁₈ on full; Rheinberg t 0.5, 0.3·G₆; fluorescence t 0.6, 0.25·G₅; goo 0.22–0.3·G₆–₈; DIC/phase/polar: none).
4. **Tone:** `L = 1 − exp(−k·I)` (darkfield 1.6, Rheinberg 1.5, DIC 2.4, phase 2.6, fluor 1.5·expo, polar 1.6, goo 1.3–1.4).
5. **Field stop + vignette** (`STOP`): `r = hypot(x−N/2, y−N/2)/(0.56N)`; `stop = clip((1−r)/0.05, 0, 1)·(1 − 0.35r²)`. DIC/phase apply it softened (`0.25 + 0.75·STOP`, `0.3 + 0.7·STOP`); goo/bleed: none or ×(0.88 + 0.12·STOP).
6. **Sensor grain after tone** (`LK.grain(C, i, photons, read)`): luma Y; `n = Poisson(Y·photons)/photons − Y + N(0, read)` added to all channels; seed `3000 + i`. Darkfield: Poisson(220)/220 + N(0, 0.006) on L (cheap 160).
7. **Accent mix** (`accent_mix`, after grain): `a = clip(1.3·A·(0.55 + 1.2L))`; `C = C(1−a) + ACC·a·(0.5 + 0.8L) + 0.25·C·a`.
8. **sRGB encode** (`dh.srgb`), then the **label strip** (`LK.label`): 46 px band of `#0d0d0d` at α 220, Jost 24 left (look + tier), Jost 19 right (word · font).

## 3. Glyph coupling (GlyphSource)
The optics stage itself reads **no glyph product**, with one exception: `spec_coc` reads `mask` to put the focal line through the word's vertical centre (`(ymin+ymax)/2`). Everything glyph-related reaches optics indirectly through Z/A. With a replaced font, a hand-drawn PencilKit stroke or an SVG path, optics needs no change. For a Metal port, `spec_coc` should read the glyph bbox from GlyphField (doc 42 §6.1) instead of a PNG.

## 4. Controls & parameters
**Hero knobs** are marked ★.

| Param | Type / range | Default | Unit | What it does | Exposed to jig? |
|---|---|---|---|---|---|
| ★ `look` | enum darkfield / rheinberg / dic / phase / fluor / polar / material | per clip | – | contrast mechanism | proposed `MicroscopeKnobs.mode` (doc 42 §7.3) |
| ★ `tier` | cheap / mid / full | full (toy) | – | darkfield K, scales, Airy, dust, DOF kind, bloom levels | proposed, set per device |
| ★ `focus` | 0..1 | 0.42 (`tilted_coc`); rack 0.10→0.90 | frame height | focal line height at x = W/2 | `zFocal` (doc 42 §7.3) |
| ★ `tilt` (tilt₀, tilt₁) | −1..1 | (0.55, 0) toy; 0.22–0.30 clips; ×1.6 in C5 | – | Scheimpflug tilt of the sharp band | proposed `focusTilt` (new) |
| ★ `maxr` | 0..30 | 14 (toy), 18 (`rack`), 12 (`spec_coc`), 24 (C5) | px @1600 wide | max CoC radius = how shallow the DOF is | `cocScale` |
| `inner` | 0.3..0.8 | 0.62 (DIC 0.45) | ratio | annulus inner/outer, "ring" vs "disc" bokeh | proposed `bokehInner` (new) |
| `levels` | 4..8 | 8 (darkfield full), 6 (mid), 5–7 (looks) | – | CoC quantisation for the gather | internal |
| `ring_dirs` K | 1/4/8 | 8 | – | oblique-ring directions (darkfield, Rheinberg) | `darkK` (shape only) |
| ★ `ring_bias` b | 0..0.5 | 0.35 | – | decentred ring → directional rims | proposed `ringBias` (new) |
| `ring_angle` θ₀ | rad | −0.6 | rad | which rims glow most | proposed `ringAngle` (new) |
| `photons` | 100..900 | 220 | e⁻ scale | grain amount (lower = noisier) | `grainAmt` (inverse) |
| `read` | 0..0.01 | 0.006 | linear | read noise σ | `grainAmt` |
| bloom t, k, σ | see §2.3 | per look | – | glow of hot pixels | `bloom` |
| tone k | 1.3..2.6 | per look | – | exposure | proposed `exposure` (new) |
| stop radius | 0.56N, edge 0.05, vignette 0.35 | – | – | eyepiece field stop | `fieldStop`, `vignette` |
| palette | hex | HUDDI | sRGB | bg / ink / accent / cream | proposed palette swatches |

**Legibility:** optics never reads legibility directly. It enters through Z/A (the sims) and through the focus driver: `coc_track` pulls focus to the growth front during wander and growth, then to the seed nucleus (or the word) once the front fades. A legible hold therefore usually sits inside the sharp band.

## 5. Timeline / arc
Optics is a per-frame function, with no state beyond the focus driver:
- `rack(i, nf)`: eased there-and-back sweep, `focus = 0.10 + 0.80w`, `tilt = 0.55 − 0.85w` (looks 01–05).
- `coc_track`: smoothed growth-front target (σ = 0.9 s, slew-limited to 6 px/frame) (the "track" Rheinberg variants, look-06/07, C5).
- `spec_coc`: a fixed tilted plane through the word's centre line, tilt 0.26 + 0.06·sin(2πi/nf) (V8, B4, B6).
- **Fixed per clip:** goo (focus 0.46–0.50, tilt 0.22–0.28), crystal (0.46, 0.24, maxr 12), bleed (0.45, 0.22, maxr 7), nucleus (0.47 − 0.05·ana·sin t, tilt 0.22 + 0.06·sin(2πu), maxr 13 − 5·ana·(1−telo)).
- V8 also wipes between looks at u = 0.27 / 0.55 / 0.80 (half-width 0.045) behind a soft, 7°-tilted slider edge.

## 6. Camera & optics
Zoom is fixed: every clip is a 1080² square at 24 fps with no zoom. Focus drivers are described in §5 and [`focus.md`](systems/glab/focus.md). Palette swatches: HUDDI (above). Rheinberg pairs: default stop `#1c4a66` + cream/rose `#e8707e`; teal `#1f5c5a` + amber `#f2a43a`/`#c9741f`; HUDDI stop `#0d0d0d×2.2` + cream; tendril `#1d5a5e` + cream/`#b9e6cf`; C5 violet `#3d1166` + amber `#ffb547`/`#e0812e`.

## 7. Performance & tiers
**Box CPU (numpy, 1080², 1 core per worker):** a look frame takes ≈2 s (Rheinberg/fluor/polar/DIC) to ≈2.5 s (Rheinberg with tracking). The ring defocus (8 FFT convolutions per channel) dominates; `dh.darkfield` full is ≈1.7 s. These are measured from the clip logs in `visuals/glab/looks/README.md`.

**GPU tiers [est].** Darkfield's per-tier feature set and per-device ms are in **the internal perf notes** (not repeated here). The other looks are given relative to darkfield **mid** on the same device. These multipliers are my estimates, from the channel count through the DOF and the extra taps:

| Look | Cost vs darkfield mid [est] | Why | Cheap-tier substitute |
|---|---|---|---|
| Darkfield | 1.0× (mid); full and cheap per the internal perf notes | K=4 ring, ridge, 12-tap annulus | closed-form iso + 1 direction, mip DOF |
| Rheinberg | ≈1.2–1.3× | 3 channels through the DOF | closed-form two-colour split, mip DOF |
| DIC | ≈0.7× | 2-tap derivative, no bloom | same, mip DOF |
| Phase | ≈1.3× | obscured-Airy kernel fitted by 2–3 separable Gaussians at half res | single DoG halo |
| Fluorescence | ≈0.7× | arithmetic + one haze mip | same, mip DOF |
| Polarised | ≈1.0× | structure tensor (3 blurred products) + 1D LUT, 4-channel DOF | gradient θ instead of tensor, mip DOF |
| Material (goo) | ≈1.5–2.5× | refraction lookups, SSS blur, env/Fresnel, 3-channel DOF | drop SSS blur and caustics; 1-level bloom |

**Tier mapping** (qualitative, from the internal perf notes): M5 runs **full** at 60 fps and **mid** at the 120 Hz stretch; A16 runs **mid** at 60 and **cheap** at 120 Hz; the A12-class iPad runs **cheap** only (60 fps). Per tier, cut in this order: DOF kind (annulus 24 → 12 → mip) → bloom levels → ring K → second scale / Airy / dust → φ at half res.

## 8. Port to macOS Swift/Metal
**Placement:** a single `MicroscopePass` behind hook **H6** (`postPasses: [PostPass]` between render and resolve, doc 42 §2.3). It lives in `PaintCore/Microscope.swift` with shaders in their own raw string (doc 42 §2.3 rule 1; the internal perf notes places new shaders under `Sources/PaintCore/Shaders/`). Knobs are a `MicroscopeKnobs` struct under **H7** (`LifeKnobs.livingType: LivingTypeKnobs?`). **Status:** H1–H8 are *proposed* hooks (doc 42 §2.3). They aren't present in the local jig checkout (the local ink-jig checkout, `ea48744`); whether any have landed at `d37f560` is **UNKNOWN**.

**Inputs (from the life/body pass):** `optics` texture `rgba16Float` (Z, OD, φ, scatter; doc 42 §7.2), or the slimmer darkfield contract `Z r16Float` + `accent r8Unorm` (the internal perf notes). Plus `gran r8Unorm` and `dust r8Unorm` (static, drift offset in uniforms) and a `TrackBuf` (`float4×3`, focus target).

**Passes (function constants select the look and tier):**

| Pass | Kind / res | Reads → writes | Notes |
|---|---|---|---|
| `lkScatter` (darkfield = the internal perf notes `dfScatter`) | compute, full res | Z, acc, gran → `rg16Float` (I, A) | `DF_K` ∈ {0, 4, 8}, `DF_FULL` |
| `lkRheinberg` | compute, full | Z, acc, gran, dust → `rgba16Float` (Ic, Ir, A, –) | same ring loop, 2 accumulators |
| `lkDIC` | compute, full | Z, gran, dust → `rg16Float` | shear dir + bias in uniforms |
| `lkPhaseHalo` → `lkPhase` | 2–3 separable Gaussian passes at ½ res, then compute | φ → halo `r16Float` → `rg16Float` | replaces the 181-px FFT |
| `lkFluor` | compute, full | Z, acc, gran → `rg16Float` (Ic, Ig) | haze from a mip level after DOF |
| `lkPolar` | compute, full | Z, acc, gran, **ML LUT** (`texture1d<half>` rgba16F, 2048) → `rgba16Float` | Michel-Lévy precomputed on CPU once |
| `focCoC+Down` (= `dfCoC+Down`) | compute, ½ res | look output + plane uniforms (+ optional Z) → `rgba16Float` (I…, CoC) | plane from `FocusDriver` |
| `focRing` (= `dfRing`) | compute, ½ res | 12 (mid) / 24 (full, near/far split) tap annulus gather | cheap: `focMip` 3-level Gaussian mip lerp |
| `bloom` (= `dfBloom`) | MPS Gaussian / mip chain | threshold + 2–3 levels | none on DIC/phase/polar |
| `tone` (= `dfTone`) | compute, full | tone k, STOP, grain `hash21(pixel, tick)`, accent mix, palette, sRGB → drawable | deterministic per device (the internal perf notes) |

**Determinism:** grain must come from `hash21(pixel, tick)`, never a CPU RNG (the internal perf notes). The label strip is a CPU overlay for review renders only; it isn't part of the product pass.

**Portable as-is:** every equation in §2, the LUT build, the CoC formula and the tracking smoother (CPU, per frame). **Needs a rewrite:** FFT ring convolution → gather; the 181-px Airy → Gaussian fit; `track_plane` currently runs over the whole clip (zero-phase smoothing across future frames). Live, it must become a causal filter (critically damped spring + slew limit).

## 9. Known gaps & next refinement
- CoC uses screen-y only. Per-pixel Z (or a body depth) should modulate it, as doc 42 §7.3 does (`c = cocScale·|Z − zFocal|`).
- `track_plane` smoothing is non-causal (it looks ahead). Live use needs a causal version.
- There's no chromatic aberration, focus breathing or stage drift (doc 42 §7.3 `msChroma` / `msField`), except dust and grain drift.
- The phase kernel is 181 px FFT in the toy, and the separable-Gaussian fit isn't done yet.
- Rheinberg K is hard-coded to 8 (not tiered in the toy).
- Bloom/tone constants differ per look (tuned by eye). A port should expose them as one exposure/bloom pair per look preset.
- Label strip text overlaps if the left label is long (Jost lacks '→'; use '/').

## 10. Files & clips
- Source: `visuals/glab/src/darkfield_huddi.py`, `visuals/glab/src/looks.py`; numpy toy clips/figures in `visuals/glab/`: `darkfield-huddi-full-*`, `darkfield-tiers-sbs-*` (cheap/mid/full side by side), `darkfield-focus-rack-*`, `darkfield-physarum-*`.
- Clips (`visuals/glab/looks/`): `look-01-rheinberg`, `look-01a/b/c-rheinberg-*-track`, `look-02-dic`, `look-03-phase`, `look-04-fluorescence`, `look-05-polarised`, `look-06-diatoms-serif`, `look-07-bacteria-multiply`, `var-v8-specimen` (all four looks in one take), `batch-c6-nucleus` (darkfield full). Each has `.mp4`, `-m.mp4`, `-poster.png` and `-contact.png`.
- Refs: doc 42 §7 (pass chain, MicroscopeKnobs), the internal perf notes (darkfield model, Metal sketch, tiers), doc 47 (look library), `visuals/glab/looks/README.md`.
