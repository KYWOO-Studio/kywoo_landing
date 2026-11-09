import './living-loop.js';
const EN = document.documentElement.lang === 'en';
const L = (zh, en) => (EN ? en : zh);

// WGS84 display reference derived from Amap POI B023B0934P.
// This point never assigns the nearest footprint or asserts a mall boundary.
const center = [120.15947951, 30.27131877];
const root = document.querySelector('#overture-site');
const loadButton = document.querySelector('[data-site-load]');
const status = document.querySelector('[data-site-status]');
const reset = document.querySelector('[data-site-reset]');
const flat = document.querySelector('[data-site-flat]');
const resume = document.querySelector('[data-site-resume]');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let map, protocol, live = false, error = false;
// Independently built from official GeoParquet. Keep the local review guard.
// Local tileset path:
// /assets/tiles/wulin-intime/2026-09-23.1/{buildings,transportation,base}.pmtiles
const base = new URL('./assets/tiles/wulin-intime/2026-09-23.1', import.meta.url).href;
const isLocalPrototype = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
const siteStudy = document.querySelector('#site-study');
siteStudy.dataset.siteMode = isLocalPrototype ? 'interactive' : 'static';
root.dataset.state = isLocalPrototype ? 'preview' : 'static';
loadButton.hidden = !isLocalPrototype;
reset.hidden = !isLocalPrototype;
flat.hidden = !isLocalPrototype;
if (isLocalPrototype) {
  document.querySelector('[data-site-mode-note]').textContent = L('本机研究地图 · 近似公共定位，非测绘边界。', 'Local research map · approximate public location, not a surveyed boundary.');
  root.setAttribute('aria-label', L('武林银泰周边真实地理研究地图', 'Research map of the real geography around Wulin Intime'));
  root.querySelector('.site-placeholder').textContent = L('真实地理预览 · 正在准备本机研究地图。', 'Real geography preview · preparing the local research map.');
  status.textContent = L('地理预览 · 等待载入本机研究地图', 'Geography preview · waiting for the local research map');
  document.querySelector('[data-site-help]').textContent = L('城市章节的本机研究地图可自动载入；公开版保留静态地理预览。', 'The local research map can load in the city chapter; the public site keeps a static geography preview.');
}
const attribution = '© Overture Maps Foundation · © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a> · <a href="https://opendatacommons.org/licenses/odbl/">ODbL</a>';
const camera = () => ({center, zoom:15.6, bearing:-18, pitch:flat.getAttribute('aria-pressed') === 'true' ? 0 : 52, duration:reduced.matches ? 0 : 500});
function loadSite() {
  if (!isLocalPrototype) {
    status.textContent = L('静态地理预览 · 交互地图仅在本机研究版提供。', 'Static geography preview · the interactive map is only available in the local research version.');
    root.dataset.state = 'static';
    return;
  }
  if (map) { map.remove(); map = undefined; }
  live = false; error = false;
  loadButton.disabled = true; status.textContent = L('正在加载 Overture 场地数据…', 'Loading Overture site data…'); root.dataset.state = 'loading';
  try {
    if (!window.maplibregl || !window.pmtiles) throw new Error(L('地图运行库未能加载', 'Map library failed to load'));
    protocol ||= new window.pmtiles.Protocol();
    window.maplibregl.addProtocol('pmtiles', protocol.tile);
    root.replaceChildren();
    map = new window.maplibregl.Map({container:root, center, zoom:15.6, bearing:-18, pitch:52, maxZoom:17, minZoom:14.7, maxBounds:[[120.139,30.251],[120.180,30.292]], scrollZoom:false, cooperativeGestures:true, attributionControl:false, style:{version:8, sources:{
      buildings:{type:'vector',url:`pmtiles://${base}/buildings.pmtiles`,attribution},
      roads:{type:'vector',url:`pmtiles://${base}/transportation.pmtiles`,attribution},
      base:{type:'vector',url:`pmtiles://${base}/base.pmtiles`,attribution}
    },layers:[
      {id:'background',type:'background',paint:{'background-color':'#e5e7de'}},
      {id:'parks',type:'fill',source:'base','source-layer':'land_use',filter:['match',['get','class'],['park','garden','grass','recreation_ground'],true,false],paint:{'fill-color':'#bdc8b5'}},
      {id:'water',type:'fill',source:'base','source-layer':'water',paint:{'fill-color':'#b9d7e6'}},
      {id:'roads',type:'line',source:'roads','source-layer':'segment',filter:['==',['get','subtype'],'road'],paint:{'line-color':'#fdfcf7','line-width':['interpolate',['linear'],['zoom'],12,1,16,5,18,12]}},
      {id:'footprints',type:'fill',source:'buildings','source-layer':'building',paint:{'fill-color':'#9eafa0','fill-opacity':0.85}},
      {id:'buildings',type:'fill-extrusion',source:'buildings','source-layer':'building',filter:['!=',['get','is_underground'],true],paint:{'fill-extrusion-color':'#becaba','fill-extrusion-height':['max',0,['to-number',['get','height'],0]],'fill-extrusion-opacity':0.95}}
    ]}});
    map.addControl(new window.maplibregl.NavigationControl({showCompass:false}), 'top-right');
    map.addControl(new window.maplibregl.AttributionControl({compact:false}), 'bottom-right');
    map.addControl(new window.maplibregl.ScaleControl({maxWidth:90}), 'bottom-left');
    const marker = document.createElement('button'); marker.type = 'button'; marker.className = 'mall-marker'; marker.textContent = L('武林银泰', 'Wulin Intime'); marker.setAttribute('aria-label',L('武林银泰公共定位，查看范围说明', 'Wulin Intime public location; see scope note'));
    const popup = new window.maplibregl.Popup({offset:22,closeButton:true}).setText(L('公共 POI 参考 · 不是经营边界、入口或实际客流。', 'Public POI reference · not the trading boundary, entrances or actual footfall.'));
    new window.maplibregl.Marker({element:marker,anchor:'bottom'}).setLngLat(center).setPopup(popup).addTo(map);
    marker.setAttribute('aria-label',L('武林银泰公共定位，查看范围说明', 'Wulin Intime public location; see scope note'));
    map.on('idle', () => {
      if(error) return;
      const buildings = map.queryRenderedFeatures({layers:['footprints']});
      const roads = map.queryRenderedFeatures({layers:['roads']});
      if(buildings.length && roads.length) {
        live = true; root.dataset.state = 'ready'; root.dataset.buildings = String(buildings.length); root.dataset.roads = String(roads.length);
        status.textContent = L('真实地理资料 · 可拖动查看', 'Real geography · drag to explore'); loadButton.textContent = L('重新加载地图', 'Reload map'); loadButton.disabled = false; reset.disabled = false; flat.disabled = false;
      }
    });
    map.on('error', event => {
      error = true; root.dataset.state = 'error'; status.textContent = (EN ? `Map data failed to load: ${event.error?.message || 'network or layer unavailable'}. Please reload.` : `地图数据加载失败：${event.error?.message || '网络或图层不可用'}。请重新加载。`);loadButton.disabled = false;loadButton.textContent = L('重试加载地图', 'Retry map');
    });
    map.on('load',()=> {reset.disabled=false;flat.disabled=false;bindMapInteraction(map);});
    window.setTimeout(()=>{if(!live&&!error){status.textContent=L('场地数据仍未就绪，请检查网络后重试。', 'Site data is still not ready. Check your connection and retry.');loadButton.disabled=false;loadButton.textContent=L('重试加载地图', 'Retry map');}},15000);
  } catch(e) {root.dataset.state='error';status.textContent=(EN ? `Map failed to load: ${e.message}` : `地图未能加载：${e.message}`);loadButton.disabled=false;loadButton.textContent=L('重试加载地图', 'Retry map');}

}
loadButton.addEventListener('click', loadSite);
const mapLoader = new IntersectionObserver(entries => {
  if (!entries.some(entry => entry.isIntersecting)) return;
  mapLoader.disconnect();
  if (isLocalPrototype) loadSite();
}, {rootMargin:'120px'});
mapLoader.observe(root);
reset.addEventListener('click',()=>map?.easeTo(camera()));
flat.addEventListener('click',()=>{const value=flat.getAttribute('aria-pressed')!=='true';flat.setAttribute('aria-pressed',String(value));flat.textContent=value?L('返回 3D', 'Back to 3D'):L('平面视图', 'Flat view');map?.easeTo({pitch:value?0:52,duration:reduced.matches?0:400});});
window.addEventListener('pagehide',()=>map?.remove(),{once:true});

