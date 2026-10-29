/* Calcotia interactive globe (homepage hero).
   Vanilla JS only: orthographic projection over real 110m country
   boundaries from world-110m.js. No runtime libraries, no CDN calls.
   Drag to rotate, auto-rotates when idle, highlighted countries link
   to their hubs. Only the front hemisphere is interactive. */
(function () {
  'use strict';

  var DEG = Math.PI / 180;
  var data = (typeof window !== 'undefined') ? window.CALCOTIA_WORLD : null;
  var canvas = (typeof document !== 'undefined') ? document.getElementById('globeCanvas') : null;

  /* Country name (110m dataset) -> hub URL + tooltip name. */
  var HUBS = {
    'Norway': { url: '/no/', label: 'Norway' },
    'Germany': { url: '/de/', label: 'Germany' },
    'France': { url: '/fr/', label: 'France' },
    'Italy': { url: '/it/', label: 'Italy' },
    'Japan': { url: '/jp/', label: 'Japan' },
    'Greece': { url: '/gr/', label: 'Greece' },
    'Israel': { url: '/il/', label: 'Israel' },
    'Vietnam': { url: '/vn/', label: 'Vietnam' },
    'Slovakia': { url: '/sk/', label: 'Slovakia' },
    'Serbia': { url: '/rs/', label: 'Serbia' },
    'Saudi Arabia': { url: '/sa/', label: 'Saudi Arabia' },
    'Sweden': { url: '/se/', label: 'Sweden' },
    'Ireland': { url: '/ie/', label: 'Ireland' },
    'Iceland': { url: '/is/', label: 'Iceland' },
    'Taiwan': { url: '/tw/', label: 'Taiwan' },
    'Spain': { url: '/es/', label: 'Spain' },
    'United Arab Emirates': { url: '/ae/', label: 'United Arab Emirates' },
    'Philippines': { url: '/ph/', label: 'Philippines' },
    'Netherlands': { url: '/nl/', label: 'Netherlands' }
  };

  /* ---------- TopoJSON decode (shared arcs, delta encoded) ---------- */
  function decodeArcs(topology) {
    var scale = topology.transform.scale;
    var translate = topology.transform.translate;
    var out = [];
    for (var i = 0; i < topology.arcs.length; i++) {
      var arc = topology.arcs[i];
      var pts = [];
      var x = 0, y = 0;
      for (var j = 0; j < arc.length; j++) {
        x += arc[j][0];
        y += arc[j][1];
        pts.push([x * scale[0] + translate[0], y * scale[1] + translate[1]]);
      }
      out.push(pts);
    }
    return out;
  }

  function ringPoints(ring, decoded) {
    var pts = [];
    for (var k = 0; k < ring.length; k++) {
      var idx = ring[k];
      var arc = idx >= 0 ? decoded[idx] : decoded[~idx].slice().reverse();
      for (var j = 0; j < arc.length; j++) {
        if (k > 0 && j === 0) continue; /* joint duplicates previous point */
        pts.push(arc[j]);
      }
    }
    return pts;
  }

  function decodeFeatures(topology) {
    var decoded = decodeArcs(topology);
    var features = [];
    for (var f = 0; f < topology.features.length; f++) {
      var feat = topology.features[f];
      var rings = [];
      for (var p = 0; p < feat.a.length; p++) {
        var poly = feat.a[p];
        for (var r = 0; r < poly.length; r++) {
          rings.push(ringPoints(poly[r], decoded));
        }
      }
      features.push({ name: feat.n, rings: rings });
    }
    return features;
  }

  /* ---------- Geometry helpers (lon/lat plane, fine for centroids) ---------- */
  function ringAreaCentroid(pts) {
    var a = 0, cx = 0, cy = 0;
    for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      var cross = pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1];
      a += cross;
      cx += (pts[j][0] + pts[i][0]) * cross;
      cy += (pts[j][1] + pts[i][1]) * cross;
    }
    a *= 0.5;
    if (Math.abs(a) < 1e-9) return { area: 0, lon: pts[0][0], lat: pts[0][1] };
    return { area: a, lon: cx / (6 * a), lat: cy / (6 * a) };
  }

  function featureCentroid(feature) {
    var best = null;
    for (var i = 0; i < feature.rings.length; i++) {
      var c = ringAreaCentroid(feature.rings[i]);
      if (!best || Math.abs(c.area) > Math.abs(best.area)) best = c;
    }
    return best;
  }

  /* Marker point: the largest ring's centroid when it falls inside the
     country, otherwise the inside point nearest to it (grid search).
     Long curved shapes like Norway have centroids that fall outside
     their own territory, which would plant the marker in Sweden. */
  function markerPoint(feature) {
    var bestRing = null;
    var bestC = null;
    for (var i = 0; i < feature.rings.length; i++) {
      var c = ringAreaCentroid(feature.rings[i]);
      if (!bestC || Math.abs(c.area) > Math.abs(bestC.area)) {
        bestC = c;
        bestRing = feature.rings[i];
      }
    }
    if (pointInRing(bestC.lon, bestC.lat, bestRing)) return bestC;
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (var j = 0; j < bestRing.length; j++) {
      if (bestRing[j][0] < minX) minX = bestRing[j][0];
      if (bestRing[j][0] > maxX) maxX = bestRing[j][0];
      if (bestRing[j][1] < minY) minY = bestRing[j][1];
      if (bestRing[j][1] > maxY) maxY = bestRing[j][1];
    }
    var stepX = (maxX - minX) / 60;
    var stepY = (maxY - minY) / 60;
    var bestD = Infinity, bestP = null;
    for (var x = minX; x <= maxX; x += stepX) {
      for (var y = minY; y <= maxY; y += stepY) {
        if (!pointInRing(x, y, bestRing)) continue;
        var d = (x - bestC.lon) * (x - bestC.lon) + (y - bestC.lat) * (y - bestC.lat);
        if (d < bestD) { bestD = d; bestP = { lon: x, lat: y }; }
      }
    }
    return bestP || bestC;
  }

  function pointInRing(px, py, pts) {
    var inside = false;
    for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      var xi = pts[i][0], yi = pts[i][1];
      var xj = pts[j][0], yj = pts[j][1];
      if (((yi > py) !== (yj > py)) &&
          (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    return inside;
  }

  /* ---------- Projection ---------- */
  var rot = { lon: 10, lat: 50 }; /* initial view: near Europe */

  function project(lon, lat) {
    var lam = (lon - rot.lon) * DEG;
    var phi = lat * DEG;
    var phi0 = rot.lat * DEG;
    var cosPhi = Math.cos(phi), sinPhi = Math.sin(phi);
    var cosPhi0 = Math.cos(phi0), sinPhi0 = Math.sin(phi0);
    var cosLam = Math.cos(lam), sinLam = Math.sin(lam);
    return {
      x: cosPhi * sinLam,
      y: cosPhi0 * sinPhi - sinPhi0 * cosPhi * cosLam,
      z: sinPhi0 * sinPhi + cosPhi0 * cosPhi * cosLam
    };
  }

  /* Subdivide long edges (linear in lon/lat, antimeridian aware) so the
     horizon cut looks clean instead of a chord across the disc. */
  function densify(pts, step) {
    var out = [];
    for (var i = 0; i < pts.length; i++) {
      var a = pts[i];
      var b = pts[(i + 1) % pts.length];
      out.push(a);
      var dlon = b[0] - a[0];
      if (dlon > 180) dlon -= 360;
      if (dlon < -180) dlon += 360;
      var dlat = b[1] - a[1];
      var dist = Math.sqrt(dlon * dlon + dlat * dlat);
      var n = Math.floor(dist / step);
      for (var k = 1; k <= n; k++) {
        var t = k / (n + 1);
        var lon = a[0] + dlon * t;
        if (lon > 180) lon -= 360;
        if (lon < -180) lon += 360;
        out.push([lon, a[1] + dlat * t]);
      }
    }
    return out;
  }

  /* Exposed for Node tests only; the browser ignores this branch. */
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      decodeFeatures: decodeFeatures,
      featureCentroid: featureCentroid,
      markerPoint: markerPoint,
      pointInRing: pointInRing,
      projectWith: function (lon, lat, lon0, lat0) {
        var saved = { lon: rot.lon, lat: rot.lat };
        rot.lon = lon0;
        rot.lat = lat0;
        var p = project(lon, lat);
        rot.lon = saved.lon;
        rot.lat = saved.lat;
        return p;
      },
      HUBS: HUBS
    };
  }

  /* ---------- Browser-only part ---------- */
  if (!data || !canvas) return;
  var tip = document.getElementById('globeTip');
  var wrap = canvas.parentElement;
  var ctx = canvas.getContext('2d');
  var R = 200, CX = 220, CY = 220;

  function toScreen(p) {
    return [CX + p.x * R, CY - p.y * R];
  }

  /* ---------- Data prep ---------- */
  var features = decodeFeatures(data);
  var highlighted = [];
  var byName = {};
  for (var i = 0; i < features.length; i++) {
    var f = features[i];
    byName[f.name] = f;
    if (HUBS[f.name]) {
      var c = markerPoint(f);
      f.centroid = c;
      f.hub = HUBS[f.name];
      f.ringsDense = f.rings.map(function (r) { return densify(r, 2); });
      highlighted.push(f);
    }
  }
  var dimRings = [];
  for (var d = 0; d < features.length; d++) {
    if (HUBS[features[d].name]) continue;
    for (var r = 0; r < features[d].rings.length; r++) {
      dimRings.push(densify(features[d].rings[r], 2));
    }
  }

  /* ---------- Drawing ---------- */
  function traceRing(pts) {
    var started = false;
    for (var i = 0; i < pts.length; i++) {
      var p = project(pts[i][0], pts[i][1]);
      if (p.z <= 0.001) { started = false; continue; }
      var s = toScreen(p);
      if (!started) { ctx.moveTo(s[0], s[1]); started = true; }
      else ctx.lineTo(s[0], s[1]);
    }
    ctx.closePath();
  }

  function drawGraticule() {
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var lon = -180; lon < 180; lon += 20) {
      var started = false;
      for (var lat = -90; lat <= 90; lat += 2) {
        var p = project(lon, lat);
        if (p.z <= 0.001) { started = false; continue; }
        var s = toScreen(p);
        if (!started) { ctx.moveTo(s[0], s[1]); started = true; }
        else ctx.lineTo(s[0], s[1]);
      }
    }
    for (var la = -80; la <= 80; la += 20) {
      var st = false;
      for (var lo = -180; lo <= 180; lo += 2) {
        var pp = project(lo, la);
        if (pp.z <= 0.001) { st = false; continue; }
        var ss = toScreen(pp);
        if (!st) { ctx.moveTo(ss[0], ss[1]); st = true; }
        else ctx.lineTo(ss[0], ss[1]);
      }
    }
    ctx.stroke();
  }

  var hoverName = null;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    /* sphere */
    var g = ctx.createRadialGradient(CX - R * 0.35, CY - R * 0.4, R * 0.1, CX, CY, R);
    g.addColorStop(0, 'rgba(255,255,255,0.10)');
    g.addColorStop(1, 'rgba(255,255,255,0.02)');
    ctx.beginPath();
    ctx.arc(CX, CY, R, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 1;
    ctx.stroke();

    drawGraticule();

    /* dim countries */
    ctx.beginPath();
    for (var i = 0; i < dimRings.length; i++) traceRing(dimRings[i]);
    ctx.fillStyle = 'rgba(163,193,216,0.28)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(163,193,216,0.30)';
    ctx.lineWidth = 0.75;
    ctx.stroke();

    /* highlighted countries */
    for (var h = 0; h < highlighted.length; h++) {
      var f = highlighted[h];
      var isHover = hoverName === f.name;
      ctx.beginPath();
      for (var r = 0; r < f.ringsDense.length; r++) traceRing(f.ringsDense[r]);
      ctx.fillStyle = isHover ? '#12cf9e' : '#00B981';
      ctx.fill();
      ctx.strokeStyle = isHover ? '#ffffff' : '#15345a';
      ctx.lineWidth = isHover ? 1.5 : 1;
      ctx.stroke();
    }

    /* marker dots at highlighted centroids (front hemisphere only) */
    for (var m = 0; m < highlighted.length; m++) {
      var mf = highlighted[m];
      var mp = project(mf.centroid.lon, mf.centroid.lat);
      if (mp.z <= 0.001) continue;
      var ms = toScreen(mp);
      ctx.beginPath();
      ctx.arc(ms[0], ms[1], 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#00795a';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  /* ---------- Interaction ---------- */
  var dragging = false;
  var lastX = 0, lastY = 0, downX = 0, downY = 0, moved = 0;
  var dragLocked = false, scrollAborted = false, activePointerType = null;
  var resumeTimer = 0;
  var lastInteract = 0;
  var reducedMotion = (typeof window.matchMedia === 'function') &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var visible = true;
  var rafId = 0;
  var lastFrame = 0;

  function autoRotateOn() {
    return visible && !dragging && !reducedMotion &&
      (Date.now() - lastInteract > 3000);
  }

  function loop(ts) {
    rafId = 0;
    if (!visible) return;
    var dt = lastFrame ? (ts - lastFrame) / 1000 : 0;
    lastFrame = ts;
    if (dt > 0.1) dt = 0.1;
    if (autoRotateOn()) {
      rot.lon += dt * 2.0; /* ~2 degrees per second, a bit faster than before */
      if (rot.lon > 180) rot.lon -= 360;
    }
    draw();
    if (autoRotateOn() || dragging) {
      rafId = requestAnimationFrame(loop);
    } else if (visible) {
      /* Loop stops here when idle, so schedule a resume check after the
         3s idle window, otherwise auto-rotate would never come back
         after a drag. This was the resume bug. */
      scheduleResume();
    }
  }

  function kickLoop() {
    if (!rafId && visible) {
      lastFrame = 0;
      rafId = requestAnimationFrame(loop);
    }
  }

  function scheduleResume() {
    if (resumeTimer) clearTimeout(resumeTimer);
    resumeTimer = setTimeout(function () {
      resumeTimer = 0;
      kickLoop();
    }, 3100);
  }

  function canvasPos(e) {
    var rect = canvas.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top];
  }

  function hitTest(x, y) {
    var dx = x - CX, dy = y - CY;
    if (dx * dx + dy * dy > (R + 8) * (R + 8)) return null;
    /* Polygons first: precise. A neighbour's marker dot must never steal
       a click that lands inside this country's own shape (dense Europe). */
    for (var h = 0; h < highlighted.length; h++) {
      var f = highlighted[h];
      var cp = project(f.centroid.lon, f.centroid.lat);
      if (cp.z <= 0) continue;
      for (var r = 0; r < f.rings.length; r++) {
        var ring = f.rings[r];
        var screen = [];
        var ok = true;
        for (var i = 0; i < ring.length; i++) {
          var pp = project(ring[i][0], ring[i][1]);
          if (pp.z <= 0.001) { ok = false; break; }
          screen.push(toScreen(pp));
        }
        if (ok && pointInRing(x, y, screen)) return f;
      }
    }
    /* Then the nearest marker within 16px (tiny countries like Israel). */
    var best = null, bestD = 16 * 16;
    for (var m = 0; m < highlighted.length; m++) {
      var mf = highlighted[m];
      var mp = project(mf.centroid.lon, mf.centroid.lat);
      if (mp.z <= 0.001) continue;
      var ms = toScreen(mp);
      var d = (x - ms[0]) * (x - ms[0]) + (y - ms[1]) * (y - ms[1]);
      if (d <= bestD) { bestD = d; best = mf; }
    }
    return best;
  }

  function showTip(f, x, y) {
    if (!tip) return;
    tip.textContent = f.hub.label;
    tip.hidden = false;
    var rect = wrap.getBoundingClientRect();
    var tx = Math.min(x + 14, rect.width - 170);
    var ty = Math.min(y + 14, rect.height - 40);
    tip.style.left = Math.max(0, tx) + 'px';
    tip.style.top = Math.max(0, ty) + 'px';
  }

  function hideTip() {
    if (tip) tip.hidden = true;
  }

  canvas.addEventListener('pointerdown', function (e) {
    dragging = true;
    dragLocked = e.pointerType !== 'touch';
    scrollAborted = false;
    activePointerType = e.pointerType;
    moved = 0;
    lastX = e.clientX;
    lastY = e.clientY;
    downX = e.clientX;
    downY = e.clientY;
    lastInteract = Date.now();
    /* For touch, do NOT capture yet: a vertical touch must stay free to
       scroll the page. Capture only once a horizontal drag is locked. */
    if (dragLocked) {
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
    }
    kickLoop();
  });

  canvas.addEventListener('pointermove', function (e) {
    var pos = canvasPos(e);
    if (dragging) {
      /* Touch direction lock: wait until the gesture is clearly
         horizontal before rotating. A mostly vertical touch is a page
         scroll, not a globe drag, so hand it back to the browser. */
      if (activePointerType === 'touch' && !dragLocked) {
        var totalDx = e.clientX - downX;
        var totalDy = e.clientY - downY;
        if (Math.abs(totalDy) > Math.abs(totalDx) && Math.abs(totalDy) > 10) {
          scrollAborted = true;
          dragging = false;
          return;
        }
        if (Math.abs(totalDx) > Math.abs(totalDy) && Math.abs(totalDx) > 10) {
          dragLocked = true;
          try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
          lastX = e.clientX;
          lastY = e.clientY;
        } else {
          return;
        }
      }
      var dx = e.clientX - lastX;
      var dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      moved += Math.abs(dx) + Math.abs(dy);
      rot.lon -= dx * 0.25;
      if (rot.lon > 180) rot.lon -= 360;
      if (rot.lon < -180) rot.lon += 360;
      rot.lat += dy * 0.25;
      if (rot.lat > 70) rot.lat = 70;
      if (rot.lat < -45) rot.lat = -45;
      lastInteract = Date.now();
      hideTip();
      draw();
      return;
    }
    var hit = hitTest(pos[0], pos[1]);
    var name = hit ? hit.name : null;
    if (name !== hoverName) {
      hoverName = name;
      draw();
    }
    if (hit) {
      canvas.style.cursor = 'pointer';
      showTip(hit, pos[0], pos[1]);
    } else {
      canvas.style.cursor = 'grab';
      hideTip();
    }
  });

  function endDrag(e) {
    if (!dragging && !scrollAborted) return;
    var wasScroll = scrollAborted;
    dragging = false;
    dragLocked = false;
    scrollAborted = false;
    activePointerType = null;
    lastInteract = Date.now();
    if (!wasScroll && moved < 6 && e && e.clientX !== undefined) {
      var pos = canvasPos(e);
      var hit = hitTest(pos[0], pos[1]);
      if (hit) window.location.href = hit.hub.url;
    }
    kickLoop();
    scheduleResume();
  }

  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', function () {
    dragging = false;
    dragLocked = false;
    scrollAborted = false;
    activePointerType = null;
    lastInteract = Date.now();
    kickLoop();
    scheduleResume();
  });
  canvas.addEventListener('pointerleave', function () {
    if (!dragging) {
      hoverName = null;
      hideTip();
      draw();
    }
  });

  /* ---------- Sizing + lifecycle ---------- */
  var lastSizeKey = '';
  function resize() {
    var size = wrap.clientWidth || 440;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var sizeKey = size + 'x' + dpr;
    if (sizeKey === lastSizeKey) return;
    lastSizeKey = sizeKey;
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    R = size / 2 - 4;
    CX = size / 2;
    CY = size / 2;
    draw();
  }

  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(resize).observe(wrap);
  } else {
    window.addEventListener('resize', resize);
  }

  if (typeof IntersectionObserver !== 'undefined') {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) kickLoop();
      else if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    }).observe(canvas);
  }

  resize();
  lastInteract = Date.now() - 4000; /* auto-rotate starts promptly */
  kickLoop();
})();
