// Geometry and drawing for the 数据 / 空间 / 活动 triangle with the six services around it.
// Pure functions over a 2D canvas context, so the same code runs in the mini program and in tests.

const TAU = Math.PI * 2;
const rad = (deg) => (deg * Math.PI) / 180;
const VERTEX_ANGLE = [90, 210, 330]; // 数据 top, 空间 bottom-left, 活动 bottom-right (as on the website)

// width in px -> sizes and positions in px
function geometry(W, strategies) {
  const H = Math.round(W * 1.06);
  const dS = Math.max(52, Math.min(66, W * 0.15)); // service circle
  const dD = Math.max(68, Math.min(86, W * 0.2)); // direction circle
  const cx = W / 2;
  const cy = H / 2 + 4;
  const pad = 8;
  const r = Math.min((W / 2 - dS / 2 - pad) / Math.cos(rad(30)), cy - dS / 2 - pad, H - cy - dS / 2 - pad);
  // services sitting beyond a corner must clear that corner's circle
  const R = r - dD / 2 - dS / 2 - 12;
  const verts = VERTEX_ANGLE.map((a) => ({ x: cx + R * Math.cos(rad(a)), y: cy - R * Math.sin(rad(a)) }));
  const ring = strategies.map((s) => ({ x: cx + r * Math.cos(rad(s.angle)), y: cy - r * Math.sin(rad(s.angle)) }));
  const links = [];
  strategies.forEach((s, si) => s.dirs.forEach((di) => links.push({ si, di })));
  // a fixed sprinkle of faint dots behind everything
  const stars = [];
  for (let i = 0; i < 70; i++) {
    stars.push({ x: (Math.sin(i * 127.1) * 0.5 + 0.5) * W, y: (Math.sin(i * 73.7) * 0.5 + 0.5) * H, a: 0.12 + (Math.cos(i * 43.9) * 0.5 + 0.5) * 0.22 });
  }
  return { W, H, cx, cy, r, R, dS, dD, verts, ring, links, stars };
}

// what is lit for a state {kind: 'overview' | 'dir' | 'strategy', i}
function lit(state, strategies) {
  if (state.kind === 'dir') {
    return { dirs: [state.i], strategies: strategies.map((s, si) => (s.dirs.indexOf(state.i) >= 0 ? si : -1)).filter((x) => x >= 0) };
  }
  if (state.kind === 'strategy') return { dirs: strategies[state.i].dirs.slice(), strategies: [state.i] };
  return { dirs: [], strategies: [] };
}

// quadratic curve from a to b, bowed toward the centre by k
function bow(g, a, b, k) {
  const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  return { x: m.x + (g.cx - m.x) * k, y: m.y + (g.cy - m.y) * k };
}
function pointOn(a, c, b, t) {
  const u = 1 - t;
  return { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y };
}
function curve(ctx, a, c, b) {
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.quadraticCurveTo(c.x, c.y, b.x, b.y);
  ctx.stroke();
}

// one frame; t in seconds (frozen when the motion is paused)
function frame(ctx, g, state, strategies, t) {
  const L = lit(state, strategies);
  const active = state.kind !== 'overview';
  ctx.clearRect(0, 0, g.W, g.H);

  g.stars.forEach((s) => {
    ctx.fillStyle = `rgba(201, 224, 216, ${s.a})`;
    ctx.fillRect(s.x, s.y, 1.2, 1.2);
  });

  // centre: a slowly turning diamond inside a ring
  const ir = g.R * 0.4;
  ctx.strokeStyle = 'rgba(185, 215, 230, .32)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(g.cx, g.cy, ir, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(185, 215, 230, .45)';
  ctx.beginPath();
  for (let k = 0; k <= 4; k++) {
    const a = t * 0.35 + (k * TAU) / 4;
    const x = g.cx + ir * 0.62 * Math.cos(a);
    const y = g.cy + ir * 0.62 * Math.sin(a) * 0.55;
    if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // glow behind a chosen corner
  L.dirs.forEach((di) => {
    const v = g.verts[di];
    const grad = ctx.createRadialGradient(v.x, v.y, 0, v.x, v.y, g.dD);
    grad.addColorStop(0, 'rgba(185, 215, 230, .38)');
    grad.addColorStop(1, 'rgba(185, 215, 230, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(v.x, v.y, g.dD, 0, TAU);
    ctx.fill();
  });

  // links from each service to its directions
  g.links.forEach((l) => {
    const on = active && L.strategies.indexOf(l.si) >= 0 && L.dirs.indexOf(l.di) >= 0;
    const a = g.ring[l.si];
    const b = g.verts[l.di];
    ctx.strokeStyle = on ? 'rgba(243, 240, 231, .95)' : active ? 'rgba(189, 200, 181, .12)' : 'rgba(189, 200, 181, .42)';
    ctx.lineWidth = on ? 1.6 : 1;
    curve(ctx, a, bow(g, a, b, 0.22), b);
  });

  // the triangle
  for (let i = 0; i < 3; i++) {
    const a = g.verts[i];
    const b = g.verts[(i + 1) % 3];
    const touches = L.dirs.indexOf(i) >= 0 || L.dirs.indexOf((i + 1) % 3) >= 0;
    ctx.strokeStyle = !active || touches ? 'rgba(168, 214, 212, .85)' : 'rgba(168, 214, 212, .32)';
    ctx.lineWidth = 1.5;
    curve(ctx, a, bow(g, a, b, -0.06), b);
  }

  // particles: along the triangle, and along lit links when something is chosen
  ctx.fillStyle = 'rgba(224, 246, 255, .9)';
  for (let i = 0; i < 3; i++) {
    const a = g.verts[i];
    const b = g.verts[(i + 1) % 3];
    const c = bow(g, a, b, -0.06);
    for (let k = 0; k < 14; k++) {
      const p = pointOn(a, c, b, (k / 14 + t * 0.09) % 1);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.3, 0, TAU);
      ctx.fill();
    }
  }
  if (active) {
    g.links.forEach((l) => {
      if (L.strategies.indexOf(l.si) < 0 || L.dirs.indexOf(l.di) < 0) return;
      const a = g.ring[l.si];
      const b = g.verts[l.di];
      const c = bow(g, a, b, 0.22);
      for (let k = 0; k < 5; k++) {
        const p = pointOn(a, c, b, (k / 5 + t * 0.22) % 1);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.6, 0, TAU);
        ctx.fill();
      }
    });
  }
}

module.exports = { geometry, lit, frame };
