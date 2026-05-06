// ASCII Weather Globe — orthographic projection of a rotating Earth into a
// fixed-size character grid. No deps.
(function () {
  'use strict';

  const COLS = 64;
  const ROWS = 32;
  // Characters get progressively denser with depth (z toward viewer = brighter).
  const SHADE = ' .:-=+*#%@';
  const OCEAN = '·';

  // Coarse landmass mask: union of lat/lon rectangles. Lat: -90..90, lon: -180..180.
  // Hand-tuned to roughly outline continents at globe-grid resolution.
  const LAND = [
    // North America
    [49, 70, -168, -52], [30, 49, -125, -66], [15, 30, -110, -80],
    // Central America / Caribbean
    [8, 22, -92, -77], [17, 23, -85, -68],
    // South America
    [-12, 12, -82, -50], [-35, -12, -75, -38], [-55, -35, -73, -55],
    // Greenland
    [60, 83, -55, -20],
    // Europe
    [36, 60, -10, 30], [60, 71, 5, 60],
    // Africa
    [12, 36, -17, 35], [-5, 12, -10, 45], [-35, -5, 10, 42],
    // Middle East
    [12, 40, 35, 60],
    // Russia / Siberia
    [50, 75, 30, 180], [40, 50, 30, 140],
    // Central / South Asia
    [25, 50, 60, 130], [8, 25, 70, 100],
    // Southeast Asia / Indonesia
    [-10, 22, 95, 140],
    // Japan / Korea
    [30, 46, 126, 146],
    // Australia
    [-39, -11, 113, 154],
    // New Zealand
    [-47, -34, 166, 178],
    // Antarctica (top edge only — looks like a polar cap)
    [-90, -66, -180, 180],
  ];

  function isLand(lat, lon) {
    for (let i = 0; i < LAND.length; i++) {
      const r = LAND[i];
      if (lat >= r[0] && lat <= r[1] && lon >= r[2] && lon <= r[3]) return true;
    }
    return false;
  }

  const DEG = Math.PI / 180;

  // Convert (lat, lon) on a unit sphere rotated by `rot` radians around Y to (x, y, z).
  function project(lat, lon, rot) {
    const la = lat * DEG;
    const lo = lon * DEG - rot;
    const cla = Math.cos(la);
    return {
      x: cla * Math.sin(lo),
      y: Math.sin(la),
      z: cla * Math.cos(lo),
    };
  }

  function gridXY(p) {
    // x,y in [-1,1] -> grid coords. Aspect: cells are ~2x taller than wide in monospace,
    // so we squish vertically by factor ~0.5.
    const cx = (COLS - 1) / 2;
    const cy = (ROWS - 1) / 2;
    const rx = Math.min(cx, cy * 2) - 0.5;
    const ry = rx / 2;
    return {
      col: Math.round(cx + p.x * rx),
      row: Math.round(cy - p.y * ry),
    };
  }

  function makeBuffer() {
    const buf = new Array(ROWS);
    for (let r = 0; r < ROWS; r++) buf[r] = new Array(COLS).fill(' ');
    return buf;
  }

  // Renders one frame at rotation `rot` (radians). `pin` = {lat, lon} or null.
  // Returns a string with HTML-safe spans for the pin.
  function renderFrame(rot, pin) {
    const buf = makeBuffer();
    const land = makeBuffer();

    // Sample the visible hemisphere by walking the grid and inverse-projecting.
    const cx = (COLS - 1) / 2;
    const cy = (ROWS - 1) / 2;
    const rx = Math.min(cx, cy * 2) - 0.5;
    const ry = rx / 2;

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const nx = (col - cx) / rx;
        const ny = -(row - cy) / ry;
        const r2 = nx * nx + ny * ny;
        if (r2 > 1) continue;
        const z = Math.sqrt(1 - r2);
        // Inverse rotate to get lat/lon
        const lat = Math.asin(ny) / DEG;
        const lon = (Math.atan2(nx, z) + rot) / DEG;
        // Normalize lon to [-180, 180]
        let lo = ((lon + 180) % 360 + 360) % 360 - 180;
        const shadeIdx = Math.min(SHADE.length - 1, Math.max(0, Math.floor(z * (SHADE.length - 1))));
        if (isLand(lat, lo)) {
          land[row][col] = SHADE[shadeIdx];
        } else {
          buf[row][col] = OCEAN;
        }
      }
    }

    // Compose: land overrides ocean
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (land[row][col] !== ' ') buf[row][col] = land[row][col];
      }
    }

    // Pin
    let pinPos = null;
    if (pin) {
      const p = project(pin.lat, pin.lon, rot);
      if (p.z > 0) {
        const g = gridXY(p);
        if (g.row >= 0 && g.row < ROWS && g.col >= 0 && g.col < COLS) {
          pinPos = g;
        }
      }
    }

    let out = '';
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (pinPos && row === pinPos.row && col === pinPos.col) {
          out += '<span class="pin">★</span>';
        } else {
          out += buf[row][col];
        }
      }
      out += '\n';
    }
    return out;
  }

  // Public API
  let rot = 0;
  let pin = null;
  let raf = null;
  let target = null;

  function tick() {
    rot += 0.012;
    if (rot > Math.PI * 2) rot -= Math.PI * 2;
    if (target) target.innerHTML = renderFrame(rot, pin);
    raf = requestAnimationFrame(tick);
  }

  window.AsciiGlobe = {
    mount(el) {
      target = el;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    },
    setPin(lat, lon) {
      pin = { lat, lon };
    },
    clearPin() {
      pin = null;
    },
  };
})();
