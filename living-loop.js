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
let pinned = -1, shown = -1, model, paused = false;
function show(index) {
  shown = index;
  root.querySelector('[data-network-state]').dataset.networkState = index < 0 ? 'overview' : index;
  const c = index < 0 ? overview : content[index];
  root.querySelector('[data-loop-number]').textContent = c[0];
  root.querySelector('[data-loop-title]').innerHTML = c[1];
  root.querySelector('#anchor-detail').textContent = c[2];
  const d = index < 0 ? overviewDetail : detail[index];
  root.querySelector('[data-loop-question]').textContent = d[0];
  root.querySelector('[data-loop-tags]').textContent = d[1];
  root.querySelector('[data-network-credit]').innerHTML = index < 0 ? defaultCredit : credits[index];
  root.querySelectorAll('[data-network-image]').forEach(image => image.classList.toggle('is-visible', image.dataset.networkImage === (index < 0 ? 'overview' : String(index))));
  buttons.forEach((button, i) => {button.setAttribute('aria-pressed', String(pinned === i));button.classList.toggle('is-preview', i === index);});
  root.querySelector('[data-triangle-overview]').setAttribute('aria-pressed', String(index < 0));

  const link = root.querySelector('[data-network-case]');
  // each direction points to where it shows up further down the page
  const links = [
    ['#site-study', L('看真实场地 ↓', 'See the real site ↓')],
    ['#services', L('我们的服务 ↓', 'Our services ↓')],
    ['#projects', L('看项目 ↓', 'See projects ↓')]
  ];
  [link.href, link.textContent] = index < 0 ? ['#projects', L('看项目 ↓', 'See projects ↓')] : links[index];
  model?.setState(index);
}
buttons.forEach((button, index) => {
  button.addEventListener('pointerenter', event => {if(event.pointerType === 'mouse' && hover.matches)show(index);});
  button.addEventListener('focus', () => {if(button.matches(':focus-visible'))show(index);});
  button.addEventListener('blur', () => show(pinned));
  button.addEventListener('click', () => {pinned = pinned === index ? -1 : index;show(pinned);});
});
workspace.addEventListener('pointerleave', () => show(pinned));
root.querySelector('[data-triangle-overview]').addEventListener('click', () => {pinned=-1;show(-1);});
root.addEventListener('keydown', event => {if(event.key === 'Escape'){pinned=-1;show(-1);}});
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
function updateHint() {root.querySelector('.network-heading > p').textContent = hover.matches ? L('移动鼠标，走近一个方向。', 'Move your mouse towards a direction.') : L('轻点节点，探索一个方向。', 'Tap a node to explore a direction.');}
hover.addEventListener('change', updateHint);updateHint();
const observer = new IntersectionObserver(async entries => {
  if(!entries.some(entry=>entry.isIntersecting))return;
  observer.disconnect();
  try {
    const {createNetwork}=await import('./living-loop-scene.js');
    model=createNetwork(root, reduce, index => {const next=index < 0 ? pinned : index;if(next!==shown)show(next);});
    model.setState(shown);updateMotion();
  } catch {
    root.dataset.networkRenderer='fallback';
  }
},{rootMargin:'250px'});
observer.observe(workspace);
