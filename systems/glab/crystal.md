# Crystal: Reiter snowflake ice frosts the letters (`crystal`)

> Hexagonal ice grows in four polycrystalline grains (each with its own lattice rotation) from seeds on the letter edges. The letters act as a vapour reservoir, so ice frosts over them first. Late, the ice "eats" the word (gated vapour). Rendered as crossed-polariser birefringence with facet sparkle. Clip: `bio-b5-crystal` ("crystal", Orbitron wght 800). Source: `visuals/glab/src/crystal_word.py` (`grains`, Reiter CA per grain, build, render).

## 1. What it is
Reiter's (2005) local cellular automaton for snow crystals, run on rotated hex grids so each grain has a different crystal orientation, viewed under crossed polarisers so thickness → interference colour.

## 2. How it works
**Reiter CA (per grain, axial hex grid):**
- Grid extent `EXT = 1.42·S`, `R = ceil(EXT/0.866) + 2`. Rotation per group `ROTS = 0°, 17°, 34°, 47°`.
- Params `ALPHA = 1.0` (diffusion), `BETA = 0.40` (background vapour), `GAMMA = 1e-4` (vapour addition at receptive cells). `SPF = 30` CA steps per frame.
- Receptive cells (frozen or with a frozen neighbour) gain `GAMMA` and keep their vapour; others diffuse with 6-neighbour averaging weighted by `ALPHA`.
- **Letter reservoir:** inside the letters `s = max(s, BETA)` (constant supply). Outside the valid domain (beyond the grain's Voronoi cell) `s = 0` (sink), so grains don't overgrow each other.
- **Eating gate:** extra vapour on the letters `0` until u 0.75, then `(1 − L)^1.2·2.2`.
- Per frozen cell the CA records the **freeze step** → `fs_img_{0..3}.npy` (cache `/tmp/crystal_cache/`), resampled to the square image.

**Grains:** `grains()` places 14 Voronoi seeds (rng 12) with a 46 px margin. Group = `idx % 4` (shuffled), so the 4 lattice rotations tile the frame. Seeds: 45 per group on the letter edge band (rng 5 + gi).

**Render:**
- age = (step − freeze step)/2200 → thickness.
- Structure tensor (G₂.₅) gives the local c-axis θ.
- Polariser angle `p = 0.35 + 0.9u` (it rotates during the clip).
- Retardance `Γ = 200 + 600·thick + 60·noise + 25·G`, mapped through the Michel-Lévy LUT (`LK.ML`, `GMAX`), with intensity `sin²(2(θ − p))`.
- Facet spark `^14` glints.
- Letters `#4a98ec` beneath, background `#080c12`, cold rim `#8ec2ff`.
- `tilted_coc(0.46, 0.24, maxr 12)`; bloom `0.3·G₅` above 0.5; tone 1.6; grain (260, 0.005).

**Lifecycle:** spawn (edge seeds) → seek (dendrites grow outward) / lock-on (the reservoir frosts letters first) → hold → eat (gated vapour > 0.75 thickens ice over the word until it reads as ice, not letters).

## 3. Glyph coupling (GlyphSource)
| Product | Used? | How |
|---|---|---|
| mask | **yes** | vapour reservoir (`s = max(s, BETA)`), letter base colour |
| outline / edge band | **yes** | nucleation seeds |
| sdf | indirect | the edge band is a thin EDT band |
| others | no | grains are independent of the glyph |

**Replaced font / stroke / SVG:** any mask. Thin strokes give a weak reservoir. Scale `BETA`/supply by stroke width or dilate the reservoir [proposed].

## 4. Controls & parameters
| Param | Type / range | Default | Unit | What it does | Exposed to jig? |
|---|---|---|---|---|---|
| ★ `BETA` | 0.3..0.9 | 0.40 | – | vapour: low = dendritic, high = plate | proposed `iceVapour` |
| `ALPHA` | 0.5..2.5 | 1.0 | – | diffusion | proposed |
| `GAMMA` | 1e-5..1e-2 | 1e-4 | – | addition: high = solid plates | proposed |
| ★ grains | count / rotations | 14 / 0, 17, 34, 47° | – | polycrystal look | proposed `grains` |
| seeds per grain | int | 45 | – | nucleation density | proposed |
| `SPF` | steps/frame | 30 | – | growth speed | tier |
| ★ eat gate | u, gain | 0.75, `(1−L)^1.2·2.2` | – | late consumption | H7 `legibility` |
| ★ polariser | angle | `0.35 + 0.9u` | rad | colour rotation | `MicroscopeKnobs` (polarised) |
| Γ map | nm | 200 + 600·thick + … | nm | interference colour | [`polarised.md`](systems/glab/polarised.md) |
| facet spark | exponent | 14 | – | glints | internal |
| DOF | 0.46 / 0.24 / 12 | – | – | [`optics.md`](systems/glab/optics.md) | `zFocal` |

## 5. Timeline / arc
Emergent CA. The eat gate is keyed at u 0.75; L comes from the arc (used only after 0.75).

## 6. Camera & optics
Crossed polarisers ([`polarised.md`](systems/glab/polarised.md)), rotating, with a tilted ring CoC. Palette: cold blue on near-black.

## 7. Performance & tiers
- **Box CPU:** ≈3 min CA per grain group (4 groups, cached), then ≈2 s/frame (README).
- **GPU [est]:** mid. Reiter CA is a trivially parallel stencil (4 grids × R² ≈ 1150² at S = 540 × 30 steps/frame) plus the polariser LUT.
- **Tiers [est]:** M5 4 grids × 30 SPF at 540; A16 4 grids × 15 SPF (longer growth, or fewer seeds); A12 2 grains, 10 SPF, at half res.

## 8. Port to macOS Swift/Metal
**Buffers:** per grain `crVap` `r32Float` + `crFrozen` `r8Uint` + `crFreezeStep` `r32Uint` on an axial hex lattice stored as an offset-row 2D texture; `crGrainId` `r8Uint` (Voronoi, static); `crLetter` mask.

**Kernels:**
1. `crReceptive`.
2. `crReiter` (one dispatch per step, ping-pong; all 4 grids in a texture array).
3. `crResample` hex → image with rotation.
4. `crStructure` (θ).
5. `crPolar` (Michel-Lévy LUT texture) via H6.

**Hooks:** H1 tick, H3 gating (the eat gate), H4 snapshot (freeze-step textures), H5/H6, H7 (proposed `iceVapour, grains`). The jig's `lifeRD` (`PaintSim+Life.swift:260`, local `ea48744`) is the nearest stencil pattern. Proposed per doc 42 §2.3.

**Portable:** CA exactly. **Rewrite:** numpy hex rolls → hex neighbour offsets in the kernel; the cache becomes live.

## 9. Known gaps & next refinement
- The letters glow from frame 0 (base colour). Fade them in with the frost.
- The eating starts late (0.75) and is mild.
- Ice stops short of grain boundaries (the sink is too strong). Use a soft sink.
- 2D only (no depth parallax).

## 10. Files & clips
`visuals/glab/src/crystal_word.py`; cache `/tmp/crystal_cache/` (`fs_img_*.npy`); clip `visuals/glab/looks/bio-b5-crystal*`. Refs: INVENTORY §6, [`polarised.md`](systems/glab/polarised.md), [`optics.md`](systems/glab/optics.md).
