# Epifluorescence (`fluorescence`)

> Two emission channels added on black: a cream membrane/network stain and green (#33ff66) nuclei/tips. Widefield haze, photobleaching and photon-starved grain. Clips: `look-04-fluorescence`, `look-07-bacteria-multiply`, `batch-b6-synapse`, `var-v8-specimen` (fourth segment). Source: `visuals/glab/src/looks.py` → `look_fluor(cmap, cg=1.0, expo=1.0, gg=0.5, fill=0.0, knock=0.0)`.

## 1. What it is
Stained specimen glowing under excitation. It maps cleanly onto HUDDI: cream is the stain and green is reserved for the "alive" marker (nuclei, tips, action potentials, dividing cells).

## 2. How it works
- **State:** none (bleaching is a function of u).
- **Update step:**
  1. `memb = 2·|∇G₀.₈Z| + 2.4·max(0, −∇²G₁Z) + 0.02·Z`.
  2. `Ic = memb·cg/(memb·cg + 1.1) + fill·Z`.
  3. `Ig = clip(1.3·A + gg·gran·body, 0, 1.5)`.
  4. Ring defocus (Ic, Ig).
  5. `Ic ×= (1 − knock·clip(Ig))`: green punches through cream so pulses read on top of the soma.
  6. Haze per channel: `X = (X + 0.16·G₁₄X)·bleach`, with `bleach = 1 − 0.18·i/(nf − 1)`.
  7. Colour `C = BG + 0.95·CREAM·Ic + ACC·Ig`.
  8. Bloom `C += 0.25·G₅ max(C − 0.6, 0)`.
  9. `C = (1 − e^{−1.5·expo·C})·STOP`.
  10. Grain photons 110, read 0.008. No accent_mix (green is already a channel).
- **Randomness:** grain only.
- **Lifecycle:** n/a.

## 3. Glyph coupling (GlyphSource)
None.

## 4. Controls & parameters
| Param | Type / range | Default | Unit | What it does | Exposed to jig? |
|---|---|---|---|---|---|
| ★ `cg` | 0.5..3 | 1.0 (look-07, synapse, V8: 2.2) | – | membrane stain gain | proposed `fluorStain` (new) |
| ★ `expo` | 0.5..3 | 1.0 (look-07: env `EXPO`, default 2.0; synapse/V8 2.0) | – | exposure | proposed `exposure` |
| `gg` | 0..1 | 0.5 (synapse 0) | – | green granule speckle inside bodies | proposed |
| ★ `fill` | 0..1 | 0.0 (synapse 0.42) | – | cytoplasm fill so thick bodies aren't hollow | proposed |
| ★ `knock` | 0..1 | 0.0 (synapse 0.65) | – | green knocks out cream | proposed |
| haze | 0.16·G₁₄ | – | – | out-of-focus emission | proposed |
| bleach | 0.18 over clip | – | – | photobleaching | proposed |
| photons / read | 110 / 0.008 | – | – | starved-sensor grain | `grainAmt` |

Legibility: none.

## 5. Timeline / arc
Bleach ramps linearly with u. Focus by driver (rack / coc_track / spec_coc).

## 6. Camera & optics
Shared post-stack; bloom thr 0.6.

## 7. Performance & tiers
- **Cost:** ≈0.7× darkfield mid [est] (arithmetic + one haze mip, 2-channel DOF).
- **Tiers:** all devices. A12 uses the mip DOF.
- **Box CPU:** ≈2 s/frame.

## 8. Port to macOS Swift/Metal
- **`lkFluor`:** compute, full. Reads Z, accent, gran; writes `rg16Float` (Ic, Ig).
- **Haze:** a mip level read in `tone`. Bleach factor in uniforms.
- **Hooks:** H6 mode `fluor` (proposed `MicroscopeKnobs.mode` value; not found in checkout); knobs proposed.

## 9. Known gaps & next refinement
No spectral bleed between channels; the bleach isn't spatial (real bleaching is stronger where it's brighter); no confocal (sectioned) variant.

## 10. Files & clips
`visuals/glab/src/looks.py`; `looks/look-04-fluorescence*`, `look-07-bacteria-multiply*`, `batch-b6-synapse*`, `var-v8-specimen*`.
