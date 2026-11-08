'use strict';
// Independently authored. Reference observed in a browser; no reference code/assets reused.
const $=(s,root=document)=>root.querySelector(s), $$=(s,root=document)=>[...root.querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion: reduce)'), touch=matchMedia('(hover: none)');
const chapters=[
 {id:'data',name:'数据',title:'DATA',type:'方法示意',intro:'从观察出发，读懂人、路径与停留。',note:'方法图解不是实测模型，不代表已完成委托。'},
 {id:'space',name:'空间',title:'SPACE',type:'方法示意',intro:'把洞察变成动线、节点与空间选择。',note:'通用楼层与空间示意，非具体项目的真实建筑。'},
 {id:'operations',name:'活动',title:'ACTIVITY',type:'资料待补',intro:'让场所持续发生，让使用成为日常。',note:'真实活动项目、参与角色、成果与授权照片待补。'},
 {id:'wulin',name:'武林',title:'WULIN',type:'地理研究',intro:'先看周边，如何走到这里？',note:'武林银泰周边地理研究；近似公共 POI，非委托实绩或实测客流。'},
 {id:'zhujia',name:'朱家角',title:'STREETS',type:'古镇研究',intro:'活动，应该落在哪些节点？',note:'研究示例，非已实施项目；对应照片尚未获核实。'},
 {id:'notes',name:'场所笔记',title:'NOTES',type:'相册说明',intro:'从一个场所，走向生活。',note:'本地概念原型。图片为研究图解、方法示意或明确占位，不是已完成项目相册。'}
];
const projectTitles={'wong-tai-sin':'TEMPLE','whampoa':'WHAMPOA','songping':'SONGPING','grand-lisboa':'LISBOA','columbia-circle':'COLUMBIA','seoullo-7017':'SEOULLO'};
chapters.push(...KywooScenes.projects.map(p=>({id:p.id,name:p.name,title:projectTitles[p.id],type:p.type||'项目经验',intro:p.subtitle,note:p.description,project:true})));
const assets=[
 {id:'map',chapter:'wulin',src:'alternative/assets/wulin-data.svg',name:'武林银泰周边',type:'地理研究',alt:'武林银泰周边道路、水系与建筑的地理图解',position:'50% 50%',note:'Overture / OpenStreetMap contributors · ODbL 1.0。线性投影图解，不是项目照片。'},
 {id:'floor',chapter:'space',src:'alternative/assets/plate-floorstack.svg',name:'空间层次',type:'方法示意',alt:'通用楼层叠层方法示意',note:'来自 KYWOO 仓库的通用示意，非实际项目建筑。'},
 {id:'matrix',chapter:'data',src:'alternative/assets/plate-matrix.svg',name:'观察与比较',type:'方法示意',alt:'数据比较矩阵方法示意',note:'方法演示，不是经核实的项目成果或真实测量。'},
 {id:'ops',chapter:'operations',name:'活动照片待补',type:'待补照片',placeholder:'LIVE\nTOGETHER',note:'占位。真实项目名称、参与角色、成果及授权照片待补。'},
 {id:'roads',chapter:'wulin',src:'alternative/assets/wulin-data.svg',name:'街区连接',type:'地理研究',alt:'同一武林周边地理图解的街区裁切',position:'15% 50%',note:'同一地理研究图的裁切；不是另一项项目。Overture / OSM，ODbL 1.0。'},
 {id:'units',chapter:'space',src:'alternative/assets/plate-units.svg',name:'使用与单元',type:'方法示意',alt:'通用空间单元方法示意',note:'通用功能单元示意，不是实际项目平面。'},
 {id:'zhujia',chapter:'zhujia',name:'朱家角研究',type:'文字封面',placeholder:'STREETS\n& STORIES',note:'研究示例，非已实施委托。无获核实项目照片，以文字封面代替。'},
 {id:'radar',chapter:'data',src:'alternative/assets/plate-radar.svg',name:'从场所出发',type:'方法示意',alt:'场所分析方法图解',note:'方法示意，不是实测模型或已完成委托。'},
 {id:'water',chapter:'wulin',src:'alternative/assets/wulin-data.svg',name:'城市纹理',type:'地理研究',alt:'同一武林周边地理图解的水系与城市纹理裁切',position:'85% 60%',note:'同一地理研究图的裁切。Overture / OSM，ODbL 1.0。'},
 {id:'photo',chapter:'notes',name:'项目照片待补',type:'待补照片',placeholder:'PLACE\nIN PRACTICE',note:'占位，不代表已有项目。'},
 {id:'brand',chapter:'notes',name:'KYWOO',type:'相册说明',placeholder:'MAKE\nSPACE\nLIVE',note:'品牌文字页，不是项目照片。',kind:'note'},
 {id:'observe',chapter:'notes',name:'场所研究',type:'相册说明',placeholder:'WHERE\nSPACE\nMEETS\nLIFE',note:'品牌文字页，不是项目照片。',kind:'note'}
];
assets.push(...KywooScenes.projects.map(p=>({id:p.id,chapter:p.id,project:true,src:p.image,alt:p.imageAlt,name:p.name,type:p.type||'项目经验',position:p.imagePosition||'center',placeholder:p.name+'\n'+p.subtitle,note:p.image?('场所背景照片，非团队作品摄影。'+p.imageCredit):'项目内容；未配未经核实的现场照片。'})));
function visual(item){return item.src?`<img src="${item.src}" alt="${item.alt}" draggable="false" style="object-position:${item.position||'center'}">`:`<span class="placeholder"><span>KYWOO / ${item.type}</span><b>${item.placeholder.replaceAll('\n','<br>')}</b><small>${item.project?'PROJECT / 项目内容':item.type==='待补照片'?'PHOTO PENDING / 非实绩':'PLACE NOTES / 场所研究'}</small></span>`;}
const home=$('#home'),ring=$('#ring'),frame=$('.frame'),canvas=$('#particles'),ctx=canvas.getContext('2d'),enter=$('#enter');
let phase=0,velocity=0,lastTime=0,hovered=null,selected=null,focusHeld=false,drag=null,paused=false,route='home',lastFocus=null,returnTile=null,centerProximity=0,centerProximityTarget=0;
const sound=new KywooSoundLab();const imageLab=KywooImageLab;let particleSource=null,previewToken=0,centerPreviewItem=null;
let cell=220,ringW=1320,ringH=880,particleWord='KYWOO',particles=[],px=-10000,py=-10000,particleColor='#203e34',motionOverride=0;
const laneButtons=[],laneDefs=[['top',[12,0,16,2,13,1,17,5,14,7]],['right',[5,17,0,15,2,12,7,16,1,8]],['bottom',[7,15,1,13,0,16,5,14,2,17]],['left',[4,12,2,16,5,13,7,17,1,15]]];
for(const [lane,indices] of laneDefs){const el=$(`[data-lane=${lane}]`);indices.forEach((index,slot)=>{const item=assets[index],ch=chapters.find(c=>c.id===item.chapter),b=document.createElement('button');b.className='thumb'+(item.project?' project-thumb':'')+(item.kind?' kind-'+item.kind:'');b.dataset.asset=item.id;b.dataset.slot=slot;b.dataset.lane=lane;b.setAttribute('aria-label',`${ch.name} / ${item.name} / ${item.type}`);b.innerHTML=visual(item)+(item.project?`<span class="project-thumb-name">${item.name}</span>`:``)+`<span class="badge">${item.type}</span><span class="overlay"><small>CH.${String(chapters.indexOf(ch)+1).padStart(2,'0')} / ${item.type}</small><strong>${ch.title}<span>${item.name}</span></strong></span>`;
 b.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'){hovered=b;preview(item);}});
 b.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'){hovered=null;if(!selected&&!focusHeld)preview(null);}});
 b.addEventListener('focus',()=>{focusHeld=true;if(b.matches(':focus-visible'))preview(item);});
 b.addEventListener('blur',()=>{focusHeld=false;if(!selected&&!hovered)preview(null);});
 b.addEventListener('click',e=>{if(performance.now()<suppressClickUntil){e.preventDefault();return;}if(touch.matches||e.pointerType==='touch'){if(selected!==b){select(b,item);return;}}returnTile=b;goChapter(item.chapter);});
 el.append(b);laneButtons.push({b,item,slot,lane,count:indices.length});});}
