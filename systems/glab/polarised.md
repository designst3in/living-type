# Polarised light, crossed polars (`polarised`)

> Interference colours from birefringence: `I(λ) = sin²(2(θ − p))·sin²(πΓ/λ)`, via a precomputed Michel-Lévy LUT. Dark extinction bands sweep as the polariser turns. Clips: `look-05-polarised`, `look-06-diatoms-serif`; crystal uses its own variant ([`crystal.md`](systems/glab/crystal.md)). Source: `visuals/glab/src/looks.py` → `look_polar(cmap, gscale=1.0)`, `_michel_levy(nG=2048, gmax=1800)`.

## 1. What it is
Crossed polarisers with the specimen between them. Built from first principles (no matching reference in prior-art). Colours are real-ish and labelled.

## 2. How it works
- **State:** none.
- **LUT** (`_michel_levy`):
  - Γ ∈ [0, 1800] nm in 2048 steps.
  - 24 wavelengths 400–700 nm, with Gaussian fits of the CIE x̄ȳz̄ functions.
  - XYZ → linear sRGB, normalised.
- **Update step:**
  1. Orientation θ from the structure tensor of G₁.₂Z, smoothed σ 3: `θ = ½·atan2(2Jxy, Jxx − Jyy) + π/2` (stroke direction).
  2. Retardance `Γ = clip((620·Z + 900·|curv| + 120·gran·body)·gscale, 0, 1800)` nm, with curv = ∇²G₂Z.
  3. Polariser `p = 8° + 40°·ease(u)`.
  4. `ext = sin²(2(θ − p))·clip(6Z)`.
  5. `col = LUT[Γ]·ext`.
  6. Ring defocus (RGB + A, 7 levels, inner 0.62).
  7. `C = BG + 2·col`, then `C = (1 − e^{−1.6C})·STOP`.
  8. Grain (photons 200).
  9. Accent mix with `A·0.6·STOP`.
- **Randomness:** grain only.
- **Lifecycle:** n/a.

## 3. Glyph coupling (GlyphSource)
None directly. With glyph geometry available, θ could come from the glyph stroke-direction field instead of the Z structure tensor (cleaner extinction bands).

## 4. Controls & parameters
| Param | Type / range | Default | Unit | What it does | Exposed to jig? |
|---|---|---|---|---|---|
| ★ `gscale` | 0.3..2 | 1.0 (env `GSCALE` for look-06) | – | retardance scale → colour order (grey → 1st-order → 2nd-order) | proposed `polarGamma` (new) |
| ★ polariser sweep | deg | 8 → 48 | deg | extinction band motion | proposed `polarAngle` (new) |
| Γ weights | 620 Z, 900 curv, 120 gran | – | nm | thickness / stress / granule colour | proposed |
| GMAX | – | 1800 | nm | LUT range | internal |
| tensor σ | – | 1.2 / 3 | px | orientation smoothing | internal |
| tone / photons / accent | 1.6 / 200 / 0.6 | – | – | – | `grainAmt` |

Legibility: none.

## 5. Timeline / arc
The polariser rotates over the clip; focus by driver.

## 6. Camera & optics
No bloom; 4-channel DOF; black field.

## 7. Performance & tiers
- **Cost:** ≈1.0× darkfield mid [est] (3 blurred tensor products + a 1D LUT, `rgba16Float` DOF). A12: gradient-θ instead of the tensor, mip DOF [est].
- **Box CPU:** ≈2 s/frame.

## 8. Port to macOS Swift/Metal
- **LUT:** `texture1d<half>` rgba16Float, 2048 wide, built once on CPU (port `_michel_levy` verbatim).
- **Kernels:** `lkTensor` (Jxx, Jxy, Jyy → `rgba16Float`, + MPS blur σ 3), then `lkPolar` → `rgba16Float`.
- **Post-stack:** shared.
- **Hooks:** H6 mode `polar` (proposed); knobs proposed.

## 9. Known gaps & next refinement
Real silica is only weakly birefringent (the colours are exaggerated); no compensator (λ-plate) option; extinction is gated by Z, so thin edges extinguish oddly.

## 10. Files & clips
`visuals/glab/src/looks.py`; `looks/look-05-polarised*`, `look-06-diatoms-serif*`.
