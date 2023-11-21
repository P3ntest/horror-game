import { Physics, PhysicsEntity } from "./engine/PhysicsEngine";
import * as THREE from "three";

const textureLoader = new THREE.TextureLoader();
const metalTexure = textureLoader.load("assets/metal.jpg");
metalTexure.wrapS = THREE.RepeatWrapping;
metalTexure.wrapT = THREE.RepeatWrapping;
metalTexure.repeat.set(0.2, 0.2);

export class Breaker extends PhysicsEntity {
  createColliders(): import("@dimforge/rapier3d").ColliderDesc[] {
    return [Physics.ColliderDesc.cuboid(0.3, 0.5, 0.1)];
  }
  getBodyDesc(): import("@dimforge/rapier3d").RigidBodyDesc {
    return Physics.RigidBodyDesc.fixed();
  }

  door: THREE.Group;

  onInitGraphics(): void {
    // 0.6 x 1 x 0.2 dimensions of the breaker

    // generate the back wall
    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 1, 0.01),
      new THREE.MeshStandardMaterial({
        map: metalTexure,
      })
    );
    backWall.position.set(0, 0, -0.05);
    this.container.add(backWall);

    const WALL_THICKNESS = 0.1;

    //the four sides
    const leftSide = new THREE.Mesh(
      new THREE.BoxGeometry(WALL_THICKNESS, 1 - WALL_THICKNESS * 2, 0.2),
      new THREE.MeshStandardMaterial({
        map: metalTexure,
      })
    );
    leftSide.position.set(-0.3 + WALL_THICKNESS / 2, 0, 0);

    const rightSide = new THREE.Mesh(
      new THREE.BoxGeometry(WALL_THICKNESS, 1 - WALL_THICKNESS * 2, 0.2),
      new THREE.MeshStandardMaterial({
        map: metalTexure,
      })
    );
    rightSide.position.set(0.3 - WALL_THICKNESS / 2, 0, 0);

    const topSide = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, WALL_THICKNESS, 0.2),
      new THREE.MeshStandardMaterial({
        map: metalTexure,
      })
    );
    topSide.position.set(0, 0.5 - WALL_THICKNESS / 2, 0);

    const bottomSide = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, WALL_THICKNESS, 0.2),
      new THREE.MeshStandardMaterial({
        map: metalTexure,
      })
    );
    bottomSide.position.set(0, -0.5 + WALL_THICKNESS / 2, 0);

    this.container.add(leftSide, rightSide, topSide, bottomSide);

    const OFFSET = 0.2;
    const OFFSET_DEPTH = 0.1;

    const doorPivot = new THREE.Group();
    doorPivot.position.set(-OFFSET, 0, OFFSET_DEPTH);

    const door = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 1, 0.01),
      new THREE.MeshStandardMaterial({
        map: metalTexure,
      })
    );

    door.position.set(OFFSET, 0, 0.1 - OFFSET_DEPTH);

    doorPivot.add(door);
    this.container.add(doorPivot);
    this.door = doorPivot;
  }

  doorOpen = false;

  onUpdate(deltaTime: number, currentTick: number): void {
    if (Math.random() > 0.99) {
      this.toggleDoor();
    }
  }

  toggleDoor() {
    this.doorOpen = !this.doorOpen;
    this.door.rotation.y = this.doorOpen ? -Math.PI * 0.8 : 0;
  }
}
