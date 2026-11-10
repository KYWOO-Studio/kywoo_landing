const root = document.querySelector('#approach');
const buttons = [...root.querySelectorAll('[data-loop-step]')];
const workspace = root.querySelector('[data-network-workspace]');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const hover = matchMedia('(hover: hover) and (pointer: fine)');
const EN = document.documentElement.lang === 'en';
const L = (zh, en) => (EN ? en : zh);
const overview = L(['数据 / 空间 / 活动', '让场所，<br>持续有活力。', '从洞察到空间，再到持续使用。'],
  ['Data / Space / Activity', 'Keep places<br>alive.', 'From insight to space, then to lasting use.']);
const content = L([
  ['01 / 数据', '看见问题。', '读懂场所与人，让资料和观察支持空间选择。'],
  ['02 / 空间', '让空间，<br>回应需要。', '让动线、节点与功能回应场所需要。'],
  ['03 / 活动', '让场所，<br>持续发生。', '以品牌、活动与持续使用安排邀请参与，再把观察带回问题判断。']
], [
  ['01 / Data', 'See the problem.', 'Read the place and its people, so evidence and observation guide spatial choices.'],
  ['02 / Space', 'Make space<br>answer needs.', 'Let routes, nodes and uses respond to what the place needs.'],
  ['03 / Activity', 'Keep places<br>happening.', 'Invite people in through brand, events and ongoing use, then feed what we observe back into the next question.']
]);
// [question, tags] per direction; the overview shows the brand line and how the three connect
const overviewDetail = L(['品牌贯穿三个方向：帮助判断为谁服务、如何表达，以及让人持续参与。', '洞察支持设计 · 空间承载活动 · 使用观察回馈数据'],
  ['Brand runs through all three: who the place is for, how it speaks, and what keeps people coming back.', 'Insight informs design · Space holds activity · Use feeds back into data']);
const detail = L([
  ['具体问题：人从哪里来，在哪些节点停留？', '人 / 路径 / 停留 · 洞察支持设计'],
  ['具体问题：哪些位置能承载日常使用与内容活动？', '动线 / 节点 / 使用 · 空间承载活动'],
  ['具体问题：一次小试点后，怎样记录参与和停留？', '品牌 / 活动 / 内容 · 使用观察回馈数据']
], [
  ['The question: where do people come from, and where do they stop?', 'People / routes / dwell · Insight informs design'],
  ['The question: which spots can hold everyday use and programmed activity?', 'Routes / nodes / use · Space holds activity'],
  ['The question: after a small pilot, how do we record who joined and who stayed?', 'Brand / events / content · Use feeds back into data']
]);
const credits = L([
  '真实地理：武林银泰周边 · Overture / OpenStreetMap contributors · <a href="assets/tiles/wulin-intime/2026-09-23.1/ATTRIBUTION.md">来源与 ODbL 许可</a> · 地理估计，非实测客流',
  '参考影像：Fuengirola 商场，西班牙 · Michael Gaylard · <a href="https://commons.wikimedia.org/wiki/File:Shopping_Mall_Interior_(48844005991).jpg">来源</a> · <a href="https://creativecommons.org/licenses/by/2.0/">CC BY 2.0</a> · 已裁切，非 KYWOO 项目',
  '参考影像：Powell Street Festival · GoToVan · <a href="https://commons.wikimedia.org/wiki/File:Powell_Street_Festival_2015_(20217347021).jpg">来源</a> · <a href="https://creativecommons.org/licenses/by/2.0/">CC BY 2.0</a> · 已裁切，非 KYWOO 项目'
], [
  'Real geography: around Wulin Intime, Hangzhou · Overture / OpenStreetMap contributors · <a href="assets/tiles/wulin-intime/2026-09-23.1/ATTRIBUTION.md">Sources and ODbL licence</a> · Geographic estimate, not measured footfall',
  'Reference image: shopping mall in Fuengirola, Spain · Michael Gaylard · <a href="https://commons.wikimedia.org/wiki/File:Shopping_Mall_Interior_(48844005991).jpg">Source</a> · <a href="https://creativecommons.org/licenses/by/2.0/">CC BY 2.0</a> · Cropped; not a KYWOO project',
  'Reference image: Powell Street Festival · GoToVan · <a href="https://commons.wikimedia.org/wiki/File:Powell_Street_Festival_2015_(20217347021).jpg">Source</a> · <a href="https://creativecommons.org/licenses/by/2.0/">CC BY 2.0</a> · Cropped; not a KYWOO project'
]);
const defaultCredit = root.querySelector('[data-network-credit]').innerHTML;
// phones and tablets: the panel sits below the diagram, so a small card inside the diagram says what a tap selected
const readout = root.querySelector('[data-network-readout]');
const readoutPart = name => readout.querySelector(`[data-readout-${name}]`);

