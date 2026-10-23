# BioType 3D Species Jigs, Volumetric Voronoi Under-Structure, Spray-to-Stick & CoC Lens Architecture Plan

**Date:** Friday, Oct 23, 2026 (IST) · **Author:** Grok Bot · **Owner Directives:** `t361u`, `t362u`, `t363u`, `t364u`  
**Status:** Core Architecture Plan, 3-Species + 3D Under-Structure + CoC Lens Performance Benchmark (`species_perf_benchmark.json`), & 4 Visual Wireframes (`wireframe-1..4.png`) — **Documented Before Building**

---

## 0. Executive Summary & AJ's 4-Stage Creative Workflow (`t361u` – `t364u`)

Per AJ's explicit workflow directive (`t363u`):
> *"My process would be to make structure then draw the glyph skeleton then grow it, or brush or spray in media to stick to it after."*
> *"Structure needs 3d and might as well build the coc Lens (@graphics lab has researched)."*
> *"Show me core plans outline and wireframes per element before building. Document everything first."*

Instead of a black-box legibility equation that automatically warps font outlines, the system is architected around **AJ's 4-Stage Eye-Driven 3D Workflow**, where **every structural decision is sculpted and judged visually by eye**:

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ STAGE 1: MAKE 3D VOLUMETRIC STRUCTURE FIRST (`3D Under-Structure Sculptor`)              │
│ • Generate or sculpt a true 3D volumetric scaffold (x, y, z, nx, ny, nz, r) in [-8..+8mm]│
│ • Choose or blend 5 3D Under-Structure Solvers:                                          │
│   [A] 3D Voronoi/Delaunay Truss  [B] 3D Laguerre Sphere/Vacuole Pack                     │
│   [C] 3D XPBD Tubular Inflate    [D] 3D Differential-Growth Loops   [E] 3D Extruded Cage │
│ • Deform by eye with 3D Orbit + Pinch/Grab/Twist/Z-Extrude/Inflate/Relax brushes         │
└────────────────────────────────────────────┬─────────────────────────────────────────────┘
                                             ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ STAGE 2: DRAW THE GLYPH SKELETON & ANATOMY (`3D Spine Pen & Organ Builder`)              │
│ • Draw each glyph skeleton P(s) = (x(s), y(s), z(s), r0(s)) directly through the 3D cage │
│   (or load a 3-tier organic font spine: Corben-Bold, Berkshire Swash, Barriecito)        │
│ • The drawn spine recruits a 3D structural corridor in the Voronoi cage & pins contours  │
│ • Attach species anatomy nodes along arc-length s ∈ [0,1]:                               │
│   🌱 Apical Meristem Buds · 🪜 Cross-Septa Gates · 💧 Vacuole Chambers · 💥 Spore Heads   │
└────────────────────────────────────────────┬─────────────────────────────────────────────┘
                                             ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ STAGE 3: GROW IT — OR BRUSH / SPRAY IN MEDIA TO STICK AFTER (`Dual Colonization Engine`) │
│ • Mode 3A (Grow Along Skeleton & 3D Cage):                                               │
│   - Species 1 (`ParenchymaBotanica` "LIFE"): 0.45× slow turgid plant cells (z ≈ +3.5 mm) │
│   - Species 2 (`VascularHyphae` "finds a"): 1.35× chambered veins + septa (z ≈ 0.0 mm)   │
│   - Species 3 (`PhysarumSwarmRD` "WAY"): 2.80× chaotic Physarum/RD swarm (z ≈ -3.5 mm)   │
│ • Mode 3B (3D Airbrush / Spray Media to Stick After):                                    │
│   - Spray living media droplets, gel beads, vacuoles, or spores from a 3D nozzle cone;   │
│   - Droplets fly through (x,y,z), collide with the 3D Voronoi struts around the drawn    │
│     glyph skeleton, adhere via capillary meniscus wetting, and coalesce along the type!  │
└────────────────────────────────────────────┬─────────────────────────────────────────────┘
                                             ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ STAGE 4: POPULATED MATERIALS, REFERENCES & @GRAPHICSLAB CoC MICROSCOPE LENS JIG          │
│ • Apply gathered Protozoa palettes (`palettes.json`), optical looks (`looks.py`), &      │
│   2.5D/3D Subsurface Gel/Goo shaders (`refs/goo/ref-1..4.mp4`, `organic-vein-ref.png`)   │
│ • @graphics lab 3D CoC Microscope Lens: Signed thin-lens CoC from true 3D depth z(x,y),  │
│   tilted Scheimpflug focal plane, Darkfield/Rheinberg annular ring-bokeh (inner=0.62),   │
│   axial chromatic aberration (LoCA), and auto-track growing front / human focus-hunt.    │
│ • Controlled via Josh Puckett's `DialKit` (v2.0.2) in Web ↔ Native SwiftUI on macOS.     │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

