# Porting: Python preview → Swift/Metal + web

The Python scripts in `visuals/` are a CPU look-and-behaviour specification. The shipping engine is **Swift/Metal on macOS and iOS**, extending the existing macOS ink jig (`PaintSim+Life.swift` + `Shaders/`) through hooks **H1–H8** ([Architecture](architecture.md)).

## 1. What maps one-to-one

| Preview concept (Python) | Swift / Metal target | Notes |
|---|---|---|
| `GlyphSource` mask, SDF (`distance_transform_edt`), gradient, skeleton, counters | `GlyphField.swift` (`CTFont` → `CGPath` → JFA SDF `r16Float`, `rg16Float` grad, `r8` skel/counters) | Cached on edit; rebuilt only when text or variable-font axes change ([GlyphSource](glyph-source.md)). |
| `legibility.food_field(mask, l)` (`attract`, `leak_px`, `counter`, `consume`) | `LifeKnobs.livingType` (**H7**) writing `food` (`r16Float`) and `leak = 1 − legibility` | Drives existing moss/lichen/hyphae paths and new species kernels ([Controls](controls.md)). |
| Jones *Physarum* (`physarum_word.py`) | Existing `slimeMove` (`slimePSO`) + `DEPL`/`STARVE` knobs | Uses integer atomics into `depositBuf` so replays stay deterministic. |
| Branching hyphae (`mycelium.grow`), roots, veins, lightning, synapse | `lifeHyphae` agent kind 4 in `PaintSim+Agents.swift` | Adds tip branching, anastomosis, and trope steering over `GlyphField`. |
| Reaction–diffusion (`Gray–Scott`), Reiter crystal CA, Conway B3/S23 Life | Ping-pong compute passes in `PaintSim+Ecology.swift` (**H1**) | Same dispatch pattern as existing `rdPSO`. |
| Soft cells, planarian fragments, hydra buds, balloons (`XPBD`) | `PaintSim+Bodies.swift` (`BodyP` / `BodyG`) | Overdamped soft discs and pressure-constrained contour loops. |
| Microscope post-stack (`darkfield_huddi.py`, `looks.py`) + tilted ring-blur CoC | `MicroscopePass` (`Microscope.swift`, **H6**) + `msDefocus` | Compiled with Metal function constants per device tier. |

## 2. Precision, formats, and determinism

- **Texture formats:** new trail and field textures use `r16Float` or `rg16Float`, never `rgba32Float` (which runs at quarter rate and is not filterable on A12–A16). Existing fp32 growth textures stay untouched.
- **Compact agents:** Jones/Physarum agents pack into **8 bytes** (`unorm16×2` position + packed `u32` angle/state), or **12 bytes SoA** when carrying `half2` velocity.
- **Deterministic deposits:** agent deposits accumulate through `atomic_uint` fixed-point buffers (`depositBuf`), never floating-point atomics. Random streams use `SplitMix` / `hash21(id, lifeSteps, salt)` keyed by the logical step count so gated and ungated runs match bit-for-bit.

## 3. Fixed-step simulation vs render rate

Simulation rate (`simRate`, steps per second of film time) is decoupled from display refresh (`60 Hz` / `120 Hz` ProMotion) and offline capture (`24 fps`):
- Each frame advances `k` fixed `dt` sub-steps (`lifeStep` loop) dictated by film time `t`, never wall-clock `deltaTime`.
- Camera zoom and focus racks evaluate at render time in world coordinates before `MicroscopePass` (**H6**), so changing output frame rate or resolution never alters colony topology or glyph lock-on timing.

## 4. Device tiers (M5 / A16 / A12)

One Metal shader library serves macOS and iOS through function constants (`tier = .full | .mid | .cheap`):

| Stage | Cheap (A12; A16 @120 Hz) | Mid (A16 @60 Hz; M5 @120 Hz) | Full (M5 @60 Hz / offline master) |
|---|---|---|---|
| **Darkfield edge scatter** | Closed-form isotropic + 1 directional derivative | 4-direction oblique ring | 8-direction ring × 2 spatial scales |
| **Ring-blur CoC (`msDefocus`)** | 3-level Gaussian mip lerp | Half-res 12-tap annulus gather | Half-res 24-tap annulus with near/far split |
| **Bloom + grain** | Single-pass tone + luma grain | 2-level bloom + Poisson–Gaussian grain | 3-level bloom + full photon/sensor grain |

## 5. Web (WebGPU / WGSL) policy

Swift/Metal on macOS is always the **master**. Web builds are created **case by case only** (for a specific landing page or interactive embed), driven by the same exported JSON presets ([Parameter schema](param-schema.md)):
- Shaders port from MSL to WGSL using half-res storage textures and integer atomic deposit buffers.
- Variable-font outlines on the web either pre-bake keyframed SDF slices or evaluate quadratic Bézier bands per fragment on the GPU.
