# Nucleus: the word's strokes become chromosomes through mitosis (`nucleus`)

> Inside a darkfield cell, the word appears as condensed chromosomes (sister chromatids following the stroke ridges). It congresses at the metaphase plate (most legible), separates in anaphase, and splits into two daughter nuclei in telophase. Clip: `crt-c6-nucleus` ("nucleus", Outfit wght 640). Source: `visuals/glab/src/nucleus_word.py` (`cell_shape`, chromatid geometry, `chromosome_pass`) on `darkfield_huddi` (`dh.darkfield`).

## 1. What it is
A **deterministic timeline, not a sim**: every element is a closed-form function of u. It's the most "anatomically" art-directed glab system. Legibility peaks at metaphase.

## 2. How it works
**Constants:** N 1080, `CX = N/2`, `CY = 0.47N`; glyph 0.64N wide; NF 240 (10 s).

**Phases:** prophase u < 0.17, prometaphase < 0.33, metaphase < 0.76, anaphase < 0.88, telophase after.

**Curves:**
- `cond = sm((u − 0.03)/0.20)` (condensation), `decond = sm((u − 0.90)/0.10)`, `ce = cond·(1 − 0.8·decond)`.
- `cong = sm((u − 0.20)/0.18)·(0.35 + 0.65L)` (congression onto the word).
- `ana = sm((u − 0.76)/0.12)`, `telo = sm((u − 0.88)/0.12)`.

**Chromosomes:**
- Placement: picks on the stroke ridge (EDT local maxima) spaced 27 px (rng 21), length L 19–23 px, start positions scattered inside the envelope, pulled to the picks by `cong`.
- Each is a pair of chromatids:
  - half-length `Lh = L/2·(1 + 2.3(1 − ce))`; width `wc = 0.75 + 1.95ce`;
  - coil amplitude `2.6(1 − ce) + 0.25`, pitch `3.5 + 7ce`, bend `9(1 − ce)`;
  - splay `±(0.95wc + 4.6ce·|T|^1.4 + 0.6(1 − ce))` (X shape).
- Anaphase: kinetochore `k = k0 + (pole − k0)·ana·0.62·[0.30, 1.0]` (x, y), V-bend 0.55·ana.
- Telophase: pull `[0.42, 0.6]·telo` toward the daughter nuclei at (CX, CY ± 238).

**Cell (`cell_shape`):**
- `el = sm((u − 0.74)/0.16)`, `cl = sm((u − 0.86)/0.14)`.
- `rx = 430 − 50el − 80cl`, `ry = 330 + 30el − 98cl`, lobe offset `d = 245cl`, smooth-min k 0.25 (cleavage furrow).

**Poles / spindle:**
- `R = 168 + 157·sm((u − 0.15)/0.2) + 60·sm((u − 0.76)/0.12)`, ×1.25 in x; pole 2 orbits round the envelope.
- Envelope (205 × 150) breaks into 90 vesicles at prometaphase.
- Spindle fibres to `kin[::3]` (0.10), 44 astral rays (0.08).
- Telophase envelope arcs (36, 190 × 112) at 0.30; midbody.

**Granules:** 1500, streaming.

**Darkfield + focus:** `dh.darkfield(tier="full", seed=100+i)`. Focus `0.47 − 0.05·ana·sin t`, tilt `0.22 + 0.06·sin 2πu`, maxr `13 − 5·ana·(1 − telo)`.

**`chromosome_pass`:**
- 2× supersample.
- Rim `clip(3e)·(0.55 + 0.75·dir)`, θ0 −0.6 (directional darkfield rim); ridge 2.2; body 0.30·tex.
- Ring defocus; bloom `0.22·G₅ + 0.10·G₁₆`; tone 1.7.
- Halo (dilate 3, G₁.₈ ×1.3) darkens the cytoplasm ×0.72 around the chromosomes.
- Screen-blended ink; kinetochores `kin[::2]` in green.

**Lifecycle:** spawn (prophase: diffuse chromatin condensing) → seek (prometaphase: congression) → lock-on (metaphase: the word on the plate) → hold → decay (anaphase/telophase: the word splits in two and decondenses).

