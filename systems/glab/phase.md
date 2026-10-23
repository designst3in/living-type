# Phase contrast (`phase`)

> A dark specimen with bright halos: the phase field minus its obscured-Airy-filtered copy. Clips: `look-03-phase`, `var-v8-specimen` (third segment, gain 1.35). Source: `visuals/glab/src/looks.py` → `look_phase(cmap, gain=1.0)`, `_obscured_airy`.

## 1. What it is
Zernike phase contrast, modelled after Yin, Li, Kanade et al. (third-party: "Understanding the phase contrast optics to restore artifact-free microscopy images", PMC3372640). Thin bodies go dark, edges get bright halos with ring lobes, and the interiors of wide bodies fade toward the background (shade-off).

## 2. How it works
- **State:** none.
- **Kernel** (`_obscured_airy(R=0.022, Wd=0.009, beta=0.55, rad=90)`):
  - `airy(Rr) = Rr·J₁(2πRr·ρ)/ρ`, centre `πRr²`;
  - `A = airy(R) − β·airy(R − Wd)`, normalised to sum 1;
  - 181×181 px.
- **Update step:**
  1. `φ = G₀.₈(2.2·Z + 0.5·gran + 0.3·dust)`.
  2. `I = 0.055 − 0.042·gain·(φ − A∗φ)`, clipped ≥ 0. A∗φ is computed by FFT.
  3. Ring defocus (I, A) with `cmap`.
  4. `L = (1 − e^{−2.6I})·(0.3 + 0.7·STOP)`.
  5. Colour `C = BG·(1 − L) + INK·L`; halo mask `hal = clip((I − 0.06)·20)` (I before tone); `C = C·(1 − 0.25·hal) + CREAM·L·0.25·hal`.
  6. Grain (photons 300).
  7. Accent mix.
- **Randomness:** grain only.
- **Lifecycle:** n/a.

## 3. Glyph coupling (GlyphSource)
None.

## 4. Controls & parameters
| Param | Type / range | Default | Unit | What it does | Exposed to jig? |
|---|---|---|---|---|---|
| ★ `gain` | 0..2 | 1.0 (V8 1.35) | – | halo / dark strength | `MicroscopeKnobs.phaseK` (doc 42 §7.3) |
| ★ R | cycles/px | 0.022 | 1/px | ring radius → halo width | `phaseSigma` (approx.) |
| W (`Wd`) | 1/px | 0.009 | 1/px | ring width | proposed |
| ★ β | 0..1 | 0.55 | – | phase-ring attenuation → shade-off amount | proposed `phaseBeta` (new) |
| bg / k | 0.055 / 0.042 | – | – | background level, contrast | proposed |
| φ weights | 2.2 Z, 0.5 gran, 0.3 dust, σ 0.8 | – | – | – | proposed |
| tone / photons | 2.6 / 300 | – | – | – | `grainAmt` |

Legibility: none.

## 5. Timeline / arc
Stateless; look-03 racks focus (the annulus makes the ring-shaped bokeh physically literal).

## 6. Camera & optics
No bloom; STOP softened 0.3 + 0.7.

## 7. Performance & tiers
- **Cost:** ≈1.3× darkfield mid [est], after replacing the 181-px kernel with 2–3 fitted separable Gaussians at ½ res. A12 uses a single DoG halo [est].
- **Box CPU:** ≈2 s/frame (FFT).

## 8. Port to macOS Swift/Metal
- **`lkPhaseHalo`:** separable Gaussian passes at ½ res on φ → `r16Float` (the Gaussian fit to the obscured-Airy kernel must be done offline; coefficients UNKNOWN until fitted).
- **`lkPhase`:** full-res compute → `rg16Float`.
- **Post-stack:** shared.
- **Hooks:** H6 mode `phase`; `phaseK`, `phaseSigma` (doc 42 §7.3; proposed, not found in checkout).
- **Rewrite:** the kernel convolution.

## 9. Known gaps & next refinement
Gaussian-fit coefficients aren't computed; the halo-cream ramp is by eye; no apodised-phase variant.

## 10. Files & clips
`visuals/glab/src/looks.py`; `looks/look-03-phase*`, `var-v8-specimen*`.
