const C = require('../../data/content.js');
const A = require('../../utils/actions.js');

const CS = C.cases;
const ITEMS = CS.items.map((c) => Object.assign({}, c, { flags: A.dirFlags(c.dirs), thumb: c.photos[0].src }));
const count = (g) => ITEMS.filter((c) => c.group === g).length;

Component({
  data: {
    kicker: CS.kicker,
    kickerSub: CS.kickerSub,
    titleLines: CS.titleLines,
    filters: [
      { key: 'all', label: '全部', n: ITEMS.length },
      { key: 'current', label: CS.groups.current, n: count('current') },
      { key: 'past', label: CS.groups.past, n: count('past') },
    ],
    filter: 'all',
    shown: ITEMS,
  },
  methods: {
    setFilter(e) {
      const f = e.currentTarget.dataset.f;
      this.setData({ filter: f, shown: f === 'all' ? ITEMS : ITEMS.filter((c) => c.group === f) });
    },
    open(e) {
      wx.navigateTo({ url: `/pages/case/case?id=${e.currentTarget.dataset.id}` });
    },
    onShareAppMessage() {
      return A.share(`${CS.kicker} · KYWOO Studio`, '/pages/cases/cases', ITEMS[2] && ITEMS[2].thumb);
    },
    onShareTimeline() {
      return { title: `${CS.kicker} · KYWOO Studio` };
    },
  },
});
