# Gel encase + freezing gel (`goo-gel`)

> An opaque orange SSS glyph core sits inside clear, glossy, refractive gel with branching tendrils, web films and lens bubbles. V2 freezes the same gel: a cold key, 60° frost dendrites, cracks and trapped bubbles. Clips: `goo-g1-viscous` ("viscous", Sono wght 800 MONO 0), `var-v2-brittle` ("brittle", Big Shoulders Display wght 800). Source: `visuals/glab/src/goo.py` (`CFG.g1`, `CFG.v2`, `glyph`, `build_world`, `build_frost`, `capsules`, `frame`, `frost_layer`).

## 1. What it is
AJ's goo ref-1 (`refs/goo/STUDY.md`): a word encased in a viscous gel that webs between strokes, carries bubbles upward and drifts. There is **no fluid solver**. It's a 2.5D screen-space height field, and every frame is a deterministic function of `t`. V2 reuses G1 with `frost=True`: the gel stiffens and frosts from the frame edges and its own outer skin inward, cracks late, and traps its bubbles.

## 2. How it works
**State (static, seeded once per word):**
- `build_world(core, seed=11)`:
  - `segs`: capsule segments `(x0,y0,x1,y1,w0,w1,birth)`. There are 30 outward tendrils (mostly up/down, 7 px steps, widths 5–10, branch p 0.07 up to depth 3) and 64 bridges between stroke edges 30–150 px apart, with 6-segment wobbly capsules of width 3.5–6.5.
  - `web`: thin film in counters/gaps, `clip((G₃₄(m) − 0.07)·5)·(¬m)`.
  - `ridge`: Voronoi-ish wrinkles from 900 points, half res.
  - `bub`: 18 small streaming bubbles (r 3–9), 3 big domes above/below the word (r 82/64/50, never on a letter), 14 medium lenses (r 10–24).
  - `specks` 50.
- `build_frost(core, seed=23)` (V2):
  - Frost dendrites from 95 frame-edge starts (birth `0.06 + 0.94·(d/250)^1.1`, never within 40 px of a letter).
  - Dendrites from 260 points on the gel envelope ring at `env_r = 24` px, with 60° side branches (p 0.30, depth < 2).
  - 9 jagged cracks with start birth `b0 ∈ [0.50, 0.92]`.
  - 46 trapped bubbles (r 2–5.5) inside the envelope.
  - `spark`: a thresholded noise sparkle map.

**Per frame** (`frame(name, i)`, u = i/(nf−1)):
1. **Camera:** the world drifts up at 14 px/s. The camera follows with a lag (`10·sin(0.6t)·e^{−0.15t} + 6·sin(2πu)`), so the word bobs. A slow viscous warp comes from `noise_field(t, 9, 1, 5)` (×7 px). In V2 the warp is damped by `1 − 0.85·fz`, with `fz = sm(u/0.85)`.
2. **Geometry:**
   - Tendrils grow via `capsules(birth_u = 0.25 + 0.95u)` and are smoothed into tubes (G₂.₂ > 0.5).
   - Core engulf radius `engulf = 13 + 10·(1 − L)`.
   - Gel height `Hg = G₂.₅(max(30·√g_core, H_tube, 7·web + 4·ridge·web))` (a smooth union with fillets).
   - Rounded core `Hc`.
3. **Bubbles:** domes into `Bh`, plus a meniscus ring, a key-side crescent and inverted-lens offsets (`−dx·1.7` big, `·1.2` small). V2 adds a far-side caustic, freezes bubbles at `t_b = min(t, 1.8 + 3.2·ph)`, and uses a thinner meniscus (`rw` 0.035 vs 0.07).
4. **Shading:**
   - Normals from `G₁(Hg + Bh)`.
   - Behind layer = SSS orange core (wrap-lit by key `(0.55, −0.62, 0.56)`, thickness `G₆(Hc)`, thin-edge translucency, 6 % emission) plus orange carried into tendril roots.
   - Refraction by `−∇H·k_ref`, with `k_ref = 24 + 22·(1 − L)`.
   - Beer–Lambert `exp(−H·(0.006, 0.004, 0.003))`.
   - Schlick Fresnel 0.04.
   - Env `0.02 + 3.2·rl³⁰ + 0.6·rl⁶ + …`.
   - Blinn specular `4·ndh⁹⁰⁰ + 0.9·ndh¹²⁰` on the near gel, plus thin key glints on tendrils.
   - V2 palette swap: core `#3f8fe0 / #a9dcff / #1a3f7a`, env `#cfe4ff`.