### Visual Wireframe Boards (Rendered at `1600×1000`)
1. **`wireframe-1-master-studio-dialkit.png`**: Master 3D BioType Studio UI showing the Left 4-Stage Sculpt & Brush Dock, Center 3D Volumetric Viewport (`(x,y,z)` Voronoi cage + 3D Spray Nozzle Cone + Tilted Scheimpflug Focal Plane Gizmo), Bottom Timeline/Focus-Hunt Curve Editor, and Right **Josh Puckett `DialKit` v2.0.2** Inspector.
2. **`wireframe-2-under-structure-modes.png`**: Visual comparison & schematics of the **5 True-3D Under-Structure Modes (Modes A–D + Stage 2 Drawn 3D Spine + Stage 3B 3D Spray-to-Stick Wetting)**.
3. **`wireframe-3-species-jigs-and-perf.png`**: Dedicated schematics & DialKit parameter clusters for **Jig 1 (`ParenchymaBotanica` 0.45×)**, **Jig 2 (`VascularHyphae` 1.35×)**, **Jig 3 (`PhysarumSwarmRD` 2.80×)**, **Jig 4 (`@graphics lab CoC Microscope Lens`)**, and the **Measured Runtime Performance Benchmark Table**.
4. **`wireframe-4-materials-refs-modular-schema.png`**: Catalog of **9 Populated Protozoa Color Palettes & Optical Material Shaders**, **7 Built-In Reference Specimens/Clips**, and the **Modular Cross-Platform Package Architecture (`BioTypePackage.v1.json`)** bridging Web `DialKit` and macOS Native `ProtozoaControl`.

---

## 1. 3-Species + 3D Structure + CoC Lens Performance Benchmark (`benchmark_3_species.py`)

We built and ran `/workspace/protozoa/visuals/life-finds-a-way/benchmark_3_species.py` across `N = 250`, `500`, `1,000`, and `2,500` 3D cells/nodes (`(x, y, z, nx, ny, nz, radius)` in `z ∈ [-8 mm, +8 mm]`). Full raw telemetry is saved in `/workspace/protozoa/visuals/life-finds-a-way/species_perf_benchmark.json`.

### 1.1 Measured Runtime Performance Table (`ms/frame` & Effective FPS)