function updateHomeBackground(item){
 const project=KywooScenes.projects.find(p=>p.id===(item?.project?item.chapter:'columbia-circle'));
 const image=$('#home-background'),credit=$('#home-photo-credit');
 image.hidden=credit.hidden=!project?.image;
 if(!project?.image)return;
 if(image.dataset.project!==project.id){image.src=project.image;image.dataset.project=project.id;image.style.objectPosition=project.imagePosition||'center';}
 $('#home-photo-source').textContent=project.name+' · 场所背景照片';$('#home-photo-source').href=project.imageSource;
}
updateHomeBackground(null);
function select(b,item){selected=b;velocity=0;preview(item);$$('.thumb').forEach(el=>el.classList.toggle('selected',el===b));}
function preview(item,origin='ring'){updateHomeBackground(item);centerPreviewItem=item;const ch=item?chapters.find(c=>c.id===item.chapter):null;setWord(ch?ch.title:'KYWOO');$('#center-kicker').textContent=ch?`CH.${String(chapters.indexOf(ch)+1).padStart(2,'0')} / ${ch.name}`:'01 / 我们做什么';$('#center-subtitle').textContent=ch?(touch.matches?'再点缩图，或进入章节':ch.intro):'让冷清的空间，重新有人气。';$('#center-title').textContent=ch?ch.title:'KYWOO';enter.hidden=!ch;$('#home-actions').hidden=!!ch;enter.textContent=ch?(ch.project?`查看${ch.name}项目 →`:ch.id==='wulin'||ch.id==='zhujia'?`查看${ch.name}研究 →`:ch.id==='notes'?'了解如何一起工作 →':`了解${ch.name}方法 →`):'进入场景 →';enter.dataset.chapter=ch?.id||'';$('.center-locations').hidden=!!ch;$('#hint').hidden=!!ch;particleColor='#203e34';const token=++previewToken;particleSource=null;if(item){imageLab.load(item).then(source=>{if(token!==previewToken)return;particleSource=source;canvas.dataset.colorSource=item.id;canvas.dataset.palette=source.palette.map(c=>c.hex).join(',');sound.effect('hover');if(reduce.matches)drawParticles(1,true);}).catch(()=>{canvas.dataset.colorSource='unavailable';});}else{canvas.dataset.colorSource='brand';delete canvas.dataset.palette;}if(reduce.matches)drawParticles(1,true);window.dispatchEvent(new CustomEvent('kywoo-preview',{detail:{item,origin}}));}
enter.onclick=()=>{returnTile=selected||hovered||document.querySelector('.triangle-node[aria-pressed="true"]')||enter;goChapter(enter.dataset.chapter);};
let stageAmount=0,stageBlocked=false,stageBase=null,stageHover=false;
const stageRoot=$('#triangle');
const triangleCopy=document.createElement('div');triangleCopy.id='triangle-copy';triangleCopy.setAttribute('aria-live','polite');home.append(triangleCopy);
function closeStage(){stageHover=false;stageBlocked=true;setCenterProximity(0,true);}
home.addEventListener('keydown',e=>{if(e.key==='Escape')closeStage();});
function updateStage(dt){
 const target=route==='home'&&!paused&&!reduce.matches&&!stageBlocked&&stageHover?1:0;
 if(target&&!stageBase)stageBase=stageRoot.getBoundingClientRect();
 if(route!=='home'||paused||reduce.matches){stageAmount=0;stageHover=false;}
 stageAmount+=(target-stageAmount)*(1-Math.exp(-dt*4.5));if(stageAmount<.001&&!target)stageAmount=0;
 home.classList.toggle('triangle-stage',stageAmount>.01);
 if(stageAmount&&stageBase){const h=home.getBoundingClientRect(),t=stageAmount;stageRoot.classList.add('viewport-stage');stageRoot.style.left=(stageBase.left+(20-stageBase.left)*t)+'px';stageRoot.style.top=(stageBase.top+(h.top+20-stageBase.top)*t)+'px';stageRoot.style.width=(stageBase.width+(innerWidth-40-stageBase.width)*t)+'px';stageRoot.style.height=(stageBase.height+(h.height-90-stageBase.height)*t)+'px';}
 else{stageRoot.classList.remove('viewport-stage');for(const prop of ['left','top','width','height'])stageRoot.style[prop]='';stageBase=null;}
 home.style.setProperty('--stage-amount',stageAmount);stageRoot.dataset.expansion=stageAmount.toFixed(3);
}
function writeCenterProximity(value){frame.style.setProperty('--center-proximity',value.toFixed(3));frame.dataset.centerProximity=value.toFixed(3);}
function setCenterProximity(value,instant=false){centerProximityTarget=Math.max(0,Math.min(1,value));if(instant){centerProximity=centerProximityTarget;writeCenterProximity(centerProximity);}}
function dispatchTrianglePointer(event,active=true){const detail={active:false,x:0,y:0};if(active&&event){const bounds=home.getBoundingClientRect();detail.active=true;detail.x=Math.max(-.5,Math.min(.5,(event.clientX-(bounds.left+bounds.width/2))/Math.max(1,bounds.width)));detail.y=Math.max(-.5,Math.min(.5,(event.clientY-(bounds.top+bounds.height/2))/Math.max(1,bounds.height)));}window.dispatchEvent(new CustomEvent('kywoo-triangle-pointer',{detail}));}
function updateProximityTravel(){const bounds=frame.getBoundingClientRect();if(!bounds.width||!bounds.height)return;const overscan=2;frame.style.setProperty('--lane-top-travel',`${-(bounds.top+cell+overscan)}px`);frame.style.setProperty('--lane-bottom-travel',`${innerHeight-(bounds.bottom-cell)+overscan}px`);frame.style.setProperty('--lane-left-travel',`${-(bounds.left+cell+overscan)}px`);frame.style.setProperty('--lane-right-travel',`${innerWidth-(bounds.right-cell)+overscan}px`);}
function updateCenterProximity(event){
 const interactive=route==='home'&&!paused&&!reduce.matches&&event.pointerType!=='touch'&&matchMedia('(hover: hover) and (pointer: fine)').matches;
 if(!interactive){setCenterProximity(0);dispatchTrianglePointer(null,false);return;}
 const h=home.getBoundingClientRect();
 // One stable exploration envelope, independent of animated node positions and scale.
 const r=stageHover?{left:20,right:innerWidth-20,top:h.top+20,bottom:h.bottom-16}:(stageBase||stageRoot.getBoundingClientRect());
 const inside=event.clientX>=r.left&&event.clientX<=r.right&&event.clientY>=r.top&&event.clientY<=r.bottom;

 if(stageBlocked){if(!inside)stageBlocked=false;else return;}
 const leaving=stageHover&&!inside;stageHover=inside;
 setCenterProximity(inside?1:0);dispatchTrianglePointer(event,inside);
 if(leaving)window.dispatchEvent(new Event('kywoo-triangle-leave'));
}

