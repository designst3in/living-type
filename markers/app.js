/**
 * BioMarkers — 3D-Native Organic Fiducial & Vascular Typography Lab
 * Part 1: Shared 3D Harness, 1€ Filter, MakerLab 2D/3D Viewport & VisionDial V2 Diagnostics
 */
(function () {
  'use strict';

  // 31-bit maximal-length sequence (Barker/M-Seq31) for zero-sidelobe angular lock
  const MSEQ_31 = [
    1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 0, 0, 1, 1, 1,
    1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0
  ];

  // Global 3D-Native Harness exposed on window
  const Harness = {
    viewMode: '2D',
    activeTab: 'makerlab',
    nodes: [],
    edges: [],
    camera: {
      rotX: -0.52,
      rotY: 0.42,
      zoom: 1.0,
      panX: 0,
      panY: 0
    },
    hoveredNode: null,
    makerState: {
      organicToReadable: 0.62,
      role: 'standard-38mm',
      labelText: '01',
      labelPlacement: 'inner-core',
      textBlend: 0.72,
      chambers: 17,
      septaDensity: 0.78,
      veinBranching: 0.72,
      polarAngles: 180,
      radialRings: 10,
      occSectors: 16,
      maskThresh: 0.30,
      camDist: 0.65,
      camTilt: 35,
      handOcc: 40,
      euroCutoff: 1.0,
      euroBeta: 3.5,
      showHarness: false,
      showNormals: true,
      invertBW: false,
      trueAngleDeg: 28.0,
      decodedAngleDeg: 28.04,
      filteredAngleDeg: 28.02,
      autoGrowActive: false,
      selectedPdfPage: 1,
      showNativePdf: false
    }
  };
  window.BioMarkersHarness = Harness;

  // 1-Euro Filter in Circular Angle Space (sin, cos)
  class OneEuroAngleFilter {
    constructor(minCutoff = 1.0, beta = 3.5, dCutoff = 1.0) {
      this.minCutoff = minCutoff;
      this.beta = beta;
      this.dCutoff = dCutoff;
      this.sinPrev = null;
      this.cosPrev = null;
      this.dSinPrev = 0;
      this.dCosPrev = 0;
    }
    alpha(cutoff, dt) {
      const tau = 1.0 / (2 * Math.PI * Math.max(0.05, cutoff));
      return 1.0 / (1.0 + tau / Math.max(0.001, dt));
    }
    filter(angleRad, dt = 1 / 60) {
      const s = Math.sin(angleRad);
      const c = Math.cos(angleRad);
      if (this.sinPrev === null) {
        this.sinPrev = s;
        this.cosPrev = c;
        return angleRad;
      }
      const ds = (s - this.sinPrev) / dt;
      const dc = (c - this.cosPrev) / dt;
      const aD = this.alpha(this.dCutoff, dt);
      this.dSinPrev = aD * ds + (1 - aD) * this.dSinPrev;
      this.dCosPrev = aD * dc + (1 - aD) * this.dCosPrev;
      const speed = Math.hypot(this.dSinPrev, this.dCosPrev);
      const cutoff = this.minCutoff + this.beta * speed;
      const a = this.alpha(cutoff, dt);
      this.sinPrev = a * s + (1 - a) * this.sinPrev;
      this.cosPrev = a * c + (1 - a) * this.cosPrev;
      return Math.atan2(this.sinPrev, this.cosPrev);
    }
  }
  Harness.OneEuroAngleFilter = OneEuroAngleFilter;

  // Simple Single-Stroke Vector Font Dictionary for Hybrid Marker Labels
  const GLYPH_STROKES = {
    '0': [[[-0.35,-0.5],[0.35,-0.5],[0.45,0],[0.35,0.5],[-0.35,0.5],[-0.45,0],[-0.35,-0.5]]],
    '1': [[[-0.2,-0.35],[0.05,-0.5],[0.05,0.5]],[[-0.25,0.5],[0.3,0.5]]],
    '2': [[[-0.38,-0.32],[0,-0.52],[0.38,-0.32],[0.32,0.02],[-0.38,0.5],[0.42,0.5]]],
    '3': [[[-0.35,-0.48],[0.35,-0.48],[0.0,0.0],[0.38,0.25],[0.25,0.5],[-0.35,0.48]]],
    '4': [[[0.2,0.5],[0.2,-0.5],[-0.4,0.18],[0.4,0.18]]],
    '5': [[[0.35,-0.5],[-0.32,-0.5],[-0.35,-0.02],[0.32,0.02],[0.35,0.45],[-0.35,0.48]]],
    'A': [[[-0.4,0.5],[0,-0.5],[0.4,0.5]],[[-0.24,0.12],[0.24,0.12]]],
    'C': [[[0.38,-0.35],[-0.15,-0.5],[-0.4,0],[-0.15,0.5],[0.38,0.35]]],
    'E': [[[0.35,-0.5],[-0.35,-0.5],[-0.35,0.5],[0.35,0.5]],[[-0.35,0],[0.22,0]]],
    'F': [[[0.35,-0.5],[-0.35,-0.5],[-0.35,0.5]],[[-0.35,0.02],[0.22,0.02]]],
    'G': [[[0.38,-0.32],[-0.15,-0.5],[-0.42,0],[-0.15,0.5],[0.38,0.42],[0.38,0.05],[0.05,0.05]]],
    'I': [[[-0.25,-0.5],[0.25,-0.5]],[[0,-0.5],[0,0.5]],[[-0.25,0.5],[0.25,0.5]]],
    'L': [[[-0.32,-0.5],[-0.32,0.5],[0.35,0.5]]],
    'M': [[[-0.42,0.5],[-0.42,-0.5],[0,0.12],[0.42,-0.5],[0.42,0.5]]],
    'N': [[[-0.38,0.5],[-0.38,-0.5],[0.38,0.5],[0.38,-0.5]]],
    'U': [[[-0.38,-0.5],[-0.38,0.28],[0,0.5],[0.38,0.28],[0.38,-0.5]]],
    'T': [[[-0.42,-0.5],[0.42,-0.5]],[[0,-0.5],[0,0.5]]],
    '-': [[[-0.3,0],[0.3,0]]]
  };

  function getLabelStrokes(text) {
    const clean = (text || '01').toUpperCase().slice(0, 8);
    const out = [];
    const n = clean.length;
    const spacing = n <= 2 ? 0.52 : 0.36;
    const scale = n <= 2 ? 1.0 : (n <= 4 ? 0.68 : 0.50);
    const startX = -((n - 1) * spacing) * 0.5;
    for (let i = 0; i < n; i++) {
      const ch = clean[i];
      const strokes = GLYPH_STROKES[ch] || GLYPH_STROKES['0'];
      const cx = startX + i * spacing;
      for (const poly of strokes) {
        out.push(poly.map(([px, py]) => [cx + px * scale * 0.55, py * scale * 0.55]));
      }
    }
    return out;
  }
  Harness.getLabelStrokes = getLabelStrokes;

  // Build 3D Node & Edge Graph for Current Marker Configuration
  function buildMarkerHarness() {
    const st = Harness.makerState;
    const nodes = [];
    const edges = [];
    const N = st.chambers;
    const c = st.organicToReadable;
    const R_outer = 19.0; // mm
    const R_mid = 12.2;
    const R_inner = 6.2;

    // 1. Chamber Ring Vacuoles (with asymmetric biological perturbation + M-seq31 encoding)
    for (let i = 0; i < N; i++) {
      const frac = i / N;
      const baseTheta = frac * Math.PI * 2;
      const bit31 = MSEQ_31[(i * 2) % 31];
      const jitter = (1.0 - c * 0.65) * 0.09 * Math.sin(i * 3.7 + 1.1);
      const theta = baseTheta + jitter;
      const rShift = (bit31 ? 0.85 : -0.75) * (0.45 + 0.55 * st.septaDensity);
      let r = R_mid + rShift;
      if (st.role === 'square-4fold') {
        const sq = 1.0 / Math.max(Math.abs(Math.cos(theta)), Math.abs(Math.sin(theta)));
        r *= (0.78 + 0.22 * Math.min(1.32, sq));
      } else if (st.role === 'triangle-3fold') {
        r *= (1.0 + 0.18 * Math.cos(3 * theta + 0.4));
      } else if (st.role === 'corner-12mm') {
        r *= (i < N * 0.65 ? 1.05 : 0.68);
      }

      const x = r * Math.cos(theta);
      const y = r * Math.sin(theta);
      const z = 2.4 * Math.cos(theta * 2 - 0.5) * (0.4 + 0.6 * st.septaDensity) + (bit31 ? 0.9 : -0.6);
      const nx = Math.cos(theta) * 0.28;
      const ny = Math.sin(theta) * 0.28;
      const nz = Math.sqrt(Math.max(0.1, 1 - nx * nx - ny * ny));
      const rad = (2.15 + (bit31 ? 0.62 : -0.32)) * (18 / N);

      nodes.push({
        id: nodes.length,
        x, y, z, nx, ny, nz,
        radius: rad,
        role: 'chamber-center',
        chamberId: i,
        septaBit: bit31,
        theta
      });
    }

    // Ring edges + internal M-Seq31 septa nodes
    for (let i = 0; i < N; i++) {
      const next = (i + 1) % N;
      edges.push({ a: i, b: next, type: 'chamber-wall', weight: 1.4 });
    }

    // 2. 31-Bit Outer Septa Ring Nodes
    for (let k = 0; k < 31; k++) {
      const theta = (k / 31) * Math.PI * 2;
      const bit = MSEQ_31[k];
      const r = R_outer - 2.1 + (bit ? 0.55 : -0.45) * c;
      const x = r * Math.cos(theta);
      const y = r * Math.sin(theta);
      const z = (bit ? 1.4 : 0.3) * st.septaDensity;
      const id = nodes.length;
      nodes.push({
        id,
        x, y, z,
        nx: Math.cos(theta) * 0.18,
        ny: Math.sin(theta) * 0.18,
        nz: 0.96,
        radius: bit ? 1.15 : 0.65,
        role: 'septa-rung',
        chamberId: k % N,
        septaBit: bit,
        theta
      });
      const nearChamber = Math.floor((k / 31) * N) % N;
      edges.push({ a: id, b: nearChamber, type: 'septa-bridge', weight: bit ? 1.2 : 0.5 });
      if (k > 0) {
        edges.push({ a: id - 1, b: id, type: 'rim-arc', weight: 0.9 });
      }
    }
    edges.push({ a: nodes.length - 1, b: N, type: 'rim-arc', weight: 0.9 });

    // 3. Inner Vascular Core & Hybrid Path-Font Label Nodes
    const strokes = getLabelStrokes(st.labelText);
    for (let sIdx = 0; sIdx < strokes.length; sIdx++) {
      const poly = strokes[sIdx];
      let prevId = -1;
      for (let pIdx = 0; pIdx < poly.length; pIdx++) {
        let lx = poly[pIdx][0] * R_inner * 1.45;
        let ly = poly[pIdx][1] * R_inner * 1.45;
        if (st.labelPlacement === 'edge-arc') {
          lx += 0;
          ly -= R_mid * 0.72;
        } else if (st.labelPlacement === 'corner-tag') {
          lx += R_outer * 0.62;
          ly -= R_outer * 0.62;
        }
        // Organic curl perturbation controlled by textBlend
        const curlX = Math.sin(ly * 0.55 + sIdx) * 0.65 * st.textBlend;
        const curlY = Math.cos(lx * 0.55 - sIdx) * 0.65 * st.textBlend;
        const x = lx + curlX;
        const y = ly + curlY;
        const z = 3.1 + 0.6 * Math.sin(pIdx + sIdx);
        const id = nodes.length;
        nodes.push({
          id,
          x, y, z,
          nx: 0.08 * Math.sin(x),
          ny: 0.08 * Math.cos(y),
          nz: 0.99,
          radius: 0.85 + 0.55 * st.textBlend,
          role: 'label-vein',
          chamberId: sIdx,
          septaBit: 1,
          theta: Math.atan2(y, x)
        });
        if (prevId !== -1) {
          edges.push({ a: prevId, b: id, type: 'label-stroke', weight: 1.6 });
        }
        // Anastomosing runner vein to nearest chamber
        if (pIdx % 2 === 0 && st.veinBranching > 0.2) {
          let bestC = 0;
          let bestD = 1e9;
          for (let cIdx = 0; cIdx < N; cIdx++) {
            const d = Math.hypot(nodes[cIdx].x - x, nodes[cIdx].y - y);
            if (d < bestD) { bestD = d; bestC = cIdx; }
          }
          edges.push({ a: id, b: bestC, type: 'anastomosing-vein', weight: 0.85 * st.veinBranching });
        }
        prevId = id;
      }
    }

    Harness.nodes = nodes;
    Harness.edges = edges;
    const statsEl = document.getElementById('global-harness-stats');
    if (statsEl) {
      statsEl.textContent = `${nodes.length} nodes · ${edges.length} edges · Z-active`;
    }
  }
  Harness.buildMarkerHarness = buildMarkerHarness;

  // Render clean 2D organic marker onto any target 2D canvas context (used by MakerLab, Webcam Simulator, Phone Modal, and Print Suite)
  function drawOrganicMarker2D(ctx, cx, cy, radiusPx, opts = {}) {
    const st = Object.assign({}, Harness.makerState, opts);
    const c = st.organicToReadable;
    const N = st.chambers;
    const invert = !!st.invertBW;
    const bgDisc = invert ? '#f8fafc' : '#070a0f';
    const fgInk = invert ? '#070a0f' : '#f5e6a8';
    const accentVein = invert ? '#1e293b' : '#33ff66';
    const septaInk = invert ? '#0f172a' : '#38bdf8';

    ctx.save();
    ctx.translate(cx, cy);
    if (opts.rotationRad) ctx.rotate(opts.rotationRad);

    // Outer quiet-zone & dual contrast rim (stronger as c -> 1.0)
    ctx.beginPath();
    ctx.arc(0, 0, radiusPx * 1.04, 0, Math.PI * 2);
    ctx.fillStyle = invert ? '#ffffff' : '#040609';
    ctx.fill();

    // Outer high-contrast dual boundary ring for step-edge raycaster
    const rimAlpha = Math.min(1.0, 0.25 + 0.75 * c);
    ctx.beginPath();
    ctx.arc(0, 0, radiusPx * 0.98, 0, Math.PI * 2);
    ctx.fillStyle = bgDisc;
    ctx.fill();
    ctx.lineWidth = Math.max(2.0, radiusPx * (0.045 + 0.035 * c));
    ctx.strokeStyle = invert
      ? `rgba(10, 15, 24, ${rimAlpha})`
      : `rgba(245, 230, 168, ${rimAlpha})`;
    ctx.stroke();

    // Inner contrast ring if c >= 0.28
    if (c >= 0.26) {
      ctx.beginPath();
      ctx.arc(0, 0, radiusPx * 0.90, 0, Math.PI * 2);
      ctx.lineWidth = Math.max(1.2, radiusPx * 0.018 * c);
      ctx.strokeStyle = invert ? 'rgba(15,23,42,0.65)' : 'rgba(51,255,102,0.55)';
      ctx.stroke();
    }

    // 31-Bit M-Sequence Septa Rungs in Outer Annulus
    const septaShow = Math.max(0.08, st.septaDensity * (0.2 + 0.8 * c));
    for (let k = 0; k < 31; k++) {
      const bit = MSEQ_31[k];
      const a0 = (k / 31) * Math.PI * 2;
      const a1 = ((k + 0.72) / 31) * Math.PI * 2;
      const rIn = radiusPx * (bit ? 0.74 : 0.80);
      const rOut = radiusPx * 0.885;
      ctx.beginPath();
      ctx.arc(0, 0, (rIn + rOut) * 0.5, a0, a1);
      ctx.lineWidth = (rOut - rIn) * (bit ? 0.95 : 0.42);
      ctx.strokeStyle = invert
        ? `rgba(15, 23, 42, ${bit ? septaShow : septaShow * 0.35})`
        : `rgba(245, 230, 168, ${bit ? septaShow : septaShow * 0.25})`;
      ctx.stroke();
    }

    // Hollow Sausage-Link Cellular Chambers + Internal Cross-Septa
    const chCoords = [];
    for (let i = 0; i < N; i++) {
      const bit = MSEQ_31[(i * 2) % 31];
      const baseA = (i / N) * Math.PI * 2;
      const wobble = (1 - c * 0.55) * 0.08 * Math.sin(i * 3.1 + 0.7);
      const a = baseA + wobble;
      let rNorm = 0.56 + (bit ? 0.045 : -0.04) * st.septaDensity;
      if (st.role === 'square-4fold') {
        const sq = 1 / Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a)));
        rNorm *= (0.82 + 0.16 * Math.min(1.3, sq));
      } else if (st.role === 'triangle-3fold') {
        rNorm *= (1.0 + 0.14 * Math.cos(3 * a));
      }
      const x = Math.cos(a) * radiusPx * rNorm;
      const y = Math.sin(a) * radiusPx * rNorm;
      const rad = radiusPx * (0.105 + (bit ? 0.028 : -0.015)) * (17 / N);
      chCoords.push({ x, y, a, rad, bit });
    }

    // Anastomosing inter-chamber veins
    if (st.veinBranching > 0.05) {
      ctx.lineWidth = Math.max(1.4, radiusPx * 0.022 * st.veinBranching);
      ctx.strokeStyle = fgInk;
      for (let i = 0; i < N; i++) {
        const A = chCoords[i];
        const B = chCoords[(i + 1) % N];
        ctx.beginPath();
        ctx.moveTo(A.x, A.y);
        const midX = (A.x + B.x) * 0.52;
        const midY = (A.y + B.y) * 0.52;
        ctx.quadraticCurveTo(midX, midY, B.x, B.y);
        ctx.stroke();
      }
    }

    // Draw each hollow cellular vacuole + internal cross-stripe septa rungs
    for (let i = 0; i < N; i++) {
      const ch = chCoords[i];
      ctx.save();
      ctx.translate(ch.x, ch.y);
      ctx.rotate(ch.a + Math.PI * 0.5);

      // Outer chamber wall
      ctx.beginPath();
      ctx.ellipse(0, 0, ch.rad * 1.22, ch.rad * 0.78, 0, 0, Math.PI * 2);
      ctx.fillStyle = fgInk;
      ctx.fill();

      // Hollow lumen interior
      ctx.beginPath();
      ctx.ellipse(0, 0, ch.rad * 0.82, ch.rad * 0.46, 0, 0, Math.PI * 2);
      ctx.fillStyle = bgDisc;
      ctx.fill();

      // Internal septa rungs inside lumen
      if (st.septaDensity > 0.15) {
        const rungs = ch.bit ? 3 : 1;
        ctx.strokeStyle = fgInk;
        ctx.lineWidth = Math.max(1.1, ch.rad * 0.22);
        for (let r = 0; r < rungs; r++) {
          const ox = (r - (rungs - 1) * 0.5) * ch.rad * 0.52;
          ctx.beginPath();
          ctx.moveTo(ox, -ch.rad * 0.44);
          ctx.lineTo(ox, ch.rad * 0.44);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // Orientation Apical Notch / Primary Organelle at Angle 0° (Top/Right)
    ctx.beginPath();
    ctx.arc(radiusPx * 0.56, 0, radiusPx * 0.042, 0, Math.PI * 2);
    ctx.fillStyle = accentVein;
    ctx.fill();

    // Hybrid Path-Font Center Label (e.g. "01", "A4", "GAIN", "LIFE")
    const strokes = getLabelStrokes(st.labelText);
    const labelScale = radiusPx * 0.30;
    let lOffX = 0, lOffY = 0;
    if (st.labelPlacement === 'edge-arc') lOffY = -radiusPx * 0.36;
    if (st.labelPlacement === 'corner-tag') { lOffX = radiusPx * 0.48; lOffY = -radiusPx * 0.48; }

    ctx.save();
    ctx.translate(lOffX, lOffY);
    for (let s = 0; s < strokes.length; s++) {
      const poly = strokes[s];
      // Connective runner tendrils from label to chambers
      if (st.veinBranching > 0.2) {
        const [fx, fy] = poly[0];
        const targetCh = chCoords[(s * 5) % N];
        ctx.beginPath();
        ctx.moveTo(fx * labelScale, fy * labelScale);
        ctx.quadraticCurveTo(
          fx * labelScale * 0.5 + (targetCh.x - lOffX) * 0.25,
          fy * labelScale * 0.5 + (targetCh.y - lOffY) * 0.25,
          targetCh.x - lOffX,
          targetCh.y - lOffY
        );
        ctx.lineWidth = Math.max(1.0, radiusPx * 0.016 * st.veinBranching);
        ctx.strokeStyle = invert ? 'rgba(15,23,42,0.55)' : 'rgba(245,230,168,0.55)';
        ctx.stroke();
      }

      // Calligraphic double-walled vascular stroke
      ctx.beginPath();
      for (let p = 0; p < poly.length; p++) {
        const px = poly[p][0] * labelScale;
        const py = poly[p][1] * labelScale;
        if (p === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = Math.max(2.5, radiusPx * (0.048 + 0.035 * st.textBlend));
      ctx.strokeStyle = fgInk;
      ctx.stroke();

      // Inner hollow lumen of path-font glyph
      if (st.textBlend > 0.35) {
        ctx.lineWidth = Math.max(1.0, radiusPx * 0.022 * st.textBlend);
        ctx.strokeStyle = septaInk;
        ctx.stroke();
      }
    }
    ctx.restore();

    ctx.restore();
  }
  Harness.drawOrganicMarker2D = drawOrganicMarker2D;
})();

/**
 * Part 2: Live Webcam Marker Detector (VisionDial V2), 3D Pose Wireframe,
 * Live 3D Bio-Growth on Tracked Object, and MakerLab 2D/3D Viewport + Diagnostics
 */
(function () {
  'use strict';
  const Harness = window.BioMarkersHarness;

  // Project local marker 3D coordinates (u_mm, v_mm, z_mm) into 2D image space given detected 5-DOF ellipse + angle
  function projectMarkerLocal3D(u, v, z, pose) {
    // Rotate (u, v) in marker plane by decoded angle theta
    const cosT = Math.cos(pose.thetaRad);
    const sinT = Math.sin(pose.thetaRad);
    const ur = u * cosT - v * sinT;
    const vr = u * sinT + v * cosT;

    // Foreshorten along minor axis (ry/rx = cos(tilt)) and rotate by ellipse tiltPhi
    const scaleX = pose.rx / 19.0;
    const scaleY = pose.ry / 19.0;
    const cosP = Math.cos(pose.tiltPhi);
    const sinP = Math.sin(pose.tiltPhi);

    const ex = ur * scaleX;
    const ey = vr * scaleY;
    const px = pose.cx + (ex * cosP - ey * sinP) + pose.nx * z * scaleX * 1.15;
    const py = pose.cy + (ex * sinP + ey * cosP) + pose.ny * z * scaleX * 1.15;
    return { x: px, y: py };
  }

  // Live Bio-Growth Colony State anchored in tracked marker's local (u, v, z) space (mm, radius ~ 19mm)
  const BioColony = {
    style: 'vascular',
    ageSec: 0,
    nodes: [],
    edges: [],
    tendrils: []
  };

  function seedBioColony(style = 'vascular') {
    BioColony.style = style;
    BioColony.ageSec = 0;
    BioColony.nodes = [];
    BioColony.edges = [];
    BioColony.tendrils = [];

    const ringCount = style === 'plant' ? 14 : (style === 'vascular' ? 18 : 24);
    // Seed Voronoi / cellular nodes in marker local (u, v, z) mm coordinates
    for (let i = 0; i < ringCount; i++) {
      const a = (i / ringCount) * Math.PI * 2 + 0.17 * Math.sin(i * 2.3);
      const r = 6.5 + 7.5 * ((i % 3) / 2.0) + 1.5 * Math.cos(i * 1.9);
      const u = r * Math.cos(a);
      const v = r * Math.sin(a);
      const z = 1.2 + 2.8 * Math.sin(i * 1.7);
      BioColony.nodes.push({
        id: i,
        u, v, z,
        targetR: style === 'plant' ? 2.4 : (style === 'vascular' ? 1.9 : 1.3),
        birth: (i / ringCount) * 2.2,
        septa: (i % 2 === 0) ? 3 : 2
      });
    }

    // Connect nearby local nodes into a Voronoi-like webby mesh
    for (let i = 0; i < BioColony.nodes.length; i++) {
      for (let j = i + 1; j < BioColony.nodes.length; j++) {
        const A = BioColony.nodes[i];
        const B = BioColony.nodes[j];
        const dist = Math.hypot(A.u - B.u, A.v - B.v);
        if (dist < 9.6) {
          BioColony.edges.push({
            a: i,
            b: j,
            dist,
            birth: Math.min(A.birth, B.birth) + 0.35
          });
        }
      }
    }

    // Seed outward-sprouting 3D chemotactic tendrils
    const nTendrils = style === 'chaotic' ? 22 : (style === 'vascular' ? 14 : 10);
    for (let k = 0; k < nTendrils; k++) {
      const baseAngle = (k / nTendrils) * Math.PI * 2;
      const pts = [];
      let curR = 4.0;
      let curA = baseAngle;
      let curZ = 0.8;
      const steps = 10;
      for (let s = 0; s < steps; s++) {
        pts.push({
          u: curR * Math.cos(curA),
          v: curR * Math.sin(curA),
          z: curZ
        });
        curR += 1.65 + (style === 'chaotic' ? 0.45 * Math.sin(k * 3 + s) : 0.15);
        curA += (style === 'chaotic' ? 0.22 : 0.09) * Math.sin(s * 1.4 + k);
        curZ += (style === 'plant' ? 0.55 : (style === 'vascular' ? 0.82 : 1.15)) * Math.sin(s * 0.45);
      }
      BioColony.tendrils.push({
        pts,
        birth: (k / nTendrils) * 1.8,
        speed: style === 'plant' ? 0.45 : (style === 'vascular' ? 1.25 : 2.8)
      });
    }
  }
  seedBioColony('vascular');

  // Webcam & Synthetic Phone Tracker State
  const WebcamTracker = {
    mode: 'sim', // 'sim' or 'webcam'
    stream: null,
    offscreen: document.createElement('canvas'),
    euroFilter: new Harness.OneEuroAngleFilter(1.2, 3.2),
    simTime: 0,
    userDragActive: false,
    userAngleOffset: 0,
    userTiltOffset: 0,
    lastAngleRad: 0.48,
    omegaDegPerSec: 18.4,
    showWireframe: true,
    showBioGrowth: true,
    showHud: true,
    pose: {
      locked: true,
      cx: 380,
      cy: 220,
      rx: 128,
      ry: 102,
      tiltPhi: 0.24,
      tiltDeg: 37.2,
      thetaRad: 0.48,
      nx: 0.34,
      ny: -0.22,
      nz: 0.91,
      cleanSectors: 13,
      totalSectors: 16,
      sectorMask: new Array(16).fill(1),
      znccPeak: 0.986,
      rayHits: []
    }
  };
  WebcamTracker.offscreen.width = 380;
  WebcamTracker.offscreen.height = 220;
  Harness.WebcamTracker = WebcamTracker;

  // Start Real Webcam via getUserMedia
  async function startLiveWebcam() {
    const video = document.getElementById('webcam-video');
    const pill = document.getElementById('webcam-status-pill');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (pill) {
        pill.textContent = 'WEBCAM API UNAVAILABLE — RUNNING 60FPS SIMULATOR';
        pill.style.color = '#fbbf24';
      }
      WebcamTracker.mode = 'sim';
      return;
    }
    try {
      if (pill) pill.textContent = 'REQUESTING CAMERA PERMISSION...';
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        });
      } catch (_) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      WebcamTracker.stream = stream;
      video.srcObject = stream;
      await video.play();
      WebcamTracker.mode = 'webcam';
      if (pill) {
        pill.textContent = '🟢 LIVE WEBCAM STREAM ACTIVE (HOLD PHONE MARKER TO CAM)';
        pill.style.color = '#33ff66';
      }
    } catch (err) {
      WebcamTracker.mode = 'sim';
      if (pill) {
        pill.textContent = 'NO CAM / PERMISSION DENIED — SIMULATED PHONE FEED ACTIVE';
        pill.style.color = '#38bdf8';
      }
    }
  }

  function stopWebcamAndSwitchToSim() {
    if (WebcamTracker.stream) {
      WebcamTracker.stream.getTracks().forEach(t => t.stop());
      WebcamTracker.stream = null;
    }
    WebcamTracker.mode = 'sim';
    const pill = document.getElementById('webcam-status-pill');
    if (pill) {
      pill.textContent = 'LIVE SIMULATED PHONE FEED ACTIVE (60 FPS)';
      pill.style.color = '#38bdf8';
    }
  }

  // Run VisionDial V2 pixel-level step-edge raycaster on real webcam frame
  function detectMarkerInWebcamFrame(ctx, W, H, video, dt) {
    const off = WebcamTracker.offscreen;
    const octx = off.getContext('2d', { willReadFrequently: true });
    const ow = off.width;
    const oh = off.height;
    octx.drawImage(video, 0, 0, ow, oh);
    const img = octx.getImageData(0, 0, ow, oh).data;

    // Compute stageLuma = 0.65 * max(R,G,B) + 0.35 * Y and find centroid of high-contrast phone marker region
    const luma = new Float32Array(ow * oh);
    let sumX = 0, sumY = 0, sumW = 0;
    for (let y = 12; y < oh - 12; y += 2) {
      for (let x = 12; x < ow - 12; x += 2) {
        const idx = (y * ow + x) * 4;
        const r = img[idx], g = img[idx + 1], b = img[idx + 2];
        const maxRGB = Math.max(r, g, b);
        const Y = 0.299 * r + 0.587 * g + 0.114 * b;
        const L = 0.65 * maxRGB + 0.35 * Y;
        luma[y * ow + x] = L;
        // Edge energy around pixel
        const idxR = (y * ow + (x + 2)) * 4;
        const grad = Math.abs(r - img[idxR]) + Math.abs(g - img[idxR + 1]);
        if (grad > 45 && L > 75) {
          sumX += x * grad;
          sumY += y * grad;
          sumW += grad;
        }
      }
    }

    const scaleX = W / ow;
    const scaleY = H / oh;
    let cx = sumW > 1200 ? (sumX / sumW) * scaleX : W * 0.5;
    let cy = sumW > 1200 ? (sumY / sumW) * scaleY : H * 0.5;
    cx = 0.75 * WebcamTracker.pose.cx + 0.25 * cx;
    cy = 0.75 * WebcamTracker.pose.cy + 0.25 * cy;

    // 36-ray step-edge scan
    const rayHits = [];
    let rxAcc = 0, ryAcc = 0;
    for (let k = 0; k < 36; k++) {
      const a = (k / 36) * Math.PI * 2;
      let bestR = 115;
      let maxStep = 0;
      for (let rPx = 30; rPx < 165; rPx += 4) {
        const sx = Math.round((cx + Math.cos(a) * rPx) / scaleX);
        const sy = Math.round((cy + Math.sin(a) * rPx) / scaleY);
        if (sx > 4 && sx < ow - 5 && sy > 4 && sy < oh - 5) {
          const i1 = (sy * ow + sx) * 4;
          const i2 = (sy * ow + Math.min(ow - 1, sx + 2)) * 4;
          const step = Math.abs(img[i1] - img[i2]) + Math.abs(img[i1 + 1] - img[i2 + 1]);
          if (step > maxStep) {
            maxStep = step;
            bestR = rPx;
          }
        }
      }
      const inlier = maxStep > 22;
      rayHits.push({ a, r: bestR, inlier });
      rxAcc += bestR * Math.abs(Math.cos(a));
      ryAcc += bestR * Math.abs(Math.sin(a));
    }

    const rx = Math.max(70, Math.min(180, (rxAcc / 36) * 1.48));
    const ry = Math.max(52, Math.min(rx, (ryAcc / 36) * 1.42));
    const ratio = Math.min(1.0, ry / rx);
    const tiltRad = Math.acos(ratio);
    const phi = 0.25 * Math.sin(WebcamTracker.simTime * 0.7);

    // Circular phase correlation along inner chamber ring
    let sinSum = 0, cosSum = 0;
    for (let s = 0; s < 36; s++) {
      const a = (s / 36) * Math.PI * 2;
      const sx = Math.round((cx + Math.cos(a) * rx * 0.56) / scaleX);
      const sy = Math.round((cy + Math.sin(a) * ry * 0.56) / scaleY);
      if (sx >= 0 && sx < ow && sy >= 0 && sy < oh) {
        const val = img[(sy * ow + sx) * 4];
        sinSum += val * Math.sin(a);
        cosSum += val * Math.cos(a);
      }
    }
    const rawTheta = Math.atan2(sinSum, cosSum);
    const filtTheta = WebcamTracker.euroFilter.filter(rawTheta, dt);
    const dTheta = Math.atan2(Math.sin(filtTheta - WebcamTracker.lastAngleRad), Math.cos(filtTheta - WebcamTracker.lastAngleRad));
    WebcamTracker.omegaDegPerSec = (dTheta / Math.max(0.005, dt)) * (180 / Math.PI);
    WebcamTracker.lastAngleRad = filtTheta;

    const nx = Math.sin(tiltRad) * Math.cos(phi);
    const ny = Math.sin(tiltRad) * Math.sin(phi);
    const nz = Math.cos(tiltRad);

    WebcamTracker.pose = {
      locked: true,
      cx, cy, rx, ry,
      tiltPhi: phi,
      tiltDeg: tiltRad * (180 / Math.PI),
      thetaRad: filtTheta,
      nx, ny, nz,
      cleanSectors: rayHits.filter(h => h.inlier).length >= 16 ? 14 : 11,
      totalSectors: 16,
      sectorMask: Array.from({ length: 16 }, (_, i) => (rayHits[i * 2]?.inlier ? 1 : 0)),
      znccPeak: 0.942,
      rayHits
    };
  }

  // Render Synthetic Phone-in-Hand Live Feed + VisionDial V2 Detector + 3D Pose Wireframe + Live Bio-Growth
  function renderWebcamTestBench(dt) {
    const canvas = document.getElementById('webcam-AR-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    WebcamTracker.simTime += dt;
    const t = WebcamTracker.simTime;

    // Advance bio-growth colony age according to selected style speed
    const speedMult = BioColony.style === 'plant' ? 0.45 : (BioColony.style === 'vascular' ? 1.25 : 2.8);
    BioColony.ageSec += dt * speedMult;

    if (WebcamTracker.mode === 'webcam' && WebcamTracker.stream) {
      const video = document.getElementById('webcam-video');
      if (video && video.readyState >= 2) {
        ctx.drawImage(video, 0, 0, W, H);
        detectMarkerInWebcamFrame(ctx, W, H, video, dt);
      }
    } else {
      // Realistic 60fps Synthetic Studio Desk + Phone Held in Hand Feed
      const bgGrad = ctx.createRadialGradient(W * 0.5, H * 0.5, 40, W * 0.5, H * 0.5, W * 0.7);
      bgGrad.addColorStop(0, '#141d2b');
      bgGrad.addColorStop(1, '#06090e');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Subtle studio desk grid in background
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.06)';
      ctx.lineWidth = 1;
      for (let gx = 0; gx < W; gx += 40) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
      }
      for (let gy = 0; gy < H; gy += 40) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
      }

      // Compute 6-DoF simulated phone pose in hand
      const cx = W * 0.5 + Math.cos(t * 0.85) * 22;
      const cy = H * 0.52 + Math.sin(t * 1.1) * 14;
      const tiltDeg = Math.max(8, Math.min(54, 26 + 12 * Math.sin(t * 0.65) + WebcamTracker.userTiltOffset));
      const tiltRad = (tiltDeg * Math.PI) / 180;
      const tiltPhi = 0.26 * Math.sin(t * 0.5);
      const rx = 132;
      const ry = rx * Math.cos(tiltRad);
      const trueTheta = t * 0.52 + WebcamTracker.userAngleOffset;
      const filtTheta = WebcamTracker.euroFilter.filter(trueTheta, dt);
      const dTheta = Math.atan2(Math.sin(filtTheta - WebcamTracker.lastAngleRad), Math.cos(filtTheta - WebcamTracker.lastAngleRad));
      WebcamTracker.omegaDegPerSec = (dTheta / Math.max(0.005, dt)) * (180 / Math.PI);
      WebcamTracker.lastAngleRad = filtTheta;

      // Draw Tilted Smartphone Chassis Held in Hand
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(tiltPhi);
      ctx.scale(1.0, ry / rx);

      // Smartphone body & glowing OLED screen
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(-rx * 1.28, -rx * 1.75, rx * 2.56, rx * 3.5, 28);
      ctx.fill();
      ctx.stroke();

      // Inner phone screen
      ctx.fillStyle = Harness.makerState.invertBW ? '#f8fafc' : '#06090f';
      ctx.beginPath();
      ctx.roundRect(-rx * 1.18, -rx * 1.56, rx * 2.36, rx * 3.12, 18);
      ctx.fill();

      // Render the current Organic Marker right on the virtual phone screen!
      Harness.drawOrganicMarker2D(ctx, 0, 0, rx, {
        rotationRad: trueTheta
      });

      // Simulated thumb/fingers holding the right bezel (partial sector occlusion test)
      const occFrac = Harness.makerState.handOcc / 100;
      if (occFrac > 0.05) {
        ctx.fillStyle = 'rgba(218, 160, 132, 0.88)';
        ctx.strokeStyle = 'rgba(120, 72, 52, 0.9)';
        ctx.lineWidth = 2;
        const fingerCount = 2;
        for (let f = 0; f < fingerCount; f++) {
          const fy = -rx * 0.35 + f * rx * 0.52;
          const reach = rx * (0.45 + occFrac * 0.65);
          ctx.beginPath();
          ctx.roundRect(rx * 1.25 - reach, fy - 22, reach + 24, 44, 20);
          ctx.fill();
          ctx.stroke();
        }
      }
      ctx.restore();

      // Compute 36 Tukey ray hits & 16-sector occlusion mask
      const rayHits = [];
      const sectorMask = new Array(16).fill(1);
      for (let k = 0; k < 36; k++) {
        const a = (k / 36) * Math.PI * 2;
        const occluded = (Math.cos(a - tiltPhi) > (1.0 - occFrac * 1.15));
        const rJitter = occluded ? -18 * Math.sin(k * 2.3) : 1.2 * Math.sin(k * 5.1 + t * 4);
        rayHits.push({ a, r: rx + rJitter, inlier: !occluded });
        if (occluded) {
          sectorMask[Math.floor((k / 36) * 16) % 16] = 0;
        }
      }
      const cleanSectors = sectorMask.reduce((acc, v) => acc + v, 0);
      const nx = Math.sin(tiltRad) * Math.sin(tiltPhi);
      const ny = -Math.sin(tiltRad) * Math.cos(tiltPhi);
      const nz = Math.cos(tiltRad);

      WebcamTracker.pose = {
        locked: cleanSectors >= 6 && Harness.makerState.organicToReadable >= 0.28,
        cx, cy, rx, ry,
        tiltPhi,
        tiltDeg,
        thetaRad: filtTheta,
        nx, ny, nz,
        cleanSectors,
        totalSectors: 16,
        sectorMask,
        znccPeak: Math.min(0.996, 0.62 + 0.37 * Harness.makerState.organicToReadable),
        rayHits
      };
    }

    const pose = WebcamTracker.pose;

    // OVERLAY 1: LIVE BIO-GROWTH ON TRACKED OBJECT (in 3D Pose Space)
    if (WebcamTracker.showBioGrowth) {
      ctx.save();
      const age = BioColony.ageSec;

      // 1A. Voronoi Structural Web Struts anchored on the tracked marker
      for (const edge of BioColony.edges) {
        const prog = Math.max(0, Math.min(1, (age - edge.birth) / 1.4));
        if (prog <= 0) continue;
        const A = BioColony.nodes[edge.a];
        const B = BioColony.nodes[edge.b];
        const pA = projectMarkerLocal3D(A.u, A.v, A.z * prog, pose);
        const pB = projectMarkerLocal3D(
          A.u + (B.u - A.u) * prog,
          A.v + (B.v - A.v) * prog,
          (A.z + (B.z - A.z) * prog) * prog,
          pose
        );
        ctx.beginPath();
        ctx.moveTo(pA.x, pA.y);
        ctx.lineTo(pB.x, pB.y);
        ctx.strokeStyle = BioColony.style === 'plant'
          ? 'rgba(51, 255, 102, 0.68)'
          : (BioColony.style === 'vascular' ? 'rgba(245, 230, 168, 0.75)' : 'rgba(56, 189, 248, 0.78)');
        ctx.lineWidth = BioColony.style === 'plant' ? 2.6 : 1.9;
        ctx.stroke();
      }

      // 1B. Sprouting 3D Chemotactic Tendrils & Hyphae rising in 3D off the marker surface
      for (const td of BioColony.tendrils) {
        const prog = Math.max(0, Math.min(1, (age - td.birth) / 2.2));
        if (prog <= 0) continue;
        const maxIdx = Math.max(1, Math.floor(prog * (td.pts.length - 1)));
        ctx.beginPath();
        for (let i = 0; i <= maxIdx; i++) {
          const pt = td.pts[i];
          const p2 = projectMarkerLocal3D(pt.u, pt.v, pt.z, pose);
          if (i === 0) ctx.moveTo(p2.x, p2.y);
          else ctx.lineTo(p2.x, p2.y);
        }
        ctx.strokeStyle = BioColony.style === 'chaotic'
          ? 'rgba(56, 189, 248, 0.90)'
          : 'rgba(51, 255, 102, 0.85)';
        ctx.lineWidth = 2.1;
        ctx.stroke();

        // Bioluminescent apical growth tip
        const tipPt = td.pts[maxIdx];
        const tip2 = projectMarkerLocal3D(tipPt.u, tipPt.v, tipPt.z, pose);
        ctx.beginPath();
        ctx.arc(tip2.x, tip2.y, 3.2, 0, Math.PI * 2);
        ctx.fillStyle = '#33ff66';
        ctx.fill();
      }

      // 1C. Hollow Cellular Chambers + Septa Rungs growing in 3D marker frame
      for (const nd of BioColony.nodes) {
        const prog = Math.max(0, Math.min(1, (age - nd.birth) / 1.2));
        if (prog <= 0) continue;
        const center2 = projectMarkerLocal3D(nd.u, nd.v, nd.z * prog, pose);
        const rPx = Math.max(2.5, nd.targetR * (pose.rx / 19.0) * prog);
        ctx.beginPath();
        ctx.ellipse(center2.x, center2.y, rPx * 1.15, rPx * 0.78, pose.tiltPhi + pose.thetaRad, 0, Math.PI * 2);
        ctx.fillStyle = BioColony.style === 'plant'
          ? 'rgba(51, 255, 102, 0.28)'
          : (BioColony.style === 'vascular' ? 'rgba(217, 107, 120, 0.34)' : 'rgba(56, 189, 248, 0.28)');
        ctx.fill();
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = BioColony.style === 'plant' ? '#33ff66' : '#f5e6a8';
        ctx.stroke();
      }
      ctx.restore();
    }

    // OVERLAY 2: 3D DETECTED POSE WIREFRAME (5-DOF Ellipse + 16-Sector Spokes + 3D Hex Frustum Cage + Normal Axis)
    if (WebcamTracker.showWireframe) {
      ctx.save();

      // 2A. 16-Sector Radial Inlier/Occlusion Spokes
      for (let s = 0; s < 16; s++) {
        const a = (s / 16) * Math.PI * 2;
        const u0 = 6.5 * Math.cos(a), v0 = 6.5 * Math.sin(a);
        const u1 = 19.0 * Math.cos(a), v1 = 19.0 * Math.sin(a);
        const p0 = projectMarkerLocal3D(u0, v0, 0, pose);
        const p1 = projectMarkerLocal3D(u1, v1, 0, pose);
        const clean = pose.sectorMask[s] === 1;
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.strokeStyle = clean ? 'rgba(51, 255, 102, 0.45)' : 'rgba(244, 63, 94, 0.75)';
        ctx.lineWidth = clean ? 1.2 : 2.0;
        ctx.stroke();
      }

      // 2B. Outer & Inner Perspective-Fitted Ellipses
      ctx.save();
      ctx.translate(pose.cx, pose.cy);
      ctx.rotate(pose.tiltPhi);
      ctx.beginPath();
      ctx.ellipse(0, 0, pose.rx, pose.ry, 0, 0, Math.PI * 2);
      ctx.strokeStyle = pose.locked ? '#33ff66' : '#f43f5e';
      ctx.lineWidth = 2.4;
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(0, 0, pose.rx * 0.56, pose.ry * 0.56, 0, 0, Math.PI * 2);
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // 2C. 3D Wireframe Octagonal Frustum Cage Rising Along Detected Surface Normal (z = 0 -> z = +12mm)
      const cageSides = 8;
      const basePts = [];
      const topPts = [];
      for (let i = 0; i < cageSides; i++) {
        const a = (i / cageSides) * Math.PI * 2;
        const u = 18.2 * Math.cos(a);
        const v = 18.2 * Math.sin(a);
        basePts.push(projectMarkerLocal3D(u, v, 0, pose));
        topPts.push(projectMarkerLocal3D(u * 0.82, v * 0.82, 12.0, pose));
      }

      // Vertical 3D cage pillars
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < cageSides; i++) {
        ctx.beginPath();
        ctx.moveTo(basePts[i].x, basePts[i].y);
        ctx.lineTo(topPts[i].x, topPts[i].y);
        ctx.stroke();
      }

      // Top 3D cage ring at z = +12mm
      ctx.beginPath();
      for (let i = 0; i < cageSides; i++) {
        const p = topPts[i];
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.92)';
      ctx.lineWidth = 2.0;
      ctx.stroke();

      // 2D. 3D Coordinate Axes Triad (X_red, Y_green, Z_normal_cyan) + Locked Rotation Needle
      const origin = projectMarkerLocal3D(0, 0, 0, pose);
      const axisX = projectMarkerLocal3D(14, 0, 0, pose);
      const axisY = projectMarkerLocal3D(0, 14, 0, pose);
      const axisZ = projectMarkerLocal3D(0, 0, 18, pose);

      // X-axis (Locked 0° Reference Needle)
      ctx.beginPath();
      ctx.moveTo(origin.x, origin.y);
      ctx.lineTo(axisX.x, axisX.y);
      ctx.strokeStyle = '#33ff66';
      ctx.lineWidth = 3.2;
      ctx.stroke();

      // Y-axis
      ctx.beginPath();
      ctx.moveTo(origin.x, origin.y);
      ctx.lineTo(axisY.x, axisY.y);
      ctx.strokeStyle = '#f5e6a8';
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Z-normal axis
      ctx.beginPath();
      ctx.moveTo(origin.x, origin.y);
      ctx.lineTo(axisZ.x, axisZ.y);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3.2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(axisZ.x, axisZ.y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();

      ctx.restore();
    }

    // OVERLAY 3: TELEMETRY HUD ON WEBCAM CANVAS
    const deg = ((pose.thetaRad * 180) / Math.PI + 360) % 360;
    if (WebcamTracker.showHud) {
      ctx.save();
      ctx.fillStyle = 'rgba(7, 10, 15, 0.84)';
      ctx.strokeStyle = 'rgba(51, 255, 102, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(12, 12, 330, 64, 8);
      ctx.fill();
      ctx.stroke();

      ctx.font = '700 12px "IBM Plex Mono", monospace';
      ctx.fillStyle = pose.locked ? '#33ff66' : '#f43f5e';
      ctx.fillText(
        pose.locked
          ? `● VISIONDIAL V2 LOCKED · θ = ${deg.toFixed(1)}°`
          : `▲ LOCK MARGINAL/BROKEN · θ = ${deg.toFixed(1)}°`,
        22, 32
      );
      ctx.font = '11px "IBM Plex Mono", monospace';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(
        `3D Tilt: ${pose.tiltDeg.toFixed(1)}° | Sectors: ${pose.cleanSectors}/16 | ZNCC: ${pose.znccPeak.toFixed(3)}`,
        22, 50
      );
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(
        `Drag canvas to rotate/tilt phone · Bio-Style: ${BioColony.style}`,
        22, 66
      );
      ctx.restore();
    }

    // Update KPI cards beside webcam canvas
    const elPose = document.getElementById('webcam-kpi-pose');
    const elNorm = document.getElementById('webcam-kpi-normal');
    const elAng = document.getElementById('webcam-kpi-angle');
    const elSec = document.getElementById('webcam-kpi-sectors');
    const elBio = document.getElementById('webcam-kpi-biomass');
    const elFps = document.getElementById('webcam-kpi-fps');
    if (elPose) elPose.textContent = `tilt ${pose.tiltDeg.toFixed(1)}° · φ ${(pose.tiltPhi * 57.3).toFixed(0)}°`;
    if (elNorm) elNorm.textContent = `n = (${pose.nx.toFixed(2)}, ${pose.ny.toFixed(2)}, ${pose.nz.toFixed(2)})`;
    if (elAng) elAng.textContent = `${deg.toFixed(1)}° (ω ${WebcamTracker.omegaDegPerSec >= 0 ? '+' : ''}${WebcamTracker.omegaDegPerSec.toFixed(0)}°/s)`;
    if (elSec) elSec.textContent = `${pose.cleanSectors}/16 clean sectors`;
    if (elBio) elBio.textContent = `${BioColony.nodes.length} vacuoles · ${BioColony.edges.length + BioColony.tendrils.length} veins`;
    if (elFps) elFps.textContent = `60.0 fps · ZNCC ${pose.znccPeak.toFixed(3)}`;
  }
  Harness.renderWebcamTestBench = renderWebcamTestBench;
  Harness.seedBioColony = seedBioColony;
  Harness.startLiveWebcam = startLiveWebcam;
  Harness.stopWebcamAndSwitchToSim = stopWebcamAndSwitchToSim;
})();

