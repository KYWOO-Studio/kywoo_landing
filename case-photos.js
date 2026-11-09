/* Real-scene photo carousels (hero, and the current-project cards).
   Each photo slowly pushes in while it is shown, then cross-fades to the next.
   Full carousels: tap the photo or swipe for the next one, use the bars to
   jump, or pause. data-case-photos="auto" (inside a card button) only plays.
   Plays only while on screen; under reduced motion it stays still and only
   changes when the visitor asks. Photos that fail to load are dropped. */

const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const HOLD = 5500;      // ms each photo stays before the next one
const EN = document.documentElement.lang === 'en';

document.querySelectorAll('[data-case-photos]').forEach(fig => {
  const auto = fig.dataset.casePhotos === 'auto';
  const frame = fig.querySelector('.cp-frame');
  const caption = fig.querySelector('.cp-caption');
  const bars = fig.querySelector('.cp-bars');
  const pause = fig.querySelector('[data-cp-pause]');
  let slides = [...fig.querySelectorAll('.cp-slide')];
  let index = 0, playing = !reduce.matches, visible = false, timer = 0;

  // alternate the push-in direction so consecutive photos do not drift the same way
  const drift = [['-2%', '-1.5%'], ['2%', '-1%'], ['-1.5%', '1.5%'], ['1.5%', '1%']];

  function build() {
    if (bars) bars.innerHTML = '';
    slides.forEach((img, k) => {
      img.style.setProperty('--kb-x', drift[k % drift.length][0]);
      img.style.setProperty('--kb-y', drift[k % drift.length][1]);
      if (!bars) return;
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', EN ? `Photo ${k + 1} of ${slides.length}: ${img.alt}` : `第 ${k + 1} 张，共 ${slides.length} 张：${img.alt}`);
      b.addEventListener('click', () => go(k));
      b.append(document.createElement('i'));
      bars.append(b);
    });
    fig.classList.toggle('is-single', slides.length < 2);
    if (!slides.length && !auto) fig.hidden = true;
  }

  function go(n) {
    if (!slides.length) return;
    index = (n + slides.length) % slides.length;
    slides.forEach((img, k) => {
      const on = k === index;
      if (on) { img.classList.remove('is-active'); void img.offsetWidth; }   // restart the push-in
      img.classList.toggle('is-active', on);
      img.setAttribute('aria-hidden', String(!on));
    });
    if (bars) [...bars.children].forEach((b, k) => {
      const on = k === index;
      if (on) { b.classList.remove('is-current'); void b.offsetWidth; }    // restart the progress fill
      b.classList.toggle('is-current', on);
      b.setAttribute('aria-pressed', String(on));
    });
    if (caption) caption.textContent = slides[index].dataset.caption || slides[index].alt;
    schedule();
  }

  function schedule() {
    clearTimeout(timer);
    const run = playing && visible && !document.hidden && slides.length > 1;
    fig.classList.toggle('is-playing', run);
    if (run) timer = setTimeout(() => go(index + 1), HOLD);
  }

  function setPlaying(on) {
    playing = on;
    if (pause) {
      pause.setAttribute('aria-pressed', String(!on));
      pause.setAttribute('aria-label', EN ? (on ? 'Pause photos' : 'Play photos') : (on ? '暂停照片轮播' : '播放照片轮播'));
      pause.textContent = EN ? (on ? 'Pause Ⅱ' : 'Play ▶') : (on ? '暂停 Ⅱ' : '播放 ▶');
    }
    schedule();
  }

  slides.forEach(img => img.addEventListener('error', () => {
    slides = slides.filter(s => s !== img);
    img.remove();
    build();
    if (!slides.length && auto) {
      // every photo failed (e.g. a blocked image host): show the card's title block instead
      const card = fig.closest('.project-card');
      fig.classList.add('project-thumb-text');
      fig.innerHTML = `<b>${card?.dataset.title || ''}</b><small>${card?.dataset.type || ''}</small>`;
      return;
    }
    go(Math.min(index, slides.length - 1));
  }, { once: true }));

  if (pause) pause.addEventListener('click', () => setPlaying(!playing));
  if (!auto) {
    let swiped = false;
    frame.addEventListener('click', () => { if (swiped) { swiped = false; return; } go(index + 1); });

    // swipe on touch screens
    let startX = null;
    frame.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') startX = e.clientX; });
    frame.addEventListener('pointerup', e => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      startX = null;
      if (Math.abs(dx) > 40) { swiped = true; go(index + (dx < 0 ? 1 : -1)); }
    });
  }

  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; schedule(); }, { threshold: 0.25 }).observe(fig);
  document.addEventListener('visibilitychange', schedule);
  reduce.addEventListener('change', () => setPlaying(!reduce.matches && playing));

  build();
  setPlaying(playing);
  go(0);
});
