import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

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
  const light = new THREE.PointLight(0xb9d7e6, 60);
  light.position.set(0,4,5); scene.add(light);
  const rest = [new THREE.Vector3(0,2.65,-1.1), new THREE.Vector3(-3,-1.7,1.5), new THREE.Vector3(3,-1.5,-.5)];
  const vertices = rest.map(v => v.clone());
  const anchors = rest.map(() => ({x:0,y:0}));
  const weights = [0,0,0];
  const materials = rest.map(() => new THREE.MeshStandardMaterial({color:0xb9d7e6, metalness:.5, roughness:.2, emissive:0x324f59, emissiveIntensity:.4}));
  const nodes = rest.map((v,i) => {
    const node = new THREE.Group();node.position.copy(v);network.add(node);
    node.add(new THREE.Mesh(new THREE.IcosahedronGeometry(.27,1), materials[i]));
    node.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(.46,1)),new THREE.LineBasicMaterial({color:0xd8edf3,transparent:true,opacity:.5})));
    return node;
  });
  const curves = vertices.map((v,i) => new THREE.QuadraticBezierCurve3(v.clone(), v.clone().lerp(vertices[(i+1)%3],.5), vertices[(i+1)%3].clone()));
  const connections = curves.map(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(49*3),3));
    const line = new THREE.Line(geometry,new THREE.LineBasicMaterial({color:0xa8d6d4,transparent:true,opacity:.8}));
    network.add(line);return line;
  });
  const inner = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.OctahedronGeometry(.7)),new THREE.LineBasicMaterial({color:0xb9d7e6,transparent:true,opacity:.45}));network.add(inner);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.13,.008,6,100),new THREE.MeshBasicMaterial({color:0xb9d7e6,transparent:true,opacity:.4}));ring.rotation.x=.55;network.add(ring);
  const count=120, positions=new Float32Array(count*3), geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  network.add(new THREE.Points(geometry,new THREE.PointsMaterial({color:0xe0f6ff,size:.035,transparent:true,opacity:.9})));
  const stars = new Float32Array(210*3);
  for(let i=0;i<210;i++){stars[i*3]=Math.sin(i*127.1)*6;stars[i*3+1]=Math.sin(i*73.7)*4.4;stars[i*3+2]=Math.cos(i*43.9)*5-3;}
  const starGeo=new THREE.BufferGeometry();starGeo.setAttribute('position',new THREE.BufferAttribute(stars,3));
  scene.add(new THREE.Points(starGeo,new THREE.PointsMaterial({color:0xc9e0d8,size:.012,transparent:true,opacity:.35})));
  let selected=-1, paused=false, visible=false, disposed=false, lost=false;
  let raf=0,last=0,time=0,pointerX=0,pointerY=0,width=0,height=0,distance=13,near=-1;
  const point = new THREE.Vector3();
  function layoutLabels() {
    network.updateMatrixWorld(true);
    vertices.forEach((vertex,i) => {
      const p = network.localToWorld(vertex.clone()).project(camera);
      const retreat = selected >= 0 ? weights[selected] : 0;
      const scale = 1 + weights[i]*.28 - (selected >= 0 && selected !== i ? retreat*.1 : 0);
      const half = labels[i].offsetWidth*scale/2+6;
      const x = THREE.MathUtils.clamp((p.x*.5+.5)*width,half,width-half);
      const y = THREE.MathUtils.clamp((-p.y*.5+.5)*height,12,Math.max(12,height-labels[i].offsetHeight*scale-76));
      labels[i].style.left=`${x}px`;labels[i].style.top=`${y}px`;
      labels[i].style.setProperty('--node-scale',String(scale));
    });
  }
  function draw(delta=0, instant=false) {
    if(lost||disposed||!width||!height)return;
    const staticMode=paused||reduce.matches;
    const blend=instant?1:1-Math.exp(-delta*7);
    const focus=selected>=0?rest[selected]:null;
    weights.forEach((_,i)=>weights[i]=THREE.MathUtils.lerp(weights[i],!staticMode&&selected===i?1:0,blend));
    const amount=selected>=0?weights[selected]:0;
    cameraTarget.set((staticMode?0:pointerX*1.6)+(focus?focus.x*.3*amount:0), (staticMode?0:-pointerY*1.1)+(focus?focus.y*.22*amount:0), distance-amount*1.65);
    lookDestination.set((staticMode?0:pointerX*.35)+(focus?focus.x*.12*amount:0), (staticMode?0:-pointerY*.25)+(focus?focus.y*.1*amount:0),0);
    camera.position.lerp(cameraTarget,blend);lookTarget.lerp(lookDestination,blend);camera.lookAt(lookTarget);
    network.rotation.set(-.1+(staticMode?0:Math.sin(time*.4)*.035),staticMode?0:Math.sin(time*.25)*.045,.025);
    network.position.y=staticMode?0:Math.sin(time*.6)*.045;
    vertices.forEach((v,i)=>{
      v.copy(rest[i]);
      v.z+=weights[i]*1.8-(selected>=0&&selected!==i?amount*2.5:0);
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
    layoutLabels();renderer.render(scene,camera);
  }
  function tick(now){raf=0;if(disposed||lost||!visible||document.hidden||paused||reduce.matches)return;const delta=last?Math.min((now-last)/1000,.05):.016;last=now;time+=delta;draw(delta);raf=requestAnimationFrame(tick);}
  function refresh(instant=false){if(raf)cancelAnimationFrame(raf);raf=0;last=0;draw(.016,instant||paused||reduce.matches);if(!disposed&&!lost&&visible&&!paused&&!reduce.matches)raf=requestAnimationFrame(tick);}
  const resize=new ResizeObserver(()=>{
    const size=host.getBoundingClientRect();width=size.width;height=size.height;if(!width||!height)return;
    renderer.setSize(width,height,false);camera.aspect=width/height;distance=width<500?Math.max(15.7,12.4/camera.aspect):12.8;
    camera.updateProjectionMatrix();neutralCamera.copy(camera);neutralCamera.position.set(0,0,distance);neutralCamera.lookAt(0,0,0);neutralCamera.updateMatrixWorld();
    rest.forEach((v,i)=>{const p=v.clone().project(neutralCamera);anchors[i]={x:(p.x*.5+.5)*width,y:(-p.y*.5+.5)*height};});
    refresh(true);
  });resize.observe(host);
  const visibility=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;refresh();});visibility.observe(workspace);
  workspace.addEventListener('pointermove',event=>{
    if(event.pointerType==='touch'||paused||reduce.matches)return;
    const r=workspace.getBoundingClientRect(),x=event.clientX-r.left,y=event.clientY-r.top;
    pointerX=x/r.width-.5;pointerY=y/r.height-.5;
    const distances=anchors.map(a=>Math.hypot(x-a.x,y-a.y));
    let next=distances.indexOf(Math.min(...distances));
    if(near>=0&&distances[near]<distances[next]+28)next=near;
    if(distances[next]>Math.min(width,height)*.6)next=-1;
    if(next!==near){near=next;onExplore(next);}
  });
  workspace.addEventListener('pointerleave',()=>{pointerX=0;pointerY=0;near=-1;onExplore(-1);});
  document.addEventListener('visibilitychange',()=>refresh());
  root.querySelector('[data-network-fallback]').hidden=true;root.dataset.networkRenderer='webgl';
  renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;if(raf)cancelAnimationFrame(raf);host.hidden=true;root.querySelector('[data-network-fallback]').hidden=false;labels.forEach(label=>{label.style.left='';label.style.top='';label.style.removeProperty('--node-scale');});root.dataset.networkRenderer='fallback';});
  window.addEventListener('pagehide',()=>{disposed=true;if(raf)cancelAnimationFrame(raf);resize.disconnect();visibility.disconnect();scene.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});renderer.dispose();},{once:true});
  return {setState(index){if(selected===index)return;selected=index;near=index;refresh();},setPaused(value){paused=value;refresh();}};
}