5. **V2 `frost_layer`:**
   - Frost capsules up to `u`; envelope haze `clip(2.2·G₅(Fs·core_skin), 0, 0.75)` blends a G₃.₅-blurred copy (frosted gel scatters what's behind it).
   - Cold key sparkle `(0.08 + 0.7·spark)`.
   - Cracks run at `(u − b0)/0.06` with a dark offset shadow.
   - Trapped bubbles appear over 0.05 u as the ice reaches them.
6. **Post:** bokeh specks with parallax, then `tilted_coc(focus 0.47 + 0.03·sin(2π·0.7u), tilt 0.28, maxr 16; V2 12)` and 7-level ring defocus (inner 0.62). After that: bloom `0.22·G₆` above 0.7, tone `BG + 1 − e^{−1.35C}`, grain (photons 400, read 0.004), sRGB, label.

**Seeds:** world 11, frost 23 (+1 for the spark map), grain-texture rng 4, noise fields 5. Grain per frame comes from `LK.grain` (`3000 + i`).

**Lifecycle:** spawn = tendrils grow from u ≈ −0.25 → 0.75 → seek/lock-on: n/a (the core *is* the glyph) → hold 40–75 % with low engulf/refraction → decay: engulf and refraction rise as L falls. V2 freezes progressively, cracks from u 0.50, and never eats the word (gap).

## 3. Glyph coupling (GlyphSource)
| Product | Used? | How |
|---|---|---|
| mask | **yes** | `glyph()` PIL raster at `width_frac 0.78`, G₁ soft; core = mask |
| sdf | yes (as EDT) | `distance_transform_edt` in/out → engulf, rounded core profile, frost keep-out (40 px), envelope ring (24 px) |
| centreline / skeleton | no | – |
| direction field | no | – |
| counters | indirect | `web` film fills counters/gaps via a wide blur of the mask |
| per-letter ids | no | – |
| outline paths | indirect | tendril/bridge starts sample the 2-px edge band |

**Replaced font / PencilKit stroke / SVG:** this works for anything that rasterises to a mask. Very thin hand strokes (< ~8 px) make `Hc` collapse. Use the SDF with a minimum core thickness [proposed]. The big domes avoid letters via `dist_out`, so the layout is font-independent.

## 4. Controls & parameters
| Param | Type / range | Default | Unit | What it does | Exposed to jig? |
|---|---|---|---|---|---|
| ★ `legibility` (arc) | 0..1 | `legibility_at(u,"arc")` | – | engulf `13 + 10(1−L)`, refraction `24 + 22(1−L)`, web opacity `0.35 + 0.5(1−L) + 0.2u`, dome size | H7 `LivingTypeKnobs.legibility` |
| ★ engulf | px | 13 (+10 at L = 0) | px | gel thickness around the core | proposed `gelEngulf` |
| ★ k_ref | 0..60 | 24 (+22) | px/unit slope | refraction strength | proposed `refraction` |
| drift | px/s | 14 | px/s | world up-drift (camera lags) | proposed `drift` |
| tendril count / bridges | int | 30 / 64 | – | gel network density | proposed |
| bubble set | counts | 18 small, 3 domes, 14 lenses | – | lens bubbles | proposed |
| ★ `frost` (V2) | bool | false | – | enables `build_frost` / `frost_layer` / stiffening | proposed `freeze` (0..1) |
| `env_r` (V2) | px | 24 | px | envelope skin that frosts inward | internal |
| crack births (V2) | u | 0.50–0.92 | u | when cracks run | proposed |
| DOF | focus/tilt/maxr | 0.47 / 0.28 / 16 (V2 12) | – | see [`optics.md`](systems/glab/optics.md) | `zFocal`, `cocScale` |
| palette | hex | orange `#ff5d0d / #ff8a2a / #b8320a`; V2 ice blues | – | material colours ("real-ish") | palette swatches |
| `GOO_DEBUG` (env) | flag | off | – | dumps intermediate fields | no |

**Legibility mapping:** leak = 1 − L enlarges engulf, refraction and web opacity, so the word distorts at the arc's low points. INVENTORY notes the low points read as subtle; that is the next fix.

## 5. Timeline / arc
Emergent from `u` only (no sim state). The default arc is from `physarum_word.legibility_at`. G1/V2 are 8 s; the tendrils grow through the whole clip. V2: stiffening `fz = sm(u/0.85)`, bubbles frozen by 1.8–5 s, cracks 50–92 %.

## 6. Camera & optics
Material look ("real-ish colour"), not a microscope modality. There's a lagging tracking camera and a tilted ring-blur CoC (see [`optics.md`](systems/glab/optics.md) §2.3, §5 "fixed per clip"). Palette: material orange (G1) / ice blues (V2) on `#0d0d0d`.

## 7. Performance & tiers
- **Box CPU:** G1 s/frame is **UNKNOWN** (not logged). V2 ≈1.6 s/frame on 3 procs (README).
- **GPU [est]:** mid–high. Full-screen height-field normals, refraction lookups, SSS blur and ring-blur bokeh per pixel (README). Material ≈1.5–2.5× darkfield mid ([`optics.md`](systems/glab/optics.md) §7).
- **Tiers [est]:**
  - **M5:** full (SSS blur, caustics, 7-level ring DOF, 2 bloom levels).
  - **A16:** mid (half-res SSS blur, 5-level DOF, no caustics).
  - **A12:** cheap (no SSS blur, mip DOF, 1-level bloom, frost haze as one blur level). Order of cuts per [`optics.md`](systems/glab/optics.md) §7.

## 8. Port to macOS Swift/Metal
**Buffers:**
- `ggSegs`: capsule SoA (float4 ends + half2 widths + half birth);
- `ggBubbles`: float4 (x, y, r, phase) + kind;
- `ggWorld`: `r16Float` textures for web/ridge (static per glyph);
- `ggFrost` (V2): dendrite capsules, crack polylines, trapped bubbles.

**Kernels / passes:**
1. `ggCapsules`: instanced capsule SDF splat, max blend into `Ht`.
2. `ggHeight`: smooth union + Gaussian into `H`.
3. `ggShade`: normals, refraction lookup into the behind layer, Beer–Lambert, Fresnel env, spec.
4. `ggFrost` (V2): overlay.
5. Shared `focCoC/focRing`, bloom, tone ([`optics.md`](systems/glab/optics.md) §8).

**Hooks:**
- Material/refraction as a **H6** `PostPass`, or a **H5** `lifeComposite` slot.
- Knobs under **H7** (proposed `gelEngulf, refraction, drift, freeze`).
- The existing goo step in `lifeStep` (`PaintSim+Life.swift:232-242`, local `ea48744`) is the model for a height-field gel that levels and runs. The lava render in `paintRender` (`PaintSim.swift:943-959`) is the model for height → glow.
- Glyph bodies via XPBD (doc 42 §6.10) if the gel should move physically [proposed].
- H1–H8 are proposed (doc 42 §2.3); none were found in the local checkout.

**Portable as-is:** all shading equations, the world builders (CPU, once per glyph) and the timeline. **Rewrite:** PIL capsule drawing → GPU splats; `distance_transform_edt` → JFA SDF (GlyphSource); per-bubble Python loops → instanced sprites.

## 9. Known gaps & next refinement
- The arc's low points are subtle. Push engulf, refraction and tendrils over strokes at 0–30 % and > 75 % (INVENTORY §4).
- V2: the frost never erodes the word. Tie coverage to `1 − L` over the glyph. Make cracks thicker and refracting. The edge frost is soft and fills the background, and it's 2D, not volumetric.
- No real fluid: webs don't sag or neck. G2's necking (maker) could be reused.
- G1 CPU timing isn't logged.

## 10. Files & clips
`visuals/glab/src/goo.py` (`g1`, `v2`); clips `visuals/glab/looks/goo-g1-viscous*`, `var-v2-brittle*` (`.mp4`, `-m.mp4`, poster, contact, wip). Refs: `refs/goo/STUDY.md`, INVENTORY §4–§5, [`optics.md`](systems/glab/optics.md).