/* ---- the six strategies around the triangle ---- */
const DIRS = ['data', 'space', 'activity'];
const dirNames = L(['数据', '空间', '活动'], ['Data', 'Space', 'Activity']);
const nodes = [...root.querySelectorAll('[data-strategy]')];
const strategies = [...root.querySelectorAll('[data-strategy-text]')].map(li => ({
  num: `0${Number(li.dataset.strategyText) + 1}`,
  title: li.querySelector('h3').textContent,
  desc: li.querySelector('.strategy-desc').textContent,
  out: li.querySelector('.strategy-out span').textContent,
  dirs: li.dataset.dirs.split(' ').map(d => DIRS.indexOf(d))
}));
// where each strategy sits: single-direction ones beyond their corner, two-direction ones beyond the edge between them
const ANGLE = [150, 30, 270, 330, 90, 210];
const links = root.querySelector('[data-network-links]');
const SVGNS = 'http://www.w3.org/2000/svg';
const edgeEls = [0, 1, 2].map(() => links.appendChild(document.createElementNS(SVGNS, 'path')));
edgeEls.forEach(el => el.setAttribute('class', 'tri-edge'));
const linkEls = [];
strategies.forEach((st, si) => st.dirs.forEach(di => {
  const el = document.createElementNS(SVGNS, 'path');
  el.setAttribute('class', 'strategy-link');
  links.append(el);
  linkEls.push({ el, si, di });
}));

const OVERVIEW = { kind: 'overview' };
const same = (a, b) => a.kind === b.kind && a.i === b.i;
let pinned = OVERVIEW, shown = OVERVIEW, model, paused = false;

function setPanel(number, title, detailText, question, tags) {
  root.querySelector('[data-loop-number]').textContent = number;
  root.querySelector('[data-loop-title]').innerHTML = title;
  root.querySelector('#anchor-detail').textContent = detailText;
  root.querySelector('[data-loop-question]').textContent = question;
  root.querySelector('[data-loop-tags]').textContent = tags;
}

/* A tap on a touch screen acts on finger-lift instead of waiting for the click. iPhone Safari may treat the
   first tap on these moving, hover-styled buttons as a hover and never send the click; the click that does
   follow a handled tap is ignored so nothing toggles twice. Mouse and keyboard still use the click. */
let tapGuard = 0;
function onTap(el, fn) {
  let start = null;
  el.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' && e.isPrimary) start = { x: e.clientX, y: e.clientY, id: e.pointerId }; });
  el.addEventListener('pointercancel', () => { start = null; });
  el.addEventListener('pointerup', e => {
    if (!start || e.pointerId !== start.id) return;
    const moved = Math.hypot(e.clientX - start.x, e.clientY - start.y) > 12;
    start = null;
    if (moved) return;
    tapGuard = performance.now() + 800;
    fn();
  });
  el.addEventListener('click', () => { if (performance.now() >= tapGuard) fn(); });
}

