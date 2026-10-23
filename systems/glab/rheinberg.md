# Rheinberg illumination (`rheinberg`)

> Coloured central stop + two-colour annulus: the background takes the stop colour and edges scatter in two colours split by direction. Clips: `look-01-rheinberg`, `look-01a/b/c-rheinberg-*-track`, `batch-b4-tendril`, `batch-c5-grain`. Source: `visuals/glab/src/looks.py` → `look_rheinberg(stopc, c1, c2, cmap)`.

## 1. What it is
A darkfield variant where the condenser stop is coloured (blue, teal, violet or HUDDI near-black) and the annulus has two coloured halves. Edges facing one way glow c1 and the other way glow c2. It is the look for the physarum-word front-tracking clips and C5 grain. Colours are labelled "real-ish".

## 2. How it works
- **State:** none (per frame).
- **Update step:**
  1. `φ = G₀.₇(2.4·Z + 0.35·gran)`, gradient (gx, gy).
  2. For K = 8 directions `θ_k = 2πk/8`: `e = max(0, ∇φ·d̂_k)²`. Add to `Ec` if `sin(θ_k − 0.4) ≥ 0`, else to `Er`. Both ×8/K.
  3. `Ic = 6Ec/(6Ec + 1)`, `Ir = 6Er/(6Er + 1)`.
  4. Ridge `rid = 1.2·max(0, −∇²G₀.₈φ)`: `Ic += 0.6·rid + 0.5·dust`, `Ir += 0.4·rid + 0.3·dust`.
  5. Ring defocus of (Ic, Ir, A) with `cmap`.
  6. `cover = clip(Ic + Ir)`; field = `stopc·0.36·exp(−1.4·G₃Z)·(1 − 0.85·cover)` (the body slightly absorbs the stop colour; scatter replaces it, so cream over blue doesn't turn olive).
  7. `C = field + c1·Ic + c2·Ir`.
  8. Bloom `C += 0.3·G₆ max(C − 0.5, 0)`.
  9. `C = (1 − e^{−1.5C})·STOP`.
  10. Grain (photons 220).
  11. Accent mix.
- **Randomness:** grain seed `3000 + i`.
- **Lifecycle:** n/a (from source).

## 3. Glyph coupling (GlyphSource)
None directly (Z/A from the sim). The focus driver may read the glyph bbox (`spec_coc`).

## 4. Controls & parameters
| Param | Type / range | Default | Unit | What it does | Exposed to jig? |
|---|---|---|---|---|---|
| ★ `stopc` | sRGB | `STOPC #1c4a66` | – | background (stop) colour | proposed `rhStop` (new) |
| ★ `c1` | sRGB | `CREAM #f5e6a8` | – | colour of edges facing `sin(θ − 0.4) ≥ 0` | proposed `rhC1` (new) |
| ★ `c2` | sRGB | `ROSE #e8707e` | – | colour of the opposite edges | proposed `rhC2` (new) |
| split angle | rad | 0.4 | rad | where the annulus splits | proposed |
| K | int | 8 | – | directions | `darkK` |
| κ | – | 2.4 (+0.35 gran) | – | scatter gain | `DFParams.kappa` |
| field level | 0..1 | 0.36, absorption 1.4, cover 0.85 | – | stop brightness through the body | proposed |
| ★ focus driver | rack / coc_track / spec_coc | rack (look-01); coc_track (01a–c, C5); spec_coc (B4) | – | focal band | `zFocal`, `cocScale` |
| bloom / tone / photons | 0.3·G₆ thr 0.5 / 1.5 / 220 | – | – | – | `bloom`, `grainAmt` |

**Presets (LOOKS dict):**
- `rheinberg`: STOPC / CREAM / ROSE.
- `rh_blue_track`: same, with coc_track.
- `rh_teal_track`: `#1f5c5a` / `#f2a43a` / `#c9741f`.
- `rh_huddi_track`: `#0d0d0d×2.2` / CREAM / CREAM×0.55.
- `tendril`: `#1d5a5e` / CREAM / `#b9e6cf`.
- `grain`: `#3d1166` / `#ffb547` / `#e0812e`, coc_track tilt_k 1.6, maxr 24.

Legibility: none directly.

## 5. Timeline / arc
Stateless; the arc comes from the source sim. `look-01` racks focus there and back.

## 6. Camera & optics
Shared post-stack ([`optics.md`](systems/glab/optics.md) §2.3); ring inner 0.62; field stop applied fully.

## 7. Performance & tiers
- **Cost:** ≈1.2–1.3× darkfield mid [est] (3 channels through the DOF).
- **Tier mapping:**
  - M5: mid/full;
  - A16: mid at 60, cheap at 120 Hz;
  - A12: cheap only (closed-form two-colour split: `Ec ≈ |∇φ|²·(½ + ½·sin(atan2(gy, gx) − 0.4))`, Gaussian mip DOF) [est].
- **Box CPU:** ≈2–2.5 s/frame.

## 8. Port to macOS Swift/Metal
- **Kernel `lkRheinberg`:** compute, full res. Same loop as `dfScatter` with 2 accumulators. Out `rgba16Float` (Ic, Ir, A, cover).
- **Post-stack:** `focCoC+Down` / `focRing` / bloom / `tone`, with the field composite done in `tone` (needs G₃Z: take a mip of Z).
- **Hooks:** MicroscopePass mode `rheinberg` under H6; colours under H7 as proposed `MicroscopeKnobs` additions (UNKNOWN in jig; not found). Hooks proposed per doc 42 §2.3.
- **Portable:** all of it. **Rewrite:** FFT DOF → gather.

## 9. Known gaps & next refinement
K isn't tiered in the toy; the split is a hard boundary rather than a soft blend between colours; the ridge split 0.6/0.4 is ad hoc.

## 10. Files & clips
`visuals/glab/src/looks.py`; clips `looks/look-01-rheinberg*`, `look-01a/b/c-*-track`, `batch-b4-tendril`, `batch-c5-grain`.
