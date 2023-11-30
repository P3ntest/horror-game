import { ColliderDesc, RigidBodyDesc } from "@dimforge/rapier3d";
import { Physics, PhysicsEntity } from "./engine/PhysicsEngine";
import * as THREE from "three";
import { Player } from "./Player";
import { Quaternion, Vector } from "./engine/util/vector";
import { Scene } from "./Scene";

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

  playerSawUs: boolean = false;

  onUpdate(deltaTime: number, currentTick: number): void {
    const scene = this.world.requireEntityById("scene") as Scene;

    if (scene.lightsAreOn) {
      this.world.removeEntity(this);
    }

    this.lookAtPlayer();
    const player = this.world.requireEntityById("player") as Player;

    const playerPosition = player.transform.getPosition();
    const thisPosition = this.transform.getPosition();
    const delta = playerPosition.subtract(thisPosition);

    const SPEED = player.difficulty.blackThingsSpeedMultiplier * 3;

    const direction = delta.normalize().scale(SPEED);

    this.body.setLinvel(
      new Vector(direction.x, this.body.linvel().y, direction.z),
      true
    );

    if (delta.length() > 35) {
      this.world.removeEntity(this);
    }

    // check if the player sees us
    // shoot a ray from the player to us
    // check the angle between the ray and the player's forward vector
    // if the angle is small enough, the player sees us

    const horizontalDelta = new Vector(delta.x, 0, delta.z).normalize();

    const ray = new THREE.Raycaster(
      playerPosition.toThree(),
      horizontalDelta.inverse().toThree(),
      0,
      delta.length()
    );

    const intersections = ray.intersectObjects(
      this.world.renderer.scene.children,
      true
    );

    const seesThePlayer = intersections.length <= 1; //account for this entity

    // now check if the player is looking at us

    const playerForward = player.transform.getRotation().forward();
    const playerForwardHorizontal = new Vector(
      playerForward.x,
      0,
      playerForward.z
    ).normalize();
    const requiredForward = delta.normalize().inverse();
    const requiredForwardHorizontal = new Vector(
      requiredForward.x,
      0,
      -requiredForward.z //no idea why this is negative
    ).normalize();

    const dot = playerForwardHorizontal.dot(requiredForwardHorizontal);

    const playersLooksInOurDirection = dot > 0.8;

    const playerSeesUs = seesThePlayer && playersLooksInOurDirection;

    if (playerSeesUs) {
      if (!this.playerSawUs) {
        this.playerSawUs = true;
        const audio = new Audio("assets/scare.wav");
        audio.play();

        const demonNoise = new Audio("assets/demonnoise.wav");
        demonNoise.play();
        this.demonNoise = demonNoise;
      }
    }

    const distanceToPlayer = delta.length();
    const CUTOFF_DISTANCE = 30;
    // adjust volume based on distance, where the closer the player is, the louder the sound.
    if (this.demonNoise) {
      const volume = Math.max(0, 1 - distanceToPlayer / CUTOFF_DISTANCE);
      const logVolume = Math.log(volume + 1);
      // logarithmic volume
      this.demonNoise.volume = volume;

      console.log(volume);
    }

    if (distanceToPlayer < 3.5) {
      player.kill();
    }
  }

  onRemove(): void {
    if (this.demonNoise) {
      this.demonNoise.pause();
    }
  }

  demonNoise: HTMLAudioElement | null = null;
}
