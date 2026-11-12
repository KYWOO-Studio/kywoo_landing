const C = require('../../data/content.js');
const D = require('./draw.js');

const AP = C.approach;
const S = AP.strategies;
const DIR_NAMES = AP.dirs.map((d) => d.name);
const OVERVIEW = { kind: 'overview', i: -1 };
const FRAME_MS = 33; // about 30 frames a second is enough for the slow drift

function panelFor(state) {
  if (state.kind === 'dir') {
    const d = AP.dirs[state.i];
    const related = S.map((s) => (s.dirs.indexOf(state.i) >= 0 ? `${s.num} ${s.short}` : '')).filter(Boolean).join(' · ');
    return { index: d.index, titleLines: d.titleLines, detail: d.detail, question: d.question, tags: d.tags, related: `对应方法：${related}` };
  }
  if (state.kind === 'strategy') {
    const s = S[state.i];
    return {
      index: `方法 ${s.num} / 06`,
      titleLines: s.titleLines,
      detail: s.desc,
      question: `${s.outLabel}：${s.out}`,
      tags: '',
      related: `连着：${s.dirs.map((d) => DIR_NAMES[d]).join(' × ')}`,
    };
  }
  const o = AP.overview;
  return { index: o.index, titleLines: o.titleLines, detail: o.detail, question: o.question, tags: o.tags, related: '' };
}

Component({
  options: { addGlobalClass: true }, // the .serif and .line classes from app.wxss
  data: {
    W: 375,
    H: 398,
    dirs: [],
    nodes: [],
    bgs: [],
    bgOn: 'overview',
    panel: panelFor(OVERVIEW),
    paused: false,
    hint: AP.hint,
  },
  lifetimes: {
    attached() {
      this.state = OVERVIEW;
      this.t = 0;
      this.visible = true;
      this.pageShown = true;
      this.layout();
    },
    ready() {
      this.initCanvas();
    },
    detached() {
      this.stop();
    },
  },
  pageLifetimes: {
    show() { this.pageShown = true; this.kick(); },
    hide() { this.pageShown = false; this.stop(); },
    resize() { this.layout(); this.initCanvas(); },
  },
  methods: {
    layout() {
      const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
      const g = D.geometry(info.windowWidth, S);
      this.g = g;
      const bgs = [{ key: 'overview', src: AP.overview.image }].concat(AP.dirs.map((d, i) => ({ key: String(i), src: d.image })));
      this.setData({
        W: g.W,
        H: g.H,
        bgs: bgs.filter((b) => b.src),
        dirs: AP.dirs.map((d, i) => ({ label: d.label, name: d.name, short: d.short, x: g.verts[i].x, y: g.verts[i].y, size: g.dD, cls: '' })),
        nodes: S.map((s, i) => ({ num: s.num, short: s.short, title: s.title, x: g.ring[i].x, y: g.ring[i].y, size: g.dS, cls: '' })),
      });
      this.apply(this.state || OVERVIEW, false);
    },
    initCanvas() {
      this.createSelectorQuery().select('#net-canvas').fields({ node: true, size: true }).exec((res) => {
        const node = res && res[0] && res[0].node;
        if (!node) return;
        const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
        const dpr = Math.min(info.pixelRatio || 2, 3);
        node.width = this.g.W * dpr;
        node.height = this.g.H * dpr;
        const ctx = node.getContext('2d');
        ctx.scale(dpr, dpr);
        this.canvas = node;
        this.ctx = ctx;
        this.draw();
        this.kick();
      });
    },
    draw() {
      if (this.ctx) D.frame(this.ctx, this.g, this.state, S, this.t);
    },
    // run the animation only while it can be seen and is not paused
    kick() {
      if (this.raf || !this.canvas || this.data.paused || !this.visible || !this.pageShown) return;
      let last = 0;
      const step = (now) => {
        this.raf = 0;
        if (this.data.paused || !this.visible || !this.pageShown || !this.canvas) return;
        now = now || Date.now();
        if (!last || now - last >= FRAME_MS) {
          this.t += last ? Math.min((now - last) / 1000, 0.1) : 0.016;
          last = now;
          this.draw();
        }
        this.raf = this.canvas.requestAnimationFrame(step);
      };
      this.raf = this.canvas.requestAnimationFrame(step);
    },
    stop() {
      if (this.raf && this.canvas) this.canvas.cancelAnimationFrame(this.raf);
      this.raf = 0;
    },
    apply(state, notify) {
      this.state = state;
      const L = D.lit(state, S);
      const active = state.kind !== 'overview';
      const dirs = this.data.dirs.map((d, i) => Object.assign({}, d, {
        cls: [
          state.kind === 'dir' && state.i === i ? 'is-on' : '',
          state.kind === 'strategy' && L.dirs.indexOf(i) >= 0 ? 'is-linked' : '',
          active && L.dirs.indexOf(i) < 0 ? 'is-dim' : '',
        ].join(' ').trim(),
      }));
      const nodes = this.data.nodes.map((n, i) => Object.assign({}, n, {
        cls: [
          state.kind === 'strategy' && state.i === i ? 'is-on' : '',
          state.kind === 'dir' && L.strategies.indexOf(i) >= 0 ? 'is-linked' : '',
          active && L.strategies.indexOf(i) < 0 ? 'is-dim' : '',
        ].join(' ').trim(),
      }));
      const image = state.kind === 'dir' ? state.i : state.kind === 'strategy' ? S[state.i].dirs[0] : -1;
      this.setData({ dirs, nodes, panel: panelFor(state), bgOn: image < 0 ? 'overview' : String(image) });
      this.draw();
      if (notify) this.triggerEvent('change', { kind: state.kind, i: state.i });
    },
    onTap(e) {
      const kind = e.currentTarget.dataset.kind;
      const i = Number(e.currentTarget.dataset.i);
      // a second tap on the same circle goes back to the overview
      this.apply(this.state.kind === kind && this.state.i === i ? OVERVIEW : { kind, i }, true);
    },
    // for the page: the animation stops while the diagram is scrolled out of view
    setScroll(scrollTop) {
      const visible = scrollTop < this.g.H + 60;
      if (visible === this.visible) return;
      this.visible = visible;
      if (visible) this.kick(); else this.stop();
    },
    // for the page: choose a service (-1 for the overview)
    select(kind, i) {
      this.apply(i < 0 ? OVERVIEW : { kind, i }, false);
    },
    toggleMotion() {
      this.setData({ paused: !this.data.paused });
      if (this.data.paused) this.stop(); else this.kick();
    },
  },
});