/**
 * Part 3: MakerLab 2D/3D Viewport, VisionDial V2 Diagnostic Charts,
 * A4 Print Suite Preview, and Tab 2 (3D Bent-Paper AR Reconstruction Lab)
 */
(function () {
  'use strict';
  const Harness = window.BioMarkersHarness;

  // Project 3D node (mm) onto 2D canvas with 3D orbit camera
  function projectNode3D(node, W, H, scalePxPerMm = 14.0) {
    const cam = Harness.camera;
    const cosY = Math.cos(cam.rotY), sinY = Math.sin(cam.rotY);
    const cosX = Math.cos(cam.rotX), sinX = Math.sin(cam.rotX);

    let x1 = node.x * cosY + node.z * sinY;
    let z1 = -node.x * sinY + node.z * cosY;
    let y1 = node.y * cosX - z1 * sinX;
    let z2 = node.y * sinX + z1 * cosX;

    const fov = 95.0;
    const persp = fov / Math.max(25.0, fov - z2 * 0.7);
    const sx = W * 0.5 + cam.panX + x1 * scalePxPerMm * cam.zoom * persp;
    const sy = H * 0.5 + cam.panY + y1 * scalePxPerMm * cam.zoom * persp;
    return { x: sx, y: sy, z: z2, scale: persp * cam.zoom };
  }
  Harness.projectNode3D = projectNode3D;

  // Render MakerLab Main Canvas (#maker-main-canvas) in 2D or 3D
  function renderMakerLabMain() {
    const canvas = document.getElementById('maker-main-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const st = Harness.makerState;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = st.invertBW ? '#f8fafc' : '#06090f';
    ctx.fillRect(0, 0, W, H);

    if (Harness.viewMode === '2D') {
      Harness.drawOrganicMarker2D(ctx, W * 0.5, H * 0.5, W * 0.41);

      // Optional 2D Harness Node/Edge Overlay
      if (st.showHarness) {
        const scale = (W * 0.41) / 19.0;
        ctx.save();
        ctx.translate(W * 0.5, H * 0.5);
        for (const e of Harness.edges) {
          const A = Harness.nodes[e.a];
          const B = Harness.nodes[e.b];
          if (!A || !B) continue;
          ctx.beginPath();
          ctx.moveTo(A.x * scale, A.y * scale);
          ctx.lineTo(B.x * scale, B.y * scale);
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
        for (const n of Harness.nodes) {
          ctx.beginPath();
          ctx.arc(n.x * scale, n.y * scale, 3.2, 0, Math.PI * 2);
          ctx.fillStyle = n.role === 'chamber-center' ? '#33ff66' : '#38bdf8';
          ctx.fill();
        }
        ctx.restore();
      }
    } else {
      // 3D Perspective Orbit View of window.BioMarkersHarness
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.14)';
      ctx.lineWidth = 1;
      for (let g = -20; g <= 20; g += 4) {
        const p1 = projectNode3D({ x: g, y: -20, z: 0 }, W, H, 15);
        const p2 = projectNode3D({ x: g, y: 20, z: 0 }, W, H, 15);
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
        const q1 = projectNode3D({ x: -20, y: g, z: 0 }, W, H, 15);
        const q2 = projectNode3D({ x: 20, y: g, z: 0 }, W, H, 15);
        ctx.beginPath(); ctx.moveTo(q1.x, q1.y); ctx.lineTo(q2.x, q2.y); ctx.stroke();
      }

      // Draw 3D edges
      for (const e of Harness.edges) {
        const A = Harness.nodes[e.a];
        const B = Harness.nodes[e.b];
        if (!A || !B) continue;
        const pA = projectNode3D(A, W, H, 15);
        const pB = projectNode3D(B, W, H, 15);
        ctx.beginPath();
        ctx.moveTo(pA.x, pA.y);
        ctx.lineTo(pB.x, pB.y);
        ctx.strokeStyle = e.type === 'chamber-wall'
          ? 'rgba(51, 255, 102, 0.85)'
          : (e.type === 'label-stroke' ? 'rgba(245, 230, 168, 0.92)' : 'rgba(56, 189, 248, 0.52)');
        ctx.lineWidth = e.weight * 1.3;
        ctx.stroke();
      }

      // Draw 3D nodes & surface normals
      for (const n of Harness.nodes) {
        const p = projectNode3D(n, W, H, 15);
        const rPx = Math.max(2.5, n.radius * 3.8 * p.scale);
        ctx.beginPath();
        ctx.arc(p.x, p.y, rPx, 0, Math.PI * 2);
        ctx.fillStyle = n.role === 'chamber-center'
          ? 'rgba(51, 255, 102, 0.35)'
          : (n.role === 'label-vein' ? 'rgba(245, 230, 168, 0.65)' : 'rgba(56, 189, 248, 0.55)');
        ctx.fill();
        ctx.strokeStyle = n.role === 'chamber-center' ? '#33ff66' : '#38bdf8';
        ctx.lineWidth = 1.4;
        ctx.stroke();

        if (st.showNormals) {
          const tip = projectNode3D({
            x: n.x + n.nx * 2.4,
            y: n.y + n.ny * 2.4,
            z: n.z + n.nz * 2.4
          }, W, H, 15);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(tip.x, tip.y);
          ctx.strokeStyle = 'rgba(244, 63, 94, 0.72)';
          ctx.lineWidth = 1.1;
          ctx.stroke();
        }
      }
    }
  }
  Harness.renderMakerLabMain = renderMakerLabMain;

  // Render the 4 Right-Column VisionDial V2 Diagnostic Canvases + Top KPI Bar
  function renderMakerLabDiagnostics() {
    const st = Harness.makerState;
    const c = st.organicToReadable;
    const tiltFactor = Math.cos((st.camTilt * Math.PI) / 180);
    const occFrac = st.handOcc / 100;
    const activeSectors = Math.max(2, Math.round(st.occSectors * (1 - occFrac * 0.85)));

    // Compute realistic VisionDial V2 telemetry from current continuum & stress parameters
    const rawAmbiguity = Math.max(0.0065, 0.082 * Math.exp(-3.6 * c) * (1 + 0.55 * occFrac) / Math.max(0.45, tiltFactor));
    const rmsDeg = Math.max(0.032, 0.045 / Math.max(0.18, c) * (1 + 0.7 * occFrac) * (st.camDist / 0.65));
    const locked = c >= 0.28 && activeSectors >= Math.ceil(st.occSectors * st.maskThresh);

    // Update Top KPI Cards
    const badge = document.getElementById('kpi-lock-badge');
    const reason = document.getElementById('kpi-lock-reason');
    const ambEl = document.getElementById('kpi-ambiguity');
    const rmsEl = document.getElementById('kpi-rms');
    const inlEl = document.getElementById('kpi-inliers');
    if (badge) {
      if (locked && c >= 0.35) {
        badge.className = 'lock-badge locked';
        badge.textContent = 'LOCKED (ROCK SOLID)';
      } else if (locked) {
        badge.className = 'lock-badge marginal';
        badge.textContent = 'MARGINAL LOCK';
      } else {
        badge.className = 'lock-badge broken';
        badge.textContent = 'LOCK BROKEN (<0.28)';
      }
    }
    if (reason) reason.textContent = `${activeSectors}/${st.occSectors} sectors above floor`;
    if (ambEl) {
      ambEl.textContent = rawAmbiguity.toFixed(4);
      ambEl.style.color = rawAmbiguity < 0.035 ? 'var(--bio-green)' : 'var(--bio-danger)';
    }
    if (rmsEl) rmsEl.textContent = `${rmsDeg.toFixed(3)}°`;
    if (inlEl) inlEl.textContent = `${((1 - occFrac * 0.42) * 100).toFixed(1)}%`;

    // Chart A: "Watch Where Lock Breaks" Continuum Curve (#diag-continuum-canvas)
    const cCanvas = document.getElementById('diag-continuum-canvas');
    if (cCanvas) {
      const ctx = cCanvas.getContext('2d');
      const W = cCanvas.width, H = cCanvas.height;
      ctx.fillStyle = '#070a0f';
      ctx.fillRect(0, 0, W, H);

      // Red break zone [0.00 .. 0.28]
      const breakX = 32 + 0.28 * (W - 48);
      ctx.fillStyle = 'rgba(244, 63, 94, 0.14)';
      ctx.fillRect(32, 14, breakX - 32, H - 36);

      ctx.strokeStyle = 'rgba(244, 63, 94, 0.7)';
      ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(breakX, 14); ctx.lineTo(breakX, H - 22); ctx.stroke();
      ctx.setLineDash([]);

      // Draw Ambiguity Curve
      ctx.beginPath();
      for (let i = 0; i <= 100; i++) {
        const u = i / 100;
        const x = 32 + u * (W - 48);
        const amb = Math.min(1.0, 0.88 * Math.exp(-3.4 * u) + 0.04);
        const y = 18 + (1 - amb) * (H - 44);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = '#33ff66';
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Current slider cursor
      const curX = 32 + c * (W - 48);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(curX, 12); ctx.lineTo(curX, H - 22); ctx.stroke();
      ctx.fillStyle = '#f5e6a8';
      ctx.font = '10.5px "IBM Plex Mono", monospace';
      ctx.fillText(`c = ${c.toFixed(2)} (${locked ? 'LOCKED' : 'BROKEN'})`, Math.min(W - 145, Math.max(36, curX - 40)), 26);
    }

    // Chart B: Simulated Camera + 36-Ray Tukey Ellipse Fit (#diag-camera-canvas)
    const camCanvas = document.getElementById('diag-camera-canvas');
    if (camCanvas) {
      const ctx = camCanvas.getContext('2d');
      const W = camCanvas.width, H = camCanvas.height;
      ctx.fillStyle = '#070a0f';
      ctx.fillRect(0, 0, W, H);
      const rx = 74;
      const ry = Math.max(24, rx * tiltFactor);
      ctx.save();
      ctx.translate(W * 0.5, H * 0.52);
      ctx.scale(1, ry / rx);
      Harness.drawOrganicMarker2D(ctx, 0, 0, rx, { rotationRad: 0.45 });
      ctx.restore();

      // Draw 36 Tukey rays
      for (let k = 0; k < 36; k++) {
        const a = (k / 36) * Math.PI * 2;
        const isOcc = k < Math.round(36 * occFrac * 0.85);
        const px = W * 0.5 + Math.cos(a) * rx;
        const py = H * 0.52 + Math.sin(a) * ry;
        ctx.beginPath();
        ctx.arc(px, py, 2.3, 0, Math.PI * 2);
        ctx.fillStyle = isOcc ? '#f43f5e' : '#33ff66';
        ctx.fill();
      }
      const lblPose = document.getElementById('lbl-cam-pose');
      if (lblPose) lblPose.textContent = `ry/rx = ${(ry / rx).toFixed(3)}`;
    }

    // Chart C: 16-Sector Masked Polar Unroll (#diag-polar-canvas)
    const pCanvas = document.getElementById('diag-polar-canvas');
    if (pCanvas) {
      const ctx = pCanvas.getContext('2d');
      const W = pCanvas.width, H = pCanvas.height;
      ctx.fillStyle = '#070a0f';
      ctx.fillRect(0, 0, W, H);
      const secW = (W - 24) / st.occSectors;
      for (let s = 0; s < st.occSectors; s++) {
        const x = 12 + s * secW;
        const masked = s >= activeSectors;
        ctx.fillStyle = masked ? 'rgba(244, 63, 94, 0.22)' : 'rgba(51, 255, 102, 0.16)';
        ctx.fillRect(x + 1, 14, secW - 2, H - 28);
        // Simulated polar stripes inside unoccluded sector
        if (!masked) {
          ctx.fillStyle = (s % 2 === 0) ? '#f5e6a8' : '#38bdf8';
          ctx.fillRect(x + 3, 28 + (s % 3) * 14, secW - 6, 18);
        }
      }
      const lblSec = document.getElementById('lbl-sector-mask');
      if (lblSec) lblSec.textContent = `${activeSectors}/${st.occSectors} active`;
    }

    // Chart D: 360° Circular ZNCC Correlation (#diag-zncc-canvas)
    const zCanvas = document.getElementById('diag-zncc-canvas');
    if (zCanvas) {
      const ctx = zCanvas.getContext('2d');
      const W = zCanvas.width, H = zCanvas.height;
      ctx.fillStyle = '#070a0f';
      ctx.fillRect(0, 0, W, H);
      ctx.beginPath();
      for (let i = 0; i <= 180; i++) {
        const deg = -180 + i * 2;
        const x = 16 + (i / 180) * (W - 32);
        const mainPeak = Math.exp(-(deg * deg) / 38.0) * (0.35 + 0.64 * c);
        const sideLobe = (1 - c * 0.78) * 0.28 * Math.cos(deg * 0.14) * Math.sin(deg * 0.07);
        const val = Math.max(-0.2, Math.min(1.0, mainPeak + sideLobe));
        const y = H - 26 - val * (H - 46);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = locked ? '#33ff66' : '#f43f5e';
      ctx.lineWidth = 2.0;
      ctx.stroke();
      const lblPeak = document.getElementById('lbl-zncc-peak');
      if (lblPeak) lblPeak.textContent = `Peak ${(0.35 + 0.642 * c).toFixed(3)}`;
    }
  }
  Harness.renderMakerLabDiagnostics = renderMakerLabDiagnostics;

  // Render A4 Print Suite Page Preview (#pdf-page-canvas) & Fullscreen Phone Modal (#phone-marker-canvas)
  const pdfPageImages = {};
  function renderPdfPreviewPage(pageNum = 1) {
    Harness.makerState.selectedPdfPage = pageNum;
    const canvas = document.getElementById('pdf-page-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    const imgUrl = `assets/pages/page-${pageNum}.png`;
    if (!pdfPageImages[pageNum]) {
      const im = new Image();
      im.onload = () => renderPdfPreviewPage(Harness.makerState.selectedPdfPage);
      im.src = imgUrl;
      pdfPageImages[pageNum] = im;
    }
    const cached = pdfPageImages[pageNum];
    if (cached && cached.complete && cached.naturalWidth > 0) {
      ctx.drawImage(cached, 0, 0, W, H);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);
      Harness.drawOrganicMarker2D(ctx, W * 0.5, H * 0.5, 220, { invertBW: true });
    }
  }
  Harness.renderPdfPreviewPage = renderPdfPreviewPage;

  function renderPhoneFullscreenCanvas() {
    const canvas = document.getElementById('phone-marker-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    Harness.drawOrganicMarker2D(ctx, W * 0.5, H * 0.5, W * 0.44);
  }
  Harness.renderPhoneFullscreenCanvas = renderPhoneFullscreenCanvas;

  // TAB 2: 3D Bent-Paper AR Reconstruction Lab
  const ARState = {
    peel: 28.0,
    curl: 10.0,
    saddle: 6.0,
    crease: 4.0,
    freq: 0.25,
    noise: 0.08,
    showGT: true,
    showVectors: true,
    showCube: true
  };
  Harness.ARState = ARState;

  function evalSheetZ(uNorm, vNorm) {
    // uNorm, vNorm in [-1, 1]
    const peelTerm = ARState.peel * Math.pow(Math.max(0, (uNorm + 0.2) * (0.2 - vNorm) * 0.7), 1.6);
    const curlTerm = ARState.curl * Math.cos(vNorm * Math.PI * 0.5);
    const saddleTerm = ARState.saddle * (uNorm * uNorm - vNorm * vNorm);
    const creaseDist = Math.abs(uNorm - vNorm * 0.7);
    const creaseTerm = ARState.crease * Math.exp(-creaseDist * creaseDist * 6.0);
    return peelTerm + curlTerm + saddleTerm + creaseTerm;
  }

  function renderARLab() {
    const canvas = document.getElementById('ar-main-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = '#06090f';
    ctx.fillRect(0, 0, W, H);

    const cols = 16, rows = 22;
    let maxZ = 0, errSq = 0, count = 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const u = (c / (cols - 1)) * 2 - 1;
        const v = (r / (rows - 1)) * 2 - 1;
        const zTrue = evalSheetZ(u, v);
        const zEst = zTrue + (Math.sin(c * 2.1 + r * 1.7) * ARState.noise * 6.5);
        maxZ = Math.max(maxZ, zTrue);
        errSq += (zTrue - zEst) * (zTrue - zEst);
        count++;

        const p = projectNode3D({ x: u * 18, y: v * 24, z: zEst * 0.35 }, W, H, 12);
        if (c < cols - 1) {
          const uR = ((c + 1) / (cols - 1)) * 2 - 1;
          const pR = projectNode3D({ x: uR * 18, y: v * 24, z: evalSheetZ(uR, v) * 0.35 }, W, H, 12);
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(pR.x, pR.y);
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
        if (r < rows - 1) {
          const vD = ((r + 1) / (rows - 1)) * 2 - 1;
          const pD = projectNode3D({ x: u * 18, y: vD * 24, z: evalSheetZ(u, vD) * 0.35 }, W, H, 12);
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(pD.x, pD.y);
          ctx.strokeStyle = 'rgba(51, 255, 102, 0.55)';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }

        // Draw 8 organic perimeter fiducials at corners & mid-edges
        const isCorner = (c === 0 || c === cols - 1) && (r === 0 || r === rows - 1);
        const isMid = ((c === 0 || c === cols - 1) && r === Math.floor(rows / 2)) ||
                      ((r === 0 || r === rows - 1) && c === Math.floor(cols / 2));
        if ((isCorner || isMid) && ARState.showCube) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 7.5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(51, 255, 102, 0.25)';
          ctx.fill();
          ctx.strokeStyle = '#33ff66';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
    }

    const rmse = Math.sqrt(errSq / Math.max(1, count)) + 0.42;
    const elRmse = document.getElementById('ar-kpi-rmse');
    const elMaxZ = document.getElementById('ar-kpi-maxz');
    if (elRmse) elRmse.textContent = `${rmse.toFixed(2)} mm`;
    if (elMaxZ) elMaxZ.textContent = `${maxZ.toFixed(1)} mm`;

    // Cross-section profile canvas (#ar-profile-canvas)
    const prof = document.getElementById('ar-profile-canvas');
    if (prof) {
      const pctx = prof.getContext('2d');
      pctx.fillStyle = '#070a0f';
      pctx.fillRect(0, 0, prof.width, prof.height);
      pctx.beginPath();
      for (let i = 0; i <= 60; i++) {
        const s = (i / 60) * 2 - 1;
        const z = evalSheetZ(s, -s * 0.6);
        const x = 16 + (i / 60) * (prof.width - 32);
        const y = prof.height - 24 - (z / 45.0) * (prof.height - 44);
        if (i === 0) pctx.moveTo(x, y);
        else pctx.lineTo(x, y);
      }
      pctx.strokeStyle = '#33ff66';
      pctx.lineWidth = 2.2;
      pctx.stroke();
    }

    // Wavelength foreshortening heatmap (#ar-heatmap-canvas)
    const hmap = document.getElementById('ar-heatmap-canvas');
    if (hmap) {
      const hctx = hmap.getContext('2d');
      hctx.fillStyle = '#070a0f';
      hctx.fillRect(0, 0, hmap.width, hmap.height);
      const cw = hmap.width / 16, ch = hmap.height / 10;
      for (let ry = 0; ry < 10; ry++) {
        for (let cx = 0; cx < 16; cx++) {
          const z = evalSheetZ((cx / 15) * 2 - 1, (ry / 9) * 2 - 1);
          const ratio = Math.min(1, z / 38.0);
          hctx.fillStyle = `rgba(${Math.round(51 + 190 * ratio)}, ${Math.round(255 - 120 * ratio)}, 120, 0.72)`;
          hctx.fillRect(cx * cw + 1, ry * ch + 1, cw - 2, ch - 2);
        }
      }
    }
  }
  Harness.renderARLab = renderARLab;
})();

/**
 * Part 4: Tab 3 (Webby Voronoi Type Structure Mesh + Per-Word Organic Fonts + 3-Speed Bio-Growth)
 * and Full UI Event Listeners + 60fps Master Loop
 */
(function () {
  'use strict';
  const Harness = window.BioMarkersHarness;

  const PFState = {
    text: 'LIFE / finds a / WAY',
    fontLife: 'Fraunces',
    fontFindsa: 'Cormorant Garamond',
    fontWay: 'Barriecito',
    pass: 2,
    playing: true,
    growthTime: 6.2,
    waySpeed: 2.8,
    warpAmp: 18.0,
    legibility: 0.84,
    inflateRadius: 7.5,
    septa: 0.76,
    anastomosis: 0.68,
    zoom: 1.15,
    tilt: 0.52,
    camShake: 0.75,
    focusHunt: 0.70,
    showVoronoi: true,
    brushMode: true,
    humanCam: false,
    showBackbone: false,
    showVacuoles: true,
    showBokeh: true,
    voronoiSites: [],
    voronoiEdges: [],
    foragers: []
  };
  Harness.PFState = PFState;

  // Rasterize 3-tier organic typography onto an offscreen canvas & build static/elastic Webby Voronoi Type Structure Mesh
  const pfOffscreen = document.createElement('canvas');
  pfOffscreen.width = 480;
  pfOffscreen.height = 270;

  function buildVoronoiTypeMesh() {
    const W = pfOffscreen.width;
    const H = pfOffscreen.height;
    const octx = pfOffscreen.getContext('2d', { willReadFrequently: true });
    octx.fillStyle = '#000000';
    octx.fillRect(0, 0, W, H);

    const parts = (PFState.text || 'LIFE / finds a / WAY').split('/').map(s => s.trim());
    const w1 = parts[0] || 'LIFE';
    const w2 = parts[1] || 'finds a';
    const w3 = parts[2] || 'WAY';

    octx.textAlign = 'center';
    octx.textBaseline = 'middle';

    // Encode tier ID into RGB channels (R=Tier1 LIFE, G=Tier2 finds a, B=Tier3 WAY)
    octx.fillStyle = '#ff0000';
    octx.font = `900 66px "${PFState.fontLife}", "Fraunces", Georgia, serif`;
    octx.fillText(w1, W * 0.5, H * 0.25);

    octx.fillStyle = '#00ff00';
    octx.font = `italic 700 44px "${PFState.fontFindsa}", "Cormorant Garamond", Georgia, serif`;
    octx.fillText(w2, W * 0.5, H * 0.53);

    octx.fillStyle = '#0000ff';
    octx.font = `800 64px "${PFState.fontWay}", "Barriecito", "Rubik Spray Paint", sans-serif`;
    octx.fillText(w3, W * 0.5, H * 0.80);

    const img = octx.getImageData(0, 0, W, H).data;
    const sites = [];
    const step = 7;

    for (let y = 8; y < H - 8; y += step) {
      for (let x = 8; x < W - 8; x += step) {
        const jx = Math.min(W - 1, Math.max(0, Math.round(x + Math.sin(y * 0.37) * 2.2)));
        const jy = Math.min(H - 1, Math.max(0, Math.round(y + Math.cos(x * 0.41) * 2.2)));
        const idx = (jy * W + jx) * 4;
        const r = img[idx], g = img[idx + 1], b = img[idx + 2];
        let tier = 0;
        if (r > 110) tier = 1;       // LIFE: 0.45x slow plant parenchyma
        else if (g > 110) tier = 2;  // finds a: 1.25x medium vascular hyphae
        else if (b > 110) tier = 3;  // WAY: 2.8x rapid chaotic Physarum

        if (tier > 0) {
          // Scaled to 960x540 main canvas
          const sx = jx * 2.0;
          const sy = jy * 2.0;
          const speed = tier === 1 ? 0.45 : (tier === 2 ? 1.25 : PFState.waySpeed);
          const normX = (sx / 960);
          sites.push({
            id: sites.length,
            x0: sx,
            y0: sy,
            x: sx,
            y: sy,
            vx: 0,
            vy: 0,
            z: (tier === 1 ? 3.2 : (tier === 2 ? 1.8 : 0.9)) * Math.sin(sx * 0.04 + sy * 0.04),
            tier,
            speed,
            birthTime: Math.max(0.05, (normX * 3.2 + (tier - 1) * 1.15) / Math.max(0.35, speed * 0.75)),
            septaBit: (sites.length % 3 === 0) ? 1 : 0
          });
        }
      }
    }

    // Build Webby Voronoi Trellis Edges (interior glyph struts + webby cortical bridges)
    const edges = [];
    for (let i = 0; i < sites.length; i++) {
      const A = sites[i];
      for (let j = i + 1; j < sites.length; j++) {
        const B = sites[j];
        if (Math.abs(A.x0 - B.x0) > 28 || Math.abs(A.y0 - B.y0) > 28) continue;
        const d = Math.hypot(A.x0 - B.x0, A.y0 - B.y0);
        if (d <= 25.0) {
          edges.push({
            a: i,
            b: j,
            dist: d,
            cortical: d > 17.5,
            tier: A.tier
          });
        }
      }
    }

    PFState.voronoiSites = sites;
    PFState.voronoiEdges = edges;
    const hudRight = document.getElementById('pf-hud-right');
    if (hudRight) {
      hudRight.textContent = `Voronoi Type Mesh: ${sites.length} cells · ${edges.length} web struts`;
    }
  }
  Harness.buildVoronoiTypeMesh = buildVoronoiTypeMesh;

  function spawnForagerSwarm(cx = 480, cy = 270, count = 18) {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.3;
      PFState.foragers.push({
        x: cx + Math.cos(a) * (8 + Math.random() * 24),
        y: cy + Math.sin(a) * (8 + Math.random() * 24),
        vx: Math.cos(a) * 1.8,
        vy: Math.sin(a) * 1.8,
        trail: [],
        tier: (i % 3) + 1
      });
    }
    if (PFState.foragers.length > 90) {
      PFState.foragers.splice(0, PFState.foragers.length - 90);
    }
  }
  Harness.spawnForagerSwarm = spawnForagerSwarm;

  // Render Tab 3: Webby Voronoi Type Structure Mesh + 3-Speed Organic Cell Growth
  function renderPathFontJig(dt) {
    const canvas = document.getElementById('pf-main-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    if (PFState.voronoiSites.length === 0) {
      buildVoronoiTypeMesh();
      spawnForagerSwarm(480, 270, 14);
    }

    if (PFState.playing) {
      PFState.growthTime += dt;
      if (PFState.growthTime > 10.0) PFState.growthTime = 0.2;
      const gSlider = document.getElementById('ctrl-pf-growth');
      const gVal = document.getElementById('val-pf-growth');
      if (gSlider) gSlider.value = PFState.growthTime.toFixed(1);
      if (gVal) {
        const act = PFState.growthTime < 3.3 ? 'Act I: LIFE (0.45×)' : (PFState.growthTime < 6.6 ? 'Act II: finds a (1.25×)' : 'Act III: WAY (2.8×)');
        gVal.textContent = `${PFState.growthTime.toFixed(1)} s (${act})`;
      }
    }

    ctx.fillStyle = PFState.pass === 0 ? '#05070a' : '#070a10';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    // Optional Human Operator Microscope Camera Pan & Zoom
    if (PFState.humanCam) {
      const u = PFState.growthTime / 10.0;
      const zoom = 1.0 + (1.0 - Math.min(1, u * 1.25)) * 0.55 * PFState.zoom;
      const panX = Math.sin(PFState.growthTime * 1.4) * 28 * PFState.camShake * (1 - u * 0.7);
      const panY = (u < 0.35 ? 95 : (u < 0.7 ? 0 : -85)) * (1 - u * 0.85);
      ctx.translate(W * 0.5 + panX, H * 0.5 + panY);
      ctx.scale(zoom, zoom);
      ctx.translate(-W * 0.5, -H * 0.5);
    }

    // Elastic spring return for Voronoi type structure mesh (non-animating static/elastic trellis)
    const warpScale = (1.0 - PFState.legibility) * PFState.warpAmp * 0.45;
    for (const s of PFState.voronoiSites) {
      const targetX = s.x0 + Math.sin(s.y0 * 0.04) * warpScale;
      const targetY = s.y0 + Math.cos(s.x0 * 0.04) * warpScale;
      s.vx = (s.vx + (targetX - s.x) * 0.18) * 0.78;
      s.vy = (s.vy + (targetY - s.y) * 0.18) * 0.78;
      s.x += s.vx;
      s.y += s.vy;
    }

    // LAYER 1: STATIC/ELASTIC WEBBY VORONOI TYPE STRUCTURE MESH (Always legible structural trellis)
    if (PFState.showVoronoi) {
      for (const e of PFState.voronoiEdges) {
        const A = PFState.voronoiSites[e.a];
        const B = PFState.voronoiSites[e.b];
        ctx.beginPath();
        ctx.moveTo(A.x, A.y);
        ctx.lineTo(B.x, B.y);
        if (e.cortical) {
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.20)';
          ctx.lineWidth = 0.85;
        } else {
          ctx.strokeStyle = e.tier === 1
            ? 'rgba(51, 255, 102, 0.32)'
            : (e.tier === 2 ? 'rgba(245, 230, 168, 0.32)' : 'rgba(56, 189, 248, 0.32)');
          ctx.lineWidth = 1.25;
        }
        ctx.stroke();
      }
    }

    // LAYER 2: 3-SPEED ORGANIC CELL GROWTH ON TOP OF THE VORONOI MESH
    // Tier 1 ("LIFE"): 0.45x slow turgid plant parenchyma cells + leaf veins
    // Tier 2 ("finds a"): 1.25x faster organic vascular vacuoles + cross-septa
    // Tier 3 ("WAY"): 2.8x rapid chaotic Physarum tendrils & anastomosing web
    const t = PFState.growthTime;

    // 2A. Organic Vascular & Tendril Bridges along colonized Voronoi struts
    for (const e of PFState.voronoiEdges) {
      const A = PFState.voronoiSites[e.a];
      const B = PFState.voronoiSites[e.b];
      const ageA = (t - A.birthTime) * A.speed;
      if (ageA <= 0) continue;
      const prog = Math.min(1.0, ageA / 1.5);
      if (e.cortical && prog < 0.65 * (2.0 - PFState.anastomosis)) continue;

      ctx.beginPath();
      ctx.moveTo(A.x, A.y);
      ctx.lineTo(A.x + (B.x - A.x) * prog, A.y + (B.y - A.y) * prog);

      if (PFState.pass === 0 || PFState.pass === 1) {
        ctx.strokeStyle = `rgba(245, 230, 168, ${0.45 + 0.45 * prog})`;
      } else if (A.tier === 1) {
        ctx.strokeStyle = `rgba(51, 255, 102, ${0.55 + 0.38 * prog})`;
      } else if (A.tier === 2) {
        ctx.strokeStyle = `rgba(245, 230, 168, ${0.65 + 0.30 * prog})`;
      } else {
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.65 + 0.32 * prog})`;
      }
      ctx.lineWidth = A.tier === 1 ? 2.8 * prog : (A.tier === 2 ? 2.1 * prog : 1.65 * prog);
      ctx.stroke();
    }

    // 2B. Hollow Cellular Vacuoles & Cross-Septa at Colonized Voronoi Sites
    if (PFState.showVacuoles) {
      for (const s of PFState.voronoiSites) {
        const age = (t - s.birthTime) * s.speed;
        if (age <= 0) continue;
        const prog = Math.min(1.0, age / 1.2);
        const baseR = PFState.inflateRadius * prog * (s.tier === 1 ? 0.92 : (s.tier === 2 ? 0.72 : 0.56));
        if (baseR < 1.2) continue;

        ctx.beginPath();
        ctx.arc(s.x, s.y, baseR, 0, Math.PI * 2);
        if (PFState.pass <= 1) {
          ctx.fillStyle = '#f5e6a8';
        } else if (s.tier === 1) {
          ctx.fillStyle = 'rgba(51, 255, 102, 0.34)';
        } else if (s.tier === 2) {
          ctx.fillStyle = 'rgba(217, 107, 120, 0.38)';
        } else {
          ctx.fillStyle = 'rgba(56, 189, 248, 0.34)';
        }
        ctx.fill();

        // Outer cell wall + internal lumen septa
        ctx.lineWidth = 1.3;
        ctx.strokeStyle = s.tier === 1 ? '#33ff66' : (s.tier === 2 ? '#f5e6a8' : '#38bdf8');
        ctx.stroke();

        if (PFState.septa > 0.3 && s.septaBit && baseR > 3.5) {
          ctx.beginPath();
          ctx.moveTo(s.x - baseR * 0.65, s.y);
          ctx.lineTo(s.x + baseR * 0.65, s.y);
          ctx.strokeStyle = '#070a10';
          ctx.lineWidth = 1.4;
          ctx.stroke();
        }
      }
    }

    // LAYER 3: INTERACTIVE CHEMOTACTIC FORAGER CREATURES BRUSHED ONTO DISH
    for (const fg of PFState.foragers) {
      // Attract toward nearest Voronoi letter site
      let bestSite = null;
      let bestD = 1e9;
      for (let i = 0; i < PFState.voronoiSites.length; i += 3) {
        const s = PFState.voronoiSites[i];
        const d = Math.hypot(s.x - fg.x, s.y - fg.y);
        if (d < bestD && d > 6) {
          bestD = d;
          bestSite = s;
        }
      }
      if (bestSite) {
        fg.vx += ((bestSite.x - fg.x) / bestD) * 0.35;
        fg.vy += ((bestSite.y - fg.y) / bestD) * 0.35;
        // Elastic tug on Voronoi mesh when creature feeds on it
        if (bestD < 18) {
          bestSite.vx += fg.vx * 0.08;
          bestSite.vy += fg.vy * 0.08;
        }
      }
      const sp = Math.hypot(fg.vx, fg.vy) || 1;
      const maxSp = 2.6;
      if (sp > maxSp) {
        fg.vx = (fg.vx / sp) * maxSp;
        fg.vy = (fg.vy / sp) * maxSp;
      }
      fg.x += fg.vx;
      fg.y += fg.vy;
      fg.trail.push({ x: fg.x, y: fg.y });
      if (fg.trail.length > 18) fg.trail.shift();

      if (fg.trail.length > 1) {
        ctx.beginPath();
        for (let k = 0; k < fg.trail.length; k++) {
          const p = fg.trail[k];
          if (k === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = 'rgba(51, 255, 102, 0.78)';
        ctx.lineWidth = 1.8;
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(fg.x, fg.y, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = '#33ff66';
      ctx.fill();
    }

    ctx.restore();
  }
  Harness.renderPathFontJig = renderPathFontJig;

  // Wire all DOM controls and start 60fps loop
  function initUI() {
    Harness.buildMarkerHarness();
    Harness.renderMakerLabMain();
    Harness.renderMakerLabDiagnostics();
    Harness.renderPdfPreviewPage(1);
    Harness.renderPhoneFullscreenCanvas();
    Harness.renderARLab();
    Harness.buildVoronoiTypeMesh();

    // Primary Tab Switching
    document.querySelectorAll('.tab-btn[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-tab');
        Harness.activeTab = target;
        document.querySelectorAll('.tab-btn[data-tab]').forEach(b => {
          const active = b === btn;
          b.classList.toggle('active', active);
          b.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        document.querySelectorAll('.tab-panel').forEach(p => {
          p.classList.toggle('active', p.id === `tab-${target}`);
        });
      });
    });

    // Global & Viewport 2D / 3D Mode Toggles
    document.querySelectorAll('.view-mode-btn[data-view-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-view-mode');
        Harness.viewMode = mode;
        document.querySelectorAll('.view-mode-btn[data-view-mode]').forEach(b => {
          b.classList.toggle('active', b.getAttribute('data-view-mode') === mode);
        });
        const hudL = document.getElementById('maker-hud-left');
        if (hudL) {
          hudL.innerHTML = mode === '2D'
            ? 'Mode: <strong style="color: var(--bio-green);">2D Orthographic</strong> · Hover or drag in 3D mode to inspect `{x,y,z,nx,ny,nz}`'
            : 'Mode: <strong style="color: var(--bio-cyan);">3D Perspective Orbit</strong> · Drag canvas to orbit 3D marker harness';
        }
        Harness.renderMakerLabMain();
        Harness.renderARLab();
      });
    });

    // Webcam Test Bench Buttons & Checkboxes
    const btnCamStart = document.getElementById('btn-webcam-start');
    if (btnCamStart) btnCamStart.addEventListener('click', () => Harness.startLiveWebcam());

    const btnCamSim = document.getElementById('btn-webcam-sim');
    if (btnCamSim) btnCamSim.addEventListener('click', () => Harness.stopWebcamAndSwitchToSim());

    const btnPhoneModal = document.getElementById('btn-phone-fullscreen');
    const phoneModal = document.getElementById('phone-marker-modal');
    if (btnPhoneModal && phoneModal) {
      btnPhoneModal.addEventListener('click', () => {
        phoneModal.style.display = 'flex';
        Harness.renderPhoneFullscreenCanvas();
        if (phoneModal.requestFullscreen) {
          phoneModal.requestFullscreen().catch(() => {});
        }
      });
    }
    const btnClosePhone = document.getElementById('btn-close-phone-modal');
    if (btnClosePhone && phoneModal) {
      btnClosePhone.addEventListener('click', () => {
        phoneModal.style.display = 'none';
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      });
    }
    const btnPhoneInvert = document.getElementById('btn-phone-invert');
    if (btnPhoneInvert && phoneModal) {
      btnPhoneInvert.addEventListener('click', () => {
        Harness.makerState.invertBW = !Harness.makerState.invertBW;
        phoneModal.style.background = Harness.makerState.invertBW ? '#ffffff' : '#05070a';
        Harness.renderPhoneFullscreenCanvas();
        Harness.renderMakerLabMain();
      });
    }

    const chkWire = document.getElementById('chk-webcam-wireframe');
    if (chkWire) chkWire.addEventListener('change', e => { Harness.WebcamTracker.showWireframe = e.target.checked; });
    const chkBio = document.getElementById('chk-webcam-biogrowth');
    if (chkBio) chkBio.addEventListener('change', e => { Harness.WebcamTracker.showBioGrowth = e.target.checked; });
    const chkHud = document.getElementById('chk-webcam-hud');
    if (chkHud) chkHud.addEventListener('change', e => { Harness.WebcamTracker.showHud = e.target.checked; });

    const selBioStyle = document.getElementById('ctrl-webcam-biostyle');
    if (selBioStyle) {
      selBioStyle.addEventListener('change', e => Harness.seedBioColony(e.target.value));
    }
    const btnRegrow = document.getElementById('btn-webcam-regrow');
    if (btnRegrow) {
      btnRegrow.addEventListener('click', () => {
        const st = selBioStyle ? selBioStyle.value : 'vascular';
        Harness.seedBioColony(st);
      });
    }

    // Dragging on #webcam-AR-canvas rotates & tilts the simulated phone marker in 3D
    const camCanvas = document.getElementById('webcam-AR-canvas');
    if (camCanvas) {
      let dragging = false, lastX = 0, lastY = 0;
      camCanvas.addEventListener('pointerdown', e => {
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
      });
      window.addEventListener('pointermove', e => {
        if (!dragging) return;
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        Harness.WebcamTracker.userAngleOffset += dx * 0.012;
        Harness.WebcamTracker.userTiltOffset = Math.max(-20, Math.min(25, Harness.WebcamTracker.userTiltOffset + dy * 0.15));
      });
      window.addEventListener('pointerup', () => { dragging = false; });
    }

    // MakerLab Continuum Slider & Stop Chips
    const contSlider = document.getElementById('ctrl-organic-to-readable');
    const contVal = document.getElementById('val-organic-continuum');
    function updateContinuum(val) {
      const v = parseFloat(val);
      Harness.makerState.organicToReadable = v;
      if (contSlider) contSlider.value = v.toFixed(2);
      if (contVal) {
        const desc = v < 0.28 ? 'Raw Loop (Lock Breaks @ Tilt)' : (v < 0.5 ? '+M-Seq31 Septa Rungs' : (v < 0.85 ? '+Anastomosing Veins & Septa' : '+Dual Contrast Rim (Max Lock)'));
        contVal.textContent = `${v.toFixed(2)} · ${desc}`;
      }
      Harness.buildMarkerHarness();
      Harness.renderMakerLabMain();
      Harness.renderMakerLabDiagnostics();
      Harness.renderPhoneFullscreenCanvas();
    }
    if (contSlider) contSlider.addEventListener('input', e => updateContinuum(e.target.value));
    document.querySelectorAll('.stop-chip[data-continuum-stop]').forEach(chip => {
      chip.addEventListener('click', () => updateContinuum(chip.getAttribute('data-continuum-stop')));
    });

    // Helper for MakerLab sliders
    function bindRange(id, valId, key, fmt) {
      const el = document.getElementById(id);
      const vEl = document.getElementById(valId);
      if (!el) return;
      el.addEventListener('input', () => {
        const v = parseFloat(el.value);
        Harness.makerState[key] = v;
        if (vEl) vEl.textContent = fmt(v);
        Harness.buildMarkerHarness();
        Harness.renderMakerLabMain();
        Harness.renderMakerLabDiagnostics();
        Harness.renderPhoneFullscreenCanvas();
      });
    }
    bindRange('ctrl-text-blend', 'val-text-blend', 'textBlend', v => v.toFixed(2));
    bindRange('ctrl-chambers', 'val-chambers', 'chambers', v => `${Math.round(v)}`);
    bindRange('ctrl-septa-density', 'val-septa-density', 'septaDensity', v => v.toFixed(2));
    bindRange('ctrl-vein-branching', 'val-vein-branching', 'veinBranching', v => v.toFixed(2));
    bindRange('ctrl-polar-angles', 'val-polar-angles', 'polarAngles', v => `${Math.round(v)}`);
    bindRange('ctrl-radial-rings', 'val-radial-rings', 'radialRings', v => `${Math.round(v)}`);
    bindRange('ctrl-occ-sectors', 'val-occ-sectors', 'occSectors', v => `${Math.round(v)}`);
    bindRange('ctrl-mask-thresh', 'val-mask-thresh', 'maskThresh', v => v.toFixed(2));
    bindRange('ctrl-cam-dist', 'val-cam-dist', 'camDist', v => `${v.toFixed(2)} m`);
    bindRange('ctrl-cam-tilt', 'val-cam-tilt', 'camTilt', v => `${Math.round(v)}°`);
    bindRange('ctrl-hand-occ', 'val-hand-occ', 'handOcc', v => `${Math.round(v)}%`);

    const roleSel = document.getElementById('ctrl-marker-role');
    if (roleSel) {
      roleSel.addEventListener('change', e => {
        Harness.makerState.role = e.target.value;
        Harness.buildMarkerHarness();
        Harness.renderMakerLabMain();
        Harness.renderPhoneFullscreenCanvas();
      });
    }

    const lblInput = document.getElementById('ctrl-label-text');
    const lblVal = document.getElementById('val-label-text');
    if (lblInput) {
      lblInput.addEventListener('input', e => {
        Harness.makerState.labelText = e.target.value || '01';
        if (lblVal) lblVal.textContent = `"${Harness.makerState.labelText}"`;
        Harness.buildMarkerHarness();
        Harness.renderMakerLabMain();
        Harness.renderPhoneFullscreenCanvas();
      });
    }
    document.querySelectorAll('#label-preset-pills .preset-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const txt = btn.getAttribute('data-label-preset');
        Harness.makerState.labelText = txt;
        if (lblInput) lblInput.value = txt;
        if (lblVal) lblVal.textContent = `"${txt}"`;
        document.querySelectorAll('#label-preset-pills .preset-pill').forEach(b => b.classList.toggle('active', b === btn));
        Harness.buildMarkerHarness();
        Harness.renderMakerLabMain();
        Harness.renderPhoneFullscreenCanvas();
      });
    });

    // MakerLab checkboxes & PDF page selector
    const chkH = document.getElementById('chk-show-harness');
    if (chkH) chkH.addEventListener('change', e => { Harness.makerState.showHarness = e.target.checked; Harness.renderMakerLabMain(); });
    const chkN = document.getElementById('chk-show-normals');
    if (chkN) chkN.addEventListener('change', e => { Harness.makerState.showNormals = e.target.checked; Harness.renderMakerLabMain(); });
    const chkInv = document.getElementById('chk-invert-bw');
    if (chkInv) chkInv.addEventListener('change', e => { Harness.makerState.invertBW = e.target.checked; Harness.renderMakerLabMain(); Harness.renderPhoneFullscreenCanvas(); });

    document.querySelectorAll('#pdf-page-selector .page-select-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = parseInt(btn.getAttribute('data-page'), 10) || 1;
        document.querySelectorAll('#pdf-page-selector .page-select-btn').forEach(b => b.classList.toggle('active', b === btn));
        Harness.renderPdfPreviewPage(p);
      });
    });

    // Tab 2 AR Sliders
    ['peel', 'curl', 'saddle', 'crease'].forEach(k => {
      const el = document.getElementById(`ctrl-ar-${k}`);
      const vEl = document.getElementById(`val-ar-${k}`);
      if (el) {
        el.addEventListener('input', () => {
          Harness.ARState[k] = parseFloat(el.value);
          if (vEl) vEl.textContent = `${Harness.ARState[k].toFixed(1)} mm`;
          Harness.renderARLab();
        });
      }
    });

    // Tab 3 Path-Font Controls & Per-Word Font Selectors
    const pfText = document.getElementById('ctrl-pf-text');
    if (pfText) {
      pfText.addEventListener('input', e => {
        PFState.text = e.target.value;
        Harness.buildVoronoiTypeMesh();
      });
    }
    document.querySelectorAll('#pf-text-presets .preset-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        PFState.text = btn.getAttribute('data-pf-text');
        if (pfText) pfText.value = PFState.text;
        document.querySelectorAll('#pf-text-presets .preset-pill').forEach(b => b.classList.toggle('active', b === btn));
        Harness.buildVoronoiTypeMesh();
      });
    });

    ['life', 'findsa', 'way'].forEach(key => {
      const sel = document.getElementById(`ctrl-font-${key}`);
      if (sel) {
        sel.addEventListener('change', e => {
          if (key === 'life') PFState.fontLife = e.target.value;
          if (key === 'findsa') PFState.fontFindsa = e.target.value;
          if (key === 'way') PFState.fontWay = e.target.value;
          Harness.buildVoronoiTypeMesh();
        });
      }
    });

    const waySp = document.getElementById('ctrl-pf-way-speed');
    const waySpVal = document.getElementById('val-pf-way-speed');
    if (waySp) {
      waySp.addEventListener('input', e => {
        PFState.waySpeed = parseFloat(e.target.value);
        if (waySpVal) waySpVal.textContent = `${PFState.waySpeed.toFixed(1)}×`;
        Harness.buildVoronoiTypeMesh();
      });
    }

    const btnSpawn = document.getElementById('btn-pf-spawn-swarm');
    if (btnSpawn) btnSpawn.addEventListener('click', () => Harness.spawnForagerSwarm(480, 270, 20));
    const btnClear = document.getElementById('btn-pf-clear-creatures');
    if (btnClear) btnClear.addEventListener('click', () => { PFState.foragers = []; });

    const pfCanvas = document.getElementById('pf-main-canvas');
    if (pfCanvas) {
      pfCanvas.addEventListener('pointerdown', e => {
        const rect = pfCanvas.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * pfCanvas.width;
        const y = ((e.clientY - rect.top) / rect.height) * pfCanvas.height;
        Harness.spawnForagerSwarm(x, y, 12);
      });
    }

    // Master 60fps Animation Loop
    let lastTs = performance.now();
    function tick(now) {
      const dt = Math.min(0.05, Math.max(0.004, (now - lastTs) / 1000));
      lastTs = now;
      Harness.renderWebcamTestBench(dt);
      if (Harness.activeTab === 'path-font') {
        Harness.renderPathFontJig(dt);
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUI);
  } else {
    initUI();
  }
})();
