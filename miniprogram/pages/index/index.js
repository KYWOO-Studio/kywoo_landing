const C = require('../../data/content.js');
const A = require('../../utils/actions.js');

Component({
  data: {
    hero: C.hero,
    approach: C.approach,
    principlesOpen: false,
    about: C.about,
    numbers: C.numbers,
    metricValues: C.numbers.items.map(() => '0'),
    metricsAnimating: false,
    metricsReduced: false,
    principles: C.principles,
    statement: C.statement,
    footer: C.footer,
    entries: [
      { tab: 'cases', title: C.cases.kicker, sub: C.cases.kickerSub },
      { tab: 'contact', title: C.contact.kicker, sub: C.contact.kickerSub },
    ],
    slide: 0,
    nav: { top: 24, height: 32 },
    statementIn: false,
  },
  methods: {
    onLoad() {
      // line the wordmark up with WeChat's capsule button in the custom top bar
      try {
        const m = wx.getMenuButtonBoundingClientRect();
        if (m && m.top) this.setData({ nav: { top: m.top, height: m.height } });
      } catch (e) { /* keep defaults */ }
    },
    onReady() {
      try {
        if (wx.getStorageSync('kywoo-reduce-motion')) {
          this.setData({ metricsReduced: true });
          this.finishMetrics();
          return;
        }
        this.metricObserver = this.createIntersectionObserver({ thresholds: [0.15] });
        this.metricObserver.relativeToViewport().observe('.practice-numbers', result => {
          if (result.intersectionRatio >= 0.15) this.startMetrics();
        });
      } catch (e) { this.finishMetrics(); }
    },
    startMetrics() {
      if (this.metricsStarted || this.data.metricsReduced) return;
      this.metricsStarted = true;
      if (this.metricObserver) this.metricObserver.disconnect();
      const begin = Date.now();
      this.setData({ metricsAnimating: true });
      const tick = () => {
        const p = Math.min(1, (Date.now() - begin) / 1600);
        this.setData({ metricValues: C.numbers.items.map(item =>
          String(Math.round(Number(item.value.replace(/,/g, '')) * (1 - Math.pow(1 - p, 3)))).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
        ) });
        if (p < 1) this.metricTimer = setTimeout(tick, 50); else this.finishMetrics();
      };
      tick();
    },
    finishMetrics() {
      clearTimeout(this.metricTimer);
      if (this.metricObserver) this.metricObserver.disconnect();
      this.setData({ metricValues: C.numbers.items.map(item => item.value), metricsAnimating: false });
    },
    reduceMetrics() {
      this.setData({ metricsReduced: true });
      try { wx.setStorageSync('kywoo-reduce-motion', true); } catch (e) { /* session only */ }
      this.finishMetrics();
    },
    onHide() { if (this.metricsStarted) this.finishMetrics(); },
    onUnload() { clearTimeout(this.metricTimer); if (this.metricObserver) this.metricObserver.disconnect(); },
    // the statement's phrases come in once the band is on screen (checked at most every 150 ms)
    onPageScroll() {
      if (this.data.statementIn || this.checking) return;
      this.checking = true;
      setTimeout(() => {
        this.createSelectorQuery().select('.statement').boundingClientRect((r) => {
          this.checking = false;
          const h = (wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()).windowHeight;
          if (r && r.top < h - 60) this.setData({ statementIn: true });
        }).exec();
      }, 150);
    },
    togglePrinciples() { this.setData({ principlesOpen: !this.data.principlesOpen }); },
    onSlide(e) {
      this.setData({ slide: e.detail.current });
    },
    goSlide(e) {
      this.setData({ slide: Number(e.currentTarget.dataset.i) });
    },
    toTab(e) {
      const { tab, strategy } = e.currentTarget.dataset;
      A.toTab(tab, strategy === undefined || strategy === '' ? -1 : Number(strategy));
    },
    toNotes() {
      wx.navigateTo({ url: '/pages/notes/notes' });
    },
    toTop() {
      wx.pageScrollTo({ scrollTop: 0, duration: 400 });
    },
    onShareAppMessage() {
      return A.share(C.brand.shareTitle, '/pages/index/index', C.hero.slides[0].src);
    },
    onShareTimeline() {
      return { title: C.brand.shareTitle };
    },
  },
});
