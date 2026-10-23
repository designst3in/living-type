# Kernel panic: Game-of-Life CRT that boots into the words, then crashes (`kernel-panic`)

> An amber CRT running Conway's Life. Soup patches seed chaos, the rules are biased so live cells settle into the two-line phrase, it holds with a flicker, then it crashes: blocks, horizontal tears, stuck pixels, red panic. Clip: `crt-c4-kernel-panic` ("kernel panic", VT323, two lines). Source: `visuals/glab/src/kernel_panic.py`, finishing via `clipkit.py`.

## 1. What it is
Life as an unreliable display: the "kernel" (the word) is the attractor of a biased B3/S23 CA, and the crash is a scripted failure curve. It's the only non-biological glab system, and the cheapest.

## 2. How it works
**Grid:**
- Output N 1080, cell size `CS = 6`, so `G = 180` cells.
- Mask `M` from `phrase_mask` at width 0.80G: lines at y 0.30G and 0.60G, threshold 110.
- `near` = M dilated (proximity band).

**Seeds:** soup discs (rng 7, density 0.42) at (y 0.50G, x 0.30G, r 22), (0.22G, 0.78G, r 13), (0.80G, 0.62G, r 12).

**Step (2 substeps per frame):**
- `n` = Moore neighbour count, `r` = U(0, 1) per cell, `L_bias = sm((arc − 0.3)/0.6)` (arc = legibility arc).
- **born** = `(n == 3) & (r > 0.9·L·¬near)` | `(M & n ≥ 1 & r < 0.55L)` | `(M & r < 0.012L)` | `(r < 0.00015(1 − L))` (rare spontaneous births).
- **keep** = `((n == 2) | (n == 3)) & ¬(¬near & r < 0.22L)` | `(M & r < 0.35 + 0.6L)`.
- **Hold flicker:** `M & rand < 0.045L` dies.
- **Panic death:** p = `0.08·crash`.
- **Trails:** `D` (dead afterglow) decays ×0.93; per-cell `age`.

**Crash curve:** `crash_at(u) = 0.45·sm((u − 0.80)/0.10) + 0.55·sm((u − 0.92)/0.06)`.

**Render:**
- Cells as 6 px squares with a 1-px gap; glow `G₅·0.55 + G₁₄·0.25`; stale 4×4 dead-cell blocks.
- Crash effects scale with c: blocks `4 + 26c`, tears `3 + 14c` rows with dx N(0, 90c), 90 stuck pixels (rng 99), amber → RED tint.
- Scanlines (`rows[2::3] = 0.72`), rolling band, noise 0.012. AMB `#ffb020`, RED `#ff3b30`.

Cache `/tmp/kp_cache/` (A, D, age, M as .npy).

**Lifecycle:** spawn (soup + rare births) → seek (biased births on M as L rises) → lock-on (the mask becomes a still life with a flicker) → hold → crash (decay as a failure, not an eat).

## 3. Glyph coupling (GlyphSource)
| Product | Used? | How |
|---|---|---|
| mask | **yes** | at cell resolution (180²), births/survival bias |
| near band | yes (dilated mask ≈ sdf band) | suppresses births far from the word |
| layout (2 lines) | **yes** | `phrase_mask` line positions |
| others | no | – |

**Replaced font / stroke / SVG:** any mask downsampled to cells. Fine detail below 6 px is lost by design; VT323/pixel fonts are ideal. Hand strokes work if ≥ 2 cells thick.

## 4. Controls & parameters
| Param | Type / range | Default | Unit | What it does | Exposed to jig? |
|---|---|---|---|---|---|
| ★ cell size `CS` | px | 6 | px | CRT resolution | proposed `cellSize` |
| ★ `legibility` (L_bias) | 0..1 | `sm((arc − 0.3)/0.6)` | – | word attraction | H7 |
| soup density / discs | – | 0.42, 3 discs | – | starting chaos | proposed `soup` |
| birth bias on M | p | `0.55L`, `0.012L` | – | how fast the word fills | internal |
| keep on M | p | `0.35 + 0.6L` | – | word stability | internal |
| ★ hold flicker | p | `0.045L` | – | living-word shimmer | proposed `flicker` |
| ★ crash curve | u | 0.80 (+0.10), 0.92 (+0.06) | u | when it panics | proposed `crashAt` |
| crash FX | counts | blocks 4 + 26c, tears 3 + 14c, 90 stuck | – | failure look | internal |
| afterglow | ×/step | 0.93 | – | phosphor persistence | proposed `phosphor` |
| palette | hex | AMB `#ffb020`, RED `#ff3b30` | – | CRT colour | palette |

## 5. Timeline / arc
Emergent CA under the arc plus the keyed crash curve. Two substeps per frame.

## 6. Camera & optics
No microscope. CRT model: scanlines, glow, rolling band, noise. Not [`optics.md`](systems/glab/optics.md) (no DOF).

## 7. Performance & tiers
- **Box CPU:** CA < 1 s total, ≈0.7 s/frame render (README). Cheap.
- **GPU [est]:** trivial. 180² CA + full-res composite.
- **Tiers [est]:** all devices full quality; A12 drops G₁₄ glow.

## 8. Port to macOS Swift/Metal
**Buffers:** `kpCells` `r8Uint` ×2 (ping-pong), `kpAfter` `r16Float`, `kpAge`; mask at G².

**Kernels:**
1. `kpLife` (Moore count + biased rules, Philox RNG per cell/step).
2. `kpCRT` fragment (cells, gaps, glow mip, scanlines, crash FX from uniforms + seeded hash).

**Hooks:** H1 tick, H3 gating (crash as gating), H4 snapshot (cells), H5 composite or H6 `PostPass` (CRT pass), H7 (proposed `cellSize, flicker, crashAt, phosphor`). The jig's `lifeStep` (`PaintSim+Life.swift:156`, local `ea48744`) is the nearest CA pattern. Proposed per doc 42 §2.3.

**Portable:** exactly. **Rewrite:** numpy RNG → per-cell hash (determinism differs, acceptable).

## 9. Known gaps & next refinement
- The hold flicker is subtle.
- The 'boot' label is placeholder.
- No sound (template has no audio slot).

## 10. Files & clips
`visuals/glab/src/kernel_panic.py`, `clipkit.py`; cache `/tmp/kp_cache/`; clip `visuals/glab/looks/crt-c4-kernel-panic*` (+ `-m`, poster, contact). Refs: INVENTORY §7.
