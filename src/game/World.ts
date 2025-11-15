import * as THREE from 'three';

import type { Player } from './Player';

const REGION_NAMES = [
  { radius: 8, name: 'Inner Grove' },
  { radius: 18, name: 'Ring of Echoes' },
  { radius: 32, name: 'Blooming Fields' },
  { radius: 48, name: 'Shimmering Expanse' }
];

const EXPANSION_RADIUS = REGION_NAMES[REGION_NAMES.length - 1]?.radius ?? 48;

export class World {
  private readonly groundMaterial: THREE.MeshStandardMaterial;
  private readonly glowMaterial: THREE.ShaderMaterial;
  private readonly roots: THREE.Group;
  private readonly lanterns: THREE.PointLight[] = [];
  private readonly cameraOffset = new THREE.Vector3(-16, 18, 16);

  private readonly clock = new THREE.Clock();
  private cameraReady = false;

  constructor(private readonly scene: THREE.Scene) {
    this.groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x20311e,
      roughness: 0.85,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    this.glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        varying vec2 vUv;
        uniform float uTime;
        void main() {
          vUv = uv;
          vec3 transformed = position;
          transformed.y += sin((position.x + position.z) * 0.5 + uTime) * 0.08;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        void main() {
          float dist = length(vUv - vec2(0.5));
          float glow = smoothstep(0.6, 0.0, dist);
          float flicker = 0.45 + 0.35 * sin(uTime * 2.0 + dist * 12.0);
          gl_FragColor = vec4(vec3(0.25, 0.8, 1.0) * glow * flicker, glow * 0.9);
        }
      `
    });

    this.roots = new THREE.Group();
    scene.add(this.roots);

    this.buildTerrain();
    this.buildLandmarks();
    this.buildAncientRoots();
    this.clock.start();
  }

  private buildTerrain(): void {
    const radius = EXPANSION_RADIUS + 6;
    const segments = 96;
    const geometry = new THREE.CircleGeometry(radius, segments);

    const positions = geometry.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array((positions.count ?? 0) * 3);

    const color = new THREE.Color();
    for (let i = 0; i < positions.count; i += 1) {
      const x = positions.getX(i);
      const z = positions.getY(i);
      const dist = Math.sqrt(x * x + z * z);
      const t = THREE.MathUtils.smoothstep(dist, 0, radius);
      color.setHSL(0.39 - t * 0.1, 0.55, 0.25 + t * 0.1);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      const y = this.sampleHeight(x, z);
      positions.setZ(i, y);
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const groundMaterial = this.groundMaterial.clone();
    groundMaterial.vertexColors = true;
    const ground = new THREE.Mesh(geometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const innerRing = new THREE.Mesh(
      new THREE.RingGeometry(4.4, 4.8, 48, 1),
      new THREE.MeshBasicMaterial({
        color: 0x5ad8ff,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide
      })
    );
    innerRing.rotation.x = -Math.PI / 2;
    innerRing.position.y = 0.01;
    this.scene.add(innerRing);
  }

  private buildLandmarks(): void {
    const rng = THREE.MathUtils.seededRandom;
    const dummy = new THREE.Object3D();

    const treeGeometry = new THREE.ConeGeometry(0.9, 3.4, 9);
    const treeMaterial = new THREE.MeshStandardMaterial({
      color: 0x2f855a,
      roughness: 0.7,
      metalness: 0.1,
      emissive: 0x081f17
    });

    const treeCount = 160;
    const trees = new THREE.InstancedMesh(treeGeometry, treeMaterial, treeCount);
    trees.castShadow = true;
    trees.receiveShadow = true;

    for (let i = 0; i < treeCount; i += 1) {
      const angle = rng() * Math.PI * 2;
      const radius = 6 + rng() * (EXPANSION_RADIUS - 6);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = this.sampleHeight(x, z);

      dummy.position.set(x, y + 1.7, z);
      dummy.rotation.y = rng() * Math.PI;
      const scale = 0.85 + rng() * 0.35;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      trees.setMatrixAt(i, dummy.matrix);
    }
    trees.instanceMatrix.needsUpdate = true;
    this.scene.add(trees);

    const stoneMaterial = new THREE.MeshStandardMaterial({
      color: 0xb8c2d1,
      roughness: 0.9,
      metalness: 0.02
    });
    const stoneGeometry = new THREE.DodecahedronGeometry(0.6, 0);
    const stoneCount = 24;
    const stones = new THREE.InstancedMesh(stoneGeometry, stoneMaterial, stoneCount);
    stones.castShadow = true;
    stones.receiveShadow = true;

    for (let i = 0; i < stoneCount; i += 1) {
      const theta = (i / stoneCount) * Math.PI * 2;
      const radius = 5.2 + Math.sin(i * 0.7) * 0.5;
      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;
      const y = this.sampleHeight(x, z);
      dummy.position.set(x, y + 0.2, z);
      dummy.rotation.y = rng() * Math.PI;
      const scale = 0.8 + rng() * 0.25;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      stones.setMatrixAt(i, dummy.matrix);
    }
    stones.instanceMatrix.needsUpdate = true;
    this.scene.add(stones);

    const glade = new THREE.Group();
    const glowGeometry = new THREE.PlaneGeometry(1.8, 1.8);
    for (let i = 0; i < 12; i += 1) {
      const light = new THREE.PointLight(0x7ad9ff, 0.8, 14, 2);
      const angle = (i / 12) * Math.PI * 2;
      const radius = 7.4;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = this.sampleHeight(x, z) + 0.6;
      light.position.set(x, y, z);
      this.scene.add(light);
      this.lanterns.push(light);

      const glow = new THREE.Mesh(glowGeometry, this.glowMaterial);
      glow.rotation.x = -Math.PI / 2;
      glow.position.set(x, 0.1, z);
      glade.add(glow);
    }
    this.scene.add(glade);

    const portalGeometry = new THREE.TorusGeometry(2.5, 0.12, 16, 64);
    const portalMaterial = new THREE.MeshStandardMaterial({
      color: 0x9f7aea,
      emissive: 0x5a3d8a,
      metalness: 0.6,
      roughness: 0.2
    });
    const portal = new THREE.Mesh(portalGeometry, portalMaterial);
    portal.position.set(0, 3, -12);
    portal.castShadow = true;
    this.scene.add(portal);

    const portalGlow = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), this.glowMaterial);
    portalGlow.position.copy(portal.position);
    portalGlow.lookAt(new THREE.Vector3(0, 3, 0));
    this.scene.add(portalGlow);
  }

  private buildAncientRoots(): void {
    const rootMaterial = new THREE.MeshStandardMaterial({
      color: 0x5c3b21,
      roughness: 0.85,
      metalness: 0.2,
      emissive: 0x1c0f07
    });

    for (let i = 0; i < 6; i += 1) {
      const arc = new THREE.TorusGeometry(2.6, 0.22, 12, 42, Math.PI / 1.3);
      const mesh = new THREE.Mesh(arc, rootMaterial);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.rotation.x = Math.PI / 2;
      mesh.rotation.z = (i / 6) * Math.PI * 2;
      this.roots.add(mesh);
    }

    const heartGeometry = new THREE.SphereGeometry(0.8, 24, 18);
    const heartMaterial = new THREE.MeshStandardMaterial({
      color: 0xf6c177,
      emissive: 0x5b321c,
      roughness: 0.45,
      metalness: 0.15
    });
    const heart = new THREE.Mesh(heartGeometry, heartMaterial);
    heart.castShadow = true;
    heart.position.set(0, 1.6, 0);
    this.roots.add(heart);
  }

  update(_delta: number, player: Player): void {
    const elapsed = this.clock.getElapsedTime();
    this.glowMaterial.uniforms.uTime.value = elapsed;

    for (const [index, lantern] of this.lanterns.entries()) {
      lantern.intensity = 0.7 + Math.sin(elapsed * 2 + index) * 0.2;
    }

    const sway = Math.sin(elapsed * 0.5) * 0.2;
    this.roots.position.y = sway;
    this.roots.rotation.y = Math.sin(elapsed * 0.2) * 0.1;

    const pos = player.object.position;
    this.roots.position.x = pos.x * 0.08;
    this.roots.position.z = pos.z * 0.08;
  }

  syncCamera(camera: THREE.OrthographicCamera, player: Player): void {
    const target = player.object.position;
    const desired = target.clone().add(this.cameraOffset);

    if (!this.cameraReady) {
      camera.position.copy(desired);
      camera.up.set(0, 1, 0);
      this.cameraReady = true;
    } else {
      camera.position.lerp(desired, 0.1);
    }
    camera.lookAt(target.x, target.y + 1.2, target.z);
  }

  getSpawnPoint(): THREE.Vector3 {
    return new THREE.Vector3(0, this.sampleHeight(0, 0) + 1.05, 2);
  }

  constrainPosition(position: THREE.Vector3): void {
    const radius = Math.sqrt(position.x * position.x + position.z * position.z);
    if (radius > EXPANSION_RADIUS) {
      const factor = EXPANSION_RADIUS / radius;
      position.x *= factor;
      position.z *= factor;
    }
  }

  getSurfaceHeight(position: THREE.Vector3): number {
    return this.sampleHeight(position.x, position.z);
  }

  getRegionName(position: THREE.Vector3): string {
    const radius = Math.sqrt(position.x * position.x + position.z * position.z);
    for (const region of REGION_NAMES) {
      if (radius <= region.radius) {
        return region.name;
      }
    }
    return 'Veil of Stars';
  }

  getExplorationProgress(position: THREE.Vector3): number {
    const radius = Math.sqrt(position.x * position.x + position.z * position.z);
    return THREE.MathUtils.clamp(radius / EXPANSION_RADIUS, 0, 1);
  }

  private sampleHeight(x: number, z: number): number {
    const dist = Math.sqrt(x * x + z * z);
    const ripple = Math.sin(dist * 0.6) * 0.4;
    const swell = Math.cos((x + z) * 0.18) * 0.25;
    const basin = -Math.pow(dist / (EXPANSION_RADIUS * 1.3), 2) * 1.2;
    return ripple + swell + basin;
  }
}