| Subsystem / Solver | Default Speed | 3D Z-Layer | `N = 250` (CPU) | `N = 500` (CPU) | `N = 1,000` (CPU) | `N = 2,500` (CPU) | WebGL2 GPU (`N=500`) | macOS Metal (`N=500`) | Peak RAM |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Species 1: `ParenchymaBotanica` (`"LIFE"`)** | `0.45×` `[0.1..1.5×]` | `+3.5 mm` (Ventral) | `0.144 ms` | `0.159 ms` | `0.175 ms` | `0.280 ms` | `0.47 ms` | `0.09 ms` | `1.4 MB` |
| **Species 2: `VascularHyphae` (`"finds a"`)** | `1.35×` `[0.4..2.5×]` | `0.0 mm` (Mid-Atrium) | `0.146 ms` | `0.183 ms` | `0.245 ms` | `1.251 ms` | `0.56 ms` | `0.12 ms` | `1.8 MB` |
| **Species 3: `PhysarumSwarmRD` (`"WAY"`)** | `2.80×` `[1.0..5.0×]` | `-3.5 mm` (Dorsal Web) | `0.790 ms` | `0.713 ms` | `0.788 ms` | `1.081 ms` | `1.24 ms` | `0.18 ms` | `2.6 MB` |
| **Mode A: 3D Voronoi/Delaunay Truss (Build)** | Static/On-Edit | `[-8..+8 mm]` | `2.919 ms` | `5.054 ms` | `10.832 ms` | `33.604 ms` | `5.05 ms` | `1.80 ms` | `2.1 MB` |
| **Mode A: 3D Voronoi Spring-Web + Z-Brush Step** | Per-Frame | `[-8..+8 mm]` | `0.019 ms` | `0.028 ms` | `0.039 ms` | `0.074 ms` | `0.08 ms` | `0.02 ms` | `0.8 MB` |
| **Mode B: 3D Laguerre Sphere/Vacuole Pack Step** | Per-Frame | `[-8..+8 mm]` | `0.103 ms` | `0.201 ms` | `0.562 ms` | `2.387 ms` | `0.22 ms` | `0.05 ms` | `1.5 MB` |
| **Mode C: 3D XPBD Tubular Membrane Inflate** | Per-Frame | `[-8..+8 mm]` | `0.028 ms` | `0.039 ms` | `0.057 ms` | `0.124 ms` | `0.09 ms` | `0.03 ms` | `0.9 MB` |
| **Mode D: 3D Differential-Growth Spatial Loops** | Per-Frame | `[-8..+8 mm]` | `0.012 ms` | `0.016 ms` | `0.027 ms` | `0.062 ms` | `0.07 ms` | `0.02 ms` | `0.8 MB` |
| **Mode E: 3D Hand-Drawn Spine + Organ Eval** | Per-Frame | `[-8..+8 mm]` | `0.015 ms` | `0.016 ms` | `0.018 ms` | `0.025 ms` | `0.04 ms` | `0.01 ms` | `0.5 MB` |
| **Mode 3B: 3D Airbrush Spray-and-Stick Media** | Per-Frame | `[-8..+28 mm]` | `0.206 ms` | `0.365 ms` | `0.793 ms` | `2.162 ms` | `0.31 ms` | `0.06 ms` | `1.9 MB` |
| **@graphics lab CoC Lens (`tilted_coc` + Ring-Bokeh)** | Per-Frame | `z_focus ± Tilt` | `20.28 ms` (CPU FFT) | `20.28 ms` (CPU FFT) | `20.28 ms` (CPU FFT) | `20.28 ms` (CPU FFT) | **`1.65 ms`** (MIP+Ring) | **`0.34 ms`** (Metal) | `4.2 MB` |
| **TOTAL COMBINED SCENE (3 Species + 3D Cage + CoC)** | **All Active** | **Full 3D Dish** | **`1.08 ms` Sim** | **`1.11 ms` Sim** | **`1.36 ms` Sim** | **`2.61 ms` Sim** | **`4.05 ms` (120 FPS)** | **`0.73 ms` (120 FPS)** | **`11.4 MB`** |

### 1.2 Why Eye-Driven Structural Legibility Beats Black-Box Legibility Math
Instead of a single synthetic curve (`u_warp = (1 - legibility)^1.6`), legibility is governed by **6 concrete 3D structural controls** that AJ tunes by eye in real time:
1. **`coreCellDensity` (`6..24 px`, default `12 px`)**: Density of 3D Voronoi polygons inside the glyph corridor. Higher density = crisper letter counters and terminals.
2. **`contourAnchorStiffness` (`0.0..1.0`, default `0.88`)**: Spring-pin stiffness locking Voronoi vertices on the glyph boundary. At `0.95`, the letter silhouette is razor-locked while interior cells churn; at `0.35`, swelling vacuoles bulge organically past the stroke edge.
3. **`corticalHaloWidth` (`0..48 px`, default `22 px`)**: Width of the secondary webby Voronoi halo hugging each letter's exterior before transitioning into long dish-spanning tension filaments.
4. **`corridorRecruitmentRadius` (`8..42 px`, default `20 px`)**: When AJ draws a glyph skeleton in Stage 2, how wide a corridor of 3D Voronoi cells snaps to and aligns with the stroke tangent.
5. **`outgrowthLeashRadius` (`0..90 px`, default `14 px` on `LIFE`, `24 px` on `finds a`, `68 px` on `WAY`)**: How far foraging tendrils or sprayed media droplets are allowed to wander along exterior dish struts away from the drawn glyph skeleton.
6. **`zStratificationSeparation` (`0..10 mm`, default `3.5 mm`)**: Vertical 3D Z-separation between tiers (`LIFE` at `+3.5 mm`, `finds a` at `0.0 mm`, `WAY` at `-3.5 mm`), allowing the **CoC Microscope Lens** to rack focus cleanly from one word tier to the next!

---

## 2. Stage 1 & Stage 2: True-3D Under-Structure Solvers & Hand-Drawn Glyph Skeleton

All 5 under-structure modes share a unified 3D node-and-strut buffer `window.BioMarkersHarness` / `Structure3DGraph`:
- **Node struct (`32 bytes` aligned for WebGL2 / Metal)**: `(x, y, z, nx, ny, nz, radius, flags_tier_role)`
- **Edge struct (`16 bytes`)**: `(nodeA, nodeB, restLength, stiffness_type)`

