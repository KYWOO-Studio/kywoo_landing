import './living-loop.js';

// WGS84 display reference derived from Amap POI B023B0934P.
// This point never assigns the nearest footprint or asserts a mall boundary.
const center = [120.15947951, 30.27131877];
const root = document.querySelector('#overture-site');
const loadButton = document.querySelector('[data-site-load]');
const status = document.querySelector('[data-site-status]');
const reset = document.querySelector('[data-site-reset]');
const flat = document.querySelector('[data-site-flat]');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let map, protocol, live = false, error = false;
// Independently built from official GeoParquet. Keep the local review guard.
// Local tileset path:
// /assets/tiles/wulin-intime/2026-09-23.1/{buildings,transportation,base}.pmtiles
const base = new URL('./assets/tiles/wulin-intime/2026-09-23.1', import.meta.url).href;
const isLocalPrototype = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
const attribution = '© Overture Maps Foundation · © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a> · <a href="https://opendatacommons.org/licenses/odbl/">ODbL</a>';
const camera = () => ({center, zoom:15.6, bearing:-18, pitch:flat.getAttribute('aria-pressed') === 'true' ? 0 : 52, duration:reduced.matches ? 0 : 500});
function loadSite() {
  if (!isLocalPrototype) {
    status.textContent = '本机研究预览：已使用独立图砖，尚未批准公开发布。';
    root.dataset.state = 'prototype-only';
    return;
  }
  if (map) { map.remove(); map = undefined; }
  live = false; error = false;
  loadButton.disabled = true; status.textContent = '正在加载 Overture 场地数据…'; root.dataset.state = 'loading';
  try {
    if (!window.maplibregl || !window.pmtiles) throw new Error('地图运行库未能加载');
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
    const marker = document.createElement('button'); marker.type = 'button'; marker.className = 'mall-marker'; marker.textContent = '武林银泰'; marker.setAttribute('aria-label','武林银泰公共定位，查看范围说明');
    const popup = new window.maplibregl.Popup({offset:22,closeButton:true}).setText('公共 POI 参考 · 不是经营边界、入口或实际客流。');
    new window.maplibregl.Marker({element:marker,anchor:'bottom'}).setLngLat(center).setPopup(popup).addTo(map);
    marker.setAttribute('aria-label','武林银泰公共定位，查看范围说明');
    map.on('idle', () => {
      if(error) return;
      const buildings = map.queryRenderedFeatures({layers:['footprints']});
      const roads = map.queryRenderedFeatures({layers:['roads']});
      if(buildings.length && roads.length) {
        live = true; root.dataset.state = 'ready'; root.dataset.buildings = String(buildings.length); root.dataset.roads = String(roads.length);
        status.textContent = '本机图砖已载入 · 滚动导览／拖动自由查看'; loadButton.textContent = '重新加载地图'; loadButton.disabled = false; reset.disabled = false; flat.disabled = false;
      }
    });
    map.on('error', event => {
      error = true; root.dataset.state = 'error'; status.textContent = `地图数据加载失败：${event.error?.message || '网络或图层不可用'}。请重新加载。`;loadButton.disabled = false;loadButton.textContent = '重试加载地图';
    });
    map.on('load',()=> {reset.disabled=false;flat.disabled=false;bindMapTour(map);});
    window.setTimeout(()=>{if(!live&&!error){status.textContent='场地数据仍未就绪，请检查网络后重试。';loadButton.disabled=false;loadButton.textContent='重试加载地图';}},15000);
  } catch(e) {root.dataset.state='error';status.textContent=`地图未能加载：${e.message}`;loadButton.disabled=false;loadButton.textContent='重试加载地图';}

}
loadButton.addEventListener('click', loadSite);
const mapLoader = new IntersectionObserver(entries => {
  if (!entries.some(entry => entry.isIntersecting)) return;
  mapLoader.disconnect();
  if (isLocalPrototype) loadSite();
}, {rootMargin:'120px'});
mapLoader.observe(root);
reset.addEventListener('click',()=>map?.easeTo(camera()));
flat.addEventListener('click',()=>{const value=flat.getAttribute('aria-pressed')!=='true';flat.setAttribute('aria-pressed',String(value));flat.textContent=value?'返回 3D':'平面视图';map?.easeTo({pitch:value?0:52,duration:reduced.matches?0:400});});
window.addEventListener('pagehide',()=>map?.remove(),{once:true});

