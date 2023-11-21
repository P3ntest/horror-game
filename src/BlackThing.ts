import { ColliderDesc, RigidBodyDesc } from "@dimforge/rapier3d";
import { Physics, PhysicsEntity } from "./engine/PhysicsEngine";
import * as THREE from "three";
import { Player } from "./Player";
import { Quaternion, Vector } from "./engine/util/vector";

const textureLoader = new THREE.TextureLoader();
const blackThingTexture = textureLoader.load("assets/monster.png");

export class BlackThing extends PhysicsEntity {
  createColliders(): ColliderDesc[] {
    return [Physics.ColliderDesc.capsule(0.5, 1.2)];
  }
  getBodyDesc(): RigidBodyDesc {
    return Physics.RigidBodyDesc.dynamic();
  }

  onInitPhysics(): void {
    this.body.lockRotations(true, true);
  }

  onInitGraphics(): void {
    // 2d plane that looks at the camera
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 3.5),
      new THREE.MeshBasicMaterial({
        color: 0x222222,
        transparent: true,
        map: blackThingTexture,
      })
    );

    this.container.add(plane);
  }

  onAdd(): void {
    super.onAdd();
    this.tags.add("blackThing");
  }

  onRender(tick: number): void {
    // this.lookAtPlayer();

    const randX = Math.random() * 0.1 - 0.05;
    const randY = Math.random() * 0.1 - 0.05;

    this.container.children[0].position.set(randX, randY, 0);
  }

  lookAtPlayer(): void {
    const player = this.world.requireEntityById("player") as Player;

    this.transform.lookAt(player.transform.getPosition());
  }

  onUpdate(deltaTime: number, currentTick: number): void {
    this.lookAtPlayer();
    const player = this.world.requireEntityById("player") as Player;

    const playerPosition = player.transform.getPosition();
    const thisPosition = this.transform.getPosition();
    const delta = playerPosition.subtract(thisPosition);

    const direction = delta.normalize().scale(3);

    this.body.setLinvel(
      new Vector(direction.x, this.body.linvel().y, direction.z),
      true
    );

    if (delta.length() > 35) {
      this.world.removeEntity(this);
    }
  }
}