function layout(){const mobile=innerWidth<=600,cols=mobile?5:6,rows=mobile?7:4;cell=Math.min((innerWidth-(mobile?36:120))/cols,(innerHeight-(mobile?150:120))/rows);cell=Math.max(36,cell);ringW=cell*cols;ringH=cell*rows;frame.style.width=ringW+'px';frame.style.height=ringH+'px';frame.style.setProperty('--cell',cell+'px');$('#center').classList.toggle('is-short',ringH-cell*2<260);frame.style.setProperty('--triangle-height',Math.min(mobile?184:245,(ringH-cell*2)*(mobile?.52:.53))+'px');updateProximityTravel();setWord(particleWord,true);positionTiles();}
function positionTiles(){for(const {b,slot,lane,count}of laneButtons){const horizontal=lane==='top'||lane==='bottom',forward=lane==='top'||lane==='right'?-1:1;const v=((slot+forward*phase+1)%count+count)%count-1;const x=horizontal?v*cell:0,y=horizontal?0:v*cell;b.style.transform=`translate3d(${x}px,${y}px,0)`;const length=horizontal?ringW:ringH-cell*2;const visible=v*cell+cell>1&&v*cell<length-1;b.tabIndex=visible?0:-1;b.setAttribute('aria-hidden',String(!visible));}ring.dataset.phase=phase.toFixed(5);ring.dataset.velocity=velocity.toFixed(5);}
function isStopped(){return paused||reduce.matches||route!=='home'||document.hidden||document.body.classList.contains('modal-open')||!!drag||((!!hovered||focusHeld||!!selected)&&performance.now()>motionOverride);}
function tick(now){const dt=lastTime?Math.min((now-lastTime)/1000,.05):.016;lastTime=now;const proximityBlend=reduce.matches?1:1-Math.exp(-dt*12);centerProximity+=(centerProximityTarget-centerProximity)*proximityBlend;if(Math.abs(centerProximityTarget-centerProximity)<.001)centerProximity=centerProximityTarget;writeCenterProximity(centerProximity);updateStage(dt);if(!isStopped()){phase+=(.23+velocity)*dt;velocity*=Math.exp(-dt*4.7);if(Math.abs(velocity)<.003)velocity=0;positionTiles();}ring.dataset.state=isStopped()?'paused':Math.abs(velocity)>.02?'inertia':'idle';if(route==='home')drawParticles(dt,reduce.matches);requestAnimationFrame(tick);}
function impulse(amount){velocity+=amount;selected=null;$$('.thumb').forEach(b=>b.classList.remove('selected'));motionOverride=performance.now()+850;preview(null);}
home.addEventListener('pointermove',updateCenterProximity);
home.addEventListener('pointerleave',()=>{stageHover=false;setCenterProximity(0);dispatchTrianglePointer(null,false);window.dispatchEvent(new Event('kywoo-triangle-leave'));});
ring.addEventListener('focusin',()=>setCenterProximity(0,true));
home.addEventListener('wheel',e=>{if(route!=='home')return;e.preventDefault();impulse(Math.max(-8,Math.min(8,(e.deltaY+e.deltaX)/cell*2.5)));if(reduce.matches){phase+=(e.deltaY+e.deltaX)/cell;positionTiles();}},{passive:false});
ring.addEventListener('keydown',e=>{if(['ArrowRight','ArrowDown','ArrowLeft','ArrowUp'].includes(e.key)){e.preventDefault();const n=['ArrowRight','ArrowDown'].includes(e.key)?1:-1;if(reduce.matches){phase+=n*.6;positionTiles();}else impulse(n*2.6);}if(e.key==='Escape'){selected=null;hovered=null;preview(null);$$('.thumb').forEach(b=>b.classList.remove('selected'));}if(e.key==='Enter'&&e.target===ring&&selected){e.preventDefault();returnTile=selected;goChapter(assets.find(a=>a.id===selected.dataset.asset).chapter);}});
let suppressClickUntil=0;
ring.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,time:performance.now(),phase,travel:0,lane:e.target.closest('.lane')?.dataset.lane,lastX:e.clientX,lastY:e.clientY,lastT:performance.now(),speed:0};velocity=0;});
ring.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.travel=Math.hypot(dx,dy);if(drag.travel<6)return;e.preventDefault();const horizontal=drag.lane==='top'||drag.lane==='bottom',sign=drag.lane==='top'||drag.lane==='right'?-1:1;const delta=horizontal?dx:dy;phase=drag.phase+sign*delta/cell;const now=performance.now(),elapsed=Math.max(8,now-drag.lastT);drag.speed=sign*(horizontal?e.clientX-drag.lastX:e.clientY-drag.lastY)/cell/elapsed*1000;drag.lastX=e.clientX;drag.lastY=e.clientY;drag.lastT=now;selected=null;positionTiles();});
function release(e){if(!drag||e.pointerId!==drag.id)return;if(drag.travel>=6){velocity=reduce.matches?0:Math.max(-10,Math.min(10,drag.speed));suppressClickUntil=performance.now()+350;motionOverride=performance.now()+900;hovered=null;preview(null);}drag=null;}
window.addEventListener('pointerup',release);window.addEventListener('pointercancel',e=>{if(drag?.id===e.pointerId){drag=null;velocity=0;}});
function motionState(){const stopped=paused||reduce.matches;if(stopped){setCenterProximity(0,true);dispatchTrianglePointer(null,false);}window.dispatchEvent(new CustomEvent('kywoo-motion',{detail:{paused:stopped,route}}));$('#motion').setAttribute('aria-pressed',String(stopped));$('#motion').textContent=reduce.matches?'减少动态':paused?'继续 ▷':'暂停 Ⅱ';$('#motion').setAttribute('aria-label',reduce.matches?'系统已减少动态':paused?'继续照片环':'暂停照片环');if(stopped){velocity=0;drawParticles(1,true);}}
$('#motion').onclick=()=>{paused=!paused;motionState();};reduce.addEventListener('change',motionState);
// Text is rasterized locally and sampled into spring particles.
function setWord(word,force=false){if(word===particleWord&&!force)return;particleWord=word;const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;const w=rect.width,h=rect.height,dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);const off=document.createElement('canvas');off.width=Math.ceil(w);off.height=Math.ceil(h);const c=off.getContext('2d',{willReadFrequently:true});let size=h*.88;c.font=`900 ${size}px Arial`;const measured=c.measureText(word).width;size=Math.min(size,w*.98/(measured/size));c.font=`900 ${size}px Arial`;c.textAlign='center';c.textBaseline='middle';c.fillText(word,w/2,h/2+size*.03);const pixels=c.getImageData(0,0,off.width,off.height).data,step=h<60?2:innerWidth<=600?3.5:7,targets=[];for(let y=1;y<h;y+=step)for(let x=1;x<w;x+=step)if(pixels[(Math.floor(y)*off.width+Math.floor(x))*4+3]>140)targets.push({tx:x,ty:y});particles=targets.map((t,i)=>({...t,x:particles[i]?.x??t.tx,y:particles[i]?.y??t.ty,vx:0,vy:0}));drawParticles(.016,force||reduce.matches);}
function drawParticles(dt,instant=false){const w=canvas.clientWidth,h=canvas.clientHeight;ctx.clearRect(0,0,w,h);ctx.fillStyle=particleColor;const step=h<60?2:innerWidth<=600?3.5:7,r=step*.38;for(const p of particles){let tx=p.tx,ty=p.ty;if(!instant&&!reduce.matches){const dx=p.x-px,dy=p.y-py,dist=Math.hypot(dx,dy),range=innerWidth<=600?28:70;if(dist<range&&dist>0){const force=(1-dist/range)*range*.9;tx+=dx/dist*force;ty+=dy/dist*force;}p.vx+=(tx-p.x)*dt*110;p.vy+=(ty-p.y)*dt*110;p.vx*=Math.exp(-dt*12);p.vy*=Math.exp(-dt*12);p.x+=p.vx*dt;p.y+=p.vy*dt;}else{p.x=tx;p.y=ty;}if(particleSource){const gx=Math.min(31,Math.floor(p.tx/Math.max(1,w)*32)),gy=Math.min(31,Math.floor(p.ty/Math.max(1,h)*32)),i=(gy*32+gx)*4,g=particleSource.grid.data;const luminance=g[i]*.2126+g[i+1]*.7152+g[i+2]*.0722,contrast=Math.min(1,110/Math.max(1,luminance));ctx.fillStyle=`rgb(${g[i]*contrast} ${g[i+1]*contrast} ${g[i+2]*contrast})`;}else ctx.fillStyle=particleColor;ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fill();}canvas.dataset.word=particleWord;canvas.dataset.count=particles.length;}
canvas.addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect();px=e.clientX-r.left;py=e.clientY-r.top;});canvas.addEventListener('pointerleave',()=>{px=py=-10000;});
// Chapter routes and native modal viewer keep browser back and keyboard behavior intact.
let chapterId='data',viewIndex=0,chapterItems=[],currentStyle='original';
let activeScene=null,viewerClosePath='',sceneImage=false;
function navigate(hash,replace=false,view=false){if(location.hash===hash){routePage();return;}const state={kywoo:true};if(view)state.viewerDepth=($('#viewer').open?(history.state?.viewerDepth||0):0)+1;history[replace?'replaceState':'pushState'](state,'',hash);routePage();}
function goChapter(id){if(KywooScenes.projects.some(p=>p.id===id)){navigate('#/cases/'+id);return;}const map={data:'#/method/data',space:'#/method/space',operations:'#/method/operations',wulin:'#/cases/wulin/evidence',zhujia:'#/cases/zhujia/evidence',notes:'#/work'};navigate(map[id]||'#/cases');}
function viewerHash(i){return sceneImage?viewerClosePath+'?image='+chapterItems[i].id:`#/ch/${chapterId}/${i}/view`;}
function closeViewer(){const target=viewerClosePath||'#/ch/'+chapterId,depth=history.state?.viewerDepth||0;if(depth>0)history.go(-depth);else navigate(target,true);}
function openSceneImage(asset){lastFocus=document.activeElement;navigate(KywooScenes.imageBase()+'?image='+asset,false,true);}

