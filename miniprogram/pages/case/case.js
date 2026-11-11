const C = require('../../data/content.js');
const A = require('../../utils/actions.js');

const ITEMS = C.cases.items;

Component({
  data: {
    item: null,
    flags: [],
    next: null,
  },
  methods: {
    onLoad(query) {
      const at = Math.max(0, ITEMS.findIndex((c) => c.id === query.id));
      const item = ITEMS[at];
      const next = ITEMS[(at + 1) % ITEMS.length];
      this.setData({ item, flags: A.dirFlags(item.dirs), next: { id: next.id, name: next.name } });
      wx.setNavigationBarTitle({ title: item.name });
    },
    onImgError(e) {
      const i = Number(e.currentTarget.dataset.i);
      const photos = this.data.item.photos.filter((_, k) => k !== i);
      this.setData({ 'item.photos': photos });
    },
    openLink(e) {
      A.openLink(e.currentTarget.dataset.url);
    },
    toNext() {
      wx.redirectTo({ url: `/pages/case/case?id=${this.data.next.id}` });
    },
    toContact() {
      A.toTab('contact');
    },
    onShareAppMessage() {
      const it = this.data.item;
      return A.share(`${it.name} · ${it.sub}`, `/pages/case/case?id=${it.id}`, it.photos[0].src);
    },
    onShareTimeline() {
      const it = this.data.item;
      return { title: `${it.name} · ${it.sub}`, query: `id=${it.id}` };
    },
  },
});
