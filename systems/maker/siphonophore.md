# Siphonophore colony chain (`siphonophore`)

> Each dot element of a dot-matrix font is one zooid; dots in a letter are linked into a stem graph that grows from a float, buds zooids that mature down the stem, then the colony swims (bells pulse) and fishes (tentacles out). Clips: `colony` (Handjet wght 300 · Element Grid 1 · Element Shape 8). Source: `visuals/maker/species/siphonophore-chain/siphonophore.py`, `siphonophore_clip.py`

Paths are relative to the living-type project root.

## 1. What it is
Physonect siphonophore (*Nanomia bijuga*): one colony of clonal zooids on a stem; pneumatophore (float) at the anterior end, nectophores (swimming bells), then repeating cormidia (gastrozooids with tentacles, bracts, palpons, gonophores). New zooids bud near the float and mature as they move down. Darkfield HUDDI.

## 2. How it works
- **State** (`siphonophore.py:build`): mask via `word_mask_tracked` (Handjet, `TRACK = 0.88`, `WIDTH = 0.92`, per-letter id map `lid`); dots = connected components of the mask → centroids `P[n]`; `r0 = √(median dot area/π)`; `sp` = median nearest-neighbour distance; edges = same-letter pairs within `1.5·sp`, shortest first, skipping any pair that would close a triangle (`nb[a] & nb[b]`), giving a tree-ish stem graph; components `comp`; per component float = argmin of `y + 0.05x` (top-left); BFS from float gives `depth`, `parent`, `order = depth/maxdepth`. Zooid type by depth: 0 float, 1–3 nectophore, then alternating bract/gastrozooid. Mid-stem zooids `M` on every edge (palpon or gonophore by parity).
- **Renderer** (`render_state(B, st)`): `st` = `mat[n]` (−1 absent, 0..1), `mmat[M]`, `stem[E]` (fraction drawn from the anterior end), `stem_w`, `t`, `swim`, `tent`, `offset`. Buds (`m < 0.35`) are small discs; then per type: float (tall ellipse + green apical pore), nectophore (pulse `1 − 0.13·swim·(0.5 + 0.5 sin(2π(1.6t + 0.3ph + 0.18·depth)))`, metachronal along depth), bract, gastrozooid (wiggle, tentacle with tentilla, extension `tent·min(1, (m−0.6)/0.4)`).
- **Keyframes** (`siphonophore_clip.py`): budding time `tb = 0.6 + 3.6·order`; maturity `ss(0, 1.5, t − tb)`; float `ss(0, 0.8, t)`; stem edge fraction from normalised time between its endpoint orders; after `T_LIVE = 5.0 s` swim on, tentacles 0.55 → 1.0, colony drifts (offset sinusoid + upward 4 px).
- **Randomness / seeds:** 7 (zooid attributes, textures), 7000 + i (finish).
- **Lifecycle:** float → stem budding by BFS order → maturation → live (swim + fish). No decay.

## 3. Glyph coupling (GlyphSource)
Needs a **dot-matrix glyph**: reads `mask` and its connected components (each dot = a node), per-letter ids (edges only within a letter). Not used: SDF, skeleton, counters, direction field, legibility module. To swap fonts, use any dot/grid font, or sample points along a skeleton/vector path at spacing `sp` (a PencilKit stroke resampled to dots gives the stem order for free: stroke start = float).

## 4. Controls & parameters
| Param | Type / range | Default | Unit | What it does | Exposed to jig? |
|---|---|---|---|---|---|
| **`T_S0`, `T_S1`** (hero knob) | s | 0.6, 4.2 | s | budding sweep down the stem | Director (proposed) |
| **`T_LIVE`** (hero knob) | s | 5.0 | s | switch to real-time swimming | Director (proposed) |
| **`TRACK`, `WIDTH`** (hero knob) | ×, frame | 0.88, 0.92 | – | layout of the dot word | proposed (GlyphField) |
| **swim pulse** (hero knob) | Hz, amp | 1.6 Hz, 0.13 | – | bell pulse | proposed |
| `T_MAT`, `T_F` | s | 1.5, 0.8 | s | zooid / float maturation | – |
| edge radius | ×sp | 1.5 | – | stem link distance | – |
| depth → type | – | 0 float, ≤3 necto, then bract/gastro | – | cormidium pattern | – |
| legibility | – | not in code | – | – | – |

## 5. Timeline / arc
8 s keyframed: protozooid + float → stem budding 0.6–4.2 s → cormidia maturing → 5.0 s real-time swim/fish.

## 6. Camera & optics
Darkfield HUDDI; plane `|0.55x + 0.45y − 0.46|·2.4`, back layer (bracts, tentacles) +0.75. Ink rims, cream gastrozooids/tentilla, green float pore + gonophores. Scale 2 mm.

## 7. Performance & tiers
Box: ~150–300 zooids, ~1–2 s/frame. [est] trivial on all tiers (instanced ellipses + lines).

## 8. Port to macOS Swift/Metal
Buffers: node buffer (P, depth, order, type, parent), edge buffer, mid buffer. Kernels: instanced zooid sprites (procedural ellipse SDFs by type in fragment shader), stem lines, tentacle polylines in a vertex shader. CPU once per text: components, graph, BFS. Hooks: none real; proposed H5/H6 render pass, H7 `LivingTypeKnobs` (budWindow, liveAt, swimHz). Portable as-is.

## 9. Known gaps & next refinement
- Only works on dot fonts; no general resampler yet.
- Zooids don't move along the stem (budding is in place).
- No legibility knob.

## 10. Files & clips
- `visuals/maker/species/siphonophore-chain/siphonophore.py`, `siphonophore_clip.py`; font `visuals/fontcast/fonts/Handjet.ttf`.
- Clip `siphonophore-colony-clip.mp4` 2.6 MiB / `-m` 0.3 MiB; stills `siphonophore-1-forming.png`, `-2-formed.png`.