function transition(){if(reduce.matches)return;const c=$('.curtain');c.classList.remove('play');void c.offsetWidth;c.classList.add('play');}
function renderChapter(id){const ch=chapters.find(c=>c.id===id)||chapters[0];chapterId=ch.id;chapterItems=assets.filter(a=>a.chapter===ch.id);$('#chapter-title').textContent=ch.title;$('#chapter-kicker').textContent=`CH.${String(chapters.indexOf(ch)+1).padStart(2,'0')} / ${ch.name} / ${ch.type}`;$('#chapter-desc').textContent=ch.intro+' '+ch.note;$('#chapter-count').textContent=String(chapterItems.length).padStart(2,'0')+' ENTRIES';const gal=$('.gallery');gal.innerHTML='';chapterItems.forEach((a,i)=>{const f=document.createElement('figure');f.innerHTML=`<button aria-label="查看${a.name}">${visual(a)}</button><figcaption><span>${a.name}</span><span>${a.type} / ${String(i+1).padStart(2,'0')}</span></figcaption>`;f.querySelector('button').onclick=()=>{lastFocus=f.querySelector('button');navigate(`#/ch/${chapterId}/${i}/view`,false,true);};gal.append(f);});gal.scrollLeft=0;$('.chapter-tabs').innerHTML=chapters.map(c=>`<button data-chapter="${c.id}" aria-pressed="${c.id===ch.id}">${c.name}</button>`).join('');$$('[data-chapter]').forEach(b=>b.onclick=()=>navigate('#/ch/'+b.dataset.chapter));setStyle(currentStyle);}
let styleToken=0;
function setStyle(name){currentStyle=name;$$('[data-viewer-style]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.viewerStyle===name)));const token=++styleToken;$('.gallery').dataset.style=name;$$('.style-tabs button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.style===name)));$$('.gallery figure').forEach((f,i)=>{const a=chapterItems[i];imageLab.process(a,name).then(result=>{if(token!==styleToken||route!=='chapter'||chapterItems[i]!==a)return;const img=$('img',f);if(img){img.src=result.toDataURL();img.dataset.pixelStyle=name;}}).catch(()=>{});});if($('#viewer').open)viewerRender(viewIndex);}
$$('[data-viewer-style]').forEach(b=>b.onclick=()=>setStyle(b.dataset.viewerStyle));$$('.style-tabs button').forEach(b=>b.onclick=()=>setStyle(b.dataset.style));$('.gallery').addEventListener('wheel',e=>{if(Math.abs(e.deltaY)>Math.abs(e.deltaX)){e.preventDefault();$('.gallery').scrollLeft+=e.deltaY;}},{passive:false});
let viewerSource=null,viewerItem=null,viewerToken=0,copyHex='';
const reveal=new imageLab.Reveal($('.viewer-image'),reduce,stage=>sound.effect(stage==='complete'?'complete':'develop'));
async function copyColor(color){try{await navigator.clipboard.writeText(color);$('#copy-status').textContent='已复制 '+color;sound.effect('copy');}catch{$('#copy-status').textContent='复制未获浏览器许可，请手动复制：'+color;}}
$('#pixel-copy').onclick=()=>{if(copyHex)copyColor(copyHex);};
function paletteRender(source){const focused=[...$('#palette').children].indexOf(document.activeElement);const total=source.palette.reduce((n,c)=>n+c.weight,0);$('#palette').innerHTML='';source.palette.forEach(c=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label','复制主色 '+c.hex);b.innerHTML=`<span style="background:${c.hex}"></span><strong>${c.hex}</strong><small>${Math.round(c.weight/Math.max(total,1)*100)}%</small>`;b.onclick=()=>copyColor(c.hex);$('#palette').append(b);});if(focused>=0)$('#palette').children[Math.min(focused,4)]?.focus();}
async function viewerRender(i){const soundEvent=$('#viewer').open?'switch':'open';const token=++viewerToken;reveal.cancel();viewIndex=(i+chapterItems.length)%chapterItems.length;const a=chapterItems[viewIndex];viewerItem=a;viewerSource=null;copyHex='';$('#pixel-copy').disabled=true;$('#pixel-color').textContent='移动到图像上取色';$('#copy-status').textContent='';$('.viewer-image').innerHTML='<img alt="'+(a.alt||a.name)+'"><span class="loupe" hidden aria-hidden="true"></span>';$('#viewer-title').textContent=a.name;$('#viewer-caption').textContent=a.note;$('#viewer-count').textContent=`${viewIndex+1} / ${chapterItems.length}`;const source=await imageLab.load(a);if(token!==viewerToken||!$('#viewer').open)return;viewerSource=source;paletteRender(source);if(lastLoupePoint&&(lastLoupePoint.pointerType!=='touch'||touchLoupe))loupeAt(lastLoupePoint);$('.viewer-image').dataset.originalAsset=a.id;sound.effect(soundEvent);await reveal.start(a,currentStyle,lastFocus?.getBoundingClientRect());}
function routePage(){
 const hash=location.hash||'#/',was=route,previous=activeScene?.key||route;let parts=hash.replace(/^#\/?/,'').split('/');
 if(parts[0]==='about'){history.replaceState(history.state,'','#/contact');parts=['contact'];}
 const next=KywooScenes.resolve(location.hash||'#/');activeScene=next;const legacy=parts[0]==='ch';route=next?next.scene:legacy?'chapter':'home';if(route!=='home'){setCenterProximity(0,true);dispatchTrianglePointer(null,false);}
 if(!next&&!legacy&&parts[0])history.replaceState(history.state,'','#/');
 const viewing=legacy&&parts[3]==='view'||!!next?.image;
 if(index?.open){index.dataset.navigating='true';index.close();}
 if(!viewing&&viewer?.open)viewer.close();
 home.hidden=route!=='home';$('#chapter').hidden=!legacy;$('#about').hidden=true;KywooScenes.root.hidden=!next;
 if(next){KywooScenes.render(next);KywooScenes.nav(next.scene);}else{KywooScenes.mount('home');KywooScenes.nav(legacy?(['data','space','operations'].includes(parts[1])?'method':'cases'):'home');}
 if(legacy){sceneImage=false;viewerClosePath='#/ch/'+(chapters.some(c=>c.id===parts[1])?parts[1]:'data');if(was!=='chapter'||chapterId!==parts[1])renderChapter(parts[1]);if(viewing){viewerRender(Number(parts[2])||0);if(!viewer.open){viewer.showModal();document.body.classList.add('modal-open');}}}
 else if(next?.image){sceneImage=true;viewerClosePath=next.base;chapterId=next.id||'wulin';const allowed=next.id==='zhujia'?['zhujia','radar']:['map','roads','water','matrix','floor','units','radar','ops'];chapterItems=assets.filter(a=>allowed.includes(a.id));const i=chapterItems.findIndex(a=>a.id===next.image);if(i>=0){viewerRender(i);if(!viewer.open){viewer.showModal();document.body.classList.add('modal-open');}}else{navigate(next.base,true);return;}}
 else sceneImage=false;
 sound.setScene(legacy?chapterId:route==='method'?(['data','space','operations'][next.node]||'home'):route==='cases'?(next.id==='zhujia'?'zhujia':'wulin'):route==='work'?'notes':route==='contact'?'about':'home');
 window.dispatchEvent(new CustomEvent('kywoo-route',{detail:route}));
 const changed=previous!==(next?.key||route)||was!==route;
 if(changed){transition();if(route==='home'){layout();if(returnTile?.isConnected)returnTile.focus({preventScroll:true});}else if(legacy)$('#chapter-title').focus({preventScroll:true});else KywooScenes.heading.focus({preventScroll:true});}
 document.title=next?`KYWOO — ${KywooScenes.sceneList.find(x=>x[0]===next.scene)[1]}`:legacy?'KYWOO — 图像资料':'KYWOO — 让冷清的空间，重新有人气。';
}
window.addEventListener('hashchange',routePage);window.addEventListener('resize',layout);$('.curtain').addEventListener('animationend',()=>$('.curtain').classList.remove('play'));
const index=$('#index'),viewer=$('#viewer');$('#index-list').innerHTML=KywooScenes.sceneList.map(([id,name,n])=>`<a class="scene-index-link" href="${id==='home'?'#/':'#/'+id}"><span>${n} / ${name}</span><small>直接进入 ↗</small></a>`).join('')+`<details><summary>图像资料 · 研究、示意与待补</summary>${chapters.map(c=>`<a href="#/ch/${c.id}">${c.name}<small>${c.type} ↗</small></a>`).join('')}</details>`;
$('[data-index]').onclick=()=>{lastFocus=document.activeElement;index.showModal();document.body.classList.add('modal-open');};$('[data-close-index]').onclick=()=>index.close();index.addEventListener('close',()=>{document.body.classList.remove('modal-open');if(index.dataset.navigating!=='true'&&lastFocus?.isConnected)lastFocus.focus({preventScroll:true});delete index.dataset.navigating;});
$('[data-close-viewer]').onclick=closeViewer;viewer.addEventListener('cancel',e=>{e.preventDefault();closeViewer();});viewer.addEventListener('close',()=>{viewerToken++;reveal.cancel();viewerSource=null;sound.effect('close');document.body.classList.remove('modal-open');if(lastFocus?.isConnected&&lastFocus.getClientRects().length)lastFocus.focus({preventScroll:true});});
$('[data-prev]').onclick=()=>navigate(viewerHash((viewIndex-1+chapterItems.length)%chapterItems.length),false,true);$('[data-next]').onclick=()=>navigate(viewerHash((viewIndex+1)%chapterItems.length),false,true);
for(const d of[index,viewer])d.addEventListener('click',e=>{if(e.target!==d)return;const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom){if(d===viewer)closeViewer();else d.close();}});
window.addEventListener('keydown',e=>{if(viewer.open){if(e.key==='ArrowLeft')$('[data-prev]').click();if(e.key==='ArrowRight')$('[data-next]').click();const styles=['original','ink','dots','blocks'];if(styles[Number(e.key)-1])setStyle(styles[Number(e.key)-1]);}else if(route==='chapter'){const styles=['original','ink','dots','blocks'];if(styles[Number(e.key)-1])setStyle(styles[Number(e.key)-1]);}});
// User intent to mute is persistent; ordinary gestures only unlock when enabled.
$('#sound').onclick=()=>sound.toggle();
for(const event of['pointerdown','keydown'])document.addEventListener(event,e=>{if(!e.target.closest?.('#sound'))sound.unlock();},{capture:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden){setCenterProximity(0,true);dispatchTrianglePointer(null,false);sound.stop();sound.ctx?.suspend();}else if(sound.enabled&&sound.unlocked)sound.unlock();});
reduce.addEventListener('change',()=>{if(reduce.matches&&viewer.open)viewerRender(viewIndex);});
window.KywooQA={centerNode(index){const chapter=['data','space','operations'][index];preview(chapter?assets.find(a=>a.chapter===chapter):null,'triangle');if(route==='method')KywooScenes.method(index);else if(index>=0)$('#center-subtitle').textContent=['读懂场所与人。','让空间回应场所需要。','让场所持续被使用。'][index];},get route(){return route;},get scene(){return activeScene;},get centerPreview(){return centerPreviewItem;},get centerMotion(){return{paused:paused||reduce.matches,route};},get centerProximity(){return centerProximity;},audio:sound,images:imageLab,get reveal(){return reveal;},get viewerSource(){return viewerSource;},get viewerItem(){return viewerItem;},get particleSource(){return particleSource;},get style(){return currentStyle;}};
document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#/"]');if(!a||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();const hash=a.getAttribute('href');if(a.dataset.viewAsset){lastFocus=a;navigate(hash,false,true);}else navigate(hash);});
$('.skip').onclick=e=>{e.preventDefault();(route==='home'?$('#center'):route==='chapter'?$('#chapter-title'):KywooScenes.heading).focus({preventScroll:false});};
window.addEventListener('kywoo-node-pin',e=>{if(route==='method')navigate(e.detail<0?'#/method':'#/method/'+['data','space','operations'][e.detail]);});
layout();motionState();routePage();requestAnimationFrame(tick);
// A local-image magnifier always samples the original image, regardless of gallery print style.
let loupeZoom=2.5,touchLoupe=false,lastLoupePoint=null;
const imageHost=$('.viewer-image');
function loupeAt(e){const img=$('img',imageHost),loupe=$('.loupe',imageHost);if(!img||!loupe||!viewerSource)return;const source=viewerSource,r=imageHost.getBoundingClientRect(),scale=Math.min(r.width/source.canvas.width,r.height/source.canvas.height),w=source.canvas.width*scale,h=source.canvas.height*scale,left=(r.width-w)/2,top=(r.height-h)/2,x=e.clientX-r.left,y=e.clientY-r.top;if(x<left||x>left+w||y<top||y>top+h){loupe.hidden=true;return;}loupe.hidden=false;loupe.style.left=Math.max(0,Math.min(r.width-150,x-75))+'px';loupe.style.top=Math.max(0,Math.min(r.height-150,y-75))+'px';loupe.style.backgroundImage=`url("${source.url}")`;loupe.style.backgroundSize=`${w*loupeZoom}px ${h*loupeZoom}px`;loupe.style.backgroundPosition=`${75-(x-left)*loupeZoom}px ${75-(y-top)*loupeZoom}px`;loupe.dataset.zoom=loupeZoom.toFixed(2);$('#zoom-level').value=loupeZoom.toFixed(1)+'×';const sx=(x-left)/scale,sy=(y-top)/scale;copyHex=imageLab.sample(source,sx,sy);$('#pixel-color').textContent=copyHex;$('#pixel-color').dataset.sourceX=Math.floor(sx);$('#pixel-color').dataset.sourceY=Math.floor(sy);$('#pixel-swatch').style.background=copyHex;$('#pixel-copy').disabled=false;}
imageHost.addEventListener('pointermove',e=>{lastLoupePoint={clientX:e.clientX,clientY:e.clientY,pointerType:e.pointerType};if(e.pointerType!=='touch'||touchLoupe)loupeAt(e);});imageHost.addEventListener('pointerleave',()=>{lastLoupePoint=null;$('.loupe',imageHost)?.setAttribute('hidden','');});imageHost.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'){touchLoupe=true;imageHost.setPointerCapture(e.pointerId);loupeAt(e);}});for(const event of['pointerup','pointercancel'])imageHost.addEventListener(event,()=>{touchLoupe=false;$('.loupe',imageHost)?.setAttribute('hidden','');});imageHost.addEventListener('wheel',e=>{if(!viewerSource)return;e.preventDefault();loupeZoom=Math.max(1.5,Math.min(8,loupeZoom+e.deltaY*-.003));loupeAt(e);},{passive:false});

window.addEventListener('resize',()=>{if(viewer.open)viewerRender(viewIndex);});

function changeLoupeZoom(amount){loupeZoom=Math.max(1.5,Math.min(8,loupeZoom+amount));$('#zoom-level').value=loupeZoom.toFixed(1)+'×';if(lastLoupePoint&&!$('.loupe',imageHost)?.hidden)loupeAt(lastLoupePoint);sound.effect('loupe');}
$('#zoom-in').onclick=()=>changeLoupeZoom(.5);$('#zoom-out').onclick=()=>changeLoupeZoom(-.5);
