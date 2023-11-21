import { ColliderDesc } from "@dimforge/rapier3d";
import { CharacterEntity } from "./engine/CharacterEntity";
import { Physics, toVector } from "./engine/PhysicsEngine";
import { KeyboardController } from "./engine/util/KeyboardController";
import { Vector } from "./engine/util/vector";
import { Input } from "./engine/util/Input";
import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

export class Player extends CharacterEntity {
  createCollider(): ColliderDesc {
    return Physics.ColliderDesc.capsule(0.5, 0.5);
  }

  controls: PointerLockControls;

  constructor() {
    super();
  }

  keyboardController = new KeyboardController();

  onAdd(): void {
    super.onAdd();
    this.keyboardController.attachTo(document.body);
    this.keyboardController.registerDefaults();

    this.controls = new PointerLockControls(
      this.world.renderer.camera,
      document.body
    );
  }

  onRender(tick: number): void {
    const mouseMovement = Input.instance.flushMouseMovement();

    const mouseSensitivity = 0.001;

    this.transform.setRotation(
      this.transform
        .getRotation()
        .rotate(new Vector(0, 1, 0), -mouseMovement[0] * mouseSensitivity)
    );
    this.camera.rotation.x -= mouseMovement[1] * mouseSensitivity;
  }

  camera: THREE.PerspectiveCamera;
  onInitGraphics(): void {
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    this.world.renderer.camera = camera;

    camera.position.y = 0.8;

    this.container.add(camera);

    this.camera = camera;

    // const testCapsule = new THREE.Mesh(
    //   new THREE.CylinderGeometry(0.5, 0.5, 3),
    //   new THREE.MeshBasicMaterial({ color: 0xff0000 })
    // );

    // this.container.add(testCapsule);
    // testCapsule.position.z = -2;
  }

  onUpdate(deltaTime: number) {
    const horizontal = this.keyboardController.getAxis("Horizontal");
    const vertical = -this.keyboardController.getAxis("Vertical");
    let movement = new Vector(horizontal, 0, vertical).normalize();

    // Rotate movement vector to the player's rotation along the y-axis
    const forward = this.transform.getRotation().forward();

    movement = movement.rotate(new Vector(0, 1, 0), forward.angle());

    const maxSpeed = 5;
    const maxVelocity = movement.scale(maxSpeed);
    const currentVelocity = toVector(this.body.linvel());
    const acceleration = 0.2;
    const velocityDelta = maxVelocity.add(currentVelocity.inverse());
    const velocityChange = velocityDelta.scale(acceleration);
    const newVelocity = currentVelocity.add(velocityChange);

    const newTranslation = newVelocity.scale(deltaTime / 1000);

    // gravity
    newTranslation.y -= (9.8 * deltaTime) / 1000;

    this.desiredTranslation = newTranslation;

    super.onUpdate(deltaTime);
  }
}
