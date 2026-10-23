# Lava lamp: wax metaballs form the word (`lava-lamp`)

> 34 wax metaballs heat, rise, cool and sink inside a glass lamp, gather into the word for the hold, then let go. V3 relights the same lamp in HUDDI darkfield (green wax lit only at its edges, vessel almost gone). Clips: `goo-g5-lava` ("lava", Syne wght 800), `var-v3-melt` ("melt", Baloo 2 wght 800). Source: `visuals/glab/src/goo.py` (`CFG.g5`, `CFG.v3`, `lamp_halfwidth`, `setup_lava`, `frame_lava`).

## 1. What it is
A lava lamp as a typesetting device. The wax is a smooth-min metaball field, and the word is one more soft density in the same field, so blobs merge into the letters and pinch off again. G5 is a real-ish material look. V3 (`huddi=True`) is the darkfield reading: the liquid becomes the `#0d0d0d` field and the wax shows only by edge scatter.

## 2. How it works
**State (static, `setup_lava`, rng 21):**
- `g = glyph(word, width_frac 0.40)`, a small word in the lamp.
- `rho = G₇(g)`, the word as a soft density.
- Blob dict of 34 entries (`nb = 34`):
  - `home` spread over the letters by 30 Lloyd-ish iterations on 4000 mask samples;
  - `r ∈ U(26, 52)`, `ph`, `per ∈ U(5, 9)` s, `lane ∈ U(−0.75, 0.75)`;
  - `free` = 30 % that keep cycling during the hold.
- 40 specks.

**Per frame** (`frame_lava`, half-res field S2 = 540):
1. `form = sm((u − 0.26)/0.13) · (1 − 0.9·sm((u − 0.76)/0.22))`: gather, hold, release.
2. **Free motion:** `vert = 0.5 − 0.5·cos(ph + 2πt/per)`, `fy = 940 − 780·vert`, `fx = N/2 + lane·hw(fy)·0.85 + 25·sin(0.7t + 3ph)`.
3. **Blend toward home** by `wf = form` (0 for free blobs). Radius `r·(1 − 0.35wf)·(0.75 if free)·(1 + 0.12·sin…)`. Vertical stretch `1 + clip(|vy|/260, 0, 0.6)`.
4. **Field** `F = Σ exp(−1.4·d²)` + heater pool (wobbly top at y ≈ 930) + `form·rho·2.6`, upsampled ×2.
5. **Wax mask** `clip((F − 0.55)/0.10)·inside`. Height `Hw = G₁.₅(30·√(F − 0.5))` gives the normals.
6. **G5 shading:**
   - Plum liquid `#2a0f3a / #7a2a6a`, backlit from the heater.
   - Wax SSS: `#ff5a14 / #ffb347 / #9e2208`, wrap-lit by key `(0.55, −0.62, 0.56)`, thickness `G₈`, down-facing faces catch heater light.
   - Spec `1.6·ndh²⁵⁰ + 0.25·ndh³⁰`, and a wax glow `G₂₂`.
7. **V3 shading:**
   - `edge = |∇Hw| / (|∇Hw| + 0.9)` (saturating oblique scatter).
   - Body scatter `wax·(0.06 + 0.10·thick)`.
   - Rim glow `1.15·G₁.₂(edge·wax) + 0.35·G₉(edge·wax)`, in ACC green.
   - Spec in ink; heater glow is the only cream.
8. **Glass:**
   - Cylinder-lens remap `lensx = N/2 + hw·sin(asin(xr)·0.8)/sin(0.4π)`.
   - Fresnel rims, a key streak at `xr = 0.62` and a weak one at −0.7. V3 scales the glass to ≈3–15 % (the vessel almost disappears).
   - Metal cap and base.
9. **Post:** `tilted_coc(0.46, 0.22, maxr 12)`, 6-level ring defocus, bloom `0.3·G₈` above 0.6, tone `BG + 1 − e^{−1.4C}`, grain (400, 0.004).

**Lamp silhouette:** `hw(y) = 150 + 140·sin(π·clip(0.82v + 0.1))^1.3 − 25v` for y in 70..1000, with `v = (y − 70)/930`.

**Lifecycle:** spawn = wax cycling from frame 0 → seek = blobs blend to their homes from 26 % → lock-on ≈ 39 % → hold to 76 % (30 % of blobs still cycle) → release over 76–98 %.

## 3. Glyph coupling (GlyphSource)
| Product | Used? | How |
|---|---|---|
| mask | **yes** | `glyph()` → `rho = G₇(mask)` density and blob homes (Lloyd over mask samples) |
| sdf | no | the soft density stands in for it |
| others | no | – |

