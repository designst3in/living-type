# DIC / Nomarski (`dic`)

> Embossed relief from the directional derivative of the optical path: a lit side and a shadow side on dark mid-grey. Clips: `look-02-dic`, `var-v8-specimen` (second segment). Source: `visuals/glab/src/looks.py` → `look_dic(cmap)`.

## 1. What it is
Differential interference contrast: two sheared beams interfere, so the image is ∝ the gradient of the optical path along the shear axis. The result is a bas-relief with no halo. HUDDI greys, with highlights faintly cream.

## 2. How it works
- **State:** none.
- **Update step:**
  1. `opd = G₀.₉(2.2·Z + 0.45·gran + 0.25·dust)`; shear direction `sh = (cos(−45°), sin(−45°))`; `dS = gx·sh_x + gy·sh_y`.
  2. `I = sin²(0.42 + 2.6·dS)/sin²(0.42)·0.075` (bias retardation 0.42 rad; gain 2.6), then `I ×= e^{−0.12Z}` (faint absorption).
  3. Ring defocus (I, A) with `cmap` (`coc(i, maxr=16)`) and `inner = 0.45`.
  4. `L = (1 − e^{−2.4I})·(0.25 + 0.75·STOP)`.
  5. Colour `C = BG + (INK − BG)·L`, then cream tint `C = C·(1 − 0.22L) + CREAM·0.22·L²`.
  6. Grain (photons 320).
  7. Accent mix.
- **Randomness:** grain seed.
- **Lifecycle:** n/a.

## 3. Glyph coupling (GlyphSource)
None. With a glyph SDF as the Z source, DIC gives an embossed-letter look directly (`Z = smoothstep(SDF)`).

## 4. Controls & parameters
| Param | Type / range | Default | Unit | What it does | Exposed to jig? |
|---|---|---|---|---|---|
| ★ shear angle | deg | −45 | deg | light/shadow direction | `MicroscopeKnobs.dicShear` (doc 42 §7.3) |
| ★ gain | 0..5 | 2.6 | – | relief strength | `dicK` |
| ★ bias | rad | 0.42 | rad | bias retardation (grey level, asymmetry) | proposed `dicBias` (new) |
| level | – | 0.075 | – | background brightness | proposed |
| absorption | – | 0.12 | – | darkening with thickness | proposed |
| opd weights | – | 2.2 Z, 0.45 gran, 0.25 dust, σ 0.9 | – | what embosses | proposed |
| focus | rack (`maxr 16`), inner 0.45 | – | – | wide-aperture DOF | `zFocal`, `cocScale` |
| tone / photons | 2.4 / 320 | – | – | – | `grainAmt` |

V8 uses the same function on the specimen source. Legibility: none.

## 5. Timeline / arc
Stateless; look-02 racks focus.

## 6. Camera & optics
No bloom; field stop softened to 0.25 + 0.75·STOP; ring inner 0.45.

## 7. Performance & tiers
- **Cost:** ≈0.7× darkfield mid [est] (2-tap derivative + sin², 2-channel DOF).
- **Tiers:** all devices run it. A12 uses the Gaussian mip DOF.
- **Box CPU:** ≈2 s/frame.

## 8. Port to macOS Swift/Metal
- **Kernel `lkDIC`:** compute, full. Reads `Z r16Float`, `gran`, `dust`; writes `rg16Float` (I, A).
- **Post-stack:** shared; `tone` adds the cream tint.
- **Hooks:** H6 MicroscopePass mode `dic`; knobs `dicShear`, `dicK` (doc 42 §7.3 names; proposed, not found in checkout `ea48744`).
- **Portable:** as-is.

## 9. Known gaps & next refinement
No shear-induced double image (real DIC shows a slight doubling); no Wollaston-prism colour bias (DIC with a λ plate gives colour); the bias isn't animated.

## 10. Files & clips
`visuals/glab/src/looks.py`; `looks/look-02-dic*`, `var-v8-specimen*`.