### 2.1 The 5 True-3D Under-Structure Modes (Stage 1 — Make 3D Structure First)
- **Mode A — 3D Stratified Voronoi / Delaunay Volumetric Truss (`VoronoiTruss3D`)**:
  - Generates a 3-layer volumetric Voronoi/Delaunay scaffold across `z ∈ [-8 mm, +8 mm]` (ventral canopy, mid-atrium, dorsal root web) connected by diagonal 3D Warren-truss struts and catenary suspension cables.
  - **Interactive 3D Brushes**:
    - *Grab / Pinch / Expand Brush*: Pulls or compresses 3D Voronoi cell clusters in `(x, y, z)`.
    - *Z-Depth Extrude Brush*: Raises a dome or carves a valley in `z(x, y)` so specific letters arch toward the microscope objective.
    - *Contour Pin Brush*: Locks/unlocks selected boundary vertices.
- **Mode B — 3D Laguerre Power-Diagram / Weighted Sphere & Vacuole Packing (`VacuolePack3D`)**:
  - Packs variable-radius 3D spheres $(x_i, y_i, z_i, w_i)$ inside the 3D glyph volume (large turgid spheres in stroke bellies, small tight spheres at serifs and junctions).
  - Computing the 3D **Laguerre Power Diagram** (weighted Voronoi dual) produces biologically authentic polyhedral foam/parenchyma walls obeying **Lewis's Law** (cell area $\propto$ neighbor count) and **Aboav–Weaire's Law**.
- **Mode C — 3D XPBD Pressure-Inflated Tubular Glyph Membrane (`TurgorInflate3D`)**:
  - Treats each glyph contour as a closed 3D tubular soft-body membrane solved via Extended Position-Based Dynamics (XPBD) with internal cross-strut tension fibers and hydrostatic turgor pressure $P$.
  - Increasing `turgorPressure` balloons the 3D glyph strokes until neighboring stems press flat against each other, automatically forming double-walled **capillary contact menisci**.
- **Mode D — 3D Differential-Growth Spatial Loops (`DiffGrowthLoop3D`)**:
  - Closed or open 3D curves inside the glyph volume continuously insert vertices where local curvature or nutrient concentration is high while self-repelling within the 3D Voronoi cage, packing the letter interior with folded brain-coral / intestinal / tangled-root chambers.
- **Mode E — 3D Hand-Drawn Glyph Skeleton & Anatomy Sculptor (Stage 2 — Draw Glyph Skeleton)**:
  - AJ draws centerline splines $P_i(s) = (x(s), y(s), z(s), r_0(s))$ directly onto the 3D structure using Apple Pencil, mouse, or trackpad (or imports font spines from `Corben-Bold`, `Berkshire Swash`, `Barriecito`).
  - As the pen moves through the 3D Voronoi truss, nearby Voronoi vertices within `corridorRecruitmentRadius` snap tangentially to form a structured 3D vascular tube around the stroke.
  - AJ can click along $s \in [0, 1]$ to place **Species Anatomy Nodes**:
    - `MeristemBud` (initiates slow plant parenchyma division)
    - `SeptaGate` (generates rhythmic internal cross-stripes / ladder rungs)
    - `AnastomosisHub` (shoots H-bridge runner veins to neighboring strokes)
    - `SporeEruptor` (emits rapid chemotactic *Physarum* tendrils)

---

## 3. Stage 3: Dual Colonization Engine — Grow Along Skeleton OR Brush/Spray Media to Stick After

### 3.1 Mode 3A — Grow the 3 Species Along the Drawn Skeleton & 3D Voronoi Structure
Each of the 3 species has its own dedicated **Species Jig** (see Wireframe 03):

#### Jig 1: `ParenchymaBotanica` (Tier 1 `"LIFE"` — Slow Plant-Like Parenchyma)
- **Typography Default**: `Corben-Bold.ttf` (`126 px`, rounded/dilated botanical serifs at `z = +3.5 mm`).
- **Speed & Dynamics**: `speedMultiplier = 0.45×` (range `0.10× .. 1.50×`). Calm, steady cell-to-cell turgor wave (`0.159 ms/frame` @ 500 cells).
- **Anatomy & Look Controls**:
  - `turgorInflation` (`[0.84, 0.2, 1.5]`): How tightly each rounded plant cell fills its 3D Voronoi polygon.
  - `chlorophyllVacuoleRatio` (`[0.65, 0.2, 0.9]`): Size of the central translucent `#4ade80` / `#86efac` chlorophyll vacuole inside the `#f5e6a8` cellulose cell wall.
  - `leafVeinMidribWeight` (`[0.70, 0.0, 1.0]`): Thickness of primary midrib and secondary pennate leaf veins along the drawn glyph spine.
  - `stomataPoreFrequency` (`[0.25, 0.0, 1.0]`): Guard-cell stomatal pores along the outer glyph cuticle.