**Replaced font / stroke / SVG:** this works with any mask. Thin strokes need a larger σ in `rho` or a minimum width, or the word dissolves into the threshold [proposed]. The blob count should scale with the glyph area (fixed at 34 today).

## 4. Controls & parameters
| Param | Type / range | Default | Unit | What it does | Exposed to jig? |
|---|---|---|---|---|---|
| ★ form window | u | gather 0.26 (+0.13), release 0.76 (+0.22), floor 0.1 | u | when the wax becomes the word | proposed `formIn/formOut` |
| ★ blob count | int | 34 | – | wax amount | proposed |
| ★ free fraction | 0..1 | 0.30 | – | blobs that keep cycling during the hold | proposed `liveliness` |
| blob r / period | px / s | 26–52 / 5–9 | – | size and tempo | proposed |
| threshold | – | 0.55 (width 0.10) | – | wax surface | internal |
| ★ `huddi` | bool | false (V3 true) | – | darkfield relight | `MicroscopeKnobs.mode` (proposed) |
| `width_frac` | 0.3..0.6 | 0.40 | – | word size in the lamp | layout |
| DOF | 0.46 / 0.22 / 12 | – | – | [`optics.md`](systems/glab/optics.md) | `zFocal`, `cocScale` |

**Legibility:** `L = legibility_at(u,"arc")` is computed and returned, but the **form curve is hard-coded** and shaped to match the arc. Proposed mapping: `form = smoothstep(0.3, 1.0, L)`, so the jig knob drives it.

## 5. Timeline / arc
Keyframed: `form(u)` over 8 s. The free motion is periodic per blob (no state).

## 6. Camera & optics
Fixed camera. G5 is a real-ish material. V3 is HUDDI darkfield-styled (green = wax rims, cream = heater only). It uses its own edge-scatter approximation, not `dh.darkfield` (gap). Tilted ring CoC per [`optics.md`](systems/glab/optics.md).

## 7. Performance & tiers
- **Box CPU:** V3 ≈2.5 s/frame on 3 procs (README). G5 is **UNKNOWN** (similar code path).
- **GPU [est]:** mid. A 34-blob field sum + word density per pixel, lens remap, SSS blur, ring bokeh. Trivial next to a fluid sim (README).
- **Tiers [est]:** M5 full res field + 6-level DOF; A16 half-res field (as coded) + 4-level DOF; A12 quarter-res field, mip DOF, no wax glow blur.

## 8. Port to macOS Swift/Metal
**Buffers:** `lvBlobs` (float4 home + float4 r/ph/per/lane + flags, 34 entries); `lvRho` `r16Float` (from the GlyphSource mask, blurred once).

**Kernels / passes:**
1. `lvField` (compute, ½ res): sum of anisotropic Gaussians + pool + `form·rho`.
2. `lvShade`: normals, SSS/HUDDI branch by function constant.
3. `lvGlass`: lens remap, rims, streaks.
4. Shared focus/bloom/tone.

**Hooks:**
- Composite via **H5** (`hasLifeExt` slot) or as a **H6** `PostPass` over an empty canvas. The existing lava render in `paintRender` (`PaintSim.swift:943-959`, local `ea48744`) already does height → glow with Voronoi crust seams, and is the nearest native analogue.
- Knobs **H7** (proposed `formIn, formOut, liveliness, huddi`).
- **H1** is not needed (stateless per frame).
- Hooks are proposed (doc 42 §2.3), not in checkout.

**Portable as-is:** everything (closed-form per frame). **Rewrite:** the Lloyd homes run on CPU once per glyph; `nd.zoom`/`map_coordinates` → samplers.

## 9. Known gaps & next refinement
- V3 rims are faint and uniform (no direction-dependent scatter). Replace them with the real ∇φ oblique ring ([`darkfield-huddi.md`](systems/glab/darkfield-huddi.md)).
- Legibility isn't wired; the form curve is hard-coded.
- No blob-blob dynamics (they pass through each other until the field merges them).
- The blob count doesn't scale with the word.

## 10. Files & clips
`visuals/glab/src/goo.py` (`g5`, `v3`); clips `visuals/glab/looks/goo-g5-lava*`, `var-v3-melt*`. Refs: INVENTORY §4–§5, [`optics.md`](systems/glab/optics.md), [`darkfield-huddi.md`](systems/glab/darkfield-huddi.md).
