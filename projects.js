/* Projects grid: filter by direction (数据 / 空间 / 活动) and open a project
   in a dialog. Each card carries its own full description in a hidden block,
   so the content is in the page even without this script. */

const section = document.querySelector('#projects');
if (section) {
  const cards = [...section.querySelectorAll('.project-card')];
  const filters = [...section.querySelectorAll('[data-filter]')];
  const count = section.querySelector('[data-project-count]');
  const dialog = section.querySelector('[data-project-dialog]');
  const body = dialog.querySelector('[data-project-dialog-body]');
  let opener = null;

  function filter(dir) {
    let shown = 0;
    cards.forEach(card => {
      const on = dir === 'all' || card.dataset.dirs.split(' ').includes(dir);
      card.hidden = !on;
      if (on) shown++;
    });
    filters.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === dir)));
    const label = filters.find(b => b.dataset.filter === dir).textContent;
    count.textContent = document.documentElement.lang === 'en'
      ? (dir === 'all' ? `${shown} projects` : `${label}: ${shown} projects`)
      : (dir === 'all' ? `共 ${shown} 项` : `涉及${label}：${shown} 项`);
  }
  filters.forEach(b => b.addEventListener('click', () => filter(b.dataset.filter)));
  // if a card photo cannot load (e.g. a blocked image host), show the project's title block instead
  section.querySelectorAll('.project-thumb img').forEach(img => img.addEventListener('error', () => {
    const box = img.parentElement, card = img.closest('.project-card');
    box.classList.add('project-thumb-text');
    box.innerHTML = `<b>${card.dataset.title}</b><small>${card.dataset.type}</small>`;
  }, { once: true }));
  filter('all');

  function open(id, from) {
    const card = document.getElementById(id);
    const detail = card?.querySelector('.project-detail');
    if (!detail) { if (card) location.hash = id; return; }
    opener = from || card.querySelector('.project-open');
    body.innerHTML = detail.innerHTML;
    const title = body.querySelector('h3');
    if (title) title.id = 'project-dialog-title';
    dialog.showModal();
    dialog.querySelector('[data-project-close]').focus();
    history.replaceState(null, '', '#' + id);
  }
  function close() { dialog.close(); }

  cards.forEach(card => {
    const btn = card.querySelector('button.project-open');
    if (btn) btn.addEventListener('click', () => open(card.id, btn));
  });
  dialog.querySelector('[data-project-close]').addEventListener('click', close);
  dialog.addEventListener('click', e => { if (e.target === dialog) close(); });   // backdrop
  dialog.addEventListener('close', () => {
    if (location.hash && document.getElementById(location.hash.slice(1))?.classList.contains('project-card')) {
      history.replaceState(null, '', location.pathname + location.search + '#projects');
    }
    opener?.focus({ preventScroll: true });
  });

  // a shared link to a project (#project-whampoa) opens its dialog
  const fromHash = () => {
    const id = location.hash.slice(1);
    const card = id ? document.getElementById(id) : null;
    if (card?.classList.contains('project-card') && card.querySelector('.project-detail') && !dialog.open) open(id);
  };
  window.addEventListener('hashchange', fromHash);
  fromHash();

  window.KywooProjects = { open };
}
