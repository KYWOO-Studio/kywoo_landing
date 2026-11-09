document.body.classList.add('js');

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const desktopMode = window.matchMedia('(min-width: 901px)');
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

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

// Poster-first Hero. The source is attached only when needed.
const hero = document.querySelector('.hero');
const video = document.querySelector('[data-hero-video]');
const videoButton = document.querySelector('[data-video-toggle]');
const videoIcon = document.querySelector('[data-video-icon]');
const videoLabel = document.querySelector('[data-video-label]');
let videoAttached = false;
let userPaused = reducedMotion.matches;
let heroVisible = true;

function updateVideoButton() {
  const paused = video.paused || !videoAttached;
  videoIcon.textContent = paused ? '▶' : 'Ⅱ';
  videoLabel.textContent = paused ? '播放视频' : '暂停视频';
  videoButton.setAttribute('aria-label', paused ? '播放背景视频' : '暂停背景视频');
  videoButton.setAttribute('aria-pressed', String(!paused));
}

function attachVideo() {
  if (videoAttached) return;
  video.src = video.dataset.src;
  videoAttached = true;
  video.load();
}

async function playVideo() {
  attachVideo();
  try {
    await video.play();
  } catch {
    // Autoplay can be blocked; the poster and explicit play control remain usable.
  }
  updateVideoButton();
}

function primeVideo() {
  if (reducedMotion.matches) {
    updateVideoButton();
    return;
  }
  window.setTimeout(() => {
    if (heroVisible && !userPaused) playVideo();
  }, 500);
}

if ('requestIdleCallback' in window) window.requestIdleCallback(primeVideo, { timeout: 1800 });
else window.addEventListener('load', primeVideo, { once: true });

videoButton.addEventListener('click', () => {
  if (!videoAttached || video.paused) {
    userPaused = false;
    playVideo();
  } else {
    userPaused = true;
    video.pause();
  }
  updateVideoButton();
});
video.addEventListener('play', updateVideoButton);
video.addEventListener('pause', updateVideoButton);
video.addEventListener('error', () => {
  videoLabel.textContent = '静态封面';
  videoIcon.textContent = '—';
  videoButton.disabled = true;
});

new IntersectionObserver(([entry]) => {
  heroVisible = entry.isIntersecting;
  if (!videoAttached) return;
  if (!heroVisible) video.pause();
  else if (!userPaused && !reducedMotion.matches) playVideo();
}, { threshold: 0.05 }).observe(hero);
updateVideoButton();

// One shared scene, driven by the bounded desktop scroll region.
const track = document.querySelector('[data-method-track]');
const sceneContainer = document.querySelector('[data-scene-container]');
const sceneMount = document.querySelector('[data-scene-canvas]');
const sceneStatus = document.querySelector('[data-scene-status-label]');
const panels = [...document.querySelectorAll('[data-step-panel]')];
const viewButtons = [...document.querySelectorAll('[data-goto-step]')];
const methodCounter = document.querySelector('[data-method-counter]');
const methodProgress = document.querySelector('[data-method-progress]');
const viewCaption = document.querySelector('[data-view-caption]');
const floorButtons = [...document.querySelectorAll('[data-floor]')];
const floorName = document.querySelector('[data-floor-name]');
const returnTour = document.querySelector('[data-return-tour]');
const captions = [
  'REAL GEOGRAPHY / ESTIMATED LOCATION',
  'FLOOR PLATES → PROGRAM → SELECTION',
  'BASELINE → SCENARIO → LIMITATIONS'
];

let scene = null;
let sceneLoading = false;
let sceneFailed = false;
let sceneNear = false;
let sceneOnScreen = false;
let activeStep = 0;
let scrollProgress = 0;
let manualFloor = false;
let manualGeography = false;
let pendingFloor = -1;