// Same bounded 3-part pacing as the previous scene; camera follows actual geography.
const tourTrack = document.querySelector('[data-site-track]');
const tourButtons = [...document.querySelectorAll('[data-site-step]')];
const resume = document.querySelector('[data-site-resume]');
const desktop = matchMedia('(min-width: 901px)');
const tourViews = [
 {zoom:15.2,pitch:38,bearing:-28,center:[120.161,30.273]},
 {zoom:16.35,pitch:60,bearing:-12,center},
 {zoom:16.65,pitch:52,bearing:14,center:[120.1601,30.2715]}
];
const tourCopy = [
 ['01 / 城市关系','先看街区，<br>再走近商场。','从真实道路与建筑，理解场所所在的城市关系。'],
 ['02 / 场所定位','把问题，<br>放回真实位置。','高亮公共定位，观察周边路径；它不是测绘边界或实际入口。'],
 ['03 / 介入与验证','轻量介入，<br>持续验证。','讨论动线、停留与活动节点，再用现场观察验证。这里不生成客流或收益。']
];
let manualMap=false,selectedMapStep=0,tourFrame=0,tourProgress=0;
function setMapCopy(index){
 selectedMapStep=index;
 const c=tourCopy[index]; document.querySelector('[data-site-chapter]').textContent=c[0];document.querySelector('[data-site-title]').innerHTML=c[1];document.querySelector('[data-site-story]').textContent=c[2];
 tourButtons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
}
function mapScroll(){
 tourFrame=0;if(!map||!map.loaded()||manualMap||!desktop.matches||reduced.matches)return;
 const rect=tourTrack.getBoundingClientRect();if(rect.bottom<0||rect.top>innerHeight)return;
 const t=Math.max(0,Math.min(1,-rect.top/Math.max(1,tourTrack.offsetHeight-innerHeight+78)));
 tourProgress=t; const segment=Math.min(1,Math.floor(t*2)),u=Math.min(1,t*2-segment),blend=u*u*(3-2*u),a=tourViews[segment],b=tourViews[segment+1];
 const lerp=(x,y)=>x+(y-x)*blend;
 map.jumpTo({zoom:lerp(a.zoom,b.zoom),pitch:lerp(a.pitch,b.pitch),bearing:lerp(a.bearing,b.bearing),center:[lerp(a.center[0],b.center[0]),lerp(a.center[1],b.center[1])]});
 setMapCopy(Math.min(2,Math.floor(t*3)));root.dataset.tourProgress=t.toFixed(3);
}
function requestMapScroll(){if(!tourFrame)tourFrame=requestAnimationFrame(mapScroll);}
function pauseMapTour(){manualMap=true;resume.hidden=!desktop.matches||reduced.matches;root.dataset.tourMode='manual';}
function bindMapTour(instance){
 instance.on('dragstart',e=>{if(e.originalEvent)pauseMapTour()});instance.on('zoomstart',e=>{if(e.originalEvent)pauseMapTour()});instance.on('rotatestart',e=>{if(e.originalEvent)pauseMapTour()});
 instance.getCanvas().addEventListener('keydown',event=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','+','-','='].includes(event.key))pauseMapTour()});
 document.querySelectorAll('.maplibregl-ctrl-zoom-in,.maplibregl-ctrl-zoom-out').forEach(button=>button.addEventListener('click',pauseMapTour));
 instance.jumpTo(tourViews[0]);requestMapScroll();
}
tourButtons.forEach((button,index)=>button.addEventListener('click',()=>{pauseMapTour();setMapCopy(index);map?.easeTo({...tourViews[index],duration:reduced.matches?0:700});}));
resume.addEventListener('click',()=>{manualMap=false;resume.hidden=true;root.dataset.tourMode='scroll';if(desktop.matches&&!reduced.matches)requestMapScroll();else map?.easeTo({...tourViews[selectedMapStep],duration:0});});
flat.addEventListener('click',pauseMapTour);
reset.addEventListener('click',()=>{pauseMapTour();setMapCopy(1)});
window.addEventListener('scroll',requestMapScroll,{passive:true});
window.addEventListener('resize',()=>{resume.hidden=!manualMap||!desktop.matches||reduced.matches;requestMapScroll();},{passive:true});
reduced.addEventListener('change',()=>{resume.hidden=!manualMap||!desktop.matches||reduced.matches;if(reduced.matches)map?.stop();else requestMapScroll();});