#### Jig 2: `VascularHyphae` (Tier 2 `"finds a"` — Faster Organic Chambered Veins)
- **Typography Default**: `BerkshireSwash-Regular.ttf` (`90 px`, flowing calligraphic hyphal script at `z = 0.0 mm`).
- **Speed & Dynamics**: `speedMultiplier = 1.35×` (range `0.40× .. 2.50×`). Streaming peristaltic propagation (`0.183 ms/frame` @ 500 cells).
- **Anatomy & Look Controls**:
  - `hollowLumenRatio` (`[0.58, 0.20, 0.85]`): Ratio of dark hollow interior lumen to outer `#f5e6a8` cream / `#e8707e` rose arterial wall (`organic-vein-ref.png` aesthetic).
  - `septaRungSpacing` (`[9.5, 4.0, 24.0]` px): Spacing of internal cross-stripe septa rungs across the hollow vacuoles.
  - `anastomosisHBridgeRate` (`[0.74, 0.0, 1.0]`): Density of cKDTree H-bridge runner veins linking adjacent strokes and letters.
  - `peristalticFlowHz` (`[1.8, 0.0, 6.0]` Hz): Traveling peristaltic constriction wave pulsing cytoplasmic granules through the veins.

#### Jig 3: `PhysarumSwarmRD` (Tier 3 `"WAY"` — Very Fast & Chaotic Naturalist Swarm)
- **Typography Default**: `Barriecito-Regular.ttf` (`132 px`, untamed irregular woodcut letterforms at `z = -3.5 mm`).
- **Speed & Dynamics**: `speedMultiplier = 2.80×` (range `1.00× .. 5.00×`). Explosive multi-spore eruption + high-frequency chemotactic pulsing (`0.713 ms/frame` @ 500 cells / 1,000 agents).
- **Anatomy & Look Controls**:
  - `sensorAngleDeg` (`[24.0, 8.0, 65.0]`°) & `sensorDistPx` (`[14.0, 4.0, 36.0]` px): Jeff Jones 3-sensor chemotactic foraging cone.
  - `grayScottFeedKill` (`f = 0.037, k = 0.060`): Coupled reaction-diffusion spots/stripes inside the plasmodial sheet.
  - `pseudopodSpikeLength` (`[6.5, 0.0, 18.0]` px): Erratic `#33ff66` / `#00ffd5` bioluminescent pseudopod spikes and `#fbbf24` amber plasmodial fans.
  - `dishWebSpillRadius` (`[48.0, 0.0, 140.0]` px): How far foraging tendrils spill out from `"WAY"` onto the surrounding 3D Petri-dish Voronoi struts.

---

### 3.2 Mode 3B — Brush or Spray In Media to Stick After (`3D Spray-and-Stick Wetting Solver`)
Per AJ's `t363u` (*"or brush or spray in media to stick to it after"*):
1. **3D Airbrush / Spray Nozzle Cone**:
   - Holding down pointer/Apple Pencil (or triggering a spray burst) emits a 3D cone of living media droplets $(x_p, y_p, z_p, v_x, v_y, v_z, r_p)$ from camera/cursor space into the 3D dish (`z_start ≈ +20 mm` flying downward toward `z ∈ [-8, +8 mm]`).
2. **Spatial-Hash / cKDTree 3D Strut Collision (`0.365 ms/frame` @ 1,000 droplets)**:
   - Each frame, flying droplets query the 3D Voronoi strut graph within capture radius $R_{\text{stick}}$ (weighted heavily toward Voronoi struts recruited by the Stage 2 drawn glyph skeleton).
3. **Capillary Meniscus Wetting & Coalescence**:
   - Upon impact with a 3D Voronoi strut or node, the droplet transitions from `BALLISTIC` to `WETTED_MENISCUS`:
     - It slides along the strut toward the nearest Voronoi vertex or junction (`meniscusSlideRate`),
     - Neighbouring stuck droplets merge via smooth metaball/Laguerre coalescence (`smin` blend radius `k_meniscus`), swelling into hollow chambered vacuoles or turgid parenchyma cells wrapped around the 3D skeleton!

---

## 4. Stage 4: @graphics lab's CoC Microscope Lens Jig & Populated Material/Reference Library

