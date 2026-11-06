// Adapted from KYWOO kywoo_landing b2af1b5 living-loop-scene.js. Original graph/dynamics retained.
import * as THREE from './vendor/three/three.module.js';

export function createNetwork(root, reduce, onExplore) {
  const host = root.querySelector('[data-network-canvas]');
  const workspace = root.querySelector('[data-network-workspace]');
  const labels = [...root.querySelectorAll('[data-loop-step]')];
  const renderer = new THREE.WebGLRenderer({alpha:true, antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(43, 1, .1, 90);
  const neutralCamera = camera.clone();
  const cameraTarget = new THREE.Vector3();
  const lookTarget = new THREE.Vector3();
  const lookDestination = new THREE.Vector3();
  const network = new THREE.Group();
  scene.add(network);
  scene.add(new THREE.HemisphereLight(0xe1f5ff, 0x1b392f, 3));
  const light = new THREE.PointLight(0x365b4c, 60);
  light.position.set(0,4,5); scene.add(light);
  const rest = [new THREE.Vector3(0,2.65,-1.1), new THREE.Vector3(-3,-1.7,1.5), new THREE.Vector3(3,-1.5,-.5)];
  const vertices = rest.map(v => v.clone());
  const anchors = rest.map(() => ({x:0,y:0}));
  const weights = [0,0,0];
  const materials = rest.map(() => new THREE.MeshStandardMaterial({color:0x365b4c, metalness:.5, roughness:.2, emissive:0x324f59, emissiveIntensity:.4}));
  const nodes = rest.map((v,i) => {
    const node = new THREE.Group();node.position.copy(v);network.add(node);
    node.add(new THREE.Mesh(new THREE.IcosahedronGeometry(.48,1), materials[i]));
    node.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(.72,1)),new THREE.LineBasicMaterial({color:0x527668,transparent:true,opacity:.5})));
    return node;
  });
  const curves = vertices.map((v,i) => new THREE.QuadraticBezierCurve3(v.clone(), v.clone().lerp(vertices[(i+1)%3],.5), vertices[(i+1)%3].clone()));
  const connections = curves.map(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(49*3),3));
    const line = new THREE.Line(geometry,new THREE.LineBasicMaterial({color:0x527668,transparent:true,opacity:.8}));
    network.add(line);return line;
  });
  const inner = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.OctahedronGeometry(.7)),new THREE.LineBasicMaterial({color:0x365b4c,transparent:true,opacity:.45}));network.add(inner);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.13,.008,6,100),new THREE.MeshBasicMaterial({color:0x365b4c,transparent:true,opacity:.4}));ring.rotation.x=.55;network.add(ring);
  const count=120, positions=new Float32Array(count*3), geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  network.add(new THREE.Points(geometry,new THREE.PointsMaterial({color:0x365b4c,size:.035,transparent:true,opacity:.9})));
  const stars = new Float32Array(210*3);
  for(let i=0;i<210;i++){stars[i*3]=Math.sin(i*127.1)*6;stars[i*3+1]=Math.sin(i*73.7)*4.4;stars[i*3+2]=Math.cos(i*43.9)*5-3;}
  const starGeo=new THREE.BufferGeometry();starGeo.setAttribute('position',new THREE.BufferAttribute(stars,3));
  scene.add(new THREE.Points(starGeo,new THREE.PointsMaterial({color:0x81988b,size:.012,transparent:true,opacity:.35})));
  let selected=-1, paused=false, visible=false, disposed=false, lost=false;
  let frames=0;
  let raf=0,last=0,time=0,pointerX=0,pointerY=0,targetPointerX=0,targetPointerY=0,width=0,height=0,distance=13,near=-1;
  const point = new THREE.Vector3();
  function layoutLabels() {
    network.updateMatrixWorld(true);
    vertices.forEach((vertex,i) => {
      const p = network.localToWorld(vertex.clone()).project(camera);
      const retreat = selected >= 0 ? weights[selected] : 0;
      const scale = height<180?1:1 + weights[i]*.4 - (selected>=0&&selected!==i?retreat*.25:0);
      const half = labels[i].offsetWidth*scale/2+6;
      const expanded=root.classList.contains('viewport-stage');
      let x = THREE.MathUtils.clamp(expanded?anchors[i].x:(p.x*.5+.5)*width,half,width-half);
      if(i===1)x=Math.min(x,width/2-half);if(i===2)x=Math.max(x,width/2+half);
      const halfHeight=labels[i].offsetHeight*scale/2+2;
      const rowBand=(Math.max(...labels.map(label=>label.offsetHeight))*(height<180?1:1.18)+6)/2;
      const rawY=(expanded?anchors[i].y:(-p.y*.5+.5)*height)+12;
      const y=i===0?THREE.MathUtils.clamp(rawY,halfHeight,Math.max(halfHeight,height/2-rowBand)):THREE.MathUtils.clamp(rawY,Math.min(height-halfHeight,height/2+rowBand),height-halfHeight);
      labels[i].style.opacity=String(selected>=0&&selected!==i?1-retreat*.25:1);
      labels[i].style.left=`${x}px`;labels[i].style.top=`${y}px`;
      labels[i].style.setProperty('--node-scale',String(scale));
    });
  }
  function draw(delta=0, instant=false) {
    if(lost||disposed||!width||!height)return;
    const staticMode=paused||reduce.matches;
    const blend=instant?1:1-Math.exp(-delta*7);
    const pointerBlend=instant?1:1-Math.exp(-delta*10);
    pointerX=THREE.MathUtils.lerp(pointerX,staticMode?0:targetPointerX,pointerBlend);
    pointerY=THREE.MathUtils.lerp(pointerY,staticMode?0:targetPointerY,pointerBlend);
    const focus=selected>=0?rest[selected]:null;
    weights.forEach((_,i)=>weights[i]=THREE.MathUtils.lerp(weights[i],!staticMode&&selected===i?1:0,blend));
    const amount=selected>=0?weights[selected]:0;
    cameraTarget.set((staticMode?0:pointerX*1.6)+(focus?focus.x*.3*amount:0), (staticMode?0:-pointerY*1.1)+(focus?focus.y*.22*amount:0), distance-amount*.9);
    lookDestination.set((staticMode?0:pointerX*.35)+(focus?focus.x*.12*amount:0), (staticMode?0:-pointerY*.25)+(focus?focus.y*.1*amount:0),0);
    camera.position.lerp(cameraTarget,blend);lookTarget.lerp(lookDestination,blend);camera.lookAt(lookTarget);
    const rotationX=-.1+(staticMode?0:pointerY*-.2+Math.sin(time*.4)*.035);
    const rotationY=staticMode?0:pointerX*.24+Math.sin(time*.25)*.045;
    const rotationZ=.025+(staticMode?0:pointerX*.05);
    network.rotation.x=THREE.MathUtils.lerp(network.rotation.x,rotationX,blend);
    network.rotation.y=THREE.MathUtils.lerp(network.rotation.y,rotationY,blend);
    network.rotation.z=THREE.MathUtils.lerp(network.rotation.z,rotationZ,blend);
    network.position.y=staticMode?0:Math.sin(time*.6)*.045;
    vertices.forEach((v,i)=>{
      v.copy(rest[i]);
      v.z+=weights[i]*1.3-(selected>=0&&selected!==i?amount*3.2:0);
      nodes[i].position.copy(v);nodes[i].scale.setScalar(1+weights[i]*.6-(selected>=0&&selected!==i?amount*.14:0));
      materials[i].emissiveIntensity=.4+weights[i]*1.1;
    });
    curves.forEach((curve,i)=>{
      curve.v0.copy(vertices[i]);curve.v2.copy(vertices[(i+1)%3]);curve.v1.copy(curve.v0).lerp(curve.v2,.5);curve.v1.z+=.5;
      const positions=connections[i].geometry.attributes.position;
      for(let j=0;j<49;j++){curve.getPoint(j/48,point);positions.setXYZ(j,point.x,point.y,point.z);}
      positions.needsUpdate=true;
      connections[i].material.opacity=selected<0||i===selected?.9:.45;
    });
    inner.rotation.y=time*.2;inner.rotation.z=time*.13;
    for(let i=0;i<count;i++){curves[Math.floor(i/40)].getPoint(((i%40)/40+time*.11)%1,point);positions[i*3]=point.x;positions[i*3+1]=point.y;positions[i*3+2]=point.z;}
    geometry.attributes.position.needsUpdate=true;
    layoutLabels();renderer.render(scene,camera);frames++;
  }
  function tick(now){raf=0;if(disposed||lost||!visible||document.hidden||paused||reduce.matches)return;const delta=last?Math.min((now-last)/1000,.05):.016;last=now;time+=delta;draw(delta);raf=requestAnimationFrame(tick);}
  function refresh(instant=false){if(raf)cancelAnimationFrame(raf);raf=0;last=0;draw(.016,instant||paused||reduce.matches);if(!disposed&&!lost&&visible&&!paused&&!reduce.matches)raf=requestAnimationFrame(tick);}
  const resize=new ResizeObserver(()=>{
    width=host.clientWidth;height=host.clientHeight;if(!width||!height)return;
    renderer.setSize(width,height,false);camera.aspect=width/height;distance=width<500?Math.max(13,7.8/camera.aspect):9.8;
    camera.updateProjectionMatrix();neutralCamera.copy(camera);neutralCamera.position.set(0,0,distance);neutralCamera.lookAt(0,0,0);neutralCamera.updateMatrixWorld();
    rest.forEach((v,i)=>{const p=v.clone().project(neutralCamera);anchors[i]={x:(p.x*.5+.5)*width,y:(-p.y*.5+.5)*height};});
    refresh();
  });resize.observe(host);
  const visibility=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;refresh();});visibility.observe(workspace);
  window.addEventListener('kywoo-triangle-pointer',event=>{
    const detail=event.detail||{};
    targetPointerX=detail.active&&!paused&&!reduce.matches?THREE.MathUtils.clamp(detail.x,-.5,.5):0;
    targetPointerY=detail.active&&!paused&&!reduce.matches?THREE.MathUtils.clamp(detail.y,-.5,.5):0;
  });
  workspace.addEventListener('pointermove',event=>{
    if(event.pointerType==='touch'||paused||reduce.matches)return;
    const r=workspace.getBoundingClientRect(),x=(event.clientX-r.left)*width/r.width,y=(event.clientY-r.top)*height/r.height;
    targetPointerX=x/width-.5;targetPointerY=y/height-.5;
    if(root.classList.contains('viewport-stage'))return;
    const distances=anchors.map(a=>Math.hypot(x-a.x,y-a.y));
    let next=distances.indexOf(Math.min(...distances));
    if(near>=0&&distances[near]<distances[next]+28)next=near;
    if(distances[next]>Math.min(width,height)*.6)next=-1;
    if(next!==near){near=next;onExplore(next);}
  });
  workspace.addEventListener('pointerleave',()=>{targetPointerX=0;targetPointerY=0;near=-1;if(!root.classList.contains('viewport-stage'))onExplore(-1);});
  document.addEventListener('visibilitychange',()=>refresh());
  root.querySelector('[data-network-fallback]').hidden=true;root.dataset.networkRenderer='webgl';
  renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;if(raf)cancelAnimationFrame(raf);host.hidden=true;root.querySelector('[data-network-fallback]').hidden=false;labels.forEach(label=>{label.style.left='';label.style.top='';label.style.removeProperty('--node-scale');});root.dataset.networkRenderer='fallback';});
  window.addEventListener('pagehide',()=>{disposed=true;if(raf)cancelAnimationFrame(raf);resize.disconnect();visibility.disconnect();scene.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});renderer.dispose();},{once:true});
  return {getStatus(){return{frames,time,raf:!!raf,paused,visible,disposed,lost,selected,rotation:{x:network.rotation.x,y:network.rotation.y,z:network.rotation.z}};},setState(index){if(selected===index)return;selected=index;near=index;refresh();},setPaused(value){paused=value;if(value){pointerX=0;pointerY=0;targetPointerX=0;targetPointerY=0;}refresh();}};
}