// buttons in the panel that jump to the neighbours of what is shown
function setNeighbours(label, items) {
  const box = root.querySelector('[data-loop-strategies]');
  box.textContent = '';
  if (label) { const p = document.createElement('p'); p.textContent = label; box.append(p); }
  items.forEach(({ text, state }) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = text;
    onTap(b, () => { pinned = state; show(state); });
    box.append(b);
  });
}

function show(state) {
  shown = state;
  const dir = state.kind === 'dir' ? state.i : -1;
  const st = state.kind === 'strategy' ? strategies[state.i] : null;
  const image = dir >= 0 ? dir : st ? st.dirs[0] : -1;
  root.querySelector('[data-network-state]').dataset.networkState = state.kind === 'overview' ? 'overview' : state.kind + '-' + state.i;

  if (dir >= 0) {
    setPanel(content[dir][0], content[dir][1], content[dir][2], detail[dir][0], detail[dir][1]);
    setNeighbours(L('对应方法', 'Related strategies'), strategies.map((x, si) => ({ x, si })).filter(({ x }) => x.dirs.includes(dir))
      .map(({ x, si }) => ({ text: `${x.num} ${x.title}`, state: { kind: 'strategy', i: si } })));
  } else if (st) {
    setPanel(L(`方法 ${st.num} / 06`, `Strategy ${st.num} / 06`), st.title, st.desc, L('主要成果：', 'Key outputs: ') + st.out,
      L('连着：', 'Connects: ') + st.dirs.map(d => dirNames[d]).join(' × '));
    setNeighbours(L('相连的方向', 'Linked directions'), st.dirs.map(d => ({ text: `${dirNames[d]} ↗`, state: { kind: 'dir', i: d } })));
  } else {
    setPanel(overview[0], overview[1], overview[2], overviewDetail[0], overviewDetail[1]);
    // the overview lists no strategies here: they are already around the diagram and in 六个主要服务方向 below
    setNeighbours('', []);
  }

  readout.hidden = !st && dir < 0;
  if (dir >= 0) {
    readoutPart('kicker').textContent = content[dir][0];
    readoutPart('title').textContent = content[dir][1].replace(/<br>/g, EN ? ' ' : '');
    readoutPart('sub').textContent = L('对应方法：', 'Related: ') + strategies.map((x, si) => x.dirs.includes(dir) ? `${x.num} ${nodes[si].querySelector('small').textContent}` : '').filter(Boolean).join(' · ');
  } else if (st) {
    readoutPart('kicker').textContent = st.num;
    readoutPart('title').textContent = st.title;
    readoutPart('sub').textContent = L('连着：', 'Connects: ') + st.dirs.map(d => dirNames[d]).join(' × ');
  }

  root.querySelector('[data-network-credit]').innerHTML = image < 0 ? defaultCredit : credits[image];
  root.querySelectorAll('[data-network-image]').forEach(img => img.classList.toggle('is-visible', img.dataset.networkImage === (image < 0 ? 'overview' : String(image))));

  // what lights up: the shown item, its neighbours and the links between them
  const litDirs = dir >= 0 ? [dir] : st ? st.dirs : [];
  const litStrategies = dir >= 0 ? strategies.map((x, si) => x.dirs.includes(dir) ? si : -1).filter(si => si >= 0) : st ? [state.i] : [];
  const active = state.kind !== 'overview';
  buttons.forEach((b, i) => {
    b.setAttribute('aria-pressed', String(pinned.kind === 'dir' && pinned.i === i));
    b.classList.toggle('is-preview', dir === i);
    b.classList.toggle('is-linked', Boolean(st) && litDirs.includes(i));
    b.classList.toggle('is-dim', active && !litDirs.includes(i));
  });
  nodes.forEach((n, si) => {
    n.setAttribute('aria-pressed', String(pinned.kind === 'strategy' && pinned.i === si));
    n.classList.toggle('is-preview', Boolean(st) && state.i === si);
    n.classList.toggle('is-linked', dir >= 0 && litStrategies.includes(si));
    n.classList.toggle('is-dim', active && !litStrategies.includes(si));
  });
  linkEls.forEach(({ el, si, di }) => {
    const on = active && litStrategies.includes(si) && litDirs.includes(di);
    el.classList.toggle('is-active', on);
    el.classList.toggle('is-dim', active && !on);
  });
  root.querySelector('[data-triangle-overview]').setAttribute('aria-pressed', String(state.kind === 'overview'));

  const link = root.querySelector('[data-network-case]');
  [link.href, link.textContent] = ['#cases', L('看案例 ↓', 'See cases ↓')];
  model?.setState(dir >= 0 ? dir : st && st.dirs.length === 1 ? st.dirs[0] : -1);
}