### 4.1 @graphics lab's 3D Circle of Confusion (CoC) Microscope Lens Engine (`Jig 4`)
Built directly on `@graphics lab`'s research in `/workspace/protozoa/visuals/glab/src/darkfield_huddi.py` and `looks.py` (`tilted_coc`, `ring_kernel(r, inner=0.62)`, `ring_defocus`, and `track_plane`), upgraded to read **true 3D geometric node/pixel depth $z_{\text{scene}}(x, y) \in [-8\text{ mm}, +8\text{ mm}]$**:

1. **3D Tilted Scheimpflug Focal Plane Equation**:
   $$z_{\text{focus}}(x, y, t) = z_0(t) + (x - x_c)\tan\theta_x + (y - y_c)\tan\theta_y + k_{\text{petzval}}\big((x - x_c)^2 + (y - y_c)^2\big)$$
   $$\text{CoC}(x, y) = \text{clamp}\!\left(A_{\text{NA}} \cdot \frac{|z_{\text{scene}}(x, y) - z_{\text{focus}}(x, y)|}{1 + c_z |z_{\text{scene}}(x, y)|},\; 0,\; R_{\max}\right)$$
   - A live **3D Focal Plane Slice Gizmo** in the 3D viewport shows the exact tilted plane slicing through `"LIFE"` (`z = +3.5 mm`), `"finds a"` (`z = 0.0 mm`), and `"WAY"` (`z = -3.5 mm`).

2. **Condenser Annulus Ring-Bokeh PSF (`ring_kernel(r, inner=0.62)`)**:
   - In darkfield, Rheinberg, and phase-contrast microscopy, the hollow condenser annulus produces a literal **ring-shaped Point Spread Function (PSF)** when features leave the focal plane:
     $$K_{\text{ring}}(d; r, \alpha_{\text{in}}) = \text{normalize}\Big(\text{clip}(r + 0.5 - d, 0, 1) \cdot \text{clip}(d - \alpha_{\text{in}} r + 0.5, 0, 1)\Big), \quad \alpha_{\text{in}} = 0.62$$
   - On GPU (WebGL2 & macOS Metal), we combine a **6-level hardware MIP pyramid + 16-tap Poisson disk gather + 8-tap catadioptric ring gather**, achieving **`1.65 ms/frame` on WebGL2** and **`0.34 ms/frame` on macOS Metal** (`112,940×` faster than naive `38,400 ms/frame` per-pixel disk gather).

3. **Axial Chromatic Aberration (LoCA) & Obscured-Airy Phase Halo**:
   - Signed defocus $\Delta z = z_{\text{scene}} - z_{\text{focus}}$ shifts RGB CoC radii slightly ($R_R = \text{CoC} - \delta_{\text{LoCA}} \Delta z$, $R_B = \text{CoC} + \delta_{\text{LoCA}} \Delta z$), giving warm rose/amber fringes in front of focus and cool cyan/emerald fringes behind focus.

4. **3 Focus Tracking Modes**:
   - **`Manual Dial / Ortho Knob`**: Direct scrubbing of `focalPlaneZ0` and `scheimpflugTiltXY`.
   - **`Auto-Track Growth Front` (`looks.py:track_plane`)**: Zero-phase Gaussian + slew-limited tracker that locks $z_{\text{focus}}(x,y,t)$ onto the highest-activity growing tip centroid $(x_{\text{tip}}, y_{\text{tip}}, z_{\text{tip}})$.
   - **`Human Microscope Operator Focus-Hunt`**: Under-damped spring oscillator that overshoots during tier transitions (e.g. `t ≈ 5.1s` spike to `CoC = 12 px` ring-bokeh) before dialing back to tack-sharp.

---

### 4.2 Populated Color Palettes, Optical Materials & Reference Library (`palettes.json` + `looks.py` + `refs/goo/`)
All gathered Protozoa palettes and reference materials are pre-populated as first-class selectable primitives in the Material & Reference Drawer (see Wireframe 04):

