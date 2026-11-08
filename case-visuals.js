/* Animated, interactive visuals for the two research cases.
   Data: assets/cases/*.json, built by scripts/build-case-visuals.py.
   Each visual loads when it nears the viewport, animates only while visible,
   has its own pause button, and shows a still frame under reduced motion. */

const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const COLOR = {
  ivory: '#f3f0e7', sage: '#bdc8b5', blue: '#b9d7e6', mid: '#8fc0da', far: '#5e8f9b', forest: '#203e34',
  water: '#2b5059', waterLine: '#3d6a73', park: 'rgba(189,200,181,.09)', building: 'rgba(243,240,231,.07)',
  road: 'rgba(243,240,231,.16)', rail: 'rgba(185,215,230,.35)'
};
const FONT = '"Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif';
const ease = t => 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3);

/* Shared canvas stage: fits a frame in metres into the canvas, keeps a cached base layer,
   and runs the frame loop only while the figure is on screen and playing or settling. */
class Stage {
  constructor(fig, frame, paintBase, paintFrame) {
    this.fig = fig;
    this.canvas = fig.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.frame = frame;              // [cx, cy, halfW, halfH]
    this.paintBase = paintBase;
    this.paintFrame = paintFrame;
    this.base = document.createElement('canvas');
    this.visible = false;
    this.raf = 0;
    this.last = 0;
    this.active = () => false;       // set by each visual: true while something should move
    new ResizeObserver(() => this.resize()).observe(this.canvas);
    new IntersectionObserver(entries => { this.visible = entries[0].isIntersecting; this.kick(); }, { threshold: 0.05 }).observe(fig);
    document.addEventListener('visibilitychange', () => this.kick());
  }
  resize() {
    const r = this.canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    this.w = r.width; this.h = r.height; this.dpr = dpr;
    for (const c of [this.canvas, this.base]) { c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr); }
    const [cx, cy, W, H] = this.frame;
    this.s = Math.max(r.width / (2 * W), r.height / (2 * H));
    this.X = x => r.width / 2 + (x - cx) * this.s;
    this.Y = y => r.height / 2 + (y - cy) * this.s;
    const b = this.base.getContext('2d');
    b.setTransform(dpr, 0, 0, dpr, 0, 0);
    b.clearRect(0, 0, r.width, r.height);
    this.paintBase(b, this);
    this.draw(0);
  }
  draw(dt) {
    if (!this.w) return;
    const c = this.ctx;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, this.canvas.width, this.canvas.height);
    c.drawImage(this.base, 0, 0);
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.paintFrame(c, this, dt);
  }
  kick() {
    if (this.raf || !this.visible || document.hidden) return;
    this.last = 0;
    this.raf = requestAnimationFrame(t => this.tick(t));
  }
  tick(now) {
    this.raf = 0;
    const dt = this.last ? Math.min((now - this.last) / 1000, 0.05) : 0.016;
    this.last = now;
    this.draw(dt);
    if (this.visible && !document.hidden && this.active()) this.raf = requestAnimationFrame(t => this.tick(t));
  }
}

function polyPath(c, st, flat, close) {
  c.moveTo(st.X(flat[0]), st.Y(flat[1]));
  for (let i = 2; i < flat.length; i += 2) c.lineTo(st.X(flat[i]), st.Y(flat[i + 1]));
  if (close) c.closePath();
}

function pauseButton(fig, onToggle) {
  const btn = fig.querySelector('[data-cv-pause]');
  const set = playing => {
    btn.setAttribute('aria-pressed', String(!playing));
    btn.textContent = playing ? '暂停 Ⅱ' : '播放 ▶';
    btn.setAttribute('aria-label', playing ? '暂停动画' : '播放动画');
  };
  btn.addEventListener('click', () => onToggle());
  return set;
}

