/* Scroll effects in the spirit of gehlpeople.com: the hero photo drifts and
   the big statement lights up word by word as it passes through the screen.
   Section entrances use the shared `.reveal` observer in app.js.
   Nothing moves under reduced motion; the statement is then fully shown. */

const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const EN = document.documentElement.lang === 'en';

// split the statement into pieces (characters in Chinese, words in English)
const statement = document.querySelector('[data-scroll-statement]');
let pieces = [];
if (statement) {
  const text = statement.textContent.trim();
  statement.setAttribute('aria-label', text);
  statement.textContent = '';
  const piece = (part, parent) => {
    const span = document.createElement('span');
    span.className = 'ch';
    span.setAttribute('aria-hidden', 'true');
    span.textContent = part;
    parent.append(span);
    pieces.push(span);
  };
  if (EN) {
    text.split(/(\s+)/).forEach(part => (/^\s+$/.test(part) ? statement.append(part) : piece(part, statement)));
  } else {
    // one block per phrase, e.g. 在哪里停留、 — lines then break only between phrases
    (text.match(/[^，、。！？；：]+[，、。！？；：]*/g) || [text]).forEach(phrase => {
      const box = document.createElement('span');
      box.className = 'phrase';
      box.setAttribute('aria-hidden', 'true');
      [...phrase].forEach(ch => piece(ch, box));
      statement.append(box);
    });
  }
}

const heroFrame = document.querySelector('.hero-photos .hero-photo-frame');
const heroContent = document.querySelector('.hero-photos .hero-photo-content');
let ticking = false;

function frame() {
  ticking = false;
  const vh = innerHeight;

  if (statement) {
    let lit = pieces.length;
    if (!reduce.matches) {
      const r = statement.getBoundingClientRect();
      // 0 when the statement's top reaches 85% of the screen, 1 when its bottom reaches 40%
      const p = (vh * 0.85 - r.top) / (vh * 0.45 + r.height);
      lit = Math.round(Math.min(1, Math.max(0, p)) * pieces.length);
    }
    pieces.forEach((span, i) => span.classList.toggle('is-lit', i < lit));
  }

  if (heroFrame && !reduce.matches) {
    const y = Math.min(scrollY, vh);
    heroFrame.style.transform = `translate3d(0, ${y * 0.28}px, 0) scale(${1 + y / vh * 0.06})`;
    if (heroContent) heroContent.style.opacity = String(Math.max(0, 1 - y / (vh * 0.75)));
  } else if (heroFrame) {
    heroFrame.style.transform = '';
    if (heroContent) heroContent.style.opacity = '';
  }
}

const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
addEventListener('scroll', request, { passive: true });
addEventListener('resize', request);
reduce.addEventListener('change', request);
frame();
