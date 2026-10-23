# Focus: ring-blur CoC, tilted focal plane, edge/tip tracking (`focus`)

> The camera half of the post-stack: a tilted (Scheimpflug) focal band, a CoC map, annular ring-blur bokeh, and four focus drivers (rack, front/tip tracking, fixed word plane, per-clip fixed). Clips: all; tracking in `look-01a/b/c`, `look-06/07`, `batch-c5-grain`; spec plane in `var-v8-specimen`, `batch-b4-tendril`, `batch-b6-synapse`. Source: `visuals/glab/src/darkfield_huddi.py` (`tilted_coc`, `ring_kernel`, `defocus`), `visuals/glab/src/looks.py` (`rack`, `coc`, `ring_defocus`, `track_plane`, `coc_track`, `spec_coc`).

## 1. What it is
Shallow-DOF micro photography. One tilted band is sharp and everything else blurs into ring-shaped bokeh (the annular condenser imaged into the defocus). The band follows the action: the advancing front while the organism grows, then the word or nucleus once it holds.

## 2. How it works
- **State:** the tracking driver keeps a per-clip smoothed target (cx, cy) (computed offline today). Everything else is per frame.
- **CoC** (`tilted_coc(s, focus=0.42, tilt=(0.55, 0), maxr=14)`):
  - `plane = focus + tilt₀(x/W − 0.5) + tilt₁(y/H − 0.5)`;
  - `CoC = clip(|y/H − plane|·maxr·2.6·W/1600, 0, maxr·W/1600)`.
- **Ring kernel:** `ring_kernel(r, inner=0.62)`: annulus `clip(r + 0.5 − d)·clip(d − inner·r + 0.5)`, normalised (r < 0.5 → delta).
- **Defocus:**
  - `ring_defocus(chans, c, inner=0.62, levels=8)`: radii `linspace(0, max c)`; each level is an FFT convolution of each channel with `ring_kernel(r_j)`; per-pixel lerp between levels by `c`.
  - `defocus(mode="gauss")`: Gaussian σ = r/2, 5 levels, run at ½ res (cheap tier).
- **Drivers:**
  1. `rack(i, nf, maxr=18)`: w = eased there-and-back; `focus = 0.10 + 0.80w`, `tilt = (0.55 − 0.85w, 0)`.
  2. `track_plane(tr, nf)` + `coc_track(i, tilt_k=1.0, maxr=18)`:
     - From `track.npy` columns (mass, tips x/y, nucleus x/y + mass, front peak x/y, peak), compute front confidence `w = clip((mass − 300)/1500)` and smooth it with G₁₂ in time.
     - Target = blend of the tips peak and the nucleus by w.
     - Temporal Gaussian σ = 0.9 s (`FPS·0.9`), then slew limit 6 px/frame.
     - `tilt = (0.30 + 0.12·sin(2πi/nf))·tilt_k`; `focus = cy/N − tilt·(cx/N − 0.5)`, so the band passes through (cx, cy).
  3. `spec_coc(i, maxr=12)`: centre line `yc = (ymin + ymax)/2` of `mask.png` rows; `tilt = 0.26 + 0.06·sin(2πi/nf)`; plane through (0.5, yc).
  4. **Fixed per clip:**
     - goo g1 0.47 / 0.28 / 16 (frost 12);
     - lava 0.46 / 0.22 / 12;
     - mercury 0.50 / – / 13;
     - crystal 0.46 / 0.24 / 12;
     - bleed 0.45 / 0.22 / 7;
     - nucleus animated ([`nucleus.md`](systems/glab/nucleus.md)).
- **Randomness:** none.
- **Lifecycle:** n/a.

## 3. Glyph coupling (GlyphSource)
- `spec_coc` needs the glyph **mask bbox** (vertical centre). With GlyphField this is the union bbox of the per-letter ids, so it works with any font or PencilKit/SVG path.
- `coc_track` needs the sim's **front/tip centroid** and **nucleus** (not glyph data).
- A proposed improvement: follow the **stroke-order** cursor (centreline arc-length of the currently growing letter) for hand-drawn glyphs [proposed].

