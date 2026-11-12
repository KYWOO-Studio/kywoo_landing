const C = require('../../data/content.js');
const A = require('../../utils/actions.js');

Component({
  data: {
    hero: C.hero,
    about: C.about,
    principles: C.principles,
    statement: C.statement,
    footer: C.footer,
    entries: [
      { tab: 'services', title: C.approach.kicker, sub: C.approach.kickerSub },
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
