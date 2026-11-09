/* Case overview: one horizontal row of project cards, current projects first,
   then past experience. Arrows, drag (mouse), swipe, trackpad and keyboard all
   move it; the menu links #cases-current / #cases-past slide it to that group. Each card opens a dialog built
   from its own hidden description, so the content is in the page even
   without this script. */

const section = document.querySelector('#cases');
if (section) {
  const track = section.querySelector('[data-case-track]');
  const cards = [...track.querySelectorAll('.project-card')];
  const prev = section.querySelector('[data-case-prev]');
  const next = section.querySelector('[data-case-next]');
  const bar = section.querySelector('[data-case-progress]');
  const dialog = section.querySelector('[data-project-dialog]');
  const body = dialog.querySelector('[data-project-dialog-body]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let opener = null;

  /* ---- groups: bring the section into view and slide the row to the group's first card ---- */
  function showGroup(group) {
    const first = cards.find(c => c.dataset.group === group);
    section.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth' });
    if (first) track.scrollTo({ left: first.offsetLeft - track.offsetLeft, behavior: reduce.matches ? 'auto' : 'smooth' });
  }
  document.querySelectorAll('a[href="#cases-current"], a[href="#cases-past"]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    const id = a.getAttribute('href').slice(1);
    history.replaceState(null, '', '#' + id);
    showGroup(id.slice(6));
  }));

  /* ---- moving the row ---- */
  const step = () => {
    const card = cards[0];
    const gap = parseFloat(getComputedStyle(track).columnGap) || 24;
    return card ? card.getBoundingClientRect().width + gap : track.clientWidth * 0.8;
  };
  const move = dir => track.scrollBy({ left: dir * step(), behavior: reduce.matches ? 'auto' : 'smooth' });
  prev.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));

  function update() {
    const max = track.scrollWidth - track.clientWidth;
    const share = Math.max(track.scrollWidth ? track.clientWidth / track.scrollWidth : 1, 0.08);
    const pos = max > 0 ? track.scrollLeft / max : 0;
    bar.style.width = `${share * 100}%`;
    bar.style.transform = `translateX(${pos * (1 / share - 1) * 100}%)`;
    prev.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= max - 2;
  }
  track.addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);

  // drag with a mouse; touch and trackpads scroll natively
  let drag = null, dragged = false;
  track.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    drag = { x: e.clientX, left: track.scrollLeft };
    dragged = false;
  });
  addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (!dragged && Math.abs(dx) > 6) { dragged = true; track.classList.add('is-dragging'); }
    if (dragged) track.scrollLeft = drag.left - dx;
  });
  addEventListener('pointerup', () => {
    if (!drag) return;
    drag = null;
    track.classList.remove('is-dragging');
  });
  // a drag should not also open the card it ended on
  track.addEventListener('click', e => { if (dragged) { e.preventDefault(); e.stopPropagation(); dragged = false; } }, true);
  track.addEventListener('dragstart', e => e.preventDefault());

  // if a card photo cannot load (e.g. a blocked image host), show the project's title block instead
  track.querySelectorAll('.project-thumb > img').forEach(img => img.addEventListener('error', () => {
    const box = img.parentElement, card = img.closest('.project-card');
    box.classList.add('project-thumb-text');
    box.innerHTML = `<b>${card.dataset.title}</b><small>${card.dataset.type}</small>`;
  }, { once: true }));

  /* ---- dialog ---- */
  function open(id, from) {
    const card = document.getElementById(id);
    const detail = card?.querySelector('.project-detail');
    if (!detail) return;
    opener = from || card.querySelector('.project-open');
    body.innerHTML = detail.innerHTML;
    const title = body.querySelector('h3');
    if (title) title.id = 'project-dialog-title';
    dialog.showModal();
    dialog.querySelector('[data-project-close]').focus();
    history.replaceState(null, '', '#' + id);
  }
  const close = () => dialog.close();

  cards.forEach(card => {
    const btn = card.querySelector('button.project-open');
    if (btn) btn.addEventListener('click', () => open(card.id, btn));
  });
  dialog.querySelector('[data-project-close]').addEventListener('click', close);
  dialog.addEventListener('click', e => {
    if (e.target === dialog) { close(); return; }                     // backdrop
    const link = e.target.closest('a[href^="#"]');                    // in-page link: close first, then go
    if (link) { e.preventDefault(); opener = null; close(); location.hash = link.getAttribute('href'); }
  });
  dialog.addEventListener('close', () => {
    if (location.hash && document.getElementById(location.hash.slice(1))?.classList.contains('project-card')) {
      history.replaceState(null, '', location.pathname + location.search + '#cases');
    }
    opener?.focus({ preventScroll: true });
  });

  /* ---- links: #project-xxx opens a dialog, #cases-current / #cases-past slide to a group ---- */
  const fromHash = () => {
    const id = location.hash.slice(1);
    if (id === 'cases-current' || id === 'cases-past') { showGroup(id.slice(6)); return; }
    const card = id ? document.getElementById(id) : null;
    if (card?.classList.contains('project-card') && !dialog.open) {
      track.scrollLeft = card.offsetLeft - track.offsetLeft;
      open(id);
    }
  };
  addEventListener('hashchange', fromHash);
  update();
  fromHash();

  window.KywooProjects = { open };
}