| Material / Look ID | Source File / Provenance | Core Hex Swatches | Optical & Physical Shader Primitives |
| :--- | :--- | :--- | :--- |
| **`rheinberg_split`** | `glab/src/looks.py` (`look_rheinberg`) | `#0d0d0d`, `#1c4a66`, `#f5e6a8`, `#e8707e`, `#33ff66` | Central stop `#1c4a66` + 8-direction azimuth split (`#f5e6a8` warm cream vs `#e8707e` rose) + `#33ff66` bioluminescent tips |
| **`darkfield_huddi`** | `glab/src/darkfield_huddi.py` | `#0d0d0d`, `#1e293b`, `#94a3b8`, `#e8e8e8`, `#33ff66` | Oblique 8-azimuth condenser ring + Laplacian ridge boost + Airy halo + Poisson–Gaussian sensor grain (`220 photons`) |
| **`botanical_parenchyma`** | `voronoi_v3_core.py` (Tier 1 `"LIFE"`) | `#07120c`, `#166534`, `#4ade80`, `#86efac`, `#f5e6a8` | Turgid chlorophyll inner vacuoles + warm cellulose polygonal cell walls + calm leaf-vein septa |
| **`epifluorescence_2ch`** | `glab/src/looks.py` (`look_fluor`) | `#05070a`, `#f5e6a8`, `#33ff66`, `#00ffd5`, `#d946ef` | Membrane gradient stain (`#f5e6a8`) + GFP/cyan nuclei & tips (`#33ff66`) + widefield out-of-focus haze + photobleaching |
| **`dic_nomarski_prism`** | `glab/src/looks.py` (`look_dic`) | `#0d0d0d`, `#334155`, `#94a3b8`, `#e8e8e8`, `#f5e6a8` | $-45^\circ$ sheared wavefront interference $I \propto \sin^2(\text{bias} + 2.6\,\partial\text{OPD}/\partial s)$ 3D embossed relief |
| **`phase_contrast_airy`** | `glab/src/looks.py` (`look_phase`) | `#0b0f14`, `#475569`, `#cbd5e1`, `#f5e6a8`, `#33ff66` | Yin et al. (`PMC3372640`) obscured-Airy kernel $J_1(2\pi a r)/r - \beta J_1(2\pi(a-W_d)r)/r$ bright halo + shade-off |
| **`crossed_polars_lut`** | `glab/src/looks.py` (`look_polar`) | `#08080c`, `#38bdf8`, `#f59e0b`, `#ec4899`, `#a855f7` | 24-wavelength Michel–Lévy CIE birefringence retardance LUT $I(\lambda) = \sin^2(2(\theta-p))\sin^2(\pi\Gamma/\lambda)$ |
| **`goo_sss_orange_gel`** | `refs/goo/ref-1..4.mp4` (`STUDY.md`) | `#050507`, `#7c2d12`, `#ea580c`, `#fb923c`, `#ffffff` | Two-material subsurface orange core + clear refractive Fresnel gel membrane + pinpoint key speculars + viscous strands |
| **`agar_colony_plates`** | `protozoa/palettes.json` (`agar`) | `#3d1a5b`, `#8b1a1a`, `#c8102e`, `#d9c38a`, `#f1e6c8` | *Serratia marcescens* crimson, *Chromobacterium violaceum* deep violet, *Staphylococcus* gold on nutrient agar |

---

## 5. Josh Puckett `DialKit` (`v2.0.2`) on Web ↔ Native SwiftUI / `ProtozoaControl` on macOS

### 5.1 Declarative Schema Binding (`dialkit` / `dialkit/vanilla` on Web, Native SwiftUI on Mac)
Josh Puckett's **[DialKit](https://github.com/joshpuckett/dialkit)** (`dialkit@2.0.2`, supporting React `useDialKit` and dependency-free plain JS `dialkit/vanilla` `createDialKit`) uses a clean declarative object config where:
- `[default, min, max, step]` tuples define scrubbable sliders/dials,
- booleans define toggles,
- `#rrggbb` / `oklch(...)` strings define color pickers,
- `{ type: "select", options: [...] }` defines segmented/dropdown selectors,
- `{ type: "pad" }` defines 2D XY pads (ideal for 3D Scheimpflug tilt $(\theta_x, \theta_y)$ and spray nozzle direction),
- `{ type: "spring", visualDuration, bounce }` / `{ type: "easing", duration, ease }` defines interactive spring/bezier curves,
- `{ type: "action" }` triggers one-shot actions (`Re-Seed`, `Spray Burst`, `Export Package JSON`), and
- nested objects create collapsible inspector folders with built-in preset management and JSON export.

