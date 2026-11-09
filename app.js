document.body.classList.add('js');
const EN = document.documentElement.lang === 'en';
const L = (zh, en) => (EN ? en : zh);


// Header and restrained section entrances.
const header = document.querySelector('[data-header]');
const updateHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 36);
window.addEventListener('scroll', updateHeader, { passive: true });
window.addEventListener('pageshow', () => requestAnimationFrame(updateHeader));
window.addEventListener('load', updateHeader, { once: true });
updateHeader();

const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

// Native dialog gives the disclosure a keyboard-accessible, no-dependency pattern.
const disclosure = document.querySelector('[data-disclosure]');
const openDisclosure = document.querySelector('[data-open-disclosure]');
const closeDisclosure = document.querySelector('[data-close-disclosure]');
openDisclosure.addEventListener('click', () => {
  disclosure.showModal();
  document.body.classList.add('dialog-open');
});
closeDisclosure.addEventListener('click', () => disclosure.close());
disclosure.addEventListener('click', (event) => {
  const rect = disclosure.getBoundingClientRect();
  const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
  if (outside) disclosure.close();
});
disclosure.addEventListener('close', () => document.body.classList.remove('dialog-open'));

// Contact: copy the conversation outline (merged from the album page). Nothing is sent anywhere.
const briefButton = document.querySelector('[data-copy-brief]');
if (briefButton) {
  const status = document.querySelector('[data-brief-status]');
  const fallback = document.querySelector('[data-brief-fallback]');
  briefButton.addEventListener('click', async () => {
    const text = document.querySelector('[data-brief-text]').textContent;
    try {
      await navigator.clipboard.writeText(text);
      status.textContent = L('已复制对话提纲，可贴到邮件里填写。本页没有收集或发送资料。', 'Outline copied. Paste it into your email. This page does not collect or send anything.');
    } catch {
      status.textContent = L('无法自动复制，请从下方提纲手动复制。', 'Could not copy automatically. Please copy the outline below.');
      fallback.open = true;
    }
  });
}
