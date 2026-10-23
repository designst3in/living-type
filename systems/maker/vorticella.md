# Vorticella 'spring' (`vorticella`)

> A hand-made column bitmap of the word where every vertical run is one Wavefont bar glyph = one Vorticella stalk with a bell zooid on top; each letter fires on its own beat: stalks snap into a coil (bar drops, wght axis bounces), green spasmoneme flash, then slow re-extension. Clips: `spring` (Wavefont; bar glyphs = stalks, wght bounces with each contraction), legibility 0.8. Source: `visuals/maker/species/vorticella-spring/vorticella_clip.py`

Paths are relative to the living-type project root.

## 1. What it is
Peritrich ciliates: a bell-shaped zooid with an oral ciliary crown on a stalk containing a contractile spasmoneme; on a stimulus the stalk coils in milliseconds and then slowly re-extends. Swarmers settle and grow stalks. Darkfield HUDDI; green only as the spasmoneme flash at each snap.

## 2. How it works
- **Glyph** (`GLY`): Wavefont has no letterforms, so 'spring' is a **hard-coded 9-row column bitmap**: per letter, per column, list of vertical runs `(top_row, bottom_row)`. `NCOL` = columns + 1 gap per letter; `CELL = int(0.86·S/NCOL)`; bell height `BH = 0.66·CELL`; Wavefont em sized so the longest stalk fits its bar scale; `LEVELS` maps bar-height fractions (0..400/400) to Wavefont characters.
- **Bar drawing** (`draw_bar`): stalk of height `h` = blend of the two nearest Wavefont bar glyphs (alpha by fraction), font instance per rounded weight (`wfont(w)`, axes `[100, −100, w]`, cached every 10 units).
- **State** (`setup`): runs (letter id, x, rows); strays = `round(0.25·leak·runs)` single-cell zooids in free x-height cells (counters/gaps); per letter period `P ∈ [1.9, 2.6] s`; fire times from `2.9 + 0.36·order[li]` (order `[0,3,1,4,2,5]`) every P until 8.4 s; per run jitter, phase, lean `N(0,1)·(1.5 + 6·leak)`, granules, grow start `0.25 + 0.22·li + U(0, 0.25)`; 260 bacteria random walks precomputed.
- **Per frame** (`contraction`, `bell`, `frame`): contraction `c = ss(0, 0.07, dt)·(1 − ss(0.35, 1.55, dt))` (fast snap, slow re-extend), flash `exp(−dt/0.15)`, bounce `Σ exp(−(dt−1.3)/0.35)·sin(14(dt−1.3))`; stalk height `hs = hs_full·grow·(1 − 0.74c)`; weight `w = 90 + 120c + 30·bounce`; spasmoneme helix amplitude ∝ c (green line alpha = flash); bell = SDF blend of an open bell (`dA`, width `w0 → w1` along height ^0.75) and a closed sphere (`dB`) by `c`, size `×(1 + 0.2·leak)·(0.55 + 0.45·grow)`; 11 oral cilia with metachronal flicker `sin(9t − 0.8j + ph)` when `c < 0.9`; macronucleus arc, granules.
- **Randomness / seeds:** 23 (all), 5000 + i (finish).
- **Lifecycle:** settle + grow (0–2.8 s) → snap/re-extend cycles per letter (2.9–9.1) → all extended, feeding. Keyframed by schedule.

## 3. Glyph coupling (GlyphSource)
**Hand-authored column-run bitmap** (`GLY`) + Wavefont glyphs as the stalk primitive. No mask, SDF, skeleton, counters or direction field from an outline font. To swap the word: author new `GLY` entries, or derive them automatically by quantising any glyph mask to a 9-row grid and extracting vertical runs per column (same approach as [`sponge.md`](systems/maker/sponge.md) grid quantisation). Hand-drawn input: quantise the drawing likewise. Counters/gaps for strays = free cells of the bitmap.

## 4. Controls & parameters
| Param | Type / range | Default | Unit | What it does | Exposed to jig? |
|---|---|---|---|---|---|
| **`LEGIBILITY`** (hero knob) | 0..1 (env) | 0.8 | – | strays `0.25·leak·runs`, bell inflation `1 + 0.2·leak`, lean `1.5 + 6·leak` | proposed `LivingTypeKnobs.legibility` / real `LifeKnobs.leak` |
| **fire period P** (hero knob) | s | 1.9–2.6 per letter | s | snap rhythm | Director / audio (proposed) |
| **contraction envelope** (hero knob) | s | snap 0.07, release 0.35–1.55 | s | spring feel | proposed |
| **wght bounce** (hero knob) | font units | 90 + 120c + 30·bounce | wght | stalk thickening | proposed (variable axis) |
| fire order | list | [0,3,1,4,2,5] + 0.36 s steps | – | letter stagger | – |
| `GLY` | bitmap | 'spring' | rows/cols | the word | proposed (grid-quantised GlyphField) |
| bacteria | count | 260 | – | ambience | – |

## 5. Timeline / arc
10 s keyframed; snaps are beat-like and would map well to audio onsets (not wired).

## 6. Camera & optics
Darkfield HUDDI (`sat=1.0`), no rack; stalk rim from gradient of the bar raster; ink/cream bells, green flash; 20×, scale 100 µm.

## 7. Performance & tiers
Box: ~60–80 runs, PIL text bars + analytic bells on 2× patches: ~2–3 s/frame. [est] trivial on all tiers.

## 8. Port to macOS Swift/Metal
Stalks: either draw Wavefont glyph quads via Core Text (bar level + wght per instance) or replace with an SDF capsule whose height/thickness follow the same curves (cheaper, identical look). Bells: instanced analytic SDF fragment shader. Spasmoneme: helix polyline in a vertex shader. CPU: run extraction and fire schedule. Hooks: real `LifeKnobs.leak`; proposed H7 legibility + `fireHz`, beat hook from `Score.swift`/`Director.swift` (doc 42 §2.3 item 1, planned files).

## 9. Known gaps & next refinement
- Word is hand-authored; no automatic glyph → runs.
- Stalks are fonts drawn by PIL each frame (two blended levels), slight popping between bar levels at very slow motion.
- Contraction is triggered by schedule, not by a mechanical/neighbour stimulus.

## 10. Files & clips
- `visuals/maker/species/vorticella-spring/vorticella_clip.py`; font `visuals/fontcast/fonts/Wavefont.ttf`.
- Clip `vorticella-spring-clip.mp4` 3.4 MiB / `-m` 0.7 MiB; stills `vorticella-spring-still.png`, `vorticella-spring-wip.png`.
