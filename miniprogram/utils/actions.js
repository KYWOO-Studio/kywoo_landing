const content = require('../data/content.js');

const DIR_KEYS = ['data', 'space', 'activity'];
const DIR_NAMES = { data: '数据', space: '空间', activity: '活动' };

// [{name, on}] for the 数据 / 空间 / 活动 pills; accepts keys ('data') or indexes (0)
function dirFlags(dirs) {
  const keys = dirs.map((d) => (typeof d === 'number' ? DIR_KEYS[d] : d));
  return DIR_KEYS.map((k) => ({ key: k, name: DIR_NAMES[k], on: keys.indexOf(k) >= 0 }));
}

// Writing the clipboard is a privacy interface: it works once 剪切板 is declared in the
// mini program's 用户隐私保护指引 and the visitor agrees. If it is refused, show the text instead.
function showInstead(title, text) {
  wx.showModal({ title, content: text, showCancel: false, confirmText: '知道了', confirmColor: '#203e34' });
}

function copy(text, done) {
  wx.setClipboardData({
    data: text,
    success: () => {
      if (done) wx.showToast({ title: done, icon: 'none', duration: 2200 });
    },
    fail: () => showInstead('未能复制，请手动记下', text),
  });
}

// Web pages cannot open inside the mini program without a registered business domain,
// so a link is copied and the visitor is told how to open it.
function openLink(url) {
  wx.setClipboardData({
    data: url,
    success: () => {
      wx.showModal({
        title: '链接已复制',
        content: content.text.linkCopied,
        showCancel: false,
        confirmText: '知道了',
        confirmColor: '#203e34',
      });
    },
    fail: () => showInstead('请在浏览器中打开', url),
  });
}

// tab pages: wx.switchTab cannot carry a query, so a chosen service travels in globalData
function toTab(tab, strategy) {
  if (typeof strategy === 'number' && strategy >= 0) getApp().globalData.focusStrategy = strategy;
  wx.switchTab({ url: `/pages/${tab}/${tab}` });
}

function share(title, path, imageUrl) {
  const out = { title, path };
  // remote photos may not be reachable when the card is drawn; WeChat then takes a screenshot
  if (imageUrl && imageUrl.charAt(0) === '/') out.imageUrl = imageUrl;
  return out;
}

module.exports = { dirFlags, copy, openLink, toTab, share, DIR_KEYS, DIR_NAMES };