/* ---------------------------------------------------------------- 朱家角：活动落在哪些节点 */
function zhujiajiao(fig, D) {
  const N = D.cands.length;
  const range = fig.querySelector('[data-cv-range]');
  const countEl = fig.querySelector('[data-cv-count]');
  const covEl = fig.querySelector('[data-cv-cov]');
  const show = new Array(N + 1).fill(0);   // 0..1 reveal of each new point (index 1..N)
  let target = 0, playing = !reduce.matches, clock = 0;

  const width = (st, v) => Math.max(0.6, (0.5 + v * 0.22) * st.s * 2.2);
  const paintBase = (c, st) => {
    c.fillStyle = '#17302a'; c.fillRect(0, 0, st.w, st.h);
    for (const w of D.water) {
      c.beginPath(); polyPath(c, st, w.p, w.t === 'poly');
      if (w.t === 'poly') { c.fillStyle = COLOR.water; c.fill(); }
      else { c.strokeStyle = COLOR.water; c.lineWidth = Math.max(1.5, w.w * st.s); c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke(); }
    }
    c.lineCap = 'round';
    for (const g of D.segs) {
      c.beginPath(); c.moveTo(st.X(g[2]), st.Y(g[3])); c.lineTo(st.X(g[4]), st.Y(g[5]));
      c.strokeStyle = g[1] === 0 ? 'rgba(189,200,181,.75)' : COLOR.road;
      c.lineWidth = width(st, g[0]); c.stroke();
    }
    c.fillStyle = COLOR.sage;
    for (const [x, y] of D.pois) { c.beginPath(); c.arc(st.X(x), st.Y(y), 2.6, 0, Math.PI * 2); c.fill(); }
  };
  const paintFrame = (c, st, dt) => {
    if (playing) {
      clock += dt;
      const step = 0.85, hold = 2.6;
      const cycle = (N + 1) * step + hold;
      if (clock > cycle) clock = 0;
      const k = Math.min(N, Math.floor(clock / step));
      if (k !== target) setTarget(k, false);
    }
    for (let i = 1; i <= N; i++) {
      const goal = i <= target ? 1 : 0;
      show[i] = reduce.matches ? goal : show[i] + (goal - show[i]) * Math.min(1, dt * 7);
    }
    c.lineCap = 'round';
    for (const g of D.segs) {
      const a = g[1] > 0 ? show[g[1]] : 0;
      if (a < 0.02) continue;
      c.beginPath(); c.moveTo(st.X(g[2]), st.Y(g[3])); c.lineTo(st.X(g[4]), st.Y(g[5]));
      c.strokeStyle = `rgba(185,215,230,${0.95 * a})`; c.lineWidth = width(st, g[0]) + 0.6; c.stroke();
    }
    for (let i = 1; i <= N; i++) {
      const a = show[i];
      if (a < 0.02) continue;
      const [x, y] = D.cands[i - 1], px = st.X(x), py = st.Y(y), e = ease(a);
      c.beginPath(); c.arc(px, py, D.R * st.s * e, 0, Math.PI * 2);
      c.fillStyle = `rgba(185,215,230,${0.08 * a})`; c.fill();
      c.setLineDash([3, 4]); c.strokeStyle = `rgba(185,215,230,${0.45 * a})`; c.lineWidth = 1; c.stroke(); c.setLineDash([]);
      const r = 8.5 * e;
      c.beginPath(); c.arc(px, py, r, 0, Math.PI * 2);
      c.fillStyle = COLOR.ivory; c.globalAlpha = a; c.fill();
      c.fillStyle = COLOR.forest; c.font = `600 ${Math.round(10 * e)}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
      if (r > 4) c.fillText(String(i), px, py + 0.5);
      c.globalAlpha = 1;
    }
  };
  const st = new Stage(fig, D.frame, paintBase, paintFrame);
  st.active = () => playing || show.some((v, i) => i && Math.abs(v - (i <= target ? 1 : 0)) > 0.01);

  function setTarget(k, fromUser) {
    target = k;
    range.value = String(k);
    const cov = Math.round(D.curve[k]);
    countEl.textContent = String(k);
    covEl.textContent = String(cov);
    range.setAttribute('aria-valuetext', `新增 ${k} 个节点，覆盖 ${cov}%`);
    if (fromUser) st.kick();
  }
  const setBtn = pauseButton(fig, () => { playing = !playing; setBtn(playing); if (playing) { clock = target * 0.85; st.kick(); } });
  range.addEventListener('input', () => { playing = false; setBtn(false); setTarget(+range.value, true); });
  reduce.addEventListener('change', () => { if (reduce.matches) { playing = false; setBtn(false); } st.kick(); });
  setBtn(playing);
  setTarget(reduce.matches ? 4 : 0, false);
  if (reduce.matches) show.forEach((_, i) => { show[i] = i && i <= 4 ? 1 : 0; });
  st.kick();
}

/* ---------------------------------------------------------------- 武林银泰：如何走到这里 */
function wulin(fig, D) {
  const [W, H] = D.frame;
  const SPEED = D.speed;                    // metres per minute
  const MAX = 15 * SPEED;
  const buttons = [...fig.querySelectorAll('[data-cv-min]')];
  const label = fig.querySelector('[data-cv-label]');
  const edges = D.edges.map(e => ({ tier: e[0], d0: e[1], d1: e[2], next: e[3], p: e.slice(4) }));
  for (const e of edges) {                  // cumulative lengths for partial drawing and walking
    const L = [0];
    for (let i = 2; i < e.p.length; i += 2) L.push(L[L.length - 1] + Math.hypot(e.p[i] - e.p[i - 2], e.p[i + 1] - e.p[i - 1]));
    e.L = L; e.len = L[L.length - 1] || 1;
  }
  const starts = D.tree.filter(k => edges[k].d1 >= 0);
  let reach = reduce.matches ? MAX : 0, goal = reduce.matches ? MAX : 0;
  // auto: the reach grows, holds and restarts on its own; motion: walkers move (the pause button)
  let auto = !reduce.matches, motion = !reduce.matches, clock = 0, fade = 1, chosen = 0;
  const dots = [];

  const tierWidth = [0, 0.9, 1.5, 2.3];
  const bandColor = d => d <= 5 * SPEED ? COLOR.ivory : d <= 10 * SPEED ? COLOR.mid : COLOR.far;
  const paintBase = (c, st) => {
    c.fillStyle = '#17302a'; c.fillRect(0, 0, st.w, st.h);
    c.fillStyle = COLOR.park;
    for (const p of D.parks) { c.beginPath(); polyPath(c, st, p, true); c.fill(); }
    c.fillStyle = COLOR.water;
    for (const p of D.water) { c.beginPath(); polyPath(c, st, p, true); c.fill(); }
    c.fillStyle = COLOR.building;
    for (const p of D.buildings) { c.beginPath(); polyPath(c, st, p, true); c.fill(); }
    c.lineCap = 'round'; c.lineJoin = 'round';
    for (const e of edges) {
      c.beginPath(); polyPath(c, st, e.p, false);
      c.strokeStyle = COLOR.road; c.lineWidth = tierWidth[e.tier]; c.stroke();
    }
    c.setLineDash([5, 4]); c.strokeStyle = COLOR.rail; c.lineWidth = 1.2;
    for (const r of D.rail) { c.beginPath(); polyPath(c, st, r, false); c.stroke(); }
    c.setLineDash([]);
  };
  // point at distance s (metres) from the near end of edge e
  const along = (e, s) => {
    let i = 1;
    while (i < e.L.length - 1 && e.L[i] < s) i++;
    const seg = e.L[i] - e.L[i - 1] || 1, u = Math.min(1, Math.max(0, (s - e.L[i - 1]) / seg));
    return [e.p[2 * i - 2] + u * (e.p[2 * i] - e.p[2 * i - 2]), e.p[2 * i - 1] + u * (e.p[2 * i + 1] - e.p[2 * i - 1])];
  };
  const paintFrame = (c, st, dt) => {
    if (auto && motion) {
      clock += dt;
      const grow = 6, hold = 2.4, out = 0.7;
      if (clock < grow) { goal = MAX * ease(clock / grow * 1.08); fade = 1; }
      else if (clock < grow + hold) { goal = MAX; fade = 1; }
      else if (clock < grow + hold + out) { fade = 1 - (clock - grow - hold) / out; }
      else { clock = 0; goal = 0; reach = 0; fade = 0; }
      reach = goal;
    } else if (!reduce.matches) {
      reach += (goal - reach) * Math.min(1, dt * 5);
      fade += (1 - fade) * Math.min(1, dt * 6);
    } else { reach = goal; fade = 1; }
    const minute = Math.max(0, Math.min(15, Math.ceil(reach / SPEED - 0.001)));
    if (auto) label.textContent = minute ? `步行 ${minute} 分钟` : '从商场出发';

    c.lineCap = 'round'; c.lineJoin = 'round';
    for (const e of edges) {
      if (e.d0 < 0 || e.d0 >= reach) continue;
      const lim = Math.min(e.len, reach - e.d0);
      c.beginPath(); c.moveTo(st.X(e.p[0]), st.Y(e.p[1]));
      let i = 1;
      for (; i < e.L.length && e.L[i] <= lim; i++) c.lineTo(st.X(e.p[2 * i]), st.Y(e.p[2 * i + 1]));
      if (i < e.L.length) { const [x, y] = along(e, lim); c.lineTo(st.X(x), st.Y(y)); }
      c.strokeStyle = bandColor(e.d0); c.globalAlpha = 0.85 * fade; c.lineWidth = tierWidth[e.tier] + 0.5; c.stroke();
    }
    c.globalAlpha = 1;

    // walkers: spawn inside the reached area and follow the shortest route to the mall
    if (!reduce.matches) {
      const want = Math.min(90, Math.round(reach / MAX * 90));
      if (motion && dots.length < want && Math.random() < 0.6) {
        const pool = starts.filter(k => edges[k].d1 <= reach);
        if (pool.length) { const k = pool[(Math.random() * pool.length) | 0]; dots.push({ e: k, s: edges[k].len }); }
      }
      const v = motion ? 95 * dt : 0;        // metres per frame at the visual speed
      for (let i = dots.length - 1; i >= 0; i--) {
        const d = dots[i];
        d.s -= v;
        while (d.s <= 0 && d.e !== -1) { const nx = edges[d.e].next; if (nx === -1) { d.e = -1; break; } d.s += edges[nx].len; d.e = nx; }
        if (d.e === -1 || edges[d.e].d0 < 0) { dots.splice(i, 1); continue; }
        const [x, y] = along(edges[d.e], d.s);
        c.beginPath(); c.arc(st.X(x), st.Y(y), 2.2, 0, Math.PI * 2);
        c.fillStyle = `rgba(243,240,231,${0.9 * fade})`; c.fill();
      }
    }
    // the mall (approximate public POI)
    const t = performance.now() / 1000, px = st.X(0), py = st.Y(0);
    const pulse = reduce.matches ? 0.5 : (t % 2.2) / 2.2;
    c.beginPath(); c.arc(px, py, 7 + pulse * 18, 0, Math.PI * 2);
    c.strokeStyle = `rgba(243,240,231,${0.5 * (1 - pulse)})`; c.lineWidth = 1.2; c.stroke();
    c.beginPath(); c.arc(px, py, 6, 0, Math.PI * 2); c.fillStyle = COLOR.ivory; c.fill();
    c.beginPath(); c.arc(px, py, 2.4, 0, Math.PI * 2); c.fillStyle = COLOR.forest; c.fill();
    c.font = `500 12px ${FONT}`; c.textAlign = 'left'; c.textBaseline = 'middle';
    c.lineWidth = 3; c.strokeStyle = 'rgba(23,48,42,.9)'; c.strokeText('武林银泰', px + 11, py - 1);
    c.fillStyle = COLOR.ivory; c.fillText('武林银泰', px + 11, py - 1);
  };
  const st = new Stage(fig, [0, 0, W, H], paintBase, paintFrame);
  st.active = () => !reduce.matches && (motion || Math.abs(goal - reach) > 1 || fade < 0.99);

  const setBtn = pauseButton(fig, () => {
    motion = !motion; setBtn(motion);
    if (motion && !chosen) { auto = true; clock = 0; reach = goal = 0; dots.length = 0; }
    if (!motion && auto) { auto = false; goal = reach; }
    st.kick();
  });
  function press(m) { buttons.forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.cvMin === m))); }
  buttons.forEach(b => b.addEventListener('click', () => {
    const m = +b.dataset.cvMin;
    auto = false; chosen = m; goal = m * SPEED;
    press(m); label.textContent = `步行 ${m} 分钟`;
    if (reduce.matches) reach = goal;
    st.kick();
  }));
  reduce.addEventListener('change', () => { if (reduce.matches) { auto = motion = false; setBtn(false); dots.length = 0; goal = reach = chosen ? chosen * SPEED : MAX; fade = 1; } st.kick(); });
  setBtn(motion);
  if (reduce.matches) { press(15); label.textContent = '步行 15 分钟'; }
  st.kick();
}

const builders = { zhujiajiao, wulin };
const figs = [...document.querySelectorAll('[data-case-visual]')];
const loader = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    loader.unobserve(entry.target);
    const fig = entry.target, kind = fig.dataset.caseVisual;
    fetch(fig.dataset.src)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(data => { builders[kind](fig, data); fig.dataset.state = 'ready'; })
      .catch(() => { fig.dataset.state = 'error'; });
  }
}, { rootMargin: '400px 0px' });
figs.forEach(f => loader.observe(f));