// Reduced motion and small screens use explicit chapter selection.
const isScrollDriven = () => desktopMode.matches && !reducedMotion.matches;
const genericProgress = () => clamp((scrollProgress - 1/3) * 1.5);
const story = document.querySelector('.merged-story');
function announceChapter() {
  story.dataset.storyStep = String(activeStep);
  document.querySelector('[data-geography-layer]').inert = activeStep !== 0;
  document.querySelector('[data-story-provenance]').textContent = activeStep === 0 ? '真实地理资料 · 武林银泰周边' : '通用方法示范 · 非武林银泰实际建筑／楼层';
  window.dispatchEvent(new CustomEvent('kywoo:chapterchange', {detail:{step:activeStep,progress:scrollProgress}}));
  syncSceneVisibility();
}

function syncSceneVisibility() {
  scene?.setVisible(sceneOnScreen && !document.hidden && activeStep > 0);
}

function setActiveStep(index, { moveScene = true } = {}) {
  activeStep = clamp(index, 0, 2);
  panels.forEach((panel, panelIndex) => panel.classList.toggle('is-active', panelIndex === activeStep));
  viewButtons.forEach((button, buttonIndex) => {
    const selected = buttonIndex === activeStep;
    button.classList.toggle('is-active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  methodCounter.textContent = `0${activeStep + 1} / 03`;
  viewCaption.textContent = captions[activeStep];
  document.body.dataset.activeStep = String(activeStep + 1);
  announceChapter();
  if (moveScene && !manualFloor) {
    if (isScrollDriven()) scene?.setScrollProgress(genericProgress());
    else scene?.setStep(activeStep, { immediate: true });
  }
}

function updateScrollScene() {
  if (!isScrollDriven()) return;
  const rect = track.getBoundingClientRect();
  const distance = Math.max(1, track.offsetHeight - window.innerHeight);
  scrollProgress = clamp(-rect.top / distance);
  sceneContainer.dataset.scrollProgress = scrollProgress.toFixed(3);
  methodProgress.style.transform = `scaleX(${scrollProgress})`;
  if (manualFloor || manualGeography) return;
  const nextStep = Math.min(2, Math.floor(scrollProgress * 3 + 0.00001));
  if (nextStep !== activeStep) setActiveStep(nextStep, { moveScene: false });
  if (!manualFloor) scene?.setScrollProgress(genericProgress());
  announceChapter();
}

function scrollToStep(index, { immediate = false } = {}) {
  manualFloor = false;
  manualGeography = false;
  pendingFloor = -1;
  floorButtons.forEach((button) => {
    const selected = button.dataset.floor === '-1';
    button.classList.toggle('is-selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  floorName.textContent = '全栋 / ALL LEVELS';
  returnTour.hidden = true;
  scene?.setFloor(-1);
  if (isScrollDriven()) {
    const rect = track.getBoundingClientRect();
    const top = window.scrollY + rect.top;
    const distance = Math.max(1, track.offsetHeight - window.innerHeight);
    const progress = [0.08, 0.5, 0.86][index];
    window.scrollTo({ top: top + distance * progress, behavior: immediate || reducedMotion.matches ? 'auto' : 'smooth' });
    setActiveStep(index, { moveScene: false });
  } else {
    setActiveStep(index, { moveScene: true });
    scene?.setStep(index, { immediate: true });
  }
}

viewButtons.forEach((button) => {
  button.addEventListener('click', () => scrollToStep(Number(button.dataset.gotoStep)));
});

floorButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const index = Number(button.dataset.floor);
    manualFloor = index >= 0;
    pendingFloor = index;
    floorButtons.forEach((item) => {
      const selected = item === button;
      item.classList.toggle('is-selected', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    floorName.textContent = index < 0 ? '全栋 / ALL LEVELS' : `楼层 L0${index + 1} / SELECTED`;
    returnTour.hidden = index < 0;
    scene?.setStep(1);
    scene?.setFloor(index);
    if (index < 0) {
      manualFloor = false;
      if (isScrollDriven()) scene?.setScrollProgress(genericProgress());
      else scene?.setStep(activeStep);
    }
  });
});

returnTour.addEventListener('click', () => {
  manualFloor = false;
  pendingFloor = -1;
  returnTour.hidden = true;
  floorButtons.forEach((button) => {
    const selected = button.dataset.floor === '-1';
    button.classList.toggle('is-selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  floorName.textContent = '全栋 / ALL LEVELS';
  scene?.setFloor(-1);
  if (isScrollDriven()) scene?.setScrollProgress(genericProgress());
  else scene?.setStep(activeStep);
});

async function loadScene() {
  if (sceneLoading || scene || sceneFailed) return;
  sceneLoading = true;
  sceneStatus.textContent = 'LOADING 3D';
  try {
    const { GenericScene } = await import('./scene.js');
    scene = new GenericScene(sceneMount, {
      reducedMotion: reducedMotion.matches,
      onReady: () => {
        sceneContainer.classList.add('webgl-ready');
        sceneContainer.dataset.sceneStatus = 'ready';
        sceneStatus.textContent = isScrollDriven() ? 'LIVE / SCROLL VIEW' : 'LIVE / SELECT VIEW';
        document.documentElement.dataset.sceneReady = 'true';
        syncSceneVisibility();
      },
      onError: () => showSceneFallback()
    });
    if (isScrollDriven()) scene.setScrollProgress(genericProgress(), { immediate: true });
    else scene.setStep(activeStep, { immediate: true });
    if (pendingFloor >= 0) scene.setFloor(pendingFloor);
    syncSceneVisibility();
  } catch (error) {
    console.warn('The generic 3D preview could not be started.', error);
    showSceneFallback();
  } finally {
    sceneLoading = false;
  }
}

function showSceneFallback() {
  sceneFailed = true;
  sceneContainer.classList.remove('webgl-ready');
  sceneContainer.dataset.sceneStatus = 'fallback';
  sceneStatus.textContent = 'STATIC / 3D UNAVAILABLE';
  floorButtons.forEach((button) => { button.disabled = true; });
}

new IntersectionObserver(([entry]) => {
  sceneNear = entry.isIntersecting;
  if (sceneNear) loadScene();
}, { rootMargin: '90% 0px', threshold: 0 }).observe(track);

new IntersectionObserver(([entry]) => {
  sceneOnScreen = entry.isIntersecting;
  syncSceneVisibility();
}, { threshold: 0.01 }).observe(sceneContainer);

document.addEventListener('visibilitychange', syncSceneVisibility);
window.addEventListener('scroll', updateScrollScene, { passive: true });
window.addEventListener('resize', updateScrollScene, { passive: true });
desktopMode.addEventListener('change', () => {
  if (sceneContainer.dataset.sceneStatus === 'ready') {
    sceneStatus.textContent = isScrollDriven() ? 'LIVE / SCROLL VIEW' : 'LIVE / SELECT VIEW';
  }
  setActiveStep(activeStep);
  updateScrollScene();
});
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) {
    userPaused = true;
    video.pause();
  }
  setActiveStep(activeStep, { moveScene: true });
  updateScrollScene();
});
window.addEventListener('pagehide', () => scene?.dispose(), { once: true });

// Direct entry to #method-02 / #method-03 resolves to the same scene state.
if (/^#method-0[123]$/.test(window.location.hash)) {
  const index = Number(window.location.hash.slice(-1)) - 1;
  const resolveDirectStep = () => window.setTimeout(() => {
    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    scrollToStep(index, { immediate: true });
    setActiveStep(index);
    root.style.scrollBehavior = previousBehavior;
  }, 60);
  if (document.readyState === 'complete') resolveDirectStep();
  else window.addEventListener('load', resolveDirectStep, { once: true });
} else {
  setActiveStep(0);
  updateScrollScene();
}

window.addEventListener('kywoo:map-manual', () => {manualGeography = true;});
window.addEventListener('kywoo:map-resume', () => {manualGeography = false; updateScrollScene();});
function resolveStoryHash() {
  if(location.hash === '#site-study') scrollToStep(0, {immediate:true});
}
window.addEventListener('hashchange', resolveStoryHash);
if(location.hash === '#site-study') window.addEventListener('load', resolveStoryHash, {once:true});

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
      status.textContent = '已复制对话提纲，可贴到邮件里填写。本页没有收集或发送资料。';
    } catch {
      status.textContent = '无法自动复制，请从下方提纲手动复制。';
      fallback.open = true;
    }
  });
}
