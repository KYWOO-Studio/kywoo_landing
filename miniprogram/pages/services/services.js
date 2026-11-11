const C = require('../../data/content.js');
const A = require('../../utils/actions.js');

const AP = C.approach;

Component({
  data: {
    kicker: AP.kicker,
    kickerSub: AP.kickerSub,
    listTitle: AP.listTitle,
    cards: AP.strategies.map((s) => Object.assign({}, s, { flags: A.dirFlags(s.dirs) })),
    selected: -1,
  },
  methods: {
    onShow() {
      // a link on another tab asked for one service
      const app = getApp();
      const i = app.globalData.focusStrategy;
      if (i >= 0) {
        app.globalData.focusStrategy = -1;
        this.show(i);
      }
    },
    show(i) {
      const net = this.selectComponent('#network');
      if (net) net.select('strategy', i);
      this.setData({ selected: i });
      wx.pageScrollTo({ scrollTop: 0, duration: 300 });
    },
    // tapping a card shows that service in the diagram; tapping the chosen card again clears it
    pick(e) {
      const i = Number(e.currentTarget.dataset.i);
      if (i === this.data.selected) {
        const net = this.selectComponent('#network');
        if (net) net.select('strategy', -1);
        this.setData({ selected: -1 });
        return;
      }
      this.show(i);
    },
    onNetworkChange(e) {
      const { kind, i } = e.detail;
      this.setData({ selected: kind === 'strategy' ? i : -1 });
    },
    onShareAppMessage() {
      return A.share(`${AP.kicker} · KYWOO Studio`, '/pages/services/services');
    },
    onShareTimeline() {
      return { title: `${AP.kicker} · KYWOO Studio` };
    },
  },
});
