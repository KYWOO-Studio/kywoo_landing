/* Project photo ring (merged in from the album page, 2026-11-09).
   Square photo tiles travel around the edge of a frame; the centre shows the
   project under the pointer or the one picked. Wide screens use the whole
   frame edge; narrow screens use a top and a bottom lane. Drag to move it,
   pause to stop it; under reduced motion it only moves when dragged.
   The tiles are a visual shortcut: every project is also in the list below,
   and the ring itself takes ←/→ and Enter from the keyboard. */

const ring = document.querySelector('[data-project-ring]');
if (ring) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const track = ring.querySelector('[data-ring-track]');
  const pauseBtn = ring.querySelector('[data-ring-pause]');
  const out = {
    type: ring.querySelector('[data-ring-type]'), name: ring.querySelector('[data-ring-name]'),
    summary: ring.querySelector('[data-ring-summary]'), link: ring.querySelector('[data-ring-link]')
  };
  const idle = { type: out.type.textContent, name: out.name.textContent, summary: out.summary.textContent, link: out.link.innerHTML, href: out.link.getAttribute('href') };
  const items = [...document.querySelectorAll('[data-ring-item]')].map(el => ({
    id: el.id, type: el.dataset.type, name: el.dataset.name, subtitle: el.dataset.subtitle,
    summary: el.dataset.summary, thumb: el.dataset.thumb, position: el.dataset.position, title: el.dataset.title,
    number: el.querySelector('.project-num')?.textContent.split('/')[0].trim() || ''
  }));

  let tiles = [], mode = '', W = 0, H = 0, T = 0, GAP = 10, offset = 0, velocity = 0;
  let playing = !reduce.matches, visible = false, hover = false, raf = 0, last = 0;
  let selected = -1, previewed = -1, drag = null, suppressClick = false;

  ring.tabIndex = 0;
  ring.setAttribute('role', 'region');
  ring.setAttribute('aria-roledescription', '照片环');
  ring.setAttribute('aria-label', '项目照片环：左右方向键切换项目，Enter 查看项目说明');

  function tile(item) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'ring-tile' + (item.thumb ? '' : ' is-text');
    b.tabIndex = -1;
    b.setAttribute('aria-hidden', 'true');
    b.innerHTML = item.thumb
      ? `<img src="${item.thumb}" alt="" loading="lazy" decoding="async" draggable="false" style="object-position:${item.position}"><span>${item.name}</span>`
      : `<b>${item.title}</b><span>${item.name}</span>`;
    return b;
  }

  // Lanes are clipped strips. Wide screens: four lanes in a pinwheel around the centre
  // (top runs left, right runs up, bottom runs right, left runs down), so no tile ever
  // turns a corner or overlaps another. Narrow screens: a top and a bottom lane.
  let lanes = [];
  function layout() {
    const r = ring.getBoundingClientRect();
    W = r.width; H = r.height;
    const nextMode = W >= 720 ? 'frame' : 'strips';
    const nextT = nextMode === 'frame' ? Math.round(Math.min(150, Math.max(104, W / 9))) : Math.round(Math.min(96, Math.max(76, W / 4.6)));
    ring.style.setProperty('--tile', nextT + 'px');
    const defs = nextMode === 'frame'
      ? [ { x: 0, y: 0, w: W - nextT, h: nextT, axis: 'x', dir: -1, shift: 0 },
          { x: W - nextT, y: 0, w: nextT, h: H - nextT, axis: 'y', dir: -1, shift: 2 },
          { x: nextT, y: H - nextT, w: W - nextT, h: nextT, axis: 'x', dir: 1, shift: 4 },
          { x: 0, y: nextT, w: nextT, h: H - nextT, axis: 'y', dir: 1, shift: 1 } ]
      : [ { x: 0, y: 0, w: W, h: nextT, axis: 'x', dir: -1, shift: 0 },
          { x: 0, y: H - nextT, w: W, h: nextT, axis: 'x', dir: 1, shift: 3 } ];
    const step = nextT + GAP;
    const sig = nextMode + defs.map(d => Math.ceil((d.axis === 'x' ? d.w : d.h) / step)).join(',');
    T = nextT;
    if (sig !== layout.sig) {
      layout.sig = sig; mode = nextMode;
      track.innerHTML = ''; tiles = []; lanes = [];
      defs.forEach(d => {
        const el = document.createElement('div');
        el.className = 'ring-lane';
        track.append(el);
        const count = Math.ceil((d.axis === 'x' ? d.w : d.h) / step) + 1;
        const lane = { ...d, el, tiles: [] };
        for (let k = 0; k < count; k++) {
          const idx = (k + d.shift) % items.length;
          const t = tile(items[idx]);
          t.dataset.item = idx;
          el.append(t);
          lane.tiles.push(t); tiles.push({ el: t, idx });
        }
        lanes.push(lane);
      });
      mark();
    } else {
      lanes.forEach((lane, i) => Object.assign(lane, defs[i]));
    }
    lanes.forEach(l => Object.assign(l.el.style, { left: l.x + 'px', top: l.y + 'px', width: l.w + 'px', height: l.h + 'px' }));
    place();
  }

  function place() {
    const step = T + GAP;
    lanes.forEach(lane => {
      const L = lane.tiles.length * step;
      lane.tiles.forEach((t, k) => {
        const p = (((k * step + lane.dir * offset) % L) + L) % L - step;
        t.style.transform = lane.axis === 'x' ? `translate3d(${p}px,0,0)` : `translate3d(0,${p}px,0)`;
      });
    });
  }

  function mark() {
    const on = selected >= 0 ? selected : previewed;
    tiles.forEach(t => t.el.classList.toggle('is-selected', t.idx === on));
  }

  function show(idx) {
    previewed = idx;
    const item = items[idx];
    if (!item) {
      out.type.textContent = idle.type; out.name.textContent = idle.name; out.summary.textContent = idle.summary;
      out.link.innerHTML = idle.link; out.link.setAttribute('href', idle.href);
    } else {
      out.type.textContent = `${item.type} · ${item.number}`;
      out.name.textContent = item.name;
      out.summary.textContent = `${item.subtitle}。${item.summary}`;
      out.link.innerHTML = '查看项目 <span aria-hidden="true">↓</span>';
      out.link.setAttribute('href', '#' + item.id);
    }
    mark();
  }

  function select(idx) { selected = idx; show(idx); }

  function frame(now) {
    raf = 0;
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
    last = now;
    if (!drag) {
      if (playing && !hover && !reduce.matches) offset += 24 * dt;
      offset += velocity * dt;
      velocity *= Math.exp(-dt * 3);
      if (Math.abs(velocity) < 2) velocity = 0;
    }
    place();
    if (running()) raf = requestAnimationFrame(frame);
  }
  const running = () => visible && !document.hidden && (drag || Math.abs(velocity) > 0 || (playing && !hover && !reduce.matches));
  function kick() { if (!raf && running()) { last = 0; raf = requestAnimationFrame(frame); } }

  function setPlaying(on) {
    playing = on;
    pauseBtn.setAttribute('aria-pressed', String(!on));
    pauseBtn.setAttribute('aria-label', on ? '暂停照片环' : '播放照片环');
    pauseBtn.textContent = on ? '暂停 Ⅱ' : '播放 ▶';
    kick();
  }

  // pointer: hover previews, drag moves the ring, click/tap picks a project
  track.addEventListener('pointerover', e => {
    const t = e.target.closest('.ring-tile');
    if (t && e.pointerType === 'mouse' && !drag) show(+t.dataset.item);
  });
  ring.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { hover = true; } });
  ring.addEventListener('pointerleave', e => {
    if (e.pointerType !== 'mouse') return;
    hover = false;
    if (selected < 0) show(-1); else show(selected);
    kick();
  });
  track.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    drag = { x: e.clientX, y: e.clientY, last: e.clientX, t: performance.now(), moved: 0, id: e.pointerId };
    velocity = 0;
    kick();
  });
  window.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.last, now = performance.now();
    drag.moved += Math.abs(dx);
    if (drag.moved > 6 && !track.hasPointerCapture?.(e.pointerId)) { try { track.setPointerCapture(e.pointerId); } catch {} }
    const sign = mode === 'strips' ? -1 : -1;              // drag right moves the top lane right
    offset += sign * dx;
    velocity = sign * dx / Math.max(0.008, (now - drag.t) / 1000);
    drag.last = e.clientX; drag.t = now;
  });
  const endDrag = e => {
    if (!drag || e.pointerId !== drag.id) return;
    suppressClick = drag.moved > 6;
    if (performance.now() - drag.t > 120) velocity = 0;
    drag = null;
    kick();
  };
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
  track.addEventListener('click', e => {
    const t = e.target.closest('.ring-tile');
    if (!t) return;
    if (suppressClick) { suppressClick = false; return; }
    select(+t.dataset.item);
  });

  ring.addEventListener('keydown', e => {
    if (e.target !== ring) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const base = selected < 0 ? (e.key === 'ArrowRight' ? -1 : 0) : selected;
      select((base + (e.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length);
      offset += (e.key === 'ArrowRight' ? 1 : -1) * (T + GAP);
      place();
    } else if (e.key === 'Enter' && selected >= 0) {
      e.preventDefault();
      location.hash = items[selected].id;
    } else if (e.key === 'Escape') {
      selected = -1; show(-1);
    }
  });

  pauseBtn.addEventListener('click', () => setPlaying(!playing));
  reduce.addEventListener('change', () => setPlaying(!reduce.matches && playing));
  new ResizeObserver(layout).observe(ring);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; kick(); }, { threshold: 0.05 }).observe(ring);
  document.addEventListener('visibilitychange', kick);

  layout();
  setPlaying(playing);
}
