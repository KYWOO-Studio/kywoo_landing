const C = require('../../data/content.js');
const A = require('../../utils/actions.js');

const CT = C.contact;

Component({
  data: {
    c: CT,
    open: CT.faq.map((_, i) => i === 0), // the first answer starts open, as on the website
  },
  methods: {
    copyEmail() {
      A.copy(CT.email, `已复制邮箱 ${CT.email}`);
    },
    copyWechat() {
      A.copy(CT.wechat, `已复制微信号，打开微信添加好友即可`);
    },
    copyBrief() {
      A.copy(CT.brief.lines.join('\n'), `已复制${CT.brief.title}`);
    },
    toggle(e) {
      const i = Number(e.currentTarget.dataset.i);
      this.setData({ [`open[${i}]`]: !this.data.open[i] });
    },
    toNotes() {
      wx.navigateTo({ url: '/pages/notes/notes' });
    },
    onShareAppMessage() {
      return A.share(`${CT.titleLines.join('')} · KYWOO Studio`, '/pages/contact/contact');
    },
    onShareTimeline() {
      return { title: `${CT.titleLines.join('')} · KYWOO Studio` };
    },
  },
});
