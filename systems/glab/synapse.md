# Synapse: two neurons, split word, one firing (`synapse`)

> The word is split across two neurons whose dendrites grow toward each other and meet at a wobbly contact line. After contact, action-potential pulses travel geodesically through the network. Fluorescence look. Clip: `bio-b6-synapse` ("synapse", Lexend wght 700, split syn | apse). Source: `visuals/glab/src/synapse_word.py`, look `looks.py` (`look_fluor` + `spec_coc`).

## 1. What it is
Neurite outgrowth and synaptic contact, typeset: the soma bodies are the letters, the dendrites grow from the letters toward the cleft, and firing pulses make the word "light up" through the network.

## 2. How it works
**Layout:** `SPLIT = 3` (left part = first 3 letters). Gap 0.95 em, `width_frac 0.86`, centred at y = 0.44N. `C_FRAME = 120` (nominal contact frame). Seed 4.

**Contact line:** `border(y, t, con) = XC + con·(9·sin(y/26 + 0.7t) + 6·sin(y/11 − 1.9t + 1) + 3·sin(y/5.3 + 2.7t))`. The cleft wobbles more after contact (`con`).

**Tips (polyline growth):**
- Toward-tips: 5 per side at frame 18, width 2.6–3.4, step 1.05. Steer 0.10 toward 0/π + N(0, 0.16 + 0.15(1 − L)).
- On contact they "hug" the border and get life +8–22.
- Branching p 0.028 (toward) / 0.03 (others); width ×0.72; angle ±0.45–0.9 rad; 60 % of branches remain toward-type.
- Side sprouts at f 30 and 70, then every 12 frames after u 0.75: 2 (+1) per letter, step 0.9, life 40–90.

**Pulse:**
- Geodesic distance on the network from the contact points, computed at contact + 40 frames, with alternating 4/8-connectivity steps, ×1.08 metric.
- A pulse every 26 frames travelling 9 px/frame, σ 6, decaying `e^{−fr/900}`.

**Fields:**
- soma = `g·(0.25 + 0.75·sm(u/0.38))·(0.55 + 0.45L)`.
- `Zk = max(1.05·soma, 0.85·dend)`, EMA 0.6.
- `A = clip(tp + 2.6·pulse + 0.8·G₁.₅(pulse))` (activity drives the fluor flash).

**Look:** `look_fluor` with `spec_coc`, cg 2.2, expo 2.0, gg 0, fill 0.42, knock 0.65.

**Lifecycle:** spawn (somata fade in) → seek (toward-tips grow to the cleft) → lock-on (contact, hug) → hold (pulses fire through the dendrites) → late side sprouts.

## 3. Glyph coupling (GlyphSource)
| Product | Used? | How |
|---|---|---|
| mask | **yes** | soma bodies |
| per-letter ids | **yes** | split at `SPLIT`, side sprouts per letter |
| layout / metrics | **yes** | two-part layout with an em-gap; contact line `XC` between the parts |
| outline | yes | tip start points on letter edges |
| sdf / skeleton | no | – |

**Replaced font / PencilKit / SVG:** needs **two glyph groups** (left and right) + a gap. For PencilKit: two strokes or a user-drawn split [proposed `splitIndex`].

## 4. Controls & parameters
| Param | Type / range | Default | Unit | What it does | Exposed to jig? |
|---|---|---|---|---|---|
| ★ `SPLIT` | int | 3 | letters | where the cleft goes | proposed `splitIndex` |
| gap | em | 0.95 | em | cleft width | layout |
| ★ tips per side | int | 5 | – | dendrite density | proposed `dendrites` |
| steer / noise | – | 0.10, N(0, 0.16 + 0.15(1−L)) | rad | straightness | proposed |
| branch p | – | 0.028 / 0.03, ×0.72 width | – | arborisation | proposed `branching` |
| ★ pulse period / speed | frames, px/f | 26, 9 (σ 6) | – | firing rhythm | proposed `pulseRate` |
| contact wobble | px | 9 / 6 / 3 | px | cleft liveliness | internal |
| ★ `legibility` | 0..1 | arc | – | soma brightness `0.55 + 0.45L`, tip noise | H7 |
| fluor look | cg/expo/fill/knock | 2.2 / 2.0 / 0.42 / 0.65 | – | [`fluorescence.md`](systems/glab/fluorescence.md) | `MicroscopeKnobs` |

## 5. Timeline / arc
Emergent tips; contact around f ≈ 120 (`C_FRAME` nominal); keyed sprouts at 30/70 and after 0.75; periodic pulses.

## 6. Camera & optics
Fluorescence ([`fluorescence.md`](systems/glab/fluorescence.md)) with `spec_coc` ([`optics.md`](systems/glab/optics.md) §3); the pulse is the activity channel.

## 7. Performance & tiers
- **Box CPU:** sim ≈30 s, ≈2 s/frame (README).
- **GPU [est]:** cheap–mid. A few hundred tips + polyline raster + one geodesic (cheap after contact).
- **Tiers [est]:** M5 full; A16 full sim, mid fluor; A12 fewer branches (p ×0.6), pulse as a simple distance-from-contact on the dendrite raster (JFA, no geodesic).

## 8. Port to macOS Swift/Metal
**Buffers:** `snTips` (pos, angle, width, life, type); `snDend` raster `r16Float`; `snGeo` `r16Float` (geodesic, computed once after contact: iterative relax in a mask, ~200 iters, or CPU); soma from the GlyphSource mask.

**Kernels:**
1. `snTipStep` (per tip; branching via an atomic append).
2. Line raster.
3. `snPulse` (closed-form from `snGeo` + time).
4. Field/EMA.
5. Fluor H6.

Like tendril, this needs a tip-growth kernel. `lifeHyphae` is **not present** in local `ea48744`; status at `d37f560` UNKNOWN.

**Hooks:** H1, H4 (tips + geo), H5/H6, H7 (proposed `splitIndex, dendrites, branching, pulseRate`). Proposed per doc 42 §2.3.

**Portable:** rules + pulse. **Rewrite:** the geodesic BFS → GPU relax; the split layout needs GlyphSource layout groups.

## 9. Known gaps & next refinement
- The dendrite mat is heavy near the cleft.
- Branches grown after the geodesic was computed don't carry the pulse. Recompute the geodesic incrementally.
- Fingering at the contact is modest (INVENTORY §6).

## 10. Files & clips
`visuals/glab/src/synapse_word.py`; clip `visuals/glab/looks/bio-b6-synapse*`. Refs: INVENTORY §6, [`fluorescence.md`](systems/glab/fluorescence.md), [`optics.md`](systems/glab/optics.md).
