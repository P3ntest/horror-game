import { Sheep } from "./Passive";
import { Player } from "./Player";
import { Scene } from "./Scene";
import { Physics, PhysicsEntity } from "./engine/PhysicsEngine";
import { World } from "./engine/World";
import { Quaternion, Vector } from "./engine/util/vector";
import * as THREE from "three";

export class TestCube extends PhysicsEntity {
  getBodyDesc() {
    return Physics.RigidBodyDesc.dynamic();
  }

  createColliders() {
    return [Physics.ColliderDesc.cuboid(1, 1, 1)];
  }

  onInitGraphics(): void {
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshLambertMaterial({ color: 0xcc2222 });
    const cube = new THREE.Mesh(geometry, material);

    this.container.add(cube);

    // cube.castShadow = true;
  }

  onRender(): void {}

  // onUpdate(deltaTime: number): void {
  //   this.transform.setRotation(
  //     this.transform.getRotation().rotate(new Vector(1, 1, 1), deltaTime / 1000)
  //   );
  // }
}

const world = new World();

// const floor = new TestFloor();
// world.addEntity(floor);
// floor.transform.setPosition(new Vector(0, -5, 0));

const player = new Player();
world.addEntity(player, "player");
player.transform.setPosition(new Vector(0, 10, 0));

const scene = new Scene();
world.addEntity(scene);
scene.transform.setPosition(new Vector(0, -4.5, 0));

const cube = new TestCube();
world.addEntity(cube);

// const sheep = new Sheep();
// world.addEntity(sheep);
// sheep.transform.setPosition(new Vector(500, 500));
