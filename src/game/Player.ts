import * as THREE from 'three';

import type { InputController } from './InputController';
import type { World } from './World';

const WALK_SPEED = 6;
const SPRINT_SPEED = 10;

export class Player {
  readonly object: THREE.Object3D;

  private readonly body: THREE.Mesh;
  private readonly cloak: THREE.Mesh;

  private velocity = new THREE.Vector3();
  private heading = 0;

  constructor() {
    this.object = new THREE.Group();

    const coreMaterial = new THREE.MeshStandardMaterial({
      color: 0xfff2d4,
      emissive: 0x332828,
      metalness: 0.05,
      roughness: 0.35
    });
    const cloakMaterial = new THREE.MeshStandardMaterial({
      color: 0x2c7a7b,
      emissive: 0x0d2f36,
      roughness: 0.75
    });

    const bodyGeometry = new THREE.CapsuleGeometry(0.35, 1.1, 12, 24);
    const cloakGeometry = new THREE.ConeGeometry(0.9, 1.8, 24, 1, true);
    cloakGeometry.translate(0, -0.4, 0);

    this.body = new THREE.Mesh(bodyGeometry, coreMaterial);
    this.body.castShadow = true;
    this.body.receiveShadow = true;

    this.cloak = new THREE.Mesh(cloakGeometry, cloakMaterial);
    this.cloak.castShadow = true;

    const lantern = new THREE.PointLight(0x5ad8ff, 1.3, 12, 2);
    lantern.position.set(0.25, 0.8, 0);

    this.object.add(this.body, this.cloak, lantern);
    this.object.position.set(0, 1.1, 0);
  }

  update(delta: number, input: InputController, world: World): void {
    const movement = input.movement;

    const isoForward = new THREE.Vector3(-1, 0, -1).normalize();
    const isoRight = new THREE.Vector3(1, 0, -1).normalize();

    const intent = new THREE.Vector3();
    if (movement.forward) {
      intent.add(isoForward);
    }
    if (movement.backward) {
      intent.sub(isoForward);
    }
    if (movement.left) {
      intent.sub(isoRight);
    }
    if (movement.right) {
      intent.add(isoRight);
    }

    if (intent.lengthSq() > 1e-5) {
      intent.normalize();
    }

    const targetSpeed = movement.sprint ? SPRINT_SPEED : WALK_SPEED;
    this.velocity.lerp(intent.multiplyScalar(targetSpeed), 1 - Math.exp(-delta * 12));

    if (this.velocity.lengthSq() > 1e-4) {
      this.heading = Math.atan2(this.velocity.x, this.velocity.z);
    }

    this.object.position.addScaledVector(this.velocity, delta);
    world.constrainPosition(this.object.position);

    const height = world.getSurfaceHeight(this.object.position);
    this.object.position.y = height + 1.05;

    this.object.rotation.y = -this.heading + Math.PI;
  }

  get headingDegrees(): number {
    return THREE.MathUtils.radToDeg((this.heading % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2));
  }

  get headingRadians(): number {
    return this.heading;
  }

  get speedMetersPerSecond(): number {
    return this.velocity.length();
  }
}