## 3. Glyph coupling (GlyphSource)
| Product | Used? | How |
|---|---|---|
| mask | **yes** | bounds, ridge |
| sdf / EDT | **yes** | ridge local maxima = chromosome sites |
| skeleton / ridge | **yes** (EDT maxima) | site picks, 27 px spacing |
| stroke direction | **yes** | chromatid orientation follows the stroke (the INVENTORY gap: real chromosomes sit perpendicular to the plate) |
| per-letter ids | no | – |

**Replaced font / PencilKit / SVG:** needs a ridge (skeleton) and direction. GlyphSource `skeleton` + `direction` products replace the EDT-maxima pick. Hand strokes map naturally.

## 4. Controls & parameters
| Param | Type / range | Default | Unit | What it does | Exposed to jig? |
|---|---|---|---|---|---|
| ★ phase times | u | 0.17 / 0.33 / 0.76 / 0.88 | u | mitosis schedule | proposed `phaseTimes` |
| ★ congression | – | `sm((u−0.20)/0.18)·(0.35 + 0.65L)` | – | how tightly the word forms | H7 `legibility` |
| chromosome spacing / length | px | 27 / 19–23 | px | density | proposed `chromoSpacing` |
| condensation shape | – | Lh ×(1 + 2.3(1−ce)), wc 0.75–2.7 | – | thread → X | internal |
| ★ separation | – | ana 0.62·[0.30, 1.0], telo [0.42, 0.6] | – | how far halves move | proposed `separation` |
| daughter offset | px | ±238 | px | nucleus positions | internal |
| cell shape | px | rx 430, ry 330, furrow d 245 | px | cell outline | internal |
| asters / spindle | count, α | 44 / 0.08, kin[::3] 0.10 | – | apparatus | proposed `spindle` |
| ★ DOF | – | focus `0.47 − 0.05·ana·sin t`, tilt 0.22 ± 0.06, maxr 13 → 8 | – | depth | `zFocal` |
| tone / bloom | – | 1.7 / 0.22·G₅ + 0.10·G₁₆ | – | – | [`optics.md`](systems/glab/optics.md) |

## 5. Timeline / arc
Fully keyframed (deterministic). L is used only for congression strength. A random seed varies only granules, grain and site jitter.

## 6. Camera & optics
HUDDI darkfield ([`darkfield-huddi.md`](systems/glab/darkfield-huddi.md), tier full) plus a dedicated directional-rim chromosome pass and an animated focal plane. The C6 focus values are covered in [`optics.md`](systems/glab/optics.md).

## 7. Performance & tiers
- **Box CPU:** ≈2.6 s/frame, full tier (README).
- **GPU [est]:** mid. Hundreds of analytic chromatid capsules (SDF splat), darkfield full, 2× supersample of the chromosome layer.
- **Tiers [est]:** M5 full + 2× SS; A16 mid darkfield, 1× SS, 22 asters; A12 cheap darkfield, no halo, no granules beyond 500.

## 8. Port to macOS Swift/Metal
**Buffers:** `ncSites` (k0, dir, len, rng) from GlyphSource skeleton (CPU at glyph build); uniforms for all phase curves (CPU per frame); `ncGranules` (1500).

**Kernels / passes:**
1. `ncChromatid`: tile-binned capsule SDF splat with coil (2× SS).
2. `ncCell`: smooth-min ellipse field, envelope vesicles, spindle/aster lines.
3. Darkfield H6 (`MicroscopePass`, mode darkfield).
4. `ncChromoComposite` (rim/halo/bloom).

**Hooks:** no H1 sim needed. H5/H6 render, H7 (proposed `phaseTimes, separation, chromoSpacing, spindle`), H4 trivial (u only). Proposed per doc 42 §2.3.

**Portable:** all formulas. **Rewrite:** the Python per-chromosome raster → GPU splat; EDT maxima → GlyphSource skeleton.

## 9. Known gaps & next refinement
- The Xs are uniform (same length/shape).
- Chromatids align with the strokes rather than perpendicular to the plate.
- 'e' reads as '@' in anaphase.
- The far copy is soft.
- Prophase is dense (INVENTORY §7).

## 10. Files & clips
`visuals/glab/src/nucleus_word.py`, `darkfield_huddi.py`; clip `visuals/glab/looks/crt-c6-nucleus*`. Refs: INVENTORY §7, [`darkfield-huddi.md`](systems/glab/darkfield-huddi.md), [`optics.md`](systems/glab/optics.md), [`mitosis.md`](systems/glab/mitosis.md).
