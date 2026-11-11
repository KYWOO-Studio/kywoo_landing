// A serif web font for headings can be loaded once the font file is hosted on the studio's own
// HTTPS domain (with ICP filing). Until then headings use the phone's serif or sans-serif font.
const SERIF_FONT_URL = '';

App({
  globalData: {
    // set by a link on another tab (wx.switchTab cannot carry a query), read by the services tab
    focusStrategy: -1,
  },
  onLaunch() {
    if (SERIF_FONT_URL) {
      wx.loadFontFace({
        global: true,
        family: 'KYWOO Serif',
        source: `url("${SERIF_FONT_URL}")`,
        desc: { weight: '600' },
        fail: () => {},
      });
    }
  },
});
