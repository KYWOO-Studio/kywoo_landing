import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

const PALETTE = {
  ivory: '#f3f0e7', forest: '#203e34', sage: '#bdc8b5',
  line: '#c9cfc3', secondary: '#52675b', blue: '#b9d7e6', ground: '#dfe3d8'
};

const VIEWS = [
  { position: new THREE.Vector3(57, 49, 59), target: new THREE.Vector3(0, 1.5, 0), fov: 34 },
  { position: new THREE.Vector3(31, 25, 34), target: new THREE.Vector3(0, 5, 0), fov: 31 },
  { position: new THREE.Vector3(29, 18, 31), target: new THREE.Vector3(4, 3.2, 0), fov: 31 }
];

function seededRandom(seed = 31) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

export class GenericScene {
  constructor(container, { reducedMotion = false, onReady = () => {}, onError = () => {} } = {}) {
    this.container = container;
    this.reducedMotion = reducedMotion;
    this.onReady = onReady;
    this.onError = onError;
    this.visible = true;
    this.disposed = false;
    this.ready = false;
    this.targetView = 0;
    this.currentView = 0;
    this.selectedFloor = -1;
    this.floors = [];
    this.ringMaterials = [];
    this.contextMaterials = [];
    this.scenarioMaterials = [];
    this.lastTime = 0;

    try {
      this.init();
    } catch (error) {
      this.onError(error);
      throw error;
    }
  }