/* ---- geometry: ring positions and the link lines ---- */
const center = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
function cornerCentres() {
  const box = workspace.getBoundingClientRect();
  const anchors = model?.anchors?.();
  if (anchors && anchors[0].x) {
    // resting positions from the 3D scene, so the ring does not drift with the camera
    return buttons.map((b, i) => {
      const drop = parseFloat(getComputedStyle(b).getPropertyValue('--node-drop')) || 22;
      return { x: anchors[i].x, y: anchors[i].y + drop + b.offsetHeight / 2 };
    });
  }
  // no 3D scene (not loaded yet, or WebGL unavailable): place the three corners ourselves
  const r = Math.min(box.width, box.height) * (box.width < 500 ? .21 : .2);
  const cx = box.width / 2, cy = box.height / 2;
  return buttons.map((b, i) => {
    const a = (90 + i * 120) * Math.PI / 180;
    const p = { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) };
    const drop = parseFloat(getComputedStyle(b).getPropertyValue('--node-drop')) || 22;
    b.style.left = `${p.x}px`;
    b.style.top = `${p.y - drop - b.offsetHeight / 2}px`;
    b.style.bottom = 'auto';
    return p;
  });
}
let ringCentre = { x: 0, y: 0 }, ringFromScene = false;
function layoutRing() {
  const box = workspace.getBoundingClientRect();
  if (!box.width) return;
  ringFromScene = Boolean(model?.anchors?.()[0].x);
  const corners = cornerCentres();
  const c = { x: (corners[0].x + corners[1].x + corners[2].x) / 3, y: (corners[0].y + corners[1].y + corners[2].y) / 3 };
  ringCentre = c;
  const halfW = Math.max(...nodes.map(n => n.offsetWidth)) / 2, halfH = Math.max(...nodes.map(n => n.offsetHeight)) / 2;
  const footer = 34;
  const r = Math.min((box.width / 2 - halfW - 6) / Math.cos(Math.PI / 6), c.y - halfH - 4, box.height - footer - c.y - halfH);
  nodes.forEach((n, si) => {
    const a = ANGLE[si] * Math.PI / 180;
    n.style.left = `${c.x + r * Math.cos(a)}px`;
    n.style.top = `${c.y - r * Math.sin(a)}px`;
  });
  drawLinks();
}
function curve(a, b) {
  // bow each line slightly towards the middle of the triangle
  const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const k = { x: m.x + (ringCentre.x - m.x) * .22, y: m.y + (ringCentre.y - m.y) * .22 };
  return `M${a.x.toFixed(1)} ${a.y.toFixed(1)}Q${k.x.toFixed(1)} ${k.y.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
}
function drawLinks() {
  const box = workspace.getBoundingClientRect();
  links.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
  const corner = buttons.map(b => { const p = center(b); return { x: p.x - box.left, y: p.y - box.top }; });
  const ring = nodes.map(n => { const p = center(n); return { x: p.x - box.left, y: p.y - box.top }; });
  edgeEls.forEach((el, i) => el.setAttribute('d', `M${corner[i].x} ${corner[i].y}L${corner[(i + 1) % 3].x} ${corner[(i + 1) % 3].y}`));
  linkEls.forEach(({ el, si, di }) => el.setAttribute('d', curve(ring[si], corner[di])));
}
// the corners move with the 3D camera, so the lines follow them while the diagram is on screen
let drawing = false, onScreen = false;
function loop() {
  if (!onScreen) { drawing = false; return; }
  if (!ringFromScene && model?.anchors?.()[0].x) layoutRing(); else drawLinks();
  requestAnimationFrame(loop);
}
new IntersectionObserver(entries => {
  onScreen = entries[0].isIntersecting;
  if (onScreen) { layoutRing(); if (!drawing) { drawing = true; requestAnimationFrame(loop); } }
}).observe(workspace);
// wait a frame so the 3D scene has measured itself first
new ResizeObserver(() => requestAnimationFrame(() => requestAnimationFrame(layoutRing))).observe(workspace);

/* ---- input ---- */
function bind(el, state) {
  el.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse' && hover.matches) show(state); });
  el.addEventListener('focus', () => { if (el.matches(':focus-visible')) show(state); });
  el.addEventListener('blur', () => show(pinned));
  onTap(el, () => { pinned = same(pinned, state) ? OVERVIEW : state; show(pinned); });
}
buttons.forEach((b, i) => bind(b, { kind: 'dir', i }));
nodes.forEach((n, si) => {
  bind(n, { kind: 'strategy', i: si });
  n.addEventListener('pointerleave', event => { if (event.pointerType === 'mouse') show(pinned); });
});
workspace.addEventListener('pointerleave', () => show(pinned));
onTap(root.querySelector('[data-triangle-overview]'), () => { pinned = OVERVIEW; show(OVERVIEW); });
const more = readout.querySelector('[data-readout-more]');
more.textContent = L('看说明 ↓', 'Details ↓');
more.addEventListener('click', () => root.querySelector('.network-copy').scrollIntoView({ block: 'start', behavior: reduce.matches ? 'auto' : 'smooth' }));
root.addEventListener('keydown', event => { if (event.key === 'Escape') { pinned = OVERVIEW; show(OVERVIEW); } });

// links such as #strategy-03 (from "about us") open that strategy in the diagram
function fromHash() {
  const m = location.hash.match(/^#strategy-0([1-6])$/);
  if (!m) return;
  pinned = { kind: 'strategy', i: Number(m[1]) - 1 };
  show(pinned);
  requestAnimationFrame(() => workspace.scrollIntoView({ block: 'center', behavior: reduce.matches ? 'auto' : 'smooth' }));
}
addEventListener('hashchange', fromHash);
show(OVERVIEW);
fromHash();
const motion = root.querySelector('[data-network-motion]');
function updateMotion() {
  root.dataset.motionState = paused || reduce.matches ? 'paused' : 'running';
  motion.disabled = reduce.matches;
  motion.setAttribute('aria-pressed', String(paused || reduce.matches));
  motion.textContent = reduce.matches ? L('已减少动态', 'Reduced motion') : paused ? L('继续动效 ▷', 'Resume motion ▷') : L('暂停动效 Ⅱ', 'Pause motion Ⅱ');
  model?.setPaused(paused || reduce.matches);
}
motion.addEventListener('click', () => {paused=!paused;updateMotion();});
reduce.addEventListener('change', updateMotion);
updateMotion();
const observer = new IntersectionObserver(async entries => {
  if(!entries.some(entry=>entry.isIntersecting))return;
  observer.disconnect();
  try {
    const {createNetwork}=await import('./living-loop-scene.js');
    model=createNetwork(root, reduce, index => {const next=index < 0 ? pinned : {kind:'dir', i:index};if(!same(next,shown))show(next);});
    model.setState(shown.kind === 'dir' ? shown.i : -1);updateMotion();layoutRing();
  } catch {
    root.dataset.networkRenderer='fallback';
  }
},{rootMargin:'250px'});
observer.observe(workspace);
