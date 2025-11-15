import * as THREE from 'three';

import { Hud } from './Hud';
import { InputController } from './InputController';
import { Player } from './Player';
import { World } from './World';

const MAX_STEP = 1 / 30;

export class GameApp {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.OrthographicCamera;
  private readonly clock: THREE.Clock;
  private readonly hud: Hud;
  private readonly input: InputController;
  private readonly world: World;
  private readonly player: Player;
  private readonly frustumSize = 26;

  private running = false;
  private frameHandle = 0;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x09111f, 0.045);
    this.scene.background = new THREE.Color(0x060b14);

    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);

    this.clock = new THREE.Clock();

    this.input = new InputController();
    this.hud = new Hud();

    this.world = new World(this.scene);
    this.player = new Player();
    this.scene.add(this.player.object);
    this.player.object.position.copy(this.world.getSpawnPoint());

    const ambient = new THREE.AmbientLight(0xa6c8ff, 0.6);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfff6d4, 1.05);
    sun.position.set(-12, 18, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 0.1;
    sun.shadow.camera.far = 60;
    sun.shadow.camera.left = -25;
    sun.shadow.camera.right = 25;
    sun.shadow.camera.top = 25;
    sun.shadow.camera.bottom = -25;
    this.scene.add(sun);

    this.resize();
  }

  start(): void {
    if (this.running) {
      return;
    }
    this.running = true;
    this.clock.start();
    this.frameHandle = requestAnimationFrame(() => this.loop());
  }

  pause(): void {
    if (!this.running) {
      return;
    }
    this.running = false;
    cancelAnimationFrame(this.frameHandle);
  }

  resume(): void {
    if (this.running) {
      return;
    }
    this.start();
  }

  resize(): void {
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;

    this.renderer.setSize(width, height, false);
    const aspect = width / Math.max(1, height);
    const halfHeight = this.frustumSize / 2;
    const halfWidth = halfHeight * aspect;
    this.camera.left = -halfWidth;
    this.camera.right = halfWidth;
    this.camera.top = halfHeight;
    this.camera.bottom = -halfHeight;
    this.camera.updateProjectionMatrix();
  }

  private loop(): void {
    if (!this.running) {
      return;
    }

    this.frameHandle = requestAnimationFrame(() => this.loop());

    const delta = Math.min(this.clock.getDelta(), MAX_STEP);

    this.input.update();
    this.player.update(delta, this.input, this.world);
    this.world.update(delta, this.player);
    this.world.syncCamera(this.camera, this.player);

    this.renderer.render(this.scene, this.camera);

    this.hud.update({
      region: this.world.getRegionName(this.player.object.position),
      heading: this.player.headingDegrees,
      pace: this.player.speedMetersPerSecond,
      exploration: this.world.getExplorationProgress(this.player.object.position)
    });
  }
}