```ts
// Shared Declarative Jig Config (Runs in DialKit on Web AND maps 1:1 to macOS SwiftUI / VisionDial)
export const BioTypeJigSchema = {
  stage1_structure3D: {
    mode: { type: "select", options: ["voronoi-truss-3d", "laguerre-pack-3d", "xpbd-inflate-3d", "diff-growth-3d"] },
    coreCellDensity: [12, 6, 28, 1],
    contourAnchorStiffness: [0.88, 0.0, 1.0, 0.02],
    corticalHaloWidth: [22, 0, 48, 1],
    zStratificationMm: [3.5, 0.0, 8.0, 0.25],
    turgorPressureBar: [1.35, 0.2, 3.0, 0.05],
    brushTool: { type: "select", options: ["grab-3d", "pinch", "inflate", "z-extrude", "pin-contour", "draw-spine", "spray-media"] },
    brushRadiusPx: [65, 15, 180, 5]
  },
  stage2_glyphSkeleton: {
    corridorRecruitmentPx: [20, 8, 42, 1],
    spineTubeRadiusMm: [2.8, 0.8, 6.5, 0.2],
    attachOrganType: { type: "select", options: ["meristem-bud", "septa-gate", "anastomosis-hub", "spore-eruptor"] },
    clearDrawnSpines: { type: "action" }
  },
  stage3_colonizationAndSpecies: {
    colonizationMode: { type: "select", options: ["grow-along-skeleton", "spray-media-to-stick", "hybrid-both"] },
    sprayMeniscusAdhesion: [0.82, 0.1, 1.0, 0.02],
    sprayNozzleTilt: { type: "pad" },
    species1_LIFE_Plant: {
      font: { type: "select", options: ["Corben-Bold", "Fraunces-Soft-900", "Calistoga"] },
      speedMultiplier: [0.45, 0.10, 1.50, 0.05],
      vacuoleTurgor: [0.84, 0.20, 1.00, 0.02],
      celluloseWallPx: [2.2, 0.8, 5.0, 0.2],
      outgrowthLeashPx: [14, 0, 60, 2],
      chlorophyllColor: "#4ade80"
    },
    species2_FINDSA_Vascular: {
      font: { type: "select", options: ["Berkshire-Swash", "Cormorant-Garamond-Italic"] },
      speedMultiplier: [1.35, 0.40, 2.50, 0.05],
      hollowLumenRatio: [0.58, 0.20, 0.85, 0.02],
      septaRungDensity: [0.78, 0.00, 1.00, 0.02],
      anastomosisBridgeRate: [0.74, 0.00, 1.00, 0.02],
      outgrowthLeashPx: [24, 0, 80, 2],
      arteryColor: "#f5e6a8"
    },
    species3_WAY_ChaoticSwarm: {
      font: { type: "select", options: ["Barriecito", "Rubik-Spray-Paint"] },
      speedMultiplier: [2.80, 1.00, 5.00, 0.10],
      chemotaxisSensorGain: [0.86, 0.10, 1.00, 0.02],
      pseudopodSpikePx: [6.5, 0.0, 16.0, 0.5],
      dishWebSpillPx: [48, 0, 140, 2],
      swarmTipColor: "#33ff66"
    }
  },
  stage4_cocLensAndMaterial: {
    opticalLook: {
      type: "select",
      options: [
        "rheinberg_split", "darkfield_huddi", "botanical_parenchyma",
        "epifluorescence_2ch", "dic_nomarski_prism", "phase_contrast_airy",
        "crossed_polars_lut", "goo_sss_orange_gel", "agar_colony_plates"
      ]
    },
    focalPlaneZ0Mm: [0.4, -8.0, 8.0, 0.1],
    scheimpflugTiltXY: { type: "pad" },
    numericalApertureNA: [0.85, 0.15, 1.40, 0.05],
    ringBokehInnerRatio: [0.62, 0.00, 0.85, 0.02],
    axialChromaticLoCA: [0.44, 0.00, 1.00, 0.02],
    focusTrackingMode: { type: "select", options: ["manual-dial", "auto-track-growth-tip", "human-focus-hunt"] },
    focusHuntSpring: { type: "spring", visualDuration: 0.45, bounce: 0.35 },
    exportBioTypePackageJSON: { type: "action" }
  }
};
```

### 5.2 Modular Tool Packaging (`BioTypePackage.v1.json`)
Every structure, hand-drawn glyph skeleton, species anatomy configuration, CoC lens setting, and material palette serializes into a single portable `BioTypePackage.v1.json` file that can be loaded in:
1. **`@biotype/web-studio`** (Browser WebGL2/Canvas2D + Josh Puckett `DialKit` v2.0.2), and
2. **`Protozoa` macOS Native App** (`SwiftUI` inspector + `Metal` compute kernels + `ProtozoaControl` hardware rotary knobs / `VisionDial` optical fiducial dials).