  init() {
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(PALETTE.ground);
    this.scene.fog = new THREE.Fog(PALETTE.ground, 80, 165);
    this.camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 260);
    this.camera.position.copy(VIEWS[0].position);
    this.camera.lookAt(VIEWS[0].target);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    this.renderer.setSize(width, height, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.container.appendChild(this.renderer.domElement);
    this.renderer.domElement.setAttribute('aria-hidden', 'true');

    const hemisphere = new THREE.HemisphereLight(0xf8f5ec, 0x66786a, 2.25);
    this.scene.add(hemisphere);
    const sun = new THREE.DirectionalLight(0xffffff, 3.2);
    sun.position.set(-35, 65, 28);
    this.scene.add(sun);
    const fill = new THREE.DirectionalLight(0xb9d7e6, 1.1);
    fill.position.set(45, 20, -40);
    this.scene.add(fill);

    this.world = new THREE.Group();
    this.world.rotation.y = -0.18;
    this.scene.add(this.world);
    this.createGround();
    this.createContext();
    this.createSubject();
    this.createScenario();

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.container);
    this.renderer.domElement.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      this.visible = false;
      this.onError(new Error('WebGL context lost'));
    });

    this.tick = this.tick.bind(this);
    this.frame = requestAnimationFrame(this.tick);
  }

  createGround() {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(190, 190),
      new THREE.MeshStandardMaterial({ color: PALETTE.ground, roughness: 1, metalness: 0 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.08;
    this.world.add(ground);

    const grid = new THREE.GridHelper(160, 40, PALETTE.sage, PALETTE.line);
    grid.position.y = -0.035;
    grid.material.transparent = true;
    grid.material.opacity = 0.42;
    this.world.add(grid);

    const roadMaterial = new THREE.MeshStandardMaterial({ color: '#e9e9e0', roughness: 1 });
    const roads = [
      { w: 150, h: 8, x: 0, z: 23, r: 0 },
      { w: 8, h: 150, x: -24, z: 0, r: 0 },
      { w: 95, h: 4, x: 18, z: -26, r: -0.22 }
    ];
    roads.forEach(({ w, h, x, z, r }) => {
      const road = new THREE.Mesh(new THREE.PlaneGeometry(w, h), roadMaterial);
      road.rotation.x = -Math.PI / 2;
      road.rotation.z = r;
      road.position.set(x, -0.01, z);
      this.world.add(road);
    });

    [18, 29, 44].forEach((radius, index) => {
      const points = [];
      for (let i = 0; i < 160; i += 1) {
        const angle = (i / 160) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(angle) * radius, 0.05, Math.sin(angle) * radius));
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineDashedMaterial({
        color: index === 0 ? PALETTE.forest : PALETTE.secondary,
        transparent: true, opacity: index === 0 ? 0.72 : 0.38,
        dashSize: 0.8, gapSize: 0.55
      });
      const ring = new THREE.LineLoop(geometry, material);
      ring.computeLineDistances();
      this.world.add(ring);
      this.ringMaterials.push(material);
    });

    const nodeGeometry = new THREE.CylinderGeometry(0.48, 0.48, 0.18, 20);
    const nodeMaterial = new THREE.MeshBasicMaterial({ color: PALETTE.blue });
    [[-20, 23], [29, 23], [-24, -17], [13, -26]].forEach(([x, z]) => {
      const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
      node.position.set(x, 0.13, z);
      this.world.add(node);
    });
  }

  createContext() {
    const random = seededRandom(131);
    const positions = [];
    for (let x = -58; x <= 58; x += 14) {
      for (let z = -55; z <= 55; z += 15) {
        const px = x + (random() - 0.5) * 4;
        const pz = z + (random() - 0.5) * 4;
        if (Math.abs(px) < 17 && Math.abs(pz) < 15) continue;
        if (Math.abs(pz - 23) < 7 || Math.abs(px + 24) < 7) continue;
        if (Math.hypot(px, pz) > 72 || random() < 0.25) continue;
        positions.push([px, pz]);
      }
    }

    positions.forEach(([x, z], index) => {
      const w = 4.5 + random() * 5;
      const d = 4 + random() * 5;
      const h = 2.5 + random() * (index % 5 === 0 ? 12 : 7);
      const group = new THREE.Group();
      const material = new THREE.MeshStandardMaterial({
        color: index % 4 === 0 ? '#d1d8cb' : PALETTE.ivory,
        roughness: 0.95, transparent: true, opacity: 0.92
      });
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
      mesh.position.y = h / 2;
      group.add(mesh);
      const edgeMaterial = new THREE.LineBasicMaterial({ color: '#a8b5a6', transparent: true, opacity: 0.48 });
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), edgeMaterial);
      edges.position.y = h / 2;
      group.add(edges);
      group.position.set(x, 0, z);
      group.rotation.y = (random() - 0.5) * 0.18;
      this.world.add(group);
      this.contextMaterials.push(material, edgeMaterial);
    });
  }

  createSubject() {
    this.subject = new THREE.Group();
    this.subject.position.set(0, 0.1, 0);
    this.world.add(this.subject);

    const plinth = new THREE.Mesh(
      new THREE.BoxGeometry(23, 0.35, 17),
      new THREE.MeshStandardMaterial({ color: PALETTE.secondary, roughness: 1 })
    );
    plinth.position.y = 0.12;
    this.subject.add(plinth);

    const floorColors = [PALETTE.forest, '#527164', PALETTE.blue, PALETTE.sage];
    for (let i = 0; i < 4; i += 1) {
      const floor = new THREE.Group();
      const materials = [];
      const edgeMaterials = [];
      const parts = [
        { w: 14, h: 0.82, d: 13, x: -2.8, z: 0 },
        { w: 6.4, h: 0.82, d: 8.8, x: 7.1, z: -1.8 },
        { w: 5.2, h: 0.82, d: 4.1, x: 5.9, z: 4.6 }
      ];
      parts.forEach((part, partIndex) => {
        const material = new THREE.MeshStandardMaterial({
          color: floorColors[i], roughness: 0.8, metalness: 0,
          transparent: true, opacity: partIndex === 2 ? 0.88 : 1
        });
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(part.w, part.h, part.d), material);
        mesh.position.set(part.x, 0, part.z);
        floor.add(mesh);
        materials.push(material);

        const edgeMaterial = new THREE.LineBasicMaterial({ color: PALETTE.forest, transparent: true, opacity: 0.55 });
        const edges = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), edgeMaterial);
        edges.position.copy(mesh.position);
        floor.add(edges);
        edgeMaterials.push(edgeMaterial);
      });

      const coreMaterial = new THREE.MeshStandardMaterial({ color: PALETTE.ivory, roughness: 1, transparent: true });
      const core = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.95, 3), coreMaterial);
      core.position.set(1, 0.15, 0.5);
      floor.add(core);
      materials.push(coreMaterial);

      floor.userData.baseY = 0.75 + i * 1.1;
      floor.userData.index = i;
      floor.position.y = floor.userData.baseY;
      this.subject.add(floor);
      this.floors.push({ group: floor, materials, edgeMaterials, baseColor: new THREE.Color(floorColors[i]) });
    }

    const roofMaterial = new THREE.MeshStandardMaterial({ color: PALETTE.ivory, roughness: 1, transparent: true });
    this.roof = new THREE.Group();
    const roof = new THREE.Mesh(new THREE.BoxGeometry(14.4, 0.22, 13.4), roofMaterial);
    roof.position.x = -2.8;
    this.roof.add(roof);
    const roofEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(roof.geometry),
      new THREE.LineBasicMaterial({ color: PALETTE.forest, transparent: true, opacity: 0.5 })
    );
    roofEdges.position.x = -2.8;
    this.roof.add(roofEdges);
    this.roof.position.y = 5.15;
    this.subject.add(this.roof);
    this.roofMaterial = roofMaterial;
  }

  createScenario() {
    this.scenario = new THREE.Group();
    this.scenario.position.set(15, 0, -3);
    this.world.add(this.scenario);
    const blocks = [
      { w: 5, h: 4.2, d: 6, x: 0, z: 0 },
      { w: 4, h: 7.2, d: 4, x: 4, z: -1 },
      { w: 7, h: 2.1, d: 3.5, x: 1, z: 4.5 }
    ];
    blocks.forEach(({ w, h, d, x, z }) => {
      const material = new THREE.MeshStandardMaterial({
        color: PALETTE.blue, roughness: 0.7, transparent: true, opacity: 0
      });
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
      mesh.position.set(x, h / 2, z);
      this.scenario.add(mesh);
      const edgeMaterial = new THREE.LineBasicMaterial({ color: PALETTE.forest, transparent: true, opacity: 0 });
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), edgeMaterial);
      edges.position.copy(mesh.position);
      this.scenario.add(edges);
      this.scenarioMaterials.push(material, edgeMaterial);
    });
  }

  setScrollProgress(progress, { immediate = false } = {}) {
    this.targetView = THREE.MathUtils.clamp(progress, 0, 1) * 2;
    if (immediate || this.reducedMotion) this.currentView = this.targetView;
    this.renderOnce();
  }

  setStep(index, { immediate = false } = {}) {
    this.targetView = THREE.MathUtils.clamp(index, 0, 2);
    if (immediate || this.reducedMotion) this.currentView = this.targetView;
    this.renderOnce();
  }

  setFloor(index) {
    this.selectedFloor = index;
    this.floors.forEach((floor, floorIndex) => {
      const selected = index < 0 || index === floorIndex;
      floor.materials.forEach((material, materialIndex) => {
        material.opacity = selected ? (materialIndex === 2 ? 0.9 : 1) : 0.13;
        if (materialIndex < 3) {
          material.color.copy(floor.baseColor);
          if (index === floorIndex) material.color.lerp(new THREE.Color(PALETTE.blue), 0.32);
        }
      });
      floor.edgeMaterials.forEach((material) => { material.opacity = selected ? 0.72 : 0.1; });
    });
    this.renderOnce();
  }

  setVisible(visible) {
    this.visible = visible && !this.disposed;
    if (this.visible) {
      this.lastTime = 0;
      if (!this.frame) this.frame = requestAnimationFrame(this.tick);
    }
  }

  resize() {
    if (this.disposed || !this.renderer) return;
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.renderOnce();
  }

  updateScene(delta) {
    const smoothing = this.reducedMotion ? 1 : 1 - Math.pow(0.001, delta);
    this.currentView += (this.targetView - this.currentView) * smoothing;
    if (Math.abs(this.targetView - this.currentView) < 0.0001) this.currentView = this.targetView;

    const low = Math.floor(this.currentView);
    const high = Math.min(2, low + 1);
    const mix = THREE.MathUtils.smoothstep(this.currentView - low, 0, 1);
    this.camera.position.lerpVectors(VIEWS[low].position, VIEWS[high].position, mix);
    const target = new THREE.Vector3().lerpVectors(VIEWS[low].target, VIEWS[high].target, mix);
    this.camera.fov = THREE.MathUtils.lerp(VIEWS[low].fov, VIEWS[high].fov, mix);
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(target);

    const exploded = THREE.MathUtils.smoothstep(this.currentView, 0.12, 0.95) * (1 - THREE.MathUtils.smoothstep(this.currentView, 1.25, 1.95));
    this.floors.forEach((floor, index) => {
      floor.group.position.y = floor.group.userData.baseY + exploded * index * 1.45;
    });
    this.roof.position.y = 5.15 + exploded * 5.1;
    this.roofMaterial.opacity = 1 - exploded * 0.72;
    this.subject.rotation.y = -0.16 * this.currentView;

    const contextOpacity = 0.92 - THREE.MathUtils.smoothstep(this.currentView, 0, 0.85) * 0.77;
    this.contextMaterials.forEach((material) => {
      material.opacity = material.isLineBasicMaterial ? contextOpacity * 0.52 : contextOpacity;
    });
    const ringOpacity = 1 - THREE.MathUtils.smoothstep(this.currentView, 0, 0.65);
    this.ringMaterials.forEach((material, index) => {
      material.opacity = ringOpacity * (index === 0 ? 0.72 : 0.38);
    });
    const scenarioOpacity = THREE.MathUtils.smoothstep(this.currentView, 1.25, 1.95);
    this.scenarioMaterials.forEach((material) => {
      material.opacity = scenarioOpacity * (material.isLineBasicMaterial ? 0.6 : 0.48);
    });
  }

  tick(time) {
    this.frame = null;
    if (this.disposed || !this.visible) return;
    const delta = this.lastTime ? Math.min((time - this.lastTime) / 1000, 0.05) : 1 / 60;
    this.lastTime = time;
    this.updateScene(delta);
    this.renderer.render(this.scene, this.camera);
    if (!this.ready) {
      this.ready = true;
      this.onReady();
    }
    this.frame = requestAnimationFrame(this.tick);
  }

  renderOnce() {
    if (this.disposed || !this.renderer) return;
    this.updateScene(1 / 60);
    this.renderer.render(this.scene, this.camera);
    if (!this.ready) {
      this.ready = true;
      this.onReady();
    }
  }

  dispose() {
    this.disposed = true;
    if (this.frame) cancelAnimationFrame(this.frame);
    this.resizeObserver?.disconnect();
    this.scene?.traverse((object) => {
      object.geometry?.dispose();
      if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
      else object.material?.dispose();
    });
    this.renderer?.dispose();
    this.renderer?.domElement.remove();
  }
}