// The merged chapter controller owns scroll progression for both visual layers.
let manualMap = false, chapterProgress = 0;
function followMap() {
  if (!map || !map.loaded() || manualMap) return;
  const progress = Math.max(0, Math.min(1, chapterProgress * 3));
  map.jumpTo({center, zoom:15.15 + progress * 1.15, bearing:-25 + progress * 13, pitch:flat.getAttribute('aria-pressed') === 'true' ? 0 : 38 + progress * 20});
}
function holdMap() {
  manualMap = true; resume.hidden = false;
  window.dispatchEvent(new CustomEvent('kywoo:map-manual'));
}
function bindMapInteraction(instance) {
  ['dragstart','zoomstart','rotatestart'].forEach(name => instance.on(name,event => {if(event.originalEvent)holdMap();}));
  instance.getCanvas().addEventListener('keydown', event => {if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','+','-','='].includes(event.key))holdMap();});
  followMap();
}
reset.addEventListener('click', holdMap);
flat.addEventListener('click', holdMap);
resume.addEventListener('click', () => {
  manualMap = false; resume.hidden = true;
  window.dispatchEvent(new CustomEvent('kywoo:map-resume'));
  followMap();
});
window.addEventListener('kywoo:chapterchange', event => {
  chapterProgress = event.detail.progress;
  if(event.detail.step !== 0) {map?.stop();return;}
  requestAnimationFrame(() => {map?.resize();followMap();});
});
