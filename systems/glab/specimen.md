# Specimen: one slide through the filter turret (`specimen`)

> A Physarum word sim plus the word as a stained specimen body, viewed through four microscope modalities in one take: darkfield → DIC → phase → fluorescence, changed by a filter slider crossing the light path. Clip: `var-v8-specimen` ("specimen", EB Garamond wght 800). Source: `physarum_word.py` (GROW 1.8, TRACK 0.05, arc) → `visuals/glab/src/specimen_src.py` → `looks.py specimen` (`spec_coc`, `SPEC`, `spec_state`, `look_specimen`, `spec_left`).

## 1. What it is
A showcase of the `MicroscopePass` modes on a single specimen. The same slide stays in place; only the contrast mechanism changes. The serif letters are too fine for the network alone at sim resolution, so the word is also composited as a fixed rounded "stained" body under the network.

## 2. How it works
**Sim:** `physarum_word.py specimen "EBGaramond[wght].ttf" 800 10 arc` with `GROW=1.8 TRACK=0.05` (see [`physarum-word.md`](systems/glab/physarum-word.md)).

**Specimen body (`specimen_src.py`, run once on the cache):**
- `din = EDT(mask > 0.5)`; `dome = clip(din/7, 0, 1)^0.7` (rounded cell-like body).
- `tex = 0.8 + 0.35·G₂(N(0, 1))·3` (rng 3); `body = G₁.₂(dome·tex)·0.85`.
- `w(u) = max((legibility_at(u,"arc") − 0.2)/0.8, 0)^1.2`; `Z' = max(Z_sim, body·w)`. The body is faint while the network wanders, full at 40–75 %, and thins at the end.

**Look (`look_specimen`):**
- `SPEC` = darkfield (`look_rheinberg` with stop = BG, c1 = INK·0.92, c2 = INK·0.7), DIC (`look_dic`), phase (`look_phase`, gain 1.35), fluorescence (`look_fluor`, cg 2.2, expo 2.0). All use `cmap = spec_coc`.
- **Wipes** at `SPEC_TC = (0.27, 0.55, 0.80)`, half-width `SPEC_HW = 0.045`, eased. Inside a wipe both looks render.
- **Slider edge** `xe = (1.12 − 1.24a)·N + (y − N/2)·tan 7°` travels right → left. Soft edge `w = sm(clip(0.5 + dx/36))`, dark frame band `exp(−(dx/16)²)·0.55`, faint ink glint at `dx − 9` (σ 2.5).
- **Focus `spec_coc`:** a fixed plane through the mask's vertical centre `(ymin + ymax)/2`, tilt `0.26 + 0.06·sin(2πi/nf)`, maxr 12.
- **Label:** `spec_left` names the current look or "A / B" during a wipe.

**Lifecycle:** as [`physarum-word.md`](systems/glab/physarum-word.md) (wander → lock ≈ 38 % → hold → ease), with the body fading in by the arc. Modality changes at 27 / 55 / 80 %.

## 3. Glyph coupling (GlyphSource)
| Product | Used? | How |
|---|---|---|
| mask | **yes** | sim food (via `word_mask`, GROW/TRACK) and the body |
| sdf | yes (EDT inside) | body dome profile `clip(din/7)^0.7` |
| baseline/metrics | yes (bbox) | `spec_coc` focal line = word's vertical centre |
| others | no | – |

**Replaced font / stroke / SVG:** any mask. For a hand stroke, the body dome needs a width-aware divisor (7 px assumes a heavy serif) [proposed: divisor = 0.4 × median stroke half-width].

## 4. Controls & parameters
| Param | Type / range | Default | Unit | What it does | Exposed to jig? |
|---|---|---|---|---|---|
| ★ mode sequence | list | darkfield, DIC, phase, fluor | – | turret order | proposed `MicroscopeKnobs.mode` keyframes |
| ★ wipe times | u | 0.27, 0.55, 0.80 | u | when the slider crosses | proposed keyframes |
| wipe half-width | u | 0.045 | u | slider duration | proposed |
| slider tilt / edge / band | deg / px / px | 7 / 36 / 16 | – | slider look | internal |
| ★ body weight | – | arc-mapped `((L − 0.2)/0.8)^1.2` | – | how much the stained word shows | proposed `specimenBody` |
| body dome | px | 7 (exp 0.7) | px | body roundness | internal |
| phase gain | – | 1.35 | – | phase contrast strength | [`optics.md`](systems/glab/optics.md) |
| fluor cg / expo | – | 2.2 / 2.0 | – | fluorescence | [`optics.md`](systems/glab/optics.md) |
| ★ focus | plane | word centre, tilt 0.26 ± 0.06, maxr 12 | – | one slide = one plane | `zFocal`, `cocScale` |
| sim | – | GROW 1.8, TRACK 0.05, arc | – | [`physarum-word.md`](systems/glab/physarum-word.md) | – |

## 5. Timeline / arc
Sim emergent under the default arc. Modalities are keyframed at fixed u. Wipe frames cost two looks.

## 6. Camera & optics
All four looks per [`optics.md`](systems/glab/optics.md) §2.2, with one fixed tilted focal plane (`spec_coc`) so the specimen stays physically in place across modes. Palette HUDDI, plus the looks' own colours.

## 7. Performance & tiers
- **Box CPU:** ≈2 s/frame on 3 procs (README); wipe frames ≈2×. Sim ≈55 s ([`physarum-word.md`](systems/glab/physarum-word.md)).
- **GPU [est]:** mid. One look at a time, plus a dual-look window of 9 % per wipe (2× cost there). Phase is the most expensive mode (Gaussian-fit halo, [`optics.md`](systems/glab/optics.md) §7).
- **Tiers [est]:** M5 full looks; A16 mid looks, phase on DoG during the wipes; A12 cheap looks, wipe done as a hard cut with only the slider band [proposed].

## 8. Port to macOS Swift/Metal
**Passes:** sim (H1, [`physarum-word.md`](systems/glab/physarum-word.md)) → body texture (CPU or `glyphSDF` → dome, once per glyph) → `max(Z, body·w)` in the body pass → **H6** `MicroscopePass` evaluated for mode A and (inside a wipe) mode B → `specWipe` compute pass (edge, band, glint) → shared focus/tone.

**Hooks:** H1, H4, H6, **H7** `MicroscopeKnobs.mode` keyframed with a wipe mask (INVENTORY §5), proposed `specimenBody`; H5 composite. Proposed per doc 42 §2.3; not in checkout.

**Portable:** wipe geometry and body formula. **Rewrite:** running two looks requires the `MicroscopePass` to output to an intermediate texture per mode (function-constant variants).

## 9. Known gaps & next refinement
- Phase is soft and blotchy at dense nodes.
- The word appears late in the darkfield section. Start the sim later relative to the wipes, or shorten the wander.
- The letters rely on the composited body; raise sim res or GROW so the network holds the serifs (INVENTORY §5).
- `spec_coc` reads `mask.png`. The port should read the glyph bbox from GlyphSource ([`optics.md`](systems/glab/optics.md) §3).

## 10. Files & clips
`visuals/glab/src/specimen_src.py`, `looks.py` (`specimen`); cache `/tmp/looks_sim_specimen/`; clip `visuals/glab/looks/var-v8-specimen*`. Refs: [`optics.md`](systems/glab/optics.md), [`physarum-word.md`](systems/glab/physarum-word.md), [`dic.md`](systems/glab/dic.md), [`phase.md`](systems/glab/phase.md), [`fluorescence.md`](systems/glab/fluorescence.md), [`darkfield-huddi.md`](systems/glab/darkfield-huddi.md).