## 4. Controls & parameters
| Param | Type / range | Default | Unit | What it does | Exposed to jig? |
|---|---|---|---|---|---|
| ★ `focus` | 0..1 | 0.42 | frame height | band height at centre | `MicroscopeKnobs.zFocal` |
| ★ `tilt` | −1..1 | (0.55, 0); 0.30 track; 0.26 spec | – | band slope | proposed `focusTilt` (new) |
| ★ `maxr` | 0..30 | 14 / 18 / 12 / 24 (C5) | px @1600 | DOF shallowness | `cocScale` |
| ★ driver | rack / track / spec / fixed | per clip | – | what the band follows | proposed `focusMode` (new) |
| `tilt_k` | 0.5..2 | 1.0 (C5 1.6) | – | tracking tilt multiplier | proposed |
| `inner` | 0.3..0.8 | 0.62 (DIC 0.45) | – | ring vs disc bokeh | proposed `bokehInner` (new) |
| `levels` | 4..8 | 8 | – | CoC quantisation | internal |
| smoothing σ | s | 0.9 | s | tracking lag | proposed `focusLag` (new) |
| slew | px/frame | 6 | px | max band speed | proposed |
| conf range | mass | 300..1800 | px count | when the front is trusted | internal |

**Legibility:** indirect. The track drifts to the nucleus or word as the front mass falls, so the legible hold is in focus.

## 5. Timeline / arc
- Rack: there and back over the clip.
- Track: front → word/nucleus.
- Spec: gentle tilt wobble.

## 6. Camera & optics
This doc *is* the camera. Resolution 1080², 24 fps, no zoom.

## 7. Performance & tiers
- **CoC map:** trivial.
- **Gather:** the main optics cost. Annulus 24 taps with near/far split (full), 12 taps (mid), 3-level mip lerp (cheap). Device mapping per the internal perf notes (`dfCoC+Down`, `dfRing` rows).
- **Tracking:** CPU per frame, negligible.
- **Box CPU:** the 8-level FFT ring stack is ≈50–60 % of a look frame [est].

## 8. Port to macOS Swift/Metal
- **`focCoC+Down`** (= the internal perf notes `dfCoC+Down`): ½ res. Writes `rgba16Float` (premultiplied colour channels + CoC in .a). Plane in uniforms; optional `Z` term `|Z − zFocal|·cocScale` (doc 42 §7.3 form).
- **`focRing`** (= `dfRing`): annulus gather with sample radius ∝ CoC, near/far separation on full, scatter-as-gather weights to avoid haloing. Cheap: `focMip` (mip chain + lerp).
- **`FocusDriver`** (Swift, CPU, per frame):
  - reads a tiny `lifeCoverage`-style reduction (front centroid, nucleus centroid, mass) from the sim (doc 42 §6.6 reduction kernel);
  - causal smoothing (critically damped spring, ω from `focusLag`) + slew limit;
  - writes plane uniforms.
- **Hooks:** H6 (`postPasses`, inside `MicroscopePass`), H7 knobs, H4 snapshot should store the driver state for scrubbing (proposed; doc 42 §2.3; not found in checkout `ea48744`).

## 9. Known gaps & next refinement
- The depth proxy is screen-y only (no Z).
- `track_plane` is non-causal: σ 0.9 s symmetric in time, so it sees the future. Live, it must be causal, which adds lag.
- No cat's-eye vignetting of the bokeh toward the edges, and no onion-ring texture (doc 47 macro look).
- The accent is defocused with the same CoC (correct) but isn't depth-ordered (no occlusion).

## 10. Files & clips
`visuals/glab/src/darkfield_huddi.py`, `looks.py`, `darkfield_clips.py` (`rack_params`); clip `visuals/glab/darkfield-focus-rack*`; tracking in `looks/look-01a/b/c-*`, `batch-c5-grain*`.
